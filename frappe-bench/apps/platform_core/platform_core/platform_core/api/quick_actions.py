
import frappe
from frappe import _

from platform_core.platform_core.api.project import (
	BRIEF_FIELDS,
	_assert_owner,
	create_draft,
	generate_cdc_if_project,
)
from platform_core.platform_core.auth import get_body_dict, require_body_arg, require_user_type
from platform_core.platform_core.doctype.opportunity.opportunity import create_from_project

@frappe.whitelist()
def start_contact(need_type=None, **fields):
	raw_fields = get_body_dict()
	raw_fields.pop("need_type", None)
	fields = {**raw_fields, **fields}
	need_type = require_body_arg(need_type, "need_type", _("Type de besoin manquant"))
	claims = require_user_type("client")
	doc = create_draft(claims["sub"], channel="Unicast", need_type=need_type, **{
		k: v for k, v in fields.items() if k in BRIEF_FIELDS
	})
	doc = generate_cdc_if_project(doc)
	return doc.as_dict()

@frappe.whitelist()
def send_unicast(project=None, agency=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.status != "Draft":
		frappe.throw(_("Ce projet a déjà été envoyé"))

	doc.channel = "Unicast"
	doc.status = "Posted"
	doc.save(ignore_permissions=True)

	opportunity = create_from_project(project, agency, source="Unicast")
	return {"project": doc.name, "opportunity": opportunity.name}

@frappe.whitelist()
def send_multicast(project=None, agencies=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	agencies = require_body_arg(agencies, "agencies", _("Agences manquantes"))
	claims = require_user_type("client")
	if isinstance(agencies, str):
		agencies = frappe.parse_json(agencies)
	if not agencies:
		frappe.throw(_("Sélectionnez au moins une agence"))

	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.status != "Draft":
		frappe.throw(_("Ce projet a déjà été envoyé"))

	doc.channel = "Multicast"
	doc.status = "Posted"
	doc.save(ignore_permissions=True)

	opportunities = [create_from_project(project, agency, source="Multicast").name for agency in agencies]
	return {"project": doc.name, "opportunities": opportunities}

@frappe.whitelist()
def contact_from_shortlist(project=None, agency=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	shortlist_score = 0
	if doc.shortlist_ia:
		shortlist = doc.shortlist_ia if isinstance(doc.shortlist_ia, list) else frappe.parse_json(doc.shortlist_ia)
		for row in shortlist:
			if row.get("agency") == agency:
				shortlist_score = row.get("score", 0)

	opportunity = create_from_project(project, agency, source="Shortlist IA", matching_score=shortlist_score)
	return {"opportunity": opportunity.name}
