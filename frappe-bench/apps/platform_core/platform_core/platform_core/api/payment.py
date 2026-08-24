# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Facturation (cf. §2.5) : enregistrement du moyen de paiement, règlement en
un clic. `stripe_webhook` est 🔒 interne (signature Stripe, pas de JWT)."""

import os

import frappe
from frappe import _

from platform_core.platform_core.auth import require_active_agency, require_body_arg


def _stripe_configured():
	return bool(frappe.conf.get("stripe_secret_key") or os.environ.get("STRIPE_SECRET_KEY"))


@frappe.whitelist()
def list_invoices(status=None):
	claims = require_active_agency()
	filters = {"agency": claims["agency_id"]}
	if status:
		filters["status"] = status
	return frappe.get_all(
		"Invoice",
		filters=filters,
		fields=["name", "invoice_number", "project", "amount", "commission_amount", "credit_applied",
		        "amount_due", "status", "issue_date", "due_date", "payment_deadline"],
		order_by="issue_date desc",
	)


@frappe.whitelist()
def list_commission_credits():
	"""Crédits de commission de l'agence (CDC §2.5.2) : origine, montant
	initial, montant consommé, solde restant — appliqués automatiquement sur
	les prochaines factures par Invoice.after_insert()."""
	claims = require_active_agency()
	return frappe.get_all(
		"CommissionCredit",
		filters={"agency": claims["agency_id"]},
		fields=["name", "source_dispute", "source_project", "amount", "consumed_amount", "balance", "creation"],
		order_by="creation desc",
	)


@frappe.whitelist()
def list_payment_methods():
	"""Espace dédié « moyen de paiement / compte bancaire » (CDC §2.5.1) —
	jusqu'ici il n'existait aucun moyen de lister ce que `register_payment_method`
	avait enregistré : l'agence n'avait aucune visibilité sur son moyen de
	paiement par défaut. Le plus récent `is_default` apparaît en premier."""
	claims = require_active_agency()
	return frappe.get_all(
		"PaymentMethod",
		filters={"agency": claims["agency_id"]},
		fields=["name", "method_type", "label", "is_default", "auto_debit_enabled", "creation"],
		order_by="is_default desc, creation desc",
	)


@frappe.whitelist()
def register_payment_method(method_type=None, provider_token=None, label=None, is_default=1, auto_debit_enabled=0):
	method_type = require_body_arg(method_type, "method_type", _("Type de moyen de paiement manquant"))
	provider_token = require_body_arg(provider_token, "provider_token", _("Jeton du fournisseur manquant"))
	claims = require_active_agency()

	if int(is_default):
		for existing in frappe.get_all("PaymentMethod", filters={"agency": claims["agency_id"], "is_default": 1}):
			frappe.db.set_value("PaymentMethod", existing.name, "is_default", 0)

	doc = frappe.get_doc({
		"doctype": "PaymentMethod",
		"agency": claims["agency_id"],
		"method_type": method_type,
		"provider_token": provider_token,
		"label": label,
		"is_default": is_default,
		"auto_debit_enabled": auto_debit_enabled,
	})
	doc.insert(ignore_permissions=True)
	return {"name": doc.name}


def _charge_invoice(invoice_doc, agency):
	"""Cœur du règlement, partagé par `pay_invoice` (déclenché manuellement
	par l'agence) et le débit automatique déclenché à l'acceptation d'un
	devis par le client (cf. `Proposal._create_invoice`, CDC §2.5.1 : « le
	paiement doit se faire automatiquement », pas de facture à régler
	manuellement). Sans clé Stripe configurée, le règlement est simulé
	(provider="stub") pour rester fonctionnel en environnement de
	développement — cf. docs/INTEGRATION.md §9.

	Renvoie `None` (sans rien faire) si l'agence n'a pas encore de moyen de
	paiement par défaut enregistré (cf. `register_payment_method`) — la
	facture reste alors "Pending", réglable manuellement plus tard via
	`pay_invoice` une fois un moyen de paiement configuré."""
	if invoice_doc.status == "Paid":
		return None

	method_name = frappe.db.get_value("PaymentMethod", {"agency": agency, "is_default": 1})
	if not method_name:
		return None

	provider = "stub"
	if _stripe_configured():
		# Point d'extension : intégrer un vrai PaymentIntent Stripe ici avec le
		# provider_token stocké sur PaymentMethod.
		provider = "stripe"

	payment = frappe.get_doc({
		"doctype": "Payment",
		"invoice": invoice_doc.name,
		"agency": agency,
		"payment_method_ref": method_name,
		"amount": invoice_doc.amount_due,
		"payment_method": "Card",
		"payment_date": frappe.utils.today(),
		"transaction_id": frappe.generate_hash(length=16),
		"status": "Completed",
	})
	payment.insert(ignore_permissions=True)
	invoice_doc.mark_paid()

	# AJOUTÉ (demande explicite) : si le projet avait été suspendu
	# automatiquement faute de règlement dans les temps (cf.
	# ProjectSuspension.suspend_for_unpaid_invoice /
	# tasks.suspend_projects_for_unpaid_commission), le règlement — manuel
	# via pay_invoice ou automatique ici même — doit immédiatement lever
	# cette suspension.
	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import (
		resume_after_invoice_paid,
	)

	resume_after_invoice_paid(invoice_doc)

	return {"payment": payment.name, "provider": provider, "status": "Completed"}


@frappe.whitelist()
def download_invoice_pdf(invoice=None):
	"""Téléchargement PDF d'une facture (CDC §2.5.1). BUG CORRIGÉ : le
	frontend appelait auparavant directement l'utilitaire Frappe natif
	`frappe.utils.print_format.download_pdf?doctype=Invoice&name=...` — cette
	vue lit `doctype`/`name` depuis `frappe.form_dict`, qui arrive vide sur
	cette installation (même défaut que documenté ailleurs, cf.
	`auth.get_body_arg`), ce qui plantait systématiquement avec
	`TypeError: download_pdf() missing 2 required positional arguments`.
	Même correctif que `project.download_cdc`/`download_devis` : un point
	d'entrée applicatif qui résout l'argument via `require_body_arg`, puis
	appelle la génération PDF native directement avec les arguments déjà
	résolus (en contournant sa dépendance cassée à `frappe.form_dict`)."""
	invoice = require_body_arg(invoice, "invoice", _("Facture manquante"))
	claims = require_active_agency()
	doc = frappe.get_doc("Invoice", invoice)
	if doc.agency != claims["agency_id"]:
		frappe.throw(_("Accès non autorisé"), frappe.PermissionError)

	from frappe.utils.print_format import download_pdf

	download_pdf(doctype="Invoice", name=invoice)


@frappe.whitelist()
def pay_invoice(invoice=None):
	"""Règlement manuel en un clic (repli si le débit automatique n'a pas pu
	avoir lieu à l'acceptation du devis, faute de moyen de paiement par
	défaut à ce moment-là — cf. `_charge_invoice`)."""
	invoice = require_body_arg(invoice, "invoice", _("Facture manquante"))
	claims = require_active_agency()
	doc = frappe.get_doc("Invoice", invoice)
	if doc.agency != claims["agency_id"]:
		frappe.throw(_("Accès non autorisé"), frappe.PermissionError)
	if doc.status == "Paid":
		frappe.throw(_("Cette facture est déjà payée"))

	result = _charge_invoice(doc, claims["agency_id"])
	if result is None:
		frappe.throw(_("Aucun moyen de paiement par défaut n'est configuré. Ajoutez-en un dans Paramètres > Facturation."))
	return result


@frappe.whitelist(allow_guest=True)
def stripe_webhook():
	"""🔒 Interne — vérifie la signature Stripe plutôt qu'un JWT ou un jeton
	de service (cf. docs/INTEGRATION.md §4)."""
	webhook_secret = frappe.conf.get("stripe_webhook_secret") or os.environ.get("STRIPE_WEBHOOK_SECRET")
	signature = frappe.get_request_header("Stripe-Signature")

	if webhook_secret:
		if not signature:
			frappe.throw("Signature Stripe manquante", frappe.AuthenticationError)
		import stripe

		try:
			event = stripe.Webhook.construct_event(frappe.request.data, signature, webhook_secret)
		except Exception:
			frappe.throw("Signature Stripe invalide", frappe.AuthenticationError)
	else:
		event = frappe.parse_json(frappe.request.data)

	event_type = event.get("type") if isinstance(event, dict) else event["type"]
	frappe.logger().info(f"Stripe webhook received: {event_type}")
	return {"received": True}
