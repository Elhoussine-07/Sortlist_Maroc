
import frappe
from frappe.tests.utils import FrappeTestCase

from platform_core.platform_core.doctype.proposal.proposal import send_quote


class TestOpportunity(FrappeTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		self.country = frappe.db.get_value("Country", {}, "name") or self._make_country()
		self.client_profile = self._make_client_profile()
		self.agency_a = self._make_agency_profile("Agence Alpha")
		self.agency_b = self._make_agency_profile("Agence Beta")
		self.project = self._make_project()

	def _make_country(self):
		doc = frappe.get_doc({"doctype": "Country", "country_name": "Maroc", "code": "ma"})
		doc.insert(ignore_permissions=True)
		return doc.name

	def _make_client_profile(self):
		email = f"client-{frappe.generate_hash(length=8)}@example.com"
		user = frappe.get_doc({
			"doctype": "User",
			"email": email,
			"first_name": "Client",
			"last_name": "Test",
			"send_welcome_email": 0,
			"user_type": "Website User",
		})
		frappe.flags.mute_emails = True
		try:
			user.insert(ignore_permissions=True)
		finally:
			frappe.flags.mute_emails = False
		user.add_roles("Client")

		profile = frappe.get_doc({
			"doctype": "ClientProfile",
			"user": email,
			"first_name": "Client",
			"last_name": "Test",
			"country": self.country,
		})
		profile.insert(ignore_permissions=True)
		return profile.name

	def _make_agency_profile(self, agency_name):
		doc = frappe.get_doc({
			"doctype": "AgencyProfile",
			"agency_name": f"{agency_name} {frappe.generate_hash(length=6)}",
			"country": self.country,
			"email": f"{frappe.generate_hash(length=8)}@example.com",
		})
		doc.insert(ignore_permissions=True)
		return doc.name

	def _make_project(self, status="Posted"):
		doc = frappe.get_doc({
			"doctype": "Project",
			"client": self.client_profile,
			"title": "Refonte du site vitrine",
			"need_type": "Projet",
			"channel": "Unicast",
			"delivery_delay_days": 30,
			"status": status,
		})
		doc.insert(ignore_permissions=True)
		return doc

	def _make_opportunity(self, agency, source=None):
		doc = frappe.get_doc({
			"doctype": "Opportunity",
			"project": self.project.name,
			"agency": agency,
			"source": source,
		})
		doc.insert(ignore_permissions=True)
		return doc

	def test_new_opportunity_defaults_to_recue(self):
		opp = self._make_opportunity(self.agency_a)
		self.assertEqual(opp.status, "Reçue")

	def test_accept_moves_opportunity_to_acceptee(self):
		opp = self._make_opportunity(self.agency_a)
		opp.accept()
		self.assertEqual(opp.status, "Acceptée")

	def test_decline_archives_with_reason(self):
		opp = self._make_opportunity(self.agency_a)
		opp.decline()
		self.assertEqual(opp.status, "Archivée")
		self.assertTrue(opp.archive_reason)

	def test_cancel_acceptance_reverts_to_recue_before_any_quote(self):
		opp = self._make_opportunity(self.agency_a)
		opp.accept()
		opp.cancel_acceptance()
		self.assertEqual(opp.status, "Reçue")

	def test_cancel_acceptance_fails_once_a_quote_exists(self):
		opp = self._make_opportunity(self.agency_a)
		opp.accept()
		send_quote(opp.name, amount=15000)
		with self.assertRaises(frappe.ValidationError):
			opp.reload()
			opp.cancel_acceptance()

	def test_send_quote_moves_opportunity_to_devis_envoye_and_project_to_awaiting(self):
		opp = self._make_opportunity(self.agency_a)
		opp.accept()
		send_quote(opp.name, amount=15000, description="Devis initial")

		opp.reload()
		self.assertEqual(opp.status, "Devis envoyé")

		project_status = frappe.db.get_value("Project", self.project.name, "status")
		self.assertEqual(project_status, "Awaiting")

	def test_winning_opportunity_archives_other_active_opportunities(self):
		opp_a = self._make_opportunity(self.agency_a)
		opp_b = self._make_opportunity(self.agency_b)

		opp_a.accept()
		proposal = send_quote(opp_a.name, amount=15000)
		proposal.accept()

		opp_a.reload()
		self.assertEqual(opp_a.status, "Gagnée")

		project_status = frappe.db.get_value("Project", self.project.name, "status")
		self.assertEqual(project_status, "In Progress")

		opp_b.reload()
		self.assertEqual(opp_b.status, "Archivée")
		self.assertIn("attribué ailleurs", opp_b.archive_reason)

	def test_mark_completed_sets_status_terminee(self):
		opp = self._make_opportunity(self.agency_a)
		opp.accept()
		proposal = send_quote(opp.name, amount=15000)
		proposal.accept()
		opp.reload()

		opp.mark_completed()
		self.assertEqual(opp.status, "Terminée")

	def test_duplicate_active_opportunity_for_same_project_and_agency_is_rejected(self):
		self._make_opportunity(self.agency_a)

		with self.assertRaises(frappe.ValidationError):
			self._make_opportunity(self.agency_a)

	def test_new_opportunity_after_previous_one_archived_is_allowed(self):
		first = self._make_opportunity(self.agency_a)
		first.decline()

		second = self._make_opportunity(self.agency_a)

		self.assertEqual(second.status, "Reçue")

	def test_source_is_inferred_from_project_channel_when_not_provided(self):
		opp = self._make_opportunity(self.agency_a, source=None)
		self.assertEqual(opp.source, "Unicast")
