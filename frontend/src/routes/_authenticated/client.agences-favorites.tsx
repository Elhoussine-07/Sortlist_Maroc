import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  LayoutGrid,
  List,
  Search,
  Filter,
  Calendar,
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Heart,
  PlusCircle,
  X,
} from "lucide-react";
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

function getCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    Design: "bg-purple-100 text-purple-700",
    Marketing: "bg-blue-100 text-blue-700",
    Développement: "bg-green-100 text-green-700",
    Stratégie: "bg-orange-100 text-orange-700",
    Communication: "bg-pink-100 text-pink-700",
  };
  return colors[category || ""] || "bg-gray-100 text-gray-700";
}

function getCategoryIcon(category?: string) {
  const icons: Record<string, any> = {
    Design: Briefcase,
    Marketing: Building2,
    Développement: MapPin,
    Stratégie: Clock,
    Communication: ExternalLink,
  };
  return icons[category || ""] || Building2;
}

function ClientFavoriteAgenciesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      <div className="mx-auto max-w-[1200px]">
        {/* En-tête avec gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                  <Heart className="h-6 w-6 text-white" fill="white" />
                </div>
                <div>
                  <h1 className="text-[26px] font-bold tracking-tight">Agences favorites</h1>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">
                    Retrouvez les agences que vous avez ajoutées à vos favoris
                  </p>
                </div>
              </div>
            </div>
            {favorites.length > 0 && (
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5">
                  <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                  <span className="text-[14px] font-semibold text-primary">{favorites.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        {favorites.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                Total favoris
              </p>
              <p className="mt-1.5 text-[22px] font-bold">{favorites.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                Dernier ajout
              </p>
              <p className="mt-1.5 text-[14px] font-medium truncate">
                {favorites.length > 0 && favorites[0]?.dateAdded
                  ? formatDate(favorites[0].dateAdded)
                  : "-"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                Catégories
              </p>
              <p className="mt-1.5 text-[14px] font-medium">{categories.length || 0} différentes</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                Vue
              </p>
              <div className="mt-1.5 flex items-center gap-1 rounded-md border border-border p-0.5 w-fit">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition-all ${
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                  aria-label="Vue en grille"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 transition-all ${
                    viewMode === "list"
                      ? "bg-primary text-white shadow-sm"
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
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-[14px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {categories.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] transition-all ${
                      filterCategory !== "all"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {filterCategory !== "all" ? filterCategory : "Filtrer"}
                    </span>
                  </button>

                  {isFilterOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsFilterOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute left-0 z-20 mt-1.5 min-w-[180px] rounded-xl border border-border bg-background p-1 shadow-lg">
                        <button
                          onClick={() => {
                            setFilterCategory("all");
                            setIsFilterOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-accent ${
                            filterCategory === "all" ? "bg-accent font-semibold" : ""
                          }`}
                        >
                          Toutes les catégories
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setFilterCategory(cat);
                              setIsFilterOpen(false);
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-accent ${
                              filterCategory === cat ? "bg-accent font-semibold" : ""
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "name")}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="date">📅 Date d'ajout</option>
                <option value="name">📝 Nom</option>
              </select>
            </div>
          </div>
        )}

        {/* Liste des favoris */}
        <div className="mt-6">
          {isLoading ? (
            <StackSkeleton count={3} />
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/50 p-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Aucune agence favorite</h3>
              <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
                Ajoutez des agences à vos favoris depuis leur profil public pour les retrouver
                facilement.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-full bg-primary/5 px-4 py-2 text-[13px] text-muted-foreground">
                <PlusCircle className="h-4 w-4" />
                <span>Cliquez sur l'étoile ⭐ sur le profil d'une agence</span>
              </div>
            </div>
          ) : filteredAndSortedFavorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background/50 p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">Aucun résultat</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aucune agence ne correspond à vos critères de recherche.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                }}
                className="mt-4 rounded-xl border border-border px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-accent"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <ul
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {filteredAndSortedFavorites.map((favorite) => {
                const category = (favorite as any).category as string | undefined;
                const CategoryIcon = getCategoryIcon(category);
                const categoryColor = getCategoryColor(category);

                return (
                  <li
                    key={favorite.agency}
                    className={`
                      group relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
                      ${viewMode === "list" ? "flex items-start gap-5" : ""}
                    `}
                  >
                    {/* Badge catégorie en haut à droite */}
                    {category && (
                      <div
                        className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium ${categoryColor}`}
                      >
                        {category}
                      </div>
                    )}

                    <div
                      className={`flex min-w-0 flex-1 ${viewMode === "grid" ? "flex-col" : "items-start gap-5"}`}
                    >
                      <div
                        className={`flex items-start gap-4 ${viewMode === "grid" ? "w-full" : ""}`}
                      >
                        {/* Avatar avec gradient */}
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-[18px] font-bold text-primary transition-all group-hover:scale-105 group-hover:shadow-md">
                          {initialsOf(favorite.agencyName || favorite.agency)}
                          <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-primary/10 p-0.5">
                            <CategoryIcon className="h-3 w-3 text-primary/60" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                to="/agences/$id"
                                params={{ id: favorite.agency }}
                                className="block truncate text-[16px] font-bold transition-colors hover:text-primary"
                              >
                                {favorite.agencyName || favorite.agency}
                              </Link>
                              {category && (
                                <p className="mt-0.5 text-[12px] text-muted-foreground/70">
                                  {category}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date d'ajout */}
                      {favorite.dateAdded && (
                        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground/60">
                          <Calendar className="h-3.5 w-3.5" />
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
                          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Voir le profil
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(favorite.agency)}
                          disabled={removeMutation.isPending}
                          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-[13px] font-semibold text-muted-foreground transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                );
              })}
            </ul>
          )}
        </div>

        {/* Message de fin */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <p className="text-[13px] text-muted-foreground">
              {filteredAndSortedFavorites.length} agence
              {filteredAndSortedFavorites.length > 1 ? "s" : ""} favorite
              {filteredAndSortedFavorites.length > 1 ? "s" : ""} au total
              {searchTerm || filterCategory !== "all" ? " (filtrés)" : ""}
            </p>
            <div className="flex items-center gap-1 text-[12px] text-muted-foreground/50">
              <Heart className="h-3 w-3" fill="currentColor" />
              <span>Mis à jour</span>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
