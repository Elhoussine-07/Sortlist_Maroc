import type { PaginatedResponse, Project, ProjectStatus } from "@/lib/types";
import { camelizeKeys, fetchBlob, frappeCall, GATEWAY_URL } from "@/services/http";

/** Service projets (côté Client, + mapping partagé avec agence). */

export interface ProjectSearchParams {
  query?: string;
  category?: string;
  subCategory?: string;
  budget?: string;
  sort?: "recent" | "relevance";
  page?: number;
  pageSize?: number;
  /** Filtre de statut, utilisé par `getMyProjects`. */
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

/**
 * Traduit un doctype Frappe `Project` (snake_case) vers le type `Project`
 * (camelCase) du frontend. Les champs sans équivalent direct dans les
 * champs "historiques" (reference, statusLabel, lastActivity, ...) sont
 * approximés au mieux — voir les champs additionnels ajoutés à `Project`
 * dans `lib/types.ts` pour les vraies valeurs backend brutes.
 * // TODO backend: `reference`/`lastActivity`/`features`/`constraints` n'ont pas
 * // d'équivalent identifié côté doctype Project — laissés en best-effort/vide.
 */
export function mapProject(raw: unknown): Project {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const status = mapProjectStatus(data["status"]);

  return {
    // Lists exposed by Frappe's opportunity API alias the Project primary key
    // as `project`; direct Project endpoints use `name`.
    id: String(data["id"] ?? data["name"] ?? data["project"] ?? ""),
    reference: String(data["reference"] ?? data["name"] ?? data["project"] ?? ""),
    title: String(data["title"] ?? ""),
    // `category`/`subCategory` sont des liens Frappe (identifiants
    // `ServiceCategory`/`ServiceSubCategory`), pas des libellés — préfère le
    // nom lisible renvoyé en plus par `project.my_projects`
    // (`category_name`) quand disponible, plutôt que d'afficher l'ID brut.
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
    objective: String(data["description"] ?? data["objective"] ?? ""),
    features: Array.isArray(data["features"]) ? (data["features"] as string[]) : [],
    constraints: Array.isArray(data["constraints"]) ? (data["constraints"] as string[]) : [],
    // BUG CORRIGÉ : `deadline` n'a jamais d'équivalent "deadline" côté
    // backend (aucun champ de ce nom) — toujours vide ("—" côté UI). La
    // vraie échéance du projet est `expected_end_date` (déjà recalculée
    // pour intégrer les jours de suspension cumulés).
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
  };
}

function mapProjectList(raw: unknown): unknown[] {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  if (Array.isArray(raw)) return raw;
  return (data["results"] ?? data["items"] ?? []) as unknown[];
}

/**
 * // API CALL : frappeCall("project.my_projects", { status: params?.status })
 */
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

/**
 * // API CALL : frappeCall("project.get_project", { project: id })
 */
export async function getProject(id: string): Promise<Project> {
  const raw = await frappeCall<unknown>("project.get_project", { project: id });
  return mapProject(raw);
}

/**
 * // TODO backend: pas d'endpoint dédié "recherche projets publics" côté client.
 * // Le seul endpoint proche trouvé est `opportunity.list_available_projects`,
 * // qui liste les projets disponibles côté AGENCE (Actions rapides). La
 * // recherche publique de projets par un client n'a pas vraiment de sens
 * // fonctionnel dans le CDC (un client voit ses propres projets, pas un
 * // catalogue public) — cette fonction reste donc probablement inutilisée côté
 * // client. On mappe en attendant vers `opportunity.list_available_projects`
 * // pour ne pas planter si elle est appelée, à confirmer/retirer avec le CDC.
 */
export async function searchProjects(
  params: ProjectSearchParams,
): Promise<PaginatedResponse<Project> & { availableCount: number }> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const budgetParts = (params.budget ?? "").split("-").map((value) => value.trim());
  const budgetMin = budgetParts[0] || undefined;
  const budgetMax = budgetParts[1] || (budgetParts.length === 1 ? budgetParts[0] : undefined);
  // Public (page /projets, sans connexion) — `list_available_projects` est
  // réservé aux comptes Agence (`require_active_agency`) et renvoyait 401
  // pour tout invité, déclenchant la redirection globale vers /connexion
  // (`http.ts::handleUnauthorized`) avant même l'affichage de la liste.
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

/**
 * `BRIEF_FIELDS` côté backend (`platform_core/platform_core/api/project.py`)
 * est une liste blanche EN SNAKE_CASE (`need_type`, `sub_category`,
 * `budget_min`, `budget_max`, `delivery_delay_days`, ...) filtrée via
 * `**fields` par `quick_actions.start_contact`/`project.update_brief`. Les
 * versions précédentes de `createProject`/`saveProjectDraft` étalaient le
 * payload camelCase tel quel (`...body`) : chaque champ (`budgetMin`,
 * `subCategory`, ...) ne matchait donc AUCUNE clé de la liste blanche et
 * était silencieusement ignoré côté serveur — seul `need_type` passait. Un
 * appelant réel (`SmartBriefing.tsx::handleSaveDraft`) dépendant de ces
 * fonctions, corrigé ici en convertissant explicitement vers snake_case.
 */
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

/**
 * Pas de fonction `create_draft` whitelisted trouvée côté backend (existe en
 * interne, non exposée). On mappe vers `quick_actions.start_contact`, qui crée
 * un Project en Draft à partir d'un besoin exprimé rapidement (Actions rapides).
 * // TODO backend: si le payload provient du Smart Briefing IA, préférer plutôt
 * // `briefing.service.ts::generateCdcPdf` (`ia-service` -> `briefing.confirm`),
 * // qui crée le projet ET génère le CDC en une fois — mais poste aussi
 * // immédiatement le projet (voir le commentaire détaillé dans ce fichier),
 * // ce que `createProject` ne fait pas (reste en `Draft`). Utilisé par
 * // `SmartBriefing.tsx::handleSaveDraft` quand aucun projet n'existe encore.
 */
export async function createProject(payload: unknown): Promise<Project> {
  const body = toBriefFieldsPayload(payload as Record<string, unknown>);
  const raw = await frappeCall<unknown>("quick_actions.start_contact", {
    need_type: body["need_type"] ?? "Projet",
    ...body,
  });
  return mapProject(raw);
}

/**
 * // API CALL : frappeCall("project.update_brief", { project: id, ...payload })
 */
export async function saveProjectDraft(id: string | null, payload: unknown): Promise<Project> {
  const raw = await frappeCall<unknown>("project.update_brief", {
    project: id,
    ...toBriefFieldsPayload(payload as Record<string, unknown>),
  });
  return mapProject(raw);
}

/**
 * // API CALL : frappeCall("project.post_project", { project: id })
 */
export async function publishProject(id: string): Promise<Project> {
  const raw = await frappeCall<unknown>("project.post_project", { project: id });
  return mapProject(raw);
}

/**
 * // API CALL : frappeCall("project.repost", { project: id, include_previously_declined })
 * CDC §1.5.7 : republication d'un projet Postulé resté sans réaction. Par
 * défaut, les agences ayant déjà explicitement refusé ce projet ne sont pas
 * relancées — `includePreviouslyDeclined` permet de les inclure quand même
 * (option distincte, à activer explicitement par le client).
 */
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

/**
 * // API CALL : frappeCall("project.delete_project", { project: id })
 * CDC §1.5.1 (note C13, v8) : suppression restreinte aux statuts Brouillon
 * et Postulé.
 */
export async function deleteProject(id: string): Promise<Project> {
  const raw = await frappeCall<unknown>("project.delete_project", { project: id });
  return mapProject(raw);
}

/**
 * // API CALL : frappeCall("project.download_cdc", { project: id }) — POST, réponse binaire
 * Comme `proposals.service.ts::downloadDevisPdf` : un fetch direct de
 * `Project.cdcFile` (`/private/files/...`) échoue en 403 pour le client
 * lui-même (la route native Frappe ignore le JWT Bearer de cette
 * installation). Cet endpoint sert le contenu directement, avec sa propre
 * autorisation (client propriétaire du projet).
 */
export async function downloadProjectCdc(id: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.project.download_cdc`;
  return fetchBlob(url, undefined, { project: id });
}

/**
 * Règlement du CLIENT à l'AGENCE pour les frais du projet (le montant de
 * l'offre acceptée) — distinct de la commission plateforme (5%), réglée
 * séparément par l'agence (cf. `invoices.service.ts`).
 *
 * // API CALL : frappeCall("client.pay_agency_for_project", { project, payment_method, provider_token })
 */
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
