
import frappe
from frappe.utils import add_to_date, now_datetime

from platform_core.platform_core.notify import notify

def _settings():
	return frappe.get_single("PlatformSettings")

def process_quote_deadlines():
	_send_first_reminders()
	_escalate_to_suspension_request()
	_escalate_expired_suspensions_to_rejected()

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
			category="Suspension amiable",
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

def process_invoice_reminders():
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

def recompute_pqi_alerts():
	for agency in frappe.get_all("AgencyProfile", pluck="name"):
		frappe.get_doc("AgencyProfile", agency).refresh_pqi()
	frappe.db.commit()
