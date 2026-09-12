import frappe
from frappe.model.document import Document
from frappe.utils import now

class Notification(Document):

    def before_insert(self):
        self.is_read = 0
        self.is_archived = 0
        self.read_on = None
        self.archived_date = None
        self._validate_data()

    def _validate_data(self):
        if not self.recipient:
            frappe.throw("Le destinataire de la notification est obligatoire.")

        if not self.title:
            frappe.throw("Le titre de la notification est obligatoire.")

        if not self.category:
            frappe.throw("La catégorie de la notification est obligatoire.")

        if self.reference_doctype and self.reference_name:
            if not frappe.db.exists(self.reference_doctype, self.reference_name):
                frappe.throw(
                    f"Le document de référence {self.reference_doctype}/{self.reference_name} n'existe pas."
                )

    def mark_read(self):
        if not self.is_read:
            self.is_read = 1
            self.read_on = now()
            self.is_archived = 1
            self.archived_date = now()
            self.save(ignore_permissions=True)
        return self

def mark_all_read(recipient, agency_context=None):
    filters = {"recipient": recipient, "is_read": 0}
    if agency_context:
        filters["agency_context"] = agency_context
    names = frappe.get_all("Notification", filters=filters, pluck="name")
    for name in names:
        frappe.get_doc("Notification", name).mark_read()
    return len(names)
