# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, nowdate


class CommissionCredit(Document):
	"""Crédit de commission (CDC §2.5.2) : créé quand un litige « client
	inactif » est jugé fondé en faveur de l'agence (cf.
	ProjectSuspension._credit_agency_commission). `consume()` est appelé
	automatiquement par Invoice.after_insert() sur la prochaine facture de
	l'agence (§2.5.2 « Application du crédit »)."""

	def validate(self):
		if self.balance is None:
			self.balance = flt(self.amount) - flt(self.consumed_amount)
		if self.balance < 0:
			frappe.throw("Le solde d'un crédit de commission ne peut pas être négatif.")

	def consume(self, amount, invoice):
		"""Applique jusqu'à `amount` du solde disponible à `invoice`. Retourne
		le montant effectivement consommé (peut être < amount si le solde est
		insuffisant)."""
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
	"""Liste les CommissionCredit à solde positif pour une agence, du plus
	ancien au plus récent (consommation FIFO)."""
	return frappe.get_all(
		"CommissionCredit",
		filters={"agency": agency, "balance": [">", 0]},
		fields=["name", "balance"],
		order_by="creation asc",
	)


def apply_available_credits(agency, invoice, max_amount):
	"""Consomme les crédits de commission disponibles de `agency`, dans la
	limite de `max_amount`, sur `invoice`. Retourne le montant total appliqué
	(CDC §2.5.2 : « Le crédit est automatiquement déduit de la commission due
	sur la prochaine opportunité Gagnée »)."""
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
