
import frappe

from platform_core.platform_core.auth import current_claims, require_body_arg
from platform_core.platform_core.doctype.notification.notification import mark_all_read

@frappe.whitelist()
def list_active(agency_context=None):
	claims = current_claims()
	filters = {"recipient": claims["sub"], "is_read": 0}
	if agency_context:
		filters["agency_context"] = agency_context
	return frappe.get_all(
		"Notification",
		filters=filters,
		fields=["name", "category", "title", "body", "link", "reference_doctype", "reference_name", "creation"],
		order_by="creation desc",
	)

@frappe.whitelist()
def list_history(category=None, search=None, page=1, page_size=20):
	claims = current_claims()
	query_filters = [["Notification", "recipient", "=", claims["sub"]], ["Notification", "is_read", "=", 1]]
	if category:
		query_filters.append(["Notification", "category", "=", category])
	if search:
		query_filters.append(["Notification", "title", "like", f"%{search}%"])

	page = int(page)
	page_size = int(page_size)
	return frappe.get_all(
		"Notification",
		filters=query_filters,
		fields=["name", "category", "title", "body", "link", "read_on", "creation"],
		order_by="creation desc",
		limit_start=(page - 1) * page_size,
		limit_page_length=page_size,
	)

@frappe.whitelist()
def mark_read(notification=None):
	notification = require_body_arg(notification, "notification", "Notification manquante")
	claims = current_claims()
	doc = frappe.get_doc("Notification", notification)
	if doc.recipient != claims["sub"]:
		frappe.throw("Accès non autorisé", frappe.PermissionError)
	return doc.mark_read().as_dict()

@frappe.whitelist()
def mark_all_active_read(agency_context=None):
	claims = current_claims()
	return {"marked": mark_all_read(claims["sub"], agency_context)}
