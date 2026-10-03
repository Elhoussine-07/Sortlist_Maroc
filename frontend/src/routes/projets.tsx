import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Building2,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  Send,
  Users,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import type { Project } from "@/lib/types";
import { searchProjects, type ProjectSearchParams } from "@/services/projects.service";
import {
  getCategories,
  listFavoriteProjects,
  toggleProjectFavorite,
  type CategoryOption,
} from "@/services/agencies.service";
import { ApiError } from "@/services/http";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

interface ProjetsSearch {
  country?: string | undefined;
}

export const Route = createFileRoute("/projets")({
  validateSearch: (search: Record<string, unknown>): ProjetsSearch => ({
    country: typeof search["country"] === "string" ? search["country"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trouvez le projet idéal — Sortlist Pro" },
      {
        name: "description",
        content:
          "Parcourez les projets publiés par les entreprises et filtrez par catégorie, sous-catégorie et budget.",
      },
      { property: "og:title", content: "Trouvez le projet idéal — Sortlist Pro" },
      {
        property: "og:description",
        content: "Parcourez les projets publiés par les entreprises.",
      },
    ],
  }),
  component: SearchProjectsPage,
});

const SORT_OPTIONS: Array<{ value: NonNullable<ProjectSearchParams["sort"]>; label: string }> = [
  { value: "recent", label: "Plus récents" },
  { value: "relevance", label: "Plus pertinents" },
];

const PAGE_TEXT = {
  "Décrivez le type de projet que vous recherchez...": {
    en: "Describe the type of project you're looking for...",
    ar: "صف نوع المشروع الذي تبحث عنه...",
    es: "Describe el tipo de proyecto que buscas...",
  },
  Catégorie: { en: "Category", ar: "الفئة", es: "Categoría" },
  "Toutes les catégories": { en: "All categories", ar: "جميع الفئات", es: "Todas las categorías" },
  "Sous-catégorie": { en: "Subcategory", ar: "الفئة الفرعية", es: "Subcategoría" },
  "Toutes les sous-catégories": {
    en: "All subcategories",
    ar: "جميع الفئات الفرعية",
    es: "Todas las subcategorías",
  },
  Budget: { en: "Budget", ar: "الميزانية", es: "Presupuesto" },
  "Tous les budgets": { en: "All budgets", ar: "جميع الميزانيات", es: "Todos los presupuestos" },
  "Budget : ": { en: "Budget: ", ar: "الميزانية: ", es: "Presupuesto: " },
  "Pays : ": { en: "Country: ", ar: "البلد: ", es: "País: " },
  "Tri : ": { en: "Sort: ", ar: "الترتيب: ", es: "Orden: " },
  "Plus récents": { en: "Most recent", ar: "الأحدث", es: "Más recientes" },
  "Plus pertinents": { en: "Most relevant", ar: "الأكثر صلة", es: "Más relevantes" },
  "Tout réinitialiser": { en: "Reset all", ar: "إعادة تعيين الكل", es: "Restablecer todo" },
  "projets disponibles": {
    en: "projects available",
    ar: "مشروعًا متاحًا",
    es: "proyectos disponibles",
  },
  "Trier par": { en: "Sort by", ar: "ترتيب حسب", es: "Ordenar por" },
  "Aucun projet à afficher.": {
    en: "No projects to display.",
    ar: "لا توجد مشاريع لعرضها.",
    es: "No hay proyectos para mostrar.",
  },
  Entreprise: { en: "Company", ar: "شركة", es: "Empresa" },
  "Retirer des favoris": {
    en: "Remove from favorites",
    ar: "إزالة من المفضلة",
    es: "Quitar de favoritos",
  },
  "Enregistrer le projet": { en: "Save the project", ar: "حفظ المشروع", es: "Guardar el proyecto" },
  "Budget estimé": { en: "Estimated budget", ar: "الميزانية التقديرية", es: "Presupuesto estimado" },
  "Budget à définir": { en: "Budget to be defined", ar: "الميزانية غير محددة", es: "Presupuesto por definir" },
  "Budget flexible": { en: "Flexible budget", ar: "ميزانية مرنة", es: "Presupuesto flexible" },
  Voir: { en: "View", ar: "عرض", es: "Ver" },
  "agences intéressées": {
    en: "interested agencies",
    ar: "وكالة مهتمة",
    es: "agencias interesadas",
  },
  "Projet enregistré": { en: "Project saved", ar: "تم حفظ المشروع", es: "Proyecto guardado" },
  "Projet retiré des favoris": {
    en: "Project removed from favorites",
    ar: "تمت إزالة المشروع من المفضلة",
    es: "Proyecto eliminado de favoritos",
  },
  "Impossible d'enregistrer ce projet.": {
    en: "Unable to save this project.",
    ar: "تعذّر حفظ هذا المشروع.",
    es: "No se pudo guardar este proyecto.",
  },
  "Recherche de projets impossible.": {
    en: "Unable to search for projects.",
    ar: "تعذّر البحث عن المشاريع.",
    es: "No se pudo realizar la búsqueda de proyectos.",
  },
  Pagination: { en: "Pagination", ar: "ترقيم الصفحات", es: "Paginación" },
  Précédent: { en: "Previous", ar: "السابق", es: "Anterior" },
  Suivant: { en: "Next", ar: "التالي", es: "Siguiente" },
} satisfies PageTextDict;

function SearchProjectsPage() {
  const { tt } = usePageText(PAGE_TEXT);
  const { country: countryFromUrl } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [country, setCountry] = useState(countryFromUrl ?? "");
  const [sort, setSort] = useState<NonNullable<ProjectSearchParams["sort"]>>("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCountry(countryFromUrl ?? "");
  }, [countryFromUrl]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {
        setCategories([]);
      });
  }, []);

  const subCategoryOptions = categories.find((item) => item.id === category)?.subCategories ?? [];

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    listFavoriteProjects()
      .then((items) => setFavoriteIds(new Set(items.map((item) => item.id))))
      .catch(() => {
        setFavoriteIds(new Set());
      });
  }, []);

  function handleToggleFavorite(projectId: string, event: React.MouseEvent) {
    event.stopPropagation();
    setPendingFavoriteId(projectId);
    toggleProjectFavorite(projectId)
      .then(({ favorited }) => {
        setFavoriteIds((previous) => {
          const next = new Set(previous);
          if (favorited) {
            next.add(projectId);
          } else {
            next.delete(projectId);
          }
          return next;
        });
        toast(favorited ? tt("Projet enregistré") : tt("Projet retiré des favoris"));
      })
      .catch((error: unknown) => {
        toast(error instanceof ApiError ? error.message : tt("Impossible d'enregistrer ce projet."));
      })
      .finally(() => setPendingFavoriteId(null));
  }

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const params: ProjectSearchParams = {
        ...(query ? { query } : {}),
        ...(category ? { category } : {}),
        ...(subCategory ? { subCategory } : {}),
        ...(budget ? { budget } : {}),
        ...(country ? { country } : {}),
        sort,
        page,
      };
      searchProjects(params)
        .then((result) => {
          setProjects(result.items);
          setAvailableCount(result.availableCount);
          setTotalPages(result.totalPages);
        })
        .catch((error: unknown) => {
          toast(error instanceof ApiError ? error.message : tt("Recherche de projets impossible."));
          setProjects([]);
          setAvailableCount(0);
          setTotalPages(1);
        })
        .finally(() => setIsLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query, category, subCategory, budget, country, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [query, category, subCategory, budget, country, sort]);

  useEffect(() => {
    setSubCategory("");
  }, [category]);

  function resetFilters() {
    setQuery("");
    setCategory("");
    setSubCategory("");
    setBudget("");
    setCountry("");
    setSort("recent");
  }

  const hasAnyActiveFilter = Boolean(
    query || category || subCategory || budget || country || sort !== "recent",
  );

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="search" active="projects" applyDisabled />

      <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3.5 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.7} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tt("Décrivez le type de projet que vous recherchez...")}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FilterSelectOptions
            label={tt("Catégorie")}
            placeholder={tt("Toutes les catégories")}
            value={category}
            onChange={setCategory}
            options={categories.map((item) => ({ value: item.id, label: item.name }))}
          />
          <FilterSelectOptions
            label={tt("Sous-catégorie")}
            placeholder={tt("Toutes les sous-catégories")}
            value={subCategory}
            onChange={setSubCategory}
            options={subCategoryOptions.map((item) => ({ value: item.id, label: item.name }))}
            disabled={category === ""}
          />
          <FilterInput
            label={tt("Budget")}
            placeholder={tt("Tous les budgets")}
            value={budget}
            onChange={setBudget}
          />
        </div>

        {hasAnyActiveFilter ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {query ? <FilterPill label={`"${query}"`} onRemove={() => setQuery("")} /> : null}
            {category ? (
              <FilterPill
                label={categories.find((item) => item.id === category)?.name ?? category}
                onRemove={() => setCategory("")}
              />
            ) : null}
            {subCategory ? (
              <FilterPill
                label={
                  subCategoryOptions.find((item) => item.id === subCategory)?.name ?? subCategory
                }
                onRemove={() => setSubCategory("")}
              />
            ) : null}
            {budget ? (
              <FilterPill label={`${tt("Budget : ")}${budget}`} onRemove={() => setBudget("")} />
            ) : null}
            {country ? (
              <FilterPill label={`${tt("Pays : ")}${country}`} onRemove={() => setCountry("")} />
            ) : null}
            {sort !== "recent" ? (
              <FilterPill
                label={
                  tt("Tri : ") + tt(SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "")
                }
                onRemove={() => setSort("recent")}
              />
            ) : null}
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-[12.5px] font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {tt("Tout réinitialiser")}
            </button>
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {availableCount ?? 0} {tt("projets disponibles")}
          </p>
          <label className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground">
            {tt("Trier par")}
            <span className="relative flex items-center">
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as NonNullable<ProjectSearchParams["sort"]>)
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

        <section className="mt-6">
          {isLoading ? (
            <CardGridSkeleton count={9} />
          ) : projects.length === 0 ? (
            <EmptyState message={tt("Aucun projet à afficher.")} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const publishedDate = new Date(project.lastActivity);
                const projectId = project.id;
                const isFavorite = favoriteIds.has(project.id);

                return (
                  <Link
                    key={project.id}
                    to={`/projets/$id`}
                    params={{ id: projectId }}
                    className="group relative flex flex-col rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {project.clientLogo ? (
                          <img
                            src={project.clientLogo}
                            alt={project.clientCompanyName || project.title}
                            className="h-11 w-11 shrink-0 rounded-xl border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                            <Building2 className="h-5 w-5" strokeWidth={1.7} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold text-foreground">
                            {project.clientCompanyName || tt("Entreprise")}
                          </p>
                          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {project.statusLabel}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleToggleFavorite(project.id, e)}
                        type="button"
                        disabled={pendingFavoriteId === project.id}
                        aria-label={isFavorite ? tt("Retirer des favoris") : tt("Enregistrer le projet")}
                        aria-pressed={isFavorite}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Bookmark
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.8}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    <h2 className="mt-4 text-[15px] font-bold leading-snug transition-colors group-hover:text-primary">
                      {project.title}
                    </h2>
                    {project.objective ? (
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.5] text-muted-foreground">
                        {project.objective}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {project.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {publishedDate.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {project.urgency ? (
                        <span className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {project.urgency}
                        </span>
                      ) : null}
                    </div>

                    {project.features && project.features.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.features.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {project.interestedAgenciesCount ? (
                      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                        <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {project.interestedAgenciesCount} {tt("agences intéressées")}
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/70 pt-4">
                      <div>
                        <p className="text-[11px] text-muted-foreground">{tt("Budget estimé")}</p>
                        <p className="text-[14.5px] font-bold">
                          {project.budgetMin || project.budgetMax
                            ? `${project.budgetMin} € - ${project.budgetMax} €`
                            : tt("Budget à définir")}
                        </p>
                        {project.budgetFlexible ? (
                          <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                            {tt("Budget flexible")}
                          </span>
                        ) : null}
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        {tt("Voir")}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </main>
    </div>
  );
}

function FilterSelectOptions({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="border-b border-border pb-2">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-left text-[14px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="border-b border-border pb-2">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-left text-[14px] outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12.5px] font-medium text-primary transition-colors hover:bg-primary/15"
    >
      {label}
      <X className="h-3 w-3" strokeWidth={2.2} />
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number | null;
  onChange: (page: number) => void;
}) {
  const pages = totalPages ?? 1;
  const windowSize = Math.min(5, pages);
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(pages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const visible = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const { tt } = usePageText(PAGE_TEXT);

  return (
    <nav aria-label={tt("Pagination")} className="mt-12 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
        {tt("Précédent")}
      </button>

      {start > 1 ? (
        <>
          <button
            type="button"
            onClick={() => onChange(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent"
          >
            1
          </button>
          <span className="text-[13.5px] text-muted-foreground">...</span>
        </>
      ) : null}
      {visible.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13.5px] font-semibold text-primary-foreground"
              : "flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent"
          }
        >
          {p}
        </button>
      ))}
      {end < pages ? (
        <>
          <span className="text-[13.5px] text-muted-foreground">...</span>
          <button
            type="button"
            onClick={() => onChange(pages)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent"
          >
            {pages}
          </button>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="flex items-center gap-1.5 text-[13.5px] transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        {tt("Suivant")}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </nav>
  );
}
