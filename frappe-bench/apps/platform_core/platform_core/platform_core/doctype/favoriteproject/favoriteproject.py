
import frappe
from frappe.model.document import Document

class FavoriteProject(Document):
	pass

def toggle(agency, project):
	existing = frappe.db.exists("FavoriteProject", {"agency": agency, "project": project})
	if existing:
		frappe.delete_doc("FavoriteProject", existing, ignore_permissions=True)
		return {"favorited": False}

	frappe.get_doc({
		"doctype": "FavoriteProject",
		"agency": agency,
		"project": project,
	}).insert(ignore_permissions=True)
	return {"favorited": True}
