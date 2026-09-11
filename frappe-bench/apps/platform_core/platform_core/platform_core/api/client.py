
import random

import frappe
from frappe import _

from platform_core.platform_core.auth import (
	get_body_dict,
	get_client_profile_name,
	require_active_agency,
	require_body_arg,
	require_client_profile,
	require_user_type,
)

PHONE_OTP_TTL_SECONDS = 5 * 60

RECENT_PROJECT_FIELDS = [
	"name", "title", "status", "rejection_substatus", "need_type", "channel",
	"budget_min", "budget_max", "expected_end_date", "creation",
]

@frappe.whitelist()
def get_profile():
	claims = require_user_type("client")
	name = frappe.db.exists("ClientProfile", {"user": claims["sub"]})
	if not name:
		frappe.throw(_("Profil introuvable"))
	return frappe.get_doc("ClientProfile", name).as_dict()

@frappe.whitelist()
def update_profile(**fields):
	fields = {**get_body_dict(), **fields}
	claims = require_user_type("client")
	name = frappe.db.exists("ClientProfile", {"user": claims["sub"]})
	if not name:
		frappe.throw(_("Profil introuvable"))

	doc = frappe.get_doc("ClientProfile", name)
	editable = [
		"first_name", "last_name", "company_name", "sector", "phone", "logo",
		"country", "legal_id", "legal_id_label",
	]
	for field in editable:
		if field in fields:
			doc.set(field, fields[field])
	doc.save(ignore_permissions=True)
	return doc.as_dict()

@frappe.whitelist()
def verify_identity():
	claims = require_user_type("client")
	name = frappe.db.exists("ClientProfile", {"user": claims["sub"]})
	if not name:
		frappe.throw(_("Profil introuvable"))

	doc = frappe.get_doc("ClientProfile", name)
	if not doc.country or not doc.legal_id:
		frappe.throw(_("Renseignez le pays et l'identifiant légal avant de lancer la vérification."))

	from platform_core.platform_core.api.utils import validate_legal_id

	result = validate_legal_id(doc.country, doc.legal_id)
	if not result.get("checked"):
		frappe.throw(_("Aucune règle de validation connue pour le pays « {0} ».").format(doc.country))

	doc.legal_id_verified = 1 if result.get("valid") else 0
	doc.save(ignore_permissions=True)

	from platform_core.platform_core.scoring import update_client_trust_score

	updated = update_client_trust_score(claims["sub"])

	return {
		"verified": bool(result.get("valid")),
		"expected_format": result.get("expected"),
		"trust_score": updated.trust_score if updated else doc.trust_score,
	}

@frappe.whitelist()
def list_collaborations():
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		return []
	rows = frappe.db.sql(
		"""
		select p.name as project, p.title, p.budget_min, p.budget_max,
		       p.start_date, p.expected_end_date, o.agency
		from `tabProject` p
		inner join `tabOpportunity` o on o.project = p.name and o.status = 'Terminée'
		where p.client = %s and p.status = 'Completed'
		order by p.expected_end_date desc
		""",
		(client_name,),
		as_dict=True,
	)
	if not rows:
		return []

	project_names = [row.project for row in rows]

	given_reviews = frappe.get_all(
		"AgencyReview",
		filters={"client": claims["sub"], "project": ["in", project_names]},
		fields=["project", "rating", "comment"],
	)
	given_review_by_project = {r.project: r for r in given_reviews}

	received_reviews = frappe.get_all(
		"ClientReview",
		filters={"client": client_name, "project": ["in", project_names]},
		fields=["project", "rating", "comment"],
	)
	received_review_by_project = {r.project: r for r in received_reviews}

	by_agency = {}
	for row in rows:
		entry = by_agency.setdefault(row.agency, {
			"agency": row.agency,
			"agency_name": frappe.db.get_value("AgencyProfile", row.agency, "agency_name"),
			"projects": [],
		})
		received = received_review_by_project.get(row.project)
		entry["projects"].append({
			"project": row.project,
			"title": row.title,
			"budget_min": row.budget_min,
			"budget_max": row.budget_max,
			"start_date": row.start_date,
			"expected_end_date": row.expected_end_date,
			"period": f"{row.start_date} → {row.expected_end_date}",
			"review": given_review_by_project.get(row.project),
			"rating_received": received.rating if received else None,
		})

	for entry in by_agency.values():
		projects = entry["projects"]
		entry["finished_projects_count"] = len(projects)

		start_dates = [p["start_date"] for p in projects if p["start_date"]]
		end_dates = [p["expected_end_date"] for p in projects if p["expected_end_date"]]
		entry["period"] = (
			f"{min(start_dates)} → {max(end_dates)}" if start_dates and end_dates else ""
		)

		budgets = [
			p["budget_max"] or p["budget_min"] for p in projects if p["budget_max"] or p["budget_min"]
		]
		entry["budget"] = sum(budgets) if budgets else None

		received_ratings = [p["rating_received"] for p in projects if p["rating_received"] is not None]
		entry["rating_received"] = (
			round(sum(received_ratings) / len(received_ratings), 1) if received_ratings else None
		)

		given = [p["review"] for p in projects if p["review"]]
		entry["review"] = given[0] if given else None

	return list(by_agency.values())

@frappe.whitelist()
def list_favorites():
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		return []
	favorites = frappe.get_all("FavoriteAgency", filters={"client": client_name}, fields=["agency", "date_added"])
	for fav in favorites:
		fav["agency_name"] = frappe.db.get_value("AgencyProfile", fav.agency, "agency_name")
	return favorites

@frappe.whitelist()
def toggle_favorite(agency=None):
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])
	from platform_core.platform_core.doctype.favoriteagency.favoriteagency import toggle

	return toggle(client_name, agency)

@frappe.whitelist()
def get_collaboration(collaboration_id=None):
	collaboration_id = require_body_arg(collaboration_id, "collaboration_id", _("Collaboration manquante"))
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		frappe.throw(_("Profil introuvable"))

	rows = frappe.db.sql(
		"""
		select p.name as project, p.title, p.budget_min, p.budget_max,
		       p.start_date, p.expected_end_date
		from `tabProject` p
		inner join `tabOpportunity` o on o.project = p.name and o.status = 'Terminée'
		where p.client = %s and p.status = 'Completed' and o.agency = %s
		order by p.expected_end_date desc
		""",
		(client_name, collaboration_id),
		as_dict=True,
	)
	if not rows:
		frappe.throw(_("Aucune collaboration Terminée trouvée avec cette agence"))

	projects = [{
		"project": row.project,
		"title": row.title,
		"budget_min": row.budget_min,
		"budget_max": row.budget_max,
		"period": f"{row.start_date} → {row.expected_end_date}",
	} for row in rows]

	review = frappe.get_all(
		"AgencyReview",
		filters={
			"agency": collaboration_id,
			"client": claims["sub"],
			"project": ["in", [row.project for row in rows]],
		},
		fields=["rating", "quality_score", "deadline_score", "communication_score",
		        "value_score", "understanding_score", "comment", "status", "creation"],
		order_by="creation desc",
		limit=1,
	)

	return {
		"agency": frappe.get_doc("AgencyProfile", collaboration_id).as_dict(),
		"projects": projects,
		"review": review[0] if review else None,
	}

@frappe.whitelist()
def get_dashboard():
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		frappe.throw(_("Profil introuvable"))

	profile = frappe.get_doc("ClientProfile", client_name)
	active_projects_count = frappe.db.count("Project", {"client": client_name, "status": "In Progress"})
	recent_projects = frappe.get_all(
		"Project", filters={"client": client_name}, fields=RECENT_PROJECT_FIELDS,
		order_by="creation desc", limit=5,
	)

	return {
		"trust_score": profile.trust_score,
		"projects_published_count": profile.projects_published_count,
		"response_rate": _agency_acceptance_rate(client_name),
		"active_projects_count": active_projects_count,
		"collaborations_count": len(list_collaborations()),
		"recent_projects": recent_projects,
	}

RESPONSE_RATE_WINDOW_DAYS = 90
RESPONSE_RATE_MIN_SAMPLE = 5

def _agency_acceptance_rate(client_name):
	project_names = frappe.get_all("Project", {"client": client_name}, pluck="name")
	if not project_names:
		return None
	since = frappe.utils.add_days(frappe.utils.now_datetime(), -RESPONSE_RATE_WINDOW_DAYS)
	total = frappe.db.count(
		"Opportunity",
		{"project": ["in", project_names], "creation": [">=", since]},
	)
	if total < RESPONSE_RATE_MIN_SAMPLE:
		return None
	accepted = frappe.db.count(
		"Opportunity",
		{
			"project": ["in", project_names],
			"creation": [">=", since],
			"status": ["not in", ["Reçue", "Archivée"]],
		},
	)
	return round(100 * accepted / total, 1)

@frappe.whitelist()
def request_phone_otp(phone=None):
	phone = require_body_arg(phone, "phone", _("Téléphone manquant"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])
	frappe.db.set_value("ClientProfile", client_name, "phone", phone)
	frappe.db.set_value("ClientProfile", client_name, "phone_verified", 0)

	code = f"{random.randint(0, 999999):06d}"
	frappe.cache().set_value(f"phoneotp:{claims['sub']}", code, expires_in_sec=PHONE_OTP_TTL_SECONDS)

	frappe.sendmail(
		recipients=[claims["sub"]],
		subject="Vérification de votre numéro de téléphone",
		message=(
			"[Repli email — SMS non configuré] Votre code de vérification téléphone : "
			f"<b>{code}</b> (valable 5 minutes)."
		),
		now=True,
	)
	return {"sent": True}

@frappe.whitelist()
def verify_phone_otp(code=None):
	code = require_body_arg(code, "code", _("Code manquant"))
	claims = require_user_type("client")
	cached = frappe.cache().get_value(f"phoneotp:{claims['sub']}")
	if not cached or str(cached) != str(code).strip():
		frappe.throw(_("Code invalide ou expiré"))
	frappe.cache().delete_value(f"phoneotp:{claims['sub']}")

	client_name = require_client_profile(claims["sub"])
	doc = frappe.get_doc("ClientProfile", client_name)
	doc.phone_verified = 1
	doc.save(ignore_permissions=True)
	return {"verified": True}

@frappe.whitelist()
def get_client_profile_for_agency(client=None):
	client = require_body_arg(client, "client", _("Client manquant"))
	require_active_agency()

	name = client if frappe.db.exists("ClientProfile", client) else frappe.db.exists(
		"ClientProfile", {"user": client}
	)
	if not name:
		frappe.throw(_("Client introuvable"))

	profile = frappe.get_doc("ClientProfile", name)
	reviews = frappe.get_all(
		"ClientReview",
		filters={"client": name},
		fields=["agency", "project", "rating", "comment", "creation"],
		order_by="creation desc",
		limit_page_length=50,
	)
	for row in reviews:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")

	return {
		"name": profile.name,
		"company_name": profile.company_name,
		"first_name": profile.first_name,
		"last_name": profile.last_name,
		"sector": profile.sector,
		"country": profile.country,
		"trust_score": profile.trust_score,
		"legal_id_verified": profile.legal_id_verified,
		"reviews": reviews,
	}

@frappe.whitelist()
def pay_agency_for_project(project=None, payment_method=None, provider_token=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	payment_method = require_body_arg(payment_method, "payment_method", _("Moyen de paiement manquant"))
	provider_token = require_body_arg(provider_token, "provider_token", _("Jeton du fournisseur manquant"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])

	project_doc = frappe.get_doc("Project", project)
	if project_doc.client != client_name:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	if project_doc.payment_status == "Payé":
		frappe.throw(_("Ce projet a déjà été réglé."))

	accepted = frappe.get_all(
		"Proposal",
		filters={"project": project, "agency": ["!=", ""], "status": "Accepted"},
		fields=["name", "agency", "amount"],
		order_by="decision_date desc",
		limit=1,
	)
	if not accepted:
		frappe.throw(_("Aucune offre acceptée trouvée pour ce projet."))
	accepted = accepted[0]

	payment = frappe.get_doc({
		"doctype": "ProjectPayment",
		"project": project,
		"proposal": accepted.name,
		"client": client_name,
		"agency": accepted.agency,
		"amount": accepted.amount,
		"payment_method": payment_method,
		"provider_token": provider_token,
	})
	payment.insert(ignore_permissions=True)
	return {"payment": payment.name, "status": payment.status, "amount": payment.amount}
