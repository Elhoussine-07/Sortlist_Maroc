import frappe
from frappe.model.document import Document
from frappe.utils import add_days, nowdate

class Invoice(Document):

    def validate(self):
        self.commission_amount = (self.amount or 0) * ((self.commission_rate or 0) / 100)
        self.total = self.commission_amount + (self.tax or 0)
        self.amount_due = self.total - (self.credit_applied or 0)

        if self.amount_due < 0:
            frappe.throw("Le montant net dû ne peut pas être négatif.")

        if self.commission_rate and self.commission_rate < 0:
            frappe.throw("Le taux de commission ne peut pas être négatif.")

        if self.amount and self.amount <= 0:
            frappe.throw("Le montant de la facture doit être supérieur à 0.")

    def before_insert(self):
        self.invoice_number = self._generate_invoice_number()
        self.issue_date = nowdate()

        invoice_due_days = frappe.db.get_single_value("PlatformSettings", "invoice_due_days") or 7
        self.due_date = add_days(self.issue_date, invoice_due_days)

        if not self.status:
            self.status = "Pending"

    def after_insert(self):
        self._apply_commission_credits()

    def _apply_commission_credits(self):
        from platform_core.platform_core.doctype.commissioncredit.commissioncredit import (
            apply_available_credits,
        )

        ceiling = min(self.commission_amount or 0, self.amount_due or 0)
        if ceiling <= 0:
            return

        applied = apply_available_credits(self.agency, self.name, ceiling)
        if not applied:
            return

        frappe.db.set_value(self.doctype, self.name, {
            "credit_applied": (self.credit_applied or 0) + applied,
            "amount_due": (self.amount_due or 0) - applied,
        })
        self.reload()

        self._notify_agency(
            title="Crédit de commission appliqué",
            message=(
                f"Un crédit de commission de {applied} a été automatiquement appliqué "
                f"à la facture {self.invoice_number}."
            ),
        )

    def mark_paid(self, payment_method=None):
        self.status = "Paid"
        self.payment_date = nowdate()
        self.save(ignore_permissions=True)
        return self

    def _generate_invoice_number(self):
        year = nowdate()[:4]
        count = frappe.db.count("Invoice", filters={"invoice_number": ["like", f"INV-{year}-%"]})
        return f"INV-{year}-{count + 1:05d}"

    def on_update(self):
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        if self.status == "Paid" and old_status != "Paid":
            self._handle_payment()

        elif self.status == "Overdue" and old_status != "Overdue":
            self._handle_overdue()

        elif self.status == "Cancelled" and old_status != "Cancelled":
            self._handle_cancellation()

    def _handle_payment(self):
        frappe.db.set_value(self.doctype, self.name, "payment_date", nowdate())

        self._update_associated_payment()

    def _handle_overdue(self):
        self._notify_agency(
            title="Facture en retard",
            message=f"La facture {self.invoice_number} est en retard de paiement."
        )

    def _handle_cancellation(self):
        pass

    def _update_associated_payment(self):
        payment = frappe.get_all("Payment", filters={"invoice": self.name}, limit=1)
        if payment:
            frappe.db.set_value("Payment", payment[0].name, "status", "Completed")
            frappe.db.set_value("Payment", payment[0].name, "payment_date", nowdate())

    def _notify_agency(self, title, message):
        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(self.agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Invoice",
                "title": title,
                "body": message,
                "reference_doctype": "Invoice",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)
