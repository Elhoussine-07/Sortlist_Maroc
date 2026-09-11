
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

class ProjectPayment(Document):

    def validate(self):
        if not self.amount or self.amount <= 0:
            frappe.throw("Le montant du paiement doit être supérieur à 0.")

    def before_insert(self):
        self.payment_date = nowdate()
        if not self.status:
            self.status = "Completed"
        self.transaction_id = frappe.generate_hash(length=16)

    def after_insert(self):
        if self.status == "Completed":
            frappe.db.set_value("Project", self.project, "payment_status", "Payé")
            self._notify_agency()

    def _notify_agency(self):
        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(self.agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Autre",
                "title": "Paiement reçu du client",
                "body": f"Le client a réglé {self.amount} pour le projet.",
                "reference_doctype": "ProjectPayment",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)
