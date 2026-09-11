import hashlib

import frappe
from frappe.model.document import Document
from frappe.utils import now

class VisitorLog(Document):

    def before_insert(self):
        if not self.visit_date:
            self.visit_date = now()

        self._validate_relations()
        self._validate_data()

    def _validate_relations(self):
        if self.agency:
            if not frappe.db.exists("AgencyProfile", self.agency):
                frappe.throw(f"L'agence {self.agency} n'existe pas.")

        if self.lead:
            if not frappe.db.exists("DetectedLead", self.lead):
                frappe.throw(f"Le lead {self.lead} n'existe pas.")

    def _validate_data(self):
        if not self.ip_hash:
            frappe.throw("L'empreinte IP (ip_hash) est obligatoire.")

        if self.points_awarded and self.points_awarded < 0:
            frappe.throw("Les points attribués ne peuvent pas être négatifs.")

        if self.bonus_awarded and self.bonus_awarded < 0:
            frappe.throw("Les points bonus attribués ne peuvent pas être négatifs.")

    def on_update(self):
        pass

def log_action(
	agency,
	action=None,
	visitor_ip=None,
	company_name=None,
	company_domain=None,
	session_id=None,
):
	if not agency:
		frappe.throw("L'agence est obligatoire pour journaliser une visite.")

	ip_hash = hashlib.sha256(visitor_ip.encode("utf-8")).hexdigest() if visitor_ip else "unknown"

	doc = frappe.get_doc({
		"doctype": "VisitorLog",
		"agency": agency,
		"ip_hash": ip_hash,
		"action": action,
		"company_name": company_name,
		"company_domain": company_domain,
		"session_id": session_id,
	})
	doc.insert(ignore_permissions=True)
	return doc
