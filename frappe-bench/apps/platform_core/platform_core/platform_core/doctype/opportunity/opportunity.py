import frappe
from frappe.model.document import Document
from frappe.utils import now

class Opportunity(Document):

    def before_insert(self):
        if not self.project or not self.agency:
            frappe.throw("Une opportunité doit être rattachée à un projet et à une agence.")

        if not frappe.db.exists("Project", self.project):
            frappe.throw(f"Le projet {self.project} n'existe pas.")

        if not frappe.db.exists("AgencyProfile", self.agency):
            frappe.throw(f"L'agence {self.agency} n'existe pas.")

        self._prevent_duplicate_opportunity()

        if not self.status:
            self.status = "Reçue"

        if not self.source:
            self._infer_source_from_project_channel()

    def _prevent_duplicate_opportunity(self):
        existing = frappe.get_all(
            "Opportunity",
            filters={
                "project": self.project,
                "agency": self.agency,
                "status": ["!=", "Archivée"],
            },
            limit=1,
        )
        if existing:
            frappe.throw("Une opportunité active existe déjà pour ce projet et cette agence.")

    def _infer_source_from_project_channel(self):
        channel = frappe.db.get_value("Project", self.project, "channel")
        mapping = {
            "Smart Briefing": "Shortlist IA",
            "Unicast": "Unicast",
            "Multicast": "Multicast",
        }
        if channel in mapping:
            self.source = mapping[channel]

    def on_update(self):
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        if self.status == "Gagnée" and old_status != "Gagnée":
            self._handle_won()

        elif self.status == "Archivée" and old_status != "Archivée":
            self._handle_archiving(old_status)

        elif self.status == "Acceptée" and old_status != "Acceptée":
            self._handle_accepted()

        elif self.status == "Devis envoyé" and old_status != "Devis envoyé":
            recompute_project_status(self.project)

    def _handle_won(self):
        if not self.accepted_on:
            frappe.db.set_value(self.doctype, self.name, "accepted_on", now())

        start_date = now()

        frappe.db.set_value("Project", self.project, "status", "In Progress")

        frappe.db.set_value("Project", self.project, "start_date", start_date)

        frappe.db.set_value("Project", self.project, "cdc_locked", 1)

        delivery_delay_days = frappe.db.get_value("Project", self.project, "delivery_delay_days")
        if delivery_delay_days:
            expected_end_date = frappe.utils.add_days(start_date, delivery_delay_days)
            frappe.db.set_value(
                "Project", self.project,
                {"initial_end_date": expected_end_date, "expected_end_date": expected_end_date},
            )

        self._notify_agency(
            title="Opportunité gagnée",
            message=f"Félicitations ! Vous avez remporté le projet."
        )

        self._close_other_relations()

    def _close_other_relations(self):
        others = frappe.get_all(
            "Opportunity",
            filters={
                "project": self.project,
                "name": ["!=", self.name],
                "status": ["not in", ["Gagnée", "Archivée", "Terminée"]],
            },
            pluck="name",
        )
        for other_name in others:
            other = frappe.get_doc("Opportunity", other_name)
            other.archive("Perdue — projet attribué ailleurs")

    def _handle_accepted(self):
        if not self.accepted_on:
            frappe.db.set_value(self.doctype, self.name, "accepted_on", now())

        self._notify_client(
            title="Offre acceptée par l'agence",
            message="L'agence a accepté votre projet et prépare un devis."
        )

    def _handle_archiving(self, old_status=None):
        if not self.archived_on:
            frappe.db.set_value(self.doctype, self.name, "archived_on", now())

        if not self.archive_reason:
            frappe.throw("Un motif d'archivage (archive_reason) est requis pour une opportunité Archivée.")

        if old_status == "Gagnée":
            frappe.db.set_value("Project", self.project, "status", "Rejected")
            return

        recompute_project_status(self.project)

    def accept(self):
        self.status = "Acceptée"
        self.save(ignore_permissions=True)
        return self

    def decline(self, reason="Refus agence"):
        self.status = "Archivée"
        self.archive_reason = reason
        self.save(ignore_permissions=True)
        return self

    def cancel_acceptance(self):
        if self.status != "Acceptée":
            frappe.throw("Seule une opportunité Acceptée peut voir son acceptation annulée.")
        if frappe.db.exists("Proposal", {"opportunity": self.name}):
            frappe.throw("Un devis a déjà été envoyé pour cette opportunité : impossible d'annuler l'acceptation.")
        self.status = "Reçue"
        self.save(ignore_permissions=True)
        return self

    def mark_completed(self):
        self.status = "Terminée"
        self.save(ignore_permissions=True)
        return self

    def archive(self, reason):
        self.status = "Archivée"
        self.archive_reason = reason
        self.save(ignore_permissions=True)
        return self

    def _notify_agency(self, title, message):
        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(self.agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Opportunity",
                "title": title,
                "body": message,
                "reference_doctype": "Opportunity",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

    def _notify_client(self, title, message):
        project = frappe.get_doc("Project", self.project)
        if not project.client:
            return

        client_user = frappe.db.get_value("ClientProfile", project.client, "user")
        if not client_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": client_user,
                "category": "Opportunity",
                "title": title,
                "body": message,
                "reference_doctype": "Opportunity",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

def create_from_project(project, agency, source=None, matching_score=None):
    doc = frappe.get_doc({
        "doctype": "Opportunity",
        "project": project,
        "agency": agency,
        "source": source,
    })
    if matching_score is not None:
        doc.matching_score = matching_score
    doc.insert(ignore_permissions=True)
    return doc

def recompute_project_status(project):
    current_status = frappe.db.get_value("Project", project, "status")
    if current_status not in ("Posted", "Awaiting"):
        return

    rows = frappe.get_all("Opportunity", filters={"project": project}, fields=["status", "source"])
    if not rows:
        return

    statuses = [row.status for row in rows]

    if "Gagnée" in statuses:
        return

    if "Devis envoyé" in statuses:
        if current_status != "Awaiting":
            frappe.db.set_value("Project", project, "status", "Awaiting")
        return

    if current_status != "Posted":
        frappe.db.set_value("Project", project, "status", "Posted")
