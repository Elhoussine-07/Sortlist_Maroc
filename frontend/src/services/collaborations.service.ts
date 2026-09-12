import type { Collaboration, CollaborationProjectReview, PaginatedResponse } from "@/lib/types";
import { camelizeKeys, frappeCall } from "@/services/http";

export interface CollaborationSearchParams {
  query?: string;
  agency?: string;
  period?: string;
  rating?: string;
  sort?: "recent" | "rating" | "budget";
  page?: number;
  pageSize?: number;
}

export function mapCollaboration(raw: unknown): Collaboration {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const agencyName = String(data["agencyName"] ?? data["agency"] ?? "");
  const initials = agencyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const rawProjects = Array.isArray(data["projects"])
    ? (data["projects"] as Record<string, unknown>[])
    : [];
  const projects: CollaborationProjectReview[] = rawProjects.map((row) => {
    const projectReview = (row["review"] ?? null) as Record<string, unknown> | null;
    const ratingReceivedRaw = row["ratingReceived"];
    return {
      id: String(row["project"] ?? ""),
      title: String(row["title"] ?? ""),
      period: String(row["period"] ?? ""),
      startDate: (row["startDate"] as string | null | undefined) ?? null,
      endDate: (row["expectedEndDate"] as string | null | undefined) ?? null,
      budgetMin:
        row["budgetMin"] !== undefined && row["budgetMin"] !== null
          ? Number(row["budgetMin"])
          : null,
      budgetMax:
        row["budgetMax"] !== undefined && row["budgetMax"] !== null
          ? Number(row["budgetMax"])
          : null,
      reviewed: projectReview !== null,
      yourRating: Number(projectReview?.["rating"] ?? 0),
      yourComment: String(projectReview?.["comment"] ?? ""),
      ratingReceived:
        ratingReceivedRaw !== undefined && ratingReceivedRaw !== null
          ? Number(ratingReceivedRaw)
          : null,
    };
  });

  const review = (data["review"] ?? null) as Record<string, unknown> | null;
  const reviewComment = review ? String(review["comment"] ?? "") : "";
  const budgetRaw = data["budget"];

  return {
    id: String(data["agency"] ?? data["id"] ?? data["name"] ?? ""),
    agencyInitials: String(data["agencyInitials"] ?? initials),
    agencyName,
    agencyTagline: String(data["agencyTagline"] ?? data["slogan"] ?? ""),
    ratingReceived: Number(data["ratingReceived"] ?? 0),
    finishedProjects: String(data["finishedProjectsCount"] ?? projects.length),
    period: String(data["period"] ?? ""),
    budget: budgetRaw !== undefined && budgetRaw !== null ? `${Number(budgetRaw)} €` : "",
    publicReview: reviewComment,
    reviewLength: reviewComment.length,
    yourRating: Number(review?.["rating"] ?? 0),
    projects,
  };
}

export async function getCollaborations(
  params?: CollaborationSearchParams,
): Promise<PaginatedResponse<Collaboration>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const raw = await frappeCall<unknown>("client.list_collaborations", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  const items = list.map((item) => mapCollaboration(item));

  return {
    items,
    page,
    pageSize,
    total: items.length,
    totalPages: 1,
  };
}

export async function getCollaboration(id: string): Promise<Collaboration> {
  const detail = await getCollaborationDetail(id);
  const agency = detail.agency;
  const agencyName = String(agency["agencyName"] ?? agency["name"] ?? "");
  const initials = agencyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return {
    id,
    agencyInitials: String(agency["agencyInitials"] ?? initials),
    agencyName,
    agencyTagline: String(agency["slogan"] ?? agency["agencyTagline"] ?? ""),
    ratingReceived: Number(agency["rating"] ?? 0),
    finishedProjects: String(detail.projects.length),
    period: String(agency["period"] ?? ""),
    budget: String(agency["budget"] ?? ""),
    publicReview: detail.review?.comment ?? "",
    reviewLength: detail.review?.comment.length ?? 0,
    yourRating: detail.review?.rating ?? 0,
    projects: [],
  };
}

export interface CollaborationDetail {
  agency: Record<string, unknown>;
  projects: unknown[];
  review: { rating: number; comment: string } | null;
}

export async function getCollaborationDetail(id: string): Promise<CollaborationDetail> {
  const raw = await frappeCall<unknown>("client.get_collaboration", { collaboration_id: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const review = data["review"] as Record<string, unknown> | null;
  return {
    agency: (data["agency"] ?? {}) as Record<string, unknown>,
    projects: Array.isArray(data["projects"]) ? (data["projects"] as unknown[]) : [],
    review: review
      ? { rating: Number(review["rating"] ?? 0), comment: String(review["comment"] ?? "") }
      : null,
  };
}

export async function submitCollaborationReview(
  id: string,
  payload: { rating: number; publicReview: string },
): Promise<Collaboration> {
  const raw = await frappeCall<unknown>("review.submit_agency_review", {
    project: id,
    rating: payload.rating,
    comment: payload.publicReview,
  });
  return mapCollaboration(raw);
}
