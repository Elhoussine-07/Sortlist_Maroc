# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, today

class AgencyMember(Document):
    """
    Doctype qui gère les membres d'une agence.
    Chaque membre d'une agence a un rôle (Owner, Member, etc.)
    """
    
    def before_insert(self):
        """Vérifications avant insertion"""
        # Vérifier si l'utilisateur est déjà membre de cette agence
        existing = frappe.db.exists(
            "AgencyMember",
            {
                "user": self.user,
                "agency": self.agency,
                "status": "Active"
            }
        )
        if existing:
            frappe.throw(f"L'utilisateur {self.user} est déjà membre de cette agence.")
    
    def validate(self):
        """Validation du document"""
        self.set_default_values()
        self.validate_role()
    
    def set_default_values(self):
        """Définit les valeurs par défaut"""
        if not self.status:
            self.status = "Active"
        
        if not self.joined_on:
            self.joined_on = today()
    
    def validate_role(self):
        """Vérifie que le rôle est valide"""
        # CDC 2.1.1 : seuls "propriétaire" et "membre" existent — aligné sur le
        # Select member_role (Owner\nMember) du DocType.
        valid_roles = ["Owner", "Member"]
        if self.member_role not in valid_roles:
            frappe.throw(f"Rôle invalide. Les rôles autorisés sont: {', '.join(valid_roles)}")
        
        # Vérifier qu'il n'y a qu'un seul Owner par agence
        if self.member_role == "Owner":
            existing_owner = frappe.db.exists(
                "AgencyMember",
                {
                    "agency": self.agency,
                    "member_role": "Owner",
                    "status": "Active",
                    "name": ["!=", self.name or ""]
                }
            )
            if existing_owner:
                frappe.throw("Cette agence a déjà un Owner. Un seul Owner est autorisé par agence.")
    
    def on_update(self):
        """Actions après mise à jour"""
        # Si l'utilisateur est Owner, vérifier que le rôle Agency est présent
        if self.member_role == "Owner":
            user = frappe.get_doc("User", self.user)
            if "Agency" not in [role.role for role in user.roles]:
                user.add_roles("Agency")
                frappe.db.commit()
    
    def on_trash(self):
        """Actions avant suppression"""
        # Empêcher la suppression du dernier Owner
        if self.member_role == "Owner":
            owners = frappe.db.get_all(
                "AgencyMember",
                filters={
                    "agency": self.agency,
                    "member_role": "Owner",
                    "status": "Active",
                    "name": ["!=", self.name]
                },
                fields=["name"]
            )
            if not owners:
                frappe.throw("Impossible de supprimer le dernier Owner de l'agence.")
    
    def deactivate(self):
        """Désactive le membre (le rend inactif)"""
        self.status = "Inactive"
        self.save()
    
    def activate(self):
        """Active le membre"""
        self.status = "Active"
        self.save()


# =============================================================================
# Fonctions utilitaires pour utiliser depuis d'autres modules
# =============================================================================

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
        agency_doc = frappe.get_doc("AgencyProfile", member.agency)
        result.append({
            "agency": member.agency,
            "agency_name": agency_doc.agency_name if agency_doc else member.agency,
            "role": member.member_role
        })
    
    return result


def get_agency_members(agency):
    """
    Retourne la liste des membres d'une agence.
    
    Args:
        agency (str): Nom du document AgencyProfile
    
    Returns:
        list: Liste des membres avec leurs informations
    """
    members = frappe.db.get_all(
        "AgencyMember",
        filters={
            "agency": agency,
            "status": "Active"
        },
        fields=["user", "member_role", "joined_on"]
    )
    
    result = []
    for member in members:
        user = frappe.get_doc("User", member.user)
        result.append({
            "user": member.user,
            "full_name": user.full_name,
            "email": user.email,
            "role": member.member_role,
            "joined_on": member.joined_on
        })
    
    return result


def get_agency_owners(agency):
    """
    Retourne la liste des Owners d'une agence.
    
    Args:
        agency (str): Nom du document AgencyProfile
    
    Returns:
        list: Liste des Owners
    """
    owners = frappe.db.get_all(
        "AgencyMember",
        filters={
            "agency": agency,
            "member_role": "Owner",
            "status": "Active"
        },
        fields=["user"]
    )
    
    return [owner.user for owner in owners]


def is_member_of_agency(email, agency):
    """
    Vérifie si un utilisateur est membre d'une agence.
    
    Args:
        email (str): Email de l'utilisateur
        agency (str): Nom du document AgencyProfile
    
    Returns:
        bool: True si membre, False sinon
    """
    return frappe.db.exists(
        "AgencyMember",
        {
            "user": email,
            "agency": agency,
            "status": "Active"
        }
    )


def is_owner_of_agency(email, agency):
    """
    Vérifie si un utilisateur est Owner d'une agence.
    
    Args:
        email (str): Email de l'utilisateur
        agency (str): Nom du document AgencyProfile
    
    Returns:
        bool: True si Owner, False sinon
    """
    return frappe.db.exists(
        "AgencyMember",
        {
            "user": email,
            "agency": agency,
            "member_role": "Owner",
            "status": "Active"
        }
    )


def assert_agency_member(email, agency):
    """
    Vérifie que l'utilisateur est membre de l'agence.
    Lance une exception si ce n'est pas le cas.
    
    Args:
        email (str): Email de l'utilisateur
        agency (str): Nom du document AgencyProfile
    """
    if not is_member_of_agency(email, agency):
        frappe.throw(f"L'utilisateur {email} n'est pas membre de l'agence {agency}")


def get_agency_owner_email(agency):
    """
    Retourne l'email du Owner d'une agence.
    
    Args:
        agency (str): Nom du document AgencyProfile
    
    Returns:
        str: Email du Owner, None si non trouvé
    """
    owner = frappe.db.get_all(
        "AgencyMember",
        filters={
            "agency": agency,
            "member_role": "Owner",
            "status": "Active"
        },
        fields=["user"],
        limit=1
    )
    
    if owner:
        return owner[0].user
    return None
