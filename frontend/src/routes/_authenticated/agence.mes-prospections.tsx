import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Send,
  Search,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, StatusTabs, StatusBadge } from "@/components/common/Blocks";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { getLeads, type Lead } from "@/services/prospection.service";

export const Route = createFileRoute("/_authenticated/agence/mes-prospections")({
  head: () => ({
    meta: [
      { title: "Mes prospections | Sortlist" },
      {
        name: "description",
        content: "Recherchez et suivez vos prospections envoyées, leurs réponses et leur statut.",
      },
      { property: "og:title", content: "Mes prospections | Sortlist" },
      {
        property: "og:description",
        content: "Suivi des prospections de votre agence.",
      },
    ],
  }),
  component: AgencyMyProspectionsPage,
});

const TABS = [
  { value: "all", label: "Toutes" },
  { value: "sent", label: "Envoyées" },
  { value: "answered", label: "Répondues" },
  { value: "no_answer", label: "Sans réponse" },
];

// ✅ TYPE EXPLICITE POUR LES STATUTS
type StatusConfig = {
  bg: string;
  text: string;
  border: string;
  icon: LucideIcon;
  label: string;
};

// ? TYPES STRICTS POUR LES STATUTS
type StatusKey = "sent" | "answered" | "no_answer" | "hot" | "warm" | "cold";

// ? STYLES MODERNISÉS POUR LES STATUTS
const STATUS_STYLES: Record<StatusKey, StatusConfig> = {
  sent: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Send,
    label: "Envoyé",
  },
  answered: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
    label: "Répondu",
  },
  no_answer: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
    label: "Sans réponse",
  },
  hot: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: TrendingUp,
    label: "Chaud",
  },
  warm: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
    label: "Tiède",
  },
  cold: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Clock,
    label: "Froid",
  },
};

// Type guard pour vérifier si une clé est valide
function isValidStatusKey(key: string): key is StatusKey {
  return key === "sent" || key === "answered" || key === "no_answer" ||
    key === "hot" || key === "warm" || key === "cold";
}

// ? CORRECTION : Fonction avec fallback par défaut
function getStatusConfig(status: string): StatusConfig {
  if (isValidStatusKey(status)) {
    return STATUS_STYLES[status];
  }
  return STATUS_STYLES.sent; // fallback par défaut
}

function buildColumns(): Column<Lead>[] {
  return [
    {
      key: "prospect",
      header: "Prospect",
      width: "minmax(0,2.2fr)",
      render: (item) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
            <span className="text-[14px] font-bold">{item.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
              {item.companyName}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
              {item.location || "Localisation non spécifiée"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Signaux détectés",
      render: (item) => (
        <div className="flex flex-wrap gap-1.5">
          {item.actions.slice(0, 3).map((action, index) => (
            <span
              key={index}
              className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
            >
              {action}
            </span>
          ))}
          {item.actions.length > 3 && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              +{item.actions.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (item) => {
        const config = getStatusConfig(item.temperature);
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
      key: "score",
      header: "Score",
      render: (item) => {
        const scoreColor =
          item.score >= 70
            ? "text-emerald-600"
            : item.score >= 40
              ? "text-amber-600"
              : "text-muted-foreground";
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-accent">
              <div
                className={`h-2 rounded-full ${item.score >= 70 ? "bg-emerald-500" : item.score >= 40 ? "bg-amber-500" : "bg-muted-foreground"}`}
                style={{ width: `${Math.min(item.score, 100)}%` }}
              />
            </div>
            <span className={`text-[13px] font-semibold ${scoreColor}`}>{item.score}/100</span>
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (item) => (
        <Link
          to="/agence/prospection"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
          Suivi
        </Link>
      ),
    },
  ];
}

function AgencyMyProspectionsPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const [filterStatus, setFilterStatus] = useState("all");

  const leadsQuery = useQuery({
    queryKey: ["agency", "prospection", "leads", "mine", page],
    queryFn: () => getLeads({ page, pageSize: 50 }),
  });

  const allProspections = useMemo(() => {
    const items = leadsQuery.data?.items ?? [];
    return sortDirection === "old" ? [...items].reverse() : items;
  }, [leadsQuery.data, sortDirection]);
  const isLoading = leadsQuery.isLoading;

  // Filtrage par statut
  const statusFiltered =
    activeTab === "all"
      ? allProspections
      : allProspections.filter((item) => {
          if (activeTab === "sent")
            return item.temperature === "cold" || item.temperature === "warm";
          if (activeTab === "answered") return item.temperature === "hot";
          if (activeTab === "no_answer") return item.temperature === "cold";
          return true;
        });

  // Filtrage par recherche
  const filtered = query.trim()
    ? statusFiltered.filter((item) =>
        item.companyName.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : statusFiltered;

  const counts: Record<string, number> = {
    all: allProspections.length,
    sent: allProspections.filter((i) => i.temperature === "cold" || i.temperature === "warm")
      .length,
    answered: allProspections.filter((i) => i.temperature === "hot").length,
    no_answer: allProspections.filter((i) => i.temperature === "cold").length,
  };

  const total = filtered.length;
  const totalPages = null;

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* ✅ EN-TÊTE MODERNISÉ */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Send className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">
                Mes prospections
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Suivez les prospects que vous avez contactés.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {total} prospection{total !== 1 ? "s" : ""}
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
              placeholder="Rechercher une prospection..."
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
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Toutes les catégories</option>
              <option value="tech">Technologie</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all"
            >
              <option value="all">Tous les statuts</option>
              <option value="sent">Envoyé</option>
              <option value="answered">Répondu</option>
              <option value="no_answer">Sans réponse</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Période
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Toutes les périodes</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
            </select>
          </div>
        </div>

        {/* ✅ COMPTEUR + TRI */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total} prospection{total !== 1 ? "s" : ""}
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
          <DataTable columns={buildColumns()} rows={filtered} isLoading={isLoading} />
        </div>

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* ✅ LIEN VERS PROSPECTION IA */}
        <div className="mt-6 rounded-lg border border-border bg-accent/30 p-4 text-center">
          <p className="text-[13px] text-muted-foreground">
            Besoin de nouveaux prospects ?{" "}
            <Link
              to="/agence/prospection"
              className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
            >
              Découvrir la Prospection IA
              <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" strokeWidth={1.8} />
            </Link>
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
