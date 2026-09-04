import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  Clock,
  MapPin,
  Send,
  Tag,
  Star,
  ExternalLink,
  Briefcase,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { getPublicProject, type PublicProjectDetail } from "@/services/projects.service";
import { toggleProjectFavorite, listFavoriteProjects } from "@/services/agencies.service";
import { ApiError } from "@/services/http";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/projets_/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Détail du projet — Sortlist Pro" },
      {
        name: "description",
        content: "Découvrez les détails de ce projet et l'entreprise qui le publie.",
      },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = useParams({ from: "/projets_/$id" });
  const [project, setProject] = useState<PublicProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPendingFavorite, setIsPendingFavorite] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getPublicProject(id), listFavoriteProjects().catch(() => [])])
      .then(([projectData, favorites]) => {
        setProject(projectData);
        setIsFavorite(favorites.some((fav) => fav.id === id));
      })
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.message : "Impossible de charger le projet.");
        setProject(null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleToggleFavorite = () => {
    setIsPendingFavorite(true);
    toggleProjectFavorite(id)
      .then(({ favorited }) => {
        setIsFavorite(favorited);
        toast(favorited ? "Projet enregistré" : "Projet retiré des favoris");
      })
      .catch((error: unknown) => {
        toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer ce projet.");
      })
      .finally(() => setIsPendingFavorite(false));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader variant="search" active="projects" applyDisabled />
        <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mt-8 animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-muted" />
            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
                <div className="h-40 rounded-2xl bg-muted" />
              </div>
              <div className="space-y-6">
                <div className="h-48 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader variant="search" active="projects" applyDisabled />
        <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mt-8">
            <Link
              to="/projets"
              className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux projets
            </Link>
          </div>
          <div className="mt-12">
            <EmptyState message="Projet introuvable" />
          </div>
        </main>
      </div>
    );
  }

  const publishedDate = new Date(project.publishedAt);
  const budgetDisplay =
    project.budgetMin || project.budgetMax
      ? `${project.budgetMin} € - ${project.budgetMax} €`
      : "Budget à définir";

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="search" active="projects" applyDisabled />

      <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mt-8 flex items-center justify-between">
          <Link
            to="/projets"
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Retour aux projets
          </Link>
          <button
            onClick={handleToggleFavorite}
            disabled={isPendingFavorite}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-60"
          >
            <Bookmark
              className="h-4 w-4"
              strokeWidth={1.8}
              fill={isFavorite ? "currentColor" : "none"}
            />
            {isFavorite ? "Retirer des favoris" : "Enregistrer"}
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-100 px-2.5 py-1 text-[11px] font-medium text-fuchsia-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-600" />
                  Publié
                </span>
                <span className="text-[12px] text-muted-foreground">
                  le{" "}
                  {publishedDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1 className="mt-3 text-[28px] font-bold tracking-tight leading-tight">
                {project.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" strokeWidth={1.8} />
                  {project.location}
                </span>
                {project.category && (
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" strokeWidth={1.8} />
                    {project.category}
                  </span>
                )}
                {project.subCategory && (
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3" />
                    {project.subCategory}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-muted-foreground">Budget estimé</p>
              <p className="text-[20px] font-bold">{budgetDisplay}</p>
              {project.deliveryDelayDays && (
                <p className="text-[12px] text-muted-foreground">
                  <Clock className="inline h-3.5 w-3.5 mr-1" />
                  Livraison en {project.deliveryDelayDays} jours
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                Description du projet
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {project.description || "Aucune description disponible."}
              </p>
            </div>

            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Détails du projet
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {project.needType && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Type de projet
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">{project.needType}</p>
                  </div>
                )}
                {project.channel && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Canal
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">{project.channel}</p>
                  </div>
                )}
                {project.expectedEndDate && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Date de fin prévue
                    </p>
                    <p className="mt-1 text-[14px] font-semibold">
                      {new Date(project.expectedEndDate).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Entreprise
              </h2>
              <div className="mt-4">
                <div className="flex items-start gap-3">
                  {project.clientLogo ? (
                    <img
                      src={project.clientLogo}
                      alt={project.clientCompanyName}
                      className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                      <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.6} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold">{project.clientCompanyName}</p>
                    {project.clientCountry && (
                      <p className="text-[13px] text-muted-foreground">{project.clientCountry}</p>
                    )}
                    {project.clientSector && (
                      <p className="text-[12px] text-muted-foreground">{project.clientSector}</p>
                    )}
                  </div>
                </div>
                {project.clientTrustScore !== null && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-[13px] font-semibold">
                      Score de confiance : {project.clientTrustScore}/5
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Actions
              </h2>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Postuler au projet
                </button>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={isPendingFavorite}
                  className="w-full rounded-xl border border-border px-4 py-3 text-[14px] font-semibold transition-all hover:bg-accent disabled:opacity-60"
                >
                  <Bookmark
                    className="inline h-4 w-4 mr-2"
                    strokeWidth={1.8}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
