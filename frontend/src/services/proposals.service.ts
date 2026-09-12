import { camelizeKeys, fetchBlob, frappeCall, GATEWAY_URL } from "@/services/http";

export interface PendingProposal {
  id: string;
  agencyId: string;
  agencyName: string;
  amount: number;
  description: string;
  submittedDate: string | null;
  responseDeadline: string | null;
  extendedDeadline: string | null;
  devisFile: string | null;
}

function mapProposal(raw: unknown): PendingProposal {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    id: String(data["name"] ?? ""),
    agencyId: String(data["agency"] ?? ""),
    agencyName: String(data["agencyName"] ?? data["agency"] ?? ""),
    amount: Number(data["amount"] ?? 0),
    description: String(data["description"] ?? ""),
    submittedDate: (data["submittedDate"] as string | undefined) ?? null,
    responseDeadline: (data["responseDeadline"] as string | undefined) ?? null,
    extendedDeadline: (data["extendedDeadline"] as string | undefined) ?? null,
    devisFile: (data["devisFile"] as string | undefined) ?? null,
  };
}

export async function getPendingProposals(projectId: string): Promise<PendingProposal[]> {
  const raw = await frappeCall<unknown[]>("project.get_pending_proposals", {
    project: projectId,
  });
  return Array.isArray(raw) ? raw.map(mapProposal) : [];
}

export async function respondToQuote(
  proposalId: string,
  decision: "accept" | "refuse",
  message?: string,
): Promise<void> {
  await frappeCall<unknown>("project.respond_to_quote", {
    proposal: proposalId,
    decision,
    message: message || undefined,
  });
}

export async function downloadDevisPdf(proposalId: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.project.download_devis`;
  return fetchBlob(url, undefined, { proposal: proposalId });
}
