import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Briefcase,
  Code2,
  Compass,
  FileText,
  Folder,
  Megaphone,
  MessageSquare,
  Palette,
  Scale,
  Sparkles,
  Star,
  Users2,
  Wallet,
  Workflow,
  type LucideIcon,
  Clock,
  CircleCheck,
  CircleDot,
  AlertCircle,
  Eye,
  TrendingUp,
  Building2,
  CalendarDays,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, StatGrid, StatusBadge, SectionCard } from "@/components/common/Blocks";
import { StatSkeleton, StackSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { Project } from "@/lib/types";
import { getAgencyDashboardOverview } from "@/services/agencies.service";
import { getAgencyProjects } from "@/services/agency-projects.service";

export const Route = createFileRoute("/_authenticated/agence/tableau-de-bord")({
  head: () => ({
    meta: [
      {
        title: "Tableau de bord Agence | Sortlist",
      },
      {
        name: "description",
        content:
          "Suivez vos opportunités, vos projets en cours, votre score PQI et votre activité récente.",
      },
      {
        property: "og:title",
        content: "Tableau de bord Agence | Sortlist",
      },
      {
        property: "og:description",
        content: "Aperçu de l'activité de votre agence sur Sortlist.",
      },
    ],
  }),

  component: AgencyDashboardPage,
});

interface AgencyStats {
  pqiScore: number | null;
  pqiLabel: string | null;
  openOpportunities: number | null;
  activeProjects: number | null;
  averageRating: number | null;
}

type CategoryStyle = {
  icon: LucideIcon;
  className: string;
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: Folder,
  className: "bg-accent text-muted-foreground",
};

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Marketing digital": {
    icon: Megaphone,
    className: "bg-sky-500/10 text-sky-600",
  },
  "Développement web": {
    icon: Code2,
    className: "bg-violet-500/10 text-violet-600",
  },
  "Design & branding": {
    icon: Palette,
    className: "bg-rose-500/10 text-rose-600",
  },
  Communication: {
    icon: MessageSquare,
    className: "bg-cyan-500/10 text-cyan-600",
  },
  Juridique: {
    icon: Scale,
    className: "bg-slate-500/10 text-slate-600",
  },
  "Finance & comptabilité": {
    icon: Wallet,
    className: "bg-amber-500/10 text-amber-600",
  },
  "Ressources humaines": {
    icon: Users2,
    className: "bg-emerald-500/10 text-emerald-600",
  },
  "Conseil en stratégie": {
    icon: Compass,
    className: "bg-orange-500/10 text-orange-600",
  },
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: typeof Clock; label: string }
> = {
  draft: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Clock,
    label: "Brouillon",
  },
  published: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CircleCheck,
    label: "Publié",
  },
  awaiting: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
    label: "En attente",
  },
  in_progress: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CircleDot,
    label: "En cours",
  },
  finished: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: CircleCheck,
    label: "Terminé",
  },
  suspended: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: AlertCircle,
    label: "Suspendu",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    icon: AlertCircle,
    label: "Rejeté",
  },
};

function StarRow({ value }: { value: number }) {
  const rounded = Math.round(value);

  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={
            "h-3.5 w-3.5 " + (i < rounded ? "fill-amber-400 text-amber-400" : "text-border")
          }
          strokeWidth={i < rounded ? 0 : 1.6}
        />
      ))}
    </span>
  );
}

function PQIBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  let color = "text-slate-700 bg-slate-100";
  if (score >= 80) color = "text-emerald-700 bg-emerald-100";
  else if (score >= 60) color = "text-blue-700 bg-blue-100";
  else if (score >= 40) color = "text-amber-700 bg-amber-100";
  else color = "text-red-700 bg-red-100";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${color}`}
    >
      <TrendingUp className="h-3 w-3" />
      {score}/100
    </span>
  );
}

const PROJECT_COLUMNS: Column<Project>[] = [
  {
    key: "project",
    header: "Projet",
    width: "minmax(0,2fr)",
    render: (project) => {
      const style = CATEGORY_STYLES[project.category] ?? DEFAULT_CATEGORY_STYLE;
      const Icon = style.icon;

      return (
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm " +
              style.className
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-[14px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
              {project.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
              {project.reference ? `Réf. ${project.reference.slice(0, 8)}` : "Nouveau projet"}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    key: "category",
    header: "Catégorie",
    render: (project) => (
      <p className="truncate text-[13px] font-medium text-foreground">
        {project.category || "Non catégorisé"}
      </p>
    ),
  },
  {
    key: "status",
    header: "Statut",
    render: (project) => {
      const statusConfig = STATUS_STYLES[project.status] || STATUS_STYLES.draft;
      const StatusIcon = statusConfig.icon;
      return (
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold
            ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}
            shadow-sm transition-all hover:scale-105
          `}
        >
          <StatusIcon className="h-3 w-3" strokeWidth={2} />
          {statusConfig.label}
        </span>
      );
    },
  },
  {
    key: "activity",
    header: "Dernière activité",
    render: (project) => (
      <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.6} />
        {project.lastActivity}
      </p>
    ),
  },
  {
    key: "action",
    header: "Action",
    render: (project) => (
      <Link
        to="/agence/projets-en-cours"
        className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm lg:w-auto"
      >
        👁️ Voir
      </Link>
    ),
  },
];

function AgencyDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["agency", "dashboard"],
    queryFn: getAgencyDashboardOverview,
  });

  const projectsQuery = useQuery({
    queryKey: ["agency", "projects", "recent"],
    queryFn: () =>
      getAgencyProjects({
        page: 1,
        pageSize: 5,
        sort: "recent",
      }),
  });

  const stats: AgencyStats = {
    pqiScore: dashboardQuery.data?.pqiScore ?? null,
    pqiLabel: dashboardQuery.data ? "Score PQI" : null,
    openOpportunities: dashboardQuery.data?.openOpportunitiesCount ?? null,
    activeProjects: dashboardQuery.data?.inProgressCount ?? null,
    averageRating: dashboardQuery.data?.averageClientRating ?? null,
  };

  const isStatsLoading = dashboardQuery.isLoading;
  const recentProjects = projectsQuery.data?.items ?? [];
  const isProjectsLoading = projectsQuery.isLoading;
  const activities = dashboardQuery.data?.recentActivity ?? [];
  const isActivitiesLoading = dashboardQuery.isLoading;

  return (
    <DashboardShell role="agency">
      <style>
        {`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}
      </style>

      <div className="mx-auto max-w-[1080px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-bold tracking-tight sm:text-[32px]">
              Tableau de bord
            </h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              Voici un aperçu de l'activité de votre agence.
            </p>
          </div>
          <Link
            to="/agence/prospection"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-all hover:opacity-90 hover:shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Prospection IA
          </Link>
        </div>

        {/* ✅ STATS AVEC DESIGN MODERNISÉ */}
        <section className="mt-7">
          {isStatsLoading ? (
            <StatSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Score PQI */}
              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <BarChart3 className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <PQIBadge score={stats.pqiScore} />
                </div>
                <p className="mt-4 text-[13px] font-medium text-muted-foreground">Score PQI</p>
                <p className="font-display text-[28px] font-bold leading-none">
                  {stats.pqiScore === null ? "?" : stats.pqiScore}
                  <span className="text-[14px] font-normal text-muted-foreground">/100</span>
                </p>
                {stats.pqiLabel && (
                  <div className="mt-2">
                    <StatusBadge label={stats.pqiLabel} />
                  </div>
                )}
              </div>

              {/* Opportunités ouvertes */}
              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-white">
                  <Briefcase className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <p className="mt-4 text-[13px] font-medium text-muted-foreground">
                  Opportunités ouvertes
                </p>
                <p className="font-display text-[28px] font-bold leading-none">
                  {stats.openOpportunities === null ? "?" : stats.openOpportunities}
                </p>
                <Link
                  to="/agence/opportunites"
                  className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
                >
                  Voir les opportunités
                  <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                </Link>
              </div>

              {/* Projets en cours */}
              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                  <Folder className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <p className="mt-4 text-[13px] font-medium text-muted-foreground">
                  Projets en cours
                </p>
                <p className="font-display text-[28px] font-bold leading-none">
                  {stats.activeProjects === null ? "?" : stats.activeProjects}
                </p>
                <Link
                  to="/agence/projets-en-cours"
                  className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
                >
                  Voir les projets
                  <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                </Link>
              </div>

              {/* Note moyenne */}
              <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                  <Star className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <p className="mt-4 text-[13px] font-medium text-muted-foreground">Note moyenne</p>
                <p className="font-display text-[28px] font-bold leading-none">
                  {stats.averageRating === null ? "?" : stats.averageRating}
                  <span className="text-[14px] font-normal text-muted-foreground">/5</span>
                </p>
                {stats.averageRating !== null && (
                  <div className="mt-2">
                    <StarRow value={stats.averageRating} />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ✅ PROJETS RÉCENTS AVEC DESIGN MODERNISÉ */}
        <section className="mt-9">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <h2 className="truncate text-[13.5px] font-bold tracking-wide text-muted-foreground">
              PROJETS RÉCENTS
            </h2>
            <Link
              to="/agence/projets-en-cours"
              className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
            >
              Voir tous les projets
              <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <DataTable
              columns={PROJECT_COLUMNS}
              rows={recentProjects}
              isLoading={isProjectsLoading}
            />
          </div>
        </section>

        {/* ✅ ACTIVITÉS RÉCENTES AVEC DESIGN MODERNISÉ */}
        <section className="mt-9">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[13.5px] font-bold tracking-wide text-muted-foreground">
                ACTIVITÉS RÉCENTES
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Devis envoyés, réponses clients, litiges et facturation.
              </p>
            </div>
            <div className="px-5 py-4">
              {isActivitiesLoading ? (
                <StackSkeleton count={3} />
              ) : activities.length === 0 ? (
                <EmptyState message="Aucune activité récente à afficher." />
              ) : (
                <ul className="relative space-y-5 border-l-2 border-border pl-5">
                  {activities.map((activity, index) => {
                    const colors = [
                      "bg-primary/10 text-primary",
                      "bg-sky-500/10 text-sky-600",
                      "bg-emerald-500/10 text-emerald-600",
                      "bg-amber-500/10 text-amber-600",
                      "bg-purple-500/10 text-purple-600",
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <li key={activity.id} className="relative">
                        <span
                          className={`absolute -left-[29px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background ${color}`}
                        >
                          <Activity className="h-2.5 w-2.5" strokeWidth={2.4} />
                        </span>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[13.5px] font-semibold">{activity.title}</p>
                          <span className="text-[12px] text-muted-foreground">{activity.date}</span>
                        </div>
                        <p className="text-[13px] text-muted-foreground">{activity.description}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ✅ ACCÈS RAPIDES AVEC DESIGN MODERNISÉ */}
        <section className="mt-9">
          <h2 className="text-[13.5px] font-bold tracking-wide text-muted-foreground">
            ACCÈS RAPIDES
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAccess
              icon={Wallet}
              label="Facturation"
              description="Suivez vos factures émises et reçues."
              to="/agence/facturation"
            />
            <QuickAccess
              icon={BarChart3}
              label="Analytics PQI"
              description="Analysez vos indicateurs de performance."
              to="/agence/analytics"
            />
            <QuickAccess
              icon={Sparkles}
              label="Prospection IA"
              description="Découvrez les clients suggérés par l'IA."
              to="/agence/prospection"
            />
            <QuickAccess
              icon={Workflow}
              label="Workflow"
              description="Suivez les étapes de traitement des opportunités."
              to="/agence/workflow"
            />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function QuickAccess({
  icon: Icon,
  label,
  description,
  to,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  to: "/agence/facturation" | "/agence/analytics" | "/agence/prospection" | "/agence/workflow";
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md">
        <Icon className="h-[20px] w-[20px]" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-bold">{label}</p>
        <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">{description}</p>
      </div>
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-primary opacity-0 transition-all group-hover:opacity-100">
        Ouvrir
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.8}
        />
      </span>
    </Link>
  );
}
