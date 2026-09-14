
import frappe
from frappe.tests.utils import FrappeTestCase

from platform_core.platform_core.api.auth import request_otp, verify_otp


class TestAuthOtpFlowIntegration(FrappeTestCase):
	"""Test d'integration : traverse le cache Redis/Frappe, le DocType User,
	ClientProfile et l'emission du JWT en appelant les fonctions whitelisted
	exactement comme le ferait la requete HTTP reelle (request_otp -> verify_otp).
	"""

	def setUp(self):
		frappe.set_user("Administrator")
		self.email = f"otp-{frappe.generate_hash(length=8)}@example.com"
		self.country = frappe.db.get_value("Country", {}, "name") or self._make_country()
		self._make_client_with_profile()

	def _make_country(self):
		doc = frappe.get_doc({"doctype": "Country", "country_name": "Maroc", "code": "ma"})
		doc.insert(ignore_permissions=True)
		return doc.name

	def _make_client_with_profile(self):
		user = frappe.get_doc({
			"doctype": "User",
			"email": self.email,
			"first_name": "Otp",
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

		frappe.get_doc({
			"doctype": "ClientProfile",
			"user": self.email,
			"first_name": "Otp",
			"last_name": "Test",
			"country": self.country,
		}).insert(ignore_permissions=True)

	def test_request_otp_stores_a_six_digit_code_in_cache(self):
		frappe.flags.mute_emails = True
		try:
			result = request_otp(email=self.email)
		finally:
			frappe.flags.mute_emails = False

		self.assertTrue(result["sent"])
		cached_code = frappe.cache().get_value(f"otp:{self.email}")
		self.assertIsNotNone(cached_code)
		self.assertEqual(len(str(cached_code)), 6)

	def test_verify_otp_success_issues_token_and_verifies_phone(self):
		frappe.flags.mute_emails = True
		try:
			request_otp(email=self.email)
		finally:
			frappe.flags.mute_emails = False

		code = frappe.cache().get_value(f"otp:{self.email}")

		token_response = verify_otp(email=self.email, code=code)

		self.assertIn("access_token", token_response)
		self.assertEqual(token_response["email"], self.email)
		self.assertEqual(token_response["user_type"], "client")

		phone_verified = frappe.db.get_value("ClientProfile", {"user": self.email}, "phone_verified")
		self.assertEqual(phone_verified, 1)

		self.assertIsNone(frappe.cache().get_value(f"otp:{self.email}"))

	def test_verify_otp_with_wrong_code_raises_validation_error(self):
		frappe.flags.mute_emails = True
		try:
			request_otp(email=self.email)
		finally:
			frappe.flags.mute_emails = False

		with self.assertRaises(frappe.ValidationError):
			verify_otp(email=self.email, code="000000")

	def test_verify_otp_without_prior_request_raises_validation_error(self):
		with self.assertRaises(frappe.ValidationError):
			verify_otp(email=self.email, code="123456")

	def test_request_otp_is_rate_limited_after_max_requests_per_hour(self):
		frappe.flags.mute_emails = True
		try:
			for _ in range(5):
				result = request_otp(email=self.email)
				self.assertTrue(result["sent"])

			with self.assertRaises(frappe.ValidationError):
				request_otp(email=self.email)
		finally:
			frappe.flags.mute_emails = False

	def test_verify_otp_locks_out_after_max_wrong_attempts(self):
		frappe.flags.mute_emails = True
		try:
			request_otp(email=self.email)
		finally:
			frappe.flags.mute_emails = False

		for _ in range(5):
			with self.assertRaises(frappe.ValidationError):
				verify_otp(email=self.email, code="000000")

		correct_code = frappe.cache().get_value(f"otp:{self.email}")
		with self.assertRaises(frappe.ValidationError):
			verify_otp(email=self.email, code=correct_code)
