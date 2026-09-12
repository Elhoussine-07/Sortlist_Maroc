import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Workflow,
  Search,
  TrendingUp,
  ChevronDown,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  Timer,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, SectionCard, StatusBadge, StatusTabs } from "@/components/common/Blocks";
import { ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import type { Opportunity } from "@/lib/types";
import {
  getWorkflowItems,
  getWorkflowStages,
  type WorkflowStep,
} from "@/services/workflow.service";

export const Route = createFileRoute("/_authenticated/agence/workflow")({
  head: () => ({
    meta: [
      { title: "Workflow des opportunités | Sortlist" },
      {
        name: "description",
        content:
          "Suivez chaque étape de traitement de vos opportunités : devis, négociation, signature.",
      },
      { property: "og:title", content: "Workflow des opportunités | Sortlist" },
      {
        property: "og:description",
        content: "Étapes de traitement des opportunités de votre agence.",
      },
    ],
  }),
  component: AgencyWorkflowPage,
});

const STEP_TABS: { value: string; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "quote_sent", label: "Devis" },
  { value: "awaiting_client", label: "Négociation" },
  { value: "won", label: "Signature" },
];

const STAGE_STYLES: Record<
  WorkflowStatus,
  {
    bg: string;
    text: string;
    border: string;
    icon: typeof Clock;
    label: string;
  }
> = {
  quote_sent: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: FileText,
    label: "Devis envoyé",
  },
  awaiting_client: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: MessageSquare,
    label: "Négociation",
  },
  won: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    label: "Signature",
  },
};
type WorkflowStatus = "quote_sent" | "awaiting_client" | "won";

function getStageConfig(step: string): typeof STAGE_STYLES.quote_sent {
  if (step === "quote_sent" || step === "awaiting_client" || step === "won") {
    return STAGE_STYLES[step];
  }
  return STAGE_STYLES.quote_sent;
}

function getStepIcon(step: string): LucideIcon {
  const config = getStageConfig(step);
  return config.icon;
}

const COLUMNS: Column<Opportunity>[] = [
  {
    key: "item",
    header: "Opportunité",
    width: "minmax(0,2.2fr)",
    render: (item) => (
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
          <Workflow className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </div>
        <div className="min-w-0">
          <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
            {item.projectTitle}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
            {item.companyName}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "stage",
    header: "Étape",
    render: (item) => {
      const config = getStageConfig(item.step || item.rawStatus || "");
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
    key: "quote",
    header: "Devis",
    render: (item) => (
      <p className="truncate text-[14px] font-bold text-primary">
        {item.quoteAmount === null ? "—" : `${item.quoteAmount.toLocaleString()} €`}
      </p>
    ),
  },
  {
    key: "remaining",
    header: "Temps restant",
    render: (item) => {
      const hours = item.remainingHours;
      if (hours === null) return <p className="truncate text-[13px] text-muted-foreground">—</p>;
      const isUrgent = hours <= 24;
      return (
        <p
          className={`flex items-center gap-1.5 text-[13px] ${isUrgent ? "text-rose-600 font-semibold" : "text-muted-foreground"}`}
        >
          <Timer className="h-3.5 w-3.5" strokeWidth={1.6} />
          <span className="truncate">{hours} h</span>
        </p>
      );
    },
  },
];

function AgencyWorkflowPage() {
  const stagesQuery = useQuery({
    queryKey: ["agency", "workflow", "stages"],
    queryFn: getWorkflowStages,
  });
  const stages = stagesQuery.data ?? [];
  const isStagesLoading = stagesQuery.isLoading;

  const [query, setQuery] = useState("");
  const [activeStage, setActiveStage] = useState("all");
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");

  const itemsQuery = useQuery({
    queryKey: ["agency", "workflow", "items", activeStage],
    queryFn: () =>
      getWorkflowItems(activeStage === "all" ? {} : { step: activeStage as WorkflowStep }),
  });
  const allItems = itemsQuery.data?.items ?? [];
  const isItemsLoading = itemsQuery.isLoading;
  const counts = itemsQuery.data?.counts ?? {};
  const page = itemsQuery.data?.page ?? 1;
  const totalPages = itemsQuery.data?.totalPages ?? null;

  let items = query.trim()
    ? allItems.filter((item) =>
        `${item.projectTitle} ${item.companyName}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : allItems;

  if (sortDirection === "old") {
    items = [...items].reverse();
  }

  const totalItems = items.length;

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* ✅ EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Workflow className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">Workflow</h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Suivez chaque étape de traitement de vos opportunités.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {totalItems} opportunité{totalItems !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ✅ ÉTAPES DU WORKFLOW MODERNISÉES */}
        <section className="mt-7">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-[16px] font-bold">Étapes du workflow</h2>
                <p className="text-[13px] text-muted-foreground">
                  Répartition de vos opportunités par étape.
                </p>
              </div>
            </div>

            <div className="mt-5">
              {isStagesLoading ? (
                <StackSkeleton count={4} />
              ) : stages.length === 0 ? (
                <EmptyState message="Aucune donnée disponible" />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stages.map((stage) => {
                    const config = getStageConfig(stage.id);
                    const Icon = config.icon;
                    return (
                      <div
                        key={stage.id}
                        className="group rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                            <Icon className="h-5 w-5" strokeWidth={1.7} />
                          </div>
                          <span className="text-2xl font-bold">{stage.count}</span>
                        </div>
                        <p className="mt-3 text-[13px] font-medium text-muted-foreground">
                          {stage.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

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
          <StatusTabs
            tabs={STEP_TABS}
            value={activeStage}
            onChange={setActiveStage}
            counts={counts}
          />
        </div>

        {/* ✅ COMPTEUR + TRI */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {totalItems} opportunité{totalItems !== 1 ? "s" : ""}
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
          <DataTable columns={COLUMNS} rows={items} isLoading={isItemsLoading} />
        </div>

        <ListPagination page={page} totalPages={totalPages} />

        {/* ✅ LIEN VERS OPPORTUNITÉS */}
        <div className="mt-6 rounded-lg border border-border bg-accent/30 p-4 text-center">
          <p className="text-[13px] text-muted-foreground">
            Pour accepter une opportunité ou envoyer un devis, rendez-vous sur l'écran{" "}
            <Link
              to="/agence/opportunites"
              className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
            >
              Opportunités
              <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" strokeWidth={1.8} />
            </Link>
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
