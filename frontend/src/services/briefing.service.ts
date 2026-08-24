import { camelizeKeys, fetchBlob, GATEWAY_URL, restCall } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";
import type { BriefingBrief } from "@/store/briefing.store";

export interface BriefingSummary {
  category: { value: string | null; subValue: string | null; done: boolean };
  description: { value: string | null; done: boolean };
  budget: { value: string | null; done: boolean };
  location: { value: string | null; subValue: string | null; done: boolean };
  deadline: { value: string | null; subValue: string | null; done: boolean };
}

export function emptyBriefingSummary(): BriefingSummary {
  return {
    category: { value: null, subValue: null, done: false },
    description: { value: null, done: false },
    budget: { value: null, done: false },
    location: { value: null, subValue: null, done: false },
    deadline: { value: null, subValue: null, done: false },
  };
}

export function summaryFromBrief(
  brief: BriefingBrief,
  labels: { categoryLabel?: string | null; subCategoryLabel?: string | null } = {},
): BriefingSummary {
  const budgetMin = brief.budget_min;
  const budgetMax = brief.budget_max;
  const budgetValue =
    budgetMin !== undefined && budgetMin !== null
      ? budgetMax !== undefined && budgetMax !== null && budgetMax !== budgetMin
        ? `${budgetMin} € - ${budgetMax} €`
        : `${budgetMin} €`
      : null;

  return {
    category: {
      value: labels.categoryLabel ?? brief.category ?? null,
      subValue: [brief.need_type, labels.subCategoryLabel].filter(Boolean).join(" · ") || null,
      done: Boolean(brief.category) || Boolean(brief.need_type),
    },
    description: { value: brief.description ?? null, done: Boolean(brief.description) },
    budget: { value: budgetValue, done: budgetMin != null && budgetMax != null },
    location: { value: brief.location ?? null, subValue: null, done: Boolean(brief.location) },
    deadline: {
      value: brief.delivery_delay_days != null ? `${brief.delivery_delay_days} jour(s)` : null,
      subValue: null,
      done: brief.delivery_delay_days != null,
    },
  };
}

export interface EnrichResult {
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
}

export async function enrichBriefingDescription(params: {
  description: string;
  category?: string | null;
}): Promise<EnrichResult> {
  const raw = await restCall<unknown>("ia", "/briefing/enrich", {
    method: "POST",
    body: { description: params.description, category: params.category ?? null },
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    description: typeof data["description"] === "string" ? data["description"] : params.description,
    budgetMin: typeof data["budgetMin"] === "number" ? (data["budgetMin"] as number) : null,
    budgetMax: typeof data["budgetMax"] === "number" ? (data["budgetMax"] as number) : null,
  };
}

export interface ConfirmResponse {
  project: string;
  cdcFile: string;
}

export async function generateCdcPdf(
  brief: BriefingBrief,
): Promise<{ blob: Blob; projectId: string }> {
  const clientEmail = useAuthStore.getState().user?.email ?? "";
  const raw = await restCall<unknown>("ia", "/briefing/confirm", {
    method: "POST",
    body: { client: clientEmail, brief },
  });
  const data = camelizeKeys(raw) as unknown as ConfirmResponse;
  const fileUrl = data.cdcFile.startsWith("http") ? data.cdcFile : `${GATEWAY_URL}${data.cdcFile}`;
  const blob = await fetchBlob(fileUrl);
  return { blob, projectId: data.project };
}
