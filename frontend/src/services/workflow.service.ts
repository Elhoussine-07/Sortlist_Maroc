import type { Opportunity } from "@/lib/types";
import {
  acceptOpportunity,
  getOpportunities,
  refuseOpportunity,
} from "@/services/opportunities.service";

export type WorkflowStep =
  "received" | "reviewed" | "quote_sent" | "awaiting_client" | "won" | "lost";

export interface WorkflowStage {
  id: string;
  step: WorkflowStep;
  label: string;
  count: number;
  slaHours: number | null;
}

const STEP_LABELS: Record<WorkflowStep, string> = {
  received: "Reçues",
  reviewed: "Étudiées",
  quote_sent: "Devis envoyé",
  awaiting_client: "En attente client",
  won: "Gagnées",
  lost: "Perdues",
};

function deriveStep(rawStatus: string | undefined): WorkflowStep {
  switch (rawStatus) {
    case "Reçue":
      return "received";
    case "Acceptée":
      return "reviewed";
    case "Devis envoyé":
      return "quote_sent";
    case "Gagnée":
      return "won";
    case "Archivée":
      return "lost";
    default:
      return "received";
  }
}

async function fetchWorkflowOpportunities(): Promise<Opportunity[]> {
  const [offers, won, archived] = await Promise.all([
    getOpportunities({ tab: "offers", page: 1, pageSize: 100 }),
    getOpportunities({ tab: "won", page: 1, pageSize: 100 }),
    getOpportunities({ tab: "archived", page: 1, pageSize: 100 }),
  ]);
  return [...offers.items, ...won.items, ...archived.items];
}

export async function getWorkflowStages(): Promise<WorkflowStage[]> {
  const items = await fetchWorkflowOpportunities();
  const counts: Record<WorkflowStep, number> = {
    received: 0,
    reviewed: 0,
    quote_sent: 0,
    awaiting_client: 0,
    won: 0,
    lost: 0,
  };
  for (const item of items) {
    const step = deriveStep(item.rawStatus);
    counts[step] += 1;

    if (step === "quote_sent") counts.awaiting_client += 1;
  }

  return (Object.keys(STEP_LABELS) as WorkflowStep[]).map((step) => ({
    id: step,
    step,
    label: STEP_LABELS[step],
    count: counts[step],
    slaHours: null,
  }));
}

export async function getWorkflowItems(params?: {
  step?: WorkflowStep;
  query?: string;
  sort?: "recent" | "deadline";
  page?: number;
  pageSize?: number;
}): Promise<{
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<string, number>;
}> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;

  const allItems = await fetchWorkflowOpportunities();

  const counts: Record<string, number> = { all: allItems.length };
  for (const step of Object.keys(STEP_LABELS) as WorkflowStep[]) {
    counts[step] = 0;
  }
  for (const item of allItems) {
    const step = deriveStep(item.rawStatus);
    counts[step] = (counts[step] ?? 0) + 1;
    if (step === "quote_sent") counts["awaiting_client"] = (counts["awaiting_client"] ?? 0) + 1;
  }

  const filtered = params?.step
    ? allItems.filter((item) => {
        const step = deriveStep(item.rawStatus);
        if (params.step === "awaiting_client") return step === "quote_sent";
        return step === params.step;
      })
    : allItems;

  const sorted =
    params?.sort === "deadline"
      ? [...filtered].sort(
          (a, b) => (a.remainingHours ?? Infinity) - (b.remainingHours ?? Infinity),
        )
      : [...filtered].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages, counts };
}

export async function advanceWorkflowItem(
  id: string,
  payload: { toStep: WorkflowStep; note?: string },
): Promise<{ id: string; step: WorkflowStep }> {
  if (payload.toStep === "won" || payload.toStep === "reviewed") {
    await acceptOpportunity(id);
    return { id, step: payload.toStep };
  }
  if (payload.toStep === "lost") {
    await refuseOpportunity(id);
    return { id, step: payload.toStep };
  }
  throw new Error(
    `advanceWorkflowItem : pas d'action backend connue pour l'étape "${payload.toStep}" (TODO backend, voir workflow.service.ts)`,
  );
}
