import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $t as ArrowLeft, K as MapPin, O as Send, Pt as ChevronDown, Qt as ArrowRight, S as SlidersHorizontal, b as Star, k as Search, n as X } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { b as searchAgencies, t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { t as CardGridSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agences-BK-_DOQo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SORT_OPTIONS = [
	{
		value: "relevance",
		label: "Pertinence"
	},
	{
		value: "rating",
		label: "Note"
	},
	{
		value: "recent",
		label: "Plus récentes"
	}
];
var CATEGORIES = [
	{
		label: "Marketing digital",
		subCategories: [
			"SEO",
			"Publicité en ligne",
			"Réseaux sociaux",
			"Stratégie de contenu"
		]
	},
	{
		label: "Développement web",
		subCategories: [
			"Sites vitrines",
			"Applications sur mesure",
			"E-commerce"
		]
	},
	{
		label: "Design & branding",
		subCategories: [
			"Identité visuelle",
			"UX/UI",
			"Design produit"
		]
	},
	{
		label: "Communication",
		subCategories: [
			"Relations presse",
			"Événementiel",
			"Communication de marque"
		]
	},
	{
		label: "Juridique",
		subCategories: [
			"Conseil juridique",
			"Contrats",
			"Conformité"
		]
	},
	{
		label: "Finance & comptabilité",
		subCategories: [
			"Gestion comptable",
			"Fiscalité",
			"Pilotage financier"
		]
	},
	{
		label: "Ressources humaines",
		subCategories: [
			"Recrutement",
			"Formation",
			"Gestion des talents"
		]
	},
	{
		label: "Conseil en stratégie",
		subCategories: [
			"Stratégie de croissance",
			"Transformation",
			"Accompagnement"
		]
	}
];
function hashSeed(seed) {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}
function agencyGradient(seed) {
	const hue = hashSeed(seed) % 360;
	return `linear-gradient(135deg, hsl(${hue} 72% 56%), hsl(${(hue + 42) % 360} 72% 44%))`;
}
function AgencyAvatar({ agency }) {
	const label = agency.logoText?.trim() || agency.name.slice(0, 2);
	const compact = label.length > 3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		style: { backgroundImage: agencyGradient(agency.id) },
		className: "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display font-bold text-white shadow-sm " + (compact ? "text-[13px] tracking-tight" : "text-[20px]"),
		children: label
	});
}
function Rating({ value }) {
	const rounded = Math.round(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex items-center gap-0.5",
		"aria-hidden": "true",
		children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
			className: "h-3.5 w-3.5 " + (i < rounded ? "fill-primary text-primary" : "text-border"),
			strokeWidth: i < rounded ? 0 : 1.6
		}, i))
	});
}
function SearchAgenciesPage() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [subCategory, setSubCategory] = (0, import_react.useState)("");
	const [sort, setSort] = (0, import_react.useState)("relevance");
	const [page, setPage] = (0, import_react.useState)(1);
	const [filtersOpen, setFiltersOpen] = (0, import_react.useState)(false);
	const [agencies, setAgencies] = (0, import_react.useState)([]);
	const [foundCount, setFoundCount] = (0, import_react.useState)(null);
	const [totalPages, setTotalPages] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const activeSubCategories = (0, import_react.useMemo)(() => CATEGORIES.find((item) => item.label === category)?.subCategories ?? [], [category]);
	(0, import_react.useEffect)(() => {
		setIsLoading(true);
		const timer = setTimeout(() => {
			searchAgencies({
				...query ? { query } : {},
				...category ? { category } : {},
				...subCategory ? { subCategory } : {},
				...sort ? { sort } : {},
				page
			}).then((result) => {
				setAgencies(result.items);
				setFoundCount(result.foundCount);
				setTotalPages(result.totalPages);
			}).catch((error) => {
				toast(error instanceof ApiError ? error.message : "Recherche d'agences impossible.");
				setAgencies([]);
				setFoundCount(0);
				setTotalPages(1);
			}).finally(() => setIsLoading(false));
		}, 350);
		return () => clearTimeout(timer);
	}, [
		query,
		category,
		subCategory,
		sort,
		page
	]);
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [
		query,
		category,
		subCategory,
		sort
	]);
	function selectCategory(label) {
		setCategory((current) => {
			const next = current === label ? "" : label;
			if (next !== current) setSubCategory("");
			return next;
		});
	}
	function selectSubCategory(label) {
		setSubCategory((current) => current === label ? "" : label);
	}
	function resetFilters() {
		setQuery("");
		setCategory("");
		setSubCategory("");
		setSort("relevance");
	}
	const activeFilterCount = [category, subCategory].filter(Boolean).length;
	const hasAnyActiveFilter = Boolean(query || category || subCategory || sort !== "relevance");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, {
				variant: "search",
				active: "agencies"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-[22px] font-bold tracking-tight sm:text-[26px]",
							children: "Trouvez l'agence idéale"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[13.5px] text-muted-foreground",
							children: "Filtrez par secteur pour affiner les recommandations."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/postuler-un-projet",
							className: "inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
								className: "h-4 w-4",
								strokeWidth: 1.8
							}), "Postuler un projet"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors focus-within:border-primary/50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								className: "h-[18px] w-[18px] shrink-0 text-muted-foreground",
								strokeWidth: 1.7
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "search",
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: "Décrivez le type d'agence que vous cherchez...",
								className: "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setFiltersOpen((open) => !open),
								className: "flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-semibold transition-colors " + (filtersOpen || activeFilterCount > 0 ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.8
									}),
									"Filtres",
									activeFilterCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground",
										children: activeFilterCount
									}) : null
								]
							})
						]
					}),
					filtersOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-lg border border-border p-4 sm:p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
							children: "Catégorie"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2.5 flex flex-wrap gap-2",
							children: CATEGORIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => selectCategory(item.label),
								"aria-pressed": category === item.label,
								className: "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors " + (category === item.label ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/80 hover:bg-accent"),
								children: item.label
							}, item.label))
						})] }), category ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 border-t border-border pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Sous-catégorie"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2.5 flex flex-wrap gap-2",
								children: activeSubCategories.map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => selectSubCategory(label),
									"aria-pressed": subCategory === label,
									className: "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors " + (subCategory === label ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/80 hover:bg-accent"),
									children: label
								}, label))
							})]
						}) : null]
					}) : null,
					hasAnyActiveFilter ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap items-center gap-2",
						children: [
							query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPill, {
								label: `"${query}"`,
								onRemove: () => setQuery("")
							}) : null,
							category ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPill, {
								label: category,
								onRemove: () => selectCategory(category)
							}) : null,
							subCategory ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPill, {
								label: subCategory,
								onRemove: () => selectSubCategory(subCategory)
							}) : null,
							sort !== "relevance" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPill, {
								label: "Tri : " + (SORT_OPTIONS.find((o) => o.value === sort)?.label ?? ""),
								onRemove: () => setSort("relevance")
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: resetFilters,
								className: "text-[12.5px] font-semibold text-muted-foreground underline-offset-2 hover:underline",
								children: "Tout réinitialiser"
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-[14px] font-semibold",
							children: [
								foundCount ?? 0,
								" agence",
								(foundCount ?? 0) > 1 ? "s" : "",
								" trouvée",
								(foundCount ?? 0) > 1 ? "s" : ""
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground",
							children: ["Trier par", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "relative flex items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: sort,
									onChange: (event) => setSort(event.target.value),
									className: "appearance-none bg-transparent pr-4 text-foreground outline-none",
									children: SORT_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: option.value,
										children: option.label
									}, option.value))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
									className: "pointer-events-none absolute right-0 h-3.5 w-3.5",
									strokeWidth: 1.8
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-6",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardGridSkeleton, { count: 8 }) : agencies.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune agence à afficher. Essayez d'élargir vos filtres." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4",
							children: agencies.map((agency) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "group flex flex-col rounded-lg border border-border p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgencyAvatar, { agency }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 pt-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "truncate text-[15px] font-bold",
												children: agency.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
													className: "h-3.5 w-3.5 shrink-0",
													strokeWidth: 1.8
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate",
													children: agency.location
												})]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-[13.5px] leading-[1.55] text-muted-foreground",
										children: agency.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-3 flex items-center gap-2 text-[13.5px] font-semibold",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rating, { value: agency.rating }),
											agency.rating,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-normal text-muted-foreground",
												children: [
													"(",
													agency.reviewsCount,
													" avis)"
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-auto flex flex-wrap gap-2 pt-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/agences/$id",
											params: { id: agency.id },
											className: "rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
											children: "Contacter"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/agences/$id",
											params: { id: agency.id },
											className: "rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent",
											children: "Voir le profil"
										})]
									})
								]
							}, agency.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
						page,
						totalPages,
						onChange: setPage
					})
				]
			})
		]
	});
}
function FilterPill({ label, onRemove }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onRemove,
		className: "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12.5px] font-medium text-primary transition-colors hover:bg-primary/15",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
			className: "h-3 w-3",
			strokeWidth: 2.2
		})]
	});
}
function Pagination({ page, totalPages, onChange }) {
	const pages = totalPages ?? 1;
	const visible = Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		"aria-label": "Pagination",
		className: "mt-12 flex flex-wrap items-center justify-center gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onChange(Math.max(1, page - 1)),
				disabled: page === 1,
				className: "flex items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
					className: "h-3.5 w-3.5",
					strokeWidth: 1.8
				}), "Précédent"]
			}),
			visible.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onChange(p),
				"aria-current": p === page ? "page" : void 0,
				className: p === page ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13.5px] font-semibold text-primary-foreground" : "flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent",
				children: p
			}, p)),
			pages > 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13.5px] text-muted-foreground",
				children: "..."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onChange(pages),
				className: "flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent",
				children: pages
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onChange(Math.min(pages, page + 1)),
				disabled: page === pages,
				className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40",
				children: ["Suivant", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
					className: "h-3.5 w-3.5",
					strokeWidth: 1.8
				})]
			})
		]
	});
}
//#endregion
export { SearchAgenciesPage as component };
