
import frappe
from frappe.model.document import Document
from frappe.utils import flt, nowdate

class CommissionCredit(Document):

	def validate(self):
		if self.balance is None:
			self.balance = flt(self.amount) - flt(self.consumed_amount)
		if self.balance < 0:
			frappe.throw("Le solde d'un crédit de commission ne peut pas être négatif.")

	def consume(self, amount, invoice):
		amount = flt(amount)
		available = flt(self.balance)
		used = min(amount, available)
		if used <= 0:
			return 0

		self.consumed_amount = flt(self.consumed_amount) + used
		self.balance = flt(self.amount) - flt(self.consumed_amount)
		self.append("applications", {
			"invoice": invoice,
			"amount": used,
			"application_date": nowdate(),
		})
		self.save(ignore_permissions=True)
		return used

def get_available_credits(agency):
	return frappe.get_all(
		"CommissionCredit",
		filters={"agency": agency, "balance": [">", 0]},
		fields=["name", "balance"],
		order_by="creation asc",
	)

def apply_available_credits(agency, invoice, max_amount):
	remaining = flt(max_amount)
	total_applied = 0.0

	if remaining <= 0:
		return 0

	for credit in get_available_credits(agency):
		if remaining <= 0:
			break
		credit_doc = frappe.get_doc("CommissionCredit", credit.name)
		applied = credit_doc.consume(remaining, invoice)
		total_applied += applied
		remaining -= applied

	return total_applied
