import { camelizeKeys, frappeCall } from "@/services/http";

export type SuspensionCategory = "amicable" | "dispute";

export interface ModerationCase {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  agencyName: string | null;
  category: SuspensionCategory;
  requestedBy: "client" | "agency" | "system" | null;
  justification: string;
  createdAt: string;
}

function mapCase(raw: unknown): ModerationCase {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const rawCategory = String(data["category"] ?? "").toLowerCase();
  const rawRequestedBy = String(data["requestedBy"] ?? "").toLowerCase();
  return {
    id: String(data["name"] ?? ""),
    projectId: String(data["project"] ?? ""),
    projectTitle: String(data["projectTitle"] ?? ""),
    clientName: String(data["clientName"] ?? ""),
    agencyName: (data["agencyName"] as string | null | undefined) ?? null,
    category: rawCategory.includes("litige") ? "dispute" : "amicable",
    requestedBy:
      rawRequestedBy === "client" || rawRequestedBy === "agency" || rawRequestedBy === "system"
        ? rawRequestedBy
        : null,
    justification: String(data["justification"] ?? ""),
    createdAt: String(data["creation"] ?? ""),
  };
}

export async function listPendingSuspensions(): Promise<ModerationCase[]> {
  const raw = await frappeCall<unknown[]>("moderation.list_pending_suspensions", {});
  return Array.isArray(raw) ? raw.map(mapCase) : [];
}

export async function approveSuspensionAsModerator(id: string): Promise<void> {
  await frappeCall<unknown>("moderation.approve_suspension", { suspension: id });
}

export async function refuseSuspensionAsModerator(id: string): Promise<void> {
  await frappeCall<unknown>("moderation.refuse_suspension", { suspension: id });
}

export async function resolveDispute(
  id: string,
  founded: boolean,
  decisionNote?: string,
): Promise<{ id: string; status: string }> {
  const raw = await frappeCall<unknown>("moderation.resolve_dispute", {
    dispute: id,
    founded,
    decision_note: decisionNote,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    id: String(data["name"] ?? id),
    status: String(data["status"] ?? (founded ? "Founded" : "Not Founded")),
  };
}

export interface LitigeNoticeCase extends ModerationCase {
  litigeNoticeStatus: "Pending" | "Responded" | null;
  agencyNoticeDeadline: string | null;
  agencyResponse: string | null;
  agencyResponseDate: string | null;
}

function mapLitigeNoticeCase(raw: unknown): LitigeNoticeCase {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const rawNoticeStatus = data["litigeNoticeStatus"];
  return {
    ...mapCase(raw),
    litigeNoticeStatus:
      rawNoticeStatus === "Pending" || rawNoticeStatus === "Responded" ? rawNoticeStatus : null,
    agencyNoticeDeadline: (data["agencyNoticeDeadline"] as string | null | undefined) ?? null,
    agencyResponse: (data["agencyResponse"] as string | null | undefined) ?? null,
    agencyResponseDate: (data["agencyResponseDate"] as string | null | undefined) ?? null,
  };
}

export async function listPendingLitigeNotices(): Promise<LitigeNoticeCase[]> {
  const raw = await frappeCall<unknown[]>("moderation.list_pending_litige_notices", {});
  return Array.isArray(raw) ? raw.map(mapLitigeNoticeCase) : [];
}

export async function resolveLitigeNotice(
  id: string,
  acceptAgencyJustification: boolean,
  decisionNote?: string,
): Promise<void> {
  await frappeCall<unknown>("moderation.resolve_litige_notice", {
    suspension: id,
    accept_agency_justification: acceptAgencyJustification,
    decision_note: decisionNote,
  });
}

export type AccountType = "client" | "agency";

export interface PendingAgencyReview {
  id: string;
  clientProfile: string | null;
  clientName: string;
  agency: string;
  agencyName: string | null;
  project: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function mapPendingAgencyReview(raw: unknown): PendingAgencyReview {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    id: String(data["name"] ?? ""),
    clientProfile: (data["clientProfile"] as string | null | undefined) ?? null,
    clientName: String(data["clientName"] ?? ""),
    agency: String(data["agency"] ?? ""),
    agencyName: (data["agencyName"] as string | null | undefined) ?? null,
    project: String(data["project"] ?? ""),
    rating: Number(data["rating"] ?? 0),
    comment: String(data["comment"] ?? ""),
    createdAt: String(data["creation"] ?? ""),
  };
}

export async function listPendingAgencyReviews(): Promise<PendingAgencyReview[]> {
  const raw = await frappeCall<unknown[]>("moderation.list_pending_reviews", {});
  return Array.isArray(raw) ? raw.map(mapPendingAgencyReview) : [];
}

export async function moderateAgencyReview(id: string, approve: boolean): Promise<void> {
  await frappeCall<unknown>("moderation.moderate_review", { review: id, approve: approve ? 1 : 0 });
}

export interface RecentClientReview {
  id: string;
  client: string;
  clientName: string;
  agency: string;
  agencyName: string | null;
  project: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function mapRecentClientReview(raw: unknown): RecentClientReview {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    id: String(data["name"] ?? ""),
    client: String(data["client"] ?? ""),
    clientName: String(data["clientName"] ?? ""),
    agency: String(data["agency"] ?? ""),
    agencyName: (data["agencyName"] as string | null | undefined) ?? null,
    project: String(data["project"] ?? ""),
    rating: Number(data["rating"] ?? 0),
    comment: String(data["comment"] ?? ""),
    createdAt: String(data["creation"] ?? ""),
  };
}

export async function listRecentClientReviews(): Promise<RecentClientReview[]> {
  const raw = await frappeCall<unknown[]>("moderation.list_recent_client_reviews", {});
  return Array.isArray(raw) ? raw.map(mapRecentClientReview) : [];
}

export async function suspendAccount(
  accountType: AccountType,
  target: string,
  reason?: string,
): Promise<void> {
  await frappeCall<unknown>("moderation.suspend_account", {
    account_type: accountType,
    target,
    reason,
  });
}

export async function reactivateAccount(accountType: AccountType, target: string): Promise<void> {
  await frappeCall<unknown>("moderation.reactivate_account", { account_type: accountType, target });
}

export async function flagAccount(
  accountType: AccountType,
  target: string,
  reason: string,
): Promise<void> {
  await frappeCall<unknown>("moderation.flag_account", {
    account_type: accountType,
    target,
    reason,
  });
}
