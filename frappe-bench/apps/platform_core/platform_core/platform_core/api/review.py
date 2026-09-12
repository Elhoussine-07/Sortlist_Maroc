
import frappe
from frappe import _

from platform_core.platform_core.auth import get_client_profile_name, require_body_arg, require_user_type

@frappe.whitelist()
def submit_agency_review(project=None, rating=None, quality_score=None, deadline_score=None,
	communication_score=None, value_score=None, understanding_score=None, comment=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	rating = require_body_arg(rating, "rating", _("Note manquante"))
	claims = require_user_type("client")
	project_doc = frappe.get_doc("Project", project)
	client_name = get_client_profile_name(claims["sub"])
	if not client_name or project_doc.client != client_name:
		frappe.throw(_("Accès non autorisé"), frappe.PermissionError)

	opportunity_agency = frappe.db.get_value("Opportunity", {"project": project, "status": ["in", ("Gagnée", "Terminée")]}, "agency")
	if not opportunity_agency:
		frappe.throw(_("Aucune agence associée à ce projet"))

	review = frappe.get_doc({
		"doctype": "AgencyReview",
		"client": claims["sub"],
		"agency": opportunity_agency,
		"project": project,
		"rating": rating,
		"quality_score": quality_score,
		"deadline_score": deadline_score,
		"communication_score": communication_score,
		"value_score": value_score,
		"understanding_score": understanding_score,
		"comment": comment,
		"status": "Pending",
	})
	review.insert(ignore_permissions=True)
	return review.as_dict()

@frappe.whitelist(allow_guest=True)
def list_agency_reviews(agency=None, page=1, page_size=10):
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	page = int(page)
	page_size = int(page_size)
	rows = frappe.get_all(
		"AgencyReview",
		filters={"agency": agency, "status": "Approved"},
		fields=["client", "project", "rating", "quality_score", "deadline_score", "communication_score",
		        "value_score", "understanding_score", "comment", "creation"],
		order_by="creation desc",
		limit_start=(page - 1) * page_size,
		limit_page_length=page_size,
	)
	for row in rows:
		client_email = row.pop("client", None)
		profile = frappe.db.get_value(
			"ClientProfile", {"user": client_email},
			["company_name", "first_name", "last_name"], as_dict=True,
		) if client_email else None
		if profile and profile.company_name:
			row["client_name"] = profile.company_name
		elif profile and (profile.first_name or profile.last_name):
			row["client_name"] = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
		else:
			row["client_name"] = "Client vérifié"
		row["project_title"] = frappe.db.get_value("Project", row["project"], "title") if row["project"] else None
	return rows

@frappe.whitelist()
def list_client_reviews(page=1, page_size=10):
	page = int(page)
	page_size = int(page_size)
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		return []
	rows = frappe.get_all(
		"ClientReview",
		filters={"client": client_name},
		fields=["name", "agency", "project", "rating", "comment", "creation"],
		order_by="creation desc",
		limit_start=(page - 1) * page_size,
		limit_page_length=page_size,
	)
	for row in rows:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
		row["project_title"] = frappe.db.get_value("Project", row["project"], "title") if row["project"] else None
	return rows
