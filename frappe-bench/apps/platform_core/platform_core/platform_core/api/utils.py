# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt

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

# --- À ajouter dans platform_core/platform_core/api/utils.py,
#     juste après get_categories() ---

@frappe.whitelist(allow_guest=True)
def get_countries():
	"""Liste des pays (doctype natif Frappe `Country`) pour le sélecteur de
	pays des formulaires d'inscription (client + agence) — remplace une
	liste en dur côté frontend afin de rester cohérent avec les noms
	attendus par `CountryLegalIDRule.country` (Link vers `Country`, donc
	nom anglais, ex. "Morocco") : sélectionner "Maroc" ne matchait aucune
	règle, "Morocco" fonctionnait. `code` (ISO2, ex. "ma") sert au frontend
	à afficher le drapeau et à retrouver l'indicatif téléphonique (non
	stocké dans ce doctype, table locale côté frontend)."""
	countries = frappe.get_all(
		"Country",
		filters={"code": ["!=", ""]},
		fields=["name", "code"],
		order_by="name asc",
	)
	return [{"name": c.name, "code": (c.code or "").upper()} for c in countries]

# --- Fin de l'ajout ---




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
