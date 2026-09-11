import frappe
from frappe.model.document import Document

class AgencyReview(Document):

    def before_insert(self):
        if not self.client:
            frappe.throw("Le client est obligatoire pour déposer un avis.")

        if not frappe.db.exists("User", self.client):
            frappe.throw(f"Le client {self.client} n'existe pas.")

        if not self.agency:
            frappe.throw("L'agence est obligatoire pour déposer un avis.")

        if not frappe.db.exists("AgencyProfile", self.agency):
            frappe.throw(f"L'agence {self.agency} n'existe pas.")

        if not self.project:
            frappe.throw("Un projet doit être associé à l'avis.")

        if not frappe.db.exists("Project", self.project):
            frappe.throw(f"Le projet {self.project} n'existe pas.")

        project_status = frappe.db.get_value("Project", self.project, "status")
        if project_status != "Completed":
            frappe.throw("Un avis ne peut être déposé que sur un projet au statut Completed.")

        project_client = frappe.db.get_value("Project", self.project, "client")
        project_client_user = (
            frappe.db.get_value("ClientProfile", project_client, "user") if project_client else None
        )
        if not project_client_user or project_client_user != self.client:
            frappe.throw("Seul le client propriétaire du projet peut déposer cet avis.")

        if self.rating is None:
            frappe.throw("La note est obligatoire.")

        if self.rating < 1 or self.rating > 5:
            frappe.throw("La note doit être comprise entre 1 et 5.")

        existing = frappe.db.exists("AgencyReview", {
            "project": self.project,
            "client": self.client,
            "name": ["!=", self.name or ""]
        })
        if existing:
            frappe.throw("Un avis a déjà été déposé pour ce projet par ce client.")

    def on_submit(self):
        self._recalculate_agency_rating()

    def on_update(self):
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        if self.status == "Approved" and old_status != "Approved":
            if not self.is_verified:
                frappe.db.set_value(self.doctype, self.name, "is_verified", 1)
            self._recalculate_agency_rating()

        elif self.status == "Rejected" and old_status == "Approved":
            self._recalculate_agency_rating()

    def _recalculate_agency_rating(self):
        reviews = frappe.get_all(
            "AgencyReview",
            filters={"agency": self.agency, "status": "Approved"},
            fields=["rating"]
        )

        if not reviews:
            frappe.db.set_value("AgencyProfile", self.agency, "rating", 0)
            frappe.db.set_value("AgencyProfile", self.agency, "reviews_count", 0)
            return

        total_ratings = sum(r.rating or 0 for r in reviews)
        average = total_ratings / len(reviews)

        frappe.db.set_value("AgencyProfile", self.agency, "rating", round(average, 1))
        frappe.db.set_value("AgencyProfile", self.agency, "reviews_count", len(reviews))
