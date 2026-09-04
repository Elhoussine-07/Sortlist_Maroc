/**
 * Types partagés de l'application.
 * Aucune donnée réelle ici : uniquement les contrats attendus du backend
 * (Frappe + Spring Boot + Node.js).
 */

export type UserRole = "client" | "agency" | "admin";

export interface User {
  id: string;
  role: UserRole;
  /** Nom affiché dans la barre supérieure (ex. raison sociale ou nom d'agence) */
  displayName: string;
  /** Initiales affichées dans l'avatar de la barre supérieure */
  initials: string;
  email: string;
}

export interface ClientProfile {
  id: string;
  contactLastName: string;
  contactFirstName: string;
  companyName: string;
  activitySector: string;
  country: string;
  legalIdType: string;
  legalIdValue: string;
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  trustScore: number;
  trustScoreLabel: string;
  trustScoreFactors: Array<{
    id: string;
    label: string;
    value: number;
    max: number;
  }>;
  completionPercent: number;
  missingFields: Array<{ id: string; label: string }>;
  updatedAt: string;
  /**
   * Champs additionnels renvoyés par le backend Frappe (`client.get_profile`)
   * sans équivalent conceptuel dans les champs historiques ci-dessus.
   * Voir `profile.service.ts::getClientProfile` pour le mapping complet.
   */
  phone?: string | undefined;
  phoneVerified?: boolean | undefined;
  logo?: string | null | undefined;
  projectsPublishedCount?: number | undefined;
  responseRate?: number | undefined;
  accountSeniority?: string | undefined;
}

export interface AgencyProfile {
  id: string;
  name: string;
  description: string;
  foundedYear: string;
  teamSize: string;
  website: string;
  languages: string[];
  remoteWork: boolean;
  location: string;
  legalIdValue: string;
  legalIdValid: boolean;
  techStack: string[];
  skills: string[];
  phoneCountryCode: string;
  phone: string;
  email: string;
  verificationCode: string;
  address: string;
  /**
   * Champs additionnels renvoyés par le backend Frappe (`agency.get_profile`)
   * sans équivalent conceptuel dans les champs historiques ci-dessus.
   * Voir `profile.service.ts::getAgencyProfile` pour le mapping complet.
   */
  logo?: string | null | undefined;
  slogan?: string | undefined;
  coverImage?: string | null | undefined;
  coverage?: string[] | undefined;
  annualRevenue?: number | null | undefined;
  country?: string | undefined;
  emailVerified?: boolean | undefined;
  socialLinks?: Record<string, string> | undefined;
  rating?: number | undefined;
  pqiScore?: number | undefined;
  profileCompletion?: number | undefined;
  reviewsCount?: number | undefined;
  services?: AgencyServiceItem[] | undefined;
  portfolio?: AgencyPortfolioItem[] | undefined;
  team?: AgencyTeamItem[] | undefined;
  certifications?: AgencyCertificationItem[] | undefined;
  billingEmail?: string | undefined;
  vatNumber?: string | undefined;
  billingAddress?: string | undefined;
}

/** CDC §2.2.2 — Prestation (Services). */
export interface AgencyServiceItem {
  serviceName: string;
  description: string;
  priceRange: string;
  techStack: string;
  skills: string;
  projectsInProgress: number;
}

/** CDC §2.2.3 — Réalisation (Portfolio). */
export interface AgencyPortfolioItem {
  /** `name` de la ligne de table enfant Frappe (absent tant que la ligne n'a pas été enregistrée). */
  id?: string | undefined;
  title: string;
  status: string;
  image: string;
  videoUrl: string;
  resultUrl: string;
  budget: number | null;
  collaborationPeriod: string;
  agencyFeedback: string;
  problemSolution: string;
  clientConfirmed: boolean;
}

/** CDC §2.2.4 — Staff (Équipe). `member` référence un AgencyMember existant. */
export interface AgencyTeamItem {
  member: string;
  memberName: string;
  photo: string;
  role: string;
  description: string;
  history: string;
  linkedinUrl: string;
}

/** CDC §2.2.5 — Certificats. */
export interface AgencyCertificationItem {
  photo: string;
  title: string;
  description: string;
  issuingOrganization: string;
  level: string;
}

export type ProjectStatus =
  "draft" | "published" | "awaiting" | "in_progress" | "suspended" | "finished" | "rejected";

export interface Project {
  id: string;
  reference: string;
  title: string;
  category: string;
  subCategory: string;
  status: ProjectStatus;
  statusLabel: string;
  lastActivity: string;
  budgetMin: number | null;
  budgetMax: number | null;
  location: string;
  startedAt: string | null;
  partnerAgencyName: string | null;
  agencyId: string | null;
  objective: string;
  features: string[];
  constraints: string[];
  deadline: string;
  locked: boolean;
  /**
   * Champs additionnels renvoyés par le backend Frappe (doctype `Project`)
   * sans équivalent conceptuel dans les champs historiques ci-dessus.
   * Voir `projects.service.ts` / `opportunities.service.ts` pour le mapping complet.
   */
  client?: string | undefined;
  description?: string | undefined;
  needType?: string | undefined;
  channel?: string | undefined;
  deliveryDelayDays?: number | null | undefined;
  rejectionSubstatus?: string | null | undefined;
  cdcFile?: string | null | undefined;
  shortlistIa?: string[] | undefined;
  acceptanceDate?: string | null | undefined;
  expectedEndDate?: string | null | undefined;
  totalSuspensionDays?: number | undefined;
  completionConfirmedByClient?: boolean | undefined;
  repostCount?: number | undefined;
  /** Projet Terminé déjà noté par l'agence (`opportunity.review_client`). */
  reviewedByAgency?: boolean | undefined;
  /**
   * Statut du règlement du CLIENT à l'AGENCE pour les frais du projet
   * (distinct de la commission plateforme, réglée par l'agence) — cf.
   * `client.pay_agency_for_project`. Valeurs backend : "Non facturé" /
   * "À payer" / "Payé".
   */
  paymentStatus?: string | undefined;
  /** Montant dû par le client à l'agence (offre acceptée), cf. `project.get_project`. */
  agencyProjectAmount?: number | null | undefined;
  /**
   * Dernière agence ayant refusé ce projet (opportunité archivée avec motif
   * "Refus agence"/"Devis refusé"), renseigné uniquement quand aucune agence
   * n'a encore gagné le projet — cf. `project.my_projects`. Un refus ne fait
   * plus jamais passer le projet "Rejeté" automatiquement (il reste
   * "Postulé", visible dans "Disponibles" pour d'autres agences) ; ce champ
   * permet au client de voir qui a refusé sans que ça bloque la recherche.
   */
  declinedByAgency?: string | null | undefined;
  declinedByAgencyName?: string | null | undefined;
  /**
   * Champs additionnels utilisés par la page publique de recherche de
   * projets (`routes/projets.tsx`) — sans équivalent doctype `Project`
   * direct connu ; renseignés en best-effort par `projects.service.ts::
   * mapProject` quand le backend les fournit.
   */
  urgency?: string | null | undefined;
  estimatedDuration?: string | null | undefined;
  interestedAgenciesCount?: number | undefined;
  budgetFlexible?: boolean | undefined;
  /** Photo optionnelle du projet (Attach Image côté doctype `Project`) — sinon visuel par défaut selon `category`. */
  coverImage?: string | null | undefined;
}

export interface Agency {
  id: string;
  name: string;
  logoText: string;
  location: string;
  description: string;
  rating: number;
  reviewsCount: number;
  matchingScore: number | null;
  /** URL du logo (Frappe "Attach Image"), affiché dans les cartes de résultats de recherche. */
  logo?: string | null | undefined;
  /**
   * Champs additionnels utilisés par la page publique de recherche
   * d'agences (`routes/agences.tsx`) — sans équivalent doctype
   * `AgencyProfile` direct connu ; renseignés en best-effort quand le
   * backend les fournit.
   */
  badge?: string | null | undefined;
  tags?: string[] | undefined;
  portfolioCount?: number | undefined;
  startingPrice?: string | null | undefined;
  // Distinct de `AgencyProfile.teamSize` (string, ex. "11-50") — celui-ci
  // est l'effectif numérique brut utilisé pour le bucketing des cartes de
  // résultats de recherche (`routes/agences.tsx`). Même nom = collision de
  // type dans `Agency & Partial<AgencyProfile>` (cf. getAgencyProfile()).
  teamSizeCount?: number | null | undefined;
  avgResponseHours?: number | null | undefined;
  onTimeDeliveryRate?: number | null | undefined;
}

export interface Opportunity {
  id: string;
  step: string;
  stepLabel: string;
  companyInitials: string;
  companyName: string;
  projectTitle: string;
  budgetMin: number | null;
  budgetMax: number | null;
  location: string;
  category: string;
  relevance: number;
  publishedAt: string;
  quoteAmount: number | null;
  remainingHours: number | null;
  /**
   * Champs additionnels renvoyés par le backend Frappe (doctype `Opportunity`)
   * sans équivalent conceptuel dans les champs historiques ci-dessus.
   * Voir `opportunities.service.ts` pour le mapping complet.
   */
  project?: string | undefined;
  agency?: string | undefined;
  successPrediction?: number | null | undefined;
  source?: string | undefined;
  acceptedOn?: string | null | undefined;
  archivedOn?: string | null | undefined;
  archiveReason?: string | null | undefined;
  /**
   * Statut brut de l'Opportunity côté backend (doctype `Opportunity`,
   * français : "Reçue"/"Acceptée"/"Devis envoyé"/"Gagnée"/"Archivée"...).
   * Distinct de `step`, qui est une approximation dérivée pour les onglets
   * UI — `rawStatus` sert à distinguer précisément les sous-états internes
   * à l'onglet "Toutes" (ex. Acceptée en attente de devis vs Devis déjà
   * envoyé), ce que `step`/`stepLabel` ne permettaient pas de façon fiable.
   */
  rawStatus?: string | undefined;
}

export interface Invoice {
  id: string;
  projectTitle: string;
  companyName: string;
  amount: number;
  issuedAt: string;
  dueAt: string;
  status: "paid" | "to_pay" | "late";
  statusLabel: string;
  downloadUrl: string;
  /**
   * Champs additionnels renvoyés par le backend Frappe (doctype `Invoice`)
   * sans équivalent conceptuel dans les champs historiques ci-dessus.
   * Voir `invoices.service.ts` pour le mapping complet.
   */
  agency?: string | undefined;
  project?: string | undefined;
  proposal?: string | undefined;
  tax?: number | undefined;
  total?: number | undefined;
  commissionRate?: number | undefined;
  commissionAmount?: number | undefined;
  amountDue?: number | undefined;
  paymentDate?: string | null | undefined;
  invoiceNumber?: string | undefined;
  /**
   * Échéance de règlement de la commission par l'agence (48h par défaut à
   * partir de la création de la facture, cf. `PlatformSettings.invoice_payment_deadline_hours`)
   * — passée cette échéance sans règlement, le projet est automatiquement
   * suspendu (catégorie "Non-paiement").
   */
  paymentDeadline?: string | null | undefined;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  /**
   * Champs additionnels renvoyés par le backend Frappe (doctype `Notification`)
   * sans équivalent conceptuel dans les champs historiques ci-dessus.
   * Voir `notifications.service.ts` pour le mapping complet.
   */
  recipient?: string | undefined;
  category?: string | undefined;
  link?: string | null | undefined;
  referenceDoctype?: string | null | undefined;
  referenceName?: string | null | undefined;
  agencyContext?: string | null | undefined;
  channel?: string | undefined;
  actionRequired?: boolean | undefined;
  readOn?: string | null | undefined;
  isArchived?: boolean | undefined;
}

export interface CollaborationProjectReview {
  /** `name` du Project côté Frappe — c'est cet id qui doit être envoyé à `submitCollaborationReview`. */
  id: string;
  title: string;
  period: string;
  /** Dates brutes (ISO), pour le filtre "Période" — `period` reste la version déjà formatée pour l'affichage. */
  startDate: string | null;
  endDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  reviewed: boolean;
  yourRating: number;
  yourComment: string;
  /** Note laissée par l'AGENCE sur le client pour ce projet (`ClientReview`), absente tant qu'aucun avis reçu. */
  ratingReceived: number | null;
}

export interface Collaboration {
  id: string;
  agencyInitials: string;
  agencyName: string;
  agencyTagline: string;
  ratingReceived: number;
  finishedProjects: string;
  period: string;
  budget: string;
  publicReview: string;
  reviewLength: number;
  yourRating: number;
  projects: CollaborationProjectReview[];
}

export interface HistoryEntry {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
