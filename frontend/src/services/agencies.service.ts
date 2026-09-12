import type {
  Agency,
  AgencyCertificationItem,
  AgencyPortfolioItem,
  AgencyProfile,
  AgencyTeamItem,
  HistoryEntry,
  PaginatedResponse,
  Project,
} from "@/lib/types";
import {
  camelizeKeys,
  frappeCall,
  parseCommaList,
  resolveFileUrl,
  restCall,
} from "@/services/http";
import { mapProject } from "@/services/projects.service";

export interface AgencySearchParams {
  query?: string;
  category?: string;
  subCategory?: string;
  sort?: "relevance" | "rating" | "recent";
  page?: number;
  pageSize?: number;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function mapAgency(raw: unknown): Agency {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const name = String(data["agencyName"] ?? data["name"] ?? "");
  return {
    id: String(data["id"] ?? data["agency"] ?? data["name"] ?? ""),
    name,
    logoText: String(data["logoText"] ?? initialsFromName(name)),
    location: String(data["location"] ?? ""),
    description: String(data["description"] ?? ""),
    rating: Number(data["rating"] ?? 0),
    reviewsCount: Number(data["reviewsCount"] ?? 0),
    matchingScore:
      data["matchingScore"] !== undefined && data["matchingScore"] !== null
        ? Number(data["matchingScore"])
        : null,
    teamSizeCount:
      data["teamSize"] !== undefined && data["teamSize"] !== null ? Number(data["teamSize"]) : null,
    avgResponseHours:
      data["avgResponseHours"] !== undefined && data["avgResponseHours"] !== null
        ? Number(data["avgResponseHours"])
        : null,
    badge: data["badge"] !== undefined && data["badge"] !== null ? String(data["badge"]) : null,
    onTimeDeliveryRate:
      data["onTimeDeliveryRate"] !== undefined && data["onTimeDeliveryRate"] !== null
        ? Number(data["onTimeDeliveryRate"])
        : null,
    tags: Array.isArray(data["tags"]) ? (data["tags"] as string[]) : undefined,
    startingPrice:
      data["startingPrice"] !== undefined && data["startingPrice"] !== null
        ? String(data["startingPrice"])
        : null,
    portfolioCount:
      data["portfolioCount"] !== undefined ? Number(data["portfolioCount"]) : undefined,
    logo: resolveFileUrl(data["logo"] as string | null | undefined),
  };
}

export async function searchAgencies(
  params: AgencySearchParams,
): Promise<PaginatedResponse<Agency> & { foundCount: number }> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const raw = await frappeCall<unknown>("agency.list_agencies", {
    query: params.query,
    category: params.category,
    location: params.subCategory,
    page,
    page_size: pageSize,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const results = (data["results"] ??
    data["items"] ??
    (Array.isArray(raw) ? raw : [])) as unknown[];
  const items = results.map((item) => mapAgency(item));
  const total = Number(data["total"] ?? items.length);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    foundCount: total,
  };
}

export async function getAgency(id: string): Promise<Agency> {
  const raw = await frappeCall<unknown>("agency.get_profile", { agency: id });
  return mapAgency(raw);
}

export async function getProjectShortlist(projectId: string): Promise<Agency[]> {
  const raw = await restCall<unknown>("matching", `/${projectId}/shortlist`, {
    method: "GET",
  });
  const list = (
    Array.isArray(raw) ? raw : (camelizeKeys(raw) as Record<string, unknown>)["shortlist"]
  ) as unknown[] | undefined;
  return (list ?? []).map((item) => mapAgency(item));
}

export async function contactAgencies(
  projectId: string,
  agencyIds: string[],
  brief: unknown,
): Promise<{ sentCount: number }> {
  if (brief !== undefined && brief !== null) {
    const raw = await frappeCall<unknown>("quick_actions.send_multicast", {
      project: projectId,
      agencies: JSON.stringify(agencyIds),
      brief,
    });
    const data = camelizeKeys(raw) as Record<string, unknown>;
    return { sentCount: Number(data["sentCount"] ?? agencyIds.length) };
  }

  let sentCount = 0;
  for (const agencyId of agencyIds) {
    await frappeCall<unknown>("quick_actions.contact_from_shortlist", {
      project: projectId,
      agency: agencyId,
    });
    sentCount += 1;
  }
  return { sentCount };
}

export async function getMyAgencies(): Promise<
  Array<{
    id: string;
    initials: string;
    name: string;
    tagline: string;
    membership: "owner" | "member";
  }>
> {
  const raw = await frappeCall<unknown>("agency.my_agencies");
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    const name = String(data["agencyName"] ?? data["name"] ?? "");
    const membership = String(
      data["membership"] ?? data["memberRole"] ?? data["role"] ?? "",
    ).toLowerCase();
    return {
      id: String(data["agency"] ?? data["id"] ?? data["name"] ?? ""),
      initials: String(data["initials"] ?? initialsFromName(name)),
      name,
      tagline: String(data["tagline"] ?? data["slogan"] ?? ""),
      membership: membership === "owner" ? "owner" : "member",
    };
  });
}

export async function listAgencyMembers(): Promise<
  Array<{ id: string; user: string; role: string }>
> {
  const raw = await frappeCall<unknown>("agency.list_members", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    return {
      id: String(data["name"] ?? ""),
      user: String(data["user"] ?? ""),
      role: String(data["memberRole"] ?? ""),
    };
  });
}

export async function requestToJoinAgency(id: string): Promise<{ requested: boolean }> {
  const raw = await frappeCall<unknown>("agency.join_request", { agency: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { requested: Boolean(data["requested"] ?? true) };
}

export async function getAgencyProfile(id: string): Promise<Agency & Partial<AgencyProfile>> {
  const raw = await frappeCall<unknown>("agency.get_profile", { agency: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const base = mapAgency(raw);

  return {
    ...base,
    foundedYear: String(data["yearFounded"] ?? ""),
    teamSize: String(data["teamSize"] ?? ""),
    website: String(data["website"] ?? ""),
    languages: parseCommaList(data["languages"]),
    remoteWork: Boolean(data["remoteWork"] ?? false),
    legalIdValue: String(data["legalId"] ?? ""),
    legalIdValid: Boolean(data["legalIdVerified"] ?? false),
    techStack: parseCommaList(data["techStack"]),
    skills: parseCommaList(data["skills"]),
    phoneCountryCode: String(data["phoneCountryCode"] ?? ""),
    phone: String(data["phone"] ?? ""),
    email: String(data["email"] ?? ""),
    address: String(data["address"] ?? data["location"] ?? ""),
    logo: resolveFileUrl(data["logo"] as string | null | undefined),
    slogan: (data["slogan"] as string | undefined) ?? undefined,
    coverImage: resolveFileUrl(data["coverImage"] as string | null | undefined),
    services: Array.isArray(data["services"])
      ? (data["services"] as AgencyProfile["services"])
      : undefined,
    portfolio: Array.isArray(data["portfolio"])
      ? (data["portfolio"] as unknown[]).map((row) => {
          const item = row as unknown as AgencyPortfolioItem;
          return { ...item, image: resolveFileUrl(item.image) ?? "" };
        })
      : undefined,
    team: Array.isArray(data["team"])
      ? (data["team"] as unknown[]).map((row) => {
          const item = row as unknown as AgencyTeamItem;
          return { ...item, photo: resolveFileUrl(item.photo) ?? "" };
        })
      : undefined,
    certifications: Array.isArray(data["certifications"])
      ? (data["certifications"] as unknown[]).map((row) => {
          const item = row as unknown as AgencyCertificationItem;
          return { ...item, photo: resolveFileUrl(item.photo) ?? "" };
        })
      : undefined,
  };
}

export interface AgencyReview {
  id: string;
  authorInitials: string;
  authorName: string;
  rating: number;
  comment: string;
  publishedAt: string;
  projectTitle?: string | null | undefined;
}

export async function listAgencyReviews(
  id: string,
  page = 1,
  pageSize = 10,
): Promise<AgencyReview[]> {
  const raw = await frappeCall<unknown>("review.list_agency_reviews", {
    agency: id,
    page,
    page_size: pageSize,
  });
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item, index) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    return {
      id: String(data["name"] ?? index),
      authorInitials: "CV",
      authorName: "Client vérifié",
      rating: Number(data["rating"] ?? 0),
      comment: String(data["comment"] ?? ""),
      publishedAt: String(data["creation"] ?? ""),
      projectTitle: (data["projectTitle"] as string | null | undefined) ?? null,
    };
  });
}

export async function contactAgencyUnicast(
  agencyId: string,
  payload: {
    needType: "Projet" | "Stage" | "Job";
    title?: string;
    description: string;
    category?: string;
    subCategory?: string;
    budgetMin?: number;
    budgetMax?: number;
    location?: string;
    deliveryDelayDays?: number;
  },
): Promise<{ projectId: string; opportunityId: string }> {
  const draft = await frappeCall<unknown>("quick_actions.start_contact", {
    need_type: payload.needType,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    sub_category: payload.subCategory,
    budget_min: payload.budgetMin,
    budget_max: payload.budgetMax,
    location: payload.location,
    delivery_delay_days: payload.deliveryDelayDays,
  });
  const draftData = camelizeKeys(draft) as Record<string, unknown>;
  const projectId = String(draftData["name"] ?? draftData["id"] ?? "");

  const sent = await frappeCall<unknown>("quick_actions.send_unicast", {
    project: projectId,
    agency: agencyId,
  });
  const sentData = camelizeKeys(sent) as Record<string, unknown>;

  return {
    projectId: String(sentData["project"] ?? projectId),
    opportunityId: String(sentData["opportunity"] ?? ""),
  };
}

export async function toggleProjectFavorite(projectId: string): Promise<{ favorited: boolean }> {
  const raw = await frappeCall<unknown>("agency.toggle_project_favorite", { project: projectId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { favorited: Boolean(data["favorited"] ?? false) };
}

export async function listFavoriteProjects(): Promise<Project[]> {
  const raw = await frappeCall<unknown>("agency.list_favorite_projects", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => mapProject(item));
}

export async function toggleFavoriteAgency(agencyId: string): Promise<{ favorited: boolean }> {
  const raw = await frappeCall<unknown>("client.toggle_favorite", { agency: agencyId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { favorited: Boolean(data["favorited"] ?? false) };
}

export interface FavoriteAgencyEntry {
  agency: string;
  agencyName: string;
  dateAdded: string;
}

export async function listFavoriteAgencies(): Promise<FavoriteAgencyEntry[]> {
  const raw = await frappeCall<unknown>("client.list_favorites", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    return {
      agency: String(data["agency"] ?? ""),
      agencyName: String(data["agencyName"] ?? ""),
      dateAdded: String(data["dateAdded"] ?? ""),
    };
  });
}

export interface SubCategoryOption {
  id: string;
  name: string;
  categoryId: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
  subCategories: SubCategoryOption[];
}

export async function getCategories(): Promise<CategoryOption[]> {
  const raw = await frappeCall<unknown>("utils.get_categories", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    const subCategoriesRaw = Array.isArray(data["subCategories"])
      ? (data["subCategories"] as unknown[])
      : [];
    return {
      id: String(data["name"] ?? ""),
      name: String(data["categoryName"] ?? ""),
      icon: (data["icon"] as string | null | undefined) ?? null,
      subCategories: subCategoriesRaw.map((sub) => {
        const subData = camelizeKeys(sub) as Record<string, unknown>;
        return {
          id: String(subData["name"] ?? ""),
          name: String(subData["subCategoryName"] ?? ""),
          categoryId: String(subData["category"] ?? ""),
        };
      }),
    };
  });
}

export interface AgencyDashboardOpportunity {
  id: string;
  projectId: string;
  projectTitle: string;
  status: string;
  matchingScore: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  publishedAt: string;
}

const AGENCY_ACTIVITY_LABELS: Record<string, string> = {
  "Profile View": "Consultation du profil",
  "Website Click": "Clic vers votre site",
  "Search Impression": "Impression dans les résultats de recherche",
};

function mapAgencyActivity(raw: unknown, index: number): HistoryEntry {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const eventType = String(data["eventType"] ?? "");
  return {
    id: `agency-activity-${index}`,
    date: String(data["createdDate"] ?? data["creation"] ?? ""),
    title: AGENCY_ACTIVITY_LABELS[eventType] ?? (eventType || "Activité"),
    description: "",
  };
}

export interface AgencyApplication {
  id: string;
  agency: string;
  agencyName: string;
  appliedOn: string;
}

export async function listAgencyApplications(projectId: string): Promise<AgencyApplication[]> {
  const raw = await frappeCall<unknown>("project.list_agency_applications", {
    project: projectId,
  });
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    return {
      id: String(data["name"] ?? data["id"] ?? ""),
      agency: String(data["agency"] ?? ""),
      agencyName: String(data["agencyName"] ?? ""),
      appliedOn: String(data["creation"] ?? ""),
    };
  });
}

export async function respondToAgencyApplication(
  opportunityId: string,
  decision: "accept" | "refuse",
): Promise<{ status: string }> {
  const raw = await frappeCall<unknown>("project.respond_to_agency_application", {
    opportunity: opportunityId,
    decision,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { status: String(data["status"] ?? (decision === "accept" ? "Acceptée" : "Archivée")) };
}

export interface AgencyDashboardOverview {
  pqiScore: number;
  openOpportunitiesCount: number;
  inProgressCount: number;
  averageClientRating: number;
  recentOpportunities: AgencyDashboardOpportunity[];
  recentActivity: HistoryEntry[];
}

export async function getAgencyDashboardOverview(): Promise<AgencyDashboardOverview> {
  const raw = await frappeCall<unknown>("agency.get_dashboard", {});
  const data = camelizeKeys(raw) as Record<string, unknown>;

  const recentOpportunitiesList = (
    Array.isArray(data["recentOpportunities"]) ? data["recentOpportunities"] : []
  ) as unknown[];
  const recentActivityList = (
    Array.isArray(data["recentActivity"]) ? data["recentActivity"] : []
  ) as unknown[];

  return {
    pqiScore: Number(data["pqiScore"] ?? 0),
    openOpportunitiesCount: Number(data["openOpportunitiesCount"] ?? 0),
    inProgressCount: Number(data["inProgressCount"] ?? 0),
    averageClientRating: Number(data["averageClientRating"] ?? 0),
    recentOpportunities: recentOpportunitiesList.map((entry) => {
      const item = camelizeKeys(entry) as Record<string, unknown>;
      return {
        id: String(item["opportunity"] ?? ""),
        projectId: String(item["project"] ?? ""),
        projectTitle: String(item["title"] ?? ""),
        status: String(item["status"] ?? ""),
        matchingScore: item["matchingScore"] !== undefined ? Number(item["matchingScore"]) : null,
        budgetMin: item["budgetMin"] !== undefined ? Number(item["budgetMin"]) : null,
        budgetMax: item["budgetMax"] !== undefined ? Number(item["budgetMax"]) : null,
        publishedAt: String(item["creation"] ?? ""),
      };
    }),
    recentActivity: recentActivityList.map((entry, index) => mapAgencyActivity(entry, index)),
  };
}

export interface JoinRequestReceived {
  id: string;
  user: string;
  context: string;
  requestedAt: string;
}

export interface JoinRequestSent {
  id: string;
  agencyName: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedAt: string;
  rejectionReason?: string;
}

export async function listJoinRequests(): Promise<JoinRequestReceived[]> {
  const raw = await frappeCall<unknown>("agency.list_join_requests", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    return {
      id: String(data["name"] ?? data["id"] ?? ""),
      user: String(data["user"] ?? ""),
      context: String(data["context"] ?? ""),
      requestedAt: String(data["creation"] ?? data["requestedAt"] ?? ""),
    };
  });
}

export async function myJoinRequests(): Promise<JoinRequestSent[]> {
  const raw = await frappeCall<unknown>("agency.my_join_requests", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => {
    const data = camelizeKeys(item) as Record<string, unknown>;
    const status = String(data["status"] ?? "Pending");
    const rejectionReason = data["rejectionReason"] as string | undefined;
    return {
      id: String(data["name"] ?? data["id"] ?? ""),
      agencyName: String(data["agencyName"] ?? ""),
      status: status === "Approved" || status === "Rejected" ? status : "Pending",
      requestedAt: String(data["creation"] ?? data["requestedAt"] ?? ""),
      ...(rejectionReason ? { rejectionReason } : {}),
    };
  });
}

export async function approveJoinRequest(requestId: string): Promise<{ status: string }> {
  const raw = await frappeCall<unknown>("agency.approve_join_request", {
    request_name: requestId,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { status: String(data["status"] ?? "Approved") };
}

export async function rejectJoinRequest(
  requestId: string,
  reason?: string,
): Promise<{ status: string }> {
  const raw = await frappeCall<unknown>("agency.reject_join_request", {
    request_name: requestId,
    reason,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { status: String(data["status"] ?? "Rejected") };
}
