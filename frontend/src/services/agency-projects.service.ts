import type { PaginatedResponse, Project } from "@/lib/types";
import { camelizeKeys, frappeCall } from "@/services/http";
import { mapProject } from "@/services/projects.service";

export interface AgencyProjectFilters {
  query?: string;
  status?: string;
  client?: string;
  period?: string;
  sort?: "recent" | "deadline" | "budget";
  page?: number;
  pageSize?: number;
}

export type LitigeNoticeStatus = "Pending" | "Responded" | "Expired" | "Closed" | null;

export interface SuspensionCase {
  id: string;
  projectTitle: string;
  clientName: string;
  reason: string;
  category: "amicable" | "dispute";
  status: string;
  statusLabel: string;
  openedAt: string;
  moderator: string | null;
  requestedBy: "client" | "agency" | "system" | null;

  litigeNoticeStatus: LitigeNoticeStatus;
  agencyNoticeDeadline: string | null;
  agencyResponse: string | null;
}

const AGENCY_PROJECT_STATUS_TO_TAB: Record<string, string> = {
  suspended: "En pause",
  finished: "Terminées",
};

export async function getAgencyProjects(
  filters?: AgencyProjectFilters,
): Promise<PaginatedResponse<Project> & { counts: Record<string, number> }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const tab = (filters?.status && AGENCY_PROJECT_STATUS_TO_TAB[filters.status]) || "Gagnées";
  const raw = await frappeCall<unknown>("opportunity.list_opportunities", {
    tab,
    query: filters?.query,
    client: filters?.client,
    period: filters?.period,
    sort: filters?.sort,
    page,
    page_size: pageSize,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const list = (Array.isArray(raw) ? raw : (data["results"] ?? data["items"] ?? [])) as unknown[];

  const items = list.map((entry) => {
    const camelized = camelizeKeys(entry) as Record<string, unknown>;
    const nestedProject = camelized["project"];
    const source =
      nestedProject !== null && typeof nestedProject === "object" ? nestedProject : camelized;
    return mapProject(source);
  });

  const rawCounts = (data["counts"] ?? {}) as Record<string, number>;
  const counts: Record<string, number> = {
    all: rawCounts["Gagnées"] ?? 0,
    in_progress: rawCounts["Gagnées"] ?? 0,
    suspended: rawCounts["En pause"] ?? 0,
    finished: rawCounts["Terminées"] ?? 0,
  };

  return {
    items,
    page,
    pageSize,
    total: items.length,
    totalPages: 1,
    counts,
  };
}

function mapSuspensionCase(raw: unknown): SuspensionCase {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const rawCategory = String(data["category"] ?? "").toLowerCase();
  const category: SuspensionCase["category"] = rawCategory.includes("litige")
    ? "dispute"
    : "amicable";
  const rawRequestedBy = String(data["requestedBy"] ?? "").toLowerCase();
  const requestedBy: SuspensionCase["requestedBy"] =
    rawRequestedBy === "client" || rawRequestedBy === "agency" || rawRequestedBy === "system"
      ? rawRequestedBy
      : null;

  const rawNoticeStatus = data["litigeNoticeStatus"];
  const litigeNoticeStatus: LitigeNoticeStatus =
    rawNoticeStatus === "Pending" ||
    rawNoticeStatus === "Responded" ||
    rawNoticeStatus === "Expired" ||
    rawNoticeStatus === "Closed"
      ? rawNoticeStatus
      : null;

  return {
    id: String(data["id"] ?? data["name"] ?? ""),
    projectTitle: String(data["projectTitle"] ?? ""),
    clientName: String(data["clientName"] ?? ""),
    reason: String(data["reason"] ?? ""),
    category,
    status: String(data["status"] ?? ""),
    statusLabel: String(data["statusLabel"] ?? data["status"] ?? ""),
    openedAt: String(data["openedAt"] ?? ""),
    moderator: (data["moderator"] as string | null | undefined) ?? null,
    requestedBy,
    litigeNoticeStatus,
    agencyNoticeDeadline: (data["agencyNoticeDeadline"] as string | null | undefined) ?? null,
    agencyResponse: (data["agencyResponse"] as string | null | undefined) ?? null,
  };
}

const CLOSED_SUSPENSION_STATUSES = new Set(["Refused", "Resumed", "Founded", "Not Founded"]);

function isClosedSuspensionStatus(status: string): boolean {
  return CLOSED_SUSPENSION_STATUSES.has(status);
}

export async function getSuspensionCases(filters?: {
  query?: string;
  status?: string;
  period?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<SuspensionCase> & { counts: Record<string, number> }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const raw = await frappeCall<unknown>("opportunity.list_suspensions", {});
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const list = (Array.isArray(raw) ? raw : (data["results"] ?? data["items"] ?? [])) as unknown[];
  const allCases = list.map((entry) => mapSuspensionCase(entry));

  const counts: Record<string, number> = {
    all: allCases.length,
    amicable: allCases.filter((item) => item.category === "amicable").length,
    dispute: allCases.filter((item) => item.category === "dispute").length,
    closed: allCases.filter((item) => isClosedSuspensionStatus(item.status)).length,
  };

  let items = allCases;
  const activeTab = filters?.status;
  if (activeTab && activeTab !== "all") {
    items =
      activeTab === "closed"
        ? items.filter((item) => isClosedSuspensionStatus(item.status))
        : items.filter((item) => item.category === activeTab);
  }
  if (filters?.query) {
    const normalizedQuery = filters.query.trim().toLowerCase();
    items = items.filter((item) =>
      `${item.projectTitle} ${item.clientName} ${item.reason}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }
  items = [...items].sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    page,
    pageSize,
    total,
    totalPages,
    counts,
  };
}

export async function getSuspensionHistory(
  id: string,
): Promise<Array<{ id: string; date: string; title: string; description: string }>> {
  if (!id) return [];
  const raw = await frappeCall<unknown>("opportunity.get_suspension_history", { suspension: id });
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((entry) => {
    const data = camelizeKeys(entry) as Record<string, unknown>;
    return {
      id: String(data["id"] ?? data["name"] ?? ""),
      date: String(data["date"] ?? ""),
      title: String(data["title"] ?? ""),
      description: String(data["description"] ?? ""),
    };
  });
}

export async function respondToSuspension(
  id: string,
  payload: { message: string; evidenceIds?: string[] },
): Promise<{ id: string; status: string }> {
  const raw = await frappeCall<unknown>("opportunity.respond_to_suspension", {
    suspension: id,
    message: payload.message,
    evidence_ids: payload.evidenceIds,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    id: String(data["id"] ?? id),
    status: String(data["status"] ?? "responded"),
  };
}

export async function respondToAmicableSuspension(
  id: string,
  decision: "accept" | "refuse",
  message?: string,
): Promise<{ id: string; status: string }> {
  const raw = await frappeCall<unknown>("opportunity.respond_to_amicable_suspension", {
    suspension: id,
    decision,
    message,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    id: String(data["name"] ?? id),
    status: String(data["status"] ?? (decision === "accept" ? "Validated" : "Refused")),
  };
}

export async function respondToLitigeNotice(id: string, message: string): Promise<void> {
  await frappeCall<unknown>("opportunity.respond_to_litige_notice", { suspension: id, message });
}

export async function reviewClient(
  projectId: string,
  rating: number,
  comment?: string,
): Promise<void> {
  await frappeCall<unknown>("opportunity.review_client", {
    project: projectId,
    rating,
    comment,
  });
}
