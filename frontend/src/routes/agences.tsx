import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Send,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { CardGridSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import type { Agency } from "@/lib/types";
import { searchAgencies, type AgencySearchParams } from "@/services/agencies.service";
import { ApiError } from "@/services/http";
import { toast } from "sonner";

export const Route = createFileRoute("/agences")({
  head: () => ({
    meta: [
      { title: "Trouvez l'agence idéale — Sortlist Pro" },
      {
        name: "description",
        content:
          "Recherchez et comparez les agences par catégorie et sous-catégorie pour trouver le partenaire idéal de votre projet.",
      },
      {
        property: "og:title",
        content: "Trouvez l'agence idéale — Sortlist Pro",
      },
      {
        property: "og:description",
        content: "Recherchez et comparez les agences pour votre projet.",
      },
    ],
  }),
  component: SearchAgenciesPage,
});

const SORT_OPTIONS: Array<{
  value: AgencySearchParams["sort"];
  label: string;
}> = [
  { value: "relevance", label: "Pertinence" },
  { value: "rating", label: "Note" },
  { value: "recent", label: "Plus récentes" },
];

/* TODO backend: aucun endpoint de taxonomie (catégories/sous-catégories)
   trouvé côté `platform_core` — référentiel figé côté client en attendant.
   Les valeurs envoyées à l'API restent des chaînes (comme avant), donc ce
   changement n'impacte pas le contrat avec `searchAgencies`. */
const CATEGORIES: Array<{
  label: string;
  subCategories: string[];
}> = [
  {
    label: "Marketing digital",
    subCategories: ["SEO", "Publicité en ligne", "Réseaux sociaux", "Stratégie de contenu"],
  },
  {
    label: "Développement web",
    subCategories: ["Sites vitrines", "Applications sur mesure", "E-commerce"],
  },
  {
    label: "Design & branding",
    subCategories: ["Identité visuelle", "UX/UI", "Design produit"],
  },
  {
    label: "Communication",
    subCategories: ["Relations presse", "Événementiel", "Communication de marque"],
  },
  {
    label: "Juridique",
    subCategories: ["Conseil juridique", "Contrats", "Conformité"],
  },
  {
    label: "Finance & comptabilité",
    subCategories: ["Gestion comptable", "Fiscalité", "Pilotage financier"],
  },
  {
    label: "Ressources humaines",
    subCategories: ["Recrutement", "Formation", "Gestion des talents"],
  },
  {
    label: "Conseil en stratégie",
    subCategories: ["Stratégie de croissance", "Transformation", "Accompagnement"],
  },
];

/* Avatar coloré déterministe : chaque agence garde toujours la même couleur
   (dérivée de son id), sans dépendre d'un champ "couleur" côté API. */
function hashSeed(seed: string): number {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function agencyGradient(seed: string): string {
  const hue = hashSeed(seed) % 360;

  return `linear-gradient(
    135deg,
    hsl(${hue} 72% 56%),
    hsl(${(hue + 42) % 360} 72% 44%)
  )`;
}

function AgencyAvatar({ agency }: { agency: Agency }) {
  const label = agency.logoText?.trim() || agency.name.slice(0, 2);
  const compact = label.length > 3;

  if (agency.logo) {
    return (
      <img
        src={agency.logo}
        alt={agency.name}
        className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{ backgroundImage: agencyGradient(agency.id) }}
      className={
        "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-display font-bold text-white shadow-md " +
        (compact ? "text-[14px] tracking-tight" : "text-[24px]")
      }
    >
      {label}
    </div>
  );
}

function Rating({ value }: { value: number }) {
  const rounded = Math.round(value);

  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={"h-3.5 w-3.5 " + (i < rounded ? "fill-primary text-primary" : "text-border")}
          strokeWidth={i < rounded ? 0 : 1.6}
        />
      ))}
    </span>
  );
}

function SearchAgenciesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [sort, setSort] = useState<AgencySearchParams["sort"]>("relevance");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [foundCount, setFoundCount] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeSubCategories = useMemo(
    () => CATEGORIES.find((item) => item.label === category)?.subCategories ?? [],
    [category],
  );

  // Débounce simple sur le texte libre : on ne relance pas la recherche à
  // chaque frappe, seulement 350ms après la dernière saisie.
  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      searchAgencies({
        ...(query ? { query } : {}),
        ...(category ? { category } : {}),
        ...(subCategory ? { subCategory } : {}),
        ...(sort ? { sort } : {}),
        page,
      })
        .then((result) => {
          setAgencies(result.items);
          setFoundCount(result.foundCount);
          setTotalPages(result.totalPages);
        })
        .catch((error: unknown) => {
          toast(error instanceof ApiError ? error.message : "Recherche d'agences impossible.");

          setAgencies([]);
          setFoundCount(0);
          setTotalPages(1);
        })
        .finally(() => setIsLoading(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [query, category, subCategory, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [query, category, subCategory, sort]);

  function selectCategory(label: string) {
    setCategory((current) => {
      const next = current === label ? "" : label;

      if (next !== current) {
        setSubCategory("");
      }

      return next;
    });
  }

  function selectSubCategory(label: string) {
    setSubCategory((current) => (current === label ? "" : label));
  }

  function resetFilters() {
    setQuery("");
    setCategory("");
    setSubCategory("");
    setSort("relevance");
  }

  const activeFilterCount = [category, subCategory].filter(Boolean).length;

  const hasAnyActiveFilter = Boolean(query || category || subCategory || sort !== "relevance");

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .font-display {
          font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>

      <MarketingHeader variant="search" active="agencies" />

      <main className="mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8">
        {/* ============================================================
            HEADER
        ============================================================ */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[24px] font-bold tracking-tight sm:text-[28px]">
              Trouvez l'agence idéale
            </h1>

            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              Filtrez par secteur pour affiner les recommandations.
            </p>
          </div>

          <Link
            to="/postuler-un-projet"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
          >
            <Send className="h-4 w-4" strokeWidth={1.8} />
            Postuler un projet
          </Link>
        </div>

        {/* ============================================================
            RECHERCHE
        ============================================================ */}
        <div className="mt-7 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 shadow-sm transition-all focus-within:border-primary/50 focus-within:shadow-md">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.7} />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Décrivez le type d'agence que vous cherchez..."
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className={
              "flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-semibold transition-colors " +
              (filtersOpen || activeFilterCount > 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent")
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
            Filtres
            {activeFilterCount > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* ============================================================
            FILTRES
        ============================================================ */}
        {filtersOpen ? (
          <div className="mt-4 rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Catégorie
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => selectCategory(item.label)}
                    aria-pressed={category === item.label}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all " +
                      (category === item.label
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border text-foreground/80 hover:border-primary/30 hover:bg-accent")
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {category ? (
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Sous-catégorie
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {activeSubCategories.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => selectSubCategory(label)}
                      aria-pressed={subCategory === label}
                      className={
                        "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all " +
                        (subCategory === label
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border text-foreground/80 hover:border-primary/30 hover:bg-accent")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ============================================================
            FILTRES ACTIFS
        ============================================================ */}
        {hasAnyActiveFilter ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {query ? <FilterPill label={`"${query}"`} onRemove={() => setQuery("")} /> : null}

            {category ? (
              <FilterPill label={category} onRemove={() => selectCategory(category)} />
            ) : null}

            {subCategory ? (
              <FilterPill label={subCategory} onRemove={() => selectSubCategory(subCategory)} />
            ) : null}

            {sort !== "relevance" ? (
              <FilterPill
                label={"Tri : " + (SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "")}
                onRemove={() => setSort("relevance")}
              />
            ) : null}

            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-[12.5px] font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Tout réinitialiser
            </button>
          </div>
        ) : null}

        {/* ============================================================
            RESULTATS / TRI
        ============================================================ */}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-4">
          <p className="truncate text-[14px] font-semibold">
            {foundCount ?? 0} agence
            {(foundCount ?? 0) > 1 ? "s" : ""} trouvée
            {(foundCount ?? 0) > 1 ? "s" : ""}
          </p>

          <label className="flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground">
            Trier par
            <span className="relative flex items-center">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as AgencySearchParams["sort"])}
                className="appearance-none bg-transparent pr-5 text-foreground outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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

        {/* ============================================================
            AGENCES
        ============================================================ */}
        <section className="mt-7">
          {isLoading ? (
            <CardGridSkeleton count={8} />
          ) : agencies.length === 0 ? (
            <EmptyState message="Aucune agence à afficher. Essayez d'élargir vos filtres." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agencies.map((agency) => (
                <article
                  key={agency.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  {/* ====================================================
                      PARTIE SUPERIEURE DE LA CARTE
                  ==================================================== */}
                  <div className="relative flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
                    {/* Avatar */}
                    <AgencyAvatar agency={agency} />

                    {/* Nom */}
                    <h2 className="mt-4 max-w-full truncate text-[16px] font-bold">
                      {agency.name}
                    </h2>

                    {/* Localisation */}
                    <p className="mt-1.5 flex max-w-full items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />

                      <span className="truncate">{agency.location}</span>
                    </p>

                    {/* Rating */}
                    <p className="mt-3 flex items-center justify-center gap-2 text-[13.5px] font-semibold">
                      <Rating value={agency.rating} />

                      <span>{agency.rating}</span>

                      <span className="font-normal text-muted-foreground">
                        ({agency.reviewsCount} avis)
                      </span>
                    </p>

                    {/* Description */}
                    <p className="mt-4 line-clamp-3 text-[13.5px] leading-[1.6] text-muted-foreground">
                      {agency.description}
                    </p>
                  </div>

                  {/* ====================================================
                      PARTIE INFERIEURE DE LA CARTE
                  ==================================================== */}
                  <div className="flex flex-1 flex-col gap-4 border-t border-border bg-muted/40 p-5">
                    {/* Localisation */}
                    <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </span>

                      <span className="min-w-0 truncate">Situé à {agency.location}</span>
                    </div>

                    {/* Note */}
                    <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                        <Star className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </span>

                      <span>
                        Note moyenne :{" "}
                        <strong className="font-semibold text-foreground">{agency.rating}</strong>
                      </span>
                    </div>

                    {/* Avis */}
                    <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                        <Star className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </span>

                      <span>{agency.reviewsCount} avis</span>
                    </div>

                    {/* Boutons */}
                    <div className="mt-auto flex flex-col gap-2.5 pt-2">
                      <Link
                        to="/agences/$id"
                        params={{ id: agency.id }}
                        className="flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-center text-[13.5px] font-semibold text-background transition-all hover:-translate-y-0.5 hover:opacity-90"
                      >
                        Voir le profil
                      </Link>

                      <Link
                        to="/agences/$id"
                        params={{ id: agency.id }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2.5 text-center text-[13.5px] font-semibold transition-colors hover:bg-accent"
                      >
                        Contacter
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================
            PAGINATION
        ============================================================ */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </main>
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
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13.5px] font-semibold text-primary-foreground shadow-sm"
              : "flex h-8 w-8 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent"
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent"
          >
            {pages}
          </button>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        Suivant
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </nav>
  );
}
