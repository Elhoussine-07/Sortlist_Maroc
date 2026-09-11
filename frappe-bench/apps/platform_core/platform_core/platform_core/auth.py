
import json
import os
import time

import frappe
import jwt

TOKEN_TTL_SECONDS = 24 * 60 * 60

def _secret():
	return frappe.conf.get("jwt_secret") or os.environ.get("JWT_SECRET") or "dev-insecure-secret-change-me"

def _internal_token():
	return (
		frappe.conf.get("internal_service_token")
		or os.environ.get("INTERNAL_SERVICE_TOKEN")
		or "dev-insecure-internal-token"
	)

def issue_token(email, user_type, agency_id=None, full_name=None):
	now = int(time.time())
	payload = {
		"sub": email,
		"user_type": user_type,
		"agency_id": agency_id,
		"full_name": full_name,
		"iat": now,
		"exp": now + TOKEN_TTL_SECONDS,
	}
	token = jwt.encode(payload, _secret(), algorithm="HS256")
	if isinstance(token, bytes):
		token = token.decode("utf-8")
	return token, payload["exp"]

def decode_token(token):
	try:
		return jwt.decode(token, _secret(), algorithms=["HS256"])
	except jwt.PyJWTError:
		return None

def validate_jwt():
	frappe.local.jwt_claims = None
	auth_header = frappe.get_request_header("Authorization")
	if not auth_header or not auth_header.startswith("Bearer "):
		return

	token = auth_header.split(" ", 1)[1].strip()
	claims = decode_token(token)
	if not claims:
		return

	frappe.local.jwt_claims = claims
	try:
		if frappe.db.exists("User", claims.get("sub")):
			frappe.set_user(claims["sub"])
	except Exception:
		frappe.log_error(title="JWT set_user failed")

def current_claims():
	claims = getattr(frappe.local, "jwt_claims", None)
	if not claims:
		frappe.throw("Authentification requise", frappe.AuthenticationError)
	return claims

def optional_claims():
	return getattr(frappe.local, "jwt_claims", None)

def require_user_type(*types):
	claims = current_claims()
	if claims.get("user_type") not in types:
		frappe.throw("Accès non autorisé pour ce type de compte", frappe.PermissionError)
	return claims

def require_active_agency():
	claims = require_user_type("agency")
	if not claims.get("agency_id"):
		frappe.throw("Aucune agence active sélectionnée", frappe.PermissionError)
	return claims

def get_body_arg(name, default=None):
	value = frappe.form_dict.get(name)
	if value not in (None, ""):
		return value

	raw = frappe.request.data if frappe.request else None
	if isinstance(raw, (bytes, bytearray)):
		raw = raw.decode("utf-8")
	if raw:
		try:
			body = json.loads(raw)
		except ValueError:
			body = {}
		if isinstance(body, dict) and body.get(name) not in (None, ""):
			return body[name]

	return default

def get_body_dict():
	raw = frappe.request.data if frappe.request else None
	if isinstance(raw, (bytes, bytearray)):
		raw = raw.decode("utf-8")
	if not raw:
		return {}
	try:
		body = json.loads(raw)
	except ValueError:
		return {}
	return body if isinstance(body, dict) else {}

def require_body_arg(value, name, message=None):
	if value in (None, ""):
		value = get_body_arg(name)
	if value in (None, ""):
		frappe.throw(message or frappe._("{0} manquant(e)").format(name))
	return value

def require_internal_token():
	header = frappe.get_request_header("X-Internal-Token")
	if not header or header != _internal_token():
		frappe.throw("Jeton de service invalide", frappe.AuthenticationError)

def assert_agency_member(user, agency):
	if not frappe.db.exists("AgencyMember", {"user": user, "agency": agency, "status": "Active"}):
		frappe.throw("Vous n'êtes pas membre actif de cette agence", frappe.PermissionError)

def get_client_profile_name(email):
	return frappe.db.get_value("ClientProfile", {"user": email}, "name")

def require_client_profile(email):
	name = get_client_profile_name(email)
	if not name:
		frappe.throw("Profil client introuvable", frappe.PermissionError)
	return name
