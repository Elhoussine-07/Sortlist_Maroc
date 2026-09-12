
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
	claims = require_active_agency()
	return frappe.get_all(
		"CommissionCredit",
		filters={"agency": claims["agency_id"]},
		fields=["name", "source_dispute", "source_project", "amount", "consumed_amount", "balance", "creation"],
		order_by="creation desc",
	)

@frappe.whitelist()
def list_payment_methods():
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
	if invoice_doc.status == "Paid":
		return None

	method_name = frappe.db.get_value("PaymentMethod", {"agency": agency, "is_default": 1})
	if not method_name:
		return None

	provider = "stub"
	if _stripe_configured():
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

	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import (
		resume_after_invoice_paid,
	)

	resume_after_invoice_paid(invoice_doc)

	return {"payment": payment.name, "provider": provider, "status": "Completed"}

@frappe.whitelist()
def download_invoice_pdf(invoice=None):
	invoice = require_body_arg(invoice, "invoice", _("Facture manquante"))
	claims = require_active_agency()
	doc = frappe.get_doc("Invoice", invoice)
	if doc.agency != claims["agency_id"]:
		frappe.throw(_("Accès non autorisé"), frappe.PermissionError)

	pdf_content = frappe.get_print(
		"Invoice", invoice, as_pdf=True, no_letterhead=1,
		pdf_options={"load-error-handling": "ignore", "load-media-error-handling": "ignore"},
	)
	frappe.local.response.filename = f"{doc.invoice_number or invoice}.pdf"
	frappe.local.response.filecontent = pdf_content
	frappe.local.response.type = "download"

@frappe.whitelist()
def pay_invoice(invoice=None):
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
