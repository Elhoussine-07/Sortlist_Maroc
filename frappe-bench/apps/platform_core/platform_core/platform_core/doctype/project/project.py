import frappe
from frappe.model.document import Document

class Project(Document):

    def validate(self):
        if self.budget_min and self.budget_max and self.budget_min > self.budget_max:
            frappe.throw("Le budget minimum ne peut pas être supérieur au budget maximum.")

        if self.delivery_delay_days is not None and self.delivery_delay_days <= 0:
            frappe.throw("Le délai de réalisation doit être un nombre de jours positif.")

    def _increment_client_projects_published_count(self):
        if not self.client:
            return
        current = frappe.db.get_value("ClientProfile", self.client, "projects_published_count") or 0
        frappe.db.set_value("ClientProfile", self.client, "projects_published_count", current + 1)

    def on_update(self):
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        if self.status == "Posted" and old_status != "Posted":
            self._increment_client_projects_published_count()

        if self.status == "Completed" and old_status != "Completed":
            self._notify_client(
                title="Projet terminé",
                message=f"Le projet « {self.title} » est passé au statut Terminé. "
                "Vous pouvez désormais laisser un avis à l'agence depuis Collaborations.",
            )
            self._notify_agency(
                title="Projet terminé",
                message=f"Le projet « {self.title} » est passé au statut Terminé. "
                "Vous pouvez désormais laisser un avis au client.",
            )

        elif self.status == "Awaiting" and old_status != "Awaiting":
            self._notify_client(
                title="Devis en attente de réponse",
                message=f"Un devis a été envoyé pour le projet « {self.title} ». "
                "Vous disposez de 48h pour répondre.",
            )

        elif self.status == "In Progress" and old_status != "In Progress":
            start_date = frappe.utils.now()
            frappe.db.set_value("Project", self.name, "start_date", start_date)
            frappe.db.set_value("Project", self.name, "cdc_locked", 1)

            if self.delivery_delay_days:
                expected_end_date = frappe.utils.add_days(start_date, self.delivery_delay_days)
                frappe.db.set_value(
                    "Project", self.name,
                    {"initial_end_date": expected_end_date, "expected_end_date": expected_end_date},
                )

        elif self.status == "Suspended" and old_status != "Suspended":
            self._notify_agency(
                title="Projet suspendu",
                message=f"Le projet « {self.title} » est passé au statut Suspendu.",
            )

        elif self.status == "Rejected" and old_status != "Rejected":
            self._notify_client(
                title="Projet rejeté",
                message=f"Le projet « {self.title} » a été rejeté.",
            )

    def repost(self, include_previously_declined=False):
        self.status = "Posted"
        self.repost_count = (self.repost_count or 0) + 1

        if not include_previously_declined:
            declined_agencies = frappe.get_all(
                "Opportunity",
                filters={"project": self.name, "status": "Archivée", "archive_reason": "Refus agence"},
                pluck="agency",
            )
            if declined_agencies:
                self.shortlist_ia = frappe.as_json({"excluded_agencies": declined_agencies})

        self.save(ignore_permissions=True)
        return self

    def reject(self, substatus):
        self.status = "Rejected"
        self.rejection_substatus = substatus
        self.save(ignore_permissions=True)
        return self

    def complete(self):
        unpaid_invoice = frappe.get_all(
            "Invoice",
            filters={"project": self.name, "status": ["in", ["Pending", "Overdue"]]},
            limit=1,
            pluck="name",
        )
        if unpaid_invoice:
            from platform_core.platform_core.doctype.projectsuspension.projectsuspension import (
                suspend_for_unpaid_invoice,
            )

            invoice_doc = frappe.get_doc("Invoice", unpaid_invoice[0])
            if invoice_doc.status != "Overdue":
                invoice_doc.status = "Overdue"
                invoice_doc.save(ignore_permissions=True)
            suspend_for_unpaid_invoice(invoice_doc)
            return self

        self.status = "Completed"
        self.save(ignore_permissions=True)
        return self

    def _notify_client(self, title, message):
        if not self.client:
            return
        client_user = frappe.db.get_value("ClientProfile", self.client, "user")
        if not client_user:
            return
        self._create_notification(client_user, "Project", title, message)

    def _notify_agency(self, title, message):
        opportunity = frappe.get_all(
            "Opportunity", filters={"project": self.name, "status": "Gagnée"}, limit=1, fields=["agency"]
        )
        if not opportunity:
            return
        agency_members = frappe.get_all(
            "AgencyMember", filters={"agency": opportunity[0].agency, "status": "Active"}, fields=["user"]
        )
        for member in agency_members:
            self._create_notification(member.user, "Project", title, message)

    def get_cdc_context(self):
        client = frappe.get_doc("ClientProfile", self.client)
        client_email = frappe.db.get_value("User", client.user, "email") if client.user else None

        return {
            "project": self,
            "client": client,
            "client_email": client_email,
            "generated_at": frappe.utils.now_datetime().strftime("%d/%m/%Y à %H:%M"),
            "description_text": frappe.utils.strip_html(self.description or ""),
            "deliverables_text": self.deliverables or "",
            "exclusions_text": self.exclusions or "",
            "deadlines_text": self.deadlines or "",
        }

    def _create_notification(self, user, ntype, title, message):
        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": user,
                "category": ntype,
                "title": title,
                "body": message,
                "reference_doctype": "Project",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)
