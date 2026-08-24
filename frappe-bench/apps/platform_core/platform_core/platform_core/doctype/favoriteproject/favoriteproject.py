# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class FavoriteProject(Document):
	pass


def toggle(agency, project):
	"""Bascule l'état favori pour le couple (agency, project) — même pattern
	que `favoriteagency.toggle()` (cf. api.agency.toggle_project_favorite)."""
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
