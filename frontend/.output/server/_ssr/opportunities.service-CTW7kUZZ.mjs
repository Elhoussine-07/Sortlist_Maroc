import { a as frappeCall, r as camelizeKeys } from "./http-BM0VI1yy.mjs";
import { a as mapProject } from "./projects.service-BHaNpgMa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/opportunities.service-CTW7kUZZ.js
var TAB_TO_BACKEND = {
	offers: "Offres",
	applied: "Postulé",
	won: "Gagnées",
	paused: "En pause",
	finished: "Terminées",
	archived: "Archivées",
	available: "Disponibles"
};
var STEP_LABELS = {
	offers: "Nouvelle offre",
	applied: "Postulé",
	won: "Gagné",
	paused: "En pause",
	finished: "Terminé",
	archived: "Archivé",
	available: "Disponible"
};
function mapStepFromStatus(rawStatus) {
	const value = String(rawStatus ?? "").trim().toLowerCase();
	const entry = Object.entries(TAB_TO_BACKEND).find(([, backendValue]) => backendValue.toLowerCase() === value);
	return entry ? entry[0] : value || "offers";
}
function mapCounts(raw) {
	const data = raw ?? {};
	const counts = {};
	for (const [englishKey, frenchKey] of Object.entries(TAB_TO_BACKEND)) counts[englishKey] = Number(data[frenchKey] ?? 0);
	counts["all"] = counts["offers"] ?? 0;
	return counts;
}
function mapOpportunity(raw) {
	const data = camelizeKeys(raw);
	const project = data["project"] ?? {};
	const rawStatus = data["status"] !== void 0 ? String(data["status"]) : void 0;
	const step = mapStepFromStatus(data["status"]);
	const companyName = String(data["companyName"] ?? data["clientName"] ?? project["clientName"] ?? "");
	return {
		id: String(data["id"] ?? data["name"] ?? data["opportunity"] ?? ""),
		step,
		stepLabel: String(data["stepLabel"] ?? rawStatus ?? STEP_LABELS[step] ?? step),
		rawStatus,
		companyInitials: String(data["companyInitials"] ?? companyName.slice(0, 2).toUpperCase()),
		companyName,
		projectTitle: String(data["projectTitle"] ?? project["title"] ?? ""),
		budgetMin: project["budgetMin"] != null ? Number(project["budgetMin"]) : null,
		budgetMax: project["budgetMax"] != null ? Number(project["budgetMax"]) : null,
		location: String(project["location"] ?? ""),
		category: String(project["category"] ?? ""),
		relevance: Number(data["matchingScore"] ?? data["relevance"] ?? 0),
		publishedAt: String(data["publishedAt"] ?? data["creation"] ?? ""),
		quoteAmount: data["quoteAmount"] !== void 0 && data["quoteAmount"] !== null ? Number(data["quoteAmount"]) : null,
		remainingHours: data["remainingHours"] !== void 0 && data["remainingHours"] !== null ? Number(data["remainingHours"]) : null,
		project: project["id"] ?? void 0,
		agency: data["agency"] ?? void 0,
		successPrediction: data["successPrediction"] !== void 0 ? Number(data["successPrediction"]) : void 0,
		source: data["source"] ?? void 0,
		acceptedOn: data["acceptedOn"] ?? void 0,
		archivedOn: data["archivedOn"] ?? void 0,
		archiveReason: data["archiveReason"] ?? void 0
	};
}
function mapAvailableProject(raw) {
	const data = camelizeKeys(raw);
	return {
		id: String(data["project"] ?? ""),
		step: "available",
		stepLabel: STEP_LABELS["available"] ?? "Disponible",
		companyInitials: "",
		companyName: "",
		projectTitle: String(data["title"] ?? ""),
		budgetMin: data["budgetMin"] != null ? Number(data["budgetMin"]) : null,
		budgetMax: data["budgetMax"] != null ? Number(data["budgetMax"]) : null,
		location: String(data["location"] ?? ""),
		category: String(data["category"] ?? ""),
		relevance: 0,
		publishedAt: String(data["projectCreatedOn"] ?? ""),
		quoteAmount: null,
		remainingHours: null,
		project: String(data["project"] ?? ""),
		agency: void 0,
		successPrediction: void 0,
		source: void 0,
		acceptedOn: void 0,
		archivedOn: void 0,
		archiveReason: void 0
	};
}
async function getOpportunities(filters) {
	const page = filters.page ?? 1;
	const pageSize = filters.pageSize ?? 20;
	const [budgetMin, budgetMax] = (filters.budget ?? "").split("-");
	const commonParams = {
		budget_min: budgetMin || void 0,
		budget_max: budgetMax || void 0,
		location: filters.location,
		sub_category: filters.subCategory,
		need_type: filters.needType,
		page,
		page_size: pageSize
	};
	const raw = filters.tab === "available" ? await frappeCall("opportunity.list_available_projects", commonParams) : await frappeCall("opportunity.list_opportunities", {
		tab: TAB_TO_BACKEND[filters.tab],
		...commonParams
	});
	const data = camelizeKeys(raw);
	const items = (data["results"] ?? data["items"] ?? []).map((item) => filters.tab === "available" ? mapAvailableProject(item) : mapOpportunity(item));
	const total = Number(data["total"] ?? items.length);
	return {
		items,
		page,
		pageSize,
		total,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
		counts: mapCounts(data["counts"])
	};
}
async function expressInterest(projectId) {
	if (!projectId) throw new Error("Identifiant de projet manquant — impossible de postuler.");
	const raw = await frappeCall("opportunity.express_interest", { project: projectId });
	const data = camelizeKeys(raw);
	return { id: String(data["id"] ?? data["name"] ?? "") };
}
async function acceptOpportunity(id) {
	if (!id) throw new Error("Identifiant d'opportunité manquant — impossible d'accepter.");
	const raw = await frappeCall("opportunity.accept", { opportunity: id });
	const data = camelizeKeys(raw);
	return { status: String(data["status"] ?? "accepted_awaiting_quote") };
}
async function refuseOpportunity(id) {
	if (!id) throw new Error("Identifiant d'opportunité manquant — impossible de refuser.");
	const raw = await frappeCall("opportunity.decline", { opportunity: id });
	const data = camelizeKeys(raw);
	return { status: String(data["status"] ?? "refused") };
}
async function sendQuote(id, amount) {
	if (!id) throw new Error("Identifiant d'opportunité manquant — impossible d'envoyer le devis.");
	if (!amount || Number.isNaN(amount) || amount <= 0) throw new Error("Montant de devis invalide — impossible d'envoyer le devis.");
	const raw = await frappeCall("opportunity.send_quote", {
		opportunity: id,
		amount
	});
	const data = camelizeKeys(raw);
	return {
		status: String(data["status"] ?? "quote_sent"),
		clientResponseDeadlineHours: Number(data["clientResponseDeadlineHours"] ?? 48)
	};
}
async function getOpportunityCdc(id) {
	const raw = await frappeCall("opportunity.view_cdc", { opportunity: id });
	const data = camelizeKeys(raw);
	const nestedProject = data["project"];
	return {
		project: mapProject(nestedProject !== null && typeof nestedProject === "object" ? nestedProject : data),
		cdcUrl: String(data["cdcUrl"] ?? data["cdcFile"] ?? "")
	};
}
//#endregion
export { refuseOpportunity as a, getOpportunityCdc as i, expressInterest as n, sendQuote as o, getOpportunities as r, acceptOpportunity as t };
