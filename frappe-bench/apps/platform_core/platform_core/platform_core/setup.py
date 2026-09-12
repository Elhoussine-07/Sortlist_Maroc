
import frappe

def after_install():
	after_migrate()

def after_migrate():
	_ensure_roles()
	_ensure_platform_settings()
	_ensure_pqi_criteria()
	_ensure_lead_scoring_rules()
	_ensure_service_taxonomy()
	_ensure_legal_id_rules()
	_ensure_user_custom_fields()
	frappe.db.commit()

def _ensure_roles():
	for role in ("Client", "Agency", "Moderator"):
		if not frappe.db.exists("Role", role):
			frappe.get_doc({"doctype": "Role", "role_name": role, "desk_access": 0}).insert(
				ignore_permissions=True
			)

def _ensure_platform_settings():
	settings = frappe.get_single("PlatformSettings")
	defaults = {
		"commission_rate": 1,
		"quote_response_hours": 48,
		"reminder_extra_hours": 24,
		"suspension_grace_hours": 24,
		"invoice_due_days": 7,
		"invoice_payment_deadline_hours": 24,
		"auto_debit_notice_hours": 24,
		"lead_hot_threshold": 40,
		"lead_warm_min": 15,
		"lead_warm_max": 39,
		"lead_score_window_days": 7,
	}
	changed = False
	for field, value in defaults.items():
		if not settings.get(field):
			settings.set(field, value)
			changed = True
	if changed:
		settings.save(ignore_permissions=True)

def _ensure_pqi_criteria():
	criteria = [
		("Netteté des visuels", "Logo ou photo de couverture flous, pixelisés ou mal cadrés"),
		("Structuration du nom", "Raison sociale mal formatée (majuscules, caractères spéciaux excessifs)"),
		("Cohérence des informations", "Incohérence entre site web, adresse, réseaux sociaux"),
		("Complétude qualifiée", "Descriptions trop courtes ou génériques"),
		("Sécurité du compte", "Mot de passe faible, pas de 2FA activée"),
	]
	for name, description in criteria:
		if not frappe.db.exists("PQICriterion", {"label": name}):
			frappe.get_doc({
				"doctype": "PQICriterion",
				"criterion_code": frappe.scrub(name),
				"label": name,
				"description": description,
				"weight": 20,
				"is_active": 1,
			}).insert(ignore_permissions=True)

def _ensure_lead_scoring_rules():
	rules = [
		("profile_view", 10, "duration > 60", 15),
		("portfolio_view", 5, "count > 5", 10),
		("reviews_view", 5, "count > 3", 5),
		("team_view", 3, "count > 2", 5),
		("certificates_view", 3, "count > 2", 5),
		("services_view", 3, "count > 2", 5),
		("add_favorite", 20, None, 0),
	]
	for action, base, bonus_condition, bonus in rules:
		if not frappe.db.exists("LeadScoringRule", {"action_code": action}):
			frappe.get_doc({
				"doctype": "LeadScoringRule",
				"action_code": action,
				"base_points": base,
				"bonus_condition": bonus_condition,
				"bonus_points": bonus,
				"is_active": 1,
			}).insert(ignore_permissions=True)

def _ensure_service_taxonomy():
	categories = {
		"Développement web & mobile": ["Site vitrine", "E-commerce", "Application mobile"],
		"Design & branding": ["Identité visuelle", "UI/UX", "Motion design"],
		"Marketing digital": ["SEO", "Publicité en ligne", "Réseaux sociaux"],
		"Conseil & stratégie": ["Transformation digitale", "Audit", "Formation"],
	}
	for category, subs in categories.items():
		if not frappe.db.exists("ServiceCategory", {"category_name": category}):
			frappe.get_doc({
				"doctype": "ServiceCategory", "category_name": category, "is_active": 1,
			}).insert(ignore_permissions=True)
		for sub in subs:
			if not frappe.db.exists("ServiceSubCategory", {"subcategory_name": sub, "parent_category": category}):
				frappe.get_doc({
					"doctype": "ServiceSubCategory",
					"subcategory_name": sub,
					"parent_category": category,
					"is_active": 1,
				}).insert(ignore_permissions=True)

def _ensure_legal_id_rules():
	rules = [
		("Morocco", "ICE", r"^\d{15}$", "001234567000012"),
		("France", "SIREN/SIRET", r"^\d{9}(\d{5})?$", "732829320" ),
		("Côte d'Ivoire", "RCCM", r"^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{4,6}$", "CI-ABJ-2024-A-12345"),
		("Senegal", "RCCM", r"^SN-[A-Z]{3}-\d{4}-[A-Z]-\d{4,6}$", "SN-DKR-2024-A-12345"),
		("Cameroon", "RCCM", r"^RC/[A-Z]{3}/\d{4}/[AB]/\d{3,5}$", "RC/YAO/2024/A/12345"),
	]
	for country, label, pattern, example in rules:
		if not frappe.db.exists("Country", country):
			continue
		if not frappe.db.exists("CountryLegalIDRule", {"country": country}):
			frappe.get_doc({
				"doctype": "CountryLegalIDRule",
				"country": country,
				"id_label": label,
				"validation_regex": pattern,
				"example_format": example,
				"is_active": 1,
			}).insert(ignore_permissions=True)

def _ensure_user_custom_fields():
	fields = [
		{"fieldname": "theme_preference", "label": "Thème", "fieldtype": "Select",
		 "options": "light\ndark\nsystem", "default": "light", "insert_after": "language"},
		{"fieldname": "font_preference", "label": "Police", "fieldtype": "Data", "insert_after": "theme_preference"},
		{"fieldname": "font_size", "label": "Taille de texte (%)", "fieldtype": "Int", "default": "100",
		 "insert_after": "font_preference"},
		{"fieldname": "two_factor_enabled", "label": "2FA activée", "fieldtype": "Check", "default": "0",
		 "insert_after": "font_size"},
		{"fieldname": "notification_prefs", "label": "Préférences de notification (JSON)",
		 "fieldtype": "Small Text", "insert_after": "two_factor_enabled"},
		{"fieldname": "demo_guide_step", "label": "Étape du guide de démo", "fieldtype": "Int",
		 "default": "0", "insert_after": "notification_prefs"},
		{"fieldname": "demo_guide_completed", "label": "Guide de démo terminé", "fieldtype": "Check",
		 "default": "0", "insert_after": "demo_guide_step"},
	]
	for field in fields:
		fieldname = field["fieldname"]
		existing = frappe.db.exists("Custom Field", f"User-{fieldname}")
		if not existing:
			frappe.get_doc({
				"doctype": "Custom Field",
				"dt": "User",
				**field,
			}).insert(ignore_permissions=True)
			continue
		doc = frappe.get_doc("Custom Field", existing)
		changed = False
		for key in ("options", "default", "label", "fieldtype"):
			if key in field and doc.get(key) != field[key]:
				doc.set(key, field[key])
				changed = True
		if changed:
			doc.save(ignore_permissions=True)
