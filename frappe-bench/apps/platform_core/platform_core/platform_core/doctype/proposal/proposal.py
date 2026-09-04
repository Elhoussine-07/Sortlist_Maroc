from datetime import timedelta

import frappe
from frappe.model.document import Document
from frappe.utils import now, now_datetime

# NOTE : response_deadline (Datetime) est exprimé en HEURES par le CDC (48h, cf. 1.3.3).
# frappe.utils.add_days ne permet pas cette précision ; timedelta est utilisé ici en
# dérogation ciblée, faute d'alternative horaire dans la liste d'API imposée.


class Proposal(Document):
    """Logique cœur Frappe : workflow d'acceptation/devis en deux étapes (CDC 1.3.3).
    Aucune logique de prédiction de succès ici (Opportunity.success_prediction est
    écrit par le microservice de matching via l'API REST Frappe).
    """

    def validate(self):
        if not self.amount or self.amount <= 0:
            frappe.throw("Le montant de l'offre doit être supérieur à 0.")
        self._prevent_duplicate_active_proposal()

        # NOTE DE CONCEPTION : Proposal n'a pas is_submittable=1 (cf.
        # proposal.json) — before_submit()/on_submit()/on_cancel() ne sont
        # donc JAMAIS déclenchés par un save() classique (doc.submit()/
        # doc.cancel() lèveraient même une erreur Frappe puisque is_submittable
        # est désactivé). La logique historiquement placée dans before_submit()
        # est donc rapatriée ici, restreinte à la création (self.is_new()) pour
        # ne pas ré-exécuter les contrôles "projet Posted" lors des sauvegardes
        # ultérieures (accept()/refuse() changent justement le statut du
        # projet). L'équivalent de on_submit() est after_insert() ci-dessous.
        if self.is_new():
            self._validate_new_proposal()
            self.submitted_date = now()
            self._set_response_deadline()

    def _validate_new_proposal(self):
        # Vérifier que l'utilisateur est une Agence
        user_roles = frappe.get_roles(frappe.session.user)
        if "Agency" not in user_roles and "Administrator" not in user_roles:
            frappe.throw("Seules les Agences et Administrateurs peuvent soumettre une offre.")

        # Vérifier que le projet est au statut "Posted"
        project_status = frappe.db.get_value("Project", self.project, "status")
        if project_status != "Posted":
            frappe.throw("Le projet doit être au statut Posted pour envoyer une offre.")

        # DÉSACTIVÉ (demande explicite, phase de test) : ce blocage empêchait
        # toute agence dont une facture de commission avait dépassé le seuil
        # "très en retard" (cf. tasks.py::process_invoice_reminders) d'envoyer
        # un devis sur N'IMPORTE QUEL projet, sans aucun moyen automatique de
        # lever le blocage même après paiement. Gardé en commentaire (pas
        # supprimé) pour réactivation facile une fois un vrai mécanisme de
        # levée automatique du flag en place.
        # agency_suspended = frappe.db.get_value("AgencyProfile", self.agency, "offers_suspended")
        # if agency_suspended:
        #     frappe.throw("Cette agence a ses offres suspendues (impayé) et ne peut pas soumettre d'offre.")

    def _prevent_duplicate_active_proposal(self):
        """Empêche les doublons d'offres actives (Sent ou Accepted) pour un même projet et agence"""
        existing = frappe.get_all(
            "Proposal",
            filters={
                "project": self.project,
                "agency": self.agency,
                "status": ["in", ["Sent", "Accepted"]],
                "name": ["!=", self.name or ""],
            },
            limit=1,
        )
        if existing:
            frappe.throw("Une offre Sent ou Accepted existe déjà pour ce projet et cette agence.")

    def _set_response_deadline(self):
        """Définit la date limite de réponse (48h par défaut, configurable)"""
        quote_response_hours = (
            frappe.db.get_single_value("PlatformSettings", "quote_response_hours") or 48
        )
        self.response_deadline = now_datetime() + timedelta(hours=quote_response_hours)

    def after_insert(self):
        """Équivalent de l'ancien on_submit() : Proposal n'étant pas
        is_submittable, after_insert() est le hook fiable pour « l'offre vient
        d'être envoyée » (systématiquement déclenché par insert(), contrairement
        à on_submit())."""
        self._update_opportunity(status="Devis envoyé")
        self._notify_client()

    def accept(self):
        self.status = "Accepted"
        self.decision_date = frappe.utils.now()
        self.save(ignore_permissions=True)
        return self

    def refuse(self, message=None):
        self.status = "Refused"
        self.decision_date = frappe.utils.now()
        # AJOUTÉ (demande explicite, négociation) : message optionnel du
        # client (motif / contre-proposition), transmis à l'agence via
        # _handle_refusal(). self.flags (fourni par Frappe, jamais persisté
        # ni validé comme un vrai champ du doctype) évite d'avoir à ajouter
        # une colonne à Proposal juste pour faire transiter cette valeur
        # jusqu'à on_update(), appelé sur cette même instance par save().
        self.flags.refusal_message = message
        self.save(ignore_permissions=True)
        return self

    def on_cancel(self):
        # NOTE : mort-code — Proposal n'ayant pas is_submittable=1, Frappe
        # n'autorise jamais l'appel à doc.cancel() pour ce DocType ; ce hook
        # ne sera donc jamais invoqué. Conservé pour ne pas perdre l'intention
        # si is_submittable est activé plus tard. Le cycle d'annulation réel
        # (cf. champ cancellation_status) n'est pas câblé dans ce périmètre.
        self._update_opportunity(status="Archivée", archive_reason="Devis annulé")

    def _update_opportunity(self, status, archive_reason=None):
        """Met à jour le statut de l'opportunité associée.

        BUG CORRIGÉ : passe désormais par .save() (via frappe.get_doc), pas
        frappe.db.set_value() — l'ancienne écriture SQL directe contournait
        entièrement Opportunity.on_update(), qui porte pourtant toute la
        vraie logique de transition : _handle_won() (Projet -> En cours,
        verrouillage CDC, échéance, clôture automatique des autres relations
        actives sur le même projet, cf. CDC §1.5.7) pour "Gagnée",
        _handle_archiving() (recompute_project_status, qui ne rejette le
        projet que si AUCUNE autre relation n'est encore active, cf.
        §1.5.6/§1.5.7) pour "Archivée". Sur l'ancien chemin (accepter/refuser
        un devis, le flux normal côté client), rien de tout ça ne s'exécutait
        jamais — seule la réécriture partielle et en dur faite directement
        dans _handle_acceptance()/_handle_refusal() avait un effet visible.

        BUG CORRIGÉ (2) : recherchait l'Opportunity par (project, agency)
        (frappe.get_all(..., limit=1), sans tri) au lieu d'utiliser le lien
        direct et fiable self.opportunity (champ Link obligatoire, renseigné
        dès la création du devis par send_quote) — si cette recherche ne
        retombait pas sur la bonne ligne (ou sur rien), l'Opportunity liée au
        devis réellement accepté/refusé n'était jamais mise à jour, sans la
        moindre erreur visible.
        """
        opportunity_name = self.opportunity or frappe.db.get_value(
            "Opportunity", {"project": self.project, "agency": self.agency}, "name"
        )
        if not opportunity_name:
            return
        opp_doc = frappe.get_doc("Opportunity", opportunity_name)
        opp_doc.status = status
        if archive_reason:
            opp_doc.archive_reason = archive_reason
        opp_doc.save(ignore_permissions=True)

    def _notify_client(self):
        """Notifie le client qu'un devis a été envoyé"""
        client = frappe.db.get_value("Project", self.project, "client")
        if not client:
            return

        client_user = frappe.db.get_value("ClientProfile", client, "user")
        if not client_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": client_user,
                "category": "Proposal",
                "title": "Nouveau devis reçu",
                "body": f"Un devis de {self.amount} a été envoyé pour votre projet.",
                "reference_doctype": "Proposal",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

    def on_update(self):
        """Gère les changements de statut de l'offre"""
        # BUG CORRIGÉ : ce `frappe.db.get_value` relisait la DB APRÈS que
        # save() ait déjà écrit le nouveau statut (on_update tourne après
        # l'écriture) — il renvoyait donc toujours self.status, jamais le
        # statut précédent, donc `old_status != "Accepted"`/`!= "Refused"`
        # étaient TOUJOURS faux et _handle_acceptance()/_handle_refusal()
        # n'étaient jamais appelées, quel que soit leur contenu. Même bug déjà
        # corrigé (avec le même correctif) dans Opportunity.on_update() et
        # Project.on_update() — jamais appliqué ici. self.get_doc_before_save()
        # donne le vrai état d'avant modification.
        before = self.get_doc_before_save()
        old_status = before.status if before else None

        # Si le statut passe à "Accepted" (client accepte)
        if self.status == "Accepted" and old_status != "Accepted":
            self._handle_acceptance()

        # Si le statut passe à "Refused" (client refuse)
        elif self.status == "Refused" and old_status != "Refused":
            self._handle_refusal()

    def _handle_acceptance(self):
        """Lorsque le client accepte l'offre : fait gagner l'opportunité.

        BUG CORRIGÉ : ne réécrit plus Project.status en dur ici —
        _update_opportunity(status="Gagnée") passe maintenant par .save(),
        donc Opportunity._handle_won() s'exécute réellement et gère TOUT
        l'effet de bord du gain (Projet -> En cours, verrouillage CDC,
        expected_end_date/initial_end_date, clôture automatique des autres
        relations actives sur le projet, notification agence dédiée) — la
        réécriture partielle faite ici en double faisait double emploi tout
        en oubliant la moitié de ces effets (jamais déclenchés avant ce fix).
        """
        self._update_opportunity(status="Gagnée")

        # Mettre à jour la date de décision
        frappe.db.set_value(self.doctype, self.name, "decision_date", now())

        # Créer une notification pour l'agence (distincte de celle, plus
        # générique, envoyée par Opportunity._handle_won)
        self._notify_agency("Offre acceptée", f"Votre offre pour le projet a été acceptée.")

        # Générer automatiquement la facture (commission)
        self._create_invoice()

    def _handle_refusal(self):
        """Lorsque le client refuse un DEVIS : rouvre la négociation au lieu
        de fermer la relation.

        CHANGEMENT PRODUIT (demande explicite) : refuser un devis n'archive
        plus l'Opportunity — elle repasse "Acceptée" (le même état qu'avant
        l'envoi du premier devis), ce qui permet à l'agence d'en renvoyer un
        nouveau, ajusté, sans repartir de zéro. Un vrai refus définitif de
        relation (l'agence qui décline l'invitation avant même de proposer
        un prix) reste possible via Opportunity.decline(), inchangé.

        Écriture directe (frappe.db.set_value), pas .save() : passer par
        .save() redéclencherait Opportunity._handle_accepted() (accepted_on,
        notification client "L'agence a accepté votre projet...") — un faux
        signal ici, puisque rien de nouveau n'a été accepté. recompute_
        project_status() est donc appelé explicitement pour rouvrir le
        projet à "Postulé" si plus aucune autre relation n'est en attente
        (même logique que pour un archivage, cf. Opportunity._handle_
        archiving), sans repasser par les hooks d'acceptation.
        """
        opportunity_name = self.opportunity or frappe.db.get_value(
            "Opportunity", {"project": self.project, "agency": self.agency}, "name"
        )
        if opportunity_name:
            frappe.db.set_value("Opportunity", opportunity_name, "status", "Acceptée")
            from platform_core.platform_core.doctype.opportunity.opportunity import (
                recompute_project_status,
            )
            recompute_project_status(self.project)

        # Mettre à jour la date de décision
        frappe.db.set_value(self.doctype, self.name, "decision_date", now())

        # Notifie l'agence, avec le message de négociation du client s'il en
        # a laissé un — la relation reste ouverte, elle peut directement
        # renvoyer un devis ajusté (pas besoin de repostuler).
        feedback = self.flags.refusal_message
        body = "Le client a refusé votre devis"
        body += f" : « {feedback} »" if feedback else "."
        body += " Vous pouvez lui envoyer un nouveau devis ajusté."
        self._notify_agency("Devis refusé — vous pouvez renégocier", body)

    def _notify_agency(self, title, message):
        """Notifie l'agence propriétaire de l'offre"""
        from platform_core.platform_core.doctype.agencymember.agencymember import get_agency_owner_email

        agency_user = get_agency_owner_email(self.agency)
        if not agency_user:
            return

        frappe.get_doc(
            {
                "doctype": "Notification",
                "recipient": agency_user,
                "category": "Proposal",
                "title": title,
                "body": message,
                "reference_doctype": "Proposal",
                "reference_name": self.name,
            }
        ).insert(ignore_permissions=True)

    def _create_invoice(self):
        """Génère automatiquement une facture de commission lorsque l'offre est acceptée (CDC 2.5.1)"""
        # Récupérer le projet pour obtenir le client
        project = frappe.get_doc("Project", self.project)

        # Récupérer la commission_rate depuis PlatformSettings
        commission_rate = frappe.db.get_single_value("PlatformSettings", "commission_rate") or 10

        # Créer la facture
        frappe.get_doc(
            {
                "doctype": "Invoice",
                "agency": self.agency,
                "project": self.project,
                "proposal": self.name,
                "amount": self.amount,
                "commission_rate": commission_rate,
                "status": "Pending",
                "issue_date": frappe.utils.nowdate(),
                "due_date": frappe.utils.add_days(frappe.utils.nowdate(), 7),
            }
        ).insert(ignore_permissions=True)


def send_quote(opportunity, amount, description=None, devis_file=None):
    """Crée le devis (Proposal) d'une agence pour une Opportunity — appelée
    par api.opportunity.send_quote. project/agency sont dérivés de
    l'Opportunity ; response_deadline/submitted_date sont initialisés par
    Proposal.validate() (cf. _validate_new_proposal/_set_response_deadline),
    déclenché par insert()."""
    opp = frappe.get_doc("Opportunity", opportunity)
    doc = frappe.get_doc({
        "doctype": "Proposal",
        "opportunity": opp.name,
        "project": opp.project,
        "agency": opp.agency,
        "amount": amount,
        "description": description,
        "devis_file": devis_file,
    })
    doc.insert(ignore_permissions=True)
    return doc
