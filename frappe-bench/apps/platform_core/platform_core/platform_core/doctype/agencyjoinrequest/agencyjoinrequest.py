
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

class AgencyJoinRequest(Document):

    def before_insert(self):
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
        self.set_default_status()

    def set_default_status(self):
        if not self.status:
            self.status = "Pending"

        if not self.request_date:
            self.request_date = nowdate()

    def approve(self, decided_by=None):
        if self.status != "Pending":
            frappe.throw("Cette demande n'est pas en attente.")

        member = frappe.get_doc({
            "doctype": "AgencyMember",
            "user": self.user,
            "agency": self.agency,
            "member_role": self.requested_role or "Member",
            "status": "Active",
            "joined_on": nowdate()
        })
        member.insert(ignore_permissions=True)

        self.status = "Approved"
        self.decided_by = decided_by
        self.decision_date = frappe.utils.now()
        self.save(ignore_permissions=True)

        user = frappe.get_doc("User", self.user)
        if "Agency" not in [role.role for role in user.roles]:
            user.add_roles("Agency")
            frappe.db.commit()

        self._send_notification("approved")

        return self

    def reject(self, reason=None, decided_by=None):
        if self.status != "Pending":
            frappe.throw("Cette demande n'est pas en attente.")

        self.status = "Rejected"
        self.rejection_reason = reason
        self.decided_by = decided_by
        self.decision_date = frappe.utils.now()
        self.save(ignore_permissions=True)

        self._send_notification("rejected", reason)

        return self

    def _send_notification(self, action, reason=None):
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

def request_to_join(email, agency, context="At Signup"):
    if not frappe.db.exists("AgencyProfile", agency):
        frappe.throw("Agence non trouvée")

    if not frappe.db.exists("User", email):
        frappe.throw("Utilisateur non trouvé")

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

    doc = frappe.get_doc({
        "doctype": "AgencyJoinRequest",
        "user": email,
        "agency": agency,
        "context": context,
        "status": "Pending",
        "requested_role": "Member"
    })
    doc.insert(ignore_permissions=True)

    _notify_agency_owners(agency, doc.name)

    return doc

def _notify_agency_owners(agency, request_name):
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
        agency_name = frappe.db.get_value("AgencyProfile", member.agency, "agency_name")
        result.append({
            "agency": member.agency,
            "agency_name": agency_name,
            "role": member.member_role
        })

    return result

def get_pending_requests(agency=None):
    filters = {"status": "Pending"}
    if agency:
        filters["agency"] = agency

    return frappe.db.get_all(
        "AgencyJoinRequest",
        filters=filters,
        fields=["name", "user", "agency", "request_date", "context", "requested_role"]
    )
