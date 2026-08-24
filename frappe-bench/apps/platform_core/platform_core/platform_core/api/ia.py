# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""🔒 Interne — consommé par ia-service (FastAPI), cf. docs/INTEGRATION.md §6.
ia-service mène la conversation (Smart Briefing IA, cf. §1.2) côté client de
manière stateless, puis appelle `create_project_from_briefing` une fois le
brief structuré pour que Frappe (source de vérité) crée le Project et génère
le CDC (cf. cdc.py)."""
import json

import frappe
from platform_core.platform_core.auth import require_internal_token


@frappe.whitelist(allow_guest=True)
def get_categories():
	require_internal_token()
	from platform_core.platform_core.api.utils import get_categories as _get_categories
	return _get_categories()


def _read_json_body():
	"""BUG CORRIGÉ : `frappe.parse_json` avale silencieusement toute erreur de
	décodage JSON et renvoie la valeur d'origine inchangée (bytes bruts) au
	lieu de lever une exception claire — `payload.get("client")` plantait
	alors avec `AttributeError: 'bytes' object has no attribute 'get'`, sans
	jamais indiquer que le vrai problème était un échec de parsing JSON.
	`json.loads` explicite ici : soit ça réussit, soit l'erreur est un
	`json.JSONDecodeError` explicite et diagnostiquable."""
	raw = frappe.request.data
	if isinstance(raw, (bytes, bytearray)):
		raw = raw.decode("utf-8")
	if raw:
		return json.loads(raw)
	return dict(frappe.local.form_dict)


@frappe.whitelist(allow_guest=True)
def create_project_from_briefing():
	require_internal_token()
	payload = _read_json_body()
	client = payload.get("client")
	brief = payload.get("brief", {})
	if not frappe.db.exists("User", client):
		frappe.throw("Client inconnu")
	from platform_core.platform_core.api.project import create_draft, generate_cdc_if_project
	doc = create_draft(client, channel="Smart Briefing", need_type=brief.get("need_type", "Projet"), **{
		"category": brief.get("category"),
		"sub_category": brief.get("sub_category"),
		"budget_min": brief.get("budget_min"),
		"budget_max": brief.get("budget_max"),
		"location": brief.get("location"),
		"delivery_delay_days": brief.get("delivery_delay_days"),
		"description": brief.get("description"),
                "deliverables": brief.get("deliverables"),
                "exclusions": brief.get("exclusions"),
                "deadlines": brief.get("deadlines"),
		"title": brief.get("title"),
	})
	doc.status = "Posted"
	doc.save(ignore_permissions=True)
	doc = generate_cdc_if_project(doc)
	return {"project": doc.name, "cdc_file": doc.cdc_file}
