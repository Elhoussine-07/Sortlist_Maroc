# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""🔒 Interne — consommé par matching-service (Spring Boot), cf. docs/INTEGRATION.md §6."""

import frappe

from platform_core.platform_core.auth import require_internal_token


@frappe.whitelist(allow_guest=True)
def get_project_context(project):
	require_internal_token()

	project_doc = frappe.get_doc("Project", project).as_dict()
	# project_doc["client"] est déjà le NOM du ClientProfile (cf. Project.before_insert),
	# pas un email : on le récupère directement par sa clé primaire.
	client_profile = None
	if project_doc.get("client"):
		client_profile = frappe.db.get_value(
			"ClientProfile", project_doc["client"], ["trust_score"], as_dict=True
		)

	candidates = frappe.get_all(
		"AgencyProfile",
		# DÉSACTIVÉ (demande explicite, phase de test) : filters={"offers_suspended": 0}
		# excluait du Shortlist IA toute agence flaguée un jour par
		# tasks.py::process_invoice_reminders — flag jamais remis à 0
		# automatiquement (cf. proposal.py/search.py, même correctif), même
		# après paiement de la facture. Réactiver avec le filtre une fois un
		# vrai mécanisme de levée automatique en place.
		fields=["name", "agency_name", "location", "coverage", "remote_work", "rating",
		        "pqi_score", "team_size", "year_founded", "annual_revenue"],
	)
	for candidate in candidates:
		candidate["services"] = frappe.get_all(
			"AgencyService",
			filters={"parent": candidate.name},
			fields=["service_name", "skills", "tech_stack", "price_range"],
		)
		candidate["completed_projects"] = frappe.db.count(
			"Opportunity", {"agency": candidate.name, "status": "Terminée"}
		)

	return {
		"project": project_doc,
		"client_trust_score": (client_profile or {}).get("trust_score", 0),
		"candidate_agencies": candidates,
	}


@frappe.whitelist(allow_guest=True)
def save_shortlist():
	require_internal_token()
	payload = frappe.parse_json(frappe.request.data) if frappe.request.data else frappe.local.form_dict

	project = payload.get("project")
	shortlist = payload.get("shortlist", [])
	frappe.db.set_value("Project", project, "shortlist_ia", frappe.as_json(shortlist))
	return {"saved": True, "count": len(shortlist)}
