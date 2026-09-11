import type { Invoice, PaginatedResponse } from "@/lib/types";
import { camelizeKeys, fetchBlob, GATEWAY_URL, frappeCall } from "@/services/http";

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

export async function getInvoicesSummary(): Promise<{
  totalPaid: number;
  pendingAmount: number;
}> {
  const raw = await frappeCall<unknown>("payment.list_invoices", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  const items = list.map((item) => mapInvoice(item));

  return items.reduce(
    (summary, invoice) => {
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

export async function downloadInvoice(id: string): Promise<Blob> {
  const url = `${GATEWAY_URL}/api/method/platform_core.platform_core.api.payment.download_invoice_pdf`;
  return fetchBlob(url, undefined, { invoice: id });
}

export async function payInvoice(id: string): Promise<{ payment: string; status: string }> {
  const raw = await frappeCall<unknown>("payment.pay_invoice", { invoice: id });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    payment: String(data["payment"] ?? ""),
    status: String(data["status"] ?? ""),
  };
}

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

export async function getPaymentMethods(): Promise<PaymentMethodSummary[]> {
  const raw = await frappeCall<unknown>("payment.list_payment_methods", {});
  const list = (Array.isArray(raw) ? raw : []) as unknown[];
  return list.map((item) => mapPaymentMethod(item));
}

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
