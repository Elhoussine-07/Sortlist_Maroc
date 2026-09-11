
import frappe
from frappe.model.document import Document

class FavoriteAgency(Document):
	pass

def toggle(client, agency):
	existing = frappe.db.exists("FavoriteAgency", {"client": client, "agency": agency})
	if existing:
		frappe.delete_doc("FavoriteAgency", existing, ignore_permissions=True)
		return {"favorited": False}

	frappe.get_doc({
		"doctype": "FavoriteAgency",
		"client": client,
		"agency": agency,
	}).insert(ignore_permissions=True)
	return {"favorited": True}
