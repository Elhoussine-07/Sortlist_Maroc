import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Clock, CreditCard, Download, FileText } from "lucide-react";
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
  registerPaymentMethod,
} from "@/services/invoices.service";
import { ApiError } from "@/services/http";
import { useInvoicesStore } from "@/store/invoices.store";

/** Facturation (Agence) — factures émises / reçues, filtres, téléchargement. */
export const Route = createFileRoute("/_authenticated/agence/facturation")({
  head: () => ({
    meta: [
      { title: "Facturation — Sortlist Pro" },
      {
        name: "description",
        content:
          "Suivez vos factures émises et reçues, filtrez par statut et téléchargez vos documents.",
      },
      { property: "og:title", content: "Facturation — Sortlist Pro" },
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

/** Rafraîchit `Date.now()` toutes les 60s — même esprit que
 * `client.mes-projets.$id.tsx::useNow`, pour le compte à rebours de
 * règlement de la commission avant suspension automatique du projet. */
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** CDC (demande explicite) : 48h (configurable) à partir de la création de
 * la facture de commission pour la régler, sans quoi le projet est
 * automatiquement suspendu (cf. `PlatformSettings.invoice_payment_deadline_hours`,
 * `tasks.suspend_projects_for_unpaid_commission`). */
function describePaymentDeadline(
  invoice: Invoice,
  now: number,
): { label: string; expired: boolean } | null {
  if (invoice.status !== "to_pay" || !invoice.paymentDeadline) return null;
  const deadline = new Date(invoice.paymentDeadline).getTime();
  if (Number.isNaN(deadline)) return null;

  const diffMinutes = Math.round((deadline - now) / 60_000);
  if (diffMinutes <= 0) {
    return { label: "Délai dépassé — suspension imminente", expired: true };
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return {
    label: `${hours}h${minutes.toString().padStart(2, "0")} avant suspension auto`,
    expired: false,
  };
}

function buildColumns(
  onDownload: (invoice: Invoice) => void,
  downloadingId: string | null,
  now: number,
): Column<Invoice>[] {
  return [
    {
      key: "invoice",
      header: "Facture",
      width: "minmax(0,2.2fr)",
      render: (invoice) => (
        <div className="flex min-w-0 items-start gap-3">
          <FileText className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold">{invoice.projectTitle}</p>
            <p className="truncate text-[13px] text-muted-foreground">{invoice.companyName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      render: (invoice) => <p className="truncate text-[13px] font-semibold">{invoice.amount}</p>,
    },
    {
      key: "issuedAt",
      header: "Émise le",
      render: (invoice) => (
        <p className="truncate text-[13px] text-muted-foreground">{invoice.issuedAt}</p>
      ),
    },
    {
      key: "dueAt",
      header: "Échéance",
      render: (invoice) => (
        <p className="truncate text-[13px] text-muted-foreground">{invoice.dueAt}</p>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (invoice) => <StatusBadge label={invoice.statusLabel} />,
    },
    {
      key: "paymentDeadline",
      header: "Délai commission",
      render: (invoice) => {
        const deadline = describePaymentDeadline(invoice, now);
        if (!deadline) return <p className="text-[13px] text-muted-foreground">—</p>;
        return (
          <span
            className={
              deadline.expired
                ? "flex w-fit items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[12.5px] font-semibold text-destructive"
                : "flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[12.5px] font-semibold"
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
        <button
          type="button"
          onClick={() => onDownload(invoice)}
          disabled={downloadingId === invoice.id}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:opacity-60"
        >
          <Download className="h-3 w-3" strokeWidth={1.8} />
          {downloadingId === invoice.id ? "Téléchargement..." : "Télécharger"}
        </button>
      ),
    },
  ];
}

/**
 * Le backend (`payment.list_invoices`) ne distingue pas "émises" vs "reçues"
 * (pas de champ de direction confirmé sur `Invoice`) — seul le statut
 * (paid/to_pay/late) est fiable. Les onglets "Émises"/"Reçues" affichent donc
 * la même liste complète, faute de mieux ; "Payées"/"En retard" filtrent
 * réellement par statut.
 */
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

/**
 * CDC §2.5.1 : « il n'y a pas d'espace dédié pour compte bancaire/moyen de
 * paiement, qui doit être choisi et adopté comme méthode par défaut » — la
 * commission prélevée à l'acceptation d'un devis (`Proposal._create_invoice`)
 * ne peut se régler automatiquement que si l'agence a déjà un moyen de
 * paiement par défaut enregistré ici. Chaque nouvel ajout devient
 * automatiquement le défaut (cf. `registerPaymentMethod`).
 */
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
      description="Utilisé pour prélever automatiquement la commission de la plateforme dès qu'un client accepte un devis — aucune facture à régler manuellement tant qu'un moyen par défaut est configuré."
    >
      {methodsQuery.isPending ? (
        <FormSkeleton fields={2} />
      ) : (
        <div className="space-y-5">
          {defaultMethod ? (
            <div className="flex items-center gap-3 rounded-md border border-border p-3">
              <CreditCard className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold">{defaultMethod.label}</p>
                <p className="text-[12.5px] text-muted-foreground">
                  {defaultMethod.methodType === "Card" ? "Carte bancaire" : "Virement bancaire"} —
                  méthode par défaut
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[13.5px] text-muted-foreground">
              Aucun moyen de paiement enregistré — la commission restera en attente de règlement
              manuel tant qu'aucun n'est configuré ci-dessous.
            </p>
          )}

          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-3" noValidate>
            <label className="block">
              <span className="text-[13px] text-muted-foreground">Type</span>
              <select
                {...form.register("methodType")}
                className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[14px] outline-none focus:border-foreground"
              >
                <option value="Card">Carte bancaire</option>
                <option value="Bank Transfer">Virement bancaire (IBAN)</option>
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
                className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registerMutation.isPending
                  ? "Enregistrement..."
                  : "Enregistrer comme méthode par défaut"}
              </button>
            </div>
          </form>
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
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const now = useNow();

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

  // Le store `useInvoicesStore` (déjà présent dans le repo mais jusqu'ici
  // inutilisé au profit d'un `useState` local) est la source de vérité — on
  // l'alimente à chaque succès de requête plutôt que de garder les données
  // uniquement dans le cache React Query.
  useEffect(() => {
    setStoreLoading(invoicesQuery.isLoading);
    if (invoicesQuery.data) setStoreInvoices(invoicesQuery.data.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoicesQuery.data, invoicesQuery.isLoading]);

  useEffect(() => {
    if (summaryQuery.data) setStoreSummary(summaryQuery.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryQuery.data]);

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

  const totalLate = storeInvoices
    .filter((invoice) => invoice.status === "late")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalIssued = storeInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  const summary = {
    totalIssued,
    totalReceived: totalIssued,
    totalPaid: totalPaidStore,
    totalLate,
  };

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
      toast(error instanceof ApiError ? error.message : "Téléchargement impossible.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <DashboardShell role="agency">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">Facturation</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Suivez vos paiements et téléchargez vos factures.
        </p>

        <div className="mt-7">
          <PaymentMethodSection />
        </div>

        <section className="mt-7">
          {isSummaryLoading ? (
            <StatSkeleton count={4} />
          ) : (
            <StatGrid>
              <StatCard
                icon={FileText}
                label="Total émis"
                value={summary.totalIssued === null ? "—" : String(summary.totalIssued)}
              />
              <StatCard
                icon={FileText}
                label="Total reçu"
                value={summary.totalReceived === null ? "—" : String(summary.totalReceived)}
              />
              <StatCard
                icon={FileText}
                label="Total payé"
                value={summary.totalPaid === null ? "—" : String(summary.totalPaid)}
              />
              <StatCard
                icon={FileText}
                label="En retard"
                value={summary.totalLate === null ? "—" : String(summary.totalLate)}
              />
            </StatGrid>
          )}
        </section>

        <div className="mt-7">
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une facture..." />
        </div>

        <div className="mt-6">
          <StatusTabs tabs={TABS} value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Filtre statut côté API : { status: "paid" | "to_pay" | "late" } */}
          <FilterSelect label="Statut" placeholder="Tous les statuts" />
          {/* Filtre période côté API : { period } */}
          <FilterSelect label="Période" placeholder="Toutes les périodes" />
          {/* API CALL : GET /api/invoices/clients */}
          <FilterSelect label="Client" placeholder="Tous les clients" />
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">{counts[activeTab] ?? 0} factures</p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Trier par : {sortDirection === "recent" ? "Plus récentes" : "Plus anciennes"}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-4">
          <DataTable
            columns={buildColumns(handleDownload, downloadingId, now)}
            rows={invoices}
            isLoading={isLoading}
          />
        </div>

        <ListPagination page={page} totalPages={1} />
      </div>
    </DashboardShell>
  );
}
