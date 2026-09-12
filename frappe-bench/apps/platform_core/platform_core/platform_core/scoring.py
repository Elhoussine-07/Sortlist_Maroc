
import re

import frappe

PQI_CRITERIA = [
	"Netteté des visuels",
	"Structuration du nom",
	"Cohérence des informations",
	"Complétude qualifiée",
	"Sécurité du compte",
]

def profile_completion(doc, fields):
	filled = sum(1 for f in fields if (doc.get(f) not in (None, "", 0)))
	return round((filled / len(fields)) * 100, 2) if fields else 0

def compute_trust_score(client_profile):
	score = 0.0

	if client_profile.legal_id_verified:
		score += 30
	if client_profile.phone_verified:
		score += 15

	completion = client_profile.profile_completion or 0
	score += (completion / 100) * 25

	avg_rating = frappe.db.get_value(
		"ClientReview", {"client": client_profile.user}, "avg(rating)"
	)
	if avg_rating:
		score += min(float(avg_rating) / 5, 1) * 30

	return round(min(score, 100), 2)

def update_client_trust_score(user):
	name = frappe.db.get_value("ClientProfile", {"user": user})
	if not name:
		return
	doc = frappe.get_doc("ClientProfile", name)
	doc.save(ignore_permissions=True)
	return doc

def _score_visuals(agency):
	points, reason = 20, None
	if not agency.logo:
		points -= 10
		reason = "Logo manquant"
	if not agency.cover_image:
		points -= 10
		reason = (reason + " ; image de couverture manquante") if reason else "Image de couverture manquante"
	return max(points, 0), reason

def _score_name_structure(agency):
	name = agency.agency_name or ""
	points, reason = 20, None
	if not name:
		return 0, "Nom d'agence manquant"
	if name.isupper():
		points -= 10
		reason = "Raison sociale tout en majuscules"
	if len(re.findall(r"[^\w\s\-&.]", name)) > 2:
		points -= 10
		reason = (reason + " ; caractères spéciaux excessifs") if reason else "Caractères spéciaux excessifs"
	return max(points, 0), reason

def _score_consistency(agency):
	points, reason = 20, None
	if agency.website and agency.location and not agency.phone:
		points -= 7
		reason = "Téléphone manquant malgré site web et localisation renseignés"
	if not agency.email_verified:
		points -= 7
		reason = (reason + " ; email non vérifié") if reason else "Email non vérifié"
	return max(points, 0), reason

def _score_completeness(agency):
	description = frappe.utils.strip_html(agency.description or "")
	points, reason = 20, None
	if len(description) < 40:
		points -= 15
		reason = "Description absente ou trop courte"
	elif len(description) < 120:
		points -= 7
		reason = "Description trop générique"
	return max(points, 0), reason

def _score_account_security(agency):
	points, reason = 20, None
	if not agency.legal_id_verified:
		points -= 10
		reason = "Identifiant légal non vérifié"
	if not agency.email_verified:
		points -= 10
		reason = (reason + " ; email non vérifié (2FA/sécurité)") if reason else "Email non vérifié (2FA/sécurité)"
	return max(points, 0), reason

_SCORERS = [
	("Netteté des visuels", _score_visuals),
	("Structuration du nom", _score_name_structure),
	("Cohérence des informations", _score_consistency),
	("Complétude qualifiée", _score_completeness),
	("Sécurité du compte", _score_account_security),
]

def compute_pqi(agency):
	details = []
	total = 0
	for criterion_name, scorer in _SCORERS:
		points, reason = scorer(agency)
		total += points
		details.append({
			"criterion": criterion_name,
			"score": points,
			"penalty_reason": reason,
			"ai_recommendation": _recommendation(criterion_name, reason),
		})
	return total, details

def _recommendation(criterion_name, reason):
	if not reason:
		return None
	suggestions = {
		"Netteté des visuels": "Ajoutez un logo et une image de couverture en haute résolution.",
		"Structuration du nom": "Utilisez une casse standard (pas de majuscules intégrales) pour la raison sociale.",
		"Cohérence des informations": "Complétez le téléphone et vérifiez votre email pour renforcer la cohérence du profil.",
		"Complétude qualifiée": "Rédigez une description détaillée (>120 caractères) de votre expertise.",
		"Sécurité du compte": "Vérifiez votre identifiant légal et votre email pour sécuriser le compte.",
	}
	return suggestions.get(criterion_name)

def update_agency_pqi(agency_name):
	doc = frappe.get_doc("AgencyProfile", agency_name)
	total, details = compute_pqi(doc)
	previous_score = doc.pqi_score or 0

	criterion_names = {row.label: row.name for row in frappe.get_all("PQICriterion", fields=["name", "label"])}

	doc.set("pqi_details", [])
	for row in details:
		criterion_doc_name = criterion_names.get(row["criterion"])
		if not criterion_doc_name:
			continue
		doc.append("pqi_details", {
			"criterion": criterion_doc_name,
			"score": row["score"],
			"penalty_reason": row["penalty_reason"],
			"ai_recommendation": row["ai_recommendation"],
		})

	doc.pqi_score = total
	doc.profile_completion = profile_completion(
		doc,
		["agency_name", "description", "logo", "website", "location", "phone", "email", "legal_id"],
	)
	doc.save(ignore_permissions=True)

	if total < previous_score - 5:
		from platform_core.platform_core.notify import notify

		owners = frappe.get_all(
			"AgencyMember",
			filters={"agency": agency_name, "member_role": "Owner", "status": "Active"},
			pluck="user",
		)
		for owner in owners:
			notify(
				recipient=owner,
				agency_context=agency_name,
				category="Alerte PQI",
				title="Votre score PQI a baissé",
				body=f"Le score PQI de {doc.agency_name} est passé de {previous_score} à {total}.",
				link="/agency/analytics",
			)
	return doc
