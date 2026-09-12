import type { Opportunity, PaginatedResponse, Project } from "@/lib/types";
import { camelizeKeys, fetchBlob, frappeCall, GATEWAY_URL } from "@/services/http";
import { mapProject } from "@/services/projects.service";

export type OpportunityTab =
  "offers" | "applied" | "won" | "paused" | "finished" | "archived" | "available";

export interface OpportunityFilters {
  tab: OpportunityTab;
  budget?: string;
  location?: string;
  publishedAt?: string;
  subCategory?: string;
  needType?: string;
  page?: number;
  pageSize?: number;
}

const TAB_TO_BACKEND: Record<OpportunityTab, string> = {
  offers: "Offres",
  applied: "Postulé",
  won: "Gagnées",
  paused: "En pause",
  finished: "Terminées",
  archived: "Archivées",
  available: "Disponibles",
};

const STEP_LABELS: Record<string, string> = {
  offers: "Nouvelle offre",
  applied: "Postulé",
  won: "Gagné",
  paused: "En pause",
  finished: "Terminé",
  archived: "Archivé",
  available: "Disponible",
};

function mapStepFromStatus(rawStatus: unknown): string {
  const value = String(rawStatus ?? "")
    .trim()
    .toLowerCase();
  const entry = Object.entries(TAB_TO_BACKEND).find(
    ([, backendValue]) => backendValue.toLowerCase() === value,
  );
  return entry ? entry[0] : value || "offers";
}

function mapCounts(raw: unknown): Record<string, number> {
  const data = (raw ?? {}) as Record<string, unknown>;
  const counts: Record<string, number> = {};
  for (const [englishKey, frenchKey] of Object.entries(TAB_TO_BACKEND)) {
    counts[englishKey] = Number(data[frenchKey] ?? 0);
  }
  counts["all"] = counts["offers"] ?? 0;
  return counts;
}

function mapOpportunity(raw: unknown): Opportunity {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const project = (data["project"] ?? {}) as Record<string, unknown>;
  const rawStatus = data["status"] !== undefined ? String(data["status"]) : undefined;
  const step = mapStepFromStatus(data["status"]);
  const companyName = String(
    data["companyName"] ?? data["clientName"] ?? project["partnerAgencyName"] ?? "",
  );

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
    quoteAmount:
      data["quoteAmount"] !== undefined && data["quoteAmount"] !== null
        ? Number(data["quoteAmount"])
        : null,
    remainingHours:
      data["remainingHours"] !== undefined && data["remainingHours"] !== null
        ? Number(data["remainingHours"])
        : null,
    project: (project["id"] as string | undefined) ?? undefined,
    agency: (data["agency"] as string | undefined) ?? undefined,
    successPrediction:
      data["successPrediction"] !== undefined ? Number(data["successPrediction"]) : undefined,
    source: (data["source"] as string | undefined) ?? undefined,
    acceptedOn: (data["acceptedOn"] as string | undefined) ?? undefined,
    archivedOn: (data["archivedOn"] as string | undefined) ?? undefined,
    archiveReason: (data["archiveReason"] as string | undefined) ?? undefined,
  };
}

function mapAvailableProject(raw: unknown): Opportunity {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const companyName = String(data["clientName"] ?? "");
  return {
    id: String(data["project"] ?? ""),
    step: "available",
    stepLabel: STEP_LABELS["available"] ?? "Disponible",
    companyInitials: companyName.slice(0, 2).toUpperCase(),
    companyName,
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
    agency: undefined,
    successPrediction: undefined,
    source: undefined,
    acceptedOn: undefined,
    archivedOn: undefined,
    archiveReason: undefined,
  };
}

export async function getOpportunities(
  filters: OpportunityFilters,
): Promise<PaginatedResponse<Opportunity> & { counts: Record<string, number> }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const [budgetMin, budgetMax] = (filters.budget ?? "").split("-");
  const commonParams = {
    budget_min: budgetMin || undefined,
    budget_max: budgetMax || undefined,
    location: filters.location,
    sub_category: filters.subCategory,
    need_type: filters.needType,
    page,
    page_size: pageSize,
  };

  const raw =
    filters.tab === "available"
      ? await frappeCall<unknown>("opportunity.list_available_projects", commonParams)
      : await frappeCall<unknown>("opportunity.list_opportunities", {
          tab: TAB_TO_BACKEND[filters.tab],
          ...commonParams,
        });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const list = (data["results"] ?? data["items"] ?? []) as unknown[];
  const items = list.map((item) =>
    filters.tab === "available" ? mapAvailableProject(item) : mapOpportunity(item),
  );
  const total = Number(data["total"] ?? items.length);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts: mapCounts(data["counts"]),
  };
}

export async function expressInterest(projectId: string): Promise<{ id: string }> {
  if (!projectId) {
    throw new Error("Identifiant de projet manquant — impossible de postuler.");
  }
  const raw = await frappeCall<unknown>("opportunity.express_interest", { project: projectId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { id: String(data["id"] ?? data["name"] ?? "") };
}

export async function acceptOpportunity(id: string): Promise<{ status: string }> {
  if (!id) {
    throw new Error("Identifiant d'opportunité manquant — impossible d'accepter.");
  }
  const raw = await frappeCall<unknown>("opportunity.accept", { opportunity: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { status: String(data["status"] ?? "accepted_awaiting_quote") };
}

export async function refuseOpportunity(id: string): Promise<{ status: string }> {
  if (!id) {
    throw new Error("Identifiant d'opportunité manquant — impossible de refuser.");
  }
  const raw = await frappeCall<unknown>("opportunity.decline", { opportunity: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { status: String(data["status"] ?? "refused") };
}

export async function sendQuote(
  id: string,
  amount: number,
): Promise<{ status: string; clientResponseDeadlineHours: number }> {
  if (!id) {
    throw new Error("Identifiant d'opportunité manquant — impossible d'envoyer le devis.");
  }
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    throw new Error("Montant de devis invalide — impossible d'envoyer le devis.");
  }
  const raw = await frappeCall<unknown>("opportunity.send_quote", {
    opportunity: id,
    amount,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    status: String(data["status"] ?? "quote_sent"),
    clientResponseDeadlineHours: Number(data["clientResponseDeadlineHours"] ?? 48),
  };
}

export interface OpportunityCdcResponse {
  project: Project;
  cdcUrl: string;
}

export async function getOpportunityCdc(id: string): Promise<OpportunityCdcResponse> {
  const raw = await frappeCall<unknown>("opportunity.view_cdc", { opportunity: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const nestedProject = data["project"];
  const project = mapProject(
    nestedProject !== null && typeof nestedProject === "object" ? nestedProject : data,
  );
  return {
    project,
    cdcUrl: String(data["cdcUrl"] ?? data["cdcFile"] ?? ""),
  };
}

export async function downloadOpportunityCdc(id: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.opportunity.download_cdc`;
  return fetchBlob(url, undefined, { opportunity: id });
}
