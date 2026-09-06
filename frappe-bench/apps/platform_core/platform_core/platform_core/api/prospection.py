# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""🔒 Interne — consommé par prospection-service (Node.js), cf. docs/INTEGRATION.md §6."""

import frappe
from frappe import _

from platform_core.platform_core.auth import require_active_agency, require_internal_token, require_user_type

# BUG CORRIGÉ : `LeadScoringRule.action_code` (Select) n'accepte que des
# codes anglais ("add_favorite", "certificates_view", ... cf.
# setup.py::_ensure_lead_scoring_rules), mais `prospection-service`
# (scoreCalculator.js::findRule) compare les règles reçues au libellé
# FRANÇAIS canonique de l'action ("Ajout aux favoris", "Consultation
# certifications", ... produit par normalizeAction()). Sans traduction,
# `action_code as action` renvoyait tel quel le code anglais : aucune règle
# ne matchait jamais côté Node dès que le cache utilisait les règles LIVE de
# Frappe (base_points silencieusement à 0 pour TOUTES les actions) — seul le
# repli `FALLBACK_RULES` de secours (déjà en français) fonctionnait par
# coïncidence, d'où un score qui variait selon l'état du cache plutôt que
# selon l'activité réelle du visiteur.
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
	"""Variante de `get_scoring_rules()` accessible à une agence connectée
	(cf. agence.prospection.tsx > « Paramètres de scoring », lecture seule —
	le texte précise déjà que la modification reste réservée à l'espace
	Modération/Admin via `update_scoring_rules`). `get_scoring_rules()`
	exige `require_internal_token()` (réservé au microservice
	prospection-service, cf. son en-tête « 🔒 Interne ») — un compte agence
	authentifié normalement ne peut jamais fournir ce token interne, d'où
	l'AttributeError : le frontend appelait déjà cette fonction, qui
	n'avait tout simplement jamais été implémentée côté backend. Ne renvoie
	que les seuils (pas le barème détaillé par action, hors périmètre de cet
	écran)."""
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
	# DÉSACTIVÉ (demande explicite, phase de test) : filters={"offers_suspended": 0}
	# excluait de l'annuaire toute agence flaguée un jour par
	# tasks.py::process_invoice_reminders — même correctif que search.py/
	# matching.py (flag jamais remis à 0 automatiquement, même régularisée).
	return frappe.get_all(
		"AgencyProfile", fields=["name", "agency_name", "website"]
	)


@frappe.whitelist(allow_guest=True)
def log_visitor():
	"""Miroir côté Frappe des détections faites par prospection-service (IP ->
	entreprise), pour affichage dans le dashboard Agence (module 2.6)."""
	require_internal_token()
	payload = frappe.parse_json(frappe.request.data) if frappe.request.data else frappe.local.form_dict

	from platform_core.platform_core.doctype.visitorlog.visitorlog import log_action

	# prospection-service reste la source de vérité pour le score/classification
	# (sa propre base Postgres, cf. docs/INTEGRATION.md §6) — cet appel n'est
	# qu'un miroir pour l'UI Frappe/Analytics, d'où l'appel "fire and forget"
	# côté prospection-service (non bloquant en cas d'échec).
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
	"""cf. §2.6.1 : le barème de scoring doit rester configurable depuis
	l'espace Admin — met à jour les `LeadScoringRule` déjà amorcées par
	setup.py (par `action_code`), n'en crée jamais de nouvelles."""
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
