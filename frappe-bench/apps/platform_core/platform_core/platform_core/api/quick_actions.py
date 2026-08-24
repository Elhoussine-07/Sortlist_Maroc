# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Actions rapides — Unicast / Multicast avec génération automatique du CDC
(cf. §1.3.2 et 1.3.2 bis)."""

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
	"""Prépare le formulaire de contact direct (Unicast ou Multicast) : crée un
	Project brouillon et, pour le type Projet, génère immédiatement le CDC pour
	relecture avant envoi (cf. 1.3.2 bis)."""
	# BUG CORRIGÉ (v2) : repli désormais systématique (pas seulement à
	# `fields` totalement vide) — le bug de `frappe.form_dict` peut n'être que
	# partiel (certains champs du brief arrivent, d'autres non).
	# .pop("need_type") : évite un doublon avec le paramètre nommé ci-dessous
	# (create_draft reçoit need_type=... explicitement) — le corps brut le
	# porte aussi, il faut l'exclure pour ne pas provoquer un "multiple
	# values for argument".
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
	"""cf. 1.3.2 : contact direct à une seule agence, même workflow que Postuler."""
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
	"""cf. 1.3.2 : même CDC envoyé à l'identique à toutes les agences sélectionnées."""
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
	"""Le client contacte directement une agence depuis la Shortlist IA (cf. 1.3.4)."""
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
