
import frappe
from frappe import _

from platform_core.platform_core.auth import get_body_arg, require_body_arg, require_user_type

def _require_moderator():
	return require_user_type("moderator", "admin")

def _enrich_suspension_row(row):
	row["project_title"] = frappe.db.get_value("Project", row["project"], "title")
	client_user = frappe.db.get_value("Project", row["project"], "client")
	if client_user:
		first = frappe.db.get_value("ClientProfile", client_user, "first_name") or ""
		last = frappe.db.get_value("ClientProfile", client_user, "last_name") or ""
		company = frappe.db.get_value("ClientProfile", client_user, "company_name")
		row["client_name"] = company or f"{first} {last}".strip() or client_user
	else:
		row["client_name"] = None
	agency = frappe.db.get_value(
		"Opportunity",
		{"project": row["project"], "status": ["in", ["Gagnée", "En pause"]]},
		"agency",
	)
	row["agency_name"] = frappe.db.get_value("AgencyProfile", agency, "agency_name") if agency else None
	return row

@frappe.whitelist()
def list_pending_suspensions():
	_require_moderator()
	rows = frappe.get_all(
		"ProjectSuspension",
		filters={"status": "Requested"},
		fields=["name", "project", "category", "requested_by", "justification", "creation"],
	)
	return [_enrich_suspension_row(row) for row in rows]

@frappe.whitelist()
def approve_suspension(suspension=None):
	suspension = require_body_arg(suspension, "suspension", _("Suspension manquante"))
	claims = _require_moderator()
	return frappe.get_doc("ProjectSuspension", suspension).approve(moderator=claims["sub"]).as_dict()

@frappe.whitelist()
def refuse_suspension(suspension=None):
	suspension = require_body_arg(suspension, "suspension", _("Suspension manquante"))
	claims = _require_moderator()
	return frappe.get_doc("ProjectSuspension", suspension).refuse(moderator=claims["sub"]).as_dict()

@frappe.whitelist()
def list_pending_disputes():
	_require_moderator()
	rows = frappe.get_all(
		"ProjectSuspension",
		filters={"status": "Requested", "category": "Litige"},
		fields=["name", "project", "category", "requested_by", "justification", "creation"],
	)
	return [_enrich_suspension_row(row) for row in rows]

@frappe.whitelist()
def list_pending_litige_notices():
	_require_moderator()
	rows = frappe.get_all(
		"ProjectSuspension",
		filters={
			"category": "Litige",
			"requested_by": "Client",
			"litige_notice_status": ["in", ["Pending", "Responded"]],
		},
		fields=[
			"name", "project", "category", "requested_by", "justification", "creation",
			"litige_notice_status", "agency_notice_deadline", "agency_response", "agency_response_date",
		],
	)
	return [_enrich_suspension_row(row) for row in rows]

@frappe.whitelist()
def resolve_litige_notice(suspension=None, accept_agency_justification=None, decision_note=None):
	suspension = require_body_arg(suspension, "suspension", _("Dossier manquant"))
	accept_agency_justification = get_body_arg("accept_agency_justification", accept_agency_justification)
	decision_note = get_body_arg("decision_note", decision_note)
	if accept_agency_justification is None or accept_agency_justification == "":
		frappe.throw(_("Décision manquante"))
	accept = str(accept_agency_justification).strip().lower() in ("1", "true", "accept", "accepte", "accepté")

	claims = _require_moderator()
	doc = frappe.get_doc("ProjectSuspension", suspension)
	return doc.resolve_litige_notice(accept, moderator=claims["sub"], decision_note=decision_note).as_dict()

@frappe.whitelist()
def resolve_dispute(dispute=None, founded=None, decision_note=None):
	dispute = require_body_arg(dispute, "dispute", _("Litige manquant"))
	founded = require_body_arg(founded, "founded", _("Verdict manquant"))
	claims = _require_moderator()
	founded = bool(int(founded)) if not isinstance(founded, bool) else founded
	return frappe.get_doc("ProjectSuspension", dispute).resolve(
		founded=founded, moderator=claims["sub"], decision_note=decision_note
	).as_dict()

@frappe.whitelist()
def list_pending_join_requests():
	_require_moderator()
	rows = frappe.get_all(
		"AgencyJoinRequest", filters={"status": "Pending"}, fields=["name", "user", "agency", "context", "creation"]
	)
	return [r for r in rows if frappe.db.count("AgencyMember", {"agency": r.agency, "status": "Active"}) <= 1]

@frappe.whitelist()
def approve_join_request(request_name=None):
	request_name = require_body_arg(request_name, "request_name", _("Demande manquante"))
	claims = _require_moderator()
	return frappe.get_doc("AgencyJoinRequest", request_name).approve(decided_by=claims["sub"]).as_dict()

@frappe.whitelist()
def reject_join_request(request_name=None, reason=None):
	request_name = require_body_arg(request_name, "request_name", _("Demande manquante"))
	claims = _require_moderator()
	return frappe.get_doc("AgencyJoinRequest", request_name).reject(decided_by=claims["sub"], reason=reason).as_dict()

@frappe.whitelist()
def list_pending_completions():
	_require_moderator()
	return frappe.get_all(
		"Project",
		filters={"status": "In Progress", "completion_confirmed_by_client": 1, "completion_validated_by_moderator": 0},
		fields=["name", "title", "client", "expected_end_date"],
	)

@frappe.whitelist()
def validate_completion(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	_require_moderator()
	doc = frappe.get_doc("Project", project)
	if not doc.completion_confirmed_by_client:
		frappe.throw(_("Le client n'a pas encore confirmé la fin du projet"))

	doc.completion_validated_by_moderator = 1
	doc.complete()

	if doc.status != "Completed":
		frappe.throw(
			_(
				"Le projet a été suspendu : la facture de commission de l'agence n'est pas "
				"réglée. Il ne peut pas passer Terminé tant qu'elle ne l'est pas."
			)
		)

	opportunity_name = frappe.db.get_value("Opportunity", {"project": project, "status": "Gagnée"}, "name")
	if opportunity_name:
		frappe.get_doc("Opportunity", opportunity_name).mark_completed()

	from platform_core.platform_core.notify import notify

	client_user = frappe.db.get_value("ClientProfile", doc.client, "user") if doc.client else None
	if client_user:
		notify(
			recipient=client_user,
			category="Statut projet",
			title=f"Projet « {doc.title} » terminé",
			body="Vous pouvez désormais laisser un avis à l'agence depuis Collaborations.",
			link=f"/client/collaborations",
			channel="Both",
		)
	return doc.as_dict()

@frappe.whitelist()
def list_pending_reviews():
	_require_moderator()
	rows = frappe.get_all(
		"AgencyReview", filters={"status": "Pending"},
		fields=["name", "client", "agency", "project", "rating", "comment", "creation"],
	)
	for row in rows:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
		client_name = frappe.db.get_value("ClientProfile", {"user": row["client"]}, "name")
		row["client_profile"] = client_name
		if client_name:
			first = frappe.db.get_value("ClientProfile", client_name, "first_name") or ""
			last = frappe.db.get_value("ClientProfile", client_name, "last_name") or ""
			company = frappe.db.get_value("ClientProfile", client_name, "company_name")
			row["client_name"] = company or f"{first} {last}".strip() or row["client"]
		else:
			row["client_name"] = row["client"]
	return rows

@frappe.whitelist()
def list_recent_client_reviews():
	_require_moderator()
	rows = frappe.get_all(
		"ClientReview",
		fields=["name", "client", "agency", "project", "rating", "comment", "creation"],
		order_by="creation desc",
		limit_page_length=50,
	)
	for row in rows:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
		row["client_profile"] = row["client"]
		first = frappe.db.get_value("ClientProfile", row["client"], "first_name") or ""
		last = frappe.db.get_value("ClientProfile", row["client"], "last_name") or ""
		company = frappe.db.get_value("ClientProfile", row["client"], "company_name")
		row["client_name"] = company or f"{first} {last}".strip() or row["client"]
	return rows

@frappe.whitelist()
def moderate_review(review=None, approve=1):
	review = require_body_arg(review, "review", _("Avis manquant"))
	approve = get_body_arg("approve", approve)
	_require_moderator()
	doc = frappe.get_doc("AgencyReview", review)
	doc.status = "Approved" if int(approve) else "Rejected"
	doc.is_verified = 1
	doc.save(ignore_permissions=True)
	return doc.as_dict()

def _resolve_account_users(account_type, target):
	if account_type == "agency":
		if not frappe.db.exists("AgencyProfile", target):
			frappe.throw(_("Agence introuvable"))
		users = frappe.get_all("AgencyMember", filters={"agency": target, "status": "Active"}, pluck="user")
		if not users:
			frappe.throw(_("Aucun utilisateur actif rattaché à cette agence"))
		return users
	if account_type == "client":
		user = frappe.db.get_value("ClientProfile", target, "user")
		if not user:
			frappe.throw(_("Client introuvable"))
		return [user]
	frappe.throw(_("Type de compte invalide (\"client\" ou \"agency\" attendu)"))

@frappe.whitelist()
def suspend_account(account_type=None, target=None, reason=None):
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	reason = get_body_arg("reason", reason)
	_require_moderator()

	users = _resolve_account_users(account_type, target)
	for user in users:
		frappe.db.set_value("User", user, "enabled", 0)

	from platform_core.platform_core.notify import notify

	for user in users:
		notify(
			recipient=user,
			category="Autre",
			title="Compte suspendu",
			body=reason or "Votre compte a été suspendu par un modérateur.",
			channel="Both",
		)

	return {"account_type": account_type, "target": target, "suspended_users": users}

@frappe.whitelist()
def reactivate_account(account_type=None, target=None):
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	_require_moderator()

	users = _resolve_account_users(account_type, target)
	for user in users:
		frappe.db.set_value("User", user, "enabled", 1)

	return {"account_type": account_type, "target": target, "reactivated_users": users}

@frappe.whitelist()
def flag_account(account_type=None, target=None, reason=None):
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	reason = require_body_arg(reason, "reason", _("Motif manquant"))
	_require_moderator()

	doctype = {"agency": "AgencyProfile", "client": "ClientProfile"}.get(account_type)
	if not doctype:
		frappe.throw(_("Type de compte invalide (\"client\" ou \"agency\" attendu)"))
	if not frappe.db.exists(doctype, target):
		frappe.throw(_("Compte introuvable"))

	frappe.db.set_value(doctype, target, {"account_flagged": 1, "flag_reason": reason})
	return {"account_type": account_type, "target": target, "flagged": True}

@frappe.whitelist()
def unflag_account(account_type=None, target=None):
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	_require_moderator()

	doctype = {"agency": "AgencyProfile", "client": "ClientProfile"}.get(account_type)
	if not doctype:
		frappe.throw(_("Type de compte invalide (\"client\" ou \"agency\" attendu)"))

	frappe.db.set_value(doctype, target, {"account_flagged": 0, "flag_reason": ""})
	return {"account_type": account_type, "target": target, "flagged": False}
