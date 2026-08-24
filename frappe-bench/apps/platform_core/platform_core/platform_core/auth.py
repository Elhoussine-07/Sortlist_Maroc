# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""JWT shared entre tous les microservices — voir docs/INTEGRATION.md §3-4."""

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
	"""Hook `before_request` : lit `Authorization: Bearer <jwt>`, peuple frappe.local.jwt_claims.

	Ne bloque jamais la requête ici : chaque endpoint whitelisted décide s'il
	exige une authentification via `current_claims()` / `require_user_type()`.
	"""
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
	"""BUG CORRIGÉ : sur cette installation, `frappe.form_dict` (censé être
	peuplé par `frappe.app.make_form_dict` à partir du corps JSON/form-encodé
	de la requête) arrive vide pour les appels authentifiés — confirmé en
	curl : même `frappe.client.get_count` (méthode native Frappe, hors
	`platform_core`) plante avec "missing 1 required positional argument"
	quel que soit le format d'envoi (JSON, form-urlencoded, query string).
	Toute fonction whitelisted avec un paramètre obligatoire sans valeur par
	défaut plante donc AVANT même d'entrer dans son propre corps
	(`frappe.call(method, **frappe.form_dict)` échoue au niveau du dispatch).
	Le seul contournement fiable, déjà utilisé ailleurs dans cette app
	(`matching.py`, `prospection.py`, `ia.py`) : donner une valeur par défaut
	au paramètre concerné puis relire le corps brut de la requête
	manuellement ici, indépendamment de `frappe.form_dict`."""
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
	"""Variante de `get_body_arg` pour les fonctions whitelisted en `**fields`
	(ex. `agency.update_profile`, `client.update_profile`) : ces fonctions ne
	plantent pas quand `frappe.form_dict` arrive vide (un `**kwargs` accepte
	zéro argument sans erreur), mais elles s'exécutent alors silencieusement
	sans rien mettre à jour. Relit et parse le corps JSON brut directement,
	à utiliser en secours quand `fields` (ou tout `**kwargs` équivalent)
	arrive vide."""
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
	"""Combine `get_body_arg` + un `frappe.throw` au message clair, pour les
	paramètres obligatoires d'une fonction whitelisted (cf. `get_body_arg`
	ci-dessus pour le pourquoi). Usage : `x = require_body_arg(x, "x")` en
	toute première ligne d'une fonction déclarée `def f(x=None, ...):`."""
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
	"""Vérifie que `user` est bien rattaché (Active) à `agency`."""
	if not frappe.db.exists("AgencyMember", {"user": user, "agency": agency, "status": "Active"}):
		frappe.throw("Vous n'êtes pas membre actif de cette agence", frappe.PermissionError)


def get_client_profile_name(email):
	"""Résout le NOM du document ClientProfile associé à un email de session
	(`claims["sub"]`). À utiliser partout où l'on compare/filtre sur des champs
	Link vers ClientProfile (ex: Project.client, FavoriteAgency.client,
	AgencyReview.status d'éligibilité côté projet, ...) : ces champs stockent
	le nom du document ClientProfile (ex. "CL-00001"), jamais l'email brut."""
	return frappe.db.get_value("ClientProfile", {"user": email}, "name")


def require_client_profile(email):
	"""Comme `get_client_profile_name`, mais lève une PermissionError si
	l'utilisateur courant n'a pas de ClientProfile."""
	name = get_client_profile_name(email)
	if not name:
		frappe.throw("Profil client introuvable", frappe.PermissionError)
	return name
