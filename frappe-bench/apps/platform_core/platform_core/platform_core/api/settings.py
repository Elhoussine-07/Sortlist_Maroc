# Copyright (c) 2026, lahoussine and contributors
# For license information, please see license.txt
"""Module Paramètres (cf. §6) : profil, mot de passe/2FA, langue, police, thème."""

import frappe
from frappe import _

from platform_core.platform_core.auth import current_claims, require_body_arg


@frappe.whitelist()
def get_settings():
	claims = current_claims()
	user = frappe.get_doc("User", claims["sub"])
	# BUG CORRIGÉ : sur les comptes provisionnés avant le correctif de
	# `setup._ensure_user_custom_fields`, `theme_preference` peut encore
	# valoir "Light"/"Dark"/"System" (ancienne casse) et `font_size` 16
	# (ancien défaut en pixels, hors de la plage 80-130% attendue par le
	# curseur du frontend) — normalisés ici pour ne pas dépendre d'une
	# migration de données rétroactive.
	theme = (user.theme_preference or "system").strip().lower()
	if theme not in ("light", "dark", "system"):
		theme = "system"
	font_size = user.font_size or 100
	if font_size < 80 or font_size > 130:
		font_size = 100
	return {
		"language": user.language,
		"theme_preference": theme,
		"font_preference": user.font_preference,
		"font_size": font_size,
		"two_factor_enabled": user.two_factor_enabled,
		"notification_prefs": frappe.parse_json(user.notification_prefs) if user.notification_prefs else {},
	}


@frappe.whitelist()
def update_settings(language=None, theme_preference=None, font_preference=None, font_size=None):
	claims = current_claims()
	user = frappe.get_doc("User", claims["sub"])
	if language:
		user.language = language
	if theme_preference:
		user.theme_preference = theme_preference
	if font_preference:
		user.font_preference = font_preference
	if font_size:
		user.font_size = max(80, min(130, int(font_size)))
	user.save(ignore_permissions=True)
	return get_settings()


@frappe.whitelist()
def update_notification_prefs(prefs=None):
	prefs = require_body_arg(prefs, "prefs", _("Préférences manquantes"))
	claims = current_claims()
	if isinstance(prefs, str):
		prefs = frappe.parse_json(prefs)
	frappe.db.set_value("User", claims["sub"], "notification_prefs", frappe.as_json(prefs))
	return prefs


@frappe.whitelist()
def change_password(old_password=None, new_password=None):
	old_password = require_body_arg(old_password, "old_password", _("Ancien mot de passe manquant"))
	new_password = require_body_arg(new_password, "new_password", _("Nouveau mot de passe manquant"))
	claims = current_claims()
	try:
		frappe.local.login_manager.authenticate(user=claims["sub"], pwd=old_password)
	except frappe.exceptions.AuthenticationError:
		frappe.throw(_("Ancien mot de passe incorrect"))

	from frappe.utils.password import update_password

	update_password(claims["sub"], new_password)
	return {"updated": True}


@frappe.whitelist()
def toggle_two_factor(enabled=None):
	enabled = require_body_arg(enabled, "enabled", _("Valeur manquante"))
	claims = current_claims()
	frappe.db.set_value("User", claims["sub"], "two_factor_enabled", 1 if int(enabled) else 0)
	return {"two_factor_enabled": bool(int(enabled))}
