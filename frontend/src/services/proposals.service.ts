import { camelizeKeys, fetchBlob, frappeCall, GATEWAY_URL } from "@/services/http";

/**
 * Devis reçus par le client sur un projet, en attente de décision (CDC
 * §1.3.3/§1.5.7) : chaque devis (relation Client-Agence) a son propre délai
 * de réponse (48h puis +24h de rappel) — plusieurs devis peuvent coexister
 * en Multicast, comparables indépendamment les uns des autres.
 */
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

/**
 * // API CALL : frappeCall("project.get_pending_proposals", { project: projectId })
 */
export async function getPendingProposals(projectId: string): Promise<PendingProposal[]> {
  const raw = await frappeCall<unknown[]>("project.get_pending_proposals", {
    project: projectId,
  });
  return Array.isArray(raw) ? raw.map(mapProposal) : [];
}

/**
 * // API CALL : frappeCall("project.respond_to_quote", { proposal: proposalId, decision })
 * Étape 4 du workflow d'acceptation & de devis (CDC §1.3.3) : le client
 * Accepte (-> projet En cours, CDC verrouillé, commission prélevée) ou
 * Refuse (-> projet Rejeté/Refusé si aucune autre relation active) un devis
 * reçu, dans le délai de 48h (+24h de rappel) qui lui est propre.
 */
export async function respondToQuote(
  proposalId: string,
  decision: "accept" | "refuse",
): Promise<void> {
  await frappeCall<unknown>("project.respond_to_quote", { proposal: proposalId, decision });
}

/**
 * // API CALL : frappeCall("project.download_devis", { proposal: proposalId }) — POST, réponse binaire
 * Comme `opportunities.service.ts::downloadOpportunityCdc` : le PDF du
 * devis est un fichier privé attaché au `Proposal`, dont le propriétaire
 * Frappe natif est l'agence — un fetch direct de `PendingProposal.devisFile`
 * (`/private/files/...`) échoue en 403 pour le client. Cet endpoint sert le
 * contenu directement, avec sa propre autorisation (client propriétaire du
 * projet lié). POST + corps JSON (pas GET + query string, cf. `fetchBlob`).
 */
export async function downloadDevisPdf(proposalId: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.project.download_devis`;
  return fetchBlob(url, undefined, { proposal: proposalId });
}
