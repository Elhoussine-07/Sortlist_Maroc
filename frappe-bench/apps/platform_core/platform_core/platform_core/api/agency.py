# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Module Agence — Profil, Inscription/rattachement multi-agences, Analytics
(cf. §2.1, 2.1.1, 2.2, 2.4)."""

import frappe
from frappe import _

from platform_core.platform_core.auth import (
	assert_agency_member,
	get_body_dict,
	get_client_profile_name,
	optional_claims,
	require_active_agency,
	require_body_arg,
	require_user_type,
)
from platform_core.platform_core.doctype.agencyjoinrequest.agencyjoinrequest import request_to_join
from platform_core.platform_core.doctype.agencymember.agencymember import list_agencies_for_user

CHILD_TABLES = {
	"services": "AgencyService",
	"portfolio": "AgencyPortfolio",
	"team": "AgencyTeam",
	"certifications": "AgencyCertification",
	"social_links": "AgencySocialLink",
}

EDITABLE_FIELDS = [
	"agency_name", "logo", "slogan", "description", "year_founded", "team_size", "website",
	"languages", "remote_work", "cover_image", "coverage", "location", "annual_revenue",
	"country", "legal_id", "phone_country_code", "phone", "address", "email",
	# Section "Informations de facturation" (Paramètres agence) — cf. bug
	# corrigé côté frontend : ce formulaire appelait auparavant
	# `payment.register_payment_method` (moyen de paiement carte/IBAN, pas
	# des coordonnées de facturation) avec des champs qui n'existaient nulle
	# part côté backend.
	"billing_email", "vat_number", "billing_address",
]


@frappe.whitelist(allow_guest=True)
def get_profile(agency=None):
	"""Consultation publique d'un profil agence (cf. 4.1 : sans connexion).
	BUG CORRIGÉ : `agency` obligatoire sans défaut plantait avec un TypeError
	brut sur cette installation (cf. `auth.get_body_arg`)."""
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	if not frappe.db.exists("AgencyProfile", agency):
		frappe.throw(_("Agence introuvable"))
	doc = frappe.get_doc("AgencyProfile", agency).as_dict()
	log_profile_view(agency)
	return doc


@frappe.whitelist()
def get_my_profile():
	"""Profil de l'agence ACTIVE de l'utilisateur connecté (écrans d'édition :
	`agence.profil.tsx`, section facturation de `agence.parametres.tsx`) —
	résout l'agence côté serveur depuis le JWT (`require_active_agency`),
	exactement comme le fait déjà `update_profile`, plutôt que de dépendre
	d'un `agency` fourni par le frontend.

	BUG CORRIGÉ : ces écrans appelaient `get_profile` en lui passant
	`useAgencyStore.getState().activeAgencyId` (store frontend alimenté de
	façon ASYNCHRONE — hydratation localStorage + requête `getMyAgencies` —
	avec un repli sur l'ID UTILISATEUR, pas une agence, tant que non chargé).
	Toute lecture avant cette hydratation interrogeait donc soit la mauvaise
	agence, soit un identifiant qui n'en est même pas une — alors que la
	sauvegarde (`update_profile`, qui résout déjà correctement l'agence via
	le JWT) réussissait malgré tout. D'où l'illusion d'un enregistrement qui
	"ne prend pas" : c'était en fait la LECTURE qui ciblait autre chose."""
	claims = require_active_agency()
	return frappe.get_doc("AgencyProfile", claims["agency_id"]).as_dict()


def log_profile_view(agency):
	# BUG CORRIGÉ : `get_profile` (allow_guest) est appelé à CHAQUE chargement
	# de la page profil (navigation, rafraîchissement, retour arrière...) et
	# insérait auparavant une nouvelle `AgencyActivity` "Profile View" à
	# chaque appel, sans aucune déduplication — un même client consultant le
	# profil 5 fois dans la journée comptait pour 5 "vues" dans Analytics
	# (`profile_views`, cf. `analytics()`), gonflant artificiellement le
	# chiffre sans refléter un intérêt réel supplémentaire. On ne compte
	# désormais qu'UNE vue par client identifié et par jour — `AgencyActivity`
	# a déjà un champ `client` (Link ClientProfile) prévu pour ça, jamais
	# renseigné jusqu'ici. Les visiteurs anonymes (pas de session client) ne
	# sont pas dédupliqués ici faute d'identifiant fiable stocké sur ce
	# doctype (pas de champ IP) — cf. `VisitorLog`/prospection-service pour
	# le suivi détaillé par IP, qui a sa propre logique de fenêtre glissante.
	claims = optional_claims()
	client_name = None
	if claims and claims.get("user_type") == "client":
		client_name = get_client_profile_name(claims["sub"])

	already_viewed_today = bool(
		client_name
		and frappe.db.exists(
			"AgencyActivity",
			{
				"agency": agency,
				"client": client_name,
				"event_type": "Profile View",
				"creation": [">=", frappe.utils.today()],
			},
		)
	)

	if not already_viewed_today:
		frappe.get_doc({
			"doctype": "AgencyActivity",
			"agency": agency,
			"client": client_name,
			"event_type": "Profile View",
		}).insert(ignore_permissions=True)

	from platform_core.platform_core.doctype.visitorlog.visitorlog import log_action

	log_action(agency=agency, action="Consultation du profil", visitor_ip=frappe.local.request_ip)


@frappe.whitelist(allow_guest=True)
def list_agencies(query=None, category=None, location=None, page=1, page_size=20):
	"""Recherche publique simple (stub en attendant search-service, cf. INTEGRATION.md §1)."""
	from platform_core.platform_core.api.search import search_agencies

	return search_agencies(query=query, category=category, location=location, page=page, page_size=page_size)


@frappe.whitelist()
def update_profile(**fields):
	# BUG CORRIGÉ : `frappe.form_dict` arrive vide sur cette installation (cf.
	# `auth.get_body_arg`) — `**fields` ne plante pas dans ce cas (reçoit
	# juste {}), mais la fonction s'exécutait alors silencieusement sans rien
	# mettre à jour, sans aucune erreur visible côté agence.
	# BUG CORRIGÉ (v2) : ce repli ne se déclenchait qu'à `fields` totalement
	# vide — insuffisant si le bug de `frappe.form_dict` n'est que partiel
	# (certains champs arrivent, d'autres non). Fusion systématique : le
	# corps brut sert de base, les kwargs déjà reçus ont priorité.
	fields = {**get_body_dict(), **fields}
	claims = require_active_agency()
	agency = claims["agency_id"]
	doc = frappe.get_doc("AgencyProfile", agency)

	for field in EDITABLE_FIELDS:
		if field in fields:
			doc.set(field, fields[field])

	for table_field, child_doctype in CHILD_TABLES.items():
		if table_field in fields and isinstance(fields[table_field], list):
			doc.set(table_field, [])
			for row in fields[table_field]:
				doc.append(table_field, row)

	doc.save(ignore_permissions=True)
	doc.refresh_pqi()
	return frappe.get_doc("AgencyProfile", agency).as_dict()


@frappe.whitelist()
def my_agencies():
	claims = require_user_type("agency")
	return list_agencies_for_user(claims["sub"])


@frappe.whitelist()
def join_request(agency=None):
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	claims = require_user_type("agency")
	doc = request_to_join(claims["sub"], agency, context="Via Plus Button")
	return doc.as_dict()


@frappe.whitelist()
def list_join_requests():
	claims = require_active_agency()
	assert_agency_member(claims["sub"], claims["agency_id"])
	return frappe.get_all(
		"AgencyJoinRequest",
		filters={"agency": claims["agency_id"], "status": "Pending"},
		fields=["name", "user", "context", "creation"],
	)


@frappe.whitelist()
def my_join_requests():
	"""Demandes de rattachement envoyées par l'utilisateur courant, tous
	statuts confondus — miroir de `list_join_requests` (reçues côté agence)
	pour le suivi côté demandeur (`agence.invitations.tsx`, section "Mes
	demandes envoyées")."""
	claims = require_user_type("agency")
	rows = frappe.get_all(
		"AgencyJoinRequest",
		filters={"user": claims["sub"]},
		fields=["name", "agency", "status", "creation", "rejection_reason"],
		order_by="creation desc",
	)
	for row in rows:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
	return rows


@frappe.whitelist()
def approve_join_request(request_name=None):
	request_name = require_body_arg(request_name, "request_name", _("Demande manquante"))
	claims = require_active_agency()
	req = frappe.get_doc("AgencyJoinRequest", request_name)
	if req.agency != claims["agency_id"]:
		frappe.throw(_("Accès non autorisé"), frappe.PermissionError)
	assert_agency_member(claims["sub"], claims["agency_id"])
	return req.approve(decided_by=claims["sub"]).as_dict()


@frappe.whitelist()
def reject_join_request(request_name=None, reason=None):
	request_name = require_body_arg(request_name, "request_name", _("Demande manquante"))
	claims = require_active_agency()
	req = frappe.get_doc("AgencyJoinRequest", request_name)
	if req.agency != claims["agency_id"]:
		frappe.throw(_("Accès non autorisé"), frappe.PermissionError)
	assert_agency_member(claims["sub"], claims["agency_id"])
	return req.reject(decided_by=claims["sub"], reason=reason).as_dict()


@frappe.whitelist()
def list_members():
	claims = require_active_agency()
	return frappe.get_all(
		"AgencyMember",
		filters={"agency": claims["agency_id"], "status": "Active"},
		fields=["name", "user", "member_role", "joined_on"],
	)


def _fill_daily_series(rows_by_date, start):
	series = []
	d = frappe.utils.getdate(start)
	today = frappe.utils.getdate()
	while d <= today:
		series.append({"date": str(d), "value": rows_by_date.get(str(d), 0)})
		d = frappe.utils.add_days(d, 1)
	return series


def _variation_percent(series):
	"""Variation moyenne 7 derniers jours vs 7 jours précédents (arrondie)."""
	if len(series) < 14:
		return "0%"
	last7 = sum(p["value"] for p in series[-7:]) / 7
	prev7 = sum(p["value"] for p in series[-14:-7]) / 7
	if prev7 == 0:
		return "+100%" if last7 > 0 else "0%"
	delta = round(((last7 - prev7) / prev7) * 100)
	return f"{'+' if delta >= 0 else ''}{delta}%"


def _count_metric(doctype, date_field, conditions, params, days=30):
	"""Métrique {value, variation, series} basée sur un COMPTE d'évènements
	quotidien (vues profil, visites externes)."""
	start = frappe.utils.add_days(frappe.utils.today(), -(days - 1))
	rows = frappe.db.sql(
		f"select date({date_field}) as d, count(*) as c from `tab{doctype}` "
		f"where {conditions} and {date_field} >= %(start)s group by date({date_field})",
		{**params, "start": start},
		as_dict=True,
	)
	by_date = {str(r["d"]): r["c"] for r in rows}
	series = _fill_daily_series(by_date, start)
	total = frappe.db.sql(
		f"select count(*) from `tab{doctype}` where {conditions}", params,
	)[0][0]
	return {"value": total, "variation": _variation_percent(series), "series": series}


def _average_metric(doctype, value_field, date_field, conditions, params, days=30, round_to=1):
	"""Métrique {value, variation, series} basée sur une MOYENNE quotidienne
	(position de recherche, note moyenne)."""
	start = frappe.utils.add_days(frappe.utils.today(), -(days - 1))
	rows = frappe.db.sql(
		f"select date({date_field}) as d, avg({value_field}) as v from `tab{doctype}` "
		f"where {conditions} and {date_field} >= %(start)s group by date({date_field})",
		{**params, "start": start},
		as_dict=True,
	)
	by_date = {str(r["d"]): round(float(r["v"]), round_to) if r["v"] is not None else 0 for r in rows}
	series = _fill_daily_series(by_date, start)
	overall = frappe.db.sql(f"select avg({value_field}) from `tab{doctype}` where {conditions}", params)[0][0]
	value = round(float(overall), round_to) if overall else 0
	return {"value": value, "variation": _variation_percent(series), "series": series}


def _pqi_label(score):
	if score >= 80:
		return "Excellent"
	if score >= 60:
		return "Bon"
	if score >= 40:
		return "Moyen"
	return "À améliorer"


def _pqi_factors_and_recommendations(profile):
	criterion_labels = {row.name: row.label for row in frappe.get_all("PQICriterion", fields=["name", "label"])}
	factors = []
	recommendations = []
	for row in profile.pqi_details:
		label = criterion_labels.get(row.criterion, row.criterion)
		factors.append({"id": row.criterion, "label": label, "value": row.score or 0, "max": 20})
		if row.ai_recommendation:
			recommendations.append({"id": row.criterion, "title": label, "description": row.ai_recommendation})
	return factors, recommendations


@frappe.whitelist()
def analytics():
	"""cf. 2.4 : vues profil, opportunités, visibilité, note client, clics site web, PQI.

	BUG CORRIGÉ : cette fonction renvoyait des champs plats (`profile_views`
	en simple nombre, `average_search_position`, `client_rating`, pas de
	`pqi_details.factors`/`recommendations`/`external_visits`) alors que
	`analytics.service.ts` (frontend) attend, après camelCase :
	`profileViews`/`averagePosition`/`averageRating`/`externalVisits` sous
	la forme `{value, variation, series}`, et `pqiDetails` sous la forme
	`{label, factors, penaltyNote}`. Le mismatch de forme faisait échouer
	silencieusement `mapMetric()`/l'extraction de `factors` côté frontend
	(retombait sur des valeurs vides), d'où la page Analytics
	systématiquement à 0 / "Aucune donnée disponible" quel que soit le
	volume réel de données trackées (`AgencyActivity`, `VisitorLog`,
	`AgencyReview`)."""
	claims = require_active_agency()
	agency = claims["agency_id"]

	profile = frappe.get_doc("AgencyProfile", agency)

	profile_views = _count_metric(
		"AgencyActivity", "creation", "agency=%(agency)s and event_type='Profile View'", {"agency": agency}
	)
	external_visits = _count_metric("VisitorLog", "visit_date", "agency=%(agency)s", {"agency": agency})
	average_position = _average_metric(
		"AgencyActivity",
		"search_rank",
		"creation",
		"agency=%(agency)s and event_type='Search Impression'",
		{"agency": agency},
	)
	average_rating = _average_metric(
		"AgencyReview", "rating", "creation", "agency=%(agency)s and status='Approved'", {"agency": agency}
	)
	# `profile.rating` (moyenne consolidée, maintenue ailleurs à chaque avis
	# approuvé) fait foi pour la valeur "actuelle" affichée — la moyenne
	# glissante ci-dessus ne sert qu'à la courbe/variation.
	if profile.rating:
		average_rating["value"] = profile.rating

	website_clicks = frappe.db.count("AgencyActivity", {"agency": agency, "event_type": "Website Click"})
	opportunities_by_status = frappe.db.sql(
		"select status, count(*) from `tabOpportunity` where agency=%s group by status", (agency,), as_dict=False
	)

	pqi_factors, recommendations = _pqi_factors_and_recommendations(profile)

	return {
		"profile_views": profile_views,
		"average_position": average_position,
		"average_rating": average_rating,
		"external_visits": external_visits,
		"website_clicks": website_clicks,
		"reviews_count": profile.reviews_count,
		"pqi_score": profile.pqi_score,
		"pqi_details": {
			"label": _pqi_label(profile.pqi_score or 0),
			"factors": pqi_factors,
			# Aucune raison de pénalité stockée : `_penalize_agency_pqi` (cf.
			# doctype/projectsuspension) décrémente `pqi_score` directement
			# sans laisser de trace consultable ici.
			"penalty_note": None,
		},
		"recommendations": recommendations,
		"opportunities_by_status": dict(opportunities_by_status),
		"offers_suspended": profile.offers_suspended,
	}


@frappe.whitelist()
def refresh_pqi():
	claims = require_active_agency()
	doc = frappe.get_doc("AgencyProfile", claims["agency_id"])
	doc.refresh_pqi()
	return {"pqi_score": doc.pqi_score}


@frappe.whitelist(allow_guest=True)
def track_website_click(agency=None):
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	frappe.get_doc({"doctype": "AgencyActivity", "agency": agency, "event_type": "Website Click"}).insert(
		ignore_permissions=True
	)
	return {"tracked": True}


@frappe.whitelist(allow_guest=True)
def check_name_availability(name=None):
	"""Disponibilité du nom d'agence, utilisée à l'inscription (cf. 2.1) avant
	tout compte — recherche exacte insensible à la casse."""
	name = require_body_arg(name, "name", _("Nom manquant"))
	existing = frappe.db.sql(
		"select name from `tabAgencyProfile` where lower(agency_name) = lower(%s) limit 1",
		(name,),
	)
	return {
		"available": not existing,
		"existing_agency_id": existing[0][0] if existing else None,
	}


@frappe.whitelist()
def toggle_project_favorite(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_active_agency()
	from platform_core.platform_core.doctype.favoriteproject.favoriteproject import toggle

	return toggle(claims["agency_id"], project)


@frappe.whitelist()
def list_favorite_projects():
	claims = require_active_agency()
	favorites = frappe.get_all(
		"FavoriteProject", filters={"agency": claims["agency_id"]}, fields=["project", "date_added"]
	)
	for fav in favorites:
		project = frappe.db.get_value(
			"Project", fav.project,
			["title", "status", "need_type", "budget_min", "budget_max", "location"],
			as_dict=True,
		)
		if project:
			fav.update(project)
	return favorites


@frappe.whitelist()
def get_dashboard():
	"""cf. agence.tableau-de-bord : agrégat en un seul appel."""
	claims = require_active_agency()
	agency = claims["agency_id"]

	stats = analytics()
	opportunities_by_status = stats["opportunities_by_status"]
	open_statuses = ["Reçue", "Acceptée", "Devis envoyé"]
	open_opportunities_count = sum(opportunities_by_status.get(status, 0) for status in open_statuses)
	in_progress_count = opportunities_by_status.get("Gagnée", 0)

	recent_opportunities = frappe.db.sql(
		"""
		select o.name as opportunity, o.status, o.matching_score, o.creation,
		       p.name as project, p.title, p.budget_min, p.budget_max
		from `tabOpportunity` o
		inner join `tabProject` p on p.name = o.project
		where o.agency = %s
		order by o.creation desc
		limit 5
		""",
		(agency,),
		as_dict=True,
	)

	recent_activity = frappe.get_all(
		"AgencyActivity",
		filters={"agency": agency},
		fields=["event_type", "created_date", "creation"],
		order_by="creation desc",
		limit=10,
	)

	return {
		"pqi_score": stats["pqi_score"],
		"open_opportunities_count": open_opportunities_count,
		"in_progress_count": in_progress_count,
		"average_client_rating": stats["average_rating"]["value"],
		"recent_opportunities": recent_opportunities,
		"recent_activity": recent_activity,
	}
