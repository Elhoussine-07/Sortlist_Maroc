# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

# NOTE (CDC v8 note C12) : ce DocType est SUPERSEDED par
# ProjectSuspension.category="Litige" (cf. doctype/projectsuspension), qui
# fournit désormais le point d'entrée unique pour toute suspension/litige sur
# un projet En cours. Conservé tel quel (base de données, ancien historique)
# mais plus jamais créé/écrit par le code applicatif — voir
# api.opportunity.report_inactivity, api.project.report_agency_inactivity et
# api.moderation.resolve_dispute qui passent désormais par ProjectSuspension.


class InactivityDispute(Document):
	pass
