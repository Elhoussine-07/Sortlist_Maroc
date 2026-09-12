import frappe
from frappe.model.document import Document

class LeadScoringRule(Document):

    def validate(self):
        self._validate_required_fields()
        self._validate_points()
        self._prevent_duplicate_active_rule()
        self._validate_bonus_condition()
        self._validate_bonus_syntax()

    def _validate_required_fields(self):
        if not self.action_code:
            frappe.throw("Le code d'action (action_code) est obligatoire.")

        if self.base_points is None:
            frappe.throw("Les points de base (base_points) sont obligatoires.")

    def _validate_points(self):
        if (self.base_points or 0) < 0:
            frappe.throw("Les points de base ne peuvent pas être négatifs.")

        if (self.bonus_points or 0) < 0:
            frappe.throw("Les points bonus ne peuvent pas être négatifs.")

        if (self.bonus_points or 0) > 0 and not self.bonus_condition:
            frappe.throw("Des points bonus sont définis mais aucune condition bonus n'est renseignée.")

    def _prevent_duplicate_active_rule(self):
        if not self.is_active:
            return

        existing = frappe.get_all(
            "LeadScoringRule",
            filters={
                "action_code": self.action_code,
                "is_active": 1,
                "name": ["!=", self.name or ""],
            },
            limit=1,
        )
        if existing:
            frappe.throw(f"Une règle active existe déjà pour l'action « {self.action_code} ».")

    def _validate_bonus_condition(self):
        if self.bonus_points and not self.bonus_condition:
            frappe.throw("Une condition bonus (bonus_condition) est requise si bonus_points est défini.")

    def _validate_bonus_syntax(self):
        if not self.bonus_condition:
            return

        import re
        patterns = [
            r"^duration\s*>\s*\d+$",
            r"^count\s*>\s*\d+$",
            r"^duration\s*>=\s*\d+$",
            r"^count\s*>=\s*\d+$",
        ]

        is_valid = any(re.match(pattern, self.bonus_condition.strip()) for pattern in patterns)
        if not is_valid:
            frappe.throw(
                f"Format de condition bonus invalide : '{self.bonus_condition}'. "
                "Formats acceptés : 'duration > 60', 'count > 5'"
            )
