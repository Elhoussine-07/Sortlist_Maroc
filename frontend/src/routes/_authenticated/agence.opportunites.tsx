import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Briefcase,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  CirclePause,
  FileText,
  MapPin,
  Send,
  XCircle,
  type LucideIcon,
  Clock,
  Sparkles,
  Filter,
  Search,
  Building2,
  Wallet,
  CalendarDays,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, StatusTabs, StatusBadge } from "@/components/common/Blocks";
import { ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ActionModal } from "@/components/common/ActionModal";
import { TextField } from "@/components/common/Blocks";
import type { Opportunity, Project } from "@/lib/types";
import {
  acceptOpportunity,
  expressInterest,
  getOpportunities,
  downloadOpportunityCdc,
  getOpportunityCdc,
  refuseOpportunity,
  sendQuote,
  type OpportunityTab,
} from "@/services/opportunities.service";
import { getProject } from "@/services/projects.service";
import { getCategories } from "@/services/agencies.service";
import { signalReady } from "@/services/disputes.service";
import { ApiError, fetchBlob, GATEWAY_URL } from "@/services/http";

export const Route = createFileRoute("/_authenticated/agence/opportunites")({
  head: () => ({
    meta: [
      { title: "Opportunités | Sortlist" },
      {
        name: "description",
        content:
          "Offres disponibles, projets gagnés, en pause, terminés et archivés pour votre agence.",
      },
      { property: "og:title", content: "Opportunités | Sortlist" },
      {
        property: "og:description",
        content: "Parcourez et filtrez les opportunités adressées à votre agence.",
      },
    ],
  }),
  component: AgencyOpportunitiesPage,
});

const TABS = [
  { value: "all", label: "Offres" },
  { value: "available", label: "Disponibles" },
  { value: "applied", label: "Postulé" },
  { value: "won", label: "Gagnées" },
  { value: "paused", label: "En pause" },
  { value: "finished", label: "Terminées" },
  { value: "archived", label: "Archivées" },
];

const BUDGET_OPTIONS: { value: string; label: string }[] = [
  { value: "0-1000", label: "Moins de 1 000 €" },
  { value: "1000-5000", label: "1 000 € - 5 000 €" },
  { value: "5000-20000", label: "5 000 € - 20 000 €" },
  { value: "20000-100000", label: "20 000 € - 100 000 €" },
  { value: "100000-", label: "Plus de 100 000 €" },
];

// ✅ STYLES MODERNISÉS POUR LES STATUTS D'OPPORTUNITÉ
const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: LucideIcon; label: string }
> = {
  Reçue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Briefcase,
    label: "Reçue",
  },
  Acceptée: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: CheckCircle2,
    label: "Acceptée",
  },
  "Devis envoyé": {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Send,
    label: "Devis envoyé",
  },
  Gagnée: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    label: "Gagnée",
  },
  "En pause": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: CirclePause,
    label: "En pause",
  },
  Terminée: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: CheckCheck,
    label: "Terminée",
  },
  Archivée: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: Archive,
    label: "Archivée",
  },
  Refusée: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
    label: "Refusée",
  },
};

// ✅ CORRECTION : Fonction avec fallback par défaut
function getStatusConfig(status: string): (typeof STATUS_STYLES)[keyof typeof STATUS_STYLES] {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES["Reçue"];
  return config as (typeof STATUS_STYLES)[keyof typeof STATUS_STYLES];
}

function tabToOpportunityTab(uiTab: string): OpportunityTab {
  if (uiTab === "all") return "offers";
  return uiTab as OpportunityTab;
}

type OpportunityStatusVisual = {
  icon: LucideIcon;
  className: string;
};

function getOpportunityStatusVisual(
  opportunity: Opportunity,
  activeTab: string,
): OpportunityStatusVisual {
  const rawStatus = (opportunity.rawStatus ?? "").trim();
  const config = getStatusConfig(rawStatus);

  return {
    icon: config.icon,
    className: `${config.bg} ${config.text}`,
  };
}

function isAcceptedAwaitingQuote(opportunity: Opportunity): boolean {
  return opportunity.rawStatus === "Acceptée";
}

function isPendingAgencyDecision(opportunity: Opportunity): boolean {
  return opportunity.rawStatus === "Reçue";
}

function AgencyOpportunitiesPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const [openingCdcId, setOpeningCdcId] = useState<string | null>(null);

  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const subCategoryOptions = (categoriesQuery.data ?? []).flatMap((category) =>
    category.subCategories.map((sub) => ({ id: sub.id, name: sub.name })),
  );

  const [quoteTarget, setQuoteTarget] = useState<Opportunity | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");

  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);

  async function handleViewProjectDetails(projectId: string) {
    setLoadingDetailsId(projectId);
    try {
      const project = await getProject(projectId);
      setDetailsProject(project);
    } catch (error) {
      toast(
        error instanceof ApiError ? error.message : "Impossible de charger les détails du projet.",
      );
    } finally {
      setLoadingDetailsId(null);
    }
  }

  async function handleOpenCdc(opportunityId: string) {
    setOpeningCdcId(opportunityId);
    try {
      const blob = await downloadOpportunityCdc(opportunityId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible d'ouvrir le CDC.");
    } finally {
      setOpeningCdcId(null);
    }
  }

  const opportunityTab = tabToOpportunityTab(activeTab);

  const opportunitiesQuery = useQuery({
    queryKey: [
      "agency",
      "opportunities",
      opportunityTab,
      page,
      subCategoryFilter,
      budgetFilter,
      locationFilter,
    ],
    queryFn: () =>
      getOpportunities({
        tab: opportunityTab,
        page,
        pageSize: 20,
        ...(subCategoryFilter ? { subCategory: subCategoryFilter } : {}),
        ...(budgetFilter ? { budget: budgetFilter } : {}),
        ...(locationFilter ? { location: locationFilter } : {}),
      }),
  });

  const opportunities = opportunitiesQuery.data?.items ?? [];
  const isLoading = opportunitiesQuery.isLoading;
  const counts = opportunitiesQuery.data?.counts ?? {};
  const total = opportunitiesQuery.data?.total ?? null;
  const totalPages = opportunitiesQuery.data?.totalPages ?? null;

  const searchFilteredOpportunities = query.trim()
    ? opportunities.filter((opportunity) =>
        `${opportunity.projectTitle} ${opportunity.companyName}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : opportunities;

  const filteredOpportunities =
    sortDirection === "old"
      ? [...searchFilteredOpportunities].reverse()
      : searchFilteredOpportunities;

  function invalidateOpportunities() {
    void queryClient.invalidateQueries({ queryKey: ["agency", "opportunities"] });
  }

  const acceptMutation = useMutation({
    mutationFn: acceptOpportunity,
    onSuccess: () => {
      toast("Opportunité acceptée", {
        description: "Envoyez votre devis pour passer à l'étape suivante.",
      });
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'accepter l'opportunité.");
    },
  });

  const expressInterestMutation = useMutation({
    mutationFn: expressInterest,
    onSuccess: () => {
      toast("Intérêt manifesté", {
        description: "Ce projet apparaît désormais dans vos offres — envoyez votre devis.",
      });
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de manifester votre intérêt.");
    },
  });

  const refuseMutation = useMutation({
    mutationFn: refuseOpportunity,
    onSuccess: () => {
      toast("Opportunité refusée");
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de refuser l'opportunité.");
    },
  });

  const sendQuoteMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => sendQuote(id, amount),
    onSuccess: () => {
      toast("Devis envoyé", { description: "Le client a été notifié de votre proposition." });
      invalidateOpportunities();
      setQuoteTarget(null);
      setQuoteAmount("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Envoi du devis impossible.");
    },
  });

  const signalReadyMutation = useMutation({
    mutationFn: signalReady,
    onSuccess: () => {
      toast("Signalement envoyé", { description: "Le client a été notifié." });
      invalidateOpportunities();
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Endpoint indisponible pour le moment.");
    },
  });

  const columns: Column<Opportunity>[] = [
    {
      key: "opportunity",
      header: "Opportunité",
      width: "minmax(0,2.2fr)",
      render: (opportunity) => {
        const statusVisual = getOpportunityStatusVisual(opportunity, activeTab);
        const StatusIcon = statusVisual.icon;

        return (
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${statusVisual.className}`}
              title={opportunity.stepLabel || opportunity.rawStatus || "Projet"}
            >
              <StatusIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>

            <div className="min-w-0">
              {activeTab === "available" ? (
                <button
                  type="button"
                  onClick={() =>
                    void handleViewProjectDetails(opportunity.project ?? opportunity.id)
                  }
                  disabled={loadingDetailsId === (opportunity.project ?? opportunity.id)}
                  className="font-display truncate text-left text-[14px] font-bold leading-tight tracking-tight text-foreground underline-offset-2 hover:text-primary hover:underline disabled:opacity-60"
                >
                  {loadingDetailsId === (opportunity.project ?? opportunity.id)
                    ? "Chargement..."
                    : opportunity.projectTitle}
                </button>
              ) : (
                <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight">
                  {opportunity.projectTitle}
                </p>
              )}
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground/70">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
                {opportunity.companyName || "Client"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Catégorie",
      render: (opportunity) => (
        <p className="truncate text-[13px] font-medium text-foreground">
          {opportunity.category || "Non catégorisé"}
        </p>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      render: (opportunity) => (
        <p className="truncate text-[13px] font-medium">
          {opportunity.budgetMin === null || opportunity.budgetMax === null
            ? "Non défini"
            : `${opportunity.budgetMin.toLocaleString()} € — ${opportunity.budgetMax.toLocaleString()} €`}
        </p>
      ),
    },
    {
      key: "location",
      header: "Localisation",
      render: (opportunity) => (
        <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
          <span className="truncate">{opportunity.location || "Non spécifiée"}</span>
        </p>
      ),
    },
    {
      key: "step",
      header: "Statut",
      render: (opportunity) => {
        const config = getStatusConfig(opportunity.rawStatus || "");
        const Icon = config.icon;
        return (
          <span
            className={`
              inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold
              ${config.bg} ${config.text} border ${config.border}
              shadow-sm transition-all hover:scale-105
            `}
          >
            <Icon className="h-3 w-3" strokeWidth={2} />
            {config.label}
          </span>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (opportunity) => (
        <div className="flex flex-wrap gap-2">
          {activeTab === "available" && (
            <button
              type="button"
              onClick={() => expressInterestMutation.mutate(opportunity.id)}
              disabled={expressInterestMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
              Postuler
            </button>
          )}

          {activeTab === "all" && isPendingAgencyDecision(opportunity) && (
            <>
              <button
                type="button"
                onClick={() => acceptMutation.mutate(opportunity.id)}
                disabled={acceptMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                Accepter
              </button>
              <button
                type="button"
                onClick={() => refuseMutation.mutate(opportunity.id)}
                disabled={refuseMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm disabled:opacity-60"
              >
                <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                Refuser
              </button>
            </>
          )}

          {(activeTab === "all" || activeTab === "applied") &&
            isAcceptedAwaitingQuote(opportunity) && (
              <button
                type="button"
                onClick={() => {
                  setQuoteTarget(opportunity);
                  setQuoteAmount("");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
                Envoyer un devis
              </button>
            )}

          {activeTab === "paused" && (
            <button
              type="button"
              onClick={() => signalReadyMutation.mutate(opportunity.id)}
              disabled={signalReadyMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
              Prêt à reprendre
            </button>
          )}

          {activeTab !== "available" && (
            <button
              onClick={() => void handleOpenCdc(opportunity.id)}
              type="button"
              disabled={openingCdcId === opportunity.id}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:bg-accent hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
              {openingCdcId === opportunity.id ? "..." : "CDC"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* ✅ EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[24px] font-bold tracking-tight">Opportunités</h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Répondez aux projets qui correspondent à vos compétences.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {total ?? 0} opportunités
            </span>
          </div>
        </div>

        {/* ✅ RECHERCHE MODERNISÉE */}
        <div className="mt-7">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une opportunité..."
              className="w-full rounded-xl border border-border bg-card px-10 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md transition-all"
            />
          </div>
        </div>

        {/* ✅ TABS MODERNISÉS */}
        <div className="mt-6">
          <StatusTabs tabs={TABS} value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        {/* ✅ FILTRES MODERNISÉS */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Catégorie
            </label>
            <select
              value={subCategoryFilter}
              onChange={(event) => {
                setSubCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all"
            >
              <option value="">Toutes les catégories</option>
              {subCategoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Budget
            </label>
            <select
              value={budgetFilter}
              onChange={(event) => {
                setBudgetFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all"
            >
              <option value="">Tous les budgets</option>
              {BUDGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Localisation
            </label>
            <input
              type="text"
              value={locationFilter}
              onChange={(event) => {
                setLocationFilter(event.target.value);
                setPage(1);
              }}
              placeholder="Toutes les villes"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-sm transition-all"
            />
          </div>
        </div>

        {/* ✅ COMPTEUR + TRI */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total ?? 0} opportunité{total !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Trier par : {sortDirection === "recent" ? "Plus récentes" : "Plus anciennes"}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* ✅ TABLEAU MODERNISÉ */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable columns={columns} rows={filteredOpportunities} isLoading={isLoading} />
        </div>

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ✅ MODAL DE DEVIS MODERNISÉE */}
      <ActionModal
        open={quoteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setQuoteTarget(null);
            setQuoteAmount("");
          }
        }}
        title="Envoyer un devis"
        {...(quoteTarget
          ? {
              description: `Proposez un montant pour "${quoteTarget.projectTitle}" — ${quoteTarget.companyName}.`,
            }
          : {})}
        confirmLabel={sendQuoteMutation.isPending ? "Envoi..." : "Envoyer le devis"}
        onConfirm={() => {
          const amount = Number(quoteAmount);
          if (!quoteTarget || !quoteAmount.trim() || Number.isNaN(amount) || amount <= 0) {
            toast("Renseignez un montant valide.");
            return;
          }
          sendQuoteMutation.mutate({ id: quoteTarget.id, amount });
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/30 p-4 text-center">
            <p className="text-[13px] text-muted-foreground">Montant proposé</p>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                €
              </span>
              <input
                type="number"
                min={0}
                step={100}
                value={quoteAmount}
                onChange={(event) => setQuoteAmount(event.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background py-3 pl-8 pr-4 text-center text-2xl font-bold outline-none focus:border-primary/50 focus:shadow-sm transition-all"
              />
            </div>
          </div>
          {quoteTarget && (
            <div className="grid grid-cols-2 gap-2 text-[13px] text-muted-foreground">
              <span>Projet : {quoteTarget.projectTitle}</span>
              <span className="text-right">Client : {quoteTarget.companyName}</span>
            </div>
          )}
        </div>
      </ActionModal>

      {/* ✅ MODAL DE DÉTAILS MODERNISÉE */}
      <ActionModal
        open={detailsProject !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsProject(null);
        }}
        title={detailsProject?.title ?? "Détails du projet"}
        confirmLabel={expressInterestMutation.isPending ? "Envoi..." : "Postuler"}
        cancelLabel="Fermer"
        onConfirm={() => {
          if (!detailsProject) return;
          expressInterestMutation.mutate(detailsProject.id);
          setDetailsProject(null);
        }}
      >
        {detailsProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Catégorie
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.category || "Non catégorisé"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Sous-catégorie
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.subCategory || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Budget</p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.budgetMin !== null && detailsProject.budgetMax !== null
                    ? `${detailsProject.budgetMin.toLocaleString()} € — ${detailsProject.budgetMax.toLocaleString()} €`
                    : "Non défini"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Localisation
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {detailsProject.location || "Non spécifiée"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Délai souhaité
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.deliveryDelayDays
                    ? `${detailsProject.deliveryDelayDays} jours`
                    : "Non défini"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Statut</p>
                <p className="mt-1 text-[13px] font-semibold">
                  {detailsProject.statusLabel || "—"}
                </p>
              </div>
            </div>
            {detailsProject.description && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.6]">
                  {detailsProject.description}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </ActionModal>
    </DashboardShell>
  );
}
