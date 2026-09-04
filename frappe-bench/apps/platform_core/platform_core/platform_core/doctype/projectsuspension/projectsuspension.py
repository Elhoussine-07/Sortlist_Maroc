from datetime import timedelta

import frappe
from frappe.model.document import Document
from frappe.utils import add_days, get_datetime, now

# NOTE : le calcul de suspension_days (durée entre validation_date et resume_date,
# cf. CDC 1.3.1) nécessite une soustraction de dates. frappe.utils.add_days ne permet
# pas de calculer une différence ; get_datetime + timedelta sont utilisés ici en
# dérogation ciblée, comme pour Proposal.response_deadline.


class ProjectSuspension(Document):
    """Logique cœur Frappe : validation humaine de la suspension et recalcul du
    délai de réalisation du projet (CDC 1.3.1, précision sur le calcul du délai).
    """

    def validate(self):
        # Vérifier que le projet existe
        if not self.project:
            frappe.throw("Un projet doit être associé à la suspension.")

        if not frappe.db.exists("Project", self.project):
            frappe.throw(f"Le projet {self.project} n'existe pas.")

        # Vérifier la justification
        if not self.justification:
            frappe.throw("Une justification est obligatoire pour toute demande de suspension.")

        # Vérifier les transitions de statut
        self._validate_status_transition()

    def _validate_status_transition(self):
        """Empêche les transitions de statut incohérentes (ex : Resumed sans
        passer par Validated, ou modification après Refused/Resumed). Depuis
        l'unification suspension/litige (CDC v8 note C12), un litige
        (category="Litige") saute directement Requested -> Founded/Not Founded,
        sans étape Validated intermédiaire."""
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
        # BUG CORRIGÉ : `frappe.db.get_value` relit la DB APRÈS que save() ait
        # déjà écrit le nouveau statut (on_update tourne après l'écriture) —
        # il renvoyait donc toujours `self.status`, jamais l'ancien statut, ce
        # qui empêchait `_validate_suspension`/`_resume_project`/
        # `_refuse_suspension` de jamais se déclencher via `approve()`/
        # `refuse()`/`resume()` (tout le circuit suspension/reprise §1.5.2/
        # 1.5.3 restait silencieusement inopérant). `get_doc_before_save()`
        # donne le vrai état d'avant modification. (NB : `previous` dans
        # `_validate_status_transition`, ci-dessus, n'a pas ce problème — il
        # est lu dans `validate()`, qui s'exécute AVANT l'écriture DB.)
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        # Validation de la suspension (par Moderator)
        if self.status == "Validated" and old_status != "Validated":
            self._validate_suspension()

        # Reprise du projet (par le client)
        elif self.status == "Resumed" and old_status != "Resumed":
            self._resume_project()

        # Refus de la suspension (par Moderator)
        elif self.status == "Refused" and old_status != "Refused":
            self._refuse_suspension()

    def approve(self, moderator=None):
        """Valide une demande de « Suspension amiable » (Requested -> Validated).
        Un « Litige » se tranche via resolve(), pas via approve()/refuse()."""
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
        """Refuse une demande de « Suspension amiable » (Requested -> Refused)."""
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
        """Bouton « Reprendre » — uniquement pour une « Suspension amiable »
        validée, uniquement appelable par le client (CDC 1.3.1)."""
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
        """Verdict d'un « Litige » (CDC v8 note C12, §2.5.2/§2.5.3). Remplace
        InactivityDispute.resolve() — cf. commentaire "superseded" dans
        inactivitydispute.py."""
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
        """Retrouve l'agence du projet via son Opportunity Gagnée/En pause."""
        return frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": ["in", ["Gagnée", "En pause"]]}, "agency"
        )

    def _apply_founded_verdict(self):
        agency = self._agency_from_opportunity()

        if self.requested_by == "Agency":
            # §2.5.2 : litige "client inactif après paiement" déposé par
            # l'agence, jugé fondé -> le projet est rejeté et la commission
            # déjà prélevée est créditée à l'agence (réutilisable sur une
            # prochaine facture, cf. CommissionCredit). CDC v8 note C9 :
            # verdict direct sans étape supplémentaire ici, c'est le client
            # (et non l'agence) qui est visé par le signalement.
            project_doc = frappe.get_doc("Project", self.project)
            project_doc.reject("Client inactif")
            if agency:
                self._credit_agency_commission(agency)
                self._archive_opportunity(agency, "Litige résolu — crédit appliqué")
        elif self.requested_by == "Client":
            # §2.5.3 : litige "agence défaillante" déposé par le client.
            #
            # CORRECTIF (sur demande explicite, en déviation du texte CDC
            # "MUST" qui prévoit un passage direct Rejeté) : avant de rejeter
            # le projet, on laisse une chance à l'agence de répondre à la
            # justification du client sous `suspension_grace_hours` (défaut
            # 24h, même réglage que `_escalate_expired_suspensions_to_rejected`)
            # — le projet reste simplement Suspendu (déjà le cas depuis
            # `request_suspension`, aucun changement nécessaire ici) le temps
            # de l'examen. Sans réponse dans le délai -> rejet automatique
            # (cf. tasks.py::_escalate_expired_litige_notices). Avec réponse
            # -> le modérateur tranche via `resolve_litige_notice()` : reprise
            # En cours si la justification convainc, sinon mêmes conséquences
            # que le rejet immédiat prévu par le CDC (juste différées).
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
        """L'agence répond, dans le délai imparti, à un litige jugé fondé par
        le client (§2.5.3) avant que le modérateur ne tranche définitivement."""
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
        """Décision finale du modérateur après examen de la réponse de
        l'agence (ou après expiration du délai, cf. tasks.py) à un litige
        client jugé fondé (§2.5.3)."""
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
        """Conséquences prévues par le CDC §2.5.3 pour un litige client jugé
        fondé (rejet + pénalité PQI agence) — appliquées soit par le
        modérateur (`resolve_litige_notice(accept_agency_justification=False)`),
        soit automatiquement à l'expiration du délai sans réponse de l'agence
        (cf. tasks.py::_escalate_expired_litige_notices)."""
        agency = self._agency_from_opportunity()
        project_doc = frappe.get_doc("Project", self.project)
        # NOTE (limite documentée) : CommissionCredit est structurellement lié
        # à `agency` (crédit pour une prochaine facture d'agence) ; il
        # n'existe pas de mécanisme équivalent de remboursement direct côté
        # Client dans ce périmètre — on applique donc uniquement la pénalité
        # PQI ici plutôt que de détourner CommissionCredit vers un usage
        # qu'il ne modélise pas.
        project_doc.reject("Agence défaillante")
        if agency:
            self._penalize_agency_pqi(agency)
            self._archive_opportunity(agency, "Litige résolu — remboursement client")

    def _archive_opportunity(self, agency, archive_reason):
        """Bascule l'opportunité En pause -> Archivée avec un libellé distinct
        d'un simple refus (CDC §2.3), pour ne pas fausser le taux de
        conversion (Offres -> Gagnées) des Analytics agence (§2.4)."""
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
        # Pas de fonction de pénalité disciplinaire dédiée dans scoring.py :
        # on décrémente directement pqi_score d'une valeur forfaitaire (-15,
        # soit l'équivalent d'un critère PQI entier sur cinq, cf.
        # scoring.PQI_CRITERIA) en attendant un barème de pénalités dédié.
        current = frappe.db.get_value("AgencyProfile", agency, "pqi_score") or 0
        frappe.db.set_value("AgencyProfile", agency, "pqi_score", max(current - 15, 0))

    def _resume_after_not_founded_verdict(self):
        """CDC v8 note C9 : verdict Non-Fondé -> le modérateur lève la
        suspension directement, sans attendre de clic client."""
        frappe.db.set_value("Project", self.project, "status", "In Progress")
        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": "En pause"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "Gagnée")

    def _assert_can_decide(self):
        """Un modérateur/administrateur peut toujours décider (tous cas). Pour
        une « Suspension amiable » spécifiquement (jamais un « Litige », qui
        reste exclusivement du ressort du modérateur — CDC §1.5.2), la PARTIE
        QUI N'A PAS DEMANDÉ la suspension peut aussi accepter/refuser
        directement : un accord amiable entre les deux parties ne nécessite
        pas d'arbitrage neutre, contrairement à un litige (accusation de
        manquement). L'appartenance réelle du projet à cette agence/ce client
        est déjà vérifiée en amont, côté API (cf.
        `api.opportunity.respond_to_amicable_suspension`)."""
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
        """Le projet ne passe réellement en Suspendu qu'au moment où la
        décision est validée (et non à la demande initiale) — cf. CDC 1.3.1."""
        self._assert_can_decide()

        # Définir la date de validation
        frappe.db.set_value(self.doctype, self.name, "validation_date", now())

        # Le champ « moderator » ne doit porter qu'un vrai modérateur — une
        # décision amiable directe entre les deux parties (cf.
        # `_assert_can_decide`) n'en a pas, laisser le champ vide évite
        # d'afficher l'une des parties comme « Modérateur » dans l'UI.
        user_roles = frappe.get_roles(frappe.session.user)
        if "Moderator" in user_roles or "Administrator" in user_roles:
            frappe.db.set_value(self.doctype, self.name, "moderator", frappe.session.user)

        # Passer le projet en Suspendu
        frappe.db.set_value("Project", self.project, "status", "Suspended")

        # BUG CORRIGÉ : contrairement au circuit Litige (cf.
        # `request_suspension`, qui bascule l'Opportunity Gagnée -> En pause
        # dès la création), le circuit Suspension amiable ne synchronisait
        # jamais l'Opportunity à la validation — le projet restait affiché
        # dans l'onglet "Gagnées" côté agence malgré le Project.status
        # "Suspended". Même bascule ici, pour rester cohérent.
        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": "Gagnée"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "En pause")

        # BUG CORRIGÉ : les messages ci-dessous étaient toujours ceux d'une
        # suspension amiable classique ("suite à votre demande" / "par le
        # client"), y compris pour la catégorie "Non-paiement" où c'est le
        # système qui suspend automatiquement faute de règlement — faux dans
        # ce cas, ni demandé par le client ni décidé par lui.
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
            # Notifier le client
            self._notify_client(
                title="Projet suspendu",
                message=f"Votre projet a été suspendu suite à votre demande."
            )

            # Notifier l'agence
            self._notify_agency(
                title="Projet suspendu",
                message=f"Le projet a été suspendu par le client."
            )

    def _resume_project(self):
        """Au clic sur « Reprendre » : calcule le nombre de jours de suspension
        (validation_date → resume_date), l'ajoute au cumul du projet, recalcule
        expected_end_date, et repasse le projet En cours (In Progress)."""
        resume_date = now()
        frappe.db.set_value(self.doctype, self.name, "resume_date", resume_date)

        if not self.validation_date:
            frappe.throw("Impossible de reprendre : cette suspension n'a jamais été validée.")

        # Calculer les jours de suspension
        suspension_days = (get_datetime(resume_date) - get_datetime(self.validation_date)).days
        frappe.db.set_value(self.doctype, self.name, "suspension_days", suspension_days)

        # Mettre à jour le projet
        project = frappe.get_doc("Project", self.project)

        # AJOUTÉ (demande explicite) : si la suspension "Non-paiement" a été
        # créée par Project.complete() parce que l'échéance était déjà
        # dépassée au moment de la validation (le projet essayait de passer
        # Terminé, bloqué uniquement par la facture de commission impayée —
        # cf. Project.complete()), le règlement de la facture doit faire
        # passer le projet directement Terminé, pas le refaire repartir En
        # cours (il n'y a plus rien à y faire). Distingué du cas où
        # "Non-paiement" a suspendu un projet réellement encore en cours
        # (échéance pas encore atteinte à la validation, cf.
        # tasks.suspend_projects_for_unpaid_commission) : celui-là reprend
        # normalement ci-dessous. project.complete() relance lui-même la
        # vérification de facture impayée — elle vient d'être réglée, donc
        # il complète directement cette fois, sans re-suspendre.
        if (
            self.category == "Non-paiement"
            and project.expected_end_date
            and get_datetime(project.expected_end_date) <= get_datetime(self.validation_date)
        ):
            project.complete()
            return

        # Définir initial_end_date si vide
        # BUG CORRIGÉ : `frappe.db.set_value` n'actualise pas l'objet `project`
        # en mémoire — le `if project.initial_end_date:` plus bas relisait donc
        # systématiquement l'ancienne valeur (encore vide) quand elle venait
        # tout juste d'être calculée ICI, et `expected_end_date` n'était alors
        # JAMAIS recalculée (alors que `total_suspension_days`, lui, l'était
        # bien) — les jours de suspension cessaient silencieusement d'être
        # répercutés sur l'échéance dès qu'un projet arrivait à sa première
        # reprise sans `initial_end_date` déjà posée. On calcule donc
        # `initial_end_date` dans une variable locale, utilisée pour les deux
        # écritures.
        initial_end_date = project.initial_end_date
        if not initial_end_date and project.start_date and project.delivery_delay_days:
            initial_end_date = add_days(project.start_date, project.delivery_delay_days)
            frappe.db.set_value("Project", self.project, "initial_end_date", initial_end_date)

        # Ajouter les jours de suspension au cumul
        new_total_suspension_days = (project.total_suspension_days or 0) + suspension_days
        frappe.db.set_value("Project", self.project, "total_suspension_days", new_total_suspension_days)

        # Recalculer la nouvelle date de fin
        new_expected_end_date = project.expected_end_date
        if initial_end_date:
            new_expected_end_date = add_days(initial_end_date, new_total_suspension_days)
            frappe.db.set_value("Project", self.project, "expected_end_date", new_expected_end_date)

        # Repasser le projet en cours
        frappe.db.set_value("Project", self.project, "status", "In Progress")

        # BUG CORRIGÉ (symétrique de `_validate_suspension` ci-dessus) :
        # ramène l'Opportunity En pause -> Gagnée, comme le fait déjà
        # `_resume_after_not_founded_verdict` pour un Litige.
        opportunity_name = frappe.db.get_value(
            "Opportunity", {"project": self.project, "status": "En pause"}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "Gagnée")

        # Notifier le client
        self._notify_client(
            title="Projet repris",
            message=f"Votre projet a été repris. Nouvelle date de fin prévue : {new_expected_end_date or 'non définie'}"
        )

        # BUG CORRIGÉ (symétrique de _validate_suspension ci-dessus) :
        # "repris par le client" est faux pour la catégorie "Non-paiement" —
        # c'est le règlement de la facture par l'AGENCE elle-même qui lève la
        # suspension, pas une action du client.
        self._notify_agency(
            title="Projet repris",
            message=(
                "Le projet a repris suite au règlement de votre facture de commission."
                if self.category == "Non-paiement"
                else "Le projet a été repris par le client."
            ),
        )

    def _refuse_suspension(self):
        """Refuse la demande de suspension"""
        self._assert_can_decide()

        # cf. `_validate_suspension` : le champ « moderator » ne porte qu'un
        # vrai modérateur, pas l'une des deux parties en cas de décision amiable.
        user_roles = frappe.get_roles(frappe.session.user)
        if "Moderator" in user_roles or "Administrator" in user_roles:
            frappe.db.set_value(self.doctype, self.name, "moderator", frappe.session.user)

        # Notifier le client
        self._notify_client(
            title="Demande de suspension refusée",
            message=f"Votre demande de suspension a été refusée."
        )

    def _notify_client(self, title, message):
        """Notifie le client du projet"""
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
        """Notifie l'agence associée au projet"""
        # Récupérer l'agence via l'opportunité gagnée
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
	"""AJOUTÉ (demande explicite) : suspend automatiquement le projet lorsque
	l'agence n'a pas réglé sa facture de commission dans le délai imparti
	(PlatformSettings.invoice_payment_deadline_hours, défaut 48h à partir du
	passage En cours du projet — cf. Proposal._create_invoice), sans attendre
	de tâche planifiée quotidienne comme process_invoice_reminders (mécanisme
	distinct, basé sur invoice_due_days, non modifié ici).

	Catégorie « Non-paiement » : c'est une règle financière automatique, sans
	décision humaine à arbitrer (contrairement à « Suspension amiable » ou
	« Litige ») — le document est donc inséré directement avec
	status="Validated" pour réutiliser la cascade on_update() ->
	_validate_suspension() déjà existante (suspend le projet, bascule
	l'Opportunity, notifie les deux parties) plutôt que de dupliquer cette
	logique. Appelée par tasks.suspend_projects_for_unpaid_commission
	(exécutée en tant qu'Administrator, ce qui satisfait
	_assert_can_decide())."""
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
	"""AJOUTÉ (demande explicite) : lève automatiquement la suspension pour
	« Non-paiement » dès que la facture de commission est réglée (appelée par
	api.payment._charge_invoice, juste après invoice_doc.mark_paid() — que le
	règlement soit automatique ou déclenché manuellement via pay_invoice).
	Réutilise la cascade on_update() -> _resume_project() déjà existante
	(recalcule l'échéance, rebascule l'Opportunity, notifie les deux
	parties) ; _resume_project() n'a pas de garde de rôle (contrairement à
	_validate_suspension()), donc appelable indépendamment de qui a réglé la
	facture."""
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
    """Point d'entrée UNIQUE pour toute demande de suspension d'un projet En
    cours (CDC v8 note C12) : `category` distingue la « Suspension amiable »
    (résolue par approve()/refuse()/resume()) du « Litige » (résolu par
    resolve(), avec conséquences financières/PQI, cf. §2.5.2/§2.5.3).
    Remplace la création directe d'InactivityDispute (superseded, cf.
    commentaire dans inactivitydispute.py).

    `category` a un défaut ("Suspension amiable") pour rester compatible avec
    l'appelant historique tasks.py::_escalate_to_suspension_request
    (requested_by="System"), qui ne le précise pas explicitement.
    """
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
        # Un litige suspend immédiatement le projet : il n'y a pas d'étape
        # Validated intermédiaire comme pour une suspension amiable — c'est
        # resolve() qui lèvera la suspension dans les deux verdicts (Founded
        # -> rejet, Not Founded -> reprise directe, cf. note C9).
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
