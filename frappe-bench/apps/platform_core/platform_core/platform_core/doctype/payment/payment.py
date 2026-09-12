import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

class Payment(Document):

    def validate(self):
        if not self.amount or self.amount <= 0:
            frappe.throw("Le montant du paiement doit être supérieur à 0.")

        if not self.invoice:
            frappe.throw("Une facture doit être associée au paiement.")

        invoice_status = frappe.db.get_value("Invoice", self.invoice, "status")
        if invoice_status != "Pending":
            frappe.throw("La facture associée doit être au statut Pending.")

        invoice_due = frappe.db.get_value("Invoice", self.invoice, "amount_due") or 0
        if self.amount > invoice_due:
            frappe.throw(
                f"Le montant payé ({self.amount}) dépasse le montant dû ({invoice_due})."
            )

        invoice_agency = frappe.db.get_value("Invoice", self.invoice, "agency")
        if self.agency and self.agency != invoice_agency:
            frappe.throw(
                "L'agence du paiement ne correspond pas à l'agence de la facture."
            )

    def after_insert(self):
        invoice_due = frappe.db.get_value("Invoice", self.invoice, "amount_due") or 0
        remaining = invoice_due - self.amount

        if remaining <= 0:
            frappe.db.set_value("Invoice", self.invoice, "status", "Paid")
            frappe.db.set_value("Invoice", self.invoice, "payment_date", nowdate())
            frappe.db.set_value("Invoice", self.invoice, "amount_due", 0)
        else:
            frappe.db.set_value("Invoice", self.invoice, "amount_due", remaining)

        frappe.db.set_value(self.doctype, self.name, "payment_date", nowdate())
