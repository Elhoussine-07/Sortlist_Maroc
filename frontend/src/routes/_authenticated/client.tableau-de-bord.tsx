import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CircleHelp,
  ExternalLink,
  FileText,
  MessageCircle,
  MoreVertical,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  type LucideIcon,
  Clock,
  CircleCheck,
  CircleDot,
  Eye,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/common/EmptyState";
import { StatSkeleton, TableSkeleton } from "@/components/common/Skeletons";
import { ActionModal } from "@/components/common/ActionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import type { Project } from "@/lib/types";
import { ApiError } from "@/services/http";
import { getClientDashboard } from "@/services/profile.service";
import { deleteProject, getMyProjects, repostProject } from "@/services/projects.service";

export const Route = createFileRoute("/_authenticated/client/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord Client | Sortlist" },
      {
        name: "description",
        content:
          "Suivez votre score de confiance, vos projets publiés, votre taux de réponse et vos collaborations en cours.",
      },
      { property: "og:title", content: "Tableau de bord Client | Sortlist" },
      {
        property: "og:description",
        content: "Aperçu de votre activité sur Sortlist.",
      },
    ],
  }),
  component: ClientDashboardPage,
});

interface ClientDashboardStats {
  trustScore: number | null;
  trustScoreLabel: string | null;
  publishedProjects: number | null;
  publishedProjectsDelta: string | null;
  responseRate: number | null;
  responseRateDelta: string | null;
  activeCollaborations: number | null;
}

const EMPTY_STATS: ClientDashboardStats = {
  trustScore: null,
  trustScoreLabel: null,
  publishedProjects: null,
  publishedProjectsDelta: null,
  responseRate: null,
  responseRateDelta: null,
  activeCollaborations: null,
};

function ClientDashboardPage() {
  const user = useAuthStore((state) => state.user);

  const dashboardQuery = useQuery({
    queryKey: ["client", "dashboard"],
    queryFn: getClientDashboard,
  });
  const isStatsLoading = dashboardQuery.isPending;
  const stats: ClientDashboardStats = dashboardQuery.data
    ? {
        trustScore: dashboardQuery.data.trustScore.value,
        trustScoreLabel: dashboardQuery.data.trustScore.label,
        publishedProjects: dashboardQuery.data.publishedProjects.value,
        publishedProjectsDelta: dashboardQuery.data.publishedProjects.delta,
        responseRate: dashboardQuery.data.responseRate.value,
        responseRateDelta: dashboardQuery.data.responseRate.delta,
        activeCollaborations: dashboardQuery.data.activeCollaborations.value,
      }
    : EMPTY_STATS;

  const recentProjectsQuery = useQuery({
    queryKey: ["client", "projects", "recent"],
    queryFn: () => getMyProjects({ pageSize: 5, sort: "recent" }),
  });
  const recentProjects = recentProjectsQuery.data?.items ?? [];
  const isProjectsLoading = recentProjectsQuery.isPending;

  return (
    <DashboardShell role="client">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        <h1 className="font-display text-[30px] font-bold tracking-tight sm:text-[32px]">
          Bonjour{user ? `, ${user.displayName}` : ""}
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Voici un aperçu de votre activité sur Sortlist.
        </p>

        {/* Stats */}
        <section className="mt-7">
          {isStatsLoading ? (
            <StatSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <CircularStat
                icon={ShieldCheck}
                label="Score de confiance"
                value={stats.trustScore}
                footer={
                  stats.trustScoreLabel ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-semibold text-primary">
                      {stats.trustScoreLabel}
                    </span>
                  ) : null
                }
              />
              <StatCard
                icon={FileText}
                label="Projets publiés"
                value={stats.publishedProjects === null ? "?" : String(stats.publishedProjects)}
                footer={<DeltaLabel value={stats.publishedProjectsDelta} />}
              />
              <CircularStat
                icon={TrendingUp}
                label="Taux de réponse"
                value={stats.responseRate}
                isPercent
                footer={<DeltaLabel value={stats.responseRateDelta} />}
              />
              <StatCard
                icon={Users}
                label="Collaborations en cours"
                value={
                  stats.activeCollaborations === null ? "?" : String(stats.activeCollaborations)
                }
                footer={
                  <Link
                    to="/client/collaborations"
                    className="flex items-center gap-1.5 font-semibold text-primary transition-opacity hover:opacity-70"
                  >
                    Voir le détail
                    <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                  </Link>
                }
              />
            </div>
          )}
        </section>

        {/* Projets récents */}
        <section className="mt-9">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <h2 className="truncate text-[13.5px] font-bold tracking-wide text-muted-foreground">
              MES PROJETS RÉCENTS
            </h2>
            <Link
              to="/client/mes-projets"
              className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
            >
              Voir tous mes projets
              <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] gap-4 border-b border-border bg-accent/40 px-5 py-3 lg:grid">
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Projet
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Catégorie
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Statut
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Dernière activité
              </p>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Action
              </p>
              <span className="w-4" />
            </div>

            {isProjectsLoading ? (
              <div className="px-5">
                <TableSkeleton rows={5} columns={5} />
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="p-5">
                <EmptyState message="Aucun projet récent à afficher." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <ProjectRow project={project} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Actions rapides */}
        <section className="mt-10">
          <h2 className="text-[13.5px] font-bold tracking-wide text-muted-foreground">
            ACTIONS RAPIDES
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={Plus}
              title="Postuler un projet"
              description="Déposez un nouveau projet et trouvez les meilleures agences."
              to="/client/postuler-un-projet"
            />
            <QuickAction
              icon={Sparkles}
              title="Générer un CDC avec IA"
              description="Créez un cahier des charges complet et optimisé avec l'intelligence artificielle."
              to="/client/postuler-un-projet"
            />
            <QuickAction
              icon={MessageCircle}
              title="Contacter une agence"
              description="Recherchez et contactez l'agence idéale pour votre projet."
              to="/agences"
            />
            <QuickAction
              icon={Users}
              title="Voir mes collaborations"
              description="Suivez l'avancement de vos collaborations en cours."
              to="/client/collaborations"
            />
          </div>
        </section>

        <div className="mt-14 rounded-lg border border-border p-4">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold">
            <CircleHelp className="h-4 w-4 text-primary" strokeWidth={1.8} />
            Besoin d'aide ?
          </p>
          <a
            href="/centre-aide"
            className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Consulter notre centre d'aide
            <ExternalLink className="h-3 w-3" strokeWidth={1.7} />
          </a>
        </div>
      </div>
    </DashboardShell>
  );
}

function DeltaLabel({ value }: { value: string | null }) {
  if (!value) return null;
  const isPositive = value.trim().startsWith("+");
  const isNegative = value.trim().startsWith("-");
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : null;
  return (
    <span
      className={
        "flex items-center gap-1 font-medium " +
        (isPositive
          ? "text-emerald-600"
          : isNegative
            ? "text-destructive"
            : "text-muted-foreground")
      }
    >
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2} /> : null}
      {value}
    </span>
  );
}

const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function gaugeTone(value: number): { ring: string; text: string } {
  if (value >= 70) return { ring: "text-primary", text: "text-primary" };
  if (value >= 40) return { ring: "text-amber-500", text: "text-amber-600" };
  return { ring: "text-destructive", text: "text-destructive" };
}

function CircularStat({
  icon: Icon,
  label,
  value,
  isPercent,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
  isPercent?: boolean;
  footer?: ReactNode;
}) {
  const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);
  const tone =
    value === null ? { ring: "text-border", text: "text-muted-foreground" } : gaugeTone(value);

  return (
    <div className="flex items-center gap-4 p-5">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 72 72" className="h-16 w-16 -rotate-90">
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="7"
            stroke="currentColor"
            className="text-border"
          />
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            stroke="currentColor"
            className={tone.ring + " transition-[stroke-dashoffset] duration-700 ease-out"}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={"font-display text-[14px] font-bold " + tone.text}>
            {value === null ? "?" : `${value}${isPercent ? "%" : ""}`}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {label}
        </p>
        {footer ? <div className="mt-2 text-[13px] text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="font-display mt-1 text-[28px] font-bold leading-none">
          {value}
          {suffix ? (
            <span className="text-[14px] font-normal text-muted-foreground">{suffix}</span>
          ) : null}
        </p>
        {footer ? <div className="mt-2.5 text-[13px] text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: LucideIcon }
> = {
  draft: {
    label: "Brouillon",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Clock,
  },
  published: {
    label: "Publié",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CircleCheck,
  },
  in_progress: {
    label: "En cours",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CircleDot,
  },
  completed: {
    label: "Terminé",
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: CircleCheck,
  },
  archived: {
    label: "Archivé",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    icon: Eye,
  },
  pending: {
    label: "En attente",
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
};

function ProjectRow({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const repostMutation = useMutation({
    mutationFn: () => repostProject(project.id),
    onSuccess: () => {
      toast("Projet republié auprès des agences pertinentes.");
      void queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de republier ce projet.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: () => {
      toast("Projet supprimé.");
      setIsDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de supprimer ce projet.");
    },
  });

  const canRepost = project.status === "published";
  const canDelete = project.status === "draft" || project.status === "published";

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-accent/30 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] lg:items-center lg:gap-4">
      {/* Projet - Titre mis en avant */}
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
          <FileText className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
            {project.title}
          </p>
          {/* ID supprimé - remplacé par un indicateur de statut léger */}
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
            {project.reference ? `Réf. ${project.reference.slice(0, 8)}` : "Nouveau projet"}
          </p>
        </div>
      </div>

      {/* Catégorie */}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">
          {project.category || "Non catégorisé"}
        </p>
        {project.subCategory && (
          <p className="truncate text-[12.5px] text-muted-foreground">{project.subCategory}</p>
        )}
      </div>

      {/* Statut - Badge modernisé avec icône et couleurs personnalisées */}
      <div className="min-w-0">
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold
            ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}
            shadow-sm transition-all hover:scale-105
          `}
        >
          <StatusIcon className="h-3 w-3" strokeWidth={2} />
          {statusConfig.label}
        </span>
      </div>

      {/* Dernière activité */}
      <p className="truncate text-[13px] text-muted-foreground">{project.lastActivity}</p>

      {/* Action */}
      <div className="min-w-0">
        <Link
          to="/client/mes-projets/$id"
          params={{ id: project.id }}
          className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm lg:w-auto"
        >
          {project.status === "draft" ? "📝 Reprendre" : "👁️ Voir"}
        </Link>
      </div>

      {/* Menu actions */}
      {canRepost || canDelete ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Plus d'actions"
                className="justify-self-start rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:justify-self-center"
              >
                <MoreVertical className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border shadow-lg">
              {canRepost ? (
                <DropdownMenuItem
                  disabled={repostMutation.isPending}
                  onClick={() => repostMutation.mutate()}
                  className="cursor-pointer gap-2 text-[13px]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {repostMutation.isPending ? "Republication..." : "Repostuler"}
                </DropdownMenuItem>
              ) : null}
              {canDelete ? (
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-[13px] text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Supprimer
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Modal de suppression */}
          <ActionModal
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            title="Supprimer ce projet ?"
            description={`« ${project.title} » sera définitivement supprimé. Cette action est irréversible.`}
            confirmLabel={deleteMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
            onConfirm={() => deleteMutation.mutate()}
          />
        </>
      ) : (
        <span className="justify-self-start lg:justify-self-center" />
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md">
        <Icon className="h-[20px] w-[20px]" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-bold">{title}</p>
        <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">{description}</p>
      </div>
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Ouvrir
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={1.8}
        />
      </span>
    </Link>
  );
}
