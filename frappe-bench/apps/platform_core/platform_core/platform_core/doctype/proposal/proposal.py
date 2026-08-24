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

        # Vérifier que l'agence n'a pas ses offres suspendues
        agency_suspended = frappe.db.get_value("AgencyProfile", self.agency, "offers_suspended")
        if agency_suspended:
            frappe.throw("Cette agence a ses offres suspendues (impayé) et ne peut pas soumettre d'offre.")

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

    def refuse(self):
        self.status = "Refused"
        self.decision_date = frappe.utils.now()
        self.save(ignore_permissions=True)
        return self

    def on_cancel(self):
        # NOTE : mort-code — Proposal n'ayant pas is_submittable=1, Frappe
        # n'autorise jamais l'appel à doc.cancel() pour ce DocType ; ce hook
        # ne sera donc jamais invoqué. Conservé pour ne pas perdre l'intention
        # si is_submittable est activé plus tard. Le cycle d'annulation réel
        # (cf. champ cancellation_status) n'est pas câblé dans ce périmètre.
        self._update_opportunity(status="Archivée")

    def _update_opportunity(self, status, archive_reason=None):
        """Met à jour le statut de l'opportunité associée.
        BUG CORRIGÉ : utilisait `frappe.db.set_value` (écriture DB directe),
        qui NE DÉCLENCHE PAS `Opportunity.on_update` — toute la logique de
        transition côté Opportunity (_handle_won, _handle_archiving,
        recompute_project_status...) était donc silencieusement contournée
        sur le parcours réel (client répond à un devis). On passe par
        `.save()` pour que ces hooks s'exécutent normalement."""
        opportunity = frappe.get_all(
            "Opportunity", filters={"project": self.project, "agency": self.agency}, limit=1, pluck="name"
        )
        if not opportunity:
            return
        doc = frappe.get_doc("Opportunity", opportunity[0])
        doc.status = status
        if archive_reason:
            doc.archive_reason = archive_reason
        doc.save(ignore_permissions=True)

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
        # BUG CORRIGÉ : `frappe.db.get_value` relit la DB APRÈS que save() ait
        # déjà écrit le nouveau statut (on_update tourne après l'écriture) —
        # il renvoyait donc toujours `self.status`, jamais l'ancien statut.
        # Conséquence réelle : `self.status == "Accepted" and old_status !=
        # "Accepted"` était TOUJOURS fausse (old_status valait aussi
        # "Accepted"), donc `_handle_acceptance()`/`_handle_refusal()` ne se
        # déclenchaient jamais — `accept()`/`refuse()` changeaient le statut
        # du devis sans jamais répercuter quoi que ce soit sur l'Opportunity
        # ou le Project (ni facture, ni notification). `get_doc_before_save()`
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
        """Lorsque le client accepte l'offre : met à jour projet et opportunité.
        BUG CORRIGÉ : passait auparavant par `_update_opportunity` en écriture
        DB brute (`frappe.db.set_value`), qui contourne `Opportunity.on_update`
        et donc `_handle_won` (CDC verrouillé, date de début, clôture
        automatique des autres relations — cf. §1.5.7) — cette méthode
        dupliquait seulement le passage `Project.status = "In Progress"` sans
        le reste. `_update_opportunity` passe désormais par `.save()`, donc
        `_handle_won` s'exécute réellement et couvre tout ça ; la ligne
        redondante ci-dessous est retirée."""
        # Mettre à jour l'opportunité (déclenche Opportunity._handle_won)
        self._update_opportunity(status="Gagnée")

        # Mettre à jour la date de décision
        frappe.db.set_value(self.doctype, self.name, "decision_date", now())

        # Créer une notification pour l'agence
        self._notify_agency("Offre acceptée", f"Votre offre pour le projet a été acceptée.")

        # AJOUTÉ (demande explicite) : le montant de l'offre (frais de projet)
        # est dû par le CLIENT à l'AGENCE — distinct de la commission
        # plateforme facturée ci-dessous via _create_invoice(). Le client règle
        # ce montant via api.client.pay_agency_for_project (cf. ProjectPayment).
        frappe.db.set_value("Project", self.project, "payment_status", "À payer")

        # Générer automatiquement la facture de commission plateforme, avec
        # échéance de règlement (CDC : 48h avant suspension automatique du projet)
        self._create_invoice()

    def _handle_refusal(self):
        """Lorsque le client refuse l'offre : met à jour projet et opportunité.
        BUG CORRIGÉ : rejetait le projet inconditionnellement, même si
        d'autres relations (autres agences, cf. Multicast §1.5.7) étaient
        encore actives sur le même projet — celui-ci passait Rejeté alors
        qu'il aurait dû rester Postulé/En attente en attendant les autres
        agences. `_update_opportunity` passe désormais par `.save()`, ce qui
        déclenche `Opportunity._handle_archiving` -> `recompute_project_status`,
        qui applique la bonne règle (Rejeté seulement si TOUTES les relations
        sont closes)."""
        # Mettre à jour l'opportunité (déclenche Opportunity._handle_archiving)
        self._update_opportunity(status="Archivée", archive_reason="Refus client")

        # Mettre à jour la date de décision
        frappe.db.set_value(self.doctype, self.name, "decision_date", now())

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
        """Génère automatiquement une facture de commission lorsque l'offre est
        acceptée (CDC 2.5.1), puis tente de la régler immédiatement (CDC
        §2.5.1 : « le paiement doit se faire automatiquement » — l'agence ne
        doit pas avoir à payer manuellement une facture après acceptation du
        devis par le client). Le règlement automatique n'a lieu que si
        l'agence a déjà un moyen de paiement par défaut enregistré (cf.
        `payment.register_payment_method`) ; sinon la facture reste "Pending",
        réglable plus tard via `payment.pay_invoice` — mais au-delà de
        `invoice_payment_deadline_hours` (défaut 48h, demande explicite) sans
        règlement, le projet est automatiquement suspendu (cf.
        tasks.suspend_projects_for_unpaid_commission /
        ProjectSuspension.suspend_for_unpaid_invoice)."""
        settings = frappe.get_single("PlatformSettings")
        # Seuls 5% (et non le montant total du projet) sont dus à la
        # plateforme — le solde de l'offre revient à l'agence, réglé
        # directement par le client (cf. _handle_acceptance ci-dessus).
        commission_rate = settings.commission_rate or 5
        deadline_hours = settings.invoice_payment_deadline_hours or 48

        # Créer la facture
        invoice = frappe.get_doc(
            {
                "doctype": "Invoice",
                "agency": self.agency,
                "project": self.project,
                "proposal": self.name,
                "amount": self.amount,
                "commission_rate": commission_rate,
                "status": "Pending",
                "issue_date": frappe.utils.nowdate(),
                "payment_deadline": now_datetime() + timedelta(hours=deadline_hours),
            }
        )
        invoice.insert(ignore_permissions=True)

        from platform_core.platform_core.api.payment import _charge_invoice

        result = _charge_invoice(invoice, self.agency)

        if not result:
            # Pas de moyen de paiement par défaut : la facture reste "Pending"
            # — l'agence doit être avertie explicitement du délai, sans quoi
            # elle découvrirait la suspension automatique après coup.
            invoice.reload()
            invoice._notify_agency(
                title="Facture de commission à régler sous "
                f"{deadline_hours}h",
                message=(
                    f"Une facture de commission de {invoice.commission_amount} a été générée pour "
                    f"le projet. Réglez-la avant le {invoice.payment_deadline} pour éviter la "
                    "suspension automatique du projet."
                ),
            )


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

    # CDC : « ce devis doit contenir les infos de l'agence en format PDF
    # pour une bonne expérience utilisateur » — généré automatiquement
    # (le frontend actuel n'envoie jamais `devis_file`, cf. `sendQuote` côté
    # `opportunities.service.ts`) sauf si un fichier a déjà été fourni par
    # l'appelant.
    if not doc.devis_file:
        from platform_core.platform_core.devis import generate_devis

        generate_devis(doc.name)
        doc.reload()

    return doc
