import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, LayoutGrid, List, Search, Filter, Calendar, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/common/EmptyState";
import { StackSkeleton } from "@/components/common/Skeletons";
import {
  listFavoriteAgencies,
  toggleFavoriteAgency,
  type FavoriteAgencyEntry,
} from "@/services/agencies.service";
import { ApiError } from "@/services/http";

/**
 * Agences favorites (Client) — CDC §1.4 : le client ajoute une agence en
 * favori depuis son profil public (bouton étoile) pour la retrouver
 * facilement et la contacter plus tard, sans avoir à la rechercher à
 * nouveau. `client.list_favorites`/`client.toggle_favorite` existaient déjà
 * côté backend mais n'étaient jamais appelés côté frontend.
 */
export const Route = createFileRoute("/_authenticated/client/agences-favorites")({
  head: () => ({
    meta: [
      { title: "Agences favorites — Sortlist Pro" },
      {
        name: "description",
        content: "Retrouvez les agences que vous avez ajoutées à vos favoris.",
      },
      { property: "og:title", content: "Agences favorites — Sortlist Pro" },
      {
        property: "og:description",
        content: "Vos agences favorites, à recontacter pour un futur projet.",
      },
    ],
  }),
  component: ClientFavoriteAgenciesPage,
});

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function ClientFavoriteAgenciesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  const favoritesQuery = useQuery({
    queryKey: ["client", "favorite-agencies"],
    queryFn: listFavoriteAgencies,
  });
  const favorites = favoritesQuery.data ?? [];
  const isLoading = favoritesQuery.isPending;

  // Extraire les catégories uniques (si disponibles)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    favorites.forEach((fav) => {
      // @ts-expect-error - Si la propriété existe dans l'API
      if (fav.category) cats.add(fav.category);
    });
    return Array.from(cats);
  }, [favorites]);

  // Filtrer et trier les favoris
  const filteredAndSortedFavorites = useMemo(() => {
    const result = favorites.filter((fav) => {
      const matchesSearch =
        fav.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fav.agency?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" ||
        // @ts-expect-error - Si la propriété existe dans l'API
        fav.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.agencyName || "").localeCompare(b.agencyName || "");
      }
      // Date d'ajout (par défaut)
      const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [favorites, searchTerm, filterCategory, sortBy]);

  const removeMutation = useMutation({
    mutationFn: (agencyId: string) => toggleFavoriteAgency(agencyId),
    onSuccess: (_result, agencyId) => {
      queryClient.setQueryData<FavoriteAgencyEntry[]>(["client", "favorite-agencies"], (current) =>
        (current ?? []).filter((fav) => fav.agency !== agencyId),
      );
      toast.success("Agence retirée de vos favoris");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Action impossible.");
    },
  });

  return (
    <DashboardShell role="client">
      <div className="mx-auto max-w-[1080px]">
        {/* En-tête */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">Agences favorites</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Agences que vous avez ajoutées à vos favoris, à recontacter pour un prochain projet.
            </p>
          </div>
          {favorites.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary">
                {favorites.length} agence{favorites.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Statistiques */}
        {favorites.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[12px] text-muted-foreground">Total favoris</p>
              <p className="text-[20px] font-bold">{favorites.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[12px] text-muted-foreground">Dernier ajout</p>
              <p className="text-[14px] font-medium">
                {favorites.length > 0 && favorites[0]?.dateAdded
                  ? formatDate(favorites[0].dateAdded)
                  : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[12px] text-muted-foreground">Catégories</p>
              <p className="text-[14px] font-medium">{categories.length || 0} différentes</p>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        {favorites.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher une agence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              {categories.length > 0 && (
                <div className="flex items-center gap-1">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-2 text-[13px] outline-none focus:border-primary"
                  >
                    <option value="all">Toutes</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "name")}
                className="rounded-md border border-border bg-background px-2 py-2 text-[13px] outline-none focus:border-primary"
              >
                <option value="date">📅 Date d'ajout</option>
                <option value="name">📝 Nom</option>
              </select>

              <div className="flex items-center gap-0.5 rounded-md border border-border">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-l-md p-1.5 transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                  aria-label="Vue en grille"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-r-md p-1.5 transition-colors ${
                    viewMode === "list"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                  aria-label="Vue en liste"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des favoris */}
        <div className="mt-6">
          {isLoading ? (
            <StackSkeleton count={3} />
          ) : favorites.length === 0 ? (
            <EmptyState message="Aucune agence favorite pour l'instant. Ajoutez-en une depuis son profil public." />
          ) : filteredAndSortedFavorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucun résultat</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aucune agence ne correspond à vos critères de recherche.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                }}
                className="mt-4 rounded-md border border-border px-4 py-2 text-[14px] font-semibold transition-colors hover:bg-accent"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <ul
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
                  : "flex flex-col gap-3"
              }
            >
              {filteredAndSortedFavorites.map((favorite) => (
                <li
                  key={favorite.agency}
                  className={`
                    group rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-sm
                    ${viewMode === "list" ? "flex items-start gap-4" : ""}
                  `}
                >
                  {/* Avatar et infos principales */}
                  <div
                    className={`flex min-w-0 flex-1 ${viewMode === "grid" ? "flex-col" : "items-start gap-4"}`}
                  >
                    <div
                      className={`flex items-start gap-3 ${viewMode === "grid" ? "w-full" : ""}`}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-[15px] font-bold transition-colors group-hover:bg-primary/5">
                        {initialsOf(favorite.agencyName || favorite.agency)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to="/agences/$id"
                              params={{ id: favorite.agency }}
                              className="block truncate text-[15px] font-bold transition-colors hover:text-primary"
                            >
                              {favorite.agencyName || favorite.agency}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date d'ajout */}
                    {favorite.dateAdded && (
                      <div className="mt-1.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Ajoutée {formatDate(favorite.dateAdded)}
                      </div>
                    )}

                    {/* Actions */}
                    <div
                      className={`mt-3 flex flex-wrap gap-2 ${viewMode === "grid" ? "" : "flex-shrink-0"}`}
                    >
                      <Link
                        to="/agences/$id"
                        params={{ id: favorite.agency }}
                        className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Profil
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(favorite.agency)}
                        disabled={removeMutation.isPending}
                        className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Star
                          className="h-3.5 w-3.5 text-yellow-400"
                          strokeWidth={1.8}
                          fill="currentColor"
                        />
                        Retirer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Message de fin */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-6 border-t border-border pt-4 text-center text-[13px] text-muted-foreground">
            {filteredAndSortedFavorites.length} agence
            {filteredAndSortedFavorites.length > 1 ? "s" : ""} favorite
            {filteredAndSortedFavorites.length > 1 ? "s" : ""} au total
            {searchTerm || filterCategory !== "all" ? " (filtrés)" : ""}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
