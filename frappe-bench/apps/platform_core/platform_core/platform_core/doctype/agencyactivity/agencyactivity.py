import frappe
from frappe.model.document import Document
from frappe.utils import now

class AgencyActivity(Document):

    def before_insert(self):
        if not self.created_date:
            self.created_date = now()

        self._validate_relations()

        self._validate_data()

    def _validate_relations(self):
        if self.client:
            if not frappe.db.exists("ClientProfile", self.client):
                frappe.throw(f"Le client {self.client} n'existe pas.")

        if self.agency:
            if not frappe.db.exists("AgencyProfile", self.agency):
                frappe.throw(f"L'agence {self.agency} n'existe pas.")

    def _validate_data(self):
        valid_events = ["Profile View", "Website Click", "Search Impression"]
        if self.event_type and self.event_type not in valid_events:
            frappe.throw(f"Type d'événement invalide: {self.event_type}")

        if self.time_spent and self.time_spent < 0:
            frappe.throw("Le temps passé ne peut pas être négatif.")

    def on_update(self):
        pass
