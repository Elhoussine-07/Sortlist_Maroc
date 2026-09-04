import type {
  AgencyCertificationItem,
  AgencyPortfolioItem,
  AgencyProfile,
  AgencyServiceItem,
  AgencyTeamItem,
  ClientProfile,
  Collaboration,
  Project,
} from "@/lib/types";
import { useAuthStore } from "@/store/auth.store";
import {
  camelizeKeys,
  frappeCall,
  GATEWAY_URL,
  parseCommaList,
  resolveFileUrl,
} from "@/services/http";
import { mapCollaboration } from "@/services/collaborations.service";
import { mapProject } from "@/services/projects.service";

function trustScoreLabelFor(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Moyen";
  return "À améliorer";
}

function mapClientProfile(raw: unknown): ClientProfile {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const trustScore = Number(data["trustScore"] ?? 0);

  return {
    id: String(data["id"] ?? data["name"] ?? ""),
    contactFirstName: String(data["firstName"] ?? data["contactFirstName"] ?? ""),
    contactLastName: String(data["lastName"] ?? data["contactLastName"] ?? ""),
    companyName: String(data["companyName"] ?? ""),
    activitySector: String(data["sector"] ?? data["activitySector"] ?? ""),
    country: String(data["country"] ?? ""),
    legalIdType: String(data["legalIdLabel"] ?? data["legalIdType"] ?? ""),
    legalIdValue: String(data["legalId"] ?? data["legalIdValue"] ?? ""),
    identityVerified: Boolean(data["legalIdVerified"] ?? data["identityVerified"] ?? false),
    identityVerifiedAt: (data["identityVerifiedAt"] as string | undefined) ?? null,
    trustScore,
    trustScoreLabel: String(data["trustScoreLabel"] ?? trustScoreLabelFor(trustScore)),
    trustScoreFactors: Array.isArray(data["trustScoreFactors"])
      ? (data["trustScoreFactors"] as ClientProfile["trustScoreFactors"])
      : [],
    completionPercent: Number(data["profileCompletion"] ?? data["completionPercent"] ?? 0),
    missingFields: Array.isArray(data["missingFields"])
      ? (data["missingFields"] as ClientProfile["missingFields"])
      : [],
    updatedAt: String(data["modified"] ?? data["updatedAt"] ?? ""),
    phone: (data["phone"] as string | undefined) ?? undefined,
    phoneVerified: (data["phoneVerified"] as boolean | undefined) ?? undefined,
    logo: resolveFileUrl(data["logo"] as string | null | undefined) ?? undefined,
    projectsPublishedCount:
      data["projectsPublishedCount"] !== undefined
        ? Number(data["projectsPublishedCount"])
        : undefined,
    responseRate: data["responseRate"] !== undefined ? Number(data["responseRate"]) : undefined,
    accountSeniority: (data["accountSeniority"] as string | undefined) ?? undefined,
  };
}

function mapAgencyProfile(raw: unknown): AgencyProfile {
  const data = camelizeKeys(raw) as Record<string, unknown>;

  return {
    id: String(data["id"] ?? data["name"] ?? ""),
    name: String(data["agencyName"] ?? data["name"] ?? ""),
    description: String(data["description"] ?? ""),
    foundedYear: String(data["yearFounded"] ?? data["foundedYear"] ?? ""),
    teamSize: String(data["teamSize"] ?? ""),
    website: String(data["website"] ?? ""),
    languages: parseCommaList(data["languages"]),
    remoteWork: Boolean(data["remoteWork"] ?? false),
    location: String(data["location"] ?? ""),
    legalIdValue: String(data["legalId"] ?? data["legalIdValue"] ?? ""),
    legalIdValid: Boolean(data["legalIdVerified"] ?? data["legalIdValid"] ?? false),
    techStack: parseCommaList(data["techStack"]),
    skills: parseCommaList(data["skills"]),
    phoneCountryCode: String(data["phoneCountryCode"] ?? ""),
    phone: String(data["phone"] ?? ""),
    email: String(data["email"] ?? ""),
    verificationCode: String(data["verificationCode"] ?? ""),
    address: String(data["address"] ?? data["location"] ?? ""),
    logo: resolveFileUrl(data["logo"] as string | null | undefined),
    slogan: (data["slogan"] as string | undefined) ?? undefined,
    coverImage: resolveFileUrl(data["coverImage"] as string | null | undefined),
    coverage: parseCommaList(data["coverage"]),
    annualRevenue: data["annualRevenue"] !== undefined ? Number(data["annualRevenue"]) : undefined,
    country: (data["country"] as string | undefined) ?? undefined,
    emailVerified: (data["emailVerified"] as boolean | undefined) ?? undefined,
    socialLinks: (data["socialLinks"] as Record<string, string> | undefined) ?? undefined,
    rating: data["rating"] !== undefined ? Number(data["rating"]) : undefined,
    pqiScore: data["pqiScore"] !== undefined ? Number(data["pqiScore"]) : undefined,
    profileCompletion:
      data["profileCompletion"] !== undefined ? Number(data["profileCompletion"]) : undefined,
    reviewsCount: data["reviewsCount"] !== undefined ? Number(data["reviewsCount"]) : undefined,
    services: Array.isArray(data["services"])
      ? (data["services"] as unknown[]).map((row) => row as unknown as AgencyServiceItem)
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
    billingEmail: (data["billingEmail"] as string | undefined) ?? undefined,
    vatNumber: (data["vatNumber"] as string | undefined) ?? undefined,
    billingAddress: (data["billingAddress"] as string | undefined) ?? undefined,
  };
}

export async function getClientProfile(): Promise<ClientProfile> {
  const raw = await frappeCall<unknown>("client.get_profile", {});
  return mapClientProfile(raw);
}

const CLIENT_TOP_LEVEL_FIELD_MAP: Record<string, string> = {
  contactFirstName: "first_name",
  contactLastName: "last_name",
  companyName: "company_name",
  activitySector: "sector",
  country: "country",
  legalIdType: "legal_id_label",
  legalIdValue: "legal_id",
  phone: "phone",
  logo: "logo",
};

export async function updateClientProfile(payload: Partial<ClientProfile>): Promise<ClientProfile> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    body[CLIENT_TOP_LEVEL_FIELD_MAP[key] ?? key] = value;
  }
  const raw = await frappeCall<unknown>("client.update_profile", body);
  return mapClientProfile(raw);
}

export async function verifyClientIdentity(): Promise<{
  verified: boolean;
  expectedFormat: string | null;
  trustScore: number;
}> {
  const raw = await frappeCall<unknown>("client.verify_identity", {});
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    verified: Boolean(data["verified"]),
    expectedFormat: (data["expectedFormat"] as string | undefined) ?? null,
    trustScore: Number(data["trustScore"] ?? 0),
  };
}

export async function getAgencyProfile(): Promise<AgencyProfile> {
  const raw = await frappeCall<unknown>("agency.get_my_profile", {});
  return mapAgencyProfile(raw);
}

const AGENCY_TOP_LEVEL_FIELD_MAP: Record<string, string> = {
  name: "agency_name",
  description: "description",
  foundedYear: "year_founded",
  teamSize: "team_size",
  website: "website",
  languages: "languages",
  skills: "skills",
  techStack: "tech_stack",
  remoteWork: "remote_work",
  location: "location",
  legalIdValue: "legal_id",
  phoneCountryCode: "phone_country_code",
  phone: "phone",
  email: "email",
  address: "address",
  logo: "logo",
  slogan: "slogan",
  coverImage: "cover_image",
  coverage: "coverage",
  annualRevenue: "annual_revenue",
  country: "country",
  billingEmail: "billing_email",
  vatNumber: "vat_number",
  billingAddress: "billing_address",
};

// `languages`/`skills`/`techStack`/`coverage` sont typés `string[]` côté
// frontend mais stockés comme une simple chaîne "a, b, c" côté backend
// (`Small Text`/`Data`) — ce sont les SEULS champs qu'il faut joindre en
// chaîne avant l'envoi.
const STRING_LIST_FIELDS = new Set(["languages", "skills", "techStack", "coverage"]);

export async function updateAgencyProfile(
  payload: Partial<AgencyProfile> | Record<string, unknown>,
): Promise<AgencyProfile> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    // BUG CORRIGÉ : `Array.isArray(value) ? value.join(", ") : value`
    // s'appliquait auparavant à N'IMPORTE QUEL tableau, y compris
    // `services`/`portfolio`/`team`/`certifications` — des tableaux
    // d'OBJETS (lignes de table enfant Frappe), pas de chaînes. Sur ceux-là,
    // `.join(", ")` produisait littéralement la chaîne
    // "[object Object], [object Object]" au lieu des lignes réelles :
    // "Enregistrer les services/le portfolio/l'équipe/les certificats"
    // envoyait alors une valeur inexploitable, et rien ne s'affichait après
    // sauvegarde. On ne joint désormais que les champs réellement typés
    // `string[]` (cf. STRING_LIST_FIELDS) ; les tableaux d'objets partent
    // tels quels en JSON.
    body[AGENCY_TOP_LEVEL_FIELD_MAP[key] ?? key] =
      Array.isArray(value) && STRING_LIST_FIELDS.has(key) ? value.join(", ") : value;
  }
  const raw = await frappeCall<unknown>("agency.update_profile", body);
  return mapAgencyProfile(raw);
}

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("is_private", "0");

  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${GATEWAY_URL}/api/method/frappe.handler.upload_file`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const errorMessage =
      errorPayload["exception"] ??
      errorPayload["message"] ??
      "Erreur lors du téléversement du fichier.";
    throw new Error(
      typeof errorMessage === "string" ? errorMessage : "Erreur lors du téléversement.",
    );
  }

  const data = (await response.json()) as {
    message?: { file_url?: string };
    file_url?: string;
  };
  const fileUrl = data.message?.file_url ?? data.file_url;
  if (!fileUrl) {
    throw new Error("Réponse de téléversement invalide de Frappe.");
  }
  return resolveFileUrl(fileUrl) ?? fileUrl;
}

export async function getCollaborations(): Promise<{ items: Collaboration[] }> {
  const raw = await frappeCall<unknown>("client.list_collaborations", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return { items: list.map((item) => mapCollaboration(item)) };
}

export async function submitCollaborationReview(
  id: string,
  payload: { rating: number; comment: string },
): Promise<Collaboration> {
  const raw = await frappeCall<unknown>("review.submit_agency_review", {
    project: id,
    rating: payload.rating,
    comment: payload.comment,
  });
  return mapCollaboration(raw);
}

export interface ClientDashboard {
  trustScore: { value: number; label: string };
  publishedProjects: { value: number; delta: string };
  /**
   * `value` reste `null` tant que `client.get_dashboard` renvoie
   * `response_rate: null` (échantillon d'Opportunity trop faible sur la
   * fenêtre glissante, cf. `client.py::_agency_acceptance_rate`) — un
   * pourcentage calculé sur 1-2 données n'est pas représentatif.
   * `client.tableau-de-bord.tsx` affiche alors "—" plutôt qu'un chiffre.
   */
  responseRate: { value: number | null; delta: string };
  activeCollaborations: { value: number };
  recentProjects: Project[];
}

export async function getClientDashboard(): Promise<ClientDashboard> {
  const raw = await frappeCall<unknown>("client.get_dashboard", {});
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const trustScore = Number(data["trustScore"] ?? 0);
  const recentProjectsList = Array.isArray(data["recentProjects"])
    ? (data["recentProjects"] as unknown[])
    : [];
  const responseRateRaw = data["responseRate"];

  return {
    trustScore: { value: trustScore, label: trustScoreLabelFor(trustScore) },
    publishedProjects: { value: Number(data["projectsPublishedCount"] ?? 0), delta: "0%" },
    responseRate: {
      value:
        responseRateRaw === null || responseRateRaw === undefined ? null : Number(responseRateRaw),
      delta: "0%",
    },
    activeCollaborations: {
      value: Number(data["collaborationsCount"] ?? data["activeProjectsCount"] ?? 0),
    },
    recentProjects: recentProjectsList.map((item) => mapProject(item)),
  };
}

export interface AgencyDashboard {
  profile: AgencyProfile;
  pqiScore: number;
  recentOpportunitiesCount: number;
}

export async function getAgencyDashboard(): Promise<AgencyDashboard> {
  const [profileRaw, dashboardRaw] = await Promise.all([
    frappeCall<unknown>("agency.get_my_profile", {}),
    frappeCall<unknown>("agency.get_dashboard", {}),
  ]);

  const dashboard = camelizeKeys(dashboardRaw) as Record<string, unknown>;

  return {
    profile: mapAgencyProfile(profileRaw),
    pqiScore: Number(dashboard["pqiScore"] ?? 0),
    recentOpportunitiesCount: Number(
      dashboard["recentOpportunitiesCount"] ?? dashboard["opportunitiesCount"] ?? 0,
    ),
  };
}

export interface Settings {
  theme: "light" | "dark" | "system";
  language: string;
  font: string;
  textSize: number;
  twoFactorEnabled: boolean;

  emailNotifications: boolean;
  pushNotifications: boolean;
}

function mapSettings(data: Record<string, unknown>, fallback?: Partial<Settings>): Settings {
  const theme = String(data["themePreference"] ?? fallback?.theme ?? "system");
  const prefs = (data["notificationPrefs"] ?? {}) as Record<string, unknown>;
  return {
    theme: theme === "light" || theme === "dark" ? theme : "system",
    language: String(data["language"] ?? fallback?.language ?? "fr"),
    font: String(data["fontPreference"] ?? fallback?.font ?? "default"),
    textSize: Number(data["fontSize"] ?? fallback?.textSize ?? 100),
    twoFactorEnabled: Boolean(data["twoFactorEnabled"] ?? fallback?.twoFactorEnabled ?? false),
    emailNotifications: Boolean(prefs["email"] ?? fallback?.emailNotifications ?? true),
    pushNotifications: Boolean(prefs["push"] ?? fallback?.pushNotifications ?? true),
  };
}

export async function getSettings(): Promise<Settings> {
  const raw = await frappeCall<unknown>("settings.get_settings", {});
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return mapSettings(data);
}

export async function updateSettings(payload: Partial<Settings>): Promise<Settings> {
  const displayPatch: Record<string, unknown> = {};
  if (payload.theme !== undefined) displayPatch["theme_preference"] = payload.theme;
  if (payload.font !== undefined) displayPatch["font_preference"] = payload.font;
  if (payload.textSize !== undefined) displayPatch["font_size"] = payload.textSize;
  if (payload.language !== undefined) displayPatch["language"] = payload.language;

  let raw: unknown = null;
  if (Object.keys(displayPatch).length > 0) {
    raw = await frappeCall<unknown>("settings.update_settings", displayPatch);
  }

  if (payload.twoFactorEnabled !== undefined) {
    await frappeCall<unknown>("settings.toggle_two_factor", {
      enabled: payload.twoFactorEnabled,
    });
  }

  if (payload.emailNotifications !== undefined || payload.pushNotifications !== undefined) {
    await frappeCall<unknown>("settings.update_notification_prefs", {
      prefs: {
        email: payload.emailNotifications ?? true,
        push: payload.pushNotifications ?? true,
      },
    });
  }

  const data = raw ? (camelizeKeys(raw) as Record<string, unknown>) : {};
  return mapSettings(data, payload);
}

/**
 * // API CALL : frappeCall("client.request_phone_otp", { phone })
 * Envoie un vrai SMS via Twilio si configuré côté backend (site_config.json,
 * cf. client.py::_send_sms) ; repli honnête par e-mail sinon.
 */
export async function requestPhoneOtp(
  phone: string,
): Promise<{ sent: boolean; channel: "sms" | "email" }> {
  const raw = await frappeCall<unknown>("client.request_phone_otp", { phone });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    sent: Boolean(data["sent"] ?? true),
    channel: data["channel"] === "sms" ? "sms" : "email",
  };
}

/**
 * // API CALL : frappeCall("client.verify_phone_otp", { code })
 */
export async function verifyPhoneOtp(code: string): Promise<{ verified: boolean }> {
  const raw = await frappeCall<unknown>("client.verify_phone_otp", { code });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { verified: Boolean(data["verified"]) };
}

export interface ClientReview {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyInitials: string;
  project: string;
  /** Titre du projet noté (cf. review.py::list_client_reviews) — un avis doit toujours être accompagné du projet concerné. */
  projectTitle: string | null;
  rating: number;
  comment: string;
  publishedAt: string;
}

function mapClientReview(raw: unknown): ClientReview {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const agencyName = String(data["agencyName"] ?? data["agency"] ?? "");
  const initials = agencyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return {
    id: String(data["name"] ?? data["id"] ?? ""),
    agencyId: String(data["agency"] ?? ""),
    agencyName,
    agencyInitials: String(data["agencyInitials"] ?? initials),
    project: String(data["project"] ?? ""),
    projectTitle: (data["projectTitle"] as string | undefined) ?? null,
    rating: Number(data["rating"] ?? 0),
    comment: String(data["comment"] ?? ""),
    publishedAt: String(data["creation"] ?? data["publishedAt"] ?? ""),
  };
}

export async function listClientReviews(page = 1, pageSize = 10): Promise<ClientReview[]> {
  const raw = await frappeCall<unknown>("review.list_client_reviews", {
    page,
    page_size: pageSize,
  });
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => mapClientReview(item));
}
