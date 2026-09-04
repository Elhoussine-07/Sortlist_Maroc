# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Opportunités (cf. §2.3) : pipeline commercial agence, workflow en deux étapes."""

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
	# AJOUTÉ : onglet distinct pour les opportunités que l'AGENCE a
	# elle-même initiées depuis "Disponibles" (`express_interest`, source
	# "Disponibles") — jusqu'ici mélangées dans "Offres" avec les contacts
	# directs venant du CLIENT (Unicast/Multicast/Shortlist IA), sans aucun
	# moyen de les distinguer dans l'UI. "Offres" ne garde maintenant QUE les
	# contacts client-initiés (cf. `list_opportunities`/`_tab_counts` plus
	# bas, qui filtrent/comptent par `source` en plus du statut).
	# "Reçue" incluse : une candidature fraîchement postulée (express_interest)
	# reste "Reçue" en attendant la décision du CLIENT (cf. express_interest,
	# api.project.respond_to_agency_application) — sans ça, l'agence ne verrait
	# nulle part la trace de son "Postuler" tant que le client n'a pas répondu.
	"Postulé": ["Reçue", "Acceptée", "Devis envoyé"],
	"Gagnées": ["Gagnée"],
	# BUG CORRIGÉ : "En pause" manquait ici — l'onglet existe côté frontend
	# (`agence.opportunites.tsx`, TABS) mais tout appel avec ce tab levait
	# "Onglet inconnu" (`if not statuses: frappe.throw(...)`).
	"En pause": ["En pause"],
	"Terminées": ["Terminée"],
	"Archivées": ["Archivée"],
}

# Onglets dont le statut seul ne suffit pas à trancher : "Acceptée"/"Devis
# envoyé" peuvent appartenir à "Offres" (contact client) ou "Postulé"
# (candidature agence), selon `Opportunity.source`.
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
	"""Compte les Opportunity par onglet (cf. TAB_STATUS) + les projets
	Disponibles (qui n'ont justement PAS d'Opportunity), en un seul aller-
	retour DB — utilisé pour les badges de `StatusTabs` côté frontend
	(`agence.opportunites.tsx`). BUG CORRIGÉ : `list_opportunities` ne
	renvoyait auparavant qu'une liste brute, sans compteurs du tout — tous
	les badges d'onglet affichaient "0" en permanence, quel que soit le
	contenu réel.

	BUG CORRIGÉ (v2) : un statut ("Acceptée"/"Devis envoyé") peut désormais
	appartenir à deux onglets différents selon `source` (cf.
	`SOURCE_SPLIT_TABS`) — le mapping statut→onglet unique d'origine ne
	pouvait pas représenter ça ; on regroupe par (statut, source) à la place."""
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
	# BUG CORRIGÉ : `tab` a une valeur par défaut ("Offres"), donc contrairement
	# aux paramètres obligatoires déjà corrigés ailleurs dans ce fichier
	# (`_required_opportunity` et consorts, cf. `auth.get_body_arg`), ce bug
	# ne plantait jamais avec une erreur visible — sur cette installation où
	# `frappe.form_dict` arrive vide pour les appels authentifiés, `tab`
	# retombait SILENCIEUSEMENT sur "Offres" quel que soit l'onglet cliqué
	# côté frontend (Gagnées, Postulé...). `counts` (calculé pour tous les
	# onglets indépendamment de `tab`) affichait donc les bons compteurs,
	# donnant l'illusion que les données existaient, alors que `results`/
	# `total` reflétaient toujours "Offres" à la place de l'onglet réellement
	# demandé. Même correctif que partout ailleurs : relecture explicite du
	# corps brut via `get_body_arg`, avec repli sur les mêmes défauts qu'avant.
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

	# cf. SOURCE_SPLIT_TABS : "Offres" (contact client) et "Postulé"
	# (candidature agence) partagent les mêmes statuts, distingués par source.
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

	# MODIFICATION ICI : Récupérer TOUS les champs du projet
	# AJOUTÉ : jointure sur Proposal (dernier devis "Sent" par opportunité) —
	# `agence.workflow.tsx`/`agence.opportunites.tsx` (colonnes "Devis"/"Temps
	# restant") lisent `quote_amount`/`remaining_hours`, jusqu'ici toujours
	# absents de cette réponse (donc toujours "—" côté UI, même quand un
	# devis avait bien été envoyé).
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

	# Transformer pour avoir un objet Project imbriqué
	# AJOUTÉ : pour une opportunité "Gagnée" (projet en cours), remaining_hours
	# reflète désormais le délai restant jusqu'à expected_end_date (déjà
	# recalculée pour intégrer les jours de suspension cumulés, cf.
	# Project.on_update/ProjectSuspension._resume_project) — jusqu'ici
	# toujours vide dès qu'aucun devis n'était en attente de réponse.
	# AJOUTÉ : pour l'onglet "Terminées", le frontend a besoin de savoir si
	# l'agence a déjà noté ce client (`agence.projets-en-cours.tsx` doit
	# afficher "Avis envoyé" au lieu de "Avis" une fois l'avis soumis, plutôt
	# que de laisser le bouton indéfiniment cliquable). Un seul aller-retour
	# DB pour toute la page, plutôt qu'une requête par ligne.
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
			# BUG CORRIGÉ : `expected_end_date` est un champ Date (pas Datetime,
			# aucune heure stockée) — comparé tel quel à `now`, il retombe sur
			# minuit DÉBUT du jour d'échéance plutôt que sa fin, ce qui
			# raccourcissait artificiellement le temps restant affiché (ex.
			# 13h au lieu de ~24h pour un délai d'1 jour, selon l'heure de
			# démarrage du projet). La date d'échéance reste valable jusqu'à
			# la fin de sa journée -> on compare au début du jour SUIVANT.
			end_of_deadline_day = frappe.utils.get_datetime(
				frappe.utils.add_days(row.project_expected_end_date, 1)
			)
			delta = end_of_deadline_day - now
			remaining_hours = max(round(delta.total_seconds() / 3600), 0)

		# BUG CORRIGÉ : cette réponse ne renvoyait que `project.client` (le NOM
		# du ClientProfile, ex. "CL-00003"), jamais de libellé lisible — côté
		# frontend, `mapProject` lit `partner_agency_name` (même champ générique
		# que côté client pour désigner "l'autre partie", cf. `project.py::
		# get_project`) pour la colonne/le modal "Client" de `agence.projets-
		# en-cours.tsx`, toujours absent ici -> toujours affiché "—", y compris
		# dans la modale "Laisser un avis" ("Client : —"). Réutilise
		# `_client_display_name` (déjà défini plus bas, utilisé par
		# `list_suspensions`).
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
	"""Onglet Disponibles (cf. §2.3) : « Vue exhaustive de tous les projets
	publics ... à explorer librement ». Classement de pertinence IA détaillé =
	responsabilité de matching-service (appelé projet par projet par le
	frontend, cf. docs/INTEGRATION.md) ; ici on renvoie simplement tous les
	projets Postulés auxquels l'agence active n'a pas encore d'Opportunity,
	triés par date de publication décroissante."""
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
	# BUG CORRIGÉ (demande explicite) : contrairement à `list_opportunities`,
	# cette réponse ne renvoyait jamais de nom de client lisible — seulement
	# via `p.client` ci-dessus (le NOM du ClientProfile, ex. "CL-00003"),
	# jamais sélectionné avant ce correctif. L'onglet "Disponibles" affichait
	# donc toujours le mot générique "Client" côté frontend, contrairement
	# aux autres onglets déjà corrigés.
	for row in results:
		row["client_name"] = _client_display_name(row.get("client"))
	counts = _tab_counts(claims["agency_id"])
	return {"results": results, "total": count, "page": page, "page_size": page_size, "counts": counts}


@frappe.whitelist(allow_guest=True)
def list_public_projects(budget_min=None, budget_max=None, sub_category=None, category=None,
	query=None, page=1, page_size=20):
	"""AJOUTÉ (demande explicite) : recherche publique de projets (page /projets,
	accessible sans connexion — client ET visiteur anonyme). BUG CORRIGÉ :
	`projects.service.ts::searchProjects` appelait déjà cette méthode
	(`opportunity.list_public_projects`), qui n'avait en réalité jamais été
	implémentée côté backend — seule `list_available_projects` (ci-dessus)
	existait, mais elle est réservée aux comptes Agence (`require_active_agency`)
	et exclut les projets pour lesquels l'agence a déjà une Opportunity, ce qui
	n'a aucun sens pour un visiteur public. Reprend la même logique de filtre
	que `list_available_projects`, sans restriction de rôle ni exclusion par
	agence."""
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
	"""Depuis l'onglet Disponibles : l'agence postule pour un projet public.
	BUG CORRIGÉ (x2) : (1) `project` était un paramètre positionnel obligatoire
	sans valeur par défaut — un appel dont le corps JSON n'apportait pas cette
	clé plantait avec un TypeError brut ("missing 1 required positional
	argument") avant même d'entrer dans la fonction, au lieu d'un message
	clair ; on valide désormais explicitement. (2) manifester son intérêt ne
	déclenchait aucune notification côté client (CDC : le client doit être
	informé qu'une agence a répondu à son projet) — ajoutée ci-dessous, sur le
	même modèle que `agency.signal_ready`.

	BUG CORRIGÉ (v2) : cette candidature était auto-acceptée
	(`opportunity.accept()` appelé immédiatement), sans que le CLIENT n'ait
	jamais son mot à dire sur une agence qui le contacte de sa propre
	initiative — contrairement au cas d'un contact client-initié (Unicast/
	Multicast/Shortlist IA) où c'est l'AGENCE qui accepte une offre reçue.
	La candidature reste maintenant "Reçue" jusqu'à ce que le client
	l'accepte ou la refuse explicitement (cf. `api.project.list_agency_
	applications`/`respond_to_agency_application`), avant que l'agence ne
	puisse envoyer un devis."""
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
	"""BUG CORRIGÉ (cf. `auth.get_body_arg` docstring) : `opportunity` était un
	paramètre positionnel obligatoire sans valeur par défaut — sur cette
	installation, `frappe.form_dict` arrive vide pour tout appel authentifié,
	donc `frappe.call(method, **frappe.form_dict)` plantait avec un TypeError
	brut ("missing N required positional arguments") avant même d'entrer
	dans la fonction. Même contournement qu'`express_interest` : valeur par
	défaut + relecture du corps brut via `get_body_arg`."""
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
	"""Sert directement le contenu du PDF du CDC, plutôt que l'URL Frappe
	`/private/files/...` renvoyée par `view_cdc` : ce fichier est attaché au
	`Project` (cf. `cdc.py::generate_cdc`), dont le système de permissions
	NATIF de Frappe n'autorise que le client propriétaire — il ne sait rien
	de la relation agence <-> Opportunity gérée par ce module, d'où un 403
	systématique pour toute agence qui n'est pas elle-même propriétaire du
	Project. L'autorisation est déjà entièrement faite ci-dessus via
	`_get_owned_opportunity` ; inutile (et incorrect) de la faire dépendre
	en plus des permissions Frappe sur `Project`/`File`."""
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
	"""cf. 1.4 / 2.3 : notation réciproque de l'agence envers le client.

	AJOUTÉ : `project` en alternative à `opportunity` — les listings agence
	(`list_opportunities`, consommé par `agency-projects.service.ts::
	getAgencyProjects`) exposent l'ID du Project imbriqué au frontend, pas
	l'ID de l'Opportunity elle-même ; plutôt que de modifier ce mapping en
	profondeur côté frontend, on résout ici l'Opportunity Terminée
	correspondante à partir du projet + de l'agence courante."""
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
	"""cf. 2.5.2 : signalement au support pour client inactif après paiement.
	Point d'entrée unifié (CDC v8 note C12) : crée un ProjectSuspension de
	catégorie « Litige », tranché ensuite par un modérateur via .resolve()
	(cf. doctype/projectsuspension). InactivityDispute est superseded."""
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
	"""cf. §1.3.1/§2.5 : suspensions/litiges concernant les projets où l'agence
	active a une Opportunity Gagnée/En pause. Forme alignée sur l'interface
	frontend `SuspensionCase` (cf. agency-projects.service.ts)."""
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
			# AJOUTÉ : distingue qui a initié la demande — nécessaire côté
			# frontend pour savoir si CETTE agence est la partie qui doit
			# décider d'une "Suspension amiable" (cf.
			# `respond_to_amicable_suspension` ci-dessous, CDC §1.5.2 précisé
			# à la demande : accord amiable = décision directe entre les deux
			# parties, litige = modérateur uniquement).
			"requested_by": row.requested_by,
			# AJOUTÉ (§2.5.3, correctif litige fondé) : un litige client jugé
			# fondé passe par un préavis agence de `suspension_grace_hours`
			# avant conséquences finales — cf. `respond_to_litige_notice`.
			"litige_notice_status": row.litige_notice_status or None,
			"agency_notice_deadline": row.agency_notice_deadline,
			"agency_response": row.agency_response,
		})
	return result


@frappe.whitelist()
def get_suspension_history(suspension=None):
	"""Même forme que `project.get_dispute`'s `history` (cf. sa docstring)."""
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
	"""L'agence répond à une suspension/un litige en cours — notifie le
	modérateur assigné (ou tous les Moderator si aucun assigné). `evidence_ids`
	est accepté pour compat frontend mais non persisté : ProjectSuspension n'a
	pas de table de pièces jointes dédiée dans ce périmètre."""
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
	"""L'agence accepte/refuse DIRECTEMENT une demande de « Suspension amiable »
	initiée par le client (CDC §1.5.2 précisé sur demande : un accord amiable
	entre les deux parties n'a pas besoin d'arbitrage neutre, contrairement à
	un « Litige » qui reste exclusivement tranché par un modérateur via
	`resolve()` — cf. `ProjectSuspension._assert_can_decide`). `message` est
	optionnel : simple trace de la réponse, comme `agency_response` déjà posé
	par `respond_to_suspension`."""
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
	"""§2.5.3, correctif sur demande explicite : quand un litige déposé par le
	client est jugé fondé, l'agence dispose d'un délai (cf. PlatformSettings.
	suspension_grace_hours) pour transmettre sa propre justification avant que
	le modérateur ne tranche définitivement (`moderation.resolve_litige_notice`)
	ou que le délai n'expire (`tasks.py::_escalate_expired_litige_notices`)."""
	suspension = require_body_arg(suspension, "suspension", _("Dossier manquant"))
	message = require_body_arg(message, "message", _("Message manquant"))

	claims = require_active_agency()
	doc = frappe.get_doc("ProjectSuspension", suspension)
	_assert_suspension_belongs_to_agency(doc, claims["agency_id"])

	return doc.record_agency_litige_response(message).as_dict()
