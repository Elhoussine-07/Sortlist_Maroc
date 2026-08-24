import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Folder,
  Star,
  Users,
  Clock,
  CalendarDays,
  Eye,
  MessageSquare,
  TrendingUp,
  Filter,
  Search,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  CircleCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SearchInput, StatusTabs, StatusBadge, TextAreaField } from "@/components/common/Blocks";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { Project } from "@/lib/types";
import { ActionModal } from "@/components/common/ActionModal";
import { getAgencyProjects, reviewClient } from "@/services/agency-projects.service";
import { ApiError } from "@/services/http";

export const Route = createFileRoute("/_authenticated/agence/projets-en-cours")({
  head: () => ({
    meta: [
      { title: "Projets en cours | Sortlist" },
      {
        name: "description",
        content: "Suivez l'avancement de vos projets clients, leurs statuts et leurs échéances.",
      },
      { property: "og:title", content: "Projets en cours | Sortlist" },
      {
        property: "og:description",
        content: "Liste des projets en cours de votre agence.",
      },
    ],
  }),
  component: AgencyProjectsPage,
});

const TABS = [
  { value: "all", label: "Tous" },
  { value: "in_progress", label: "En cours" },
  { value: "suspended", label: "Suspendus" },
  { value: "finished", label: "Terminés" },
];

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: LucideIcon; label: string }
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
    icon: CheckCircle2,
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
    icon: XCircle,
    label: "Rejeté",
  },
};

const DEFAULT_STATUS_STYLE = STATUS_STYLES["draft"]!;

function getStatusConfig(status: string): (typeof STATUS_STYLES)[keyof typeof STATUS_STYLES] {
  return STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;
}

function describeRemainingTime(expectedEndDate: string | null | undefined): string {
  if (!expectedEndDate) return "Non définie";

  const endOfDeadlineDay = new Date(expectedEndDate);
  endOfDeadlineDay.setDate(endOfDeadlineDay.getDate() + 1);
  const diffMs = endOfDeadlineDay.getTime() - Date.now();
  if (diffMs <= 0) return "Délai dépassé — passage Terminé imminent";
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);

  if (days > 0) return `${days}j ${hours}h restantes`;
  return `${hours}h restantes`;
}

function buildColumns(
  onViewDetails: (project: Project) => void,
  onReview: (project: Project) => void,
): Column<Project>[] {
  return [
    {
      key: "project",
      header: "Projet",
      width: "minmax(0,2.2fr)",
      render: (project) => {
        const statusConfig = getStatusConfig(project.status);
        const StatusIcon = statusConfig.icon;
        return (
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Folder className="h-[18px] w-[18px]" strokeWidth={1.6} />
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
      key: "client",
      header: "Client",
      render: (project) => (
        <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-foreground">
          <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
          <span className="truncate">{project.partnerAgencyName ?? "—"}</span>
        </p>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (project) => {
        const config = getStatusConfig(project.status);
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
      key: "budget",
      header: "Budget",
      render: (project) => (
        <p className="truncate text-[13px] font-medium">
          {project.budgetMin !== null && project.budgetMax !== null
            ? `${project.budgetMin.toLocaleString()} € – ${project.budgetMax.toLocaleString()} €`
            : "Non défini"}
        </p>
      ),
    },
    {
      key: "deadline",
      header: "Échéance",
      render: (project) => {
        const time = describeRemainingTime(project.expectedEndDate);
        const isUrgent = time.includes("dépassé") || (time.includes("h") && !time.includes("j"));
        return (
          <p
            className={`flex items-center gap-1.5 text-[13px] ${isUrgent ? "text-destructive font-semibold" : "text-muted-foreground"}`}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            <span className="truncate">{project.deadline || "Non définie"}</span>
          </p>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (project) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(project)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
            Voir
          </button>
          {project.status === "finished" &&
            (project.reviewedByAgency ? (
              /* BUG CORRIGÉ : le bouton "Avis" restait cliquable indéfiniment
                 même après envoi — `opportunity.list_opportunities` renvoie
                 désormais `reviewed_by_agency` par projet (présence d'un
                 `ClientReview` pour ce couple agence/projet), affiché ici
                 comme état terminal plutôt que comme bouton. */
              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[13px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                Avis envoyé
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onReview(project)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md"
              >
                <Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                Avis
              </button>
            ))}
        </div>
      ),
    },
  ];
}

function AgencyProjectsPage() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");

  const [reviewTarget, setReviewTarget] = useState<Project | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!reviewTarget) throw new Error("Aucun projet sélectionné.");
      return reviewClient(reviewTarget.id, reviewRating, reviewComment.trim() || undefined);
    },
    onSuccess: () => {
      toast("Avis envoyé avec succès !");
      void queryClient.invalidateQueries({ queryKey: ["agency", "projects"] });
      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment("");
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible d'envoyer l'avis.");
    },
  });

  const projectsQuery = useQuery({
    queryKey: ["agency", "projects", activeTab, query, page, sortDirection],
    queryFn: () =>
      getAgencyProjects({
        ...(query.trim() ? { query: query.trim() } : {}),
        ...(activeTab !== "all" ? { status: activeTab } : {}),
        sort: "recent",
        page,
        pageSize: 20,
      }),
  });

  const projects = useMemo(() => {
    const items = projectsQuery.data?.items ?? [];
    return sortDirection === "old" ? [...items].reverse() : items;
  }, [projectsQuery.data, sortDirection]);
  const isLoading = projectsQuery.isLoading;
  const counts = projectsQuery.data?.counts ?? {};
  const total = projectsQuery.data?.total ?? null;
  const totalPages = projectsQuery.data?.totalPages ?? null;

  return (
    <DashboardShell role="agency">
      <style>{`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}</style>

      <div className="mx-auto max-w-[1080px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Folder className="h-[22px] w-[22px]" strokeWidth={1.6} />
            </div>
            <div>
              <h1 className="font-display text-[24px] font-bold tracking-tight">
                Projets en cours
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Suivez l'avancement de vos projets et leurs échéances.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
              <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
              {total ?? 0} projet{total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="mt-7">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un projet..."
              className="w-full rounded-xl border border-border bg-card px-10 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-md transition-all"
            />
          </div>
        </div>

        <div className="mt-6">
          <StatusTabs tabs={TABS} value={activeTab} onChange={setActiveTab} counts={counts} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Client
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Tous les clients</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Statut
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Tous les statuts</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Période
            </label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:shadow-sm transition-all">
              <option value="">Toutes les périodes</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total ?? 0} projet{total !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => setSortDirection((current) => (current === "recent" ? "old" : "recent"))}
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Trier par : {sortDirection === "recent" ? "Plus récents" : "Plus anciens"}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <DataTable
            columns={buildColumns(setSelectedProject, setReviewTarget)}
            rows={projects}
            isLoading={isLoading}
          />
        </div>

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ActionModal
        open={selectedProject !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
        title={selectedProject?.title ?? ""}
        {...(selectedProject?.reference
          ? { description: `Réf. ${selectedProject.reference}` }
          : {})}
        confirmLabel="Fermer"
        onConfirm={() => setSelectedProject(null)}
      >
        {selectedProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Statut</p>
                <p className="mt-1 text-[13px] font-semibold">{selectedProject.statusLabel}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Client</p>
                <p className="mt-1 text-[13px] font-semibold">
                  {selectedProject.partnerAgencyName ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Budget</p>
                <p className="mt-1 text-[13px] font-semibold">
                  {selectedProject.budgetMin !== null && selectedProject.budgetMax !== null
                    ? `${selectedProject.budgetMin.toLocaleString()} € – ${selectedProject.budgetMax.toLocaleString()} €`
                    : "Non défini"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Échéance
                </p>
                <p className="mt-1 text-[13px] font-semibold">
                  {selectedProject.deadline || "Non définie"}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Temps restant
              </p>
              <p className="mt-1 text-[13px] font-semibold">
                {describeRemainingTime(selectedProject.expectedEndDate)}
              </p>
            </div>
            {selectedProject.objective && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Objectif
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.6]">
                  {selectedProject.objective}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </ActionModal>

      <ActionModal
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null);
            setReviewRating(5);
            setReviewComment("");
          }
        }}
        title="Laisser un avis"
        description={reviewTarget ? `Client : ${reviewTarget.partnerAgencyName ?? "—"}` : ""}
        confirmLabel={reviewMutation.isPending ? "Envoi..." : "Envoyer l'avis"}
        onConfirm={() => reviewMutation.mutate()}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/30 p-4 text-center">
            <p className="text-[13px] text-muted-foreground">Votre note</p>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="h-8 w-8"
                    strokeWidth={1.8}
                    fill={value <= reviewRating ? "currentColor" : "none"}
                    color={value <= reviewRating ? "#f59e0b" : "#d1d5db"}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {reviewRating === 1 && "Très insatisfait"}
              {reviewRating === 2 && "Insatisfait"}
              {reviewRating === 3 && "Neutre"}
              {reviewRating === 4 && "Satisfait"}
              {reviewRating === 5 && "Très satisfait"}
            </p>
          </div>
          <TextAreaField
            label="Votre avis"
            rows={4}
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="Partagez votre expérience avec ce client..."
          />
        </div>
      </ActionModal>
    </DashboardShell>
  );
}
