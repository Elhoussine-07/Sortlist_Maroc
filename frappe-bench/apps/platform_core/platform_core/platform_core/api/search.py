# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Recherche publique — STUB temporaire en attendant search-service
(Elasticsearch, hors périmètre de cette itération, cf. docs/INTEGRATION.md §1).

Filtrage SQL simple, pas de compréhension sémantique du langage naturel.
À remplacer par un appel à search-service quand ce dernier sera implémenté.
"""

import frappe


@frappe.whitelist(allow_guest=True)
def search_agencies(query=None, category=None, location=None, page=1, page_size=20):
	page = int(page)
	page_size = int(page_size)
	conditions = ["1=1"]
	values = {}

	if query:
		conditions.append("(agency_name like %(query)s or description like %(query)s)")
		values["query"] = f"%{query}%"
	if location:
		conditions.append("location like %(location)s")
		values["location"] = f"%{location}%"
	if category:
		conditions.append(
			"name in (select parent from `tabAgencyService` where service_name like %(category)s)"
		)
		values["category"] = f"%{category}%"

	where_clause = " and ".join(conditions)
	# DÉSACTIVÉ (demande explicite, phase de test) : "where offers_suspended = 0"
	# rendait invisible dans la recherche publique toute agence ayant un jour
	# été flaguée par tasks.py::process_invoice_reminders (cf. proposal.py,
	# même correctif) — flag jamais remis à 0 automatiquement, y compris après
	# régularisation de la facture. Des agences avec un compte valide
	# disparaissaient donc silencieusement de "/agences", sans aucun message
	# d'erreur. À réactiver avec le filtre une fois un vrai mécanisme de levée
	# automatique en place.
	rows = frappe.db.sql(
		f"""
		select name, agency_name, logo, slogan, location, rating, pqi_score, reviews_count
		from `tabAgencyProfile`
		where ({where_clause})
		order by pqi_score desc, rating desc
		limit %(limit)s offset %(offset)s
		""",
		{**values, "limit": page_size, "offset": (page - 1) * page_size},
		as_dict=True,
	)

	for i, row in enumerate(rows):
		frappe.get_doc({
			"doctype": "AgencyActivity",
			"agency": row.name,
			"event_type": "Search Impression",
			"search_rank": (page - 1) * page_size + i + 1,
		}).insert(ignore_permissions=True)

	return {"results": rows, "page": page, "page_size": page_size, "provider": "stub-sql"}


@frappe.whitelist(allow_guest=True)
def search_natural_language(query):
	"""cf. 3.1 : sans search-service, on retombe sur une recherche mot-clé simple
	plutôt qu'une vraie compréhension d'intention — limitation assumée."""
	return search_agencies(query=query)
