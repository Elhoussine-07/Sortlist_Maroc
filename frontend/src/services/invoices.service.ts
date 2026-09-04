import type { Invoice, PaginatedResponse } from "@/lib/types";
import { camelizeKeys, fetchBlob, GATEWAY_URL, frappeCall } from "@/services/http";

/** Service facturation. */

export interface InvoiceFilters {
  status?: "all" | "paid" | "to_pay" | "late";
  period?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
}

const STATUS_MAP: Record<string, Invoice["status"]> = {
  paid: "paid",
  payée: "paid",
  payee: "paid",
  "en attente": "to_pay",
  pending: "to_pay",
  unpaid: "to_pay",
  overdue: "late",
  "en retard": "late",
  late: "late",
};

const STATUS_LABELS: Record<Invoice["status"], string> = {
  paid: "Payée",
  to_pay: "À payer",
  late: "En retard",
};

function mapInvoiceStatus(raw: unknown): Invoice["status"] {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase();
  return STATUS_MAP[key] ?? "to_pay";
}

/**
 * Traduit une `Invoice` Frappe (snake_case) vers `Invoice` (camelCase).
 * // TODO backend: `projectTitle`/`companyName` (libellés d'affichage) non
 * // confirmés dans le doctype `Invoice` — best-effort à partir des champs
 * // liés (`project`, `agency`).
 */
function mapInvoice(raw: unknown): Invoice {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  const status = mapInvoiceStatus(data["status"]);
  const id = String(data["id"] ?? data["name"] ?? "");

  return {
    id,
    projectTitle: String(data["projectTitle"] ?? data["project"] ?? ""),
    companyName: String(data["companyName"] ?? data["agency"] ?? ""),
    amount: Number(data["amount"] ?? data["total"] ?? 0),
    issuedAt: String(data["issueDate"] ?? data["issuedAt"] ?? ""),
    dueAt: String(data["dueDate"] ?? data["dueAt"] ?? ""),
    status,
    statusLabel: String(data["statusLabel"] ?? STATUS_LABELS[status]),
    downloadUrl: String(
      data["downloadUrl"] ??
        `${GATEWAY_URL}/api/method/platform_core.platform_core.api.payment.download_invoice_pdf`,
    ),
    agency: (data["agency"] as string | undefined) ?? undefined,
    project: (data["project"] as string | undefined) ?? undefined,
    proposal: (data["proposal"] as string | undefined) ?? undefined,
    tax: data["tax"] !== undefined ? Number(data["tax"]) : undefined,
    total: data["total"] !== undefined ? Number(data["total"]) : undefined,
    commissionRate:
      data["commissionRate"] !== undefined ? Number(data["commissionRate"]) : undefined,
    commissionAmount:
      data["commissionAmount"] !== undefined ? Number(data["commissionAmount"]) : undefined,
    amountDue: data["amountDue"] !== undefined ? Number(data["amountDue"]) : undefined,
    paymentDate: (data["paymentDate"] as string | null | undefined) ?? undefined,
    invoiceNumber: (data["invoiceNumber"] as string | undefined) ?? undefined,
    paymentDeadline: (data["paymentDeadline"] as string | null | undefined) ?? undefined,
  };
}

/**
 * // API CALL : frappeCall("payment.list_invoices", { status: filters?.status })
 */
export async function getInvoices(filters: InvoiceFilters): Promise<PaginatedResponse<Invoice>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const raw = await frappeCall<unknown>("payment.list_invoices", {
    status: filters.status && filters.status !== "all" ? filters.status : undefined,
  });
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  const items = list.map((item) => mapInvoice(item));

  return {
    items,
    page,
    pageSize,
    total: items.length,
    totalPages: 1,
  };
}

/**
 * // Dérivé de `payment.list_invoices` (somme côté client) — pas d'endpoint
 * // "summary" dédié confirmé.
 */
export async function getInvoicesSummary(): Promise<{
  totalPaid: number;
  pendingAmount: number;
}> {
  const raw = await frappeCall<unknown>("payment.list_invoices", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  const items = list.map((item) => mapInvoice(item));

  return items.reduce(
    (summary, invoice) => {
      // BUG CORRIGÉ : sommait `invoice.amount` (le montant HT du PROJET,
      // cf. Invoice.amount) au lieu du montant réellement dû à la plateforme
      // (`amountDue`, désormais basé sur la commission — cf. invoice.py).
      const owed = invoice.amountDue ?? invoice.amount;
      if (invoice.status === "paid") {
        summary.totalPaid += owed;
      } else {
        summary.pendingAmount += owed;
      }
      return summary;
    },
    { totalPaid: 0, pendingAmount: 0 },
  );
}

/**
 * Téléchargement PDF d'une facture.
 * BUG CORRIGÉ : appelait auparavant directement l'utilitaire Frappe natif
 * `frappe.utils.print_format.download_pdf?doctype=Invoice&name=...` en GET
 * avec les paramètres en query string — cette vue lit `doctype`/`name`
 * depuis `frappe.form_dict`, qui arrive vide sur cette installation (même
 * défaut que documenté pour les appels JSON, cf. `auth.get_body_arg`),
 * d'où un 500 `TypeError: download_pdf() missing 2 required positional
 * arguments: 'doctype' and 'name'` systématique. Même correctif que
 * `downloadProjectCdc`/`downloadDevisPdf` : passe par un endpoint applicatif
 * dédié (`payment.download_invoice_pdf`), appelé en POST avec le paramètre
 * dans le corps JSON plutôt qu'en query string.
 */
export async function downloadInvoice(id: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.payment.download_invoice_pdf`;
  return fetchBlob(url, undefined, { invoice: id });
}

/**
 * Règlement manuel en un clic d'une facture de commission "À payer"/"En
 * retard", via le moyen de paiement par défaut déjà enregistré
 * (`PaymentMethodSection`) — repli si le débit automatique à l'acceptation
 * du devis n'a pas eu lieu (aucun moyen par défaut à ce moment-là).
 *
 * // API CALL : frappeCall("payment.pay_invoice", { invoice: id })
 */
export async function payInvoice(id: string): Promise<{ payment: string; status: string }> {
  const raw = await frappeCall<unknown>("payment.pay_invoice", { invoice: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    payment: String(data["payment"] ?? ""),
    status: String(data["status"] ?? ""),
  };
}

/**
 * Moyen de paiement agence (CDC §2.5.1) : jusqu'ici il n'existait aucun
 * espace pour l'enregistrer ni le consulter, alors que la commission
 * prélevée sur chaque devis accepté (`Proposal._create_invoice` →
 * `payment._charge_invoice`) ne peut se régler automatiquement que si un
 * moyen de paiement par défaut est déjà sur le compte.
 */
export interface PaymentMethodSummary {
  id: string;
  methodType: "Card" | "Bank Transfer";
  label: string;
  isDefault: boolean;
  autoDebitEnabled: boolean;
}

function mapPaymentMethod(raw: unknown): PaymentMethodSummary {
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    id: String(data["id"] ?? data["name"] ?? ""),
    methodType: data["methodType"] === "Bank Transfer" ? "Bank Transfer" : "Card",
    label: String(data["label"] ?? ""),
    isDefault: Boolean(data["isDefault"]),
    autoDebitEnabled: Boolean(data["autoDebitEnabled"]),
  };
}

/**
 * // API CALL : frappeCall("payment.list_payment_methods", {})
 */
export async function getPaymentMethods(): Promise<PaymentMethodSummary[]> {
  const raw = await frappeCall<unknown>("payment.list_payment_methods", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => mapPaymentMethod(item));
}

/**
 * Enregistre un nouveau moyen de paiement — devient automatiquement le
 * moyen par défaut (`is_default: 1`, cf. `payment.register_payment_method`
 * côté backend, qui désactive le précédent défaut) : le client/l'agence n'a
 * rien de plus à faire, la commission suivante sera prélevée dessus.
 *
 * // API CALL : frappeCall("payment.register_payment_method", { method_type, provider_token, label, is_default: 1, auto_debit_enabled: 1 })
 */
export async function registerPaymentMethod(payload: {
  methodType: "Card" | "Bank Transfer";
  label: string;
  providerToken: string;
}): Promise<{ id: string }> {
  const raw = await frappeCall<unknown>("payment.register_payment_method", {
    method_type: payload.methodType,
    provider_token: payload.providerToken,
    label: payload.label,
    is_default: 1,
    auto_debit_enabled: 1,
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return { id: String(data["name"] ?? "") };
}
