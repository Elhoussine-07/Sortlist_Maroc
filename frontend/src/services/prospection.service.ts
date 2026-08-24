import { camelizeKeys, frappeCall, restCall } from "@/services/http";

/** Service Prospection IA — microservice `prospection-service` via le Gateway. */

const VISITOR_SESSION_KEY = "sortlist_visitor_session_id";

/**
 * Identifiant de session visiteur, stable pour tout le passage sur le site
 * (localStorage) — requis par `POST /api/prospection/track` (cf.
 * `prospection-service/src/routes/prospection.js`) pour cumuler le score
 * d'un même visiteur sur sa fenêtre glissante (`window_days`, §2.6.1).
 */
function visitorSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(VISITOR_SESSION_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_SESSION_KEY, generated);
    return generated;
  } catch {
    return `visitor-${Date.now()}`;
  }
}

export type ProspectionTrackAction =
  "profile" | "portfolio" | "reviews" | "team" | "certifications" | "services" | "favorite";

/**
 * // API CALL : restCall('prospection', '/track', { method: 'POST', body: { agency, session_id, action, duration_seconds, count } })
 * Signal de prospection (§2.6, MUST) déclenché depuis le profil public d'une
 * agence — jusqu'ici jamais appelé nulle part côté frontend, ce qui laissait
 * la table `leads` de prospection-service en permanence vide (d'où le
 * dashboard "Prospection IA" systématiquement vide côté agence, quelle que
 * soit l'activité réelle des visiteurs). Non bloquant : un échec (service
 * indisponible, etc.) ne doit jamais casser la navigation du visiteur sur le
 * profil public, d'où le `.catch` silencieux à l'appel.
 */
export async function trackProspectionSignal(
  agency: string,
  action: ProspectionTrackAction,
  context?: {
    durationSeconds?: number | undefined;
    count?: number | undefined;
    clientEmail?: string | undefined;
    clientName?: string | undefined;
  },
): Promise<void> {
  if (!agency) return;
  await restCall<unknown>("prospection", "/track", {
    method: "POST",
    body: {
      agency,
      session_id: visitorSessionId(),
      action,
      duration_seconds: context?.durationSeconds,
      count: context?.count,
      // Identifie le prospect quand le visiteur est un client connecté (cf.
      // /track dans prospection-service, colonnes `leads.client_email`/
      // `client_name`) — permet à l'agence de voir QUI a été détecté
      // (nom affiché) sans jamais exposer de coordonnées de contact.
      client_email: context?.clientEmail,
      client_name: context?.clientName,
    },
  });
}

export type LeadTemperature = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  initials: string;
  companyName: string;
  location: string;
  ipAddress: string;
  actions: string[];
  temperature: LeadTemperature;
  temperatureLabel: string;
  score: number;
  /** Présent seulement si le visiteur était un client connecté au moment du tracking. */
  clientEmail: string | null;
  /** Nom affiché du client identifié (jamais son email/téléphone dans l'UI agence). */
  clientName: string | null;
  /**
   * Nombre de sessions distinctes fusionnées sous ce prospect (cf.
   * `prospection.js::mergeLeadsByClientIdentity`) — un même client identifié
   * revenant plusieurs fois (navigation privée, navigateur différent...)
   * n'apparaît plus comme plusieurs prospects séparés. Toujours 1 pour un
   * visiteur non identifié (pas d'identité fiable pour fusionner).
   */
  sessionCount: number;
}

const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  hot: "Chaud",
  warm: "Tiède",
  cold: "Froid",
};

function mapTemperature(raw: unknown): LeadTemperature {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value === "hot" || value === "chaud") return "hot";
  if (value === "warm" || value === "tiède" || value === "tiede") return "warm";
  return "cold";
}

function mapLead(raw: unknown): Lead {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const companyName = String(data["companyName"] ?? "");
  const temperature = mapTemperature(data["classification"] ?? data["temperature"]);

  return {
    id: String(data["id"] ?? ""),
    initials: String(
      data["initials"] ??
        companyName
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join(""),
    ),
    companyName,
    location: String(data["location"] ?? ""),
    ipAddress: String(data["ipAddress"] ?? ""),
    actions: Array.isArray(data["actions"]) ? (data["actions"] as string[]) : [],
    temperature,
    temperatureLabel: String(data["temperatureLabel"] ?? TEMPERATURE_LABELS[temperature]),
    // BUG CORRIGÉ : lisait `data["score"]`, une clé que le backend n'a
    // jamais renvoyée (il renvoie `cumulative_score` -> `cumulativeScore`
    // après camelCase) — le score affiché était donc TOUJOURS 0, quel que
    // soit le score réel du lead (visible par ex. quand la température
    // était "Chaud" via le signal "Ajout aux favoris" mais le score à 0).
    score: Number(data["cumulativeScore"] ?? 0),
    clientEmail: (data["clientEmail"] as string | null | undefined) || null,
    clientName: (data["clientName"] as string | null | undefined) || null,
    sessionCount: Number(data["sessionCount"] ?? 1),
  };
}

/**
 * // API CALL : restCall('prospection', '/leads', { method: 'GET', query: { classification, from, to } })
 * `from`/`to` filtrent sur `leads.last_seen_at` côté backend (ISO 8601,
 * bornes inclusives) — permet à l'agence de restreindre le suivi à une
 * période donnée plutôt que de voir l'historique complet mélangé. Les
 * compteurs par température sont dérivés côté client (pas de `counters`
 * confirmé dans la réponse brute).
 */
export async function getLeads(params?: {
  page?: number;
  pageSize?: number;
  temperature?: LeadTemperature;
  /** Borne basse (incluse), ISO 8601 — ex. sortie d'un `<input type="datetime-local">`. */
  from?: string;
  /** Borne haute (incluse), ISO 8601. */
  to?: string;
}): Promise<{
  items: Lead[];
  counters: {
    hot: number;
    warm: number;
    cold: number;
    hotDelta: number;
    warmDelta: number;
    coldDelta: number;
  };
  hasMore: boolean;
}> {
  const raw = await restCall<unknown>("prospection", "/leads", {
    method: "GET",
    query: {
      // BUG CORRIGÉ : `/leads` (prospection-service) n'accepte que les
      // libellés français exacts ("Chaud"/"Tiède"/"Froid", cf.
      // routes/prospection.js) — envoyer la valeur anglaise brute
      // ("hot"/"warm"/"cold") faisait échouer la requête en 400 dès qu'un
      // onglet de température autre que "Tous" était sélectionné.
      classification: params?.temperature ? TEMPERATURE_LABELS[params.temperature] : undefined,
      page: params?.page,
      page_size: params?.pageSize,
      from: params?.from,
      to: params?.to,
    },
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const list = (
    Array.isArray(raw) ? raw : (data["leads"] ?? data["items"] ?? data["results"] ?? [])
  ) as unknown[];
  const items = list.map((item) => mapLead(item));

  const counters = {
    hot: items.filter((item) => item.temperature === "hot").length,
    warm: items.filter((item) => item.temperature === "warm").length,
    cold: items.filter((item) => item.temperature === "cold").length,
    hotDelta: 0,
    warmDelta: 0,
    coldDelta: 0,
  };

  return {
    items,
    counters,
    hasMore: Boolean(data["hasMore"] ?? false),
  };
}

/**
 * // API CALL : restCall('prospection', `/leads/${leadId}/generate-email`, { method: 'POST' })
 */
export async function generateProspectionEmail(
  leadId: string,
): Promise<{ subject: string; body: string }> {
  const raw = await restCall<unknown>("prospection", `/leads/${leadId}/generate-email`, {
    method: "POST",
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const draft = (data["draft"] ?? data) as Record<string, unknown>;
  return {
    subject: String(draft["subject"] ?? ""),
    body: String(draft["body"] ?? ""),
  };
}

/**
 * // API CALL : restCall('prospection', `/leads/${leadId}/send-email`, { method: 'POST', body: { subject, body } })
 * Envoie l'e-mail de prospection généré (ou édité) par l'agence à un lead.
 * Endpoint microservice ajouté par un autre agent en parallèle sur
 * `prospection-service` (non vérifiable depuis ce workspace) — voir consigne.
 */
export async function sendProspectionEmail(
  leadId: string,
  payload: { subject: string; body: string },
): Promise<{ sent: boolean }> {
  const raw = await restCall<unknown>("prospection", `/leads/${leadId}/send-email`, {
    method: "POST",
    body: payload,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { sent: Boolean(data["sent"] ?? true) };
}

export interface ProspectionSettings {
  scoring: {
    hotMin: number;
    warmMin: number;
  };
}

/**
 * // API CALL : frappeCall("prospection.get_scoring_rules_for_agency", {})
 * Lecture seule (CDC §2.6.1 : "Le barème doit rester configurable depuis
 * l'espace Admin plutôt que codé en dur") — l'agence consulte le barème
 * mais ne peut pas le modifier ; seul un Modérateur/Admin le peut, via
 * `prospection.update_scoring_rules` (hors périmètre de ce dashboard
 * Agence/Client). La précédente implémentation appelait
 * `prospection.get_scoring_rules`, qui exige un jeton de service interne
 * (X-Internal-Token) jamais envoyé par le frontend : cet appel échouait
 * systématiquement (401) pour un utilisateur réel.
 */
export async function getProspectionSettings(): Promise<ProspectionSettings> {
  const raw = await frappeCall<unknown>("prospection.get_scoring_rules_for_agency", {});
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const thresholds = (data["thresholds"] ?? {}) as Record<string, unknown>;
  return {
    scoring: {
      hotMin: Number(thresholds["hot"] ?? 40),
      warmMin: Number(thresholds["warmMin"] ?? 15),
    },
  };
}

export interface ClientReviewAboutLead {
  agency: string;
  agencyName: string;
  project: string;
  rating: number;
  comment: string;
  publishedAt: string;
}

export interface IdentifiedClientProfile {
  id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  sector: string;
  country: string;
  trustScore: number;
  legalIdVerified: boolean;
  reviews: ClientReviewAboutLead[];
}

/**
 * // API CALL : frappeCall("client.get_client_profile_for_agency", { client })
 * Un lead n'est identifié (cf. `Lead.clientEmail`) que si le visiteur était
 * connecté en tant que client au moment du tracking — on ne tente jamais de
 * deviner une identité à partir du nom/domaine d'entreprise détecté par IP
 * (trop peu fiable pour envoyer un email ou afficher des avis nominatifs).
 *
 * Volontairement AUCUNE coordonnée de contact (email/téléphone) dans la
 * réponse — l'agence voit qui a été détecté (nom, secteur, score de
 * confiance, avis) mais ne peut pas le contacter en dehors de la
 * plateforme ; l'envoi réel de l'e-mail reste géré côté serveur
 * (cf. sendProspectionEmail).
 */
export async function getClientProfileForAgency(client: string): Promise<IdentifiedClientProfile> {
  const raw = await frappeCall<unknown>("client.get_client_profile_for_agency", { client });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const reviews = (Array.isArray(data["reviews"]) ? data["reviews"] : []) as unknown[];
  return {
    id: String(data["name"] ?? ""),
    companyName: String(data["companyName"] ?? ""),
    firstName: String(data["firstName"] ?? ""),
    lastName: String(data["lastName"] ?? ""),
    sector: String(data["sector"] ?? ""),
    country: String(data["country"] ?? ""),
    trustScore: Number(data["trustScore"] ?? 0),
    legalIdVerified: Boolean(data["legalIdVerified"] ?? false),
    reviews: reviews.map((item) => {
      const r = camelizeKeys(item) as Record<string, unknown>;
      return {
        agency: String(r["agency"] ?? ""),
        agencyName: String(r["agencyName"] ?? ""),
        project: String(r["project"] ?? ""),
        rating: Number(r["rating"] ?? 0),
        comment: String(r["comment"] ?? ""),
        publishedAt: String(r["creation"] ?? ""),
      };
    }),
  };
}

export interface LeadActivityEntry {
  action: string;
  durationSeconds: number | null;
  itemCount: number | null;
  points: number;
  occurredAt: string;
}

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  "Consultation du profil": "Profil",
  "Consultation portfolio": "Portfolio",
  "Consultation prestations": "Prestations",
  "Consultation certifications": "Certificats",
  "Consultation équipe": "Équipe",
  "Consultation avis": "Avis",
  "Ajout aux favoris": "Contact / candidature",
};

export function activityActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] ?? action;
}

/**
 * // API CALL : restCall('prospection', `/leads/${leadId}/activity`, { method: 'GET' })
 * Détail chronologique des visites d'un lead (§2.6 : "suivi des mouvements
 * du client sur le profil agence") — combien de temps il a passé sur
 * chaque section, pas seulement un score agrégé.
 */
export async function getLeadActivity(leadId: string): Promise<LeadActivityEntry[]> {
  const raw = await restCall<unknown>("prospection", `/leads/${leadId}/activity`, {
    method: "GET",
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const list = (Array.isArray(data["visits"]) ? data["visits"] : []) as unknown[];
  return list.map((item) => {
    const v = camelizeKeys(item) as Record<string, unknown>;
    return {
      action: String(v["action"] ?? ""),
      durationSeconds:
        v["durationSeconds"] !== null && v["durationSeconds"] !== undefined
          ? Number(v["durationSeconds"])
          : null,
      itemCount:
        v["itemCount"] !== null && v["itemCount"] !== undefined ? Number(v["itemCount"]) : null,
      points: Number(v["points"] ?? 0),
      occurredAt: String(v["createdAt"] ?? ""),
    };
  });
}
