import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $t as ArrowLeft, Gt as Bookmark, K as MapPin, Pt as ChevronDown, Qt as ArrowRight, St as Clock, i as Wallet, k as Search, v as Tag } from "../_libs/lucide-react.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { l as searchProjects } from "./projects.service-BHaNpgMa.mjs";
import { S as toggleProjectFavorite, m as listFavoriteProjects, s as getCategories, t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { t as CardGridSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/projets-D5GDstu8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SearchProjectsPage() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [subCategory, setSubCategory] = (0, import_react.useState)("");
	const [budget, setBudget] = (0, import_react.useState)("");
	const [page, setPage] = (0, import_react.useState)(1);
	const [projects, setProjects] = (0, import_react.useState)([]);
	const [availableCount, setAvailableCount] = (0, import_react.useState)(null);
	const [totalPages, setTotalPages] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [categories, setCategories] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getCategories().then(setCategories).catch(() => {
			setCategories([]);
		});
	}, []);
	const subCategoryOptions = categories.find((item) => item.id === category)?.subCategories ?? [];
	const [favoriteIds, setFavoriteIds] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [pendingFavoriteId, setPendingFavoriteId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		listFavoriteProjects().then((items) => setFavoriteIds(new Set(items.map((item) => item.id)))).catch(() => {
			setFavoriteIds(/* @__PURE__ */ new Set());
		});
	}, []);
	function handleToggleFavorite(projectId) {
		setPendingFavoriteId(projectId);
		toggleProjectFavorite(projectId).then(({ favorited }) => {
			setFavoriteIds((previous) => {
				const next = new Set(previous);
				if (favorited) next.add(projectId);
				else next.delete(projectId);
				return next;
			});
			toast(favorited ? "Projet enregistré" : "Projet retiré des favoris");
		}).catch((error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer ce projet.");
		}).finally(() => setPendingFavoriteId(null));
	}
	(0, import_react.useEffect)(() => {
		setIsLoading(true);
		const timer = setTimeout(() => {
			const params = {
				...query ? { query } : {},
				...category ? { category } : {},
				...subCategory ? { subCategory } : {},
				...budget ? { budget } : {},
				sort: "recent",
				page
			};
			searchProjects(params).then((result) => {
				setProjects(result.items);
				setAvailableCount(result.availableCount);
				setTotalPages(result.totalPages);
			}).catch((error) => {
				toast(error instanceof ApiError ? error.message : "Recherche de projets impossible.");
				setProjects([]);
				setAvailableCount(0);
				setTotalPages(1);
			}).finally(() => setIsLoading(false));
		}, 350);
		return () => clearTimeout(timer);
	}, [
		query,
		category,
		subCategory,
		budget,
		page
	]);
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [
		query,
		category,
		subCategory,
		budget
	]);
	(0, import_react.useEffect)(() => {
		setSubCategory("");
	}, [category]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, {
			variant: "search",
			active: "projects",
			applyDisabled: true
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-[1080px] px-4 pb-16 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex items-center gap-3 rounded-md border border-border px-4 py-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "h-[18px] w-[18px] shrink-0 text-muted-foreground",
						strokeWidth: 1.7
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Décrivez le type de projet que vous recherchez...",
						className: "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelectOptions, {
							label: "Catégorie",
							placeholder: "Toutes les catégories",
							value: category,
							onChange: setCategory,
							options: categories.map((item) => ({
								value: item.id,
								label: item.name
							}))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelectOptions, {
							label: "Sous-catégorie",
							placeholder: "Toutes les sous-catégories",
							value: subCategory,
							onChange: setSubCategory,
							options: subCategoryOptions.map((item) => ({
								value: item.id,
								label: item.name
							})),
							disabled: category === ""
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterInput, {
							label: "Budget",
							placeholder: "Tous les budgets",
							value: budget,
							onChange: setBudget
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-[14px] font-semibold",
						children: [availableCount ?? 0, " projets disponibles"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground",
						children: ["Plus récents", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
							className: "h-3.5 w-3.5",
							strokeWidth: 1.8
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-6",
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardGridSkeleton, { count: 8 }) : projects.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun projet à afficher." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4",
						children: projects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "flex flex-col",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
									className: "h-[22px] w-[22px]",
									strokeWidth: 1.6
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-4 text-[14px] font-bold leading-snug",
									children: project.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 flex items-center gap-1.5 text-[13px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
											className: "h-3 w-3 shrink-0",
											strokeWidth: 1.8
										}),
										project.budgetMin,
										" € - ",
										project.budgetMax,
										" €"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
										className: "h-3 w-3 shrink-0",
										strokeWidth: 1.8
									}), project.location]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
										className: "h-3 w-3 shrink-0",
										strokeWidth: 1.8
									}), project.subCategory]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
											className: "h-3 w-3 shrink-0",
											strokeWidth: 1.8
										}),
										"Publié ",
										project.lastActivity
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: true,
										title: "Consultation détaillée indisponible pour le moment — utilisez le contact direct (favoris) en attendant une page de détail dédiée.",
										className: "flex-1 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground opacity-60",
										children: "Voir le projet"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => handleToggleFavorite(project.id),
										type: "button",
										disabled: pendingFavoriteId === project.id,
										"aria-label": favoriteIds.has(project.id) ? "Retirer des favoris" : "Enregistrer le projet",
										"aria-pressed": favoriteIds.has(project.id),
										className: "flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
											className: "h-3.5 w-3.5",
											strokeWidth: 1.8,
											fill: favoriteIds.has(project.id) ? "currentColor" : "none"
										})
									})]
								})
							]
						}, project.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
					page,
					totalPages,
					onChange: setPage
				})
			]
		})]
	});
}
function FilterSelectOptions({ label, placeholder, value, onChange, options, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-border pb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[13px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
			value,
			disabled,
			onChange: (event) => onChange(event.target.value),
			className: "mt-1 w-full bg-transparent text-left text-[14px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: "",
				children: placeholder
			}), options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: option.value,
				children: option.label
			}, option.value))]
		})]
	});
}
function FilterInput({ label, placeholder, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-border pb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[13px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "text",
			value,
			onChange: (event) => onChange(event.target.value),
			placeholder,
			className: "mt-1 w-full bg-transparent text-left text-[14px] outline-none placeholder:text-muted-foreground"
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
				className: "flex items-center gap-1.5 text-[13.5px] transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
				children: ["Suivant", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
					className: "h-3.5 w-3.5",
					strokeWidth: 1.8
				})]
			})
		]
	});
}
//#endregion
export { SearchProjectsPage as component };
