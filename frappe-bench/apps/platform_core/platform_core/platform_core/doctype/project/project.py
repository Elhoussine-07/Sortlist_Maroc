import frappe
from frappe.model.document import Document


class Project(Document):
    """Logique cœur Frappe : rattachement client, validations de saisie, workflow
    de statuts (Postulé -> Posted -> En cours -> Suspendu -> Terminé/Rejeté, CDC 1.3.1).
    Le champ shortlist_ia (JSON) est renseigné par le microservice de matching via
    l'API REST Frappe — aucun calcul de shortlist ici.
    """

    

    def validate(self):
        if self.budget_min and self.budget_max and self.budget_min > self.budget_max:
            frappe.throw("Le budget minimum ne peut pas être supérieur au budget maximum.")

        if self.delivery_delay_days is not None and self.delivery_delay_days <= 0:
            frappe.throw("Le délai de réalisation doit être un nombre de jours positif.")
        # Note : Project n'a pas de champ "deadline" dans le DocType final ; le seul délai
        # porté par ce document est delivery_delay_days, utilisé pour expected_end_date.

    def on_submit(self):
        self.status = "Posted"
        self._increment_client_projects_published_count()

    def _increment_client_projects_published_count(self):
        if not self.client:
            return
        current = frappe.db.get_value("ClientProfile", self.client, "projects_published_count") or 0
        frappe.db.set_value("ClientProfile", self.client, "projects_published_count", current + 1)

    def on_update(self):
        # BUG CORRIGÉ : `frappe.db.get_value` relit la DB APRÈS que save() ait
        # déjà écrit le nouveau statut (on_update tourne après l'écriture) —
        # il renvoyait donc toujours `self.status`, jamais l'ancien statut, ce
        # qui empêchait TOUTES les branches ci-dessous de jamais se déclencher
        # (leur condition `old_status != X` était toujours fausse dès que
        # `self.status == X`). `get_doc_before_save()` donne le vrai état
        # d'avant modification.
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        if self.status == "Completed" and old_status != "Completed":
            self._notify_client(
                title="Projet terminé",
                message=f"Le projet « {self.title} » est passé au statut Terminé. "
                "Vous pouvez désormais laisser un avis à l'agence depuis Collaborations.",
            )
            # AJOUTÉ : l'agence n'était jusqu'ici jamais notifiée qu'un projet
            # passait Terminé (seul le client l'était) — pourtant c'est aussi
            # le déclencheur de son propre avis sur le client
            # (opportunity.review_client, jusqu'ici sans notification associée).
            self._notify_agency(
                title="Projet terminé",
                message=f"Le projet « {self.title} » est passé au statut Terminé. "
                "Vous pouvez désormais laisser un avis au client.",
            )
            # Pas de champ "completion_date" : la date de fin est déjà tracée via
            # expected_end_date et completion_confirmed_by_client /
            # completion_validated_by_moderator (CDC 1.3.1).

        elif self.status == "Awaiting" and old_status != "Awaiting":
            # Le délai de 48h est porté par Proposal.response_deadline (cf. proposal.py),
            # pas par Project. Aucune écriture supplémentaire nécessaire ici.
            self._notify_client(
                title="Devis en attente de réponse",
                message=f"Un devis a été envoyé pour le projet « {self.title} ». "
                "Vous disposez de 48h pour répondre.",
            )

        elif self.status == "In Progress" and old_status != "In Progress":
            # Le projet démarre : définir la date de début
            start_date = frappe.utils.now()
            frappe.db.set_value("Project", self.name, "start_date", start_date)
            # Verrouiller le CDC (lecture seule)
            frappe.db.set_value("Project", self.name, "cdc_locked", 1)

            # BUG CORRIGÉ : expected_end_date/initial_end_date n'étaient
            # jusqu'ici calculés QUE dans ProjectSuspension._resume_project()
            # (en repli, à la reprise d'une suspension) — un projet n'ayant
            # jamais été suspendu n'avait donc AUCUNE échéance (colonne
            # "Échéance" toujours vide côté UI), et tasks.py::
            # complete_overdue_projects ne pouvait jamais le sélectionner
            # (filtre expected_end_date <= today, jamais vrai sur NULL).
            if self.delivery_delay_days:
                expected_end_date = frappe.utils.add_days(start_date, self.delivery_delay_days)
                frappe.db.set_value(
                    "Project", self.name,
                    {"initial_end_date": expected_end_date, "expected_end_date": expected_end_date},
                )

        elif self.status == "Suspended" and old_status != "Suspended":
            # Le détail de la suspension (justification, dates, jours cumulés) est porté
            # par ProjectSuspension, lié via son champ "project". Project n'ayant pas de
            # champ "agency" direct, l'agence est retrouvée via l'Opportunity Gagnée.
            self._notify_agency(
                title="Projet suspendu",
                message=f"Le projet « {self.title} » est passé au statut Suspendu.",
            )

        elif self.status == "Rejected" and old_status != "Rejected":
            self._notify_client(
                title="Projet rejeté",
                message=f"Le projet « {self.title} » a été rejeté.",
            )

    def repost(self, include_previously_declined=False):
        """CDC §1.5.7 : republication d'un projet resté sans réaction."""
        self.status = "Posted"
        self.repost_count = (self.repost_count or 0) + 1

        if not include_previously_declined:
            # Le calcul de la nouvelle shortlist reste au microservice de
            # matching (cf. docstring de la classe) : on se contente de lui
            # transmettre, via le même canal JSON que shortlist_ia (cf.
            # api.matching.save_shortlist), les agences à exclure de la
            # relance car ayant déjà explicitement refusé ce projet.
            declined_agencies = frappe.get_all(
                "Opportunity",
                filters={"project": self.name, "status": "Archivée", "archive_reason": "Refus agence"},
                pluck="agency",
            )
            if declined_agencies:
                self.shortlist_ia = frappe.as_json({"excluded_agencies": declined_agencies})

        self.save(ignore_permissions=True)
        return self

    def reject(self, substatus):
        """Passage définitif à Rejeté avec sous-statut (CDC §2.5.3 : ajout
        de « Agence défaillante » en plus de Refusé/Supprimé/Client inactif)."""
        self.status = "Rejected"
        self.rejection_substatus = substatus
        self.save(ignore_permissions=True)
        return self

    def complete(self):
        """Passage définitif à Terminé, après confirmation client + validation
        modérateur (CDC §1.5.1)."""
        self.status = "Completed"
        self.save(ignore_permissions=True)
        return self

    def _notify_client(self, title, message):
        if not self.client:
            return
        client_user = frappe.db.get_value("ClientProfile", self.client, "user")
        if not client_user:
            return
        self._create_notification(client_user, "Project", title, message)

    def _notify_agency(self, title, message):
        opportunity = frappe.get_all(
            "Opportunity", filters={"project": self.name, "status": "Gagnée"}, limit=1, fields=["agency"]
        )
        if not opportunity:
            return
        agency_members = frappe.get_all(
            "AgencyMember", filters={"agency": opportunity[0].agency, "status": "Active"}, fields=["user"]
        )
        for member in agency_members:
            self._create_notification(member.user, "Project", title, message)

    def _create_notification(self, user, ntype, title, message):
        # Notification = simple enregistrement de données côté Frappe (cœur métier).
        # L'orchestration avancée (canaux, escalade) reste au microservice notifications.
        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": user,
                "category": ntype,
                "title": title,
                "body": message,
                "reference_doctype": "Project",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)
