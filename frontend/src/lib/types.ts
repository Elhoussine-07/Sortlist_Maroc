
export type UserRole = "client" | "agency" | "admin";

export interface User {
  id: string;
  role: UserRole;
  displayName: string;
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

export interface AgencyServiceItem {
  serviceName: string;
  description: string;
  priceRange: string;
  techStack: string;
  skills: string;
  projectsInProgress: number;
}

export interface AgencyPortfolioItem {
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

export interface AgencyTeamItem {
  member: string;
  memberName: string;
  photo: string;
  role: string;
  description: string;
  history: string;
  linkedinUrl: string;
}

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
  reviewedByAgency?: boolean | undefined;
  paymentStatus?: string | undefined;
  agencyProjectAmount?: number | null | undefined;
  declinedByAgency?: string | null | undefined;
  declinedByAgencyName?: string | null | undefined;
  urgency?: string | null | undefined;
  estimatedDuration?: string | null | undefined;
  interestedAgenciesCount?: number | undefined;
  budgetFlexible?: boolean | undefined;
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
  logo?: string | null | undefined;
  badge?: string | null | undefined;
  tags?: string[] | undefined;
  portfolioCount?: number | undefined;
  startingPrice?: string | null | undefined;
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
  project?: string | undefined;
  agency?: string | undefined;
  successPrediction?: number | null | undefined;
  source?: string | undefined;
  acceptedOn?: string | null | undefined;
  archivedOn?: string | null | undefined;
  archiveReason?: string | null | undefined;
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
  paymentDeadline?: string | null | undefined;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
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
  id: string;
  title: string;
  period: string;
  startDate: string | null;
  endDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  reviewed: boolean;
  yourRating: number;
  yourComment: string;
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
