import frappe
from frappe.model.document import Document

class AgencyProfile(Document):

    def before_insert(self):
        user_roles = frappe.get_roles(frappe.session.user)
        if "Agency" not in user_roles and "Administrator" not in user_roles:
            frappe.throw("Seuls les Agences et Administrateurs peuvent créer un profil Agence.")

        if frappe.db.exists("AgencyProfile", {"agency_name": self.agency_name}):
            frappe.throw(f"Une agence nommée « {self.agency_name} » existe déjà.")

    def validate(self):
        self._calculate_pqi_score()
        self._calculate_profile_completion()

    def refresh_pqi(self):
        from platform_core.platform_core.scoring import update_agency_pqi

        updated = update_agency_pqi(self.name)
        self.reload()
        return updated

    def _calculate_pqi_score(self):
        from platform_core.platform_core.scoring import compute_pqi

        self.pqi_score, _ = compute_pqi(self)

    def _calculate_profile_completion(self):
        weights = {
            "agency_name": 10,
            "description": 10,
            "logo": 10,
            "website": 5,
            "location": 10,
            "country": 10,
            "legal_id": 15,
            "email": 10,
            "phone": 10,
            "social_links": 10,
        }
        self.profile_completion = min(
            sum(weight for field, weight in weights.items() if getattr(self, field, None)),
            100
        )
