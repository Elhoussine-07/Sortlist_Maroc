# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Authentification unifiée (cf. cahier des charges §4.2) : une seule page,
deux boutons (Client / Agence), OTP par email, JWT partagé (docs/INTEGRATION.md §3)."""

import random

import frappe
from frappe import _

# ✅ CORRECTION - Ajouter un niveau supplémentaire
from platform_core.platform_core.auth import current_claims, issue_token, require_active_agency, require_body_arg
from platform_core.platform_core.doctype.agencyjoinrequest.agencyjoinrequest import request_to_join
from platform_core.platform_core.doctype.agencymember.agencymember import list_agencies_for_user

OTP_TTL_SECONDS = 5 * 60
PWRESET_TTL_SECONDS = 5 * 60
PENDING_AGENCY_REGISTRATION_TTL_SECONDS = OTP_TTL_SECONDS

def _user_type(email):
	roles = set(frappe.get_roles(email))
	if "System Manager" in roles or "Moderator" in roles:
		return "moderator" if "Moderator" in roles and "System Manager" not in roles else "admin"
	if "Agency" in roles:
		return "agency"
	if "Client" in roles:
		return "client"
	return "client"


def _default_agency_for(email):
	agencies = list_agencies_for_user(email)
	if not agencies:
		return None
	owner = next((a for a in agencies if a["role"] == "Owner"), None)
	return (owner or agencies[0])["agency"]


def _build_token(email):
	user_type = _user_type(email)
	agency_id = _default_agency_for(email) if user_type == "agency" else None
	full_name = frappe.db.get_value("User", email, "full_name")
	token, exp = issue_token(email, user_type, agency_id, full_name)
	return {
		"access_token": token,
		"expires_at": exp,
		"user_type": user_type,
		"agency_id": agency_id,
		"email": email,
		"full_name": full_name,
	}


@frappe.whitelist(allow_guest=True)
def request_otp(email=None):
	email = require_body_arg(email, "email", _("Email manquant"))
	email = email.strip().lower()
	code = f"{random.randint(0, 999999):06d}"
	frappe.cache().set_value(f"otp:{email}", code, expires_in_sec=OTP_TTL_SECONDS)

	frappe.sendmail(
		recipients=[email],
		subject="Votre code de vérification",
		message=f"Votre code de vérification est : <b>{code}</b> (valable 5 minutes).",
		now=True,
	)
	return {"sent": True}


@frappe.whitelist(allow_guest=True)
def verify_otp(email=None, code=None):
	email = require_body_arg(email, "email", _("Email manquant"))
	code = require_body_arg(code, "code", _("Code manquant"))
	email = email.strip().lower()
	cached = frappe.cache().get_value(f"otp:{email}")
	if not cached or str(cached) != str(code).strip():
		frappe.throw(_("Code invalide ou expiré"))

	frappe.cache().delete_value(f"otp:{email}")

	# AJOUTÉ : BUG CORRIGÉ — `register_agency` créait auparavant le compte
	# (User + AgencyProfile + AgencyMember) IMMÉDIATEMENT, avant même l'envoi
	# de l'OTP ; cette fonction ne faisait ensuite que basculer un flag
	# `email_verified` sur un compte déjà pleinement créé et fonctionnel —
	# l'email n'était donc jamais réellement vérifié AVANT la création du
	# compte, seulement après coup, de façon cosmétique. `register_agency`
	# met maintenant le payload d'inscription en cache (même TTL que l'OTP)
	# au lieu de créer le compte directement ; la création réelle (cf.
	# `_create_agency_account`) n'a lieu qu'ici, une fois le code confirmé.
	pending_raw = frappe.cache().get_value(f"pending_agency_registration:{email}")
	if pending_raw:
		frappe.cache().delete_value(f"pending_agency_registration:{email}")
		payload = frappe.parse_json(pending_raw)
		_create_agency_account(payload)
		return _build_token(email)

	if not frappe.db.exists("User", email):
		frappe.throw(_("Compte introuvable"))

	if frappe.db.exists("ClientProfile", {"user": email}):
		frappe.db.set_value("ClientProfile", {"user": email}, "phone_verified", 1)
	if frappe.db.exists("AgencyMember", {"user": email, "member_role": "Owner"}):
		agency = frappe.db.get_value("AgencyMember", {"user": email, "member_role": "Owner"}, "agency")
		if agency:
			frappe.db.set_value("AgencyProfile", agency, "email_verified", 1)

	return _build_token(email)


@frappe.whitelist(allow_guest=True)
def login(email=None, password=None):
	email = require_body_arg(email, "email", _("Email manquant"))
	password = require_body_arg(password, "password", _("Mot de passe manquant"))
	email = email.strip().lower()
	try:
		frappe.local.login_manager.authenticate(user=email, pwd=password)
	except frappe.exceptions.AuthenticationError:
		frappe.throw(_("Identifiants invalides"), frappe.AuthenticationError)
	return _build_token(email)


@frappe.whitelist(allow_guest=True)
def register_client(email=None, password=None, first_name=None, last_name=None, country=None,
	company_name=None, phone=None):
	email = require_body_arg(email, "email", _("Email manquant"))
	password = require_body_arg(password, "password", _("Mot de passe manquant"))
	first_name = require_body_arg(first_name, "first_name", _("Prénom manquant"))
	last_name = require_body_arg(last_name, "last_name", _("Nom manquant"))
	country = require_body_arg(country, "country", _("Pays manquant"))
	email = email.strip().lower()
	if frappe.db.exists("User", email):
		frappe.throw(_("Un compte existe déjà avec cet email"))

	user = frappe.get_doc({
		"doctype": "User",
		"email": email,
		"first_name": first_name,
		"last_name": last_name,
		"send_welcome_email": 0,
		"new_password": password,
		"user_type": "Website User",
	})
	# BUG CORRIGÉ : Frappe (core `User` doctype) envoie automatiquement une
	# alerte "Security Alert: Your password has been changed" dès que
	# `new_password` est défini sur un insert/save, sans distinguer une
	# CRÉATION de compte d'un vrai changement de mot de passe ultérieur —
	# `send_welcome_email: 0` ne bloque que l'email de bienvenue, pas
	# celui-ci. `mute_emails` désactive `frappe.sendmail` le temps de cet
	# insert précis, puis est immédiatement réactivé pour ne pas affecter
	# l'email OTP envoyé juste après par `request_otp`.
	frappe.flags.mute_emails = True
	try:
		user.insert(ignore_permissions=True)
	finally:
		frappe.flags.mute_emails = False
	user.add_roles("Client")

	frappe.get_doc({
		"doctype": "ClientProfile",
		"user": email,
		"first_name": first_name,
		"last_name": last_name,
		"company_name": company_name,
		"country": country,
		"phone": phone,
	}).insert(ignore_permissions=True)

	request_otp(email)
	return {"registered": True, "email": email}


def _create_agency_account(payload):
	"""Création RÉELLE du compte agence (User + AgencyProfile + AgencyMember,
	ou User + AgencyJoinRequest en cas de doublon de nom d'agence) à partir
	du payload mis en cache par `register_agency`. Appelée UNIQUEMENT depuis
	`verify_otp`, une fois le code confirmé — jamais avant."""
	email = payload["email"]
	agency_name = payload["agency_name"]

	user = frappe.get_doc({
		"doctype": "User",
		"email": email,
		"first_name": payload.get("first_name") or agency_name,
		"last_name": payload.get("last_name") or "",
		"send_welcome_email": 0,
		"new_password": payload["password"],
		"user_type": "Website User",
	})
	# BUG CORRIGÉ : cf. même correctif dans `register_client` — Frappe (core
	# `User` doctype) envoie automatiquement une alerte "Security Alert:
	# Your password has been changed" dès que `new_password` est défini sur
	# un insert/save, sans distinguer une CRÉATION de compte d'un vrai
	# changement de mot de passe ultérieur.
	frappe.flags.mute_emails = True
	try:
		user.insert(ignore_permissions=True)
	finally:
		frappe.flags.mute_emails = False
	user.add_roles("Agency")

	if payload.get("duplicate_agency") and payload.get("existing_agency"):
		# cf. 2.1 : détection de doublon -> rattachement en tant que collaborateur, sous validation.
		join_request = request_to_join(email, payload["existing_agency"], context="At Signup")
		return {
			"duplicate_agency": True,
			"agency": payload["existing_agency"],
			"join_request": join_request.name,
		}

	# BUG CORRIGÉ : `AgencyProfile.before_insert()` vérifie les rôles de
	# `frappe.session.user` (cf. doctype/agencyprofile/agencyprofile.py) pour
	# n'autoriser la création qu'aux comptes ayant déjà le rôle "Agency" — mais
	# `user.add_roles("Agency")` ci-dessus l'attribue au NOUVEL utilisateur,
	# sans jamais faire basculer la session dessus. Résultat : ce garde
	# comparait toujours les rôles de l'appelant (Guest en inscription
	# publique, ou n'importe quel utilisateur déjà connecté) plutôt que ceux
	# du compte agence tout juste créé — l'inscription agence échouait
	# systématiquement avec "Seuls les Agences et Administrateurs peuvent
	# créer un profil Agence.", jamais seulement en cas de session déjà
	# ouverte. On bascule donc temporairement la session sur le nouvel
	# utilisateur pour ces deux insertions, puis on la restaure.
	original_user = frappe.session.user
	frappe.set_user(user.name)
	try:
		agency = frappe.get_doc({
			"doctype": "AgencyProfile",
			"agency_name": agency_name,
			"description": payload.get("description"),
			"country": payload.get("country"),
			"phone": payload.get("phone"),
			"website": payload.get("website"),
			"email": email,
			# L'email vient d'être confirmé par OTP à l'instant -> vrai dès la création.
			"email_verified": 1,
		}).insert(ignore_permissions=True)

		frappe.get_doc({
			"doctype": "AgencyMember",
			"user": email,
			"agency": agency.name,
			"member_role": "Owner",
			"status": "Active",
			"joined_on": frappe.utils.today(),
		}).insert(ignore_permissions=True)
	finally:
		frappe.set_user(original_user)

	return {"duplicate_agency": False, "agency": agency.name}


@frappe.whitelist(allow_guest=True)
def register_agency(email=None, password=None, agency_name=None, country=None, first_name=None,
	last_name=None, description=None, phone=None, website=None):
	email = require_body_arg(email, "email", _("Email manquant"))
	password = require_body_arg(password, "password", _("Mot de passe manquant"))
	agency_name = require_body_arg(agency_name, "agency_name", _("Nom d'agence manquant"))
	country = require_body_arg(country, "country", _("Pays manquant"))
	email = email.strip().lower()
	if frappe.db.exists("User", email):
		frappe.throw(_("Un compte existe déjà avec cet email"))

	existing_agency = frappe.db.exists("AgencyProfile", {"agency_name": agency_name})

	# BUG CORRIGÉ : cette fonction créait auparavant le User + AgencyProfile +
	# AgencyMember (ou la demande de rattachement en cas de doublon)
	# IMMÉDIATEMENT, avant même l'envoi de l'OTP — `verify_otp` ne faisait
	# ensuite que confirmer un code sur un compte déjà pleinement créé et
	# utilisable, sans jamais réellement bloquer la création sur une adresse
	# email vérifiée. Le payload d'inscription est désormais mis en cache
	# (même TTL que l'OTP) ; la création réelle du compte (cf.
	# `_create_agency_account`) n'a lieu que dans `verify_otp`, une fois le
	# code confirmé.
	pending_payload = {
		"email": email,
		"password": password,
		"agency_name": agency_name,
		"country": country,
		"first_name": first_name,
		"last_name": last_name,
		"description": description,
		"phone": phone,
		"website": website,
		"duplicate_agency": bool(existing_agency),
		"existing_agency": existing_agency or None,
	}
	frappe.cache().set_value(
		f"pending_agency_registration:{email}",
		frappe.as_json(pending_payload),
		expires_in_sec=PENDING_AGENCY_REGISTRATION_TTL_SECONDS,
	)
	request_otp(email)
	return {
		"registered": True,
		"email": email,
		"pending_verification": True,
		"duplicate_agency": bool(existing_agency),
	}


@frappe.whitelist()
def me():
	claims = current_claims()
	data = dict(claims)
	if claims.get("user_type") == "agency":
		data["agencies"] = list_agencies_for_user(claims["sub"])
	return data


@frappe.whitelist(allow_guest=True)
def request_password_reset(email=None):
	"""Mot de passe oublié — 1ère étape (code par email, cache `pwreset:{email}`,
	TTL 5 min). Ne révèle jamais si le compte existe (anti-énumération) : le
	code n'est envoyé que si l'utilisateur existe réellement, mais la réponse
	est identique dans tous les cas."""
	email = require_body_arg(email, "email", _("Email manquant"))
	email = email.strip().lower()
	if frappe.db.exists("User", email):
		code = f"{random.randint(0, 999999):06d}"
		frappe.cache().set_value(f"pwreset:{email}", code, expires_in_sec=PWRESET_TTL_SECONDS)

		frappe.sendmail(
			recipients=[email],
			subject="Réinitialisation de votre mot de passe",
			message=f"Réinitialisation de votre mot de passe — code : <b>{code}</b> (valable 5 minutes).",
			now=True,
		)
	return {"sent": True}


@frappe.whitelist(allow_guest=True)
def reset_password(email=None, code=None, new_password=None):
	"""Mot de passe oublié — 2ème étape : vérifie le code puis fixe le nouveau
	mot de passe via le mécanisme standard Frappe (cf. api.settings.change_password)."""
	email = require_body_arg(email, "email", _("Email manquant"))
	code = require_body_arg(code, "code", _("Code manquant"))
	new_password = require_body_arg(new_password, "new_password", _("Nouveau mot de passe manquant"))
	email = email.strip().lower()
	cached = frappe.cache().get_value(f"pwreset:{email}")
	if not cached or str(cached) != str(code).strip():
		frappe.throw(_("Code invalide ou expiré"))

	frappe.cache().delete_value(f"pwreset:{email}")

	if not frappe.db.exists("User", email):
		frappe.throw(_("Compte introuvable"))

	from frappe.utils.password import update_password

	update_password(email, new_password)
	return {"reset": True}


@frappe.whitelist()
def switch_agency(agency=None):
	agency = require_body_arg(agency, "agency", _("Agence manquante"))
	claims = require_active_agency()
	from platform_core.platform_core.auth import assert_agency_member

	assert_agency_member(claims["sub"], agency)
	full_name = frappe.db.get_value("User", claims["sub"], "full_name")
	token, exp = issue_token(claims["sub"], "agency", agency, full_name)
	return {"access_token": token, "expires_at": exp, "agency_id": agency}
