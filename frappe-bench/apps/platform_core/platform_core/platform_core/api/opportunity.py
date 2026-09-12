
import frappe
from frappe import _

from platform_core.platform_core.auth import (
	assert_agency_member,
	get_body_arg,
	require_active_agency,
	require_body_arg,
)
from platform_core.platform_core.doctype.opportunity.opportunity import create_from_project

TAB_STATUS = {
	"Offres": ["Reçue", "Acceptée", "Devis envoyé"],
	"Postulé": ["Reçue", "Acceptée", "Devis envoyé"],
	"Gagnées": ["Gagnée"],
	"En pause": ["En pause"],
	"Terminées": ["Terminée"],
	"Archivées": ["Archivée"],
}

SOURCE_SPLIT_TABS = {
	"Offres": lambda source: source != "Disponibles",
	"Postulé": lambda source: source == "Disponibles",
}

def _get_owned_opportunity(opportunity_name, claims):
	doc = frappe.get_doc("Opportunity", opportunity_name)
	if doc.agency != claims["agency_id"]:
		frappe.throw(_("Accès non autorisé à cette opportunité"), frappe.PermissionError)
	return doc

def _tab_counts(agency):
	rows = frappe.db.sql(
		"select status, source, count(*) as cnt from `tabOpportunity` where agency = %(agency)s group by status, source",
		{"agency": agency},
		as_dict=True,
	)
	counts = dict.fromkeys(TAB_STATUS, 0)
	for row in rows:
		for tab_name, statuses in TAB_STATUS.items():
			if row.status not in statuses:
				continue
			split = SOURCE_SPLIT_TABS.get(tab_name)
			if split and not split(row.source):
				continue
			counts[tab_name] += row.cnt

	counts["Disponibles"] = frappe.db.sql(
		"""
		select count(*)
		from `tabProject` p
		where p.status = 'Posted' and p.client is not null
		  and not exists (
		    select 1 from `tabOpportunity` o where o.project = p.name and o.agency = %(agency)s
		  )
		""",
		{"agency": agency},
	)[0][0]
	return counts

PERIOD_TO_DAYS = {"7d": 7, "30d": 30, "90d": 90}

SORT_TO_ORDER_BY = {
	"recent": "o.creation desc",
	"deadline": "p.expected_end_date asc",
	"budget": "p.budget_max desc",
}

@frappe.whitelist()
def list_opportunities(tab=None, budget_min=None, budget_max=None, location=None,
	sub_category=None, need_type=None, query=None, client=None, period=None, sort=None,
	page=None, page_size=None):
	tab = get_body_arg("tab", "Offres")
	budget_min = get_body_arg("budget_min", budget_min)
	budget_max = get_body_arg("budget_max", budget_max)
	location = get_body_arg("location", location)
	sub_category = get_body_arg("sub_category", sub_category)
	need_type = get_body_arg("need_type", need_type)
	query = get_body_arg("query", query)
	client = get_body_arg("client", client)
	period = get_body_arg("period", period)
	sort = get_body_arg("sort", sort)
	page = get_body_arg("page", page) or 1
	page_size = get_body_arg("page_size", page_size) or 20

	claims = require_active_agency()
	statuses = TAB_STATUS.get(tab)
	if not statuses:
		frappe.throw(_("Onglet inconnu"))

	conditions = ["o.agency = %(agency)s", "o.status in %(statuses)s"]
	values = {"agency": claims["agency_id"], "statuses": tuple(statuses)}

	if tab == "Offres":
		conditions.append("(o.source is null or o.source != 'Disponibles')")
	elif tab == "Postulé":
		conditions.append("o.source = 'Disponibles'")

	if budget_min:
		conditions.append("p.budget_max >= %(budget_min)s")
		values["budget_min"] = budget_min
	if budget_max:
		conditions.append("p.budget_min <= %(budget_max)s")
		values["budget_max"] = budget_max
	if location:
		conditions.append("p.location like %(location)s")
		values["location"] = f"%{location}%"
	if sub_category:
		conditions.append("p.sub_category = %(sub_category)s")
		values["sub_category"] = sub_category
	if need_type:
		conditions.append("p.need_type = %(need_type)s")
		values["need_type"] = need_type
	if query:
		conditions.append("p.title like %(query)s")
		values["query"] = f"%{query}%"
	if client:
		conditions.append("p.client like %(client)s")
		values["client"] = f"%{client}%"
	if period and period in PERIOD_TO_DAYS:
		conditions.append("p.creation >= %(period_from)s")
		values["period_from"] = frappe.utils.add_days(frappe.utils.now(), -PERIOD_TO_DAYS[period])

	order_by = SORT_TO_ORDER_BY.get(sort, "o.creation desc")
	page = max(int(page or 1), 1)
	page_size = min(max(int(page_size or 20), 1), 100)

	results = frappe.db.sql(
		f"""
		select
			o.name as opportunity_id,
			o.status as opportunity_status,
			o.matching_score,
			o.success_prediction,
			o.source,
			o.creation as opportunity_created_on,
			-- Tous les champs du projet
			p.name as project_id,
			p.title as project_title,
			p.need_type as project_need_type,
			p.budget_min as project_budget_min,
			p.budget_max as project_budget_max,
			p.location as project_location,
			p.sub_category as project_sub_category,
			p.category as project_category,
			p.client as project_client,
			p.creation as project_created_on,
			p.status as project_status,
			p.description as project_description,
			p.expected_end_date as project_expected_end_date,
			p.cdc_file as project_cdc_file,
			pr.amount as quote_amount,
			pr.response_deadline as quote_response_deadline
		from `tabOpportunity` o
		inner join `tabProject` p on p.name = o.project
		left join `tabProposal` pr on pr.name = (
			select pr2.name from `tabProposal` pr2
			where pr2.opportunity = o.name and pr2.status = 'Sent'
			order by pr2.creation desc limit 1
		)
		where {" and ".join(conditions)}
		order by {order_by}
		limit %(limit)s offset %(offset)s
		""",
		{**values, "limit": page_size, "offset": (page - 1) * page_size},
		as_dict=True,
	)

	project_ids = [row.project_id for row in results]
	reviewed_project_ids = set(
		frappe.get_all(
			"ClientReview",
			filters={"agency": claims["agency_id"], "project": ["in", project_ids]},
			pluck="project",
		)
	) if project_ids else set()

	now = frappe.utils.now_datetime()
	formatted_results = []
	for row in results:
		remaining_hours = None
		if row.quote_response_deadline:
			delta = frappe.utils.get_datetime(row.quote_response_deadline) - now
			remaining_hours = max(round(delta.total_seconds() / 3600), 0)
		elif row.opportunity_status == "Gagnée" and row.project_expected_end_date:
			end_of_deadline_day = frappe.utils.get_datetime(
				frappe.utils.add_days(row.project_expected_end_date, 1)
			)
			delta = end_of_deadline_day - now
			remaining_hours = max(round(delta.total_seconds() / 3600), 0)

		partner_name = _client_display_name(row.project_client)

		opportunity = {
			"id": row.opportunity_id,
			"status": row.opportunity_status,
			"matching_score": row.matching_score,
			"success_prediction": row.success_prediction,
			"source": row.source,
			"creation": row.opportunity_created_on,
			"quote_amount": row.quote_amount,
			"remaining_hours": remaining_hours,
			"project": {
				"id": row.project_id,
				"title": row.project_title,
				"need_type": row.project_need_type,
				"budget_min": row.project_budget_min,
				"budget_max": row.project_budget_max,
				"location": row.project_location,
				"sub_category": row.project_sub_category,
				"category": row.project_category,
				"client": row.project_client,
				"partner_agency_name": partner_name,
				"reviewed_by_agency": row.project_id in reviewed_project_ids,
				"created_on": row.project_created_on,
				"status": row.project_status,
				"description": row.project_description,
				"expected_end_date": row.project_expected_end_date,
				"cdc_file": row.project_cdc_file
			}
		}
		formatted_results.append(opportunity)

	counts = _tab_counts(claims["agency_id"])
	return {
		"results": formatted_results,
		"total": counts.get(tab, len(formatted_results)),
		"counts": counts,
		"page": page,
		"page_size": page_size,
	}

@frappe.whitelist()
def list_available_projects(budget_min=None, budget_max=None, location=None, sub_category=None,
	need_type=None, query=None, category=None, page=1, page_size=20):
	claims = require_active_agency()

	conditions = ["p.status = 'Posted'", "p.client is not null"]
	values = {"agency": claims["agency_id"]}

	if budget_min:
		conditions.append("p.budget_max >= %(budget_min)s")
		values["budget_min"] = budget_min
	if budget_max:
		conditions.append("p.budget_min <= %(budget_max)s")
		values["budget_max"] = budget_max
	if location:
		conditions.append("p.location like %(location)s")
		values["location"] = f"%{location}%"
	if sub_category:
		conditions.append("p.sub_category = %(sub_category)s")
		values["sub_category"] = sub_category
	if need_type:
		conditions.append("p.need_type = %(need_type)s")
		values["need_type"] = need_type
	if category:
		conditions.append("p.category = %(category)s")
		values["category"] = category
	if query:
		conditions.append("(p.title like %(query)s or p.description like %(query)s)")
		values["query"] = f"%{query}%"

	page = max(int(page or 1), 1)
	page_size = min(max(int(page_size or 20), 1), 100)
	count = frappe.db.sql(
		f"""
		select count(*)
		from `tabProject` p
		where {" and ".join(conditions)}
		  and not exists (
		    select 1 from `tabOpportunity` o where o.project = p.name and o.agency = %(agency)s
		  )
		""",
		values,
	)[0][0]

	results = frappe.db.sql(
		f"""
		select p.name as project, p.title, p.need_type, p.budget_min, p.budget_max, p.location,
		       p.sub_category, p.category, p.cover_image, p.client, p.creation as project_created_on
		from `tabProject` p
		where {" and ".join(conditions)}
		  and not exists (
		    select 1 from `tabOpportunity` o where o.project = p.name and o.agency = %(agency)s
		  )
		order by p.creation desc
		limit %(limit)s offset %(offset)s
		""",
		{**values, "limit": page_size, "offset": (page - 1) * page_size},
		as_dict=True,
	)
	for row in results:
		row["client_name"] = _client_display_name(row.get("client"))
	counts = _tab_counts(claims["agency_id"])
	return {"results": results, "total": count, "page": page, "page_size": page_size, "counts": counts}

@frappe.whitelist(allow_guest=True)
def list_public_projects(budget_min=None, budget_max=None, sub_category=None, category=None,
	query=None, page=1, page_size=20):
	conditions = ["p.status = 'Posted'", "p.client is not null"]
	values = {}

	if budget_min:
		conditions.append("p.budget_max >= %(budget_min)s")
		values["budget_min"] = budget_min
	if budget_max:
		conditions.append("p.budget_min <= %(budget_max)s")
		values["budget_max"] = budget_max
	if sub_category:
		conditions.append("p.sub_category = %(sub_category)s")
		values["sub_category"] = sub_category
	if category:
		conditions.append("p.category = %(category)s")
		values["category"] = category
	if query:
		conditions.append("(p.title like %(query)s or p.description like %(query)s)")
		values["query"] = f"%{query}%"

	page = max(int(page or 1), 1)
	page_size = min(max(int(page_size or 20), 1), 100)
	count = frappe.db.sql(
		f"""
		select count(*)
		from `tabProject` p
		where {" and ".join(conditions)}
		""",
		values,
	)[0][0]

	results = frappe.db.sql(
		f"""
		select p.name as project, p.title, p.need_type, p.budget_min, p.budget_max, p.location,
		       p.sub_category, p.category, p.status, p.cover_image, p.creation as project_created_on
		from `tabProject` p
		where {" and ".join(conditions)}
		order by p.creation desc
		limit %(limit)s offset %(offset)s
		""",
		{**values, "limit": page_size, "offset": (page - 1) * page_size},
		as_dict=True,
	)
	return {"results": results, "total": count, "page": page, "page_size": page_size}

@frappe.whitelist()
def express_interest(project=None):
	if not project:
		project = get_body_arg("project")
	if not project:
		frappe.throw(_("Projet manquant"))

	claims = require_active_agency()
	project_doc = frappe.get_doc("Project", project)
	if project_doc.status != "Posted":
		frappe.throw(_("Ce projet n'est plus disponible"))

	opportunity = create_from_project(project, claims["agency_id"], source="Disponibles")

	client_user = (
		frappe.db.get_value("ClientProfile", project_doc.client, "user") if project_doc.client else None
	)
	if client_user:
		agency_name = frappe.db.get_value("AgencyProfile", claims["agency_id"], "agency_name")
		from platform_core.platform_core.notify import notify

		notify(
			recipient=client_user,
			category="Nouvelle opportunité",
			title=f"Une agence est intéressée par « {project_doc.title} »",
			body=f"{agency_name or 'Une agence'} souhaite répondre à votre projet — acceptez ou refusez sa candidature.",
			link=f"/client/mes-projets/{project}",
			reference_doctype="Project",
			reference_name=project,
			channel="Both",
		)

	return opportunity.as_dict()

def _required_opportunity(opportunity):
	if not opportunity:
		opportunity = get_body_arg("opportunity")
	if not opportunity:
		frappe.throw(_("Opportunité manquante"))
	return opportunity

@frappe.whitelist()
def view_cdc(opportunity=None):
	opportunity = _required_opportunity(opportunity)
	claims = require_active_agency()
	doc = _get_owned_opportunity(opportunity, claims)
	project = frappe.get_doc("Project", doc.project)
	return {"cdc_file": project.cdc_file}

@frappe.whitelist()
def download_cdc(opportunity=None):
	opportunity = _required_opportunity(opportunity)
	claims = require_active_agency()
	doc = _get_owned_opportunity(opportunity, claims)
	project = frappe.get_doc("Project", doc.project)
	if not project.cdc_file:
		frappe.throw(_("Aucun CDC disponible pour cette opportunité"))

	file_doc = frappe.get_doc("File", {"file_url": project.cdc_file})
	frappe.local.response.filename = file_doc.file_name
	frappe.local.response.filecontent = file_doc.get_content()
	frappe.local.response.type = "download"

@frappe.whitelist()
def accept(opportunity=None):
	opportunity = _required_opportunity(opportunity)
	claims = require_active_agency()
	doc = _get_owned_opportunity(opportunity, claims)
	return doc.accept().as_dict()

@frappe.whitelist()
def cancel_acceptance(opportunity=None):
	opportunity = _required_opportunity(opportunity)
	claims = require_active_agency()
	doc = _get_owned_opportunity(opportunity, claims)
	return doc.cancel_acceptance().as_dict()

@frappe.whitelist()
def decline(opportunity=None):
	opportunity = _required_opportunity(opportunity)
	claims = require_active_agency()
	doc = _get_owned_opportunity(opportunity, claims)
	return doc.decline(reason="Refus agence").as_dict()

@frappe.whitelist()
def send_quote(opportunity=None, amount=None, description=None, devis_file=None):
	opportunity = _required_opportunity(opportunity)
	if amount in (None, ""):
		amount = get_body_arg("amount")
	if amount in (None, ""):
		frappe.throw(_("Montant du devis manquant"))
	if description is None:
		description = get_body_arg("description")
	if devis_file is None:
		devis_file = get_body_arg("devis_file")

	claims = require_active_agency()
	doc = _get_owned_opportunity(opportunity, claims)

	from platform_core.platform_core.doctype.proposal.proposal import send_quote as _send_quote

	proposal = _send_quote(doc.name, amount, description, devis_file)
	return proposal.as_dict()

@frappe.whitelist()
def review_client(opportunity=None, project=None, rating=None, comment=None):
	opportunity = get_body_arg("opportunity", opportunity)
	project = get_body_arg("project", project)
	if not opportunity and not project:
		frappe.throw(_("Projet ou opportunité manquant"))
	if rating in (None, ""):
		rating = get_body_arg("rating")
	if rating in (None, ""):
		frappe.throw(_("Note manquante"))
	if comment is None:
		comment = get_body_arg("comment")

	claims = require_active_agency()
	if opportunity:
		doc = _get_owned_opportunity(opportunity, claims)
	else:
		opportunity_name = frappe.db.get_value(
			"Opportunity", {"project": project, "agency": claims["agency_id"], "status": "Terminée"}, "name"
		)
		if not opportunity_name:
			frappe.throw(_("Aucune opportunité Terminée trouvée pour ce projet"))
		doc = frappe.get_doc("Opportunity", opportunity_name)
	if doc.status != "Terminée":
		frappe.throw(_("Seule une opportunité Terminée peut être notée"))

	project = frappe.get_doc("Project", doc.project)
	review = frappe.get_doc({
		"doctype": "ClientReview",
		"agency": claims["agency_id"],
		"client": project.client,
		"project": project.name,
		"rating": rating,
		"comment": comment,
	})
	review.insert(ignore_permissions=True)
	return review.as_dict()

@frappe.whitelist()
def report_inactivity(project=None, message=None):
	if not project:
		project = get_body_arg("project")
	if not project:
		frappe.throw(_("Projet manquant"))
	if not message:
		message = get_body_arg("message")
	if not message:
		frappe.throw(_("Message manquant"))

	claims = require_active_agency()
	assert_agency_member(claims["sub"], claims["agency_id"])

	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import request_suspension

	suspension = request_suspension(project, requested_by="Agency", category="Litige", justification=message)
	return suspension.as_dict()

def _client_display_name(client_profile_name):
	if not client_profile_name:
		return None
	profile = frappe.db.get_value(
		"ClientProfile", client_profile_name, ["company_name", "first_name", "last_name"], as_dict=True
	)
	if not profile:
		return None
	return profile.company_name or f"{profile.first_name or ''} {profile.last_name or ''}".strip()

def _assert_suspension_belongs_to_agency(suspension_doc, agency):
	linked_agency = frappe.db.get_value(
		"Opportunity", {"project": suspension_doc.project, "status": ["in", ["Gagnée", "En pause"]]}, "agency"
	)
	if linked_agency != agency:
		frappe.throw(_("Accès non autorisé à cette suspension"), frappe.PermissionError)

@frappe.whitelist()
def list_suspensions(tab=None):
	claims = require_active_agency()

	from platform_core.platform_core.api.project import DISPUTE_STATUS_LABELS

	projects = frappe.get_all(
		"Opportunity", filters={"agency": claims["agency_id"], "status": ["in", ["Gagnée", "En pause"]]},
		pluck="project",
	)
	if not projects:
		return []

	filters = {"project": ["in", projects]}
	if tab:
		filters["status"] = tab

	rows = frappe.get_all(
		"ProjectSuspension", filters=filters,
		fields=[
			"name", "project", "justification", "category", "status", "creation", "moderator", "requested_by",
			"litige_notice_status", "agency_notice_deadline", "agency_response",
		],
		order_by="creation desc",
	)

	result = []
	for row in rows:
		project_doc = frappe.db.get_value("Project", row.project, ["title", "client"], as_dict=True)
		result.append({
			"id": row.name,
			"project_title": project_doc.title if project_doc else None,
			"client_name": _client_display_name(project_doc.client) if project_doc else None,
			"reason": row.justification,
			"category": row.category,
			"status": row.status,
			"status_label": DISPUTE_STATUS_LABELS.get(row.status, row.status),
			"opened_at": row.creation,
			"moderator": row.moderator,
			"requested_by": row.requested_by,
			"litige_notice_status": row.litige_notice_status or None,
			"agency_notice_deadline": row.agency_notice_deadline,
			"agency_response": row.agency_response,
		})
	return result

@frappe.whitelist()
def get_suspension_history(suspension=None):
	if not suspension:
		suspension = get_body_arg("suspension")
	if not suspension:
		frappe.throw(_("Suspension manquante"))

	claims = require_active_agency()
	doc = frappe.get_doc("ProjectSuspension", suspension)
	_assert_suspension_belongs_to_agency(doc, claims["agency_id"])

	from platform_core.platform_core.api.project import _suspension_history

	return _suspension_history(doc)

@frappe.whitelist()
def respond_to_suspension(suspension=None, message=None, evidence_ids=None):
	if not suspension:
		suspension = get_body_arg("suspension")
	if not suspension:
		frappe.throw(_("Suspension manquante"))
	if not message:
		message = get_body_arg("message")
	if not message:
		frappe.throw(_("Message manquant"))
	if evidence_ids is None:
		evidence_ids = get_body_arg("evidence_ids")

	claims = require_active_agency()
	doc = frappe.get_doc("ProjectSuspension", suspension)
	_assert_suspension_belongs_to_agency(doc, claims["agency_id"])

	doc.agency_response = message
	doc.agency_response_date = frappe.utils.now()
	doc.save(ignore_permissions=True)

	from platform_core.platform_core.notify import notify

	recipients = [doc.moderator] if doc.moderator else frappe.get_all(
		"Has Role", filters={"role": "Moderator", "parenttype": "User"}, pluck="parent"
	)
	for recipient in recipients:
		notify(
			recipient=recipient,
			category="Litige" if doc.category == "Litige" else "Suspension",
			title=f"Réponse de l'agence — suspension {doc.name}",
			body=message,
			link=f"/admin/litiges?id={doc.name}",
			reference_doctype="ProjectSuspension",
			reference_name=doc.name,
		)

	return {"id": suspension, "status": "responded"}

@frappe.whitelist()
def respond_to_amicable_suspension(suspension=None, decision=None, message=None):
	if not suspension:
		suspension = get_body_arg("suspension")
	if not suspension:
		frappe.throw(_("Suspension manquante"))
	if not decision:
		decision = get_body_arg("decision")
	if not decision:
		frappe.throw(_("Décision manquante"))
	if message is None:
		message = get_body_arg("message")

	claims = require_active_agency()
	doc = frappe.get_doc("ProjectSuspension", suspension)
	_assert_suspension_belongs_to_agency(doc, claims["agency_id"])

	if doc.category != "Suspension amiable":
		frappe.throw(_("Seule une demande de Suspension amiable peut être décidée directement par l'agence — un Litige est tranché par un modérateur."))
	if doc.requested_by != "Client":
		frappe.throw(_("Cette demande n'a pas été initiée par le client."))
	if doc.status != "Requested":
		frappe.throw(_("Cette demande a déjà été traitée."))

	if message:
		doc.agency_response = message
		doc.agency_response_date = frappe.utils.now()

	if decision == "accept":
		doc.approve()
	elif decision == "refuse":
		doc.refuse()
	else:
		frappe.throw(_("Décision invalide : accept ou refuse attendu"))

	return doc.as_dict()

@frappe.whitelist()
def respond_to_litige_notice(suspension=None, message=None):
	suspension = require_body_arg(suspension, "suspension", _("Dossier manquant"))
	message = require_body_arg(message, "message", _("Message manquant"))

	claims = require_active_agency()
	doc = frappe.get_doc("ProjectSuspension", suspension)
	_assert_suspension_belongs_to_agency(doc, claims["agency_id"])

	return doc.record_agency_litige_response(message).as_dict()
