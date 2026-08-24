import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { a as frappeCall, r as camelizeKeys } from "./http-BM0VI1yy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.service-F3thChuN.js
var ROLE_FIELD_CANDIDATES = [
	"role",
	"userType",
	"accountType",
	"type",
	"profileType",
	"userRole"
];
function extractRawRole(data) {
	for (const key of ROLE_FIELD_CANDIDATES) {
		const value = data[key];
		if (typeof value === "string" && value.trim().length > 0) return value;
	}
}
function normalizeRole(rawRole) {
	if (rawRole === void 0 || rawRole === null) return null;
	const value = String(rawRole).trim().toLowerCase();
	if (value.length === 0) return null;
	if (value.startsWith("agenc")) return "agency";
	if (value.startsWith("client") || value.startsWith("entreprise") || value.startsWith("company")) return "client";
	if (value.startsWith("moderat") || value.startsWith("admin")) return "admin";
	return null;
}
function initialsFromName(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase();
}
function mapUser(raw, fallbackRole) {
	const data = camelizeKeys(raw);
	const role = normalizeRole(extractRawRole(data)) ?? fallbackRole;
	const email = String(data["email"] ?? data["sub"] ?? "");
	const displayName = data["displayName"] ?? data["fullName"] ?? data["agencyName"] ?? data["companyName"] ?? (email || void 0) ?? "Utilisateur";
	return {
		id: String(data["id"] ?? data["name"] ?? data["user"] ?? data["sub"] ?? ""),
		role,
		displayName,
		initials: initialsFromName(displayName),
		email
	};
}
function mapLoginResponse(raw, requestedRole) {
	const data = camelizeKeys(raw);
	const token = String(data["token"] ?? data["accessToken"] ?? data["jwt"] ?? "");
	const userData = data["user"] ?? data;
	const normalized = normalizeRole(extractRawRole(userData) ?? extractRawRole(data));
	const roleKnown = normalized !== null;
	const detectedRole = normalized ?? requestedRole;
	return {
		token,
		user: mapUser(userData, detectedRole),
		detectedRole,
		roleKnown
	};
}
async function login(payload) {
	return mapLoginResponse(await frappeCall("auth.login", {
		email: payload.email,
		password: payload.password
	}), payload.role);
}
async function requestEmailCode(email) {
	const raw = await frappeCall("auth.request_otp", { email });
	const data = camelizeKeys(raw);
	return {
		sent: Boolean(data["sent"] ?? true),
		expiresInSeconds: Number(data["expiresInSeconds"] ?? data["expiresIn"] ?? 300)
	};
}
async function verifyEmailCode(email, code, expectedRole = "client") {
	return mapLoginResponse(await frappeCall("auth.verify_otp", {
		email,
		code
	}), expectedRole);
}
async function forgotPassword(email) {
	const raw = await frappeCall("auth.request_password_reset", { email });
	const data = camelizeKeys(raw);
	return { sent: Boolean(data["sent"] ?? true) };
}
async function confirmPasswordReset(payload) {
	const raw = await frappeCall("auth.reset_password", {
		email: payload.email,
		code: payload.code,
		new_password: payload.newPassword
	});
	const data = camelizeKeys(raw);
	return { reset: Boolean(data["reset"] ?? true) };
}
async function logout() {
	useAuthStore.getState().reset();
}
async function getCurrentUser(fallbackRole) {
	return mapUser(await frappeCall("auth.me"), fallbackRole ?? useAuthStore.getState().role ?? "client");
}
async function registerClient(payload) {
	return mapLoginResponse(await frappeCall("auth.register_client", {
		email: payload.email,
		password: payload.password,
		first_name: payload.firstName,
		last_name: payload.lastName,
		country: payload.country,
		company_name: payload.companyName,
		phone: payload.phone,
		verification_code: payload.verificationCode
	}), "client");
}
async function registerAgency(payload) {
	return mapLoginResponse(await frappeCall("auth.register_agency", payload), "agency");
}
async function switchAgency(agencyId) {
	const response = mapLoginResponse(await frappeCall("auth.switch_agency", { agency: agencyId }), "agency");
	if (response.token && response.user) useAuthStore.getState().setSession({
		token: response.token,
		user: response.user,
		role: response.detectedRole
	});
	return response;
}
async function changePassword(payload) {
	await frappeCall("settings.change_password", {
		old_password: payload.oldPassword,
		new_password: payload.newPassword
	});
}
//#endregion
export { login as a, registerClient as c, verifyEmailCode as d, getCurrentUser as i, requestEmailCode as l, confirmPasswordReset as n, logout as o, forgotPassword as r, registerAgency as s, changePassword as t, switchAgency as u };
