
import frappe
from frappe import _

from platform_core.platform_core.auth import (
	assert_agency_member,
	current_claims,
	get_body_arg,
	get_body_dict,
	get_client_profile_name,
	require_active_agency,
	require_body_arg,
	require_client_profile,
	require_user_type,
)

DISPUTE_STATUS_LABELS = {
	"None": "Aucun litige/suspension en cours",
	"Requested": "Demande en attente de traitement",
	"Validated": "Suspension validée",
	"Refused": "Demande refusée",
	"Resumed": "Projet repris",
	"Founded": "Litige jugé fondé",
	"Not Founded": "Litige jugé non fondé",
}

BRIEF_FIELDS = [
	"need_type", "category", "sub_category", "budget_min", "budget_max",
	"location", "delivery_delay_days", "description", "title", "cover_image",
]

def _assert_owner(project_doc, user):
	client_name = get_client_profile_name(user)
	if not client_name or project_doc.client != client_name:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

NEED_TYPE_LABELS = {"Projet": "projet", "Stage": "stage", "Job": "job"}

def _default_project_title(fields):
	need_type = fields.get("need_type") or "Projet"
	category_id = fields.get("category")
	category_name = (
		frappe.db.get_value("ServiceCategory", category_id, "category_name") if category_id else None
	)
	if category_name:
		return f"Demande {category_name}"
	return f"Nouvelle demande de {NEED_TYPE_LABELS.get(need_type, need_type.lower())}"

def create_draft(client, channel="Smart Briefing", **fields):
	client_name = require_client_profile(client)
	doc = frappe.get_doc({
		"doctype": "Project",
		"client": client_name,
		"channel": channel,
		"status": "Draft",
		"title": fields.get("title") or _default_project_title(fields),
		**{k: v for k, v in fields.items() if k in BRIEF_FIELDS},
	})
	doc.insert(ignore_permissions=True)
	return doc

def generate_cdc_if_project(project_doc):
	if project_doc.need_type == "Projet":
		from platform_core.platform_core.cdc import generate_cdc

		generate_cdc(project_doc.name)
		return frappe.get_doc("Project", project_doc.name)
	return project_doc

@frappe.whitelist()
def update_brief(project=None, **fields):
	project = require_body_arg(project, "project", _("Projet manquant"))
	fields = {**get_body_dict(), **fields}
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.cdc_locked:
		frappe.throw(_("Le CDC est verrouillé : le projet a démarré"))

	for field in BRIEF_FIELDS:
		if field in fields:
			doc.set(field, fields[field])
	doc.save(ignore_permissions=True)
	doc = generate_cdc_if_project(doc)
	return doc.as_dict()

@frappe.whitelist()
def post_project(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.status != "Draft":
		frappe.throw(_("Ce projet est déjà publié"))
	doc.status = "Posted"
	doc.save(ignore_permissions=True)
	return doc.as_dict()

@frappe.whitelist()
def my_projects(status=None):
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		return []
	filters = {"client": client_name}
	if status:
		filters["status"] = status
	rows = frappe.get_all(
		"Project",
		filters=filters,
		fields=["name", "title", "description", "status", "rejection_substatus", "need_type",
		        "channel", "category", "sub_category", "location", "budget_min", "budget_max",
		        "expected_end_date", "cover_image", "creation"],
		order_by="creation desc",
	)
	for row in rows:
		row["category_name"] = (
			frappe.db.get_value("ServiceCategory", row["category"], "category_name")
			if row["category"]
			else None
		)
		agency = _linked_agency(row["name"])
		row["agency"] = agency
		row["partner_agency_name"] = (
			frappe.db.get_value("AgencyProfile", agency, "agency_name") if agency else None
		)

		if not agency:
			declined = frappe.get_all(
				"Opportunity",
				filters={
					"project": row["name"],
					"status": "Archivée",
					"archive_reason": ["in", ["Refus agence", "Refus client"]],
				},
				fields=["agency"],
				order_by="modified desc",
				limit=1,
			)
			declined_agency = declined[0].agency if declined else None
			row["declined_by_agency"] = declined_agency
			row["declined_by_agency_name"] = (
				frappe.db.get_value("AgencyProfile", declined_agency, "agency_name")
				if declined_agency
				else None
			)
		else:
			row["declined_by_agency"] = None
			row["declined_by_agency_name"] = None
	return rows

@frappe.whitelist()
def get_project(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))

	claims = current_claims()
	doc = frappe.get_doc("Project", project)
	if claims.get("user_type") == "client":
		_assert_owner(doc, claims["sub"])
	data = doc.as_dict()
	data["active_notifications_count"] = frappe.db.count(
		"Notification", {"recipient": claims["sub"], "reference_doctype": "Project", "reference_name": project, "is_read": 0}
	)
	agency = _linked_agency(project)
	data["agency"] = agency
	data["partner_agency_name"] = (
		frappe.db.get_value("AgencyProfile", agency, "agency_name") if agency else None
	)

	accepted = frappe.get_all(
		"Proposal",
		filters={"project": project, "status": "Accepted"},
		fields=["amount"],
		order_by="decision_date desc",
		limit=1,
	)
	data["agency_project_amount"] = accepted[0].amount if accepted else None

	return data

@frappe.whitelist()
def delete_project(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	if doc.status not in ("Draft", "Posted"):
		frappe.throw(_("Seuls les projets Brouillon ou Postulé peuvent être supprimés."))

	for opportunity_name in frappe.get_all(
		"Opportunity",
		filters={"project": project, "status": ["not in", ["Gagnée", "Terminée", "Archivée"]]},
		pluck="name",
	):
		frappe.db.set_value("Opportunity", opportunity_name, {
			"status": "Archivée",
			"archive_reason": "Projet supprimé par le client",
		})

	return doc.reject("Supprimé").as_dict()

@frappe.whitelist()
def repost(project=None, include_previously_declined=False):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	include_previously_declined = bool(int(include_previously_declined)) if not isinstance(
		include_previously_declined, bool
	) else include_previously_declined
	return doc.repost(include_previously_declined=include_previously_declined).as_dict()

@frappe.whitelist()
def request_suspension(project=None, justification=None, category="Suspension amiable"):
	project = require_body_arg(project, "project", _("Projet manquant"))
	justification = require_body_arg(justification, "justification", _("Justification manquante"))
	category = get_body_arg("category", category)
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import request_suspension as _request

	suspension = _request(project, requested_by="Client", category=category, justification=justification)
	return suspension.as_dict()

@frappe.whitelist()
def report_agency_inactivity(project=None, message=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	message = require_body_arg(message, "message", _("Message manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import request_suspension as _request

	suspension = _request(project, requested_by="Client", category="Litige", justification=message)
	return suspension.as_dict()

@frappe.whitelist()
def resume(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.status != "Suspended":
		frappe.throw(_("Ce projet n'est pas suspendu"))

	suspension_name = frappe.db.get_value(
		"ProjectSuspension", {"project": project, "status": "Validated"}, "name", order_by="creation desc"
	)
	if not suspension_name:
		frappe.throw(_("Aucune suspension active trouvée pour ce projet"))
	return frappe.get_doc("ProjectSuspension", suspension_name).resume().as_dict()

@frappe.whitelist()
def confirm_completion(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	doc.completion_confirmed_by_client = 1
	doc.save(ignore_permissions=True)

	from platform_core.platform_core.notify import notify

	for moderator in frappe.get_all("Has Role", filters={"role": "Moderator", "parenttype": "User"}, pluck="parent"):
		notify(
			recipient=moderator,
			category="Autre",
			title=f"Validation finale requise — « {doc.title} »",
			body="Le client a confirmé la fin du projet. Validez le passage définitif au statut Terminé.",
			link=f"/moderation/completions/{project}",
		)
	return doc.as_dict()

@frappe.whitelist()
def get_pending_proposals(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	proposals = frappe.get_all(
		"Proposal",
		filters={"project": project, "status": "Sent"},
		fields=["name", "agency", "amount", "description", "submitted_date",
		        "response_deadline", "extended_deadline", "devis_file"],
		order_by="submitted_date asc",
		ignore_permissions=True,
	)
	for row in proposals:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
	return proposals

@frappe.whitelist()
def download_cdc(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if not doc.cdc_file:
		frappe.throw(_("Aucun CDC disponible pour ce projet"))

	file_doc = frappe.get_doc("File", {"file_url": doc.cdc_file})
	frappe.local.response.filename = file_doc.file_name
	frappe.local.response.filecontent = file_doc.get_content()
	frappe.local.response.type = "download"

@frappe.whitelist()
def download_devis(proposal=None):
	proposal = require_body_arg(proposal, "proposal", _("Devis manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Proposal", proposal)
	project = frappe.get_doc("Project", doc.project)
	_assert_owner(project, claims["sub"])
	if not doc.devis_file:
		frappe.throw(_("Aucun devis disponible pour cette proposition"))

	file_doc = frappe.get_doc("File", {"file_url": doc.devis_file})
	frappe.local.response.filename = file_doc.file_name
	frappe.local.response.filecontent = file_doc.get_content()
	frappe.local.response.type = "download"

@frappe.whitelist()
def respond_to_quote(proposal=None, decision=None, message=None):
	proposal = require_body_arg(proposal, "proposal", _("Devis manquant"))
	decision = require_body_arg(decision, "decision", _("Décision manquante"))
	message = get_body_arg("message", message)
	claims = require_user_type("client")
	doc = frappe.get_doc("Proposal", proposal)
	project = frappe.get_doc("Project", doc.project)
	_assert_owner(project, claims["sub"])

	if decision == "accept":
		return doc.accept().as_dict()
	elif decision == "refuse":
		return doc.refuse(message=message).as_dict()
	frappe.throw(_("Décision invalide : accept ou refuse attendu"))

@frappe.whitelist()
def list_agency_applications(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	rows = frappe.get_all(
		"Opportunity",
		filters={"project": project, "source": "Disponibles", "status": "Reçue"},
		fields=["name", "agency", "creation"],
		order_by="creation desc",
	)
	for row in rows:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
	return rows

@frappe.whitelist()
def respond_to_agency_application(opportunity=None, decision=None):
	opportunity = require_body_arg(opportunity, "opportunity", _("Candidature manquante"))
	decision = require_body_arg(decision, "decision", _("Décision manquante"))
	claims = require_user_type("client")

	doc = frappe.get_doc("Opportunity", opportunity)
	project = frappe.get_doc("Project", doc.project)
	_assert_owner(project, claims["sub"])
	if doc.source != "Disponibles":
		frappe.throw(_("Cette opportunité n'est pas une candidature spontanée d'agence"))
	if doc.status != "Reçue":
		frappe.throw(_("Cette candidature a déjà été traitée"))

	if decision == "accept":
		return doc.accept().as_dict()
	elif decision == "refuse":
		return doc.decline(reason="Refus client").as_dict()
	frappe.throw(_("Décision invalide : accept ou refuse attendu"))

def _linked_agency(project):
	return frappe.db.get_value(
		"Opportunity", {"project": project, "status": ["in", ["Gagnée", "En pause"]]}, "agency"
	)

def _client_or_linked_agency_allowed(project, claims):
	client_name = get_client_profile_name(claims["sub"])
	if client_name and frappe.db.get_value("Project", project, "client") == client_name:
		return True

	agency = _linked_agency(project)
	if agency and frappe.db.exists(
		"AgencyMember", {"user": claims["sub"], "agency": agency, "status": "Active"}
	):
		return True
	return False

def _suspension_history(doc):
	history = [{
		"id": f"{doc.name}-request",
		"date": frappe.utils.get_datetime_str(doc.creation),
		"title": "Demande déposée",
		"description": doc.justification,
	}]

	decision_date = doc.validation_date
	if not decision_date and doc.status in ("Refused", "Founded", "Not Founded"):
		decision_date = doc.modified

	if decision_date:
		history.append({
			"id": f"{doc.name}-decision",
			"date": frappe.utils.get_datetime_str(decision_date),
			"title": "Décision du modérateur",
			"description": doc.decision_note or DISPUTE_STATUS_LABELS.get(doc.status, doc.status),
		})

	if doc.resume_date:
		history.append({
			"id": f"{doc.name}-resume",
			"date": frappe.utils.get_datetime_str(doc.resume_date),
			"title": "Projet repris",
			"description": f"Projet repris après {doc.suspension_days or 0} jour(s) de suspension.",
		})

	return history

@frappe.whitelist()
def get_dispute(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = current_claims()
	if not _client_or_linked_agency_allowed(project, claims):
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	suspension_name = frappe.get_all(
		"ProjectSuspension", filters={"project": project}, order_by="creation desc", limit=1, pluck="name"
	)
	if not suspension_name:
		return {"status": "None", "status_label": DISPUTE_STATUS_LABELS["None"], "history": [], "category": None}

	doc = frappe.get_doc("ProjectSuspension", suspension_name[0])
	return {
		"status": doc.status,
		"status_label": DISPUTE_STATUS_LABELS.get(doc.status, doc.status),
		"history": _suspension_history(doc),
		"category": doc.category,
	}

@frappe.whitelist()
def relaunch_search(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])
	doc = frappe.get_doc("Project", project)
	if doc.client != client_name:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	if doc.status != "Rejected" or doc.rejection_substatus != "Agence défaillante":
		frappe.throw(
			_("Ce projet ne peut être relancé que suite à un litige gagné pour « Agence défaillante »")
		)

	doc.status = "Posted"
	doc.shortlist_ia = None
	doc.repost_count = (doc.repost_count or 0) + 1
	doc.save(ignore_permissions=True)
	return {"project": doc.name}

@frappe.whitelist()
def signal_ready(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_active_agency()
	agency_id = claims["agency_id"]
	assert_agency_member(claims["sub"], agency_id)

	linked_agency = _linked_agency(project)
	if linked_agency != agency_id:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	ready = frappe.db.exists(
		"ProjectSuspension",
		{"project": project, "category": "Suspension amiable", "status": "Validated"},
	)
	if not ready:
		latest_suspension = frappe.get_all(
			"ProjectSuspension",
			filters={"project": project},
			fields=["category", "status"],
			order_by="creation desc",
			limit_page_length=1,
		)
		category = latest_suspension[0].category if latest_suspension else None
		if category == "Non-paiement":
			frappe.throw(
				_("Ce projet est suspendu pour facture de commission impayée. "
				  "Réglez la facture de commission (1% du projet, due à la plateforme) "
				  "pour que le projet reprenne automatiquement.")
			)
		if category == "Litige":
			frappe.throw(
				_("Ce projet est suspendu suite à un litige : la reprise n'est possible qu'après "
				  "la décision du modérateur.")
			)
		frappe.throw(
			_("Ce projet n'est pas dans un état permettant de signaler que vous êtes prêt")
		)

	doc = frappe.get_doc("Project", project)

	from platform_core.platform_core.notify import notify

	client_user = frappe.db.get_value("ClientProfile", doc.client, "user") if doc.client else None
	if client_user:
		notify(
			recipient=client_user,
			category="Statut projet",
			title=f"L'agence est prête — « {doc.title} »",
			body=f"L'agence a signalé être prête à reprendre le projet « {doc.title} ».",
			link=f"/client/projects/{project}",
			reference_doctype="Project",
			reference_name=project,
			channel="Both",
		)
	return {"notified": True}
