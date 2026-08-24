# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Recherche publique — STUB temporaire en attendant search-service
(Elasticsearch, hors périmètre de cette itération, cf. docs/INTEGRATION.md §1).

Filtrage SQL simple, pas de compréhension sémantique du langage naturel.
À remplacer par un appel à search-service quand ce dernier sera implémenté.
"""

import frappe

from platform_core.platform_core.auth import get_body_arg


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
	rows = frappe.db.sql(
		f"""
		select name, agency_name, logo, slogan, location, rating, pqi_score, reviews_count
		from `tabAgencyProfile`
		where offers_suspended = 0 and ({where_clause})
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
def search_natural_language(query=None):
	"""cf. 3.1 : sans search-service, on retombe sur une recherche mot-clé simple
	plutôt qu'une vraie compréhension d'intention — limitation assumée."""
	if not query:
		query = get_body_arg("query")
	return search_agencies(query=query)
