import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  FileText,
  Wallet,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  Euro,
  Receipt,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  FormSkeleton,
  SearchInput,
  SectionCard,
  StatCard,
  StatGrid,
  StatusBadge,
  StatusTabs,
  TextField,
} from "@/components/common/Blocks";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatSkeleton } from "@/components/common/Skeletons";
import type { Invoice } from "@/lib/types";
import {
  downloadInvoice,
  getInvoices,
  getInvoicesSummary,
  getPaymentMethods,
  payInvoice,
  registerPaymentMethod,
} from "@/services/invoices.service";
import { ApiError } from "@/services/http";
import { useInvoicesStore } from "@/store/invoices.store";

export const Route = createFileRoute("/_authenticated/agence/facturation")({
  head: () => ({
    meta: [
      { title: "Facturation - Sortlist Pro" },
      {
        name: "description",
        content:
          "Suivez vos factures émises et reçues, filtrez par statut et téléchargez vos documents.",
      },
      { property: "og:title", content: "Facturation - Sortlist Pro" },
      {
        property: "og:description",
        content: "Factures et paiements de votre agence.",
      },
    ],
  }),
  component: AgencyInvoicingPage,
});

const TABS = [
  { value: "issued", label: "Émises" },
  { value: "received", label: "Reçues" },
  { value: "paid", label: "Payées" },
  { value: "late", label: "En retard" },
];

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "?";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function sumAmounts(invoices: Invoice[], status?: string): number {
  const filtered = status ? invoices.filter((inv) => inv.status === status) : invoices;

  const totalCents = filtered.reduce((sum, invoice) => {
    const amount = invoice.amountDue ?? invoice.amount;
    if (typeof amount !== "number" || isNaN(amount)) return sum;
    const cents = Math.round(amount * 100);
    return sum + cents;
  }, 0);

  return totalCents / 100;
}

function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function describePaymentDeadline(
  invoice: Invoice,
  now: number,
): { label: string; expired: boolean } | null {
  if (invoice.status !== "to_pay" || !invoice.paymentDeadline) return null;
  const deadline = new Date(invoice.paymentDeadline).getTime();
  if (Number.isNaN(deadline)) return null;

  const diffMinutes = Math.round((deadline - now) / 60_000);
  if (diffMinutes <= 0) {
    return { label: "Délai dépassé - suspension imminente", expired: true };
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return {
    label: `${hours}h${minutes.toString().padStart(2, "0")} avant suspension auto`,
    expired: false,
  };
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    late: "bg-red-100 text-red-700",
    to_pay: "bg-yellow-100 text-yellow-700",
    pending: "bg-blue-100 text-blue-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

function getStatusIcon(status: string) {
  const icons: Record<
    string,
    typeof CheckCircle | typeof AlertCircle | typeof Clock | typeof FileText
  > = {
    paid: CheckCircle,
    late: AlertCircle,
    to_pay: Clock,
    pending: Clock,
  };
  return icons[status] || FileText;
}

function buildColumns(
  onDownload: (invoice: Invoice) => void,
  downloadingId: string | null,
  onPay: (invoice: Invoice) => void,
  payingId: string | null,
  now: number,
): Column<Invoice>[] {
  return [
    {
      key: "invoice",
      header: "Facture",
      width: "minmax(0,2.2fr)",
      render: (invoice) => (
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-0.5 rounded-lg p-1.5 ${
              invoice.status === "paid"
                ? "bg-green-50"
                : invoice.status === "late"
                  ? "bg-red-50"
                  : "bg-blue-50"
            }`}
          >
            <FileText
              className={`h-[18px] w-[18px] shrink-0 ${
                invoice.status === "paid"
                  ? "text-green-500"
                  : invoice.status === "late"
                    ? "text-red-500"
                    : "text-blue-500"
              }`}
              strokeWidth={1.6}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold">{invoice.projectTitle}</p>
            <p className="truncate text-[13px] text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {invoice.companyName}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant dû",
      render: (invoice) => (
        <div className="flex items-center gap-1.5">
          <Euro className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="truncate text-[14px] font-bold">
            {formatCurrency(invoice.amountDue ?? invoice.amount)}
          </p>
        </div>
      ),
    },
    {
      key: "issuedAt",
      header: "Émise le",
      render: (invoice) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="truncate text-[13px] text-muted-foreground">{invoice.issuedAt}</p>
        </div>
      ),
    },
    {
      key: "paymentDeadline",
      header: "Échéance",
      render: (invoice) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="truncate text-[13px] text-muted-foreground">
            {invoice.paymentDeadline
              ? new Date(invoice.paymentDeadline).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "?"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (invoice) => {
        const StatusIcon = getStatusIcon(invoice.status);
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${getStatusColor(invoice.status)}`}
          >
            <StatusIcon className="h-3 w-3" />
            {invoice.statusLabel}
          </span>
        );
      },
    },
    {
      key: "paymentDeadlineCountdown",
      header: "Délai commission",
      render: (invoice) => {
        const deadline = describePaymentDeadline(invoice, now);
        if (!deadline) return <p className="text-[13px] text-muted-foreground">—</p>;
        return (
          <span
            className={
              deadline.expired
                ? "inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[12px] font-semibold text-red-700 animate-pulse"
                : "inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-medium text-blue-700"
            }
          >
            <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
            {deadline.label}
          </span>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (invoice) => (
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status !== "paid" ? (
            <button
              type="button"
              onClick={() => onPay(invoice)}
              disabled={payingId === invoice.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:shadow-md hover:shadow-primary/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <Wallet className="h-3.5 w-3.5" strokeWidth={1.8} />
              {payingId === invoice.id ? "Paiement..." : "Payer"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDownload(invoice)}
            disabled={downloadingId === invoice.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-[13px] font-semibold transition-all hover:bg-accent hover:border-primary/30 disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            {downloadingId === invoice.id ? "Téléchargement..." : "Télécharger"}
          </button>
        </div>
      ),
    },
  ];
}

function filterByTab(invoices: Invoice[], tab: string): Invoice[] {
  if (tab === "paid") return invoices.filter((invoice) => invoice.status === "paid");
  if (tab === "late") return invoices.filter((invoice) => invoice.status === "late");
  return invoices;
}

const paymentMethodSchema = z.object({
  methodType: z.enum(["Card", "Bank Transfer"]),
  label: z.string().trim().min(1, "Champ requis").max(80),
  providerToken: z.string().trim().min(1, "Champ requis").max(80),
});

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>;

function PaymentMethodSection() {
  const queryClient = useQueryClient();
  const methodsQuery = useQuery({
    queryKey: ["agency", "payment-methods"],
    queryFn: getPaymentMethods,
  });
  const methods = methodsQuery.data ?? [];
  const defaultMethod = methods.find((method) => method.isDefault) ?? null;

  const form = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { methodType: "Card", label: "", providerToken: "" },
  });

  const registerMutation = useMutation({
    mutationFn: registerPaymentMethod,
    onSuccess: () => {
      toast.success("Moyen de paiement enregistré comme méthode par défaut.");
      form.reset({ methodType: "Card", label: "", providerToken: "" });
      void queryClient.invalidateQueries({ queryKey: ["agency", "payment-methods"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Impossible d'enregistrer ce moyen de paiement.",
      );
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    registerMutation.mutate(values);
  });

  return (
    <SectionCard
      title="Moyen de paiement"
      description="Utilisé pour prélever automatiquement la commission de la plateforme dès qu'un client accepte un devis - aucune facture à régler manuellement tant qu'un moyen par défaut est configuré."
    >
      {methodsQuery.isPending ? (
        <FormSkeleton fields={2} />
      ) : (
        <div className="space-y-6">
          {defaultMethod ? (
            <div className="group flex items-center gap-4 rounded-xl border border-green-200 bg-green-50/50 p-4 transition-all hover:border-green-300 hover:bg-green-50">
              <div className="rounded-lg bg-green-100 p-2.5">
                <CreditCard className="h-5 w-5 text-green-600" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{defaultMethod.label}</p>
                <p className="text-[12.5px] text-muted-foreground flex items-center gap-2">
                  {defaultMethod.methodType === "Card"
                    ? "💳 Carte bancaire"
                    : "🏦 Virement bancaire"}
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    <CheckCircle className="h-2.5 w-2.5" />
                    Défaut
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-green-600 opacity-0 transition-opacity group-hover:opacity-100">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50/50 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-[13.5px] text-muted-foreground">
                Aucun moyen de paiement enregistré — la commission restera en attente de règlement
                manuel tant qu'aucun n'est configuré ci-dessous.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-background/50 p-5">
            <h4 className="mb-4 text-[14px] font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Ajouter un nouveau moyen de paiement
            </h4>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-3" noValidate>
              <label className="block">
                <span className="text-[13px] font-medium text-muted-foreground">Type</span>
                <select
                  {...form.register("methodType")}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Card">💳 Carte bancaire</option>
                  <option value="Bank Transfer">🏦 Virement bancaire (IBAN)</option>
                </select>
              </label>
              <TextField
                label="Libellé"
                placeholder="Visa ...1234 / IBAN FR76..."
                error={form.formState.errors.label?.message}
                {...form.register("label")}
              />
              <TextField
                label="Numéro / IBAN"
                placeholder="4242 4242 4242 4242"
                error={form.formState.errors.providerToken?.message}
                {...form.register("providerToken")}
              />
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {registerMutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Enregistrer comme méthode par défaut
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function AgencyInvoicingPage() {
  const [page] = useState(1);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("issued");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const now = useNow();
  const queryClient = useQueryClient();

  const storeInvoices = useInvoicesStore((state) => state.invoices);
  const setStoreInvoices = useInvoicesStore((state) => state.setInvoices);
  const setStoreSummary = useInvoicesStore((state) => state.setSummary);
  const setStoreLoading = useInvoicesStore((state) => state.setLoading);
  const totalPaidStore = useInvoicesStore((state) => state.totalPaid);

  const invoicesQuery = useQuery({
    queryKey: ["agency", "invoices", "all"],
    queryFn: () => getInvoices({ status: "all", page, pageSize: 100 }),
  });
  const summaryQuery = useQuery({
    queryKey: ["agency", "invoices", "summary"],
    queryFn: getInvoicesSummary,
  });

  useEffect(() => {
    setStoreLoading(invoicesQuery.isLoading);
    if (invoicesQuery.data) setStoreInvoices(invoicesQuery.data.items);
  }, [invoicesQuery.data, invoicesQuery.isLoading, setStoreInvoices, setStoreLoading]);

  useEffect(() => {
    if (summaryQuery.data) setStoreSummary(summaryQuery.data);
  }, [summaryQuery.data, setStoreSummary]);

  const isLoading = invoicesQuery.isLoading;
  const isSummaryLoading = summaryQuery.isLoading;

  const tabFiltered = filterByTab(storeInvoices, activeTab);
  const searchFiltered = query.trim()
    ? tabFiltered.filter((invoice) =>
        `${invoice.projectTitle} ${invoice.companyName}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : tabFiltered;
  const invoices = [...searchFiltered].sort((a, b) =>
    sortDirection === "recent"
      ? b.issuedAt.localeCompare(a.issuedAt)
      : a.issuedAt.localeCompare(b.issuedAt),
  );

  const counts: Record<string, number> = {
    issued: storeInvoices.length,
    received: storeInvoices.length,
    paid: storeInvoices.filter((invoice) => invoice.status === "paid").length,
    late: storeInvoices.filter((invoice) => invoice.status === "late").length,
  };

  const totalLate = sumAmounts(storeInvoices, "late");
  const totalIssued = sumAmounts(storeInvoices);

  const summary = {
    totalIssued,
    totalReceived: totalIssued,
    totalPaid: totalPaidStore ?? 0,
    totalLate,
  };

  async function handlePay(invoice: Invoice) {
    setPayingId(invoice.id);
    try {
      await payInvoice(invoice.id);
      toast.success("Facture réglée.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agency", "invoices", "all"] }),
        queryClient.invalidateQueries({ queryKey: ["agency", "invoices", "summary"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Paiement impossible.");
    } finally {
      setPayingId(null);
    }
  }

  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice.id);
    try {
      const blob = await downloadInvoice(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = invoice.invoiceNumber ?? invoice.id;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Téléchargement impossible.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <DashboardShell role="agency">
      <div className="mx-auto max-w-[1080px]">
        {/* En-tête amélioré */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-transparent p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />

          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-[24px] font-bold tracking-tight">Facturation</h1>
                <p className="mt-0.5 text-[14px] text-muted-foreground">
                  Suivez vos paiements et téléchargez vos factures
                </p>
              </div>
            </div>
            {!isSummaryLoading && (
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-[13px] font-medium text-green-700">
                    {formatCurrency(summary.totalPaid)} payés
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-7">
          <PaymentMethodSection />
        </div>

        <section className="mt-7">
          {isSummaryLoading ? (
            <StatSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-blue-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    Total émis
                  </p>
                  <div className="rounded-lg bg-blue-50 p-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </div>
                <p className="mt-2 text-[20px] font-bold">{formatCurrency(summary.totalIssued)}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-green-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    Total reçu
                  </p>
                  <div className="rounded-lg bg-green-50 p-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                  </div>
                </div>
                <p className="mt-2 text-[20px] font-bold">
                  {formatCurrency(summary.totalReceived)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-green-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    Total payé
                  </p>
                  <div className="rounded-lg bg-green-50 p-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  </div>
                </div>
                <p className="mt-2 text-[20px] font-bold">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-red-200 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    En retard
                  </p>
                  <div className="rounded-lg bg-red-50 p-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  </div>
                </div>
                <p className="mt-2 text-[20px] font-bold text-red-600">
                  {formatCurrency(summary.totalLate)}
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="mt-7">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une facture par projet ou client..."
          />
        </div>

        <div className="mt-6">
          <StatusTabs tabs={TABS} value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
              Statut
            </label>
            <select className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:border-primary">
              <option>Tous les statuts</option>
              <option>Payé</option>
              <option>En attente</option>
              <option>En retard</option>
            </select>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
              Période
            </label>
            <select className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:border-primary">
              <option>Toutes les périodes</option>
              <option>Ce mois</option>
              <option>Ce trimestre</option>
              <option>Cette année</option>
            </select>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
              Client
            </label>
            <select className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:border-primary">
              <option>Tous les clients</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {counts[activeTab] ?? 0} facture{counts[activeTab] !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-all hover:bg-accent hover:border-primary/30"
          >
            Trier par : {sortDirection === "recent" ? "Plus récentes" : "Plus anciennes"}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-4">
          <DataTable
            columns={buildColumns(handleDownload, downloadingId, handlePay, payingId, now)}
            rows={invoices}
            isLoading={isLoading}
          />
        </div>

        <ListPagination page={page} totalPages={1} />
      </div>
    </DashboardShell>
  );
}
