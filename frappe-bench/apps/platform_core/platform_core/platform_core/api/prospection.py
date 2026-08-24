# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""🔒 Interne — consommé par prospection-service (Node.js), cf. docs/INTEGRATION.md §6."""

import frappe
from frappe import _

from platform_core.platform_core.auth import (
	require_active_agency,
	require_body_arg,
	require_internal_token,
	require_user_type,
)


# BUG CORRIGÉ : cette fonction renvoyait `action_code` tel quel ("profile_view",
# "portfolio_view", ...) sous la clé "action". Mais `scoreCalculator.js`
# (prospection-service) ne matche les règles reçues QUE sur le libellé FR
# canonique ("Consultation du profil", ...) — c'est ce que `FALLBACK_RULES`
# utilise, et ce vers quoi `normalizeAction()` convertit toute action reçue
# via /track. Résultat : dès que prospection-service arrivait à joindre
# Frappe (le cas normal), `findRule()` ne trouvait jamais la règle
# correspondante et calculait 0 point pour CHAQUE action trackée — seul
# "Ajout aux favoris" produisait un score (classification forcée à "Chaud",
# indépendante des points). Toute la mécanique chaud/tiède/froid basée sur
# le score cumulé était donc silencieusement inopérante.
ACTION_CODE_TO_LABEL = {
	"profile_view": "Consultation du profil",
	"portfolio_view": "Consultation portfolio",
	"reviews_view": "Consultation avis",
	"team_view": "Consultation équipe",
	"certificates_view": "Consultation certifications",
	"services_view": "Consultation prestations",
	"add_favorite": "Ajout aux favoris",
}


def _scoring_rules_payload():
	settings = frappe.get_single("PlatformSettings")
	raw_rules = frappe.get_all(
		"LeadScoringRule",
		filters={"is_active": 1},
		fields=["action_code", "base_points", "bonus_condition", "bonus_points"],
	)
	rules = [
		{
			"action": ACTION_CODE_TO_LABEL.get(r.action_code, r.action_code),
			"base_points": r.base_points,
			"bonus_condition": r.bonus_condition,
			"bonus_points": r.bonus_points,
		}
		for r in raw_rules
	]
	return {
		"rules": rules,
		"thresholds": {
			"hot": settings.lead_hot_threshold,
			"warm_min": settings.lead_warm_min,
			"warm_max": settings.lead_warm_max,
			"window_days": settings.lead_score_window_days,
		},
	}


@frappe.whitelist(allow_guest=True)
def get_scoring_rules():
	"""🔒 Interne — consommé par prospection-service via X-Internal-Token."""
	require_internal_token()
	return _scoring_rules_payload()


@frappe.whitelist()
def get_scoring_rules_for_agency():
	"""Lecture seule, côté dashboard Agence (CDC §2.6.1) : le barème reste
	consultable par l'agence mais n'est modifiable que depuis l'espace Admin
	(cf. update_scoring_rules, réservé Modérateur/Admin) — contrairement à
	get_scoring_rules() ci-dessus, celle-ci accepte un JWT utilisateur normal
	plutôt qu'un jeton de service interne."""
	require_active_agency()
	return _scoring_rules_payload()


@frappe.whitelist(allow_guest=True)
def get_agency_directory():
	require_internal_token()
	return frappe.get_all(
		"AgencyProfile", filters={"offers_suspended": 0}, fields=["name", "agency_name", "website"]
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


@frappe.whitelist(allow_guest=True)
def notify_client_interest(client_email=None, agency=None):
	"""Notifie le CLIENT identifié qu'une agence s'intéresse à son profil
	(§2.6, demande explicite) — déclenché par prospection-service quand
	l'agence envoie un e-mail de prospection à un lead identifié
	(`leads.client_email` non nul). Ne révèle jamais l'inverse (l'agence ne
	voit jamais l'e-mail du client, cf. `client.get_client_profile_for_agency`)
	: c'est un e-mail + une notification in-app envoyés par la PLATEFORME au
	client, jamais un email direct agence -> client. Le client peut ensuite
	consulter le profil de l'agence et l'ajouter à ses favoris
	(`client.toggle_favorite`) pour la recontacter plus tard."""
	require_internal_token()
	client_email = require_body_arg(client_email, "client_email", _("Client manquant"))
	agency = require_body_arg(agency, "agency", _("Agence manquante"))

	if not frappe.db.exists("User", client_email):
		frappe.throw(_("Client introuvable"))

	agency_name = frappe.db.get_value("AgencyProfile", agency, "agency_name") or agency

	from platform_core.platform_core.notify import notify

	notify(
		recipient=client_email,
		category="Prospection",
		title=f"{agency_name} s'intéresse à votre profil",
		body=(
			f"L'agence {agency_name} a consulté votre profil et souhaite savoir si vous êtes "
			"intéressé(e). Consultez son profil et ajoutez-la à vos favoris si vous l'êtes, "
			"pour la recontacter lors d'un futur projet."
		),
		link=f"/agences/{agency}",
		reference_doctype="AgencyProfile",
		reference_name=agency,
		channel="Both",
	)
	return {"notified": True}


@frappe.whitelist()
def update_scoring_rules(rules=None):
	"""cf. §2.6.1 : le barème de scoring doit rester configurable depuis
	l'espace Admin — met à jour les `LeadScoringRule` déjà amorcées par
	setup.py (par `action_code`), n'en crée jamais de nouvelles."""
	rules = require_body_arg(rules, "rules", _("Barème manquant"))
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
