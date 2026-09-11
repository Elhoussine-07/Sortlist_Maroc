import re

import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

class ClientProfile(Document):

    def validate(self):
        self._validate_legal_id()
        self._calculate_profile_completion()
        self._calculate_trust_score()

        if not self.account_seniority:
            self.account_seniority = nowdate()

    def _validate_legal_id(self):
        if not self.country or not self.legal_id:
            return

        rules = frappe.get_all(
            "CountryLegalIDRule",
            filters={"country": self.country, "is_active": 1},
            fields=["name", "validation_regex", "id_label"],
            limit=1,
        )
        if not rules:
            return

        rule = rules[0]

        if rule.validation_regex and not re.match(rule.validation_regex, self.legal_id or ""):
            frappe.throw(f"Format d'identifiant légal invalide pour {rule.id_label or 'ce pays'}.")

        existing = frappe.db.exists("ClientProfile", {
            "legal_id": self.legal_id,
            "country": self.country,
            "name": ["!=", self.name or ""]
        })
        if existing:
            frappe.throw(f"Un profil avec l'identifiant {self.legal_id} existe déjà pour ce pays.")

        self.legal_id_label = rule.id_label

    def _calculate_trust_score(self):
        from platform_core.platform_core.scoring import compute_trust_score

        self.trust_score = compute_trust_score(self)

    def _calculate_profile_completion(self):
        weights = {
            "first_name": 10,
            "last_name": 10,
            "company_name": 15,
            "phone": 10,
            "logo": 15,
            "country": 10,
            "legal_id": 15,
            "sector": 15,
        }
        self.profile_completion = min(
            sum(weight for field, weight in weights.items() if getattr(self, field, None)),
            100
        )
