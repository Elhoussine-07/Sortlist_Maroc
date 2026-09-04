import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  Send,
  Tag,
  Users,
  Wallet,
  Eye,
  Building2,
  ChevronRight,
  Calendar,
  Euro,
  Globe,
  Briefcase,
  Sparkles,
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

export const Route = createFileRoute("/projets")({
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

function SearchProjectsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [page, setPage] = useState(1);

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
        toast(favorited ? "Projet enregistré" : "Projet retiré des favoris");
      })
      .catch((error: unknown) => {
        toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer ce projet.");
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
        sort: "recent",
        page,
      };
      searchProjects(params)
        .then((result) => {
          setProjects(result.items);
          setAvailableCount(result.availableCount);
          setTotalPages(result.totalPages);
        })
        .catch((error: unknown) => {
          toast(error instanceof ApiError ? error.message : "Recherche de projets impossible.");
          setProjects([]);
          setAvailableCount(0);
          setTotalPages(1);
        })
        .finally(() => setIsLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query, category, subCategory, budget, page]);

  useEffect(() => {
    setPage(1);
  }, [query, category, subCategory, budget]);

  useEffect(() => {
    setSubCategory("");
  }, [category]);

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
            placeholder="Décrivez le type de projet que vous recherchez..."
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FilterSelectOptions
            label="Catégorie"
            placeholder="Toutes les catégories"
            value={category}
            onChange={setCategory}
            options={categories.map((item) => ({ value: item.id, label: item.name }))}
          />
          <FilterSelectOptions
            label="Sous-catégorie"
            placeholder="Toutes les sous-catégories"
            value={subCategory}
            onChange={setSubCategory}
            options={subCategoryOptions.map((item) => ({ value: item.id, label: item.name }))}
            disabled={category === ""}
          />
          <FilterInput
            label="Budget"
            placeholder="Tous les budgets"
            value={budget}
            onChange={setBudget}
          />
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="truncate text-[14px] font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {availableCount ?? 0} projets disponibles
          </p>
          <span className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground">
            Plus récents
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
        </div>

        <section className="mt-6">
          {isLoading ? (
            <CardGridSkeleton count={8} />
          ) : projects.length === 0 ? (
            <EmptyState message="Aucun projet à afficher." />
          ) : (
            <div className="flex flex-col gap-5">
              {projects.map((project) => {
                const publishedDate = new Date(project.lastActivity);
                // Utiliser l'ID du projet pour la redirection
                const projectId = project.id;

                return (
                  <Link
                    key={project.id}
                    to={`/projets/$id`}
                    params={{ id: projectId }}
                    className="group relative block rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5"
                  >
                    {/* Indicateur de clic */}
                    <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                        <Eye className="h-3.5 w-3.5" />
                        Voir le projet
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="h-[110px] w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-pink-400 to-fuchsia-600 sm:h-auto sm:w-[140px]">
                        {project.category === "Conseil & stratégie" ? (
                          <img
                            src="/categories/conseil-strategie.png"
                            alt={project.category}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white">
                            <Tag className="h-8 w-8" strokeWidth={1.6} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-600" />
                          {project.statusLabel}
                        </span>
                        <h2 className="mt-1.5 text-[15px] font-bold leading-snug group-hover:text-primary transition-colors">
                          {project.title}
                        </h2>
                        {project.objective ? (
                          <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.5] text-muted-foreground">
                            {project.objective}
                          </p>
                        ) : null}
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {project.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" strokeWidth={1.8} />
                            Publié le{" "}
                            {publishedDate.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
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
                        {project.interestedAgenciesCount ? (
                          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                            <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {project.interestedAgenciesCount} agences ont déjà montré leur intérêt
                          </p>
                        ) : null}
                        {project.features && project.features.length > 0 ? (
                          <div className="mt-2.5">
                            <p className="text-[11.5px] font-semibold text-foreground">
                              Compétences recherchées
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {project.features.slice(0, 5).map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-2 sm:w-[180px] sm:items-end sm:text-right">
                        <div className="flex w-full items-center justify-between gap-2 sm:flex-col sm:items-end">
                          <p className="text-[11px] text-muted-foreground">Budget estimé</p>
                          <button
                            onClick={(e) => handleToggleFavorite(project.id, e)}
                            type="button"
                            disabled={pendingFavoriteId === project.id}
                            aria-label={
                              favoriteIds.has(project.id)
                                ? "Retirer des favoris"
                                : "Enregistrer le projet"
                            }
                            aria-pressed={favoriteIds.has(project.id)}
                            className="text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:order-first"
                          >
                            <Bookmark
                              className="h-[18px] w-[18px]"
                              strokeWidth={1.8}
                              fill={favoriteIds.has(project.id) ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                        <p className="text-[15px] font-bold">
                          {project.budgetMin || project.budgetMax
                            ? `${project.budgetMin} € - ${project.budgetMax} €`
                            : "Budget à définir"}
                        </p>
                        {project.budgetFlexible ? (
                          <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-[11px] font-medium text-fuchsia-700">
                            Budget flexible
                          </span>
                        ) : null}
                        {project.needType || project.estimatedDuration ? (
                          <div className="mt-1 w-full text-[12px] text-muted-foreground sm:text-right">
                            {project.needType ? (
                              <p>
                                <span className="font-semibold text-foreground">
                                  Type de projet
                                </span>
                                <br />
                                {project.needType}
                              </p>
                            ) : null}
                            {project.estimatedDuration ? (
                              <p className="mt-1">
                                <span className="font-semibold text-foreground">Durée estimée</span>
                                <br />
                                {project.estimatedDuration}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
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
  const visible = Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
        Précédent
      </button>

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
      {pages > 5 ? (
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
        Suivant
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </nav>
  );
}
