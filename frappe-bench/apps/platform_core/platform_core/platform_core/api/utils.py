
import re

import frappe

from platform_core.platform_core.auth import require_body_arg

@frappe.whitelist(allow_guest=True)
def ping():
	return {"ok": True, "app": "platform_core"}

@frappe.whitelist(allow_guest=True)
def get_categories():
	categories = frappe.get_all("ServiceCategory", filters={"is_active": 1}, fields=["name", "category_name", "icon"])
	sub_categories = frappe.get_all(
		"ServiceSubCategory", filters={"is_active": 1}, fields=["name", "subcategory_name", "parent_category"]
	)
	for cat in categories:
		cat["sub_categories"] = [
			{
				"name": s.name,
				"sub_category_name": s.subcategory_name,
				"category": s.parent_category,
			}
			for s in sub_categories
			if s.parent_category == cat.name
		]
	return categories

@frappe.whitelist(allow_guest=True)
def get_countries():
	countries = frappe.get_all(
		"Country",
		filters={"code": ["!=", ""]},
		fields=["name", "code"],
		order_by="name asc",
	)
	return [{"name": c.name, "code": (c.code or "").upper()} for c in countries]

@frappe.whitelist(allow_guest=True)
def get_legal_id_rule(country=None):
	country = require_body_arg(country, "country", "Pays manquant")
	rule = frappe.db.get_value(
		"CountryLegalIDRule", {"country": country},
		["id_label", "validation_regex", "example_format"], as_dict=True,
	)
	if not rule:
		return None
	rule["help_text"] = f"Format attendu pour {rule.id_label} : {rule.example_format}"
	return rule

@frappe.whitelist(allow_guest=True)
def validate_legal_id(country=None, value=None):
	country = require_body_arg(country, "country", "Pays manquant")
	rule = get_legal_id_rule(country)
	if not rule:
		return {"valid": True, "checked": False}
	return {
		"valid": bool(re.match(rule.validation_regex, value or "")),
		"checked": True,
		"expected": rule.example_format,
	}
