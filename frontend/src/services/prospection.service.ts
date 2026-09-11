import { camelizeKeys, frappeCall, restCall } from "@/services/http";

const VISITOR_SESSION_KEY = "sortlist_visitor_session_id";
const VISITOR_SESSION_OWNER_KEY = "sortlist_visitor_session_owner";

function visitorSessionId(clientEmail?: string | undefined): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(VISITOR_SESSION_KEY);
    const existingOwner = window.localStorage.getItem(VISITOR_SESSION_OWNER_KEY);
    const identityChanged =
      Boolean(clientEmail) && Boolean(existingOwner) && existingOwner !== clientEmail;

    if (existing && !identityChanged) {
      if (clientEmail && !existingOwner) {
        window.localStorage.setItem(VISITOR_SESSION_OWNER_KEY, clientEmail);
      }
      return existing;
    }

    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_SESSION_KEY, generated);
    if (clientEmail) {
      window.localStorage.setItem(VISITOR_SESSION_OWNER_KEY, clientEmail);
    } else {
      window.localStorage.removeItem(VISITOR_SESSION_OWNER_KEY);
    }
    return generated;
  } catch {
    return `visitor-${Date.now()}`;
  }
}

export type ProspectionTrackAction =
  "profile" | "portfolio" | "reviews" | "team" | "certifications" | "services" | "favorite";

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
      session_id: visitorSessionId(context?.clientEmail),
      action,
      duration_seconds: context?.durationSeconds,
      count: context?.count,
      client_email: context?.clientEmail,
      client_name: context?.clientName,
    },
  });
}

export async function recordProfileVisit(
  agency: string,
  context?: { clientEmail?: string | undefined; clientName?: string | undefined },
): Promise<void> {
  if (!agency) return;
  await restCall<unknown>("prospection", "/visit", {
    method: "POST",
    body: {
      agency,
      session_id: visitorSessionId(context?.clientEmail),
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
  clientEmail: string | null;
  clientName: string | null;
  sessionCount: number;
  visitCount: number;
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
    score: Number(data["cumulativeScore"] ?? 0),
    clientEmail: (data["clientEmail"] as string | null | undefined) || null,
    clientName: (data["clientName"] as string | null | undefined) || null,
    sessionCount: Number(data["sessionCount"] ?? 1),
    visitCount: Number(data["visitCount"] ?? 1),
  };
}

export async function getLeads(params?: {
  page?: number;
  pageSize?: number;
  temperature?: LeadTemperature;
  from?: string;
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

export async function sendProspectionEmail(
  leadId: string,
  payload: { subject: string; body: string },
): Promise<{ sent: boolean; provider: string; note: string }> {
  const raw = await restCall<unknown>("prospection", `/leads/${leadId}/send-email`, {
    method: "POST",
    body: payload,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    sent: Boolean(data["sent"] ?? false),
    provider: String(data["provider"] ?? "stub"),
    note: String(data["note"] ?? ""),
  };
}

export interface ProspectionSettings {
  scoring: {
    hotMin: number;
    warmMin: number;
  };
}

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
