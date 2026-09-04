import type { Opportunity, PaginatedResponse, Project } from "@/lib/types";
import { camelizeKeys, fetchBlob, frappeCall, GATEWAY_URL } from "@/services/http";
import { mapProject } from "@/services/projects.service";

/** Service opportunités (côté Agence). */

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

/**
 * Traduit les compteurs par onglet renvoyés par le backend (clés en
 * français, `opportunity.py::_tab_counts` / `TAB_STATUS`) vers les clés
 * anglaises utilisées par `TABS` (`agence.opportunites.tsx`). "all" reprend
 * le compteur "Offres" : l'onglet "Toutes" n'a pas d'équivalent backend
 * dédié (cf. `tabToOpportunityTab`), il pointe vers le même tab.
 */
function mapCounts(raw: unknown): Record<string, number> {
  const data = (raw ?? {}) as Record<string, unknown>;
  const counts: Record<string, number> = {};
  for (const [englishKey, frenchKey] of Object.entries(TAB_TO_BACKEND)) {
    counts[englishKey] = Number(data[frenchKey] ?? 0);
  }
  counts["all"] = counts["offers"] ?? 0;
  return counts;
}

/**
 * Traduit une `Opportunity` Frappe (snake_case) vers le type `Opportunity`
 * (camelCase) du frontend. `list_opportunities` imbrique les champs du
 * projet sous `project` (cf. `opportunity.py`, commentaire "MODIFICATION
 * ICI") — BUG CORRIGÉ : ce mapping les lisait auparavant à plat
 * (`data["title"]`, `data["budgetMin"]`...), qui n'existaient jamais à ce
 * niveau ; toutes les colonnes Projet (titre, budget, localisation,
 * catégorie) s'affichaient donc vides dès qu'une opportunité existait
 * réellement.
 */
function mapOpportunity(raw: unknown): Opportunity {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const project = (data["project"] ?? {}) as Record<string, unknown>;
  const rawStatus = data["status"] !== undefined ? String(data["status"]) : undefined;
  const step = mapStepFromStatus(data["status"]);
  // BUG CORRIGÉ : le backend (`opportunity.list_opportunities`) renvoie le
  // nom lisible du client dans `project.partnerAgencyName` (résolu côté
  // serveur via `_client_display_name`, cf. commentaire backend) — jamais
  // dans `clientName`, qui n'existe nulle part dans la réponse. companyName
  // retombait donc toujours sur "" et l'UI affichait le mot générique
  // "Client" à la place du vrai nom, pour toute opportunité.
  const companyName = String(
    data["companyName"] ?? data["clientName"] ?? project["partnerAgencyName"] ?? "",
  );

  return {
    id: String(data["id"] ?? data["name"] ?? data["opportunity"] ?? ""),
    step,
    // BUG CORRIGÉ : `STEP_LABELS[step]` ne couvre que les libellés d'onglet
    // ("offers"→"Nouvelle offre", etc.), pas les sous-statuts réels d'une
    // Opportunity "Acceptée"/"Devis envoyé" au sein de l'onglet "Toutes" —
    // `mapStepFromStatus` retombait alors sur le statut brut en minuscules
    // par accident. `rawStatus` (le vrai libellé backend) est prioritaire.
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

/**
 * Onglet "Disponibles" (CDC §2.3) : `list_available_projects` renvoie des
 * PROJETS bruts (pas encore d'Opportunity — c'est justement le principe de
 * cet onglet), forme différente de `mapOpportunity`. `id` porte l'ID du
 * PROJET (pas d'opportunité tant que l'agence n'a pas manifesté son
 * intérêt, cf. `expressInterest` ci-dessous).
 * BUG CORRIGÉ : le nom du client (`clientName`, résolu côté backend via
 * `_client_display_name`) n'était pas encore renvoyé par
 * `list_available_projects` — cet onglet affichait donc toujours le mot
 * générique "Client" côté UI, contrairement aux autres onglets déjà
 * corrigés (cf. `mapOpportunity` ci-dessus).
 */
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

/**
 * L'onglet "Disponibles" (CDC §2.3) n'a PAS d'Opportunity — appeler
 * `list_opportunities` pour ce tab échouait toujours ("Onglet inconnu",
 * absent de `TAB_STATUS`) et de toute façon cette fonction ne peut
 * structurellement pas renvoyer des projets sans Opportunity (elle fait un
 * INNER JOIN dessus). BUG CORRIGÉ : le vrai endpoint pour cet onglet,
 * `opportunity.list_available_projects`, existait déjà côté backend mais
 * n'était jamais appelé depuis cette page — "Disponibles" affichait donc
 * "0" en permanence quel que soit le nombre de projets réellement postulés.
 *
 * // API CALL : frappeCall("opportunity.list_opportunities", { tab, budget_min, budget_max, location, sub_category, need_type })
 * // API CALL : frappeCall("opportunity.list_available_projects", { budget_min, budget_max, location, sub_category, need_type })
 */
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

/**
 * // API CALL : frappeCall("opportunity.express_interest", { project })
 * Depuis l'onglet "Disponibles" : manifeste l'intérêt de l'agence pour un
 * projet public — crée l'Opportunity et l'accepte en un clic (équivalent
 * à "Accepter" pour une offre reçue normalement, cf. `express_interest`
 * côté backend).
 */
export async function expressInterest(projectId: string): Promise<{ id: string }> {
  if (!projectId) {
    // BUG CORRIGÉ : un appel avec un id vide/undefined faisait `JSON.stringify`
    // omettre la clé "project" du corps de la requête, ce que le backend
    // remontait comme un TypeError brut ("missing 1 required positional
    // argument") au lieu d'une erreur exploitable côté UI.
    throw new Error("Identifiant de projet manquant — impossible de postuler.");
  }
  const raw = await frappeCall<unknown>("opportunity.express_interest", { project: projectId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { id: String(data["id"] ?? data["name"] ?? "") };
}

/**
 * // API CALL : frappeCall("opportunity.accept", { opportunity: id })   (étape 1/2)
 */
export async function acceptOpportunity(id: string): Promise<{ status: string }> {
  // BUG CORRIGÉ (même classe que expressInterest ci-dessus) : un id vide/
  // undefined fait omettre la clé "opportunity" du JSON envoyé
  // (JSON.stringify élague les valeurs undefined), et le backend
  // (`api.opportunity.accept(opportunity)`) remonte alors un TypeError
  // Python brut ("missing 1 required positional argument: 'opportunity'")
  // au lieu d'une erreur exploitable côté UI.
  if (!id) {
    throw new Error("Identifiant d'opportunité manquant — impossible d'accepter.");
  }
  const raw = await frappeCall<unknown>("opportunity.accept", { opportunity: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { status: String(data["status"] ?? "accepted_awaiting_quote") };
}

/**
 * // API CALL : frappeCall("opportunity.decline", { opportunity: id })
 */
export async function refuseOpportunity(id: string): Promise<{ status: string }> {
  if (!id) {
    throw new Error("Identifiant d'opportunité manquant — impossible de refuser.");
  }
  const raw = await frappeCall<unknown>("opportunity.decline", { opportunity: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { status: String(data["status"] ?? "refused") };
}

/**
 * // API CALL : frappeCall("opportunity.send_quote", { opportunity: id, amount })   (étape 2/2)
 */
export async function sendQuote(
  id: string,
  amount: number,
): Promise<{ status: string; clientResponseDeadlineHours: number }> {
  if (!id) {
    throw new Error("Identifiant d'opportunité manquant — impossible d'envoyer le devis.");
  }
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    // BUG CORRIGÉ : `amount` non défini/NaN est, comme `id`, élagué par
    // JSON.stringify — le backend renvoyait alors le TypeError Python brut
    // ("missing 2 required positional arguments: 'opportunity' and
    // 'amount'") au lieu d'un message exploitable. La validation dans
    // `agence.opportunites.tsx::onConfirm` ne protège que CE point d'entrée
    // précis ; ce garde-fou rend `sendQuote` sûr quel que soit l'appelant.
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

/**
 * // API CALL : frappeCall("opportunity.view_cdc", { opportunity: id })
 */
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

/**
 * // API CALL : frappeCall("opportunity.download_cdc", { opportunity: id }) — GET, réponse binaire
 * Contrairement à `getOpportunityCdc` (qui renvoie l'URL Frappe
 * `/private/files/...`, protégée par les permissions natives Frappe sur
 * `Project` — que l'agence n'a jamais, seul le client propriétaire les a),
 * cet appel sert directement le contenu du PDF via un endpoint qui fait sa
 * propre autorisation (agence propriétaire de l'Opportunity).
 */
export async function downloadOpportunityCdc(id: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.opportunity.download_cdc`;
  // POST + corps JSON plutôt que GET + query string : cf. `fetchBlob` pour
  // le pourquoi (paramètre "opportunity" jamais arrivé côté backend en GET
  // sur cette installation — 417 "Opportunité manquante").
  return fetchBlob(url, undefined, { opportunity: id });
}
