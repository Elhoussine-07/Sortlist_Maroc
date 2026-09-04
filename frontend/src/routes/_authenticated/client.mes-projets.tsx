import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Code2,
  Compass,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Palette,
  Plus,
  RefreshCcw,
  Scale,
  Search,
  Trash2,
  Users2,
  Wallet,
  type LucideIcon,
  Clock,
  CircleCheck,
  CircleDot,
  Eye,
  AlertCircle,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, ProjectStatus } from "@/lib/types";
import { ApiError } from "@/services/http";
import { deleteProject, getMyProjects, repostProject } from "@/services/projects.service";

/** Écran 15 — MES PROJETS (espace Client). */
export const Route = createFileRoute("/_authenticated/client/mes-projets")({
  head: () => ({
    meta: [
      {
        title: "Mes projets | Sortlist Pro",
      },
      {
        name: "description",
        content:
          "Recherchez, filtrez et suivez l'ensemble de vos projets : brouillons, publiés, en cours et terminés.",
      },
      {
        property: "og:title",
        content: "Mes projets | Sortlist Pro",
      },
      {
        property: "og:description",
        content: "Suivez l'ensemble de vos projets sur Sortlist Pro.",
      },
    ],
  }),

  component: ClientProjectsPage,
});

/* -------------------------------------------------------------------------- */
/*                              STATUTS                                       */
/* -------------------------------------------------------------------------- */

const STATUS_TABS: {
  value: "all" | ProjectStatus;
  label: string;
}[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "published", label: "Postulés" },
  { value: "awaiting", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "finished", label: "Terminés" },
  { value: "suspended", label: "Suspendus" },
  { value: "rejected", label: "Rejetés" },
];

/* -------------------------------------------------------------------------- */
/*                          STYLES CATÉGORIES                                 */
/* -------------------------------------------------------------------------- */

type CategoryStyle = {
  icon: LucideIcon;
  className: string;
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: Briefcase,
  className: "bg-accent text-muted-foreground",
};

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Marketing digital": { icon: Megaphone, className: "bg-sky-500/10 text-sky-600" },
  "Développement web": { icon: Code2, className: "bg-violet-500/10 text-violet-600" },
  "Design & branding": { icon: Palette, className: "bg-rose-500/10 text-rose-600" },
  Communication: { icon: MessageSquare, className: "bg-cyan-500/10 text-cyan-600" },
  Juridique: { icon: Scale, className: "bg-slate-500/10 text-slate-600" },
  "Finance & comptabilité": { icon: Wallet, className: "bg-amber-500/10 text-amber-600" },
  "Ressources humaines": { icon: Users2, className: "bg-emerald-500/10 text-emerald-600" },
  "Conseil en stratégie": { icon: Compass, className: "bg-orange-500/10 text-orange-600" },
};

/* -------------------------------------------------------------------------- */
/*                           STYLES STATUTS MODERNISÉS                        */
/* -------------------------------------------------------------------------- */

type StatusConfig = {
  bg: string;
  text: string;
  border: string;
  icon: typeof Clock;
  label: string;
};

const STATUS_STYLES: Record<string, StatusConfig> = {
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
    icon: Loader2,
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
    icon: XCircle,
    label: "Rejeté",
  },
};

// ✅ CORRECTION : Fonction avec fallback par défaut
function getStatusConfig(status: string): StatusConfig {
  // Chercher dans STATUS_STYLES, sinon utiliser "draft" comme fallback
  const config = STATUS_STYLES[status] ?? STATUS_STYLES["draft"];
  // Retourner avec une assertion de type (garanti non-undefined car fallback existe)
  return config as StatusConfig;
}

/* -------------------------------------------------------------------------- */
/*                          FORMATAGE TITRE                                   */
/* -------------------------------------------------------------------------- */

function formatProjectTitle(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\.{2,}$/, "");

  if (!trimmed) {
    return "Projet sans titre";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const PAGE_SIZE = 20;

/* -------------------------------------------------------------------------- */
/*                         PAGE PRINCIPALE                                    */
/* -------------------------------------------------------------------------- */

function ClientProjectsPage() {
  const projectsQuery = useQuery({
    queryKey: ["client", "projects"],
    queryFn: () => getMyProjects(),
  });

  const isLoading = projectsQuery.isPending;
  const allProjects = useMemo(() => projectsQuery.data?.items ?? [], [projectsQuery.data]);

  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<"all" | ProjectStatus>("all");
  const [sortDirection, setSortDirection] = useState<"recent" | "old">("recent");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const result: Partial<Record<"all" | ProjectStatus, number>> = { all: allProjects.length };
    for (const project of allProjects) {
      result[project.status] = (result[project.status] ?? 0) + 1;
      // AJOUTÉ (demande explicite) : un projet refusé par une agence reste
      // "Postulé" côté statut réel (toujours visible/contactable par
      // d'autres agences, cf. opportunity.py::recompute_project_status) —
      // mais doit AUSSI compter/apparaître dans l'onglet "Rejetés", avec le
      // nom de l'agence qui a refusé (AgencyLink). Les deux onglets à la
      // fois, jusqu'à ce qu'une agence accepte (passage réel à "En cours",
      // qui efface `declinedByAgency` côté backend).
      if (project.status !== "rejected" && project.declinedByAgency) {
        result.rejected = (result.rejected ?? 0) + 1;
      }
    }
    return result;
  }, [allProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let items = allProjects.filter((project) => {
      const matchesStatus =
        activeStatus === "all" ||
        project.status === activeStatus ||
        (activeStatus === "rejected" && Boolean(project.declinedByAgency));
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.reference.toLowerCase().includes(normalizedQuery) ||
        project.category.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });

    items = [...items].sort((a, b) =>
      sortDirection === "recent"
        ? b.lastActivity.localeCompare(a.lastActivity)
        : a.lastActivity.localeCompare(b.lastActivity),
    );

    return items;
  }, [allProjects, activeStatus, query, sortDirection]);

  const total = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const projects = filteredProjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <DashboardShell role="client">
      <style>
        {`.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }`}
      </style>

      <div className="mx-auto max-w-[1080px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-bold tracking-tight">Mes projets</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Suivez l'ensemble de vos projets.
            </p>
          </div>

          <Link
            to="/client/postuler-un-projet"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-all hover:opacity-90 hover:shadow-md sm:justify-self-end"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Postuler un projet
          </Link>
        </div>

        {/* Recherche - design modernisé */}
        <div className="mt-7 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all focus-within:border-primary/50 focus-within:shadow-md">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.7} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un projet..."
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Onglets de statut */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto border-b border-border pb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveStatus(tab.value);
                setPage(1);
              }}
              aria-pressed={activeStatus === tab.value}
              className={
                "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all " +
                (activeStatus === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground")
              }
            >
              {tab.label}
              <span className="ml-1.5 font-normal opacity-70">{counts[tab.value] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FilterSelect label="Catégorie" placeholder="Toutes les catégories" />
          <FilterSelect label="Statut" placeholder="Tous les statuts" />
          <FilterSelect label="Période" placeholder="Toutes les périodes" />
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total} projet
            {total > 1 ? "s" : ""}
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

        {/* Tableau - design modernisé */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] gap-4 border-b border-border bg-accent/40 px-5 py-3 lg:grid">
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Projet
            </p>
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Catégorie
            </p>
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Agence
            </p>
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Statut
            </p>
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Budget
            </p>
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Dernière activité
            </p>
            <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
              Action
            </p>
            <span className="w-4" />
          </div>

          {isLoading ? (
            <div className="px-5 py-4">
              <TableSkeleton rows={8} columns={7} />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-5">
              <EmptyState message="Aucun projet à afficher." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectRow project={project} viewedFromTab={activeStatus} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <ListPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                         MENU ACTIONS PROJET                                */
/* -------------------------------------------------------------------------- */

function ProjectActionsMenu({
                              canRepost,
                              canDelete,
                              isReposting,
                              isDeleting,
                              onRepost,
                              onDelete,
                              className,
                            }: {
  canRepost: boolean;
  canDelete: boolean;
  isReposting: boolean;
  isDeleting: boolean;
  onRepost: () => void;
  onDelete: () => void;
  className?: string;
}) {
  if (!canRepost && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Plus d'actions"
          className={
            "rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground " +
            (className ?? "")
          }
        >
          <MoreVertical className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="rounded-xl border-border shadow-lg">
        {canRepost ? (
          <DropdownMenuItem
            disabled={isReposting}
            onClick={onRepost}
            className="cursor-pointer gap-2 text-[13px]"
          >
            <RefreshCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
            {isReposting ? "Republication..." : "Repostuler"}
          </DropdownMenuItem>
        ) : null}

        {canDelete ? (
          <DropdownMenuItem
            disabled={isDeleting}
            className="cursor-pointer gap-2 text-[13px] text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            {isDeleting ? "Suppression..." : "Supprimer"}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/*                          BLOC AGENCE (CORRIGÉ)                             */
/* -------------------------------------------------------------------------- */

function AgencyLink({ project }: { project: Project }) {
  // AJOUTÉ (demande explicite) : un refus n'entraîne plus jamais le rejet
  // automatique du projet (il reste "Postulé", visible dans "Disponibles"
  // pour d'autres agences, cf. opportunity.py::recompute_project_status) —
  // le client doit néanmoins pouvoir voir QUI a refusé, tant qu'aucune
  // agence n'a encore gagné le projet.
  if (!project.agencyId) {
    // AJOUTÉ (demande explicite) : l'agence qui a refusé doit être
    // cliquable (vers son profil public), comme l'agence gagnante ci-dessous
    // — ce n'était jusqu'ici qu'un texte statique.
    if (project.declinedByAgencyName && project.declinedByAgency) {
      return (
        <Link
          to="/agences/$id"
          params={{ id: project.declinedByAgency }}
          className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          <span className="truncate">{project.declinedByAgencyName} (a refusé)</span>
        </Link>
      );
    }
    return <span className="text-[13px] text-muted-foreground">—</span>;
  }

  return (
    <Link
      to="/agences/$id"
      params={{ id: project.agencyId }}
      className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-primary transition-colors hover:underline"
    >
      <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
      <span className="truncate">{project.partnerAgencyName ?? "Voir l'agence"}</span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PROJECT ROW (CORRIGÉ)                         */
/* -------------------------------------------------------------------------- */

function ProjectRow({
                      project,
                      viewedFromTab,
                    }: {
  project: Project;
  viewedFromTab: "all" | ProjectStatus;
}) {
  const queryClient = useQueryClient();

  const repostMutation = useMutation({
    mutationFn: () => repostProject(project.id),
    onSuccess: () => {
      toast("Projet republié auprès des agences pertinentes.");
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
      void queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Impossible de supprimer ce projet.");
    },
  });

  function handleDelete() {
    if (window.confirm("Supprimer définitivement ce projet ?")) {
      deleteMutation.mutate();
    }
  }

  const canRepost = project.status === "published";
  const canDelete = project.status === "draft" || project.status === "published";

  const categoryStyle = CATEGORY_STYLES[project.category] ?? DEFAULT_CATEGORY_STYLE;
  const CategoryIcon = categoryStyle.icon;

  // AJOUTÉ (demande explicite) : un projet refusé par une agence garde son
  // vrai statut "Postulé" (toujours contactable, cf. recompute_project_
  // status) mais apparaît aussi dans l'onglet "Rejetés" (cf. `counts`/
  // `filteredProjects` ci-dessus) — afficher le badge "Publié" dans une
  // liste "Rejetés" n'était pas clair. Le badge reflète donc le statut réel
  // partout SAUF quand on le consulte spécifiquement depuis l'onglet
  // "Rejetés" pour un projet refusé (où il affiche "Rejeté").
  const displayStatus: ProjectStatus =
    viewedFromTab === "rejected" && project.status !== "rejected" && project.declinedByAgency
      ? "rejected"
      : project.status;
  // ✅ CORRECTION : Utilisation sécurisée de getStatusConfig
  const statusConfig = getStatusConfig(displayStatus);
  const StatusIcon = statusConfig.icon;
  const title = formatProjectTitle(project.title);

  const resumeLink =
    project.status === "draft" ? (
      <Link
        to="/client/postuler-un-projet"
        search={{ resume: project.id }}
        className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
      >
        📝 Reprendre
      </Link>
    ) : (
      <Link
        to="/client/mes-projets/$id"
        params={{ id: project.id }}
        className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-[13px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
      >
        👁️ Voir
      </Link>
    );

  return (
    <>
      {/* ======================= VUE TABLEAU DESKTOP ======================= */}
      <div className="hidden px-5 py-4 transition-colors hover:bg-accent/30 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] lg:items-center lg:gap-4">
        {/* Projet - Titre mis en avant avec référence */}
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm " +
              categoryStyle.className
            }
          >
            <CategoryIcon className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="font-display line-clamp-2 text-[15px] font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary">
              {title}
            </p>
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

        {/* ✅ COLONNE AGENCE CORRIGÉE */}
        <div className="min-w-0">
          <AgencyLink project={project} />
        </div>

        {/* Statut - Badge modernisé avec icône */}
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

        {/* Budget */}
        <p className="truncate text-[13px] font-medium">
          {project.budgetMin && project.budgetMax ? (
            <>
              {project.budgetMin.toLocaleString()} € — {project.budgetMax.toLocaleString()} €
            </>
          ) : (
            <span className="text-muted-foreground">Non défini</span>
          )}
        </p>

        {/* Dernière activité */}
        <p className="truncate text-[13px] text-muted-foreground">{project.lastActivity}</p>

        {/* Action */}
        <div className="min-w-0">{resumeLink}</div>

        {/* Menu actions */}
        <ProjectActionsMenu
          canRepost={canRepost}
          canDelete={canDelete}
          isReposting={repostMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onRepost={() => repostMutation.mutate()}
          onDelete={handleDelete}
          className="justify-self-center"
        />
      </div>

      {/* =========================== VUE MOBILE ============================ */}
      <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-accent/30 lg:hidden">
        <div className="flex items-start gap-3">
          <div
            className={
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm " +
              categoryStyle.className
            }
          >
            <CategoryIcon className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-[14px] font-bold leading-snug">{title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
              {project.reference ? `Réf. ${project.reference.slice(0, 8)}` : "Nouveau projet"}
            </p>
          </div>

          <ProjectActionsMenu
            canRepost={canRepost}
            canDelete={canDelete}
            isReposting={repostMutation.isPending}
            isDeleting={deleteMutation.isPending}
            onRepost={() => repostMutation.mutate()}
            onDelete={handleDelete}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`
              inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold
              ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}
            `}
          >
            <StatusIcon className="h-3 w-3" strokeWidth={2} />
            {statusConfig.label}
          </span>

          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
            {project.category || "Non catégorisé"}
          </span>
        </div>

        {/* ✅ Agence en mobile */}
        {project.agencyId || project.declinedByAgencyName ? (
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wide">Agence :</span>
            <AgencyLink project={project} />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-[12.5px] text-muted-foreground">
          <p>
            <span className="block text-[11px] uppercase tracking-wide">Budget</span>
            {project.budgetMin && project.budgetMax ? (
              <>
                {project.budgetMin.toLocaleString()} € — {project.budgetMax.toLocaleString()} €
              </>
            ) : (
              <span className="text-muted-foreground">Non défini</span>
            )}
          </p>
          <p>
            <span className="block text-[11px] uppercase tracking-wide">Dernière activité</span>
            {project.lastActivity}
          </p>
        </div>

        {resumeLink}
      </div>
    </>
  );
}