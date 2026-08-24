import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as frappeCall, r as camelizeKeys, s as restCall } from "./http-BM0VI1yy.mjs";
import { a as mapProject } from "./projects.service-BHaNpgMa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/EmptyState-CjCsYQbe.js
var import_jsx_runtime = require_jsx_runtime();
function initialsFromName(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase();
}
function mapAgency(raw) {
	const data = camelizeKeys(raw);
	const name = String(data["agencyName"] ?? data["name"] ?? "");
	return {
		id: String(data["id"] ?? data["agency"] ?? data["name"] ?? ""),
		name,
		logoText: String(data["logoText"] ?? initialsFromName(name)),
		location: String(data["location"] ?? ""),
		description: String(data["description"] ?? ""),
		rating: Number(data["rating"] ?? 0),
		reviewsCount: Number(data["reviewsCount"] ?? 0),
		matchingScore: data["matchingScore"] !== void 0 && data["matchingScore"] !== null ? Number(data["matchingScore"]) : null
	};
}
async function searchAgencies(params) {
	const page = params.page ?? 1;
	const pageSize = params.pageSize ?? 20;
	const raw = await frappeCall("agency.list_agencies", {
		query: params.query,
		category: params.category,
		location: params.subCategory,
		page,
		page_size: pageSize
	});
	const data = camelizeKeys(raw);
	const items = (data["results"] ?? data["items"] ?? (Array.isArray(raw) ? raw : [])).map((item) => mapAgency(item));
	const total = Number(data["total"] ?? items.length);
	return {
		items,
		page,
		pageSize,
		total,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
		foundCount: total
	};
}
async function getProjectShortlist(projectId) {
	const raw = await restCall("matching", `/${projectId}/shortlist`, { method: "GET" });
	return ((Array.isArray(raw) ? raw : camelizeKeys(raw)["shortlist"]) ?? []).map((item) => mapAgency(item));
}
async function contactAgencies(projectId, agencyIds, brief) {
	if (brief !== void 0 && brief !== null) {
		const raw = await frappeCall("quick_actions.send_multicast", {
			project: projectId,
			agencies: JSON.stringify(agencyIds),
			brief
		});
		const data = camelizeKeys(raw);
		return { sentCount: Number(data["sentCount"] ?? agencyIds.length) };
	}
	let sentCount = 0;
	for (const agencyId of agencyIds) {
		await frappeCall("quick_actions.contact_from_shortlist", {
			project: projectId,
			agency: agencyId
		});
		sentCount += 1;
	}
	return { sentCount };
}
async function getMyAgencies() {
	const raw = await frappeCall("agency.my_agencies");
	return (Array.isArray(raw) ? raw : []).map((item) => {
		const data = camelizeKeys(item);
		const name = String(data["agencyName"] ?? data["name"] ?? "");
		const membership = String(data["membership"] ?? data["memberRole"] ?? data["role"] ?? "").toLowerCase();
		return {
			id: String(data["agency"] ?? data["id"] ?? data["name"] ?? ""),
			initials: String(data["initials"] ?? initialsFromName(name)),
			name,
			tagline: String(data["tagline"] ?? data["slogan"] ?? ""),
			membership: membership === "owner" ? "owner" : "member"
		};
	});
}
async function listAgencyMembers() {
	const raw = await frappeCall("agency.list_members", {});
	return (Array.isArray(raw) ? raw : []).map((item) => {
		const data = camelizeKeys(item);
		return {
			id: String(data["name"] ?? ""),
			user: String(data["user"] ?? ""),
			role: String(data["memberRole"] ?? "")
		};
	});
}
async function requestToJoinAgency(id) {
	const raw = await frappeCall("agency.join_request", { agency: id });
	const data = camelizeKeys(raw);
	return { requested: Boolean(data["requested"] ?? true) };
}
async function getAgencyProfile(id) {
	const raw = await frappeCall("agency.get_profile", { agency: id });
	const data = camelizeKeys(raw);
	return {
		...mapAgency(raw),
		foundedYear: String(data["yearFounded"] ?? ""),
		teamSize: String(data["teamSize"] ?? ""),
		website: String(data["website"] ?? ""),
		languages: Array.isArray(data["languages"]) ? data["languages"] : [],
		remoteWork: Boolean(data["remoteWork"] ?? false),
		legalIdValue: String(data["legalId"] ?? ""),
		legalIdValid: Boolean(data["legalIdVerified"] ?? false),
		techStack: Array.isArray(data["techStack"]) ? data["techStack"] : [],
		skills: Array.isArray(data["skills"]) ? data["skills"] : [],
		phoneCountryCode: String(data["phoneCountryCode"] ?? ""),
		phone: String(data["phone"] ?? ""),
		email: String(data["email"] ?? ""),
		address: String(data["address"] ?? data["location"] ?? ""),
		logo: data["logo"] ?? void 0,
		slogan: data["slogan"] ?? void 0,
		coverImage: data["coverImage"] ?? void 0,
		services: Array.isArray(data["services"]) ? data["services"] : void 0,
		portfolio: Array.isArray(data["portfolio"]) ? data["portfolio"] : void 0,
		team: Array.isArray(data["team"]) ? data["team"] : void 0,
		certifications: Array.isArray(data["certifications"]) ? data["certifications"] : void 0
	};
}
async function listAgencyReviews(id, page = 1, pageSize = 10) {
	const raw = await frappeCall("review.list_agency_reviews", {
		agency: id,
		page,
		page_size: pageSize
	});
	return (Array.isArray(raw) ? raw : []).map((item, index) => {
		const data = camelizeKeys(item);
		return {
			id: String(data["name"] ?? index),
			authorInitials: "CV",
			authorName: "Client vérifié",
			rating: Number(data["rating"] ?? 0),
			comment: String(data["comment"] ?? ""),
			publishedAt: String(data["creation"] ?? "")
		};
	});
}
async function contactAgencyUnicast(agencyId, payload) {
	const draft = await frappeCall("quick_actions.start_contact", {
		need_type: payload.needType,
		title: payload.title,
		description: payload.description,
		category: payload.category,
		budget_min: payload.budgetMin,
		budget_max: payload.budgetMax,
		location: payload.location
	});
	const draftData = camelizeKeys(draft);
	const projectId = String(draftData["name"] ?? draftData["id"] ?? "");
	const sent = await frappeCall("quick_actions.send_unicast", {
		project: projectId,
		agency: agencyId
	});
	const sentData = camelizeKeys(sent);
	return {
		projectId: String(sentData["project"] ?? projectId),
		opportunityId: String(sentData["opportunity"] ?? "")
	};
}
async function toggleProjectFavorite(projectId) {
	const raw = await frappeCall("agency.toggle_project_favorite", { project: projectId });
	const data = camelizeKeys(raw);
	return { favorited: Boolean(data["favorited"] ?? false) };
}
async function listFavoriteProjects() {
	const raw = await frappeCall("agency.list_favorite_projects", {});
	return (Array.isArray(raw) ? raw : []).map((item) => mapProject(item));
}
async function toggleFavoriteAgency(agencyId) {
	const raw = await frappeCall("client.toggle_favorite", { agency: agencyId });
	const data = camelizeKeys(raw);
	return { favorited: Boolean(data["favorited"] ?? false) };
}
async function listFavoriteAgencies() {
	const raw = await frappeCall("client.list_favorites", {});
	return (Array.isArray(raw) ? raw : []).map((item) => {
		const data = camelizeKeys(item);
		return {
			agency: String(data["agency"] ?? ""),
			agencyName: String(data["agencyName"] ?? ""),
			dateAdded: String(data["dateAdded"] ?? "")
		};
	});
}
async function getCategories() {
	const raw = await frappeCall("utils.get_categories", {});
	return (Array.isArray(raw) ? raw : []).map((item) => {
		const data = camelizeKeys(item);
		const subCategoriesRaw = Array.isArray(data["subCategories"]) ? data["subCategories"] : [];
		return {
			id: String(data["name"] ?? ""),
			name: String(data["categoryName"] ?? ""),
			icon: data["icon"] ?? null,
			subCategories: subCategoriesRaw.map((sub) => {
				const subData = camelizeKeys(sub);
				return {
					id: String(subData["name"] ?? ""),
					name: String(subData["subCategoryName"] ?? ""),
					categoryId: String(subData["category"] ?? "")
				};
			})
		};
	});
}
var AGENCY_ACTIVITY_LABELS = {
	"Profile View": "Consultation du profil",
	"Website Click": "Clic vers votre site",
	"Search Impression": "Impression dans les résultats de recherche"
};
function mapAgencyActivity(raw, index) {
	const data = camelizeKeys(raw);
	const eventType = String(data["eventType"] ?? "");
	return {
		id: `agency-activity-${index}`,
		date: String(data["createdDate"] ?? data["creation"] ?? ""),
		title: AGENCY_ACTIVITY_LABELS[eventType] ?? (eventType || "Activité"),
		description: ""
	};
}
async function listAgencyApplications(projectId) {
	const raw = await frappeCall("project.list_agency_applications", { project: projectId });
	return (Array.isArray(raw) ? raw : []).map((item) => {
		const data = camelizeKeys(item);
		return {
			id: String(data["name"] ?? data["id"] ?? ""),
			agency: String(data["agency"] ?? ""),
			agencyName: String(data["agencyName"] ?? ""),
			appliedOn: String(data["creation"] ?? "")
		};
	});
}
async function respondToAgencyApplication(opportunityId, decision) {
	const raw = await frappeCall("project.respond_to_agency_application", {
		opportunity: opportunityId,
		decision
	});
	const data = camelizeKeys(raw);
	return { status: String(data["status"] ?? (decision === "accept" ? "Acceptée" : "Archivée")) };
}
async function getAgencyDashboardOverview() {
	const raw = await frappeCall("agency.get_dashboard", {});
	const data = camelizeKeys(raw);
	const recentOpportunitiesList = Array.isArray(data["recentOpportunities"]) ? data["recentOpportunities"] : [];
	const recentActivityList = Array.isArray(data["recentActivity"]) ? data["recentActivity"] : [];
	return {
		pqiScore: Number(data["pqiScore"] ?? 0),
		openOpportunitiesCount: Number(data["openOpportunitiesCount"] ?? 0),
		inProgressCount: Number(data["inProgressCount"] ?? 0),
		averageClientRating: Number(data["averageClientRating"] ?? 0),
		recentOpportunities: recentOpportunitiesList.map((entry) => {
			const item = camelizeKeys(entry);
			return {
				id: String(item["opportunity"] ?? ""),
				projectId: String(item["project"] ?? ""),
				projectTitle: String(item["title"] ?? ""),
				status: String(item["status"] ?? ""),
				matchingScore: item["matchingScore"] !== void 0 ? Number(item["matchingScore"]) : null,
				budgetMin: item["budgetMin"] !== void 0 ? Number(item["budgetMin"]) : null,
				budgetMax: item["budgetMax"] !== void 0 ? Number(item["budgetMax"]) : null,
				publishedAt: String(item["creation"] ?? "")
			};
		}),
		recentActivity: recentActivityList.map((entry, index) => mapAgencyActivity(entry, index))
	};
}
async function listJoinRequests() {
	const raw = await frappeCall("agency.list_join_requests", {});
	return (Array.isArray(raw) ? raw : []).map((item) => {
		const data = camelizeKeys(item);
		return {
			id: String(data["name"] ?? data["id"] ?? ""),
			user: String(data["user"] ?? ""),
			context: String(data["context"] ?? ""),
			requestedAt: String(data["creation"] ?? data["requestedAt"] ?? "")
		};
	});
}
async function myJoinRequests() {
	const raw = await frappeCall("agency.my_join_requests", {});
	return (Array.isArray(raw) ? raw : []).map((item) => {
		const data = camelizeKeys(item);
		const status = String(data["status"] ?? "Pending");
		const rejectionReason = data["rejectionReason"];
		return {
			id: String(data["name"] ?? data["id"] ?? ""),
			agencyName: String(data["agencyName"] ?? ""),
			status: status === "Approved" || status === "Rejected" ? status : "Pending",
			requestedAt: String(data["creation"] ?? data["requestedAt"] ?? ""),
			...rejectionReason ? { rejectionReason } : {}
		};
	});
}
async function approveJoinRequest(requestId) {
	const raw = await frappeCall("agency.approve_join_request", { request_name: requestId });
	const data = camelizeKeys(raw);
	return { status: String(data["status"] ?? "Approved") };
}
async function rejectJoinRequest(requestId, reason) {
	const raw = await frappeCall("agency.reject_join_request", {
		request_name: requestId,
		reason
	});
	const data = camelizeKeys(raw);
	return { status: String(data["status"] ?? "Rejected") };
}
function EmptyState({ message = "Aucune donnée à afficher." }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-14",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[15px] text-muted-foreground",
			children: message
		})
	});
}
//#endregion
export { toggleProjectFavorite as S, rejectJoinRequest as _, getAgencyDashboardOverview as a, searchAgencies as b, getMyAgencies as c, listAgencyMembers as d, listAgencyReviews as f, myJoinRequests as g, listJoinRequests as h, contactAgencyUnicast as i, getProjectShortlist as l, listFavoriteProjects as m, approveJoinRequest as n, getAgencyProfile as o, listFavoriteAgencies as p, contactAgencies as r, getCategories as s, EmptyState as t, listAgencyApplications as u, requestToJoinAgency as v, toggleFavoriteAgency as x, respondToAgencyApplication as y };
