import re

import frappe
from frappe.model.document import Document

class CountryLegalIDRule(Document):

    def validate(self):
        self._validate_regex_syntax()
        self._validate_registry_check_config()

    def _validate_regex_syntax(self):
        if not self.validation_regex:
            return

        try:
            re.compile(self.validation_regex)
        except re.error:
            frappe.throw(f"La regex de validation « {self.validation_regex} » n'est pas syntaxiquement valide.")

    def _validate_registry_check_config(self):
        if not self.registry_check_enabled:
            return

        if not self.registry_api_url:
            frappe.throw("registry_api_url est obligatoire lorsque registry_check_enabled est activé.")

        if not self.registry_api_url.startswith(("http://", "https://")):
            frappe.throw("registry_api_url doit être une URL valide (commençant par http:// ou https://).")

    def before_insert(self):
        if self.is_active is None:
            self.is_active = 1
