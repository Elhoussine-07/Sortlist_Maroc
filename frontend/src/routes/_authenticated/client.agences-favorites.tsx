import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  LayoutGrid,
  List,
  Search,
  Calendar,
  ExternalLink,
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
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

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

const PAGE_TEXT = {
  "Agence retirée de vos favoris": {
    en: "Agency removed from your favorites",
    ar: "تمت إزالة الوكالة من مفضلاتك",
    es: "Agencia eliminada de tus favoritos",
  },
  "Action impossible.": {
    en: "Action could not be completed.",
    ar: "تعذر تنفيذ الإجراء.",
    es: "No se pudo completar la acción.",
  },
  "Agences favorites": {
    en: "Favorite agencies",
    ar: "الوكالات المفضلة",
    es: "Agencias favoritas",
  },
  "Retrouvez les agences que vous avez ajoutées à vos favoris": {
    en: "Find the agencies you've added to your favorites",
    ar: "اعثر على الوكالات التي أضفتها إلى مفضلاتك",
    es: "Encuentra las agencias que has añadido a tus favoritos",
  },
  "Total favoris": {
    en: "Total favorites",
    ar: "إجمالي المفضلة",
    es: "Total de favoritos",
  },
  "Dernier ajout": {
    en: "Last added",
    ar: "آخر إضافة",
    es: "Última añadida",
  },
  Vue: {
    en: "View",
    ar: "العرض",
    es: "Vista",
  },
  "Vue en grille": {
    en: "Grid view",
    ar: "عرض شبكي",
    es: "Vista de cuadrícula",
  },
  "Vue en liste": {
    en: "List view",
    ar: "عرض القائمة",
    es: "Vista de lista",
  },
  "Rechercher une agence...": {
    en: "Search for an agency...",
    ar: "ابحث عن وكالة...",
    es: "Buscar una agencia...",
  },
  "📅 Date d'ajout": {
    en: "📅 Date added",
    ar: "📅 تاريخ الإضافة",
    es: "📅 Fecha de adición",
  },
  "📝 Nom": {
    en: "📝 Name",
    ar: "📝 الاسم",
    es: "📝 Nombre",
  },
  "Aucune agence favorite": {
    en: "No favorite agencies",
    ar: "لا توجد وكالات مفضلة",
    es: "No hay agencias favoritas",
  },
  "Ajoutez des agences à vos favoris depuis leur profil public pour les retrouver facilement.": {
    en: "Add agencies to your favorites from their public profile to find them easily.",
    ar: "أضف الوكالات إلى مفضلاتك من ملفها الشخصي العام للعثور عليها بسهولة.",
    es: "Añade agencias a tus favoritos desde su perfil público para encontrarlas fácilmente.",
  },
  "Cliquez sur l'étoile ⭐ sur le profil d'une agence": {
    en: "Click the ⭐ star on an agency's profile",
    ar: "انقر على النجمة ⭐ في ملف الوكالة الشخصي",
    es: "Haz clic en la estrella ⭐ del perfil de una agencia",
  },
  "Aucun résultat": {
    en: "No results",
    ar: "لا توجد نتائج",
    es: "Sin resultados",
  },
  "Aucune agence ne correspond à vos critères de recherche.": {
    en: "No agency matches your search criteria.",
    ar: "لا توجد وكالة تطابق معايير بحثك.",
    es: "Ninguna agencia coincide con tus criterios de búsqueda.",
  },
  "Réinitialiser les filtres": {
    en: "Reset filters",
    ar: "إعادة ضبط الفلاتر",
    es: "Restablecer filtros",
  },
  "Voir le profil": {
    en: "View profile",
    ar: "عرض الملف الشخصي",
    es: "Ver perfil",
  },
  Retirer: {
    en: "Remove",
    ar: "إزالة",
    es: "Quitar",
  },
  Ajoutée: {
    en: "Added",
    ar: "أُضيفت",
    es: "Añadida",
  },
  "agence favorite au total": {
    en: "favorite agency in total",
    ar: "وكالة مفضلة بالإجمالي",
    es: "agencia favorita en total",
  },
  "agences favorites au total": {
    en: "favorite agencies in total",
    ar: "وكالات مفضلة بالإجمالي",
    es: "agencias favoritas en total",
  },
  "(filtrés)": {
    en: "(filtered)",
    ar: "(مُصفّاة)",
    es: "(filtrados)",
  },
  "Mis à jour": {
    en: "Updated",
    ar: "محدّث",
    es: "Actualizado",
  },
  "Aujourd'hui": {
    en: "Today",
    ar: "اليوم",
    es: "Hoy",
  },
  Hier: {
    en: "Yesterday",
    ar: "أمس",
    es: "Ayer",
  },
} satisfies PageTextDict;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateString: string, tt: (source: string) => string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return tt("Aujourd'hui");
  if (diffDays === 1) return tt("Hier");
  if (diffDays < 7) {
    const unit = locale === "en" ? "days" : locale === "ar" ? "أيام" : locale === "es" ? "días" : "jours";
    return locale === "fr"
      ? `Il y a ${diffDays} jours`
      : locale === "en"
        ? `${diffDays} days ago`
        : locale === "ar"
          ? `منذ ${diffDays} ${unit}`
          : `Hace ${diffDays} ${unit}`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return locale === "fr"
      ? `Il y a ${weeks} semaines`
      : locale === "en"
        ? `${weeks} weeks ago`
        : locale === "ar"
          ? `منذ ${weeks} أسابيع`
          : `Hace ${weeks} semanas`;
  }
  const localeTag =
    locale === "en" ? "en-US" : locale === "ar" ? "ar" : locale === "es" ? "es-ES" : "fr-FR";
  return date.toLocaleDateString(localeTag, { day: "numeric", month: "long", year: "numeric" });
}

function ClientFavoriteAgenciesPage() {
  const { tt, locale } = usePageText(PAGE_TEXT);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  const favoritesQuery = useQuery({
    queryKey: ["client", "favorite-agencies"],
    queryFn: listFavoriteAgencies,
  });
  const favorites = favoritesQuery.data ?? [];
  const isLoading = favoritesQuery.isPending;

  const filteredAndSortedFavorites = useMemo(() => {
    const result = favorites.filter((fav) => {
      return (
        fav.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fav.agency?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.agencyName || "").localeCompare(b.agencyName || "");
      }
      const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [favorites, searchTerm, sortBy]);

  const removeMutation = useMutation({
    mutationFn: (agencyId: string) => toggleFavoriteAgency(agencyId),
    onSuccess: (_result, agencyId) => {
      queryClient.setQueryData<FavoriteAgencyEntry[]>(["client", "favorite-agencies"], (current) =>
        (current ?? []).filter((fav) => fav.agency !== agencyId),
      );
      toast.success(tt("Agence retirée de vos favoris"));
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : tt("Action impossible."));
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
                  <Star className="h-6 w-6 text-white" fill="white" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="text-[26px] font-bold tracking-tight">{tt("Agences favorites")}</h1>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">
                    {tt("Retrouvez les agences que vous avez ajoutées à vos favoris")}
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
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                {tt("Total favoris")}
              </p>
              <p className="mt-1.5 text-[22px] font-bold">{favorites.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                {tt("Dernier ajout")}
              </p>
              <p className="mt-1.5 text-[14px] font-medium truncate">
                {favorites.length > 0 && favorites[0]?.dateAdded
                  ? formatDate(favorites[0].dateAdded, tt, locale)
                  : "-"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20 hover:shadow-sm">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                {tt("Vue")}
              </p>
              <div className="mt-1.5 flex items-center gap-1 rounded-md border border-border p-0.5 w-fit">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition-all ${
                    viewMode === "grid"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                  aria-label={tt("Vue en grille")}
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
                  aria-label={tt("Vue en liste")}
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
                  placeholder={tt("Rechercher une agence...")}
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
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "name")}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="date">{tt("📅 Date d'ajout")}</option>
                <option value="name">{tt("📝 Nom")}</option>
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
                <Star className="h-10 w-10 text-primary/40" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{tt("Aucune agence favorite")}</h3>
              <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
                {tt(
                  "Ajoutez des agences à vos favoris depuis leur profil public pour les retrouver facilement.",
                )}
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-full bg-primary/5 px-4 py-2 text-[13px] text-muted-foreground">
                <PlusCircle className="h-4 w-4" />
                <span>{tt("Cliquez sur l'étoile ⭐ sur le profil d'une agence")}</span>
              </div>
            </div>
          ) : filteredAndSortedFavorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background/50 p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">{tt("Aucun résultat")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {tt("Aucune agence ne correspond à vos critères de recherche.")}
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 rounded-xl border border-border px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-accent"
              >
                {tt("Réinitialiser les filtres")}
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
                return (
                  <li
                    key={favorite.agency}
                    className={`
                      group relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
                      ${viewMode === "list" ? "flex items-start gap-5" : ""}
                    `}
                  >
                    <div
                      className={`flex min-w-0 flex-1 ${viewMode === "grid" ? "flex-col" : "items-start gap-5"}`}
                    >
                      <div
                        className={`flex items-start gap-4 ${viewMode === "grid" ? "w-full" : ""}`}
                      >
                        {/* Avatar */}
                        {favorite.logo ? (
                          <img
                            src={favorite.logo}
                            alt={favorite.agencyName || favorite.agency}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md"
                          />
                        ) : (
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-[18px] font-bold text-primary transition-all group-hover:scale-105 group-hover:shadow-md">
                            {initialsOf(favorite.agencyName || favorite.agency)}
                          </div>
                        )}

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
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date d'ajout */}
                      {favorite.dateAdded && (
                        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground/60">
                          <Calendar className="h-3.5 w-3.5" />
                          {tt("Ajoutée")} {formatDate(favorite.dateAdded, tt, locale)}
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
                          {tt("Voir le profil")}
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
                          {tt("Retirer")}
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
              {filteredAndSortedFavorites.length}{" "}
              {tt(
                filteredAndSortedFavorites.length > 1
                  ? "agences favorites au total"
                  : "agence favorite au total",
              )}
              {searchTerm ? ` ${tt("(filtrés)")}` : ""}
            </p>
            <div className="flex items-center gap-1 text-[12px] text-muted-foreground/50">
              <Star className="h-3 w-3" fill="currentColor" strokeWidth={1.5} />
              <span>{tt("Mis à jour")}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
