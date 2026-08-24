# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Tâches planifiées — cf. hooks.py `scheduler_events`.

Implémente le circuit de relance/escalade du workflow de devis en deux
étapes (cahier des charges §1.3.3) : 48h de réponse, +24h après rappel,
puis Suspendu (validation humaine) et enfin Rejeté si toujours sans
réponse `suspension_grace_hours` après la validation du modérateur.
"""

import frappe
from frappe.utils import add_to_date, now_datetime

from platform_core.platform_core.notify import notify


def _settings():
	return frappe.get_single("PlatformSettings")


def process_quote_deadlines():
	_send_first_reminders()
	_escalate_to_suspension_request()
	_escalate_expired_suspensions_to_rejected()
	_escalate_expired_litige_notices()


def _send_first_reminders():
	settings = _settings()
	now = now_datetime()
	pending = frappe.get_all(
		"Proposal",
		filters={"status": "Sent", "response_deadline": ["<=", now], "reminder_sent_on": ["is", "not set"]},
		fields=["name", "project", "amount"],
	)
	for row in pending:
		proposal = frappe.get_doc("Proposal", row.name)
		proposal.extended_deadline = add_to_date(proposal.response_deadline, hours=settings.reminder_extra_hours or 24)
		proposal.reminder_sent_on = now
		proposal.save(ignore_permissions=True)

		project = frappe.get_doc("Project", proposal.project)
		notify(
			recipient=project.client,
			category="Relance devis",
			title=f"Rappel : un devis attend votre réponse pour « {project.title} »",
			body=f"Vous avez {settings.reminder_extra_hours or 24}h supplémentaires pour Accepter ou Refuser ce devis.",
			link=f"/client/projects/{project.name}",
			reference_doctype="Proposal",
			reference_name=proposal.name,
			channel="Both",
		)


def _escalate_to_suspension_request():
	now = now_datetime()
	overdue = frappe.get_all(
		"Proposal",
		filters={
			"status": "Sent",
			"reminder_sent_on": ["is", "set"],
			"extended_deadline": ["<=", now],
		},
		fields=["name", "project"],
	)
	for row in overdue:
		if frappe.db.exists("ProjectSuspension", {"project": row.project, "requested_by": "System"}):
			continue

		from platform_core.platform_core.doctype.projectsuspension.projectsuspension import request_suspension

		request_suspension(
			row.project,
			requested_by="System",
			category="Suspension amiable",  # "Suspendu Vérification" — validation modérateur (CDC 1.5.1)
			justification="Absence de réponse du client au devis dans les délais impartis (48h + 24h de rappel).",
		)

		project = frappe.get_doc("Project", row.project)
		for moderator in frappe.get_all("Has Role", filters={"role": "Moderator", "parenttype": "User"}, pluck="parent"):
			notify(
				recipient=moderator,
				category="Autre",
				title=f"Validation requise : absence de réponse client — « {project.title} »",
				body="Le client n'a pas répondu au devis dans les délais. Confirmez le passage en Suspendu.",
				link=f"/moderation/suspensions?project={project.name}",
			)


def _escalate_expired_suspensions_to_rejected():
	settings = _settings()
	now = now_datetime()
	threshold = add_to_date(now, hours=-(settings.suspension_grace_hours or 24))

	validated = frappe.get_all(
		"ProjectSuspension",
		filters={"requested_by": "System", "status": "Validated", "validation_date": ["<=", threshold]},
		fields=["name", "project"],
	)
	for row in validated:
		still_pending = frappe.db.exists("Proposal", {"project": row.project, "status": "Sent"})
		if not still_pending:
			continue

		project = frappe.get_doc("Project", row.project).reject("Refusé")
		opportunity_name = frappe.db.get_value("Opportunity", {"project": row.project}, "name")
		if opportunity_name:
			frappe.get_doc("Opportunity", opportunity_name).archive("Suspendu Rejeté")

		notify(
			recipient=project.client,
			category="Statut projet",
			title=f"Projet « {project.title} » rejeté",
			body="Faute de réponse dans les délais, ce projet est passé au statut Rejeté.",
			link=f"/client/projects/{project.name}",
			channel="Both",
		)


def _escalate_expired_litige_notices():
	"""§2.5.3, correctif sur demande explicite : un litige client jugé fondé
	laisse `suspension_grace_hours` (défaut 24h) à l'agence pour répondre
	(cf. ProjectSuspension._apply_founded_verdict/record_agency_litige_response)
	avant que les conséquences prévues par le CDC (rejet + pénalité PQI) ne
	s'appliquent automatiquement, faute de réponse."""
	now = now_datetime()
	overdue = frappe.get_all(
		"ProjectSuspension",
		filters={
			"category": "Litige",
			"requested_by": "Client",
			"litige_notice_status": "Pending",
			"agency_notice_deadline": ["<=", now],
		},
		fields=["name", "project"],
	)
	for row in overdue:
		doc = frappe.get_doc("ProjectSuspension", row.name)
		doc.litige_notice_status = "Expired"
		doc.save(ignore_permissions=True)
		doc._apply_client_litige_rejection()

		project = frappe.get_doc("Project", row.project)
		client_user = frappe.db.get_value("ClientProfile", project.client, "user") if project.client else None
		if client_user:
			notify(
				recipient=client_user,
				category="Litige",
				title=f"Projet « {project.title} » rejeté — agence non intéressée",
				body="L'agence n'a pas répondu dans les délais à votre signalement. "
				"Le projet est passé au statut Rejeté.",
				link=f"/client/mes-projets/{project.name}",
				reference_doctype="ProjectSuspension",
				reference_name=row.name,
				channel="Both",
			)


def process_invoice_reminders():
	"""cf. 2.5.1 point 5 : relance après échéance, suspension des offres si
	dépassement prolongé."""
	settings = _settings()
	today = frappe.utils.today()

	overdue = frappe.get_all(
		"Invoice", filters={"status": "Pending", "due_date": ["<", today], "reminder_sent": 0},
		fields=["name", "agency", "due_date", "commission_amount"],
	)
	for row in overdue:
		frappe.db.set_value("Invoice", row.name, "reminder_sent", 1)
		owners = frappe.get_all(
			"AgencyMember", filters={"agency": row.agency, "member_role": "Owner", "status": "Active"}, pluck="user"
		)
		for owner in owners:
			notify(
				recipient=owner,
				agency_context=row.agency,
				category="Autre",
				title="Facture en retard",
				body=f"Une facture de commission ({row.commission_amount}) est en retard de paiement.",
				link="/agency/billing",
				channel="Both",
			)

	long_overdue_days = (settings.invoice_due_days or 7) * 2
	long_overdue_date = add_to_date(today, days=-long_overdue_days)
	very_late = frappe.get_all(
		"Invoice", filters={"status": "Pending", "due_date": ["<", long_overdue_date]}, fields=["name", "agency"]
	)
	for row in very_late:
		frappe.db.set_value("Invoice", row.name, "status", "Overdue")
		frappe.db.set_value("AgencyProfile", row.agency, "offers_suspended", 1)


def suspend_projects_for_unpaid_commission():
	"""AJOUTÉ (demande explicite) : à partir du passage En cours d'un projet
	(création de la facture de commission, cf. Proposal._create_invoice),
	l'agence dispose de `invoice_payment_deadline_hours` (défaut 48h,
	PlatformSettings) pour régler cette facture — passé ce délai sans
	règlement (Invoice.status toujours "Pending"), le projet est
	automatiquement suspendu (catégorie "Non-paiement", cf.
	ProjectSuspension.suspend_for_unpaid_invoice). Distinct de
	process_invoice_reminders (relance/offers_suspended basé sur
	invoice_due_days, non modifié)."""
	from platform_core.platform_core.doctype.projectsuspension.projectsuspension import (
		suspend_for_unpaid_invoice,
	)

	overdue = frappe.get_all(
		"Invoice",
		filters={"status": "Pending", "payment_deadline": ["<=", now_datetime()]},
		fields=["name", "project"],
	)
	for row in overdue:
		if frappe.db.get_value("Project", row.project, "status") != "In Progress":
			continue
		suspend_for_unpaid_invoice(row.name)


def recompute_pqi_alerts():
	"""cf. 2.4 : recalcule le PQI de toutes les agences (déclenche les alertes
	de baisse de visibilité via scoring.update_agency_pqi)."""
	for agency in frappe.get_all("AgencyProfile", pluck="name"):
		frappe.get_doc("AgencyProfile", agency).refresh_pqi()
	frappe.db.commit()


def complete_overdue_projects():
	"""AJOUTÉ (sur demande explicite) : le délai convenu en début de projet
	(`expected_end_date`, déjà recalculé pour intégrer les jours de suspension
	cumulés — cf. `ProjectSuspension._resume_project`/`_apply_founded_verdict`,
	rien à faire de plus ici) doit être respecté : un projet encore "In
	Progress" une fois ce délai dépassé passe automatiquement Terminé, sans
	attendre la confirmation manuelle du client (`project.confirm_completion`)
	ni la validation du modérateur (`moderation.validate_completion`) — ces
	deux mécanismes restent disponibles pour une clôture ANTICIPÉE avant
	l'échéance, mais ne conditionnent plus la clôture à l'échéance elle-même.
	Déclenche aussi la possibilité pour les deux parties de laisser un avis
	l'une sur l'autre (cf. Project.on_update -> _notify_client/_notify_agency,
	`review.submit_agency_review` côté client, `opportunity.review_client`
	côté agence)."""
	today = frappe.utils.today()
	overdue = frappe.get_all(
		"Project",
		filters={"status": "In Progress", "expected_end_date": ["<=", today]},
		fields=["name"],
	)
	for row in overdue:
		project = frappe.get_doc("Project", row.name)
		project.complete()

		opportunity_name = frappe.db.get_value(
			"Opportunity", {"project": row.name, "status": "Gagnée"}, "name"
		)
		if opportunity_name:
			frappe.get_doc("Opportunity", opportunity_name).mark_completed()
	frappe.db.commit()
