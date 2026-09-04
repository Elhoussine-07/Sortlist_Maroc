import frappe
from frappe.model.document import Document
from frappe.utils import now


class Opportunity(Document):
    """Logique cœur Frappe : création et cycle de vie de l'opportunité (CDC 2.3).

    matching_score et success_prediction (Read Only) ne sont jamais calculés ici :
    ils sont écrits par le microservice de matching via l'API REST Frappe.
    """

    def before_insert(self):
        # Vérifier que le projet et l'agence existent
        if not self.project or not self.agency:
            frappe.throw("Une opportunité doit être rattachée à un projet et à une agence.")

        # Vérifier que le projet existe
        if not frappe.db.exists("Project", self.project):
            frappe.throw(f"Le projet {self.project} n'existe pas.")

        # Vérifier que l'agence existe
        if not frappe.db.exists("AgencyProfile", self.agency):
            frappe.throw(f"L'agence {self.agency} n'existe pas.")

        # Empêcher les doublons
        self._prevent_duplicate_opportunity()

        # Définir le statut par défaut
        if not self.status:
            self.status = "Reçue"

        # Déduire la source si non définie
        if not self.source:
            self._infer_source_from_project_channel()

    def _prevent_duplicate_opportunity(self):
        """Empêche la création d'une deuxième opportunité active pour le même
        couple (project, agency) — une seule opportunité doit exister par agence
        contactée pour un projet donné, tant qu'elle n'est pas Archivée."""
        existing = frappe.get_all(
            "Opportunity",
            filters={
                "project": self.project,
                "agency": self.agency,
                "status": ["!=", "Archivée"],
            },
            limit=1,
        )
        if existing:
            frappe.throw("Une opportunité active existe déjà pour ce projet et cette agence.")

    def _infer_source_from_project_channel(self):
        """Project.channel (Smart Briefing / Unicast / Multicast) détermine
        Opportunity.source (Shortlist IA / Unicast / Multicast) — cf. CDC 1.3.2."""
        channel = frappe.db.get_value("Project", self.project, "channel")
        mapping = {
            "Smart Briefing": "Shortlist IA",
            "Unicast": "Unicast",
            "Multicast": "Multicast",
        }
        if channel in mapping:
            self.source = mapping[channel]

    def on_update(self):
        """Gère les changements de statut de l'opportunité"""
        # BUG CORRIGÉ : ce `get_value` relisait la DB APRÈS que save() ait déjà
        # écrit le nouveau statut (on_update tourne après l'écriture) — il
        # renvoyait donc toujours `self.status`, jamais le statut précédent.
        # `self.get_doc_before_save()` (fourni par Frappe) donne le vrai état
        # AVANT la modification en cours.
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        # Si le statut passe à "Gagnée"
        if self.status == "Gagnée" and old_status != "Gagnée":
            self._handle_won()

        # Si le statut passe à "Archivée"
        elif self.status == "Archivée" and old_status != "Archivée":
            self._handle_archiving(old_status)

        # Si le statut passe à "Acceptée"
        elif self.status == "Acceptée" and old_status != "Acceptée":
            self._handle_accepted()

        # Devis envoyé (cf. Proposal.after_insert -> _update_opportunity) :
        # le statut global du projet doit refléter cette relation (CDC §1.5.7).
        elif self.status == "Devis envoyé" and old_status != "Devis envoyé":
            recompute_project_status(self.project)

    def _handle_won(self):
        """Gère le passage au statut 'Gagnée' (client a accepté)"""
        # Définir la date d'acceptation
        if not self.accepted_on:
            frappe.db.set_value(self.doctype, self.name, "accepted_on", now())

        start_date = now()

        # Mettre à jour le projet : En cours
        frappe.db.set_value("Project", self.project, "status", "In Progress")

        # Mettre à jour la date de début du projet
        frappe.db.set_value("Project", self.project, "start_date", start_date)

        # Verrouiller le CDC
        frappe.db.set_value("Project", self.project, "cdc_locked", 1)

        # BUG CORRIGÉ : c'est ICI, pas dans Project.on_update (qui ne se
        # déclenche que via Document.save(), jamais utilisé sur ce chemin —
        # tout ce passage "En cours" se fait via frappe.db.set_value, qui
        # contourne les hooks), que le projet démarre réellement dans le cas
        # nominal (client accepte un devis). expected_end_date/
        # initial_end_date n'étaient donc JAMAIS calculées en pratique
        # (colonne "Temps restant" toujours vide), même après le fix côté
        # Project.on_update.
        delivery_delay_days = frappe.db.get_value("Project", self.project, "delivery_delay_days")
        if delivery_delay_days:
            expected_end_date = frappe.utils.add_days(start_date, delivery_delay_days)
            frappe.db.set_value(
                "Project", self.project,
                {"initial_end_date": expected_end_date, "expected_end_date": expected_end_date},
            )

        # Notifier l'agence
        self._notify_agency(
            title="Opportunité gagnée",
            message=f"Félicitations ! Vous avez remporté le projet."
        )

        # BUG CORRIGÉ (CDC §1.5.7, "Clôture automatique des autres relations") :
        # dès qu'une relation devient Gagnée, toutes les autres relations
        # encore actives pour le même projet doivent basculer automatiquement
        # en Archivée / "Perdue — projet attribué ailleurs", avec notification,
        # SANS affecter le score de pertinence de l'agence (ce n'est pas un
        # refus). Rien ne le faisait jusqu'ici : les autres agences restaient
        # indéfiniment dans "Offres" sur un projet déjà attribué ailleurs.
        self._close_other_relations()

    def _close_other_relations(self):
        others = frappe.get_all(
            "Opportunity",
            filters={
                "project": self.project,
                "name": ["!=", self.name],
                "status": ["not in", ["Gagnée", "Archivée", "Terminée"]],
            },
            pluck="name",
        )
        for other_name in others:
            other = frappe.get_doc("Opportunity", other_name)
            other.archive("Perdue — projet attribué ailleurs")

    def _handle_accepted(self):
        """Gère le passage au statut 'Acceptée' (agence a accepté)"""
        # Mettre à jour la date d'acceptation si non définie
        if not self.accepted_on:
            frappe.db.set_value(self.doctype, self.name, "accepted_on", now())

        # Notifier le client (via le projet)
        self._notify_client(
            title="Offre acceptée par l'agence",
            message="L'agence a accepté votre projet et prépare un devis."
        )

    def _handle_archiving(self, old_status=None):
        """Gère le passage au statut 'Archivée'"""
        # Définir la date d'archivage
        if not self.archived_on:
            frappe.db.set_value(self.doctype, self.name, "archived_on", now())

        # Vérifier que le motif est présent
        if not self.archive_reason:
            frappe.throw("Un motif d'archivage (archive_reason) est requis pour une opportunité Archivée.")

        # BUG CORRIGÉ : cette condition relisait `self.status` déjà écrit en
        # DB (toujours "Archivée" à ce stade), donc n'était jamais vraie.
        # `old_status` (passé par on_update, cf. get_doc_before_save) porte le
        # vrai statut d'avant — ex. une opportunité Gagnée révoquée suite à un
        # litige résolu en faveur du client (cf. 2.5.2/2.5.3).
        if old_status == "Gagnée":
            frappe.db.set_value("Project", self.project, "status", "Rejected")
            return

        # CDC §1.5.6/§1.5.7 : un refus (à réception ou après acceptation sans
        # devis) ne rejette le projet côté client QUE si aucune autre relation
        # n'est encore active pour ce même projet — sinon celui-ci reste
        # "Postulé"/"En attente" en attendant les autres agences. BUG CORRIGÉ :
        # rien ne mettait à jour `Project.status` dans ce cas auparavant, quel
        # que soit le nombre de relations restantes.
        recompute_project_status(self.project)

    def accept(self):
        """CDC §1.5.6 étape 2 / §2.3 : l'agence accepte l'opportunité — elle
        reste visible dans Offres avec le bouton « Envoyer un devis ». Le
        passage Projet -> En cours n'intervient qu'au gain (status='Gagnée',
        cf. _handle_won), pas à l'acceptation."""
        self.status = "Acceptée"
        self.save(ignore_permissions=True)
        return self

    def decline(self, reason="Refus agence"):
        """L'agence refuse l'opportunité : archivage avec motif."""
        self.status = "Archivée"
        self.archive_reason = reason
        self.save(ignore_permissions=True)
        return self

    def cancel_acceptance(self):
        """CDC §1.5.6 « Point d'attention » : une agence qui a Accepté mais n'a
        pas encore envoyé de devis peut annuler et revenir à Reçue."""
        if self.status != "Acceptée":
            frappe.throw("Seule une opportunité Acceptée peut voir son acceptation annulée.")
        if frappe.db.exists("Proposal", {"opportunity": self.name}):
            frappe.throw("Un devis a déjà été envoyé pour cette opportunité : impossible d'annuler l'acceptation.")
        self.status = "Reçue"
        self.save(ignore_permissions=True)
        return self

    def mark_completed(self):
        """Utilisée par la validation modérateur de fin de projet (CDC §1.5.1)."""
        self.status = "Terminée"
        self.save(ignore_permissions=True)
        return self

    def archive(self, reason):
        """Archivage générique avec motif (ex : escalade automatique, cf. tasks.py)."""
        self.status = "Archivée"
        self.archive_reason = reason
        self.save(ignore_permissions=True)
        return self

    def _notify_agency(self, title, message):
        """Notifie l'agence propriétaire de l'opportunité"""
        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(self.agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Opportunity",
                "title": title,
                "body": message,
                "reference_doctype": "Opportunity",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

    def _notify_client(self, title, message):
        """Notifie le client via le projet"""
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
                "category": "Opportunity",
                "title": title,
                "body": message,
                "reference_doctype": "Opportunity",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)


def create_from_project(project, agency, source=None, matching_score=None):
    """Crée une Opportunity pour le couple (project, agency), appelée depuis
    quick_actions.py (Unicast/Multicast/Shortlist IA, cf. §1.3.2 et 1.3.4).
    `source` peut être fourni explicitement, ou laissé à None pour que
    before_insert() le déduise depuis Project.channel."""
    doc = frappe.get_doc({
        "doctype": "Opportunity",
        "project": project,
        "agency": agency,
        "source": source,
    })
    if matching_score is not None:
        doc.matching_score = matching_score
    doc.insert(ignore_permissions=True)
    return doc


def recompute_project_status(project):
    """CDC §1.5.7 : « le statut affiché dans Mes Projets se déduit
    automatiquement de l'ensemble des relations actives » — plutôt que
    d'écrire `Project.status` de façon ponctuelle à chaque transition
    d'Opportunity (ce qui avait laissé plusieurs cas non couverts, cf.
    `_handle_archiving`/`Proposal.after_insert`), ce point d'entrée unique
    recalcule le statut projet à partir de TOUTES ses relations à chaque
    changement pertinent.

    Ne touche jamais un projet déjà sorti du pipeline d'opportunités (Brouillon,
    En cours, Suspendu, Terminé, ou Rejeté pour un autre motif — suppression,
    litige : ces cas sont gérés par leurs propres points d'entrée, cf.
    api.project). "Gagnée" n'est volontairement pas géré ici : le passage à
    "En cours" reste la responsabilité de `_handle_won`, appelé au moment
    exact de la victoire (avec verrouillage du CDC, date de début, etc.).

    DÉCISION PRODUIT (demande explicite) : un projet ne repasse plus jamais
    "Rejeté" simplement parce que toutes les agences CONTACTÉES ont refusé —
    il reste "Postulé", donc toujours visible dans "Disponibles" pour
    n'importe quelle autre agence non encore sollicitée. Avant ce changement,
    un refus (même d'une seule agence en Unicast) pouvait faire disparaître
    définitivement le projet de la recherche, alors qu'une autre agence
    pouvait encore être intéressée — le client devait alors explicitement
    "Repostuler" pour le relancer. Le rejet automatique sur épuisement des
    relations est retiré ; le client garde la main pour supprimer/republier
    le projet lui-même s'il le souhaite (delete_project/repost)."""
    current_status = frappe.db.get_value("Project", project, "status")
    if current_status not in ("Posted", "Awaiting"):
        return

    rows = frappe.get_all("Opportunity", filters={"project": project}, fields=["status", "source"])
    if not rows:
        return

    statuses = [row.status for row in rows]

    if "Gagnée" in statuses:
        return  # cf. _handle_won, déjà traité à la source

    if "Devis envoyé" in statuses:
        if current_status != "Awaiting":
            frappe.db.set_value("Project", project, "status", "Awaiting")
        return

    # Plus aucun devis en attente (toutes les relations contactées sont
    # Archivée, ou aucune n'a encore été créée) : le projet reste "Postulé",
    # toujours disponible pour de nouvelles agences.
    if current_status != "Posted":
        frappe.db.set_value("Project", project, "status", "Posted")
