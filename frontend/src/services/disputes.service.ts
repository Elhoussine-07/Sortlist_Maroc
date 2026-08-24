import type { HistoryEntry } from "@/lib/types";
import { camelizeKeys, frappeCall } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";

export type SuspensionCategory = "amicable" | "dispute";

export interface SuspensionRequestPayload {
  projectId: string;
  reason: string;
  category: SuspensionCategory;
}

const CATEGORY_MAP: Record<SuspensionCategory, string> = {
  amicable: "Suspension amiable",
  dispute: "Litige",
};

export async function requestSuspension(
  payload: SuspensionRequestPayload,
): Promise<{ requestId: string; status: "under_review" }> {
  const raw = await frappeCall<unknown>("project.request_suspension", {
    project: payload.projectId,
    category: CATEGORY_MAP[payload.category] ?? "Suspension amiable",
    justification: payload.reason,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    requestId: String(data["requestId"] ?? data["name"] ?? ""),
    status: "under_review",
  };
}

export async function reportProblem(
  projectId: string,
  reason: string,
): Promise<{ reportId: string; status: "sent" }> {
  const role = useAuthStore.getState().role;
  const method =
    role === "agency" ? "opportunity.report_inactivity" : "project.report_agency_inactivity";
  const raw = await frappeCall<unknown>(method, { project: projectId, message: reason });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    reportId: String(data["reportId"] ?? data["name"] ?? ""),
    status: "sent",
  };
}

export async function getDispute(projectId: string): Promise<{
  status: string;
  statusLabel: string;
  history: HistoryEntry[];
  category: string | null;
}> {
  const raw = await frappeCall<unknown>("project.get_dispute", { project: projectId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    status: String(data["status"] ?? ""),
    statusLabel: String(data["statusLabel"] ?? data["status"] ?? ""),
    history: Array.isArray(data["history"]) ? (data["history"] as HistoryEntry[]) : [],
    category: (data["category"] as string | null | undefined) ?? null,
  };
}

export async function resumeProject(projectId: string): Promise<{ projectId: string }> {
  const raw = await frappeCall<unknown>("project.resume", { project: projectId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { projectId: String(data["name"] ?? data["projectId"] ?? projectId) };
}

export async function relaunchAgencySearch(projectId: string): Promise<{ projectId: string }> {
  const raw = await frappeCall<unknown>("project.relaunch_search", { project: projectId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { projectId: String(data["project"] ?? projectId) };
}

export async function signalReady(projectId: string): Promise<{ notified: boolean }> {
  const raw = await frappeCall<unknown>("project.signal_ready", { project: projectId });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { notified: Boolean(data["notified"] ?? true) };
}
