import re

import frappe
from frappe.model.document import Document

class CountryLegalIDRule(Document):

    def validate(self):
        self._validate_regex_syntax()

    def _validate_regex_syntax(self):
        if not self.validation_regex:
            return

        try:
            re.compile(self.validation_regex)
        except re.error:
            frappe.throw(f"La regex de validation « {self.validation_regex} » n'est pas syntaxiquement valide.")

    def before_insert(self):
        if self.is_active is None:
            self.is_active = 1
