# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

class AgencyJoinRequest(Document):
    """
    Doctype qui gère les demandes de rattachement à une agence.
    Quand un utilisateur demande à rejoindre une agence, une demande est créée.
    Un membre Owner de l'agence peut approuver ou refuser la demande.
    """

    def before_insert(self):
        """Vérification avant insertion"""
        # Vérifier si une demande est déjà en attente pour cet utilisateur et cette agence
        existing = frappe.db.exists(
            "AgencyJoinRequest",
            {
                "user": self.user,
                "agency": self.agency,
                "status": "Pending"
            }
        )
        if existing:
            frappe.throw("Une demande de rattachement est déjà en attente pour cette agence.")

        # Vérifier si l'utilisateur est déjà membre de cette agence
        existing_member = frappe.db.exists(
            "AgencyMember",
            {
                "user": self.user,
                "agency": self.agency,
                "status": "Active"
            }
        )
        if existing_member:
            frappe.throw("Cet utilisateur est déjà membre de cette agence.")

    def validate(self):
        """Validation du document"""
        self.set_default_status()

    def set_default_status(self):
        """Définit le statut par défaut"""
        if not self.status:
            self.status = "Pending"

        if not self.request_date:
            self.request_date = nowdate()

    def approve(self, decided_by=None):
        """Approuve la demande et crée un membre d'agence"""
        if self.status != "Pending":
            frappe.throw("Cette demande n'est pas en attente.")

        # Créer un nouveau membre d'agence
        member = frappe.get_doc({
            "doctype": "AgencyMember",
            "user": self.user,
            "agency": self.agency,
            "member_role": self.requested_role or "Member",
            "status": "Active",
            "joined_on": nowdate()
        })
        member.insert(ignore_permissions=True)

        # Mettre à jour le statut de la demande
        self.status = "Approved"
        self.decided_by = decided_by
        self.decision_date = frappe.utils.now()
        # BUG CORRIGÉ : `save()` sans `ignore_permissions=True` exigeait une
        # règle de permission Frappe sur AgencyJoinRequest pour le rôle Agency
        # (absente) — plantait avec "n'a pas d'accès... via l'autorisation de
        # rôle" alors que l'appelant (`agency.py::approve_join_request`) a
        # déjà vérifié `req.agency == claims["agency_id"]` et
        # `assert_agency_member(...)` en amont : la permission métier est
        # donc déjà garantie à ce stade, comme pour `member.insert(...)`
        # juste au-dessus.
        self.save(ignore_permissions=True)

        # Ajouter le rôle Agency à l'utilisateur si pas déjà présent
        user = frappe.get_doc("User", self.user)
        if "Agency" not in [role.role for role in user.roles]:
            user.add_roles("Agency")
            frappe.db.commit()

        # Envoyer une notification
        self._send_notification("approved")

        return self

    def reject(self, reason=None, decided_by=None):
        """Refuse la demande"""
        if self.status != "Pending":
            frappe.throw("Cette demande n'est pas en attente.")

        self.status = "Rejected"
        self.rejection_reason = reason
        self.decided_by = decided_by
        self.decision_date = frappe.utils.now()
        # BUG CORRIGÉ : même raison que approve() ci-dessus — la permission
        # métier (agence propriétaire de la demande, membre actif) est déjà
        # vérifiée par l'appelant (`agency.py::reject_join_request`).
        self.save(ignore_permissions=True)

        # Envoyer une notification
        self._send_notification("rejected", reason)

        return self

    def _send_notification(self, action, reason=None):
        """Envoie une notification à l'utilisateur"""
        try:
            user_email = frappe.db.get_value("User", self.user, "email")
            agency_name = frappe.db.get_value("AgencyProfile", self.agency, "agency_name")

            if action == "approved":
                subject = f"✅ Votre demande pour {agency_name} a été approuvée"
                message = f"Votre demande de rattachement à l'agence {agency_name} a été approuvée. Vous êtes maintenant membre de l'agence."
            else:
                subject = f"❌ Votre demande pour {agency_name} a été refusée"
                message = f"Votre demande de rattachement à l'agence {agency_name} a été refusée."
                if reason:
                    message += f" Raison : {reason}"

            frappe.sendmail(
                recipients=[user_email],
                subject=subject,
                message=message,
                now=True
            )
        except Exception as e:
            frappe.log_error(f"Erreur envoi notification: {str(e)}", "AgencyJoinRequest")


# =============================================================================
# Fonctions utilitaires pour utiliser depuis d'autres modules
# =============================================================================

def request_to_join(email, agency, context="At Signup"):
    """
    Crée une demande de rattachement à une agence.

    Args:
        email (str): Email de l'utilisateur
        agency (str): Nom de l'agence (ou nom du document AgencyProfile)
        context (str): Contexte de la demande (ex: "At Signup")

    Returns:
        AgencyJoinRequest: La demande créée
    """
    # Vérifier que l'agence existe
    if not frappe.db.exists("AgencyProfile", agency):
        frappe.throw("Agence non trouvée")

    # Vérifier que l'utilisateur existe
    if not frappe.db.exists("User", email):
        frappe.throw("Utilisateur non trouvé")

    # Vérifier si une demande est déjà en attente
    existing = frappe.db.exists(
        "AgencyJoinRequest",
        {
            "user": email,
            "agency": agency,
            "status": "Pending"
        }
    )
    if existing:
        return frappe.get_doc("AgencyJoinRequest", existing)

    # Créer la demande
    doc = frappe.get_doc({
        "doctype": "AgencyJoinRequest",
        "user": email,
        "agency": agency,
        "context": context,
        "status": "Pending",
        "requested_role": "Member"
    })
    doc.insert(ignore_permissions=True)

    # Envoyer une notification aux Owners de l'agence
    _notify_agency_owners(agency, doc.name)

    return doc


def _notify_agency_owners(agency, request_name):
    """Notifie les Owners de l'agence qu'une nouvelle demande est arrivée"""
    try:
        owners = frappe.db.get_all(
            "AgencyMember",
            filters={
                "agency": agency,
                "member_role": "Owner",
                "status": "Active"
            },
            fields=["user"]
        )

        for owner in owners:
            user_email = frappe.db.get_value("User", owner.user, "email")
            agency_name = frappe.db.get_value("AgencyProfile", agency, "agency_name")

            frappe.sendmail(
                recipients=[user_email],
                subject=f"📩 Nouvelle demande de rattachement pour {agency_name}",
                message=f"""
Une nouvelle demande de rattachement a été soumise pour votre agence.

Agence: {agency_name}
Demande: {request_name}

Veuillez vous connecter pour approuver ou refuser cette demande.
                """,
                now=True
            )
    except Exception as e:
        frappe.log_error(f"Erreur notification owners: {str(e)}", "AgencyJoinRequest")


def list_agencies_for_user(email):
    """
    Retourne la liste des agences auxquelles un utilisateur est rattaché.

    Args:
        email (str): Email de l'utilisateur

    Returns:
        list: Liste des agences avec leur rôle
    """
    members = frappe.db.get_all(
        "AgencyMember",
        filters={
            "user": email,
            "status": "Active"
        },
        fields=["agency", "member_role"]
    )

    result = []
    for member in members:
        # Récupérer le nom de l'agence
        agency_name = frappe.db.get_value("AgencyProfile", member.agency, "agency_name")
        result.append({
            "agency": member.agency,
            "agency_name": agency_name,
            "role": member.member_role
        })

    return result


def get_pending_requests(agency=None):
    """
    Récupère les demandes en attente.

    Args:
        agency (str, optional): Filtrer par agence

    Returns:
        list: Liste des demandes en attente
    """
    filters = {"status": "Pending"}
    if agency:
        filters["agency"] = agency

    return frappe.db.get_all(
        "AgencyJoinRequest",
        filters=filters,
        fields=["name", "user", "agency", "request_date", "context", "requested_role"]
    )
