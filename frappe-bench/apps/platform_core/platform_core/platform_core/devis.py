# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Génération du devis (Proposal) PDF — même mécanisme que `cdc.py`, pour
que le client reçoive un document professionnel contenant les informations
de l'agence (nom, contact, TVA...) plutôt qu'un simple montant affiché en
base.

AJOUTÉ (demande explicite, migration) : le rendu passe désormais par le
Print Format Frappe "Devis" (cf. platform_core/print_format/devis/devis.json,
DocType Proposal) au lieu d'un template Jinja construit et rendu à la main
via `frappe.render_template`/`get_pdf` — le contexte (agence, client, lignes
du devis, totaux HT/TVA/TTC...) est calculé côté Print Format via
`Proposal.get_devis_context()`, appelé depuis son HTML Jinja."""

import frappe


def generate_devis(proposal_name):
	proposal = frappe.get_doc("Proposal", proposal_name)

	# BUG CORRIGÉ (cf. cdc.py, même cause) : `frappe.get_print()` retombe sur
	# `frappe.has_permission()` (fonction module, contrôle de rôle strict) qui
	# ne respecte PAS `frappe.flags.ignore_permissions` (essayé d'abord, sans
	# effet) — seul un changement d'utilisateur effectif fonctionne.
	previous_user = frappe.session.user
	frappe.set_user("Administrator")
	try:
		pdf_content = frappe.get_print(
			"Proposal", proposal_name, print_format="Devis", as_pdf=True, no_letterhead=1
		)
	finally:
		frappe.set_user(previous_user)

	file_doc = frappe.get_doc({
		"doctype": "File",
		"file_name": f"Devis-{proposal.name}.pdf",
		"attached_to_doctype": "Proposal",
		"attached_to_name": proposal.name,
		"attached_to_field": "devis_file",
		"content": pdf_content,
		"is_private": 1,
	})
	file_doc.insert(ignore_permissions=True)

	proposal.devis_file = file_doc.file_url
	proposal.save(ignore_permissions=True)
	return file_doc.file_url
