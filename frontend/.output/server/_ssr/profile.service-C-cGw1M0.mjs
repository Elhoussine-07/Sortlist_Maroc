import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { a as frappeCall, n as GATEWAY_URL, o as resolveFileUrl, r as camelizeKeys } from "./http-BM0VI1yy.mjs";
import { a as mapProject } from "./projects.service-BHaNpgMa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile.service-C-cGw1M0.js
function trustScoreLabelFor(score) {
	if (score >= 80) return "Excellent";
	if (score >= 60) return "Bon";
	if (score >= 40) return "Moyen";
	return "À améliorer";
}
function mapClientProfile(raw) {
	const data = camelizeKeys(raw);
	const trustScore = Number(data["trustScore"] ?? 0);
	return {
		id: String(data["id"] ?? data["name"] ?? ""),
		contactFirstName: String(data["firstName"] ?? data["contactFirstName"] ?? ""),
		contactLastName: String(data["lastName"] ?? data["contactLastName"] ?? ""),
		companyName: String(data["companyName"] ?? ""),
		activitySector: String(data["sector"] ?? data["activitySector"] ?? ""),
		country: String(data["country"] ?? ""),
		legalIdType: String(data["legalIdLabel"] ?? data["legalIdType"] ?? ""),
		legalIdValue: String(data["legalId"] ?? data["legalIdValue"] ?? ""),
		identityVerified: Boolean(data["legalIdVerified"] ?? data["identityVerified"] ?? false),
		identityVerifiedAt: data["identityVerifiedAt"] ?? null,
		trustScore,
		trustScoreLabel: String(data["trustScoreLabel"] ?? trustScoreLabelFor(trustScore)),
		trustScoreFactors: Array.isArray(data["trustScoreFactors"]) ? data["trustScoreFactors"] : [],
		completionPercent: Number(data["profileCompletion"] ?? data["completionPercent"] ?? 0),
		missingFields: Array.isArray(data["missingFields"]) ? data["missingFields"] : [],
		updatedAt: String(data["modified"] ?? data["updatedAt"] ?? ""),
		phone: data["phone"] ?? void 0,
		phoneVerified: data["phoneVerified"] ?? void 0,
		logo: resolveFileUrl(data["logo"]) ?? void 0,
		projectsPublishedCount: data["projectsPublishedCount"] !== void 0 ? Number(data["projectsPublishedCount"]) : void 0,
		responseRate: data["responseRate"] !== void 0 ? Number(data["responseRate"]) : void 0,
		accountSeniority: data["accountSeniority"] ?? void 0
	};
}
function mapAgencyProfile(raw) {
	const data = camelizeKeys(raw);
	return {
		id: String(data["id"] ?? data["name"] ?? ""),
		name: String(data["agencyName"] ?? data["name"] ?? ""),
		description: String(data["description"] ?? ""),
		foundedYear: String(data["yearFounded"] ?? data["foundedYear"] ?? ""),
		teamSize: String(data["teamSize"] ?? ""),
		website: String(data["website"] ?? ""),
		languages: Array.isArray(data["languages"]) ? data["languages"] : [],
		remoteWork: Boolean(data["remoteWork"] ?? false),
		location: String(data["location"] ?? ""),
		legalIdValue: String(data["legalId"] ?? data["legalIdValue"] ?? ""),
		legalIdValid: Boolean(data["legalIdVerified"] ?? data["legalIdValid"] ?? false),
		techStack: Array.isArray(data["techStack"]) ? data["techStack"] : [],
		skills: Array.isArray(data["skills"]) ? data["skills"] : [],
		phoneCountryCode: String(data["phoneCountryCode"] ?? ""),
		phone: String(data["phone"] ?? ""),
		email: String(data["email"] ?? ""),
		verificationCode: String(data["verificationCode"] ?? ""),
		address: String(data["address"] ?? data["location"] ?? ""),
		logo: resolveFileUrl(data["logo"]),
		slogan: data["slogan"] ?? void 0,
		coverImage: resolveFileUrl(data["coverImage"]),
		coverage: Array.isArray(data["coverage"]) ? data["coverage"] : void 0,
		annualRevenue: data["annualRevenue"] !== void 0 ? Number(data["annualRevenue"]) : void 0,
		country: data["country"] ?? void 0,
		emailVerified: data["emailVerified"] ?? void 0,
		socialLinks: data["socialLinks"] ?? void 0,
		rating: data["rating"] !== void 0 ? Number(data["rating"]) : void 0,
		pqiScore: data["pqiScore"] !== void 0 ? Number(data["pqiScore"]) : void 0,
		profileCompletion: data["profileCompletion"] !== void 0 ? Number(data["profileCompletion"]) : void 0,
		reviewsCount: data["reviewsCount"] !== void 0 ? Number(data["reviewsCount"]) : void 0,
		services: Array.isArray(data["services"]) ? data["services"].map((row) => row) : void 0,
		portfolio: Array.isArray(data["portfolio"]) ? data["portfolio"].map((row) => {
			const item = row;
			return {
				...item,
				image: resolveFileUrl(item.image) ?? ""
			};
		}) : void 0,
		team: Array.isArray(data["team"]) ? data["team"].map((row) => {
			const item = row;
			return {
				...item,
				photo: resolveFileUrl(item.photo) ?? ""
			};
		}) : void 0,
		certifications: Array.isArray(data["certifications"]) ? data["certifications"].map((row) => {
			const item = row;
			return {
				...item,
				photo: resolveFileUrl(item.photo) ?? ""
			};
		}) : void 0,
		billingEmail: data["billingEmail"] ?? void 0,
		vatNumber: data["vatNumber"] ?? void 0,
		billingAddress: data["billingAddress"] ?? void 0
	};
}
async function getClientProfile() {
	return mapClientProfile(await frappeCall("client.get_profile", {}));
}
var CLIENT_TOP_LEVEL_FIELD_MAP = {
	contactFirstName: "first_name",
	contactLastName: "last_name",
	companyName: "company_name",
	activitySector: "sector",
	country: "country",
	legalIdType: "legal_id_label",
	legalIdValue: "legal_id",
	phone: "phone",
	logo: "logo"
};
async function updateClientProfile(payload) {
	const body = {};
	for (const [key, value] of Object.entries(payload)) {
		if (value === void 0) continue;
		body[CLIENT_TOP_LEVEL_FIELD_MAP[key] ?? key] = value;
	}
	return mapClientProfile(await frappeCall("client.update_profile", body));
}
async function verifyClientIdentity() {
	const raw = await frappeCall("client.verify_identity", {});
	const data = camelizeKeys(raw);
	return {
		verified: Boolean(data["verified"]),
		expectedFormat: data["expectedFormat"] ?? null,
		trustScore: Number(data["trustScore"] ?? 0)
	};
}
async function getAgencyProfile() {
	return mapAgencyProfile(await frappeCall("agency.get_my_profile", {}));
}
var AGENCY_TOP_LEVEL_FIELD_MAP = {
	name: "agency_name",
	description: "description",
	foundedYear: "year_founded",
	teamSize: "team_size",
	website: "website",
	languages: "languages",
	remoteWork: "remote_work",
	location: "location",
	legalIdValue: "legal_id",
	phoneCountryCode: "phone_country_code",
	phone: "phone",
	email: "email",
	address: "address",
	logo: "logo",
	slogan: "slogan",
	coverImage: "cover_image",
	coverage: "coverage",
	annualRevenue: "annual_revenue",
	country: "country",
	billingEmail: "billing_email",
	vatNumber: "vat_number",
	billingAddress: "billing_address"
};
async function updateAgencyProfile(payload) {
	const body = {};
	for (const [key, value] of Object.entries(payload)) {
		if (value === void 0) continue;
		body[AGENCY_TOP_LEVEL_FIELD_MAP[key] ?? key] = value;
	}
	return mapAgencyProfile(await frappeCall("agency.update_profile", body));
}
async function uploadFile(file) {
	const formData = new FormData();
	formData.append("file", file, file.name);
	formData.append("is_private", "0");
	const token = useAuthStore.getState().token;
	const headers = { Accept: "application/json" };
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const response = await fetch(`${GATEWAY_URL}/api/method/frappe.handler.upload_file`, {
		method: "POST",
		headers,
		body: formData
	});
	if (!response.ok) {
		const errorPayload = await response.json().catch(() => ({}));
		const errorMessage = errorPayload["exception"] ?? errorPayload["message"] ?? "Erreur lors du téléversement du fichier.";
		throw new Error(typeof errorMessage === "string" ? errorMessage : "Erreur lors du téléversement.");
	}
	const data = await response.json();
	const fileUrl = data.message?.file_url ?? data.file_url;
	if (!fileUrl) throw new Error("Réponse de téléversement invalide de Frappe.");
	return resolveFileUrl(fileUrl) ?? fileUrl;
}
async function getClientDashboard() {
	const raw = await frappeCall("client.get_dashboard", {});
	const data = camelizeKeys(raw);
	const trustScore = Number(data["trustScore"] ?? 0);
	const recentProjectsList = Array.isArray(data["recentProjects"]) ? data["recentProjects"] : [];
	return {
		trustScore: {
			value: trustScore,
			label: trustScoreLabelFor(trustScore)
		},
		publishedProjects: {
			value: Number(data["projectsPublishedCount"] ?? 0),
			delta: "0%"
		},
		responseRate: {
			value: Number(data["responseRate"] ?? 0),
			delta: "0%"
		},
		activeCollaborations: { value: Number(data["collaborationsCount"] ?? data["activeProjectsCount"] ?? 0) },
		recentProjects: recentProjectsList.map((item) => mapProject(item))
	};
}
function mapSettings(data, fallback) {
	const theme = String(data["themePreference"] ?? fallback?.theme ?? "system");
	const prefs = data["notificationPrefs"] ?? {};
	return {
		theme: theme === "light" || theme === "dark" ? theme : "system",
		language: String(data["language"] ?? fallback?.language ?? "fr"),
		font: String(data["fontPreference"] ?? fallback?.font ?? "default"),
		textSize: Number(data["fontSize"] ?? fallback?.textSize ?? 100),
		twoFactorEnabled: Boolean(data["twoFactorEnabled"] ?? fallback?.twoFactorEnabled ?? false),
		emailNotifications: Boolean(prefs["email"] ?? fallback?.emailNotifications ?? true),
		pushNotifications: Boolean(prefs["push"] ?? fallback?.pushNotifications ?? true)
	};
}
async function getSettings() {
	const raw = await frappeCall("settings.get_settings", {});
	return mapSettings(camelizeKeys(raw));
}
async function updateSettings(payload) {
	const displayPatch = {};
	if (payload.theme !== void 0) displayPatch["theme_preference"] = payload.theme;
	if (payload.font !== void 0) displayPatch["font_preference"] = payload.font;
	if (payload.textSize !== void 0) displayPatch["font_size"] = payload.textSize;
	if (payload.language !== void 0) displayPatch["language"] = payload.language;
	let raw = null;
	if (Object.keys(displayPatch).length > 0) raw = await frappeCall("settings.update_settings", displayPatch);
	if (payload.twoFactorEnabled !== void 0) await frappeCall("settings.toggle_two_factor", { enabled: payload.twoFactorEnabled });
	if (payload.emailNotifications !== void 0 || payload.pushNotifications !== void 0) await frappeCall("settings.update_notification_prefs", { prefs: {
		email: payload.emailNotifications ?? true,
		push: payload.pushNotifications ?? true
	} });
	return mapSettings(raw ? camelizeKeys(raw) : {}, payload);
}
//#endregion
export { updateAgencyProfile as a, uploadFile as c, getSettings as i, verifyClientIdentity as l, getClientDashboard as n, updateClientProfile as o, getClientProfile as r, updateSettings as s, getAgencyProfile as t };
