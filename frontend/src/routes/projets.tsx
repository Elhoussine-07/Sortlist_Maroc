import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  Tag,
  Wallet,
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
      { title: "Trouvez le projet idéal — Sortlist" },
      {
        name: "description",
        content:
          "Parcourez les projets publiés par les entreprises et filtrez par catégorie, sous-catégorie et budget.",
      },
      { property: "og:title", content: "Trouvez le projet idéal — Sortlist" },
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

  function handleToggleFavorite(projectId: string) {
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
        <div className="mt-8 flex items-center gap-3 rounded-md border border-border px-4 py-3.5">
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
          <p className="truncate text-[14px] font-semibold">
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
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((project) => (
                <article key={project.id} className="flex flex-col">
                  <Tag className="h-[22px] w-[22px]" strokeWidth={1.6} />
                  <h2 className="mt-4 text-[14px] font-bold leading-snug">{project.title}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-[13px]">
                    <Wallet className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                    {project.budgetMin} € - {project.budgetMax} €
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                    {project.location}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Tag className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                    {project.subCategory}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                    Publié {project.lastActivity}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      title="Consultation détaillée indisponible pour le moment — utilisez le contact direct (favoris) en attendant une page de détail dédiée."
                      className="flex-1 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground opacity-60"
                    >
                      Voir le projet
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(project.id)}
                      type="button"
                      disabled={pendingFavoriteId === project.id}
                      aria-label={
                        favoriteIds.has(project.id)
                          ? "Retirer des favoris"
                          : "Enregistrer le projet"
                      }
                      aria-pressed={favoriteIds.has(project.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Bookmark
                        className="h-3.5 w-3.5"
                        strokeWidth={1.8}
                        fill={favoriteIds.has(project.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </article>
              ))}
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
