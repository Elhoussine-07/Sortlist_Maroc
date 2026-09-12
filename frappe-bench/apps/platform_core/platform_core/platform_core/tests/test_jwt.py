
import time

import jwt as pyjwt
from frappe.tests.utils import FrappeTestCase

from platform_core.platform_core.auth import _secret, decode_token, issue_token


class TestJwt(FrappeTestCase):
	"""Tests unitaires purs : aucune ecriture en base, uniquement la
	logique d'emission/verification du JWT partage (platform_core/auth.py).
	"""

	def test_issue_token_round_trips_through_decode_token(self):
		token, exp = issue_token("client@example.com", "client", agency_id=None, full_name="Client Test")

		claims = decode_token(token)

		self.assertIsNotNone(claims)
		self.assertEqual(claims["sub"], "client@example.com")
		self.assertEqual(claims["user_type"], "client")
		self.assertEqual(claims["exp"], exp)

	def test_issue_token_carries_agency_id_for_agency_users(self):
		token, _ = issue_token("agence@example.com", "agency", agency_id="AG-0001", full_name="Agence Test")

		claims = decode_token(token)

		self.assertEqual(claims["agency_id"], "AG-0001")

	def test_decode_token_returns_none_for_expired_token(self):
		expired_payload = {
			"sub": "client@example.com",
			"user_type": "client",
			"agency_id": None,
			"full_name": "Client Test",
			"iat": int(time.time()) - 3600,
			"exp": int(time.time()) - 1,
		}
		expired_token = pyjwt.encode(expired_payload, _secret(), algorithm="HS256")

		claims = decode_token(expired_token)

		self.assertIsNone(claims)

	def test_decode_token_returns_none_for_token_signed_with_wrong_secret(self):
		payload = {
			"sub": "client@example.com",
			"user_type": "client",
			"iat": int(time.time()),
			"exp": int(time.time()) + 3600,
		}
		token_signed_elsewhere = pyjwt.encode(payload, "un-secret-totalement-different", algorithm="HS256")

		claims = decode_token(token_signed_elsewhere)

		self.assertIsNone(claims)
