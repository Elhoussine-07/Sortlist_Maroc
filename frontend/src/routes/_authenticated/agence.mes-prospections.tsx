import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Send,
  Search,
  TrendingUp,
  Building2,
  Clock,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusTabs } from "@/components/common/Blocks";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { getLeads, type Lead, type LeadTemperature } from "@/services/prospection.service";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

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

const PAGE_TEXT = {
  Toutes: {
    en: "All",
    ar: "الكل",
    es: "Todas",
  },
  Chaudes: {
    en: "Hot",
    ar: "ساخنة",
    es: "Calientes",
  },
  Tièdes: {
    en: "Warm",
    ar: "فاترة",
    es: "Tibias",
  },
  Froides: {
    en: "Cold",
    ar: "باردة",
    es: "Frías",
  },
  "7 derniers jours": {
    en: "Last 7 days",
    ar: "آخر 7 أيام",
    es: "Últimos 7 días",
  },
  "30 derniers jours": {
    en: "Last 30 days",
    ar: "آخر 30 يومًا",
    es: "Últimos 30 días",
  },
  "90 derniers jours": {
    en: "Last 90 days",
    ar: "آخر 90 يومًا",
    es: "Últimos 90 días",
  },
  Chaud: {
    en: "Hot",
    ar: "ساخن",
    es: "Caliente",
  },
  Tiède: {
    en: "Warm",
    ar: "فاتر",
    es: "Tibio",
  },
  Froid: {
    en: "Cold",
    ar: "بارد",
    es: "Frío",
  },
  Prospect: {
    en: "Prospect",
    ar: "العميل المحتمل",
    es: "Prospecto",
  },
  "Visiteur non identifié": {
    en: "Unidentified visitor",
    ar: "زائر غير معروف",
    es: "Visitante no identificado",
  },
  "Localisation non spécifiée": {
    en: "Location not specified",
    ar: "الموقع غير محدد",
    es: "Ubicación no especificada",
  },
  "Signaux détectés": {
    en: "Detected signals",
    ar: "الإشارات المكتشفة",
    es: "Señales detectadas",
  },
  Statut: {
    en: "Status",
    ar: "الحالة",
    es: "Estado",
  },
  Score: {
    en: "Score",
    ar: "النقاط",
    es: "Puntuación",
  },
  Action: {
    en: "Action",
    ar: "الإجراء",
    es: "Acción",
  },
  Suivi: {
    en: "Track",
    ar: "متابعة",
    es: "Seguimiento",
  },
  "Mes prospections": {
    en: "My prospecting",
    ar: "عمليات التنقيب الخاصة بي",
    es: "Mi prospección",
  },
  "Suivez les prospects que vous avez contactés.": {
    en: "Track the prospects you've contacted.",
    ar: "تابع العملاء المحتملين الذين تواصلت معهم.",
    es: "Haz seguimiento de los prospectos que has contactado.",
  },
  prospection: {
    en: "prospect",
    ar: "عملية تنقيب",
    es: "prospección",
  },
  prospections: {
    en: "prospects",
    ar: "عمليات تنقيب",
    es: "prospecciones",
  },
  "Rechercher une prospection...": {
    en: "Search for a prospect...",
    ar: "ابحث عن عملية تنقيب...",
    es: "Buscar una prospección...",
  },
  Période: {
    en: "Period",
    ar: "الفترة",
    es: "Periodo",
  },
  "Toutes les périodes": {
    en: "All periods",
    ar: "كل الفترات",
    es: "Todos los periodos",
  },
  "Trier par :": {
    en: "Sort by:",
    ar: "ترتيب حسب:",
    es: "Ordenar por:",
  },
  "Plus récentes": {
    en: "Most recent",
    ar: "الأحدث",
    es: "Más recientes",
  },
  "Plus anciennes": {
    en: "Oldest",
    ar: "الأقدم",
    es: "Más antiguas",
  },
  "Besoin de nouveaux prospects ?": {
    en: "Need new prospects?",
    ar: "بحاجة إلى عملاء محتملين جدد؟",
    es: "¿Necesitas nuevos prospectos?",
  },
  "Découvrir la Prospection IA": {
    en: "Discover AI Prospecting",
    ar: "اكتشف التنقيب بالذكاء الاصطناعي",
    es: "Descubrir la Prospección con IA",
  },
} satisfies PageTextDict;

const TABS = [
  { value: "all", label: "Toutes" },
  { value: "hot", label: "Chaudes" },
  { value: "warm", label: "Tièdes" },
  { value: "cold", label: "Froides" },
];

const PERIOD_OPTIONS: Array<{ value: string; label: string; days: number }> = [
  { value: "7d", label: "7 derniers jours", days: 7 },
  { value: "30d", label: "30 derniers jours", days: 30 },
  { value: "90d", label: "90 derniers jours", days: 90 },
];

function periodToFromDate(period: string): string | undefined {
  const option = PERIOD_OPTIONS.find((item) => item.value === period);
  if (!option) return undefined;
  const date = new Date();
  date.setDate(date.getDate() - option.days);
  return date.toISOString();
}

type StatusConfig = {
  bg: string;
  text: string;
  border: string;
  icon: LucideIcon;
  label: string;
};

type StatusKey = "hot" | "warm" | "cold";

const STATUS_STYLES: Record<StatusKey, StatusConfig> = {
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

function isValidStatusKey(key: string): key is StatusKey {
  return key === "hot" || key === "warm" || key === "cold";
}

function getStatusConfig(status: string): StatusConfig {
  if (isValidStatusKey(status)) {
    return STATUS_STYLES[status];
  }
  return STATUS_STYLES.cold;
}

function buildColumns(tt: (source: string) => string): Column<Lead>[] {
  return [
    {
      key: "prospect",
      header: tt("Prospect"),
      width: "minmax(0,2.2fr)",
      render: (item) => (
        <div className="flex min-w-0 items-start gap-3">
          {item.companyLogo ? (
            <img
              src={item.companyLogo}
              alt={item.companyName}
              className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
              {item.initials ? (
                <span className="text-[14px] font-bold">{item.initials}</span>
              ) : (
                <Building2 className="h-4 w-4" strokeWidth={1.8} />
              )}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
              {item.companyName || tt("Visiteur non identifié")}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
              {item.location || tt("Localisation non spécifiée")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: tt("Signaux détectés"),
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
      header: tt("Statut"),
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
            {tt(config.label)}
          </span>
        );
      },
    },
    {
      key: "score",
      header: tt("Score"),
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
      header: tt("Action"),
      render: (item) => (
        <Link
          to="/agence/prospection"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
          {tt("Suivi")}
        </Link>
      ),
    },
  ];
}

const PAGE_SIZE = 20;

function AgencyMyProspectionsPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | LeadTemperature>("all");
  const [periodFilter, setPeriodFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");

  const leadsQuery = useQuery({
    queryKey: ["agency", "prospection", "leads", "mine", periodFilter],
    queryFn: () => {
      const from = periodToFromDate(periodFilter);
      return getLeads(from ? { from } : {});
    },
  });

  const allProspections = useMemo(() => {
    const items = leadsQuery.data?.items ?? [];
    return sortDirection === "old" ? [...items].reverse() : items;
  }, [leadsQuery.data, sortDirection]);
  const isLoading = leadsQuery.isLoading;

  const tabFiltered =
    activeTab === "all"
      ? allProspections
      : allProspections.filter((item) => item.temperature === activeTab);

  const filtered = query.trim()
    ? tabFiltered.filter((item) =>
        item.companyName.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : tabFiltered;

  const counts: Record<string, number> = {
    all: allProspections.length,
    hot: allProspections.filter((i) => i.temperature === "hot").length,
    warm: allProspections.filter((i) => i.temperature === "warm").length,
    cold: allProspections.filter((i) => i.temperature === "cold").length,
  };

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProspections = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const tabs = TABS.map((tab) => ({ ...tab, label: tt(tab.label) }));
  const periodOptions = PERIOD_OPTIONS.map((option) => ({ ...option, label: tt(option.label) }));
  const prospectionWord = total !== 1 ? tt("prospections") : tt("prospection");

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Send className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">
                {tt("Mes prospections")}
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                {tt("Suivez les prospects que vous avez contactés.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {total} {prospectionWord}
            </span>
          </div>
        </div>

        {/* Recherche */}
        <div className="mt-7">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={tt("Rechercher une prospection...")}
              className="w-full rounded-xl border border-border bg-card px-10 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md transition-all"
            />
          </div>
        </div>

        {/* Onglets */}
        <div className="mt-6">
          <StatusTabs
            tabs={tabs}
            value={activeTab}
            onChange={(value) => {
              setActiveTab(isValidStatusKey(value) ? value : "all");
              setPage(1);
            }}
            counts={counts}
          />
        </div>

        {/* Filtres */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:max-w-xs">
          <FilterSelect
            label={tt("Période")}
            placeholder={tt("Toutes les périodes")}
            options={periodOptions}
            value={periodFilter}
            onChange={(value) => {
              setPeriodFilter(value);
              setPage(1);
            }}
          />
        </div>

        {/* Compteur + tri */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total} {prospectionWord}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {tt("Trier par :")} {sortDirection === "recent" ? tt("Plus récentes") : tt("Plus anciennes")}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Tableau */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable columns={buildColumns(tt)} rows={paginatedProspections} isLoading={isLoading} />
        </div>

        <ListPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

        {/* Lien vers la prospection IA */}
        <div className="mt-6 rounded-lg border border-border bg-accent/30 p-4 text-center">
          <p className="text-[13px] text-muted-foreground">
            {tt("Besoin de nouveaux prospects ?")}{" "}
            <Link
              to="/agence/prospection"
              className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
            >
              {tt("Découvrir la Prospection IA")}
              <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" strokeWidth={1.8} />
            </Link>
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
