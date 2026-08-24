# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Module Entreprise (Client) — Mon Profil, Collaborations (cf. §1.1, 1.4)."""

import random

import frappe
from frappe import _

from platform_core.platform_core.auth import (
	get_body_dict,
	get_client_profile_name,
	require_active_agency,
	require_body_arg,
	require_client_profile,
	require_user_type,
)

PHONE_OTP_TTL_SECONDS = 5 * 60

RECENT_PROJECT_FIELDS = [
	"name", "title", "status", "rejection_substatus", "need_type", "channel",
	"budget_min", "budget_max", "expected_end_date", "creation",
]


@frappe.whitelist()
def get_profile():
	claims = require_user_type("client")
	name = frappe.db.exists("ClientProfile", {"user": claims["sub"]})
	if not name:
		frappe.throw(_("Profil introuvable"))
	return frappe.get_doc("ClientProfile", name).as_dict()


@frappe.whitelist()
def update_profile(**fields):
	# BUG CORRIGÉ : cf. agency.update_profile — `frappe.form_dict` arrive vide
	# sur cette installation, `**fields` reçoit alors silencieusement {}.
	# BUG CORRIGÉ (v2) : repli désormais systématique (pas seulement à
	# `fields` totalement vide) — le bug peut n'être que partiel.
	fields = {**get_body_dict(), **fields}
	claims = require_user_type("client")
	name = frappe.db.exists("ClientProfile", {"user": claims["sub"]})
	if not name:
		frappe.throw(_("Profil introuvable"))

	doc = frappe.get_doc("ClientProfile", name)
	# BUG CORRIGÉ : `legal_id_label` ("Type d'identifiant légal" côté
	# formulaire `client.mon-profil.tsx`) manquait de cette liste — ce champ
	# ne pouvait jamais être enregistré, quel que soit le frontend appelant.
	editable = [
		"first_name", "last_name", "company_name", "sector", "phone", "logo",
		"country", "legal_id", "legal_id_label",
	]
	for field in editable:
		if field in fields:
			doc.set(field, fields[field])
	doc.save(ignore_permissions=True)
	return doc.as_dict()


@frappe.whitelist()
def verify_identity():
	"""CDC §1.2 (MUST) : "Contrôle croisé du numéro d'enregistrement auprès de
	registres publics disponibles (anti-faux profils)". Aucun registre public
	n'étant réellement branché dans ce périmètre (cf. CountryLegalIDRule.
	registry_check_enabled, jamais activé), la vérification se limite
	honnêtement à la conformité du format attendu pour le pays déclaré — mais
	reste un contrôle réel (jamais un succès simulé) : un identifiant mal
	formé n'est jamais marqué vérifié."""
	claims = require_user_type("client")
	name = frappe.db.exists("ClientProfile", {"user": claims["sub"]})
	if not name:
		frappe.throw(_("Profil introuvable"))

	doc = frappe.get_doc("ClientProfile", name)
	if not doc.country or not doc.legal_id:
		frappe.throw(_("Renseignez le pays et l'identifiant légal avant de lancer la vérification."))

	from platform_core.platform_core.api.utils import validate_legal_id

	result = validate_legal_id(doc.country, doc.legal_id)
	if not result.get("checked"):
		frappe.throw(_("Aucune règle de validation connue pour le pays « {0} ».").format(doc.country))

	doc.legal_id_verified = 1 if result.get("valid") else 0
	doc.save(ignore_permissions=True)

	from platform_core.platform_core.scoring import update_client_trust_score

	updated = update_client_trust_score(claims["sub"])

	return {
		"verified": bool(result.get("valid")),
		"expected_format": result.get("expected"),
		"trust_score": updated.trust_score if updated else doc.trust_score,
	}


@frappe.whitelist()
def list_collaborations():
	"""cf. 1.4 : agences avec lesquelles le client a un/des projet(s) Terminé(s)."""
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		return []
	rows = frappe.db.sql(
		"""
		select p.name as project, p.title, p.budget_min, p.budget_max,
		       p.start_date, p.expected_end_date, o.agency
		from `tabProject` p
		inner join `tabOpportunity` o on o.project = p.name and o.status = 'Terminée'
		where p.client = %s and p.status = 'Completed'
		order by p.expected_end_date desc
		""",
		(client_name,),
		as_dict=True,
	)

	by_agency = {}
	for row in rows:
		entry = by_agency.setdefault(row.agency, {
			"agency": row.agency,
			"agency_name": frappe.db.get_value("AgencyProfile", row.agency, "agency_name"),
			"projects": [],
		})
		entry["projects"].append({
			"project": row.project,
			"title": row.title,
			"budget_min": row.budget_min,
			"budget_max": row.budget_max,
			"period": f"{row.start_date} → {row.expected_end_date}",
		})

	# AJOUTÉ : la page Collaborations (onglets "Avis publiés"/"Avis à publier")
	# n'avait aucun moyen de savoir si le client avait déjà noté cette agence —
	# `AgencyReview` n'était jamais interrogé ici, donc `publicReview` côté
	# frontend (mapCollaboration) retombait toujours sur "" et le compteur
	# "Avis publiés" restait bloqué à 0 quel que soit l'avis réellement envoyé.
	for entry in by_agency.values():
		project_ids = [p["project"] for p in entry["projects"]]
		existing_reviews = frappe.get_all(
			"AgencyReview",
			filters={"client": claims["sub"], "agency": entry["agency"], "project": ["in", project_ids]},
			fields=["rating", "comment", "project"],
			order_by="creation desc",
			limit_page_length=1,
		)
		entry["review"] = existing_reviews[0] if existing_reviews else None

	return list(by_agency.values())


@frappe.whitelist()
def list_favorites():
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		return []
	favorites = frappe.get_all("FavoriteAgency", filters={"client": client_name}, fields=["agency", "date_added"])
	for fav in favorites:
		fav["agency_name"] = frappe.db.get_value("AgencyProfile", fav.agency, "agency_name")
	return favorites


@frappe.whitelist()
def toggle_favorite(agency=None):
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])
	from platform_core.platform_core.doctype.favoriteagency.favoriteagency import toggle

	return toggle(client_name, agency)


@frappe.whitelist()
def get_collaboration(collaboration_id=None):
	"""Détail d'une collaboration Terminée avec UNE agence donnée (cf. 1.4) —
	`collaboration_id` est le nom de l'AgencyProfile, cf. `list_collaborations`."""
	collaboration_id = require_body_arg(collaboration_id, "collaboration_id", _("Collaboration manquante"))
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		frappe.throw(_("Profil introuvable"))

	rows = frappe.db.sql(
		"""
		select p.name as project, p.title, p.budget_min, p.budget_max,
		       p.start_date, p.expected_end_date
		from `tabProject` p
		inner join `tabOpportunity` o on o.project = p.name and o.status = 'Terminée'
		where p.client = %s and p.status = 'Completed' and o.agency = %s
		order by p.expected_end_date desc
		""",
		(client_name, collaboration_id),
		as_dict=True,
	)
	if not rows:
		frappe.throw(_("Aucune collaboration Terminée trouvée avec cette agence"))

	projects = [{
		"project": row.project,
		"title": row.title,
		"budget_min": row.budget_min,
		"budget_max": row.budget_max,
		"period": f"{row.start_date} → {row.expected_end_date}",
	} for row in rows]

	review = frappe.get_all(
		"AgencyReview",
		filters={
			"agency": collaboration_id,
			"client": claims["sub"],
			"project": ["in", [row.project for row in rows]],
		},
		fields=["rating", "quality_score", "deadline_score", "communication_score",
		        "value_score", "understanding_score", "comment", "status", "creation"],
		order_by="creation desc",
		limit=1,
	)

	return {
		"agency": frappe.get_doc("AgencyProfile", collaboration_id).as_dict(),
		"projects": projects,
		"review": review[0] if review else None,
	}


@frappe.whitelist()
def get_dashboard():
	"""cf. client.tableau-de-bord : agrégat en un seul appel."""
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		frappe.throw(_("Profil introuvable"))

	profile = frappe.get_doc("ClientProfile", client_name)
	active_projects_count = frappe.db.count("Project", {"client": client_name, "status": "In Progress"})
	recent_projects = frappe.get_all(
		"Project", filters={"client": client_name}, fields=RECENT_PROJECT_FIELDS,
		order_by="creation desc", limit=5,
	)

	return {
		"trust_score": profile.trust_score,
		"projects_published_count": profile.projects_published_count,
		"response_rate": profile.response_rate,
		"active_projects_count": active_projects_count,
		"collaborations_count": len(list_collaborations()),
		"recent_projects": recent_projects,
	}


@frappe.whitelist()
def request_phone_otp(phone=None):
	"""Vérification du téléphone (cf. §1.1). Pas de passerelle SMS configurée
	dans ce projet : repli honnête par email (même esprit que les modes stub
	déjà présents ailleurs dans le monorepo, ex. ia-service) — on n'invente
	jamais un faux succès SMS."""
	phone = require_body_arg(phone, "phone", _("Téléphone manquant"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])
	frappe.db.set_value("ClientProfile", client_name, "phone", phone)
	frappe.db.set_value("ClientProfile", client_name, "phone_verified", 0)

	code = f"{random.randint(0, 999999):06d}"
	frappe.cache().set_value(f"phoneotp:{claims['sub']}", code, expires_in_sec=PHONE_OTP_TTL_SECONDS)

	frappe.sendmail(
		recipients=[claims["sub"]],
		subject="Vérification de votre numéro de téléphone",
		message=(
			"[Repli email — SMS non configuré] Votre code de vérification téléphone : "
			f"<b>{code}</b> (valable 5 minutes)."
		),
		now=True,
	)
	return {"sent": True}


@frappe.whitelist()
def verify_phone_otp(code=None):
	code = require_body_arg(code, "code", _("Code manquant"))
	claims = require_user_type("client")
	cached = frappe.cache().get_value(f"phoneotp:{claims['sub']}")
	if not cached or str(cached) != str(code).strip():
		frappe.throw(_("Code invalide ou expiré"))
	frappe.cache().delete_value(f"phoneotp:{claims['sub']}")

	client_name = require_client_profile(claims["sub"])
	doc = frappe.get_doc("ClientProfile", client_name)
	doc.phone_verified = 1
	doc.save(ignore_permissions=True)  # recalcule trust_score via validate()
	return {"verified": True}


@frappe.whitelist()
def get_client_profile_for_agency(client=None):
	"""Consultation du profil d'un client PAR une agence (Prospection IA,
	§2.6) : une fois un lead identifié (visiteur connecté au moment du
	tracking, cf. `prospection.leads.client_email`), l'agence doit pouvoir
	consulter son profil réel et les avis laissés par d'autres agences à son
	sujet avant de le contacter — demande explicite, aucun endpoint agence
	n'exposait jusqu'ici le profil d'un client arbitraire. `client` accepte
	le nom ClientProfile ou l'email User associé (les deux circulent selon
	l'appelant : prospection-service ne connaît que l'email).

	VOLONTAIREMENT SANS COORDONNÉES (ni email, ni téléphone) : l'objectif est
	que l'agence puisse évaluer un prospect (nom, secteur, score de
	confiance, avis) sans pouvoir le contacter en dehors de la plateforme —
	l'envoi effectif de l'e-mail de prospection reste géré côté serveur
	(cf. prospection-service `/leads/:id/send-email`, qui utilise
	`leads.client_email` en interne sans jamais l'exposer à l'agence)."""
	client = require_body_arg(client, "client", _("Client manquant"))
	require_active_agency()

	name = client if frappe.db.exists("ClientProfile", client) else frappe.db.exists(
		"ClientProfile", {"user": client}
	)
	if not name:
		frappe.throw(_("Client introuvable"))

	profile = frappe.get_doc("ClientProfile", name)
	reviews = frappe.get_all(
		"ClientReview",
		filters={"client": name},
		fields=["agency", "project", "rating", "comment", "creation"],
		order_by="creation desc",
		limit_page_length=50,
	)
	for row in reviews:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")

	return {
		"name": profile.name,
		"company_name": profile.company_name,
		"first_name": profile.first_name,
		"last_name": profile.last_name,
		"sector": profile.sector,
		"country": profile.country,
		"trust_score": profile.trust_score,
		"legal_id_verified": profile.legal_id_verified,
		"reviews": reviews,
	}


@frappe.whitelist()
def pay_agency_for_project(project=None, payment_method=None, provider_token=None):
	"""AJOUTÉ (demande explicite) : chemin de paiement du CLIENT vers
	l'AGENCE pour les frais du projet — le montant de l'offre acceptée
	(`Proposal.amount`), distinct des 5% de commission facturés à l'agence
	côté plateforme (cf. Invoice/Payment, réglés séparément par l'agence via
	`api.payment`). Sans clé Stripe configurée, le règlement est simulé
	(cf. `ProjectPayment.before_insert`), dans le même esprit que
	`api.payment._charge_invoice`."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	payment_method = require_body_arg(payment_method, "payment_method", _("Moyen de paiement manquant"))
	provider_token = require_body_arg(provider_token, "provider_token", _("Jeton du fournisseur manquant"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])

	project_doc = frappe.get_doc("Project", project)
	if project_doc.client != client_name:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	if project_doc.payment_status == "Payé":
		frappe.throw(_("Ce projet a déjà été réglé."))

	accepted = frappe.get_all(
		"Proposal",
		filters={"project": project, "agency": ["!=", ""], "status": "Accepted"},
		fields=["name", "agency", "amount"],
		order_by="decision_date desc",
		limit=1,
	)
	if not accepted:
		frappe.throw(_("Aucune offre acceptée trouvée pour ce projet."))
	accepted = accepted[0]

	payment = frappe.get_doc({
		"doctype": "ProjectPayment",
		"project": project,
		"proposal": accepted.name,
		"client": client_name,
		"agency": accepted.agency,
		"amount": accepted.amount,
		"payment_method": payment_method,
		"provider_token": provider_token,
	})
	payment.insert(ignore_permissions=True)
	return {"payment": payment.name, "status": payment.status, "amount": payment.amount}
