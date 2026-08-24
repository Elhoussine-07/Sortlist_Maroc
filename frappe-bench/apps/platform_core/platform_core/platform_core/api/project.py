# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Mes Projets (cf. §1.2, 1.3) : cycle de vie du projet côté client."""

import frappe
from frappe import _

from platform_core.platform_core.auth import (
	assert_agency_member,
	current_claims,
	get_body_arg,
	get_body_dict,
	get_client_profile_name,
	require_active_agency,
	require_body_arg,
	require_client_profile,
	require_user_type,
)

DISPUTE_STATUS_LABELS = {
	"None": "Aucun litige/suspension en cours",
	"Requested": "Demande en attente de traitement",
	"Validated": "Suspension validée",
	"Refused": "Demande refusée",
	"Resumed": "Projet repris",
	"Founded": "Litige jugé fondé",
	"Not Founded": "Litige jugé non fondé",
}

BRIEF_FIELDS = [
	"need_type", "category", "sub_category", "budget_min", "budget_max",
	"location", "delivery_delay_days", "description", "title",
]


def _assert_owner(project_doc, user):
	"""`user` est l'email de session (claims["sub"]) ; project_doc.client est le
	NOM du ClientProfile (cf. Project.before_insert) — il faut résoudre l'un
	vers l'autre avant de comparer."""
	client_name = get_client_profile_name(user)
	if not client_name or project_doc.client != client_name:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)


NEED_TYPE_LABELS = {"Projet": "projet", "Stage": "stage", "Job": "job"}


def _default_project_title(fields):
	"""Repli propre quand aucun titre n'est donné (ex. contact direct rapide
	depuis un profil agence) — remplace l'ancien comportement qui tronquait
	la description libre à 120 caractères, produisant des titres illisibles
	dans "Mes projets" (une phrase coupée au milieu plutôt qu'un vrai nom)."""
	need_type = fields.get("need_type") or "Projet"
	category_id = fields.get("category")
	category_name = (
		frappe.db.get_value("ServiceCategory", category_id, "category_name") if category_id else None
	)
	if category_name:
		return f"Demande {category_name}"
	return f"Nouvelle demande de {NEED_TYPE_LABELS.get(need_type, need_type.lower())}"


def create_draft(client, channel="Smart Briefing", **fields):
	"""`client` est l'email de session (`claims["sub"]` / email forwardé par
	ia-service) — PAS le nom du document `ClientProfile` attendu par le champ
	Link `Project.client`. BUG CORRIGÉ : cet appel manquait, `doc.client`
	recevait l'email brut tel quel, ce que Frappe rejette silencieusement à
	l'insert (`LinkValidationError`, "ClientProfile <email> introuvable") —
	aucun Project n'était jamais créé, donc invisible côté "Mes projets"
	(client) comme côté opportunités (agence), sans qu'aucun retour clair
	n'explique pourquoi. `require_client_profile` résout l'email vers le vrai
	nom (ex. "CL-00001") et lève une erreur explicite si le client n'a pas
	encore de profil, plutôt que l'erreur Frappe générique précédente."""
	client_name = require_client_profile(client)
	doc = frappe.get_doc({
		"doctype": "Project",
		"client": client_name,
		"channel": channel,
		"status": "Draft",
		"title": fields.get("title") or _default_project_title(fields),
		**{k: v for k, v in fields.items() if k in BRIEF_FIELDS},
	})
	doc.insert(ignore_permissions=True)
	return doc


def generate_cdc_if_project(project_doc):
	if project_doc.need_type == "Projet":
		from platform_core.platform_core.cdc import generate_cdc

		generate_cdc(project_doc.name)
		return frappe.get_doc("Project", project_doc.name)
	return project_doc


@frappe.whitelist()
def update_brief(project=None, **fields):
	project = require_body_arg(project, "project", _("Projet manquant"))
	# BUG CORRIGÉ : le repli sur `get_body_dict()` ne se déclenchait qu'à
	# `fields` totalement vide — insuffisant si le bug de `frappe.form_dict`
	# (cf. `auth.get_body_arg`) n'est que partiel (ex: `delivery_delay_days`
	# absent alors que les autres champs du brief sont bien arrivés, observé
	# en test réel : "Value missing for Project: Délai de réalisation").
	# Fusion systématique : le corps brut sert de base, les kwargs déjà reçus
	# ont priorité (mêmes valeurs de toute façon), et tout champ manquant côté
	# kwargs est comblé par le corps brut.
	fields = {**get_body_dict(), **fields}
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.cdc_locked:
		frappe.throw(_("Le CDC est verrouillé : le projet a démarré"))

	for field in BRIEF_FIELDS:
		if field in fields:
			doc.set(field, fields[field])
	doc.save(ignore_permissions=True)
	doc = generate_cdc_if_project(doc)
	return doc.as_dict()


@frappe.whitelist()
def post_project(project=None):
	"""Publication : Draft -> Posted (statut « Postulé »)."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.status != "Draft":
		frappe.throw(_("Ce projet est déjà publié"))
	doc.status = "Posted"
	doc.save(ignore_permissions=True)
	return doc.as_dict()


@frappe.whitelist()
def my_projects(status=None):
	claims = require_user_type("client")
	client_name = get_client_profile_name(claims["sub"])
	if not client_name:
		return []
	filters = {"client": client_name}
	if status:
		filters["status"] = status
	rows = frappe.get_all(
		"Project",
		filters=filters,
		fields=["name", "title", "description", "status", "rejection_substatus", "need_type",
		        "channel", "category", "sub_category", "location", "budget_min", "budget_max",
		        "expected_end_date", "creation"],
		order_by="creation desc",
	)
	for row in rows:
		row["category_name"] = (
			frappe.db.get_value("ServiceCategory", row["category"], "category_name")
			if row["category"]
			else None
		)
	return rows


@frappe.whitelist()
def get_project(project=None):
	"""BUG CORRIGÉ : `project` était obligatoire sans valeur par défaut — sur
	cette installation, `frappe.form_dict` arrive parfois vide malgré un
	corps JSON valide envoyé par le frontend (confirmé en curl, y compris
	pour des méthodes natives Frappe hors `platform_core`), ce qui faisait
	planter l'appel avec un TypeError brut avant même d'entrer ici. Cf.
	`auth.get_body_arg` pour le détail du contournement."""
	project = require_body_arg(project, "project", _("Projet manquant"))

	claims = current_claims()
	doc = frappe.get_doc("Project", project)
	if claims.get("user_type") == "client":
		_assert_owner(doc, claims["sub"])
	data = doc.as_dict()
	data["active_notifications_count"] = frappe.db.count(
		"Notification", {"recipient": claims["sub"], "reference_doctype": "Project", "reference_name": project, "is_read": 0}
	)
	# BUG CORRIGÉ : `Project` ne porte aucun champ agence en propre (la
	# relation passe par `Opportunity`) — la page détail client n'avait donc
	# aucun moyen d'afficher "Voir le profil" pour l'agence en charge d'un
	# projet En cours/En pause. `_linked_agency` (déjà utilisé par
	# `signal_ready`/`_client_or_linked_agency_allowed`) résout la bonne
	# Opportunity (Gagnée/En pause).
	agency = _linked_agency(project)
	data["agency"] = agency
	data["partner_agency_name"] = (
		frappe.db.get_value("AgencyProfile", agency, "agency_name") if agency else None
	)

	# AJOUTÉ (demande explicite) : montant dû par le client à l'agence pour
	# les frais du projet (cf. `payment_status`, réglé via
	# `client.pay_agency_for_project`) — le frontend en a besoin pour
	# afficher le montant à payer sans appel supplémentaire.
	accepted = frappe.get_all(
		"Proposal",
		filters={"project": project, "status": "Accepted"},
		fields=["amount"],
		order_by="decision_date desc",
		limit=1,
	)
	data["agency_project_amount"] = accepted[0].amount if accepted else None

	return data


@frappe.whitelist()
def delete_project(project=None):
	"""Suppression du projet (CDC §1.5.1, note C13 v8) : restreinte aux
	statuts Brouillon et Postulé — un projet déjà En cours (ou au-delà) ne
	peut plus être supprimé unilatéralement par le client, il doit passer
	par le circuit de suspension/litige. Passe le projet à Rejeté (sous-statut
	Supprimé), un libellé distinct d'un simple refus (cf. §2.3, onglet Archivées :
	« Projet supprimé par le client », non comptabilisé comme un refus dans les Analytics)."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	if doc.status not in ("Draft", "Posted"):
		frappe.throw(_("Seuls les projets Brouillon ou Postulé peuvent être supprimés."))

	# Toute relation Client-Agence encore active (Reçue/Acceptée/Devis envoyé)
	# est archivée avec un libellé distinct d'un refus — cf. §2.3, non
	# comptabilisé comme un refus dans les Analytics agence (§2.4).
	for opportunity_name in frappe.get_all(
		"Opportunity",
		filters={"project": project, "status": ["not in", ["Gagnée", "Terminée", "Archivée"]]},
		pluck="name",
	):
		frappe.db.set_value("Opportunity", opportunity_name, {
			"status": "Archivée",
			"archive_reason": "Projet supprimé par le client",
		})

	return doc.reject("Supprimé").as_dict()


@frappe.whitelist()
def repost(project=None, include_previously_declined=False):
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	include_previously_declined = bool(int(include_previously_declined)) if not isinstance(
		include_previously_declined, bool
	) else include_previously_declined
	return doc.repost(include_previously_declined=include_previously_declined).as_dict()


@frappe.whitelist()
def request_suspension(project=None, justification=None, category="Suspension amiable"):
	"""Point d'entrée client générique (CDC v8 note C12) : par défaut une
	« Suspension amiable ». Les litiges (client inactif / agence défaillante)
	passent par des points d'entrée dédiés (report_inactivity côté agence,
	report_agency_inactivity ci-dessous côté client)."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	justification = require_body_arg(justification, "justification", _("Justification manquante"))
	# BUG CORRIGÉ : `category` a une valeur par défaut ("Suspension amiable"),
	# donc échappait au crash-si-manquant de `require_body_arg` — mais sur
	# cette installation `frappe.form_dict` arrive vide pour les appels
	# authentifiés (cf. `auth.get_body_arg`), donc le paramètre restait
	# systématiquement sur son défaut Python quel que soit le choix envoyé
	# par le frontend ("Litige" toujours traité comme "Suspension amiable").
	category = get_body_arg("category", category)
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import request_suspension as _request

	suspension = _request(project, requested_by="Client", category=category, justification=justification)
	return suspension.as_dict()


@frappe.whitelist()
def report_agency_inactivity(project=None, message=None):
	"""cf. 2.5.3 : le client signale une agence défaillante — pendant qu'un
	litige côté agence (report_inactivity, cf. api.opportunity) porte sur un
	client inactif."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	message = require_body_arg(message, "message", _("Message manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import request_suspension as _request

	suspension = _request(project, requested_by="Client", category="Litige", justification=message)
	return suspension.as_dict()


@frappe.whitelist()
def resume(project=None):
	"""Bouton « Reprendre » (cf. 1.3.1)."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if doc.status != "Suspended":
		frappe.throw(_("Ce projet n'est pas suspendu"))

	suspension_name = frappe.db.get_value(
		"ProjectSuspension", {"project": project, "status": "Validated"}, "name", order_by="creation desc"
	)
	if not suspension_name:
		frappe.throw(_("Aucune suspension active trouvée pour ce projet"))
	return frappe.get_doc("ProjectSuspension", suspension_name).resume().as_dict()


@frappe.whitelist()
def confirm_completion(project=None):
	"""Le client confirme via le lien reçu par email — un modérateur valide ensuite (cf. 1.3.1)."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	doc.completion_confirmed_by_client = 1
	doc.save(ignore_permissions=True)

	from platform_core.platform_core.notify import notify

	for moderator in frappe.get_all("Has Role", filters={"role": "Moderator", "parenttype": "User"}, pluck="parent"):
		notify(
			recipient=moderator,
			category="Autre",
			title=f"Validation finale requise — « {doc.title} »",
			body="Le client a confirmé la fin du projet. Validez le passage définitif au statut Terminé.",
			link=f"/moderation/completions/{project}",
		)
	return doc.as_dict()


@frappe.whitelist()
def get_pending_proposals(project=None):
	"""Devis en attente de décision du client pour ce projet (statut "Sent"),
	avec l'échéance de réponse propre à chaque relation Client-Agence (CDC
	§1.3.3/§1.5.7 : « délai de réponse propre à chaque devis reçu », comparaison
	multi-devis en Multicast sans écraser le compteur d'un devis par un autre)."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	proposals = frappe.get_all(
		"Proposal",
		filters={"project": project, "status": "Sent"},
		fields=["name", "agency", "amount", "description", "submitted_date",
		        "response_deadline", "extended_deadline", "devis_file"],
		order_by="submitted_date asc",
		ignore_permissions=True,
	)
	for row in proposals:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
	return proposals


@frappe.whitelist()
def download_cdc(project=None):
	"""Pendant client de `opportunity.download_cdc` (côté agence) : sert
	directement le contenu du PDF du CDC (`Project.cdc_file`, cf.
	`cdc.py::generate_cdc`) plutôt que l'URL Frappe `/private/files/...` —
	cette route native ignore le JWT Bearer de cette installation (elle
	attend une session cookie classique) et renvoie donc un 403 même pour
	le client propriétaire du projet."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])
	if not doc.cdc_file:
		frappe.throw(_("Aucun CDC disponible pour ce projet"))

	file_doc = frappe.get_doc("File", {"file_url": doc.cdc_file})
	frappe.local.response.filename = file_doc.file_name
	frappe.local.response.filecontent = file_doc.get_content()
	frappe.local.response.type = "download"


@frappe.whitelist()
def download_devis(proposal=None):
	"""Sert directement le contenu du PDF du devis, plutôt que l'URL Frappe
	`/private/files/...` (`Proposal.devis_file`, cf. `devis.py::generate_devis`) :
	ce fichier est attaché au `Proposal`, dont le propriétaire Frappe natif
	est l'AGENCE qui l'a créé — le système de permissions natif ne sait rien
	de la relation client <-> projet gérée par ce module, d'où un 403
	systématique pour le client qui doit pourtant pouvoir le consulter. Même
	correctif que `opportunity.download_cdc` (CDC agence), avec la même
	autorisation que `respond_to_quote` ci-dessous (client propriétaire du
	projet lié)."""
	proposal = require_body_arg(proposal, "proposal", _("Devis manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Proposal", proposal)
	project = frappe.get_doc("Project", doc.project)
	_assert_owner(project, claims["sub"])
	if not doc.devis_file:
		frappe.throw(_("Aucun devis disponible pour cette proposition"))

	file_doc = frappe.get_doc("File", {"file_url": doc.devis_file})
	frappe.local.response.filename = file_doc.file_name
	frappe.local.response.filecontent = file_doc.get_content()
	frappe.local.response.type = "download"


@frappe.whitelist()
def respond_to_quote(proposal=None, decision=None):
	"""Étape 4 (cf. 1.3.3) : le client Accepte ou Refuse le devis reçu."""
	proposal = require_body_arg(proposal, "proposal", _("Devis manquant"))
	decision = require_body_arg(decision, "decision", _("Décision manquante"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Proposal", proposal)
	project = frappe.get_doc("Project", doc.project)
	_assert_owner(project, claims["sub"])

	if decision == "accept":
		return doc.accept().as_dict()
	elif decision == "refuse":
		return doc.refuse().as_dict()
	frappe.throw(_("Décision invalide : accept ou refuse attendu"))


@frappe.whitelist()
def list_agency_applications(project=None):
	"""Candidatures spontanées d'agences en attente de la décision du CLIENT
	(cf. `opportunity.express_interest`, onglet "Disponibles" côté agence) —
	distinctes des devis (`get_pending_proposals` ci-dessus) : ici l'agence
	n'a pas encore été acceptée, donc n'a pas encore pu envoyer de devis."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	doc = frappe.get_doc("Project", project)
	_assert_owner(doc, claims["sub"])

	rows = frappe.get_all(
		"Opportunity",
		filters={"project": project, "source": "Disponibles", "status": "Reçue"},
		fields=["name", "agency", "creation"],
		order_by="creation desc",
	)
	for row in rows:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
	return rows


@frappe.whitelist()
def respond_to_agency_application(opportunity=None, decision=None):
	"""Le client accepte/refuse la candidature spontanée d'une agence
	(cf. `list_agency_applications` ci-dessus) — même mécanique que l'agence
	acceptant/refusant une opportunité qui LUI a été adressée
	(`Opportunity.accept`/`decline`, cf. `api.opportunity.accept`/`decline`),
	déclenchée ici côté client puisque c'est l'agence qui a pris l'initiative
	du contact. Une fois acceptée, l'agence peut envoyer son devis (bouton
	"Envoyer un devis", onglet "Postulé")."""
	opportunity = require_body_arg(opportunity, "opportunity", _("Candidature manquante"))
	decision = require_body_arg(decision, "decision", _("Décision manquante"))
	claims = require_user_type("client")

	doc = frappe.get_doc("Opportunity", opportunity)
	project = frappe.get_doc("Project", doc.project)
	_assert_owner(project, claims["sub"])
	if doc.source != "Disponibles":
		frappe.throw(_("Cette opportunité n'est pas une candidature spontanée d'agence"))
	if doc.status != "Reçue":
		frappe.throw(_("Cette candidature a déjà été traitée"))

	if decision == "accept":
		return doc.accept().as_dict()
	elif decision == "refuse":
		return doc.decline(reason="Refus client").as_dict()
	frappe.throw(_("Décision invalide : accept ou refuse attendu"))


def _linked_agency(project):
	"""Agence liée au projet via son Opportunity Gagnée/En pause (mêmes statuts
	que `ProjectSuspension._agency_from_opportunity`)."""
	return frappe.db.get_value(
		"Opportunity", {"project": project, "status": ["in", ["Gagnée", "En pause"]]}, "agency"
	)


def _client_or_linked_agency_allowed(project, claims):
	"""cf. get_dispute/get_suspension_history : accès réservé au client
	propriétaire du projet OU à un membre actif de l'agence liée."""
	client_name = get_client_profile_name(claims["sub"])
	if client_name and frappe.db.get_value("Project", project, "client") == client_name:
		return True

	agency = _linked_agency(project)
	if agency and frappe.db.exists(
		"AgencyMember", {"user": claims["sub"], "agency": agency, "status": "Active"}
	):
		return True
	return False


def _suspension_history(doc):
	"""cf. get_dispute / opportunity.get_suspension_history : reconstruit un
	historique lisible à partir des champs de ProjectSuspension."""
	history = [{
		"id": f"{doc.name}-request",
		"date": frappe.utils.get_datetime_str(doc.creation),
		"title": "Demande déposée",
		"description": doc.justification,
	}]

	decision_date = doc.validation_date
	if not decision_date and doc.status in ("Refused", "Founded", "Not Founded"):
		# Aucun champ decision_date dédié (cf. projectsuspension.json) : `modified`
		# est le meilleur horodatage disponible pour refuse()/resolve().
		decision_date = doc.modified

	if decision_date:
		history.append({
			"id": f"{doc.name}-decision",
			"date": frappe.utils.get_datetime_str(decision_date),
			"title": "Décision du modérateur",
			"description": doc.decision_note or DISPUTE_STATUS_LABELS.get(doc.status, doc.status),
		})

	if doc.resume_date:
		history.append({
			"id": f"{doc.name}-resume",
			"date": frappe.utils.get_datetime_str(doc.resume_date),
			"title": "Projet repris",
			"description": f"Projet repris après {doc.suspension_days or 0} jour(s) de suspension.",
		})

	return history


@frappe.whitelist()
def get_dispute(project=None):
	"""cf. §2.5.2/§2.5.3 : état du litige/suspension le plus récent d'un projet,
	pour affichage côté client comme côté agence."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = current_claims()
	if not _client_or_linked_agency_allowed(project, claims):
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	suspension_name = frappe.get_all(
		"ProjectSuspension", filters={"project": project}, order_by="creation desc", limit=1, pluck="name"
	)
	if not suspension_name:
		return {"status": "None", "status_label": DISPUTE_STATUS_LABELS["None"], "history": [], "category": None}

	doc = frappe.get_doc("ProjectSuspension", suspension_name[0])
	return {
		"status": doc.status,
		"status_label": DISPUTE_STATUS_LABELS.get(doc.status, doc.status),
		"history": _suspension_history(doc),
		# BUG CORRIGÉ : absent de la réponse — le frontend n'avait aucun moyen
		# de savoir si une suspension "Validated" est une Suspension amiable
		# (le bouton "Reprendre" du client, CDC §1.5.3, s'applique) ou un
		# Litige (résolution automatique par le modérateur, cf. note C9 —
		# jamais de "Reprendre" côté client dans ce cas).
		"category": doc.category,
	}


@frappe.whitelist()
def relaunch_search(project=None):
	"""cf. §2.5.3 : après un litige résolu en faveur du client (Rejected /
	« Agence défaillante »), réouverture vers une nouvelle Shortlist IA."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_user_type("client")
	client_name = require_client_profile(claims["sub"])
	doc = frappe.get_doc("Project", project)
	if doc.client != client_name:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	if doc.status != "Rejected" or doc.rejection_substatus != "Agence défaillante":
		frappe.throw(
			_("Ce projet ne peut être relancé que suite à un litige gagné pour « Agence défaillante »")
		)

	doc.status = "Posted"
	doc.shortlist_ia = None
	doc.repost_count = (doc.repost_count or 0) + 1
	doc.save(ignore_permissions=True)
	return {"project": doc.name}


@frappe.whitelist()
def signal_ready(project=None):
	"""cf. §1.5.3 : l'agence signale être prête à reprendre — n'affecte aucun
	statut, informe uniquement le client."""
	project = require_body_arg(project, "project", _("Projet manquant"))
	claims = require_active_agency()
	agency_id = claims["agency_id"]
	assert_agency_member(claims["sub"], agency_id)

	linked_agency = _linked_agency(project)
	if linked_agency != agency_id:
		frappe.throw(_("Accès non autorisé à ce projet"), frappe.PermissionError)

	ready = frappe.db.exists(
		"ProjectSuspension",
		{"project": project, "category": "Suspension amiable", "status": "Validated"},
	)
	if not ready:
		frappe.throw(
			_("Ce projet n'est pas dans un état permettant de signaler que vous êtes prêt")
		)

	doc = frappe.get_doc("Project", project)

	from platform_core.platform_core.notify import notify

	client_user = frappe.db.get_value("ClientProfile", doc.client, "user") if doc.client else None
	if client_user:
		notify(
			recipient=client_user,
			category="Statut projet",
			title=f"L'agence est prête — « {doc.title} »",
			body=f"L'agence a signalé être prête à reprendre le projet « {doc.title} ».",
			link=f"/client/projects/{project}",
			reference_doctype="Project",
			reference_name=project,
			channel="Both",
		)
	return {"notified": True}
