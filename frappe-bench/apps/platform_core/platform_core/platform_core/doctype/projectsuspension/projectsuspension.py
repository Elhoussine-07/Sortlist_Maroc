from datetime import timedelta

import frappe
from frappe.model.document import Document
from frappe.utils import add_days, get_datetime, now

class ProjectSuspension(Document):

    def validate(self):
        if not self.project:
            frappe.throw("Un projet doit être associé à la suspension.")

        if not frappe.db.exists("Project", self.project):
            frappe.throw(f"Le projet {self.project} n'existe pas.")

        if not self.justification:
            frappe.throw("Une justification est obligatoire pour toute demande de suspension.")

        self._validate_status_transition()

    def _validate_status_transition(self):
        if not self.is_new():
            previous = frappe.db.get_value(self.doctype, self.name, "status")

            allowed_transitions = {
                "Requested": {"Requested", "Validated", "Refused", "Founded", "Not Founded"},
                "Validated": {"Validated", "Resumed"},
                "Refused": {"Refused"},
                "Resumed": {"Resumed"},
                "Founded": {"Founded"},
                "Not Founded": {"Not Founded"},
            }
            if previous and self.status not in allowed_transitions.get(previous, {self.status}):
                frappe.throw(f"Transition de statut invalide : {previous} → {self.status}.")

    def on_update(self):
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        if self.status == "Validated" and old_status != "Validated":
            self._validate_suspension()

        elif self.status == "Resumed" and old_status != "Resumed":
            self._resume_project()

        elif self.status == "Refused" and old_status != "Refused":
            self._refuse_suspension()

    def approve(self, moderator=None):
        if self.category != "Suspension amiable":
            frappe.throw(
                "Seule une demande de catégorie « Suspension amiable » peut être validée via approve() "
                "— un « Litige » se tranche via resolve()."
            )
        if moderator:
            self.moderator = moderator
        self.status = "Validated"
        self.save(ignore_permissions=True)
        self.reload()
        return self

    def refuse(self, moderator=None):
        if self.category != "Suspension amiable":
            frappe.throw(
                "Seule une demande de catégorie « Suspension amiable » peut être refusée via refuse() "
                "— un « Litige » se tranche via resolve()."
            )
        if moderator:
            self.moderator = moderator
        self.status = "Refused"
        self.save(ignore_permissions=True)
        self.reload()
        return self

    def resume(self):
        if self.category != "Suspension amiable":
            frappe.throw(
                "Seule une « Suspension amiable » peut être reprise via resume() "
                "— un « Litige » se referme via resolve()."
            )
        user_roles = frappe.get_roles(frappe.session.user)
        if "Client" not in user_roles and "Administrator" not in user_roles:
            frappe.throw("Seul le Client (ou un Administrateur) peut reprendre le projet.")
        self.status = "Resumed"
        self.save(ignore_permissions=True)
        self.reload()
        return self

    def resolve(self, founded, moderator=None, decision_note=None):
        if self.category != "Litige":
            frappe.throw(
                "resolve() n'est disponible que pour la catégorie « Litige » "
                "— utilisez approve()/refuse() pour une « Suspension amiable »."
            )
        if self.status != "Requested":
            frappe.throw("Ce litige a déjà été tranché.")

        founded = bool(founded)
        if moderator:
            self.moderator = moderator
        if decision_note:
            self.decision_note = decision_note
        self.status = "Founded" if founded else "Not Founded"
        self.save(ignore_permissions=True)
        self.reload()

        if founded:
            self._apply_founded_verdict()
        else:
            self._resume_after_not_founded_verdict()

        return self

    def _agency_from_opportunity(self):
        return frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": ["in", ["Gagnée", "En pause"]]}, "agency"
        )

    def _apply_founded_verdict(self):
        agency = self._agency_from_opportunity()

        if self.requested_by == "Agency":
            project_doc = frappe.get_doc("Project", self.project)
            project_doc.reject("Client inactif")
            if agency:
                self._credit_agency_commission(agency)
                self._archive_opportunity(agency, "Litige résolu — crédit appliqué")
        elif self.requested_by == "Client":
            settings = frappe.get_single("PlatformSettings")
            grace_hours = settings.suspension_grace_hours or 24
            self.agency_notice_deadline = frappe.utils.add_to_date(frappe.utils.now_datetime(), hours=grace_hours)
            self.litige_notice_status = "Pending"
            self.save(ignore_permissions=True)

            if agency:
                from platform_core.platform_core.notify import notify

                owners = frappe.get_all(
                    "AgencyMember", filters={"agency": agency, "member_role": "Owner", "status": "Active"}, pluck="user"
                )
                for owner in owners:
                    notify(
                        recipient=owner,
                        agency_context=agency,
                        category="Litige",
                        title="Litige jugé fondé — merci de répondre sous "
                        f"{grace_hours}h",
                        body=self.justification,
                        link=f"/agence/suspension?id={self.name}",
                        reference_doctype="ProjectSuspension",
                        reference_name=self.name,
                        channel="Both",
                    )

    def record_agency_litige_response(self, message):
        if self.category != "Litige" or self.requested_by != "Client":
            frappe.throw("Cette action n'est disponible que pour un litige déposé par le client.")
        if self.litige_notice_status != "Pending":
            frappe.throw("Ce litige n'est plus en attente d'une réponse de l'agence.")
        if self.agency_notice_deadline and frappe.utils.now_datetime() > frappe.utils.get_datetime(self.agency_notice_deadline):
            frappe.throw("Le délai de réponse est dépassé — ce dossier a déjà été escaladé.")

        self.agency_response = message
        self.agency_response_date = frappe.utils.now()
        self.litige_notice_status = "Responded"
        self.save(ignore_permissions=True)
        self.reload()

        from platform_core.platform_core.notify import notify

        recipients = [self.moderator] if self.moderator else frappe.get_all(
            "Has Role", filters={"role": "Moderator", "parenttype": "User"}, pluck="parent"
        )
        for recipient in recipients:
            notify(
                recipient=recipient,
                category="Litige",
                title=f"Réponse de l'agence à examiner — litige {self.name}",
                body=message,
                link=f"/admin/litiges?id={self.name}",
                reference_doctype="ProjectSuspension",
                reference_name=self.name,
            )
        return self

    def resolve_litige_notice(self, accept_agency_justification, moderator=None, decision_note=None):
        if self.litige_notice_status not in ("Pending", "Responded"):
            frappe.throw("Ce dossier n'est plus en attente d'une décision.")

        if moderator:
            self.moderator = moderator
        if decision_note:
            self.decision_note = decision_note

        if accept_agency_justification:
            self.litige_notice_status = "Closed"
            self.save(ignore_permissions=True)
            frappe.db.set_value("Project", self.project, "status", "In Progress")
            opportunity_name = frappe.db.get_value(
                "Opportunity", {"project": self.project, "status": "En pause"}, "name"
            )
            if opportunity_name:
                frappe.db.set_value("Opportunity", opportunity_name, "status", "Gagnée")

            from platform_core.platform_core.notify import notify

            project = frappe.get_doc("Project", self.project)
            client_user = frappe.db.get_value("ClientProfile", project.client, "user") if project.client else None
            if client_user:
                notify(
                    recipient=client_user,
                    category="Litige",
                    title=f"Projet « {project.title} » repris",
                    body="La réponse de l'agence a été jugée satisfaisante — le projet reprend son cours normal.",
                    link=f"/client/mes-projets/{project.name}",
                    reference_doctype="ProjectSuspension",
                    reference_name=self.name,
                    channel="Both",
                )
        else:
            self.litige_notice_status = "Closed"
            self.save(ignore_permissions=True)
            self._apply_client_litige_rejection()

            from platform_core.platform_core.notify import notify

            project = frappe.get_doc("Project", self.project)
            client_user = frappe.db.get_value("ClientProfile", project.client, "user") if project.client else None
            if client_user:
                notify(
                    recipient=client_user,
                    category="Litige",
                    title=f"Projet « {project.title} » rejeté",
                    body="La réponse de l'agence n'a pas été jugée satisfaisante par le modérateur — "
                    "le projet est passé au statut Rejeté.",
                    link=f"/client/mes-projets/{project.name}",
                    reference_doctype="ProjectSuspension",
                    reference_name=self.name,
                    channel="Both",
                )

        self.reload()
        return self

    def _apply_client_litige_rejection(self):
        agency = self._agency_from_opportunity()
        project_doc = frappe.get_doc("Project", self.project)
        project_doc.reject("Agence défaillante")
        if agency:
            self._penalize_agency_pqi(agency)
            self._archive_opportunity(agency, "Litige résolu — remboursement client")

    def _archive_opportunity(self, agency, archive_reason):
        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": self.project, "agency": agency, "status": "En pause"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, {
                "status": "Archivée",
                "archive_reason": archive_reason,
            })

    def _credit_agency_commission(self, agency):
        invoice = frappe.db.get_value(
            "Invoice", {"project": self.project, "agency": agency}, ["commission_amount"], as_dict=True
        )
        amount = (invoice.commission_amount if invoice else 0) or 0
        frappe.get_doc({
            "doctype": "CommissionCredit",
            "agency": agency,
            "source_dispute": self.name,
            "source_project": self.project,
            "amount": amount,
            "balance": amount,
        }).insert(ignore_permissions=True)

    def _penalize_agency_pqi(self, agency):
        current = frappe.db.get_value("AgencyProfile", agency, "pqi_score") or 0
        frappe.db.set_value("AgencyProfile", agency, "pqi_score", max(current - 15, 0))

    def _resume_after_not_founded_verdict(self):
        frappe.db.set_value("Project", self.project, "status", "In Progress")
        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": "En pause"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "Gagnée")

    def _assert_can_decide(self):
        user_roles = frappe.get_roles(frappe.session.user)
        if "Moderator" in user_roles or "Administrator" in user_roles:
            return
        if self.category == "Suspension amiable":
            if self.requested_by == "Client" and "Agency" in user_roles:
                return
            if self.requested_by == "Agency" and "Client" in user_roles:
                return
        frappe.throw("Vous n'êtes pas autorisé à décider de cette suspension.")

    def _validate_suspension(self):
        self._assert_can_decide()

        frappe.db.set_value(self.doctype, self.name, "validation_date", now())

        user_roles = frappe.get_roles(frappe.session.user)
        if "Moderator" in user_roles or "Administrator" in user_roles:
            frappe.db.set_value(self.doctype, self.name, "moderator", frappe.session.user)

        frappe.db.set_value("Project", self.project, "status", "Suspended")

        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": "Gagnée"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "En pause")

        if self.category == "Non-paiement":
            self._notify_client(
                title="Projet suspendu — facture de commission impayée",
                message="Votre projet a été suspendu automatiquement : l'agence n'a pas réglé sa "
                "commission plateforme dans le délai imparti.",
            )
            self._notify_agency(
                title="Projet suspendu — facture impayée",
                message="Le projet a été suspendu automatiquement faute de règlement de la facture "
                "de commission dans le délai imparti. Réglez-la pour reprendre le projet.",
            )
        else:
            self._notify_client(
                title="Projet suspendu",
                message=f"Votre projet a été suspendu suite à votre demande."
            )

            self._notify_agency(
                title="Projet suspendu",
                message=f"Le projet a été suspendu par le client."
            )

    def _resume_project(self):
        resume_date = now()
        frappe.db.set_value(self.doctype, self.name, "resume_date", resume_date)

        if not self.validation_date:
            frappe.throw("Impossible de reprendre : cette suspension n'a jamais été validée.")

        suspension_days = (get_datetime(resume_date) - get_datetime(self.validation_date)).days
        frappe.db.set_value(self.doctype, self.name, "suspension_days", suspension_days)

        project = frappe.get_doc("Project", self.project)

        if (
            self.category == "Non-paiement"
            and project.expected_end_date
            and get_datetime(project.expected_end_date) <= get_datetime(self.validation_date)
        ):
            project.complete()
            return

        initial_end_date = project.initial_end_date
        if not initial_end_date and project.start_date and project.delivery_delay_days:
            initial_end_date = add_days(project.start_date, project.delivery_delay_days)
            frappe.db.set_value("Project", self.project, "initial_end_date", initial_end_date)

        new_total_suspension_days = (project.total_suspension_days or 0) + suspension_days
        frappe.db.set_value("Project", self.project, "total_suspension_days", new_total_suspension_days)

        new_expected_end_date = project.expected_end_date
        if initial_end_date:
            new_expected_end_date = add_days(initial_end_date, new_total_suspension_days)
            frappe.db.set_value("Project", self.project, "expected_end_date", new_expected_end_date)

        frappe.db.set_value("Project", self.project, "status", "In Progress")

        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": "En pause"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "Gagnée")

        self._notify_client(
            title="Projet repris",
            message=f"Votre projet a été repris. Nouvelle date de fin prévue : {new_expected_end_date or 'non définie'}"
        )

        self._notify_agency(
            title="Projet repris",
            message=(
                "Le projet a repris suite au règlement de votre facture de commission."
                if self.category == "Non-paiement"
                else "Le projet a été repris par le client."
            ),
        )

    def _refuse_suspension(self):
        self._assert_can_decide()

        user_roles = frappe.get_roles(frappe.session.user)
        if "Moderator" in user_roles or "Administrator" in user_roles:
            frappe.db.set_value(self.doctype, self.name, "moderator", frappe.session.user)

        self._notify_client(
            title="Demande de suspension refusée",
            message=f"Votre demande de suspension a été refusée."
        )

    def _notify_client(self, title, message):
        project = frappe.get_doc("Project", self.project)
        if not project.client:
            return

        client_user = frappe.db.get_value("ClientProfile", project.client, "user")
        if not client_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": client_user,
                "category": "Suspension",
                "title": title,
                "body": message,
                "reference_doctype": "ProjectSuspension",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

    def _notify_agency(self, title, message):
        opportunity = frappe.get_all(
            "Opportunity",
            filters={"project": self.project, "status": "Gagnée"},
            limit=1,
            fields=["agency"]
        )
        if not opportunity:
            return

        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(opportunity[0].agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Suspension",
                "title": title,
                "body": message,
                "reference_doctype": "ProjectSuspension",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

def suspend_for_unpaid_invoice(invoice):
	invoice_doc = invoice if not isinstance(invoice, str) else frappe.get_doc("Invoice", invoice)

	if frappe.db.exists(
		"ProjectSuspension",
		{"project": invoice_doc.project, "category": "Non-paiement", "status": "Validated"},
	):
		return None

	doc = frappe.get_doc({
		"doctype": "ProjectSuspension",
		"project": invoice_doc.project,
		"requested_by": "System",
		"category": "Non-paiement",
		"justification": (
			f"Facture de commission {invoice_doc.invoice_number} non réglée avant l'échéance "
			f"({invoice_doc.payment_deadline})."
		),
		"status": "Validated",
	})
	doc.insert(ignore_permissions=True)
	return doc

def resume_after_invoice_paid(invoice):
	invoice_doc = invoice if not isinstance(invoice, str) else frappe.get_doc("Invoice", invoice)

	suspension_name = frappe.db.get_value(
		"ProjectSuspension",
		{"project": invoice_doc.project, "category": "Non-paiement", "status": "Validated"},
		"name",
	)
	if not suspension_name:
		return None

	doc = frappe.get_doc("ProjectSuspension", suspension_name)
	doc.status = "Resumed"
	doc.save(ignore_permissions=True)
	return doc

def request_suspension(project, requested_by, justification, category="Suspension amiable"):
    doc = frappe.get_doc({
        "doctype": "ProjectSuspension",
        "project": project,
        "requested_by": requested_by,
        "category": category,
        "justification": justification,
        "status": "Requested",
    })
    doc.insert(ignore_permissions=True)

    if category == "Litige":
        frappe.db.set_value("Project", project, "status", "Suspended")
        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": project, "status": "Gagnée"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "En pause")

    from platform_core.platform_core.notify import notify

    for moderator in frappe.get_all("Has Role", filters={"role": "Moderator", "parenttype": "User"}, pluck="parent"):
        notify(
            recipient=moderator,
            category="Litige" if category == "Litige" else "Suspension",
            title=f"Nouvelle demande de suspension ({category}) — projet {project}",
            body=justification,
            link=f"/moderation/suspensions/{doc.name}",
        )

    return doc
