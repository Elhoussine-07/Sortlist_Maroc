import type { Collaboration, PaginatedResponse } from "@/lib/types";
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

  // BUG CORRIGÉ : `client.list_collaborations` groupe les lignes PAR AGENCE
  // (`{agency, agency_name, projects: [...]}`) — aucune des clés `id`/`name`/
  // `project` n'existe au niveau racine, seulement imbriquée dans `projects`.
  // `id` retombait donc toujours sur "" (chaîne vide), envoyée telle quelle
  // comme `project` à `review.submit_agency_review` → 417 "Projet manquant"
  // à chaque tentative d'avis. On retombe sur le premier projet de la
  // collaboration (le seul identifiant de Project réellement disponible ici).
  const projects = Array.isArray(data["projects"])
    ? (data["projects"] as Record<string, unknown>[])
    : [];
  const firstProjectId = projects[0]?.["project"];

  // BUG CORRIGÉ : `client.list_collaborations` n'interrogeait jamais
  // `AgencyReview` — `publicReview` retombait donc toujours sur "" côté
  // frontend, quel que soit l'avis réellement envoyé, et les onglets "Avis
  // publiés"/"Avis à publier" (cf. client.collaborations.tsx, filtrés sur
  // `publicReview.length`) ne reflétaient jamais l'état réel. Le backend
  // renvoie désormais un objet `review` (dernier avis du client pour cette
  // agence, s'il existe) — utilisé en priorité ici.
  const review = (data["review"] ?? null) as Record<string, unknown> | null;
  const reviewComment = review ? String(review["comment"] ?? "") : "";

  return {
    id: String(
      data["id"] ?? data["name"] ?? data["project"] ?? review?.["project"] ?? firstProjectId ?? "",
    ),
    agencyInitials: String(data["agencyInitials"] ?? initials),
    agencyName,
    agencyTagline: String(data["agencyTagline"] ?? data["slogan"] ?? ""),
    ratingReceived: Number(data["ratingReceived"] ?? data["rating"] ?? 0),
    finishedProjects: String(data["finishedProjects"] ?? data["finishedProjectsCount"] ?? ""),
    period: String(data["period"] ?? ""),
    budget: String(data["budget"] ?? ""),
    publicReview: reviewComment || String(data["publicReview"] ?? data["comment"] ?? ""),
    reviewLength: Number(
      data["reviewLength"] ??
        (reviewComment || String(data["publicReview"] ?? data["comment"] ?? "")).length,
    ),
    yourRating: Number(review?.["rating"] ?? data["yourRating"] ?? data["rating"] ?? 0),
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
