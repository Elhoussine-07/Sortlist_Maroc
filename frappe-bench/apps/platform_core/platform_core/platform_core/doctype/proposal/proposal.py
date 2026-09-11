from datetime import timedelta

import frappe
from frappe.model.document import Document
from frappe.utils import now, now_datetime

class Proposal(Document):

    def validate(self):
        if not self.amount or self.amount <= 0:
            frappe.throw("Le montant de l'offre doit être supérieur à 0.")
        self._prevent_duplicate_active_proposal()

        if self.is_new():
            self._validate_new_proposal()
            self.submitted_date = now()
            self._set_response_deadline()

    def _validate_new_proposal(self):
        user_roles = frappe.get_roles(frappe.session.user)
        if "Agency" not in user_roles and "Administrator" not in user_roles:
            frappe.throw("Seules les Agences et Administrateurs peuvent soumettre une offre.")

        project_status = frappe.db.get_value("Project", self.project, "status")
        if project_status != "Posted":
            frappe.throw("Le projet doit être au statut Posted pour envoyer une offre.")

    def _prevent_duplicate_active_proposal(self):
        existing = frappe.get_all(
            "Proposal",
            filters={
                "project": self.project,
                "agency": self.agency,
                "status": ["in", ["Sent", "Accepted"]],
                "name": ["!=", self.name or ""],
            },
            limit=1,
        )
        if existing:
            frappe.throw("Une offre Sent ou Accepted existe déjà pour ce projet et cette agence.")

    def _set_response_deadline(self):
        quote_response_hours = (
            frappe.db.get_single_value("PlatformSettings", "quote_response_hours") or 48
        )
        self.response_deadline = now_datetime() + timedelta(hours=quote_response_hours)

    def after_insert(self):
        self._update_opportunity(status="Devis envoyé")
        self._notify_client()

    def accept(self):
        self.status = "Accepted"
        self.decision_date = frappe.utils.now()
        self.save(ignore_permissions=True)
        return self

    def refuse(self, message=None):
        self.status = "Refused"
        self.decision_date = frappe.utils.now()
        self.flags.refusal_message = message
        self.save(ignore_permissions=True)
        return self

    def on_cancel(self):
        self._update_opportunity(status="Archivée", archive_reason="Devis annulé")

    def _update_opportunity(self, status, archive_reason=None):
        opportunity_name = self.opportunity or frappe.db.get_value(
            "Opportunity", {"project": self.project, "agency": self.agency}, "name"
        )
        if not opportunity_name:
            return
        opp_doc = frappe.get_doc("Opportunity", opportunity_name)
        opp_doc.status = status
        if archive_reason:
            opp_doc.archive_reason = archive_reason
        opp_doc.save(ignore_permissions=True)

    def _notify_client(self):
        client = frappe.db.get_value("Project", self.project, "client")
        if not client:
            return

        client_user = frappe.db.get_value("ClientProfile", client, "user")
        if not client_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": client_user,
                "category": "Proposal",
                "title": "Nouveau devis reçu",
                "body": f"Un devis de {self.amount} a été envoyé pour votre projet.",
                "reference_doctype": "Proposal",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

    def on_update(self):
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        if self.status == "Accepted" and old_status != "Accepted":
            self._handle_acceptance()

        elif self.status == "Refused" and old_status != "Refused":
            self._handle_refusal()

    def _handle_acceptance(self):
        self._update_opportunity(status="Gagnée")

        frappe.db.set_value(self.doctype, self.name, "decision_date", now())

        self._notify_agency("Offre acceptée", f"Votre offre pour le projet a été acceptée.")

        self._create_invoice()

    def _handle_refusal(self):
        opportunity_name = self.opportunity or frappe.db.get_value(
            "Opportunity", {"project": self.project, "agency": self.agency}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "Acceptée")
            from platform_core.platform_core.doctype.opportunity.opportunity import (
                recompute_project_status,
            )
            recompute_project_status(self.project)

        frappe.db.set_value(self.doctype, self.name, "decision_date", now())

        feedback = self.flags.refusal_message
        body = "Le client a refusé votre devis"
        body += f" : « {feedback} »" if feedback else "."
        body += " Vous pouvez lui envoyer un nouveau devis ajusté."
        self._notify_agency("Devis refusé — vous pouvez renégocier", body)

    def _notify_agency(self, title, message):
        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(self.agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Proposal",
                "title": title,
                "body": message,
                "reference_doctype": "Proposal",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

    def _create_invoice(self):
        project = frappe.get_doc("Project", self.project)

        commission_rate = frappe.db.get_single_value("PlatformSettings", "commission_rate") or 10

        frappe.get_doc(
            {
                "doctype": "Invoice",
                "agency": self.agency,
                "project": self.project,
                "proposal": self.name,
                "amount": self.amount,
                "commission_rate": commission_rate,
                "status": "Pending",
                "issue_date": frappe.utils.nowdate(),
                "due_date": frappe.utils.add_days(frappe.utils.nowdate(), 7),
            }
        ).insert(ignore_permissions=True)

def send_quote(opportunity, amount, description=None, devis_file=None):
    opp = frappe.get_doc("Opportunity", opportunity)
    doc = frappe.get_doc({
        "doctype": "Proposal",
        "opportunity": opp.name,
        "project": opp.project,
        "agency": opp.agency,
        "amount": amount,
        "description": description,
        "devis_file": devis_file,
    })
    doc.insert(ignore_permissions=True)
    return doc
