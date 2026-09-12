
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, today

class AgencyMember(Document):
    
    def before_insert(self):
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
        self.set_default_values()
        self.validate_role()
    
    def set_default_values(self):
        if not self.status:
            self.status = "Active"
        
        if not self.joined_on:
            self.joined_on = today()
    
    def validate_role(self):
        valid_roles = ["Owner", "Member"]
        if self.member_role not in valid_roles:
            frappe.throw(f"Rôle invalide. Les rôles autorisés sont: {', '.join(valid_roles)}")
        
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
        if self.member_role == "Owner":
            user = frappe.get_doc("User", self.user)
            if "Agency" not in [role.role for role in user.roles]:
                user.add_roles("Agency")
                frappe.db.commit()
    
    def on_trash(self):
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
        self.status = "Inactive"
        self.save()
    
    def activate(self):
        self.status = "Active"
        self.save()

def list_agencies_for_user(email):
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
        agency_doc = frappe.get_doc("AgencyProfile", member.agency)
        result.append({
            "agency": member.agency,
            "agency_name": agency_doc.agency_name if agency_doc else member.agency,
            "role": member.member_role
        })
    
    return result

def get_agency_members(agency):
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
    return frappe.db.exists(
        "AgencyMember",
        {
            "user": email,
            "agency": agency,
            "status": "Active"
        }
    )

def is_owner_of_agency(email, agency):
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
    if not is_member_of_agency(email, agency):
        frappe.throw(f"L'utilisateur {email} n'est pas membre de l'agence {agency}")

def get_agency_owner_email(agency):
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
