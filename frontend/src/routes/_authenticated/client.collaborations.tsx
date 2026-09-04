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

/** Écran Collaborations (espace Client) — agences avec projets terminés. */
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

/** AJOUTÉ (demande explicite) : filtres "Agence"/"Période"/"Note reçue" —
 * jusqu'ici rendus volontairement inertes (cf. `FilterSelect`, "mieux vaut
 * un contrôle honnêtement indisponible qu'un faux succès") faute de données
 * exposées pour les alimenter. Les dates brutes par projet et la note
 * agrégée existent désormais côté backend/mapping — filtrage 100% côté
 * client, dans le même esprit que la recherche et les onglets ci-dessus. */
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

function ClientCollaborationsPage() {
  const queryClient = useQueryClient();

  // Le backend (`client.list_collaborations`) ne filtre/trie/pagine pas —
  // on récupère la liste complète une fois, puis recherche/onglets/tri sont
  // appliqués côté client (voir `collaborations.service.ts::getCollaborations`).
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

  // Une ligne = une agence déjà unique (cf. client.list_collaborations,
  // groupé par agence) : pas besoin de dédupliquer.
  const agencyOptions = useMemo(
    () => allCollaborations.map((c) => ({ value: c.id, label: c.agencyName })),
    [allCollaborations],
  );

  // BUG CORRIGÉ (demande explicite) : "reviewed"/"pending" se basaient sur
  // UN SEUL avis par agence, alors qu'une agence peut avoir plusieurs
  // projets Terminés nécessitant chacun leur propre avis — une collaboration
  // ne compte désormais comme "avis publié" que si TOUS ses projets ont un
  // avis (cf. `collaboration.projects[].reviewed`).
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

  const total = filteredCollaborations.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const collaborations = filteredCollaborations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // AJOUTÉ (demande explicite) : un avis par PROJET, pas par agence — quand
  // une agence a plusieurs projets Terminés, l'action ouvre d'abord un choix
  // de projet (`projectPickerTarget`) plutôt que de notifier directement le
  // premier projet trouvé.
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
      toast.success("Avis envoyé");
      setReviewTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Impossible d'envoyer l'avis.");
    },
  });

  const openReviewModal = (collaboration: Collaboration, project: CollaborationProjectReview) => {
    setProjectPickerTarget(null);
    setReviewTarget({ collaboration, project });
    setReviewRating(project.yourRating || 5);
    setReviewComment(project.yourComment);
  };

  // AJOUTÉ (demande explicite) : toujours passer par la liste des projets
  // (même s'il n'y en a qu'un seul) — c'est là qu'on peut accéder au détail
  // du projet, pas seulement laisser un avis directement.
  const openReviewFlow = (collaboration: Collaboration) => {
    setProjectPickerTarget(collaboration);
  };

  return (
    <DashboardShell role="client">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="text-[24px] font-bold tracking-tight">Collaborations</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Agences avec lesquelles vous avez des projets terminés
        </p>

        {/* Recherche */}
        <div className="mt-7 flex items-center gap-3 rounded-md border border-border px-4 py-3">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.7} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une agence ou un projet..."
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
              {tab.label}
              <span className="ml-1.5 text-[13px] font-normal opacity-70">
                {counts[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filtres */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FilterSelect
            label="Agence"
            placeholder="Toutes les agences"
            options={agencyOptions}
            value={agencyFilter}
            onChange={(value) => {
              setAgencyFilter(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Période"
            placeholder="Toutes les périodes"
            options={PERIOD_OPTIONS}
            value={periodFilter}
            onChange={(value) => {
              setPeriodFilter(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Note reçue"
            placeholder="Toutes les notes"
            options={RATING_OPTIONS}
            value={ratingFilter}
            onChange={(value) => {
              setRatingFilter(value);
              setPage(1);
            }}
          />
        </div>

        {/* Compteur + tri */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold">{total} collaborations</p>
          <button
            type="button"
            disabled
            title="Tri indisponible : le backend n'expose pas de date brute pour les collaborations, seulement une période déjà formatée."
            className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground opacity-60"
          >
            Trier par : Plus récentes
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Tableau */}
        <div className="mt-4 rounded-lg border border-border">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-border px-5 py-3 lg:grid">
            <p className="text-[13px] font-semibold">Agence</p>
            <p className="text-[13px] font-semibold">Projets terminés</p>
            <p className="text-[13px] font-semibold">Période</p>
            <p className="text-[13px] font-semibold">Budget</p>
            <p className="text-[13px] font-semibold">Note reçue</p>
            <p className="text-[13px] font-semibold">Action</p>
          </div>

          {isLoading ? (
            <div className="px-5">
              <TableSkeleton rows={6} columns={6} />
            </div>
          ) : collaborations.length === 0 ? (
            <div className="p-5">
              <EmptyState message="Aucune collaboration à afficher." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {collaborations.map((collaboration) => (
                <li key={collaboration.id}>
                  <CollaborationRow
                    collaboration={collaboration}
                    onReview={() => openReviewFlow(collaboration)}
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
        title="Projets terminés"
        description={projectPickerTarget ? `Agence : ${projectPickerTarget.agencyName}` : ""}
        confirmLabel="Fermer"
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
                {project.reviewed ? "Voir l'avis" : "Laisser un avis"}
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
        title={reviewTarget?.project.reviewed ? "Votre avis" : "Laisser un avis"}
        description={
          reviewTarget
            ? `Agence : ${reviewTarget.collaboration.agencyName} — Projet : ${reviewTarget.project.title || reviewTarget.project.id}`
            : ""
        }
        confirmLabel={reviewMutation.isPending ? "Envoi…" : "Envoyer l'avis"}
        onConfirm={() => {
          if (!reviewTarget) return;
          reviewMutation.mutate({
            id: reviewTarget.project.id,
            rating: reviewRating,
            publicReview: reviewComment,
          });
        }}
      >
        <div className="space-y-4">
          <div>
            <span className="text-[13px] text-muted-foreground">Note</span>
            <div className="mt-1.5 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                  className="text-foreground transition-opacity hover:opacity-70"
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
            label="Votre avis"
            rows={4}
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
          />
        </div>
      </ActionModal>
    </DashboardShell>
  );
}

function collaborationReviewLabel(collaboration: Collaboration): string {
  const { projects } = collaboration;
  if (projects.length <= 1) {
    return projects[0]?.reviewed ? "Voir l'avis" : "Laisser un avis";
  }
  const reviewedCount = projects.filter((p) => p.reviewed).length;
  if (reviewedCount === projects.length) return "Voir les avis";
  if (reviewedCount === 0) return `Laisser un avis (${projects.length})`;
  return `${reviewedCount}/${projects.length} avis laissés`;
}

function CollaborationRow({
  collaboration,
  onReview,
}: {
  collaboration: Collaboration;
  onReview: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-[13px] font-bold">
          {collaboration.agencyInitials}
        </span>
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
          {collaborationReviewLabel(collaboration)}
        </button>
      </div>
    </div>
  );
}
