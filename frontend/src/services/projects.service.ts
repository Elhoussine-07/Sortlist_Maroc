import type { PaginatedResponse, Project, ProjectStatus } from "@/lib/types";
import { camelizeKeys, fetchBlob, frappeCall, GATEWAY_URL, resolveFileUrl } from "@/services/http";

export interface ProjectSearchParams {
  query?: string;
  category?: string;
  subCategory?: string;
  budget?: string;
  sort?: "recent" | "relevance";
  page?: number;
  pageSize?: number;
  status?: string;
}

const STATUS_MAP: Record<string, ProjectStatus> = {
  draft: "draft",
  posted: "published",
  published: "published",
  awaiting: "awaiting",
  "en attente": "awaiting",
  "in progress": "in_progress",
  in_progress: "in_progress",
  suspended: "suspended",
  finished: "finished",
  completed: "finished",
  rejected: "rejected",
};

function mapProjectStatus(rawStatus: unknown): ProjectStatus {
  const key = String(rawStatus ?? "")
    .trim()
    .toLowerCase();
  return STATUS_MAP[key] ?? "draft";
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Brouillon",
  published: "Postulé",
  awaiting: "En attente",
  in_progress: "En cours",
  suspended: "Suspendu",
  finished: "Terminé",
  rejected: "Rejeté",
};

export function mapProject(raw: unknown): Project {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const status = mapProjectStatus(data["status"]);

  return {
    id: String(data["id"] ?? data["name"] ?? data["project"] ?? ""),
    reference: String(data["reference"] ?? data["name"] ?? data["project"] ?? ""),
    title: String(data["title"] ?? ""),
    category: String(data["categoryName"] ?? data["category"] ?? ""),
    subCategory: String(data["subCategory"] ?? ""),
    status,
    statusLabel: String(data["statusLabel"] ?? STATUS_LABELS[status]),
    lastActivity: String(
      data["lastActivity"] ?? data["modified"] ?? data["projectCreatedOn"] ?? "",
    ),
    budgetMin: data["budgetMin"] !== undefined ? Number(data["budgetMin"]) : null,
    budgetMax: data["budgetMax"] !== undefined ? Number(data["budgetMax"]) : null,
    location: String(data["location"] ?? ""),
    startedAt: (data["startDate"] as string | undefined) ?? null,
    paymentStatus: (data["paymentStatus"] as string | undefined) ?? undefined,
    agencyProjectAmount:
      data["agencyProjectAmount"] !== undefined && data["agencyProjectAmount"] !== null
        ? Number(data["agencyProjectAmount"])
        : null,
    partnerAgencyName: (data["partnerAgencyName"] as string | undefined) ?? null,
    agencyId: (data["agency"] as string | undefined) ?? null,
    declinedByAgency: (data["declinedByAgency"] as string | undefined) ?? null,
    declinedByAgencyName: (data["declinedByAgencyName"] as string | undefined) ?? null,
    objective: String(data["description"] ?? data["objective"] ?? ""),
    features: Array.isArray(data["features"])
      ? (data["features"] as string[])
      : typeof data["skills"] === "string" && data["skills"]
        ? (data["skills"] as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    constraints: Array.isArray(data["constraints"]) ? (data["constraints"] as string[]) : [],
    deadline: String(data["deadline"] ?? data["expectedEndDate"] ?? ""),
    locked: Boolean(data["cdcLocked"] ?? data["locked"] ?? false),
    client: data["client"] as string | undefined,
    description: data["description"] as string | undefined,
    needType: data["needType"] as string | undefined,
    channel: data["channel"] as string | undefined,
    deliveryDelayDays:
      data["deliveryDelayDays"] !== undefined ? Number(data["deliveryDelayDays"]) : undefined,
    rejectionSubstatus: (data["rejectionSubstatus"] as string | undefined) ?? undefined,
    cdcFile: (data["cdcFile"] as string | undefined) ?? undefined,
    shortlistIa: Array.isArray(data["shortlistIa"]) ? (data["shortlistIa"] as string[]) : undefined,
    acceptanceDate: (data["acceptanceDate"] as string | undefined) ?? undefined,
    expectedEndDate: (data["expectedEndDate"] as string | undefined) ?? undefined,
    totalSuspensionDays:
      data["totalSuspensionDays"] !== undefined ? Number(data["totalSuspensionDays"]) : undefined,
    completionConfirmedByClient:
      data["completionConfirmedByClient"] !== undefined
        ? Boolean(data["completionConfirmedByClient"])
        : undefined,
    repostCount: data["repostCount"] !== undefined ? Number(data["repostCount"]) : undefined,
    reviewedByAgency:
      data["reviewedByAgency"] !== undefined ? Boolean(data["reviewedByAgency"]) : undefined,
    urgency: (data["urgency"] as string | undefined) ?? null,
    estimatedDuration: (data["estimatedDuration"] as string | undefined) ?? null,
    interestedAgenciesCount:
      data["interestedAgenciesCount"] !== undefined
        ? Number(data["interestedAgenciesCount"])
        : undefined,
    budgetFlexible: Boolean(data["budgetFlexible"]),
  };
}

function mapProjectList(raw: unknown): unknown[] {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  if (Array.isArray(raw)) return raw;
  return (data["results"] ?? data["items"] ?? []) as unknown[];
}

export async function getMyProjects(
  params?: ProjectSearchParams,
): Promise<PaginatedResponse<Project>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const raw = await frappeCall<unknown>("project.my_projects", {
    status: params?.status,
  });
  const items = mapProjectList(raw).map((item) => mapProject(item));

  return {
    items,
    page,
    pageSize,
    total: items.length,
    totalPages: 1,
  };
}

export async function getProject(id: string): Promise<Project> {
  const raw = await frappeCall<unknown>("project.get_project", { project: id });
  return mapProject(raw);
}

export interface PublicProjectDetail {
  id: string;
  title: string;
  description: string;
  needType: string;
  channel: string;
  category: string;
  subCategory: string;
  budgetMin: number | null;
  budgetMax: number | null;
  location: string;
  deliveryDelayDays: number | null;
  expectedEndDate: string | null;
  publishedAt: string;
  clientCompanyName: string;
  clientCountry: string;
  clientLogo: string | null;
  clientSector: string;
  clientTrustScore: number | null;
}

export async function getPublicProject(id: string): Promise<PublicProjectDetail> {
  const raw = await frappeCall<unknown>("project.get_project", { project: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;

  return {
    id: String(data["name"] ?? data["id"] ?? id),
    title: String(data["title"] ?? ""),
    description: String(data["description"] ?? ""),
    needType: String(data["needType"] ?? ""),
    channel: String(data["channel"] ?? ""),
    category: String(data["category"] ?? ""),
    subCategory: String(data["subCategory"] ?? ""),
    budgetMin:
      data["budgetMin"] !== undefined && data["budgetMin"] !== null
        ? Number(data["budgetMin"])
        : null,
    budgetMax:
      data["budgetMax"] !== undefined && data["budgetMax"] !== null
        ? Number(data["budgetMax"])
        : null,
    location: String(data["location"] ?? ""),
    deliveryDelayDays:
      data["deliveryDelayDays"] !== undefined && data["deliveryDelayDays"] !== null
        ? Number(data["deliveryDelayDays"])
        : null,
    expectedEndDate: (data["expectedEndDate"] as string | undefined) ?? null,
    publishedAt: String(data["creation"] ?? data["modified"] ?? ""),
    clientCompanyName: String(data["clientCompanyName"] ?? data["companyName"] ?? "Client"),
    clientCountry: String(data["clientCountry"] ?? ""),
    clientLogo: resolveFileUrl(data["clientLogo"] as string | null | undefined) ?? null,
    clientSector: String(data["clientSector"] ?? ""),
    clientTrustScore:
      data["clientTrustScore"] !== undefined && data["clientTrustScore"] !== null
        ? Number(data["clientTrustScore"])
        : null,
  };
}

export async function searchProjects(
  params: ProjectSearchParams,
): Promise<PaginatedResponse<Project> & { availableCount: number }> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const budgetParts = (params.budget ?? "").split("-").map((value) => value.trim());
  const budgetMin = budgetParts[0] || undefined;
  const budgetMax = budgetParts[1] || (budgetParts.length === 1 ? budgetParts[0] : undefined);

  const raw = await frappeCall<unknown>("opportunity.list_public_projects", {
    query: params.query,
    category: params.category,
    sub_category: params.subCategory,
    budget_min: budgetMin,
    budget_max: budgetMax,
    page,
    page_size: pageSize,
  });
  const items = mapProjectList(raw).map((item) => mapProject(item));
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const total = Number(data["total"] ?? items.length);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    availableCount: total,
  };
}

function toBriefFieldsPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    needType: "need_type",
    category: "category",
    subCategory: "sub_category",
    budgetMin: "budget_min",
    budgetMax: "budget_max",
    location: "location",
    deliveryDelayDays: "delivery_delay_days",
    description: "description",
    title: "title",
  };
  const result: Record<string, unknown> = {};
  for (const [camelKey, snakeKey] of Object.entries(map)) {
    if (payload[camelKey] !== undefined) {
      result[snakeKey] = payload[camelKey];
    }
  }
  return result;
}

export async function createProject(payload: unknown): Promise<Project> {
  const body = toBriefFieldsPayload(payload as Record<string, unknown>);
  const raw = await frappeCall<unknown>("quick_actions.start_contact", {
    need_type: body["need_type"] ?? "Projet",
    ...body,
  });
  return mapProject(raw);
}

export async function saveProjectDraft(id: string | null, payload: unknown): Promise<Project> {
  const raw = await frappeCall<unknown>("project.update_brief", {
    project: id,
    ...toBriefFieldsPayload(payload as Record<string, unknown>),
  });
  return mapProject(raw);
}

export async function publishProject(id: string): Promise<Project> {
  const raw = await frappeCall<unknown>("project.post_project", { project: id });
  return mapProject(raw);
}

export async function repostProject(
  id: string,
  includePreviouslyDeclined = false,
): Promise<Project> {
  const raw = await frappeCall<unknown>("project.repost", {
    project: id,
    include_previously_declined: includePreviouslyDeclined,
  });
  return mapProject(raw);
}

export async function deleteProject(id: string): Promise<Project> {
  const raw = await frappeCall<unknown>("project.delete_project", { project: id });
  return mapProject(raw);
}

export async function downloadProjectCdc(id: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.project.download_cdc`;
  return fetchBlob(url, undefined, { project: id });
}

export async function payAgencyForProject(payload: {
  projectId: string;
  paymentMethod: "Card" | "Bank Transfer" | "PayPal";
  providerToken: string;
}): Promise<{ payment: string; status: string; amount: number }> {
  const raw = await frappeCall<unknown>("client.pay_agency_for_project", {
    project: payload.projectId,
    payment_method: payload.paymentMethod,
    provider_token: payload.providerToken,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    payment: String(data["payment"] ?? ""),
    status: String(data["status"] ?? ""),
    amount: Number(data["amount"] ?? 0),
  };
}
