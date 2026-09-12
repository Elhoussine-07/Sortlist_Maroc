import json

import frappe
from platform_core.platform_core.auth import require_internal_token

@frappe.whitelist(allow_guest=True)
def get_categories():
	require_internal_token()
	from platform_core.platform_core.api.utils import get_categories as _get_categories
	return _get_categories()

def _read_json_body():
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
