# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Modération transversale : suspensions, litiges, rattachements (agence à un
seul membre), validation finale des projets Terminés, modération des avis."""

import frappe
from frappe import _

from platform_core.platform_core.auth import get_body_arg, require_body_arg, require_user_type


def _require_moderator():
	return require_user_type("moderator", "admin")


def _enrich_suspension_row(row):
	"""BUG CORRIGÉ : `list_pending_suspensions`/`list_pending_disputes` ne
	renvoyaient que des ID bruts (project/requested_by) — un modérateur ne
	pouvait identifier NI le projet, NI le client, NI l'agence concernés par
	un dossier avant de trancher. Complète avec les libellés lisibles, sans
	changer la forme des champs existants (compat frontend)."""
	row["project_title"] = frappe.db.get_value("Project", row["project"], "title")
	client_user = frappe.db.get_value("Project", row["project"], "client")
	if client_user:
		first = frappe.db.get_value("ClientProfile", client_user, "first_name") or ""
		last = frappe.db.get_value("ClientProfile", client_user, "last_name") or ""
		company = frappe.db.get_value("ClientProfile", client_user, "company_name")
		row["client_name"] = company or f"{first} {last}".strip() or client_user
	else:
		row["client_name"] = None
	agency = frappe.db.get_value(
		"Opportunity",
		{"project": row["project"], "status": ["in", ["Gagnée", "En pause"]]},
		"agency",
	)
	row["agency_name"] = frappe.db.get_value("AgencyProfile", agency, "agency_name") if agency else None
	return row


@frappe.whitelist()
def list_pending_suspensions():
	_require_moderator()
	rows = frappe.get_all(
		"ProjectSuspension",
		filters={"status": "Requested"},
		fields=["name", "project", "category", "requested_by", "justification", "creation"],
	)
	return [_enrich_suspension_row(row) for row in rows]


@frappe.whitelist()
def approve_suspension(suspension=None):
	suspension = require_body_arg(suspension, "suspension", _("Suspension manquante"))
	claims = _require_moderator()
	return frappe.get_doc("ProjectSuspension", suspension).approve(moderator=claims["sub"]).as_dict()


@frappe.whitelist()
def refuse_suspension(suspension=None):
	suspension = require_body_arg(suspension, "suspension", _("Suspension manquante"))
	claims = _require_moderator()
	return frappe.get_doc("ProjectSuspension", suspension).refuse(moderator=claims["sub"]).as_dict()


@frappe.whitelist()
def list_pending_disputes():
	"""cf. CDC v8 note C12 : les litiges sont désormais des ProjectSuspension
	de catégorie « Litige » (InactivityDispute est superseded)."""
	_require_moderator()
	rows = frappe.get_all(
		"ProjectSuspension",
		filters={"status": "Requested", "category": "Litige"},
		fields=["name", "project", "category", "requested_by", "justification", "creation"],
	)
	return [_enrich_suspension_row(row) for row in rows]


@frappe.whitelist()
def list_pending_litige_notices():
	"""File d'attente distincte : litiges client déjà jugés fondés, en attente
	de la réponse de l'agence (ou de la décision finale du modérateur après
	réponse) — cf. `ProjectSuspension._apply_founded_verdict`/
	`resolve_litige_notice`, correctif §2.5.3 sur demande explicite. Ces
	dossiers ne sont plus `status="Requested"` (déjà tranchés « fondé »), donc
	invisibles de `list_pending_disputes` ci-dessus."""
	_require_moderator()
	rows = frappe.get_all(
		"ProjectSuspension",
		filters={
			"category": "Litige",
			"requested_by": "Client",
			"litige_notice_status": ["in", ["Pending", "Responded"]],
		},
		fields=[
			"name", "project", "category", "requested_by", "justification", "creation",
			"litige_notice_status", "agency_notice_deadline", "agency_response", "agency_response_date",
		],
	)
	return [_enrich_suspension_row(row) for row in rows]


@frappe.whitelist()
def resolve_litige_notice(suspension=None, accept_agency_justification=None, decision_note=None):
	"""Décision finale du modérateur pour un litige client jugé fondé, après
	examen de la réponse de l'agence (ou en son absence) : reprise du projet
	si la justification convainc, sinon rejet (conséquences CDC §2.5.3,
	appliquées via `ProjectSuspension._apply_client_litige_rejection`)."""
	suspension = require_body_arg(suspension, "suspension", _("Dossier manquant"))
	accept_agency_justification = get_body_arg("accept_agency_justification", accept_agency_justification)
	decision_note = get_body_arg("decision_note", decision_note)
	if accept_agency_justification is None or accept_agency_justification == "":
		frappe.throw(_("Décision manquante"))
	accept = str(accept_agency_justification).strip().lower() in ("1", "true", "accept", "accepte", "accepté")

	claims = _require_moderator()
	doc = frappe.get_doc("ProjectSuspension", suspension)
	return doc.resolve_litige_notice(accept, moderator=claims["sub"], decision_note=decision_note).as_dict()


@frappe.whitelist()
def resolve_dispute(dispute=None, founded=None, decision_note=None):
	"""Tranche un litige (ProjectSuspension.category="Litige") — `dispute` est
	le nom du ProjectSuspension concerné (cf. CDC v8 note C12)."""
	dispute = require_body_arg(dispute, "dispute", _("Litige manquant"))
	founded = require_body_arg(founded, "founded", _("Verdict manquant"))
	claims = _require_moderator()
	founded = bool(int(founded)) if not isinstance(founded, bool) else founded
	return frappe.get_doc("ProjectSuspension", dispute).resolve(
		founded=founded, moderator=claims["sub"], decision_note=decision_note
	).as_dict()


@frappe.whitelist()
def list_pending_join_requests():
	"""cf. 2.1 : validation par un modérateur si l'agence n'a qu'un seul membre."""
	_require_moderator()
	rows = frappe.get_all(
		"AgencyJoinRequest", filters={"status": "Pending"}, fields=["name", "user", "agency", "context", "creation"]
	)
	return [r for r in rows if frappe.db.count("AgencyMember", {"agency": r.agency, "status": "Active"}) <= 1]


@frappe.whitelist()
def approve_join_request(request_name=None):
	request_name = require_body_arg(request_name, "request_name", _("Demande manquante"))
	claims = _require_moderator()
	return frappe.get_doc("AgencyJoinRequest", request_name).approve(decided_by=claims["sub"]).as_dict()


@frappe.whitelist()
def reject_join_request(request_name=None, reason=None):
	request_name = require_body_arg(request_name, "request_name", _("Demande manquante"))
	claims = _require_moderator()
	return frappe.get_doc("AgencyJoinRequest", request_name).reject(decided_by=claims["sub"], reason=reason).as_dict()


@frappe.whitelist()
def list_pending_completions():
	_require_moderator()
	return frappe.get_all(
		"Project",
		filters={"status": "In Progress", "completion_confirmed_by_client": 1, "completion_validated_by_moderator": 0},
		fields=["name", "title", "client", "expected_end_date"],
	)


@frappe.whitelist()
def validate_completion(project=None):
	project = require_body_arg(project, "project", _("Projet manquant"))
	_require_moderator()
	doc = frappe.get_doc("Project", project)
	if not doc.completion_confirmed_by_client:
		frappe.throw(_("Le client n'a pas encore confirmé la fin du projet"))

	doc.completion_validated_by_moderator = 1
	doc.complete()

	# AJOUTÉ (demande explicite, rectification) : `complete()` refuse de
	# clôturer un projet dont la facture de commission n'est pas réglée et
	# suspend le projet à la place (cf. Project.complete()) — l'Opportunity
	# ne doit alors pas passer "Terminée", et le modérateur doit être informé
	# que sa validation n'a pas suffi.
	if doc.status != "Completed":
		frappe.throw(
			_(
				"Le projet a été suspendu : la facture de commission de l'agence n'est pas "
				"réglée. Il ne peut pas passer Terminé tant qu'elle ne l'est pas."
			)
		)

	opportunity_name = frappe.db.get_value("Opportunity", {"project": project, "status": "Gagnée"}, "name")
	if opportunity_name:
		frappe.get_doc("Opportunity", opportunity_name).mark_completed()

	from platform_core.platform_core.notify import notify

	# Notification.recipient attend un email — doc.client est le NOM du
	# ClientProfile (cf. Project.before_insert), pas un email : on le résout
	# comme le fait déjà Project._notify_client.
	client_user = frappe.db.get_value("ClientProfile", doc.client, "user") if doc.client else None
	if client_user:
		notify(
			recipient=client_user,
			category="Statut projet",
			title=f"Projet « {doc.title} » terminé",
			body="Vous pouvez désormais laisser un avis à l'agence depuis Collaborations.",
			link=f"/client/collaborations",
			channel="Both",
		)
	return doc.as_dict()


@frappe.whitelist()
def list_pending_reviews():
	_require_moderator()
	rows = frappe.get_all(
		"AgencyReview", filters={"status": "Pending"},
		fields=["name", "client", "agency", "project", "rating", "comment", "creation"],
	)
	for row in rows:
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
		client_name = frappe.db.get_value("ClientProfile", {"user": row["client"]}, "name")
		row["client_profile"] = client_name
		if client_name:
			first = frappe.db.get_value("ClientProfile", client_name, "first_name") or ""
			last = frappe.db.get_value("ClientProfile", client_name, "last_name") or ""
			company = frappe.db.get_value("ClientProfile", client_name, "company_name")
			row["client_name"] = company or f"{first} {last}".strip() or row["client"]
		else:
			row["client_name"] = row["client"]
	return rows


@frappe.whitelist()
def list_recent_client_reviews():
	"""ClientReview (avis agence -> client) n'a pas de champ de statut/
	modération (cf. doctype) — contrairement à AgencyReview, publié
	directement. Cette liste sert uniquement à la VISIBILITÉ du modérateur
	(repérer un avis problématique et agir sur le compte concerné via
	suspend_account/flag_account), pas à une file de validation avant
	publication."""
	_require_moderator()
	rows = frappe.get_all(
		"ClientReview",
		fields=["name", "client", "agency", "project", "rating", "comment", "creation"],
		order_by="creation desc",
		limit_page_length=50,
	)
	for row in rows:
		# ClientReview.client est déjà un nom ClientProfile (contrairement à
		# AgencyReview.client, qui est un email User — cf. list_pending_reviews).
		row["agency_name"] = frappe.db.get_value("AgencyProfile", row["agency"], "agency_name")
		row["client_profile"] = row["client"]
		first = frappe.db.get_value("ClientProfile", row["client"], "first_name") or ""
		last = frappe.db.get_value("ClientProfile", row["client"], "last_name") or ""
		company = frappe.db.get_value("ClientProfile", row["client"], "company_name")
		row["client_name"] = company or f"{first} {last}".strip() or row["client"]
	return rows


@frappe.whitelist()
def moderate_review(review=None, approve=1):
	review = require_body_arg(review, "review", _("Avis manquant"))
	# BUG CORRIGÉ (même classe que project.request_suspension::category) :
	# `approve` a une valeur par défaut (1) donc échappait au crash-si-manquant
	# de `require_body_arg` — sur cette installation `frappe.form_dict` arrive
	# vide pour les appels authentifiés, un rejet (`approve=0`) envoyé par le
	# frontend restait donc silencieusement traité comme une approbation.
	approve = get_body_arg("approve", approve)
	_require_moderator()
	doc = frappe.get_doc("AgencyReview", review)
	doc.status = "Approved" if int(approve) else "Rejected"
	doc.is_verified = 1
	doc.save(ignore_permissions=True)
	return doc.as_dict()


# ---------------------------------------------------------------------------
# AJOUTÉ (sur demande explicite) : modération de compte (Client/Agence), par
# exemple suite à un avis problématique — ou tout autre motif au jugement du
# modérateur.
# ---------------------------------------------------------------------------

def _resolve_account_users(account_type, target):
	"""Résout le(s) email(s) User lié(s) à un compte Client/Agence, pour
	suspend_account/reactivate_account (User.enabled, mécanisme natif Frappe
	de blocage de connexion — pas de suppression de données)."""
	if account_type == "agency":
		if not frappe.db.exists("AgencyProfile", target):
			frappe.throw(_("Agence introuvable"))
		users = frappe.get_all("AgencyMember", filters={"agency": target, "status": "Active"}, pluck="user")
		if not users:
			frappe.throw(_("Aucun utilisateur actif rattaché à cette agence"))
		return users
	if account_type == "client":
		user = frappe.db.get_value("ClientProfile", target, "user")
		if not user:
			frappe.throw(_("Client introuvable"))
		return [user]
	frappe.throw(_("Type de compte invalide (\"client\" ou \"agency\" attendu)"))


@frappe.whitelist()
def suspend_account(account_type=None, target=None, reason=None):
	"""Suspend un compte (Client ou Agence) : désactive la connexion de
	tou(te)s ses utilisateur(s) lié(e)s (User.enabled=0). Réversible via
	reactivate_account() — PAS de suppression définitive : les données
	(Projets, Opportunités, Factures...) référencent ces comptes partout dans
	l'application, un vrai DELETE romprait ces liens. C'est l'équivalent
	fonctionnel d'une suppression du point de vue de l'utilisateur (accès
	bloqué) sans le risque d'intégrité."""
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	reason = get_body_arg("reason", reason)
	_require_moderator()

	users = _resolve_account_users(account_type, target)
	for user in users:
		frappe.db.set_value("User", user, "enabled", 0)

	from platform_core.platform_core.notify import notify

	for user in users:
		notify(
			recipient=user,
			category="Autre",
			title="Compte suspendu",
			body=reason or "Votre compte a été suspendu par un modérateur.",
			channel="Both",
		)

	return {"account_type": account_type, "target": target, "suspended_users": users}


@frappe.whitelist()
def reactivate_account(account_type=None, target=None):
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	_require_moderator()

	users = _resolve_account_users(account_type, target)
	for user in users:
		frappe.db.set_value("User", user, "enabled", 1)

	return {"account_type": account_type, "target": target, "reactivated_users": users}


@frappe.whitelist()
def flag_account(account_type=None, target=None, reason=None):
	"""Signale un compte (visible par tous les modérateurs sur son profil)
	SANS bloquer l'accès — action distincte et moins radicale que
	suspend_account(), pour tracer un motif de vigilance sans sanctionner
	immédiatement."""
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	reason = require_body_arg(reason, "reason", _("Motif manquant"))
	_require_moderator()

	doctype = {"agency": "AgencyProfile", "client": "ClientProfile"}.get(account_type)
	if not doctype:
		frappe.throw(_("Type de compte invalide (\"client\" ou \"agency\" attendu)"))
	if not frappe.db.exists(doctype, target):
		frappe.throw(_("Compte introuvable"))

	frappe.db.set_value(doctype, target, {"account_flagged": 1, "flag_reason": reason})
	return {"account_type": account_type, "target": target, "flagged": True}


@frappe.whitelist()
def unflag_account(account_type=None, target=None):
	account_type = require_body_arg(account_type, "account_type", _("Type de compte manquant"))
	target = require_body_arg(target, "target", _("Compte manquant"))
	_require_moderator()

	doctype = {"agency": "AgencyProfile", "client": "ClientProfile"}.get(account_type)
	if not doctype:
		frappe.throw(_("Type de compte invalide (\"client\" ou \"agency\" attendu)"))

	frappe.db.set_value(doctype, target, {"account_flagged": 0, "flag_reason": ""})
	return {"account_type": account_type, "target": target, "flagged": False}
