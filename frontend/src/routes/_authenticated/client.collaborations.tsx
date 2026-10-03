import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ChevronDown, Search, Star, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { FilterSelect, ListPagination } from "@/components/common/ListControls";
import { ActionModal } from "@/components/common/ActionModal";
import { TextAreaField } from "@/components/common/Blocks";
import type { Collaboration, CollaborationProjectReview } from "@/lib/types";
import { getCollaborations, submitCollaborationReview } from "@/services/collaborations.service";
import { ApiError } from "@/services/http";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

export const Route = createFileRoute("/_authenticated/client/collaborations")({
  head: () => ({
    meta: [
      { title: "Collaborations — Sortlist Pro" },
      {
        name: "description",
        content:
          "Retrouvez les agences avec lesquelles vous avez des projets terminés, filtrez par période, note et budget.",
      },
      { property: "og:title", content: "Collaborations — Sortlist Pro" },
      {
        property: "og:description",
        content: "Agences avec lesquelles vous avez des projets terminés.",
      },
    ],
  }),
  component: ClientCollaborationsPage,
});

const RATING_TABS = [
  { value: "all", label: "Toutes" },
  { value: "reviewed", label: "Avis publiés" },
  { value: "pending", label: "Avis à publier" },
];

const PAGE_SIZE = 20;

const PERIOD_OPTIONS: Array<{ value: string; label: string; days: number }> = [
  { value: "7d", label: "7 derniers jours", days: 7 },
  { value: "30d", label: "30 derniers jours", days: 30 },
  { value: "90d", label: "90 derniers jours", days: 90 },
];

const RATING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "5", label: "5 étoiles" },
  { value: "4", label: "4 étoiles et +" },
  { value: "3", label: "3 étoiles et +" },
  { value: "2", label: "2 étoiles et +" },
  { value: "1", label: "1 étoile et +" },
];

const SORT_OPTIONS: Array<{ value: "recent" | "rating" | "budget"; label: string }> = [
  { value: "recent", label: "Plus récentes" },
  { value: "rating", label: "Mieux notées" },
  { value: "budget", label: "Budget le plus élevé" },
];

const PAGE_TEXT = {
  "Toutes": {
    en: "All",
    ar: "الكل",
    es: "Todas",
  },
  "Avis publiés": {
    en: "Published reviews",
    ar: "التقييمات المنشورة",
    es: "Reseñas publicadas",
  },
  "Avis à publier": {
    en: "Reviews to publish",
    ar: "التقييمات بانتظار النشر",
    es: "Reseñas por publicar",
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
  "5 étoiles": {
    en: "5 stars",
    ar: "5 نجوم",
    es: "5 estrellas",
  },
  "4 étoiles et +": {
    en: "4 stars and up",
    ar: "4 نجوم فأكثر",
    es: "4 estrellas o más",
  },
  "3 étoiles et +": {
    en: "3 stars and up",
    ar: "3 نجوم فأكثر",
    es: "3 estrellas o más",
  },
  "2 étoiles et +": {
    en: "2 stars and up",
    ar: "نجمتان فأكثر",
    es: "2 estrellas o más",
  },
  "1 étoile et +": {
    en: "1 star and up",
    ar: "نجمة واحدة فأكثر",
    es: "1 estrella o más",
  },
  "Plus récentes": {
    en: "Most recent",
    ar: "الأحدث",
    es: "Más recientes",
  },
  "Mieux notées": {
    en: "Top rated",
    ar: "الأعلى تقييمًا",
    es: "Mejor valoradas",
  },
  "Budget le plus élevé": {
    en: "Highest budget",
    ar: "أعلى ميزانية",
    es: "Mayor presupuesto",
  },
  "Collaborations": {
    en: "Collaborations",
    ar: "التعاونات",
    es: "Colaboraciones",
  },
  "Agences avec lesquelles vous avez des projets terminés": {
    en: "Agencies you have completed projects with",
    ar: "الوكالات التي أنجزت معها مشاريع",
    es: "Agencias con las que has completado proyectos",
  },
  "Rechercher une agence ou un projet...": {
    en: "Search for an agency or a project...",
    ar: "ابحث عن وكالة أو مشروع...",
    es: "Buscar una agencia o un proyecto...",
  },
  "Agence": {
    en: "Agency",
    ar: "الوكالة",
    es: "Agencia",
  },
  "Toutes les agences": {
    en: "All agencies",
    ar: "جميع الوكالات",
    es: "Todas las agencias",
  },
  "Période": {
    en: "Period",
    ar: "الفترة",
    es: "Período",
  },
  "Toutes les périodes": {
    en: "All periods",
    ar: "جميع الفترات",
    es: "Todos los períodos",
  },
  "Note reçue": {
    en: "Rating received",
    ar: "التقييم المُستلم",
    es: "Calificación recibida",
  },
  "Toutes les notes": {
    en: "All ratings",
    ar: "جميع التقييمات",
    es: "Todas las calificaciones",
  },
  "collaborations": {
    en: "collaborations",
    ar: "تعاونات",
    es: "colaboraciones",
  },
  "Trier par": {
    en: "Sort by",
    ar: "ترتيب حسب",
    es: "Ordenar por",
  },
  "Projets terminés": {
    en: "Completed projects",
    ar: "المشاريع المنجزة",
    es: "Proyectos completados",
  },
  "Budget": {
    en: "Budget",
    ar: "الميزانية",
    es: "Presupuesto",
  },
  "Action": {
    en: "Action",
    ar: "الإجراء",
    es: "Acción",
  },
  "Aucune collaboration à afficher.": {
    en: "No collaboration to display.",
    ar: "لا يوجد تعاون لعرضه.",
    es: "No hay colaboración para mostrar.",
  },
  "Agence :": {
    en: "Agency:",
    ar: "الوكالة:",
    es: "Agencia:",
  },
  "Fermer": {
    en: "Close",
    ar: "إغلاق",
    es: "Cerrar",
  },
  "Voir l'avis": {
    en: "View review",
    ar: "عرض التقييم",
    es: "Ver la reseña",
  },
  "Laisser un avis": {
    en: "Leave a review",
    ar: "ترك تقييم",
    es: "Dejar una reseña",
  },
  "Votre avis": {
    en: "Your review",
    ar: "تقييمك",
    es: "Tu reseña",
  },
  "Projet :": {
    en: "Project:",
    ar: "المشروع:",
    es: "Proyecto:",
  },
  "Envoi…": {
    en: "Sending…",
    ar: "جارٍ الإرسال…",
    es: "Enviando…",
  },
  "Envoyer l'avis": {
    en: "Send review",
    ar: "إرسال التقييم",
    es: "Enviar reseña",
  },
  "Note": {
    en: "Rating",
    ar: "التقييم",
    es: "Calificación",
  },
  "étoile": {
    en: "star",
    ar: "نجمة",
    es: "estrella",
  },
  "étoiles": {
    en: "stars",
    ar: "نجوم",
    es: "estrellas",
  },
  "Voir les avis": {
    en: "View reviews",
    ar: "عرض التقييمات",
    es: "Ver las reseñas",
  },
  "avis laissés": {
    en: "reviews left",
    ar: "تقييمات مُقدَّمة",
    es: "reseñas dejadas",
  },
  "Avis envoyé": {
    en: "Review sent",
    ar: "تم إرسال التقييم",
    es: "Reseña enviada",
  },
  "Impossible d'envoyer l'avis.": {
    en: "Unable to send the review.",
    ar: "تعذّر إرسال التقييم.",
    es: "No se pudo enviar la reseña.",
  },
} satisfies PageTextDict;

function ClientCollaborationsPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();

  const collaborationsQuery = useQuery({
    queryKey: ["client", "collaborations"],
    queryFn: () => getCollaborations(),
  });
  const isLoading = collaborationsQuery.isPending;
  const allCollaborations = useMemo(
    () => collaborationsQuery.data?.items ?? [],
    [collaborationsQuery.data],
  );

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [agencyFilter, setAgencyFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "budget">("recent");

  const agencyOptions = useMemo(
    () => allCollaborations.map((c) => ({ value: c.id, label: c.agencyName })),
    [allCollaborations],
  );

  const isFullyReviewed = (collaboration: Collaboration) =>
    collaboration.projects.length > 0 && collaboration.projects.every((p) => p.reviewed);

  const counts = useMemo<Record<string, number>>(() => {
    const reviewed = allCollaborations.filter(isFullyReviewed).length;
    return {
      all: allCollaborations.length,
      reviewed,
      pending: allCollaborations.length - reviewed,
    };
  }, [allCollaborations]);

  const filteredCollaborations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const periodDays = PERIOD_OPTIONS.find((option) => option.value === periodFilter)?.days;
    const periodCutoff = periodDays ? Date.now() - periodDays * 24 * 60 * 60 * 1000 : null;
    const minRating = ratingFilter ? Number(ratingFilter) : null;

    return allCollaborations.filter((collaboration) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "reviewed" && isFullyReviewed(collaboration)) ||
        (activeTab === "pending" && !isFullyReviewed(collaboration));
      const matchesQuery =
        normalizedQuery.length === 0 ||
        collaboration.agencyName.toLowerCase().includes(normalizedQuery) ||
        collaboration.projects.some((p) => p.title.toLowerCase().includes(normalizedQuery));
      const matchesAgency = !agencyFilter || collaboration.id === agencyFilter;
      const matchesRating = minRating === null || collaboration.ratingReceived >= minRating;
      const matchesPeriod =
        periodCutoff === null ||
        collaboration.projects.some(
          (p) => p.endDate && new Date(p.endDate).getTime() >= periodCutoff,
        );
      return matchesTab && matchesQuery && matchesAgency && matchesRating && matchesPeriod;
    });
  }, [allCollaborations, activeTab, query, agencyFilter, periodFilter, ratingFilter]);

  const sortedCollaborations = useMemo(() => {
    const result = [...filteredCollaborations];
    result.sort((a, b) => {
      if (sortBy === "rating") return b.ratingReceived - a.ratingReceived;
      if (sortBy === "budget") return (b.budgetValue ?? 0) - (a.budgetValue ?? 0);
      const dateA = a.periodEndRaw ? new Date(a.periodEndRaw).getTime() : 0;
      const dateB = b.periodEndRaw ? new Date(b.periodEndRaw).getTime() : 0;
      return dateB - dateA;
    });
    return result;
  }, [filteredCollaborations, sortBy]);

  const total = sortedCollaborations.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const collaborations = sortedCollaborations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const [projectPickerTarget, setProjectPickerTarget] = useState<Collaboration | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    collaboration: Collaboration;
    project: CollaborationProjectReview;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const reviewMutation = useMutation({
    mutationFn: (payload: { id: string; rating: number; publicReview: string }) =>
      submitCollaborationReview(payload.id, {
        rating: payload.rating,
        publicReview: payload.publicReview,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", "collaborations"] });
      toast.success(tt("Avis envoyé"));
      setReviewTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tt("Impossible d'envoyer l'avis."));
    },
  });

  const openReviewModal = (collaboration: Collaboration, project: CollaborationProjectReview) => {
    setProjectPickerTarget(null);
    setReviewTarget({ collaboration, project });
    setReviewRating(project.yourRating || 5);
    setReviewComment(project.yourComment);
  };

  const openReviewFlow = (collaboration: Collaboration) => {
    setProjectPickerTarget(collaboration);
  };

  return (
    <DashboardShell role="client">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">{tt("Collaborations")}</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          {tt("Agences avec lesquelles vous avez des projets terminés")}
        </p>

        {/* Recherche */}
        <div className="mt-7 flex items-center gap-3 rounded-md border border-border px-4 py-3">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.7} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tt("Rechercher une agence ou un projet...")}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Onglets */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {RATING_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              aria-pressed={activeTab === tab.value}
              className={
                activeTab === tab.value
                  ? "rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground"
                  : "rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-accent"
              }
            >
              {tt(tab.label)}
              <span className="ml-1.5 text-[13px] font-normal opacity-70">
                {counts[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filtres */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FilterSelect
            label={tt("Agence")}
            placeholder={tt("Toutes les agences")}
            options={agencyOptions}
            value={agencyFilter}
            onChange={(value) => {
              setAgencyFilter(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label={tt("Période")}
            placeholder={tt("Toutes les périodes")}
            options={PERIOD_OPTIONS.map((option) => ({ ...option, label: tt(option.label) }))}
            value={periodFilter}
            onChange={(value) => {
              setPeriodFilter(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label={tt("Note reçue")}
            placeholder={tt("Toutes les notes")}
            options={RATING_OPTIONS.map((option) => ({ ...option, label: tt(option.label) }))}
            value={ratingFilter}
            onChange={(value) => {
              setRatingFilter(value);
              setPage(1);
            }}
          />
        </div>

        {/* Compteur + tri */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">
            {total} {tt("collaborations")}
          </p>
          <label className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground">
            {tt("Trier par")}
            <span className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as "recent" | "rating" | "budget")
                }
                className="appearance-none bg-transparent pr-5 text-foreground outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {tt(option.label)}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-0 h-3.5 w-3.5"
                strokeWidth={1.8}
              />
            </span>
          </label>
        </div>

        {/* Tableau */}
        <div className="mt-4 rounded-lg border border-border">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-border px-5 py-3 lg:grid">
            <p className="text-[13px] font-semibold">{tt("Agence")}</p>
            <p className="text-[13px] font-semibold">{tt("Projets terminés")}</p>
            <p className="text-[13px] font-semibold">{tt("Période")}</p>
            <p className="text-[13px] font-semibold">{tt("Budget")}</p>
            <p className="text-[13px] font-semibold">{tt("Note reçue")}</p>
            <p className="text-[13px] font-semibold">{tt("Action")}</p>
          </div>

          {isLoading ? (
            <div className="px-5">
              <TableSkeleton rows={6} columns={6} />
            </div>
          ) : collaborations.length === 0 ? (
            <div className="p-5">
              <EmptyState message={tt("Aucune collaboration à afficher.")} />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {collaborations.map((collaboration) => (
                <li key={collaboration.id}>
                  <CollaborationRow
                    collaboration={collaboration}
                    onReview={() => openReviewFlow(collaboration)}
                    tt={tt}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <ListPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Liste des projets Terminés de l'agence — un avis distinct est
          possible pour chacun, et le titre du projet ouvre sa fiche détail
          (demande explicite : accéder au projet, pas seulement le noter). */}
      <ActionModal
        open={projectPickerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setProjectPickerTarget(null);
        }}
        title={tt("Projets terminés")}
        description={projectPickerTarget ? `${tt("Agence :")} ${projectPickerTarget.agencyName}` : ""}
        confirmLabel={tt("Fermer")}
        singleAction
        onConfirm={() => setProjectPickerTarget(null)}
      >
        <ul className="space-y-2">
          {(projectPickerTarget?.projects ?? []).map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <Link
                to="/client/mes-projets/$id"
                params={{ id: project.id }}
                onClick={() => setProjectPickerTarget(null)}
                className="min-w-0 hover:underline"
              >
                <p className="truncate text-[13.5px] font-semibold">
                  {project.title || project.id}
                </p>
                <p className="truncate text-[12.5px] text-muted-foreground">{project.period}</p>
              </Link>
              <button
                type="button"
                onClick={() => openReviewModal(projectPickerTarget!, project)}
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent"
              >
                {project.reviewed ? tt("Voir l'avis") : tt("Laisser un avis")}
              </button>
            </li>
          ))}
        </ul>
      </ActionModal>

      <ActionModal
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
        title={reviewTarget?.project.reviewed ? tt("Votre avis") : tt("Laisser un avis")}
        description={
          reviewTarget
            ? `${tt("Agence :")} ${reviewTarget.collaboration.agencyName} — ${tt("Projet :")} ${reviewTarget.project.title || reviewTarget.project.id}`
            : ""
        }
        confirmLabel={
          reviewTarget?.project.reviewed
            ? tt("Fermer")
            : reviewMutation.isPending
              ? tt("Envoi…")
              : tt("Envoyer l'avis")
        }
        singleAction={Boolean(reviewTarget?.project.reviewed)}
        onConfirm={() => {
          if (!reviewTarget) return;
          if (reviewTarget.project.reviewed) {
            setReviewTarget(null);
            return;
          }
          reviewMutation.mutate({
            id: reviewTarget.project.id,
            rating: reviewRating,
            publicReview: reviewComment,
          });
        }}
      >
        <div className="space-y-4">
          <div>
            <span className="text-[13px] text-muted-foreground">{tt("Note")}</span>
            <div className="mt-1.5 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={reviewTarget?.project.reviewed}
                  onClick={() => setReviewRating(value)}
                  aria-label={`${value} ${value > 1 ? tt("étoiles") : tt("étoile")}`}
                  className="text-foreground transition-opacity hover:opacity-70 disabled:cursor-default disabled:hover:opacity-100"
                >
                  <Star
                    className="h-5 w-5"
                    strokeWidth={1.8}
                    fill={value <= reviewRating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
          </div>
          <TextAreaField
            label={tt("Votre avis")}
            rows={4}
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            readOnly={reviewTarget?.project.reviewed}
          />
        </div>
      </ActionModal>
    </DashboardShell>
  );
}

function collaborationReviewLabel(
  collaboration: Collaboration,
  tt: (source: string) => string,
): string {
  const { projects } = collaboration;
  if (projects.length <= 1) {
    return projects[0]?.reviewed ? tt("Voir l'avis") : tt("Laisser un avis");
  }
  const reviewedCount = projects.filter((p) => p.reviewed).length;
  if (reviewedCount === projects.length) return tt("Voir les avis");
  if (reviewedCount === 0) return `${tt("Laisser un avis")} (${projects.length})`;
  return `${reviewedCount}/${projects.length} ${tt("avis laissés")}`;
}

function CollaborationRow({
  collaboration,
  onReview,
  tt,
}: {
  collaboration: Collaboration;
  onReview: () => void;
  tt: (source: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {collaboration.agencyLogo ? (
          <img
            src={collaboration.agencyLogo}
            alt={collaboration.agencyName}
            className="h-9 w-9 shrink-0 rounded-md object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-[13px] font-bold">
            {collaboration.agencyInitials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-bold">{collaboration.agencyName}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {collaboration.agencyTagline}
          </p>
        </div>
      </div>

      <p className="truncate text-[13px]">{collaboration.finishedProjects}</p>

      <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
        <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.8} />
        <span className="truncate">{collaboration.period}</span>
      </p>

      <p className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <Wallet className="h-3 w-3 shrink-0" strokeWidth={1.8} />
        <span className="truncate">{collaboration.budget}</span>
      </p>

      <p className="flex items-center gap-1.5 text-[13px] font-semibold">
        <Star className="h-3 w-3 shrink-0" strokeWidth={1.8} />
        {collaboration.ratingReceived}/5
      </p>

      <div className="min-w-0">
        <button
          onClick={onReview}
          type="button"
          className="w-full rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent lg:w-auto"
        >
          {collaborationReviewLabel(collaboration, tt)}
        </button>
      </div>
    </div>
  );
}
