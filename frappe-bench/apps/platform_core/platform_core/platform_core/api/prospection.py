
import frappe
from frappe import _

from platform_core.platform_core.auth import require_active_agency, require_internal_token, require_user_type

ACTION_CODE_TO_LABEL = {
	"profile_view": "Consultation du profil",
	"portfolio_view": "Consultation portfolio",
	"reviews_view": "Consultation avis",
	"team_view": "Consultation équipe",
	"certificates_view": "Consultation certifications",
	"services_view": "Consultation prestations",
	"add_favorite": "Ajout aux favoris",
}

@frappe.whitelist(allow_guest=True)
def get_scoring_rules():
	require_internal_token()
	settings = frappe.get_single("PlatformSettings")
	rules = frappe.get_all(
		"LeadScoringRule",
		filters={"is_active": 1},
		fields=["action_code", "base_points", "bonus_condition", "bonus_points"],
	)
	for rule in rules:
		rule["action"] = ACTION_CODE_TO_LABEL.get(rule["action_code"], rule["action_code"])
	return {
		"rules": rules,
		"thresholds": {
			"hot": settings.lead_hot_threshold,
			"warm_min": settings.lead_warm_min,
			"warm_max": settings.lead_warm_max,
			"window_days": settings.lead_score_window_days,
		},
	}

@frappe.whitelist()
def get_scoring_rules_for_agency():
	require_active_agency()
	settings = frappe.get_single("PlatformSettings")
	return {
		"scoring": {
			"hot_min": settings.lead_hot_threshold,
			"warm_min": settings.lead_warm_min,
		},
	}

@frappe.whitelist(allow_guest=True)
def get_agency_directory():
	require_internal_token()
	return frappe.get_all(
		"AgencyProfile", fields=["name", "agency_name", "website"]
	)

@frappe.whitelist(allow_guest=True)
def log_visitor():
	require_internal_token()
	payload = frappe.parse_json(frappe.request.data) if frappe.request.data else frappe.local.form_dict

	from platform_core.platform_core.doctype.visitorlog.visitorlog import log_action

	log = log_action(
		agency=payload.get("agency"),
		action=payload.get("action"),
		visitor_ip=payload.get("visitor_ip"),
		company_name=payload.get("company_name"),
		company_domain=payload.get("company_domain"),
		session_id=payload.get("session_id"),
	)
	return {"logged": True, "name": log.name}

@frappe.whitelist()
def update_scoring_rules(rules):
	claims = require_user_type("moderator", "admin")

	if isinstance(rules, str):
		rules = frappe.parse_json(rules)

	for rule in rules:
		action_code = rule.get("action_code")
		if not action_code:
			frappe.throw(_("Chaque règle doit préciser un action_code"))

		name = frappe.db.exists("LeadScoringRule", {"action_code": action_code})
		if not name:
			frappe.throw(_("Aucune règle existante pour l'action « {0} »").format(action_code))

		doc = frappe.get_doc("LeadScoringRule", name)
		if "base_points" in rule:
			doc.base_points = rule["base_points"]
		if "bonus_points" in rule:
			doc.bonus_points = rule["bonus_points"]
		if "bonus_condition" in rule:
			doc.bonus_condition = rule["bonus_condition"]
		doc.save(ignore_permissions=True)

	return frappe.get_all(
		"LeadScoringRule",
		fields=["action_code", "base_points", "bonus_points", "bonus_condition", "is_active"],
	)
