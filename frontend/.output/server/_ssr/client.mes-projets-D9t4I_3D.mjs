import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { A as Scale, F as Plus, G as Megaphone, H as MessageSquare, Ht as Building2, P as RefreshCcw, Pt as ChevronDown, R as Palette, Ut as Briefcase, bt as Compass, gt as EllipsisVertical, h as Trash2, i as Wallet, k as Search, o as UsersRound, xt as CodeXml } from "../_libs/lucide-react.mjs";
import { n as DropdownMenuContent, o as DropdownMenuTrigger, r as DropdownMenuItem, t as DropdownMenu } from "./dropdown-menu-CHGFKbne.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { n as deleteProject, r as getMyProjects, s as repostProject } from "./projects.service-BHaNpgMa.mjs";
import { t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { i as TableSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as ListPagination, t as FilterSelect } from "./ListControls-FMqnx6XI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.mes-projets-D9t4I_3D.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_TABS = [
	{
		value: "all",
		label: "Tous"
	},
	{
		value: "draft",
		label: "Brouillons"
	},
	{
		value: "published",
		label: "Postulés"
	},
	{
		value: "awaiting",
		label: "En attente"
	},
	{
		value: "in_progress",
		label: "En cours"
	},
	{
		value: "finished",
		label: "Terminés"
	},
	{
		value: "suspended",
		label: "Suspendus"
	},
	{
		value: "rejected",
		label: "Rejetés"
	}
];
var DEFAULT_CATEGORY_STYLE = {
	icon: Briefcase,
	className: "bg-accent text-muted-foreground"
};
var CATEGORY_STYLES = {
	"Marketing digital": {
		icon: Megaphone,
		className: "bg-sky-500/10 text-sky-600"
	},
	"Développement web": {
		icon: CodeXml,
		className: "bg-violet-500/10 text-violet-600"
	},
	"Design & branding": {
		icon: Palette,
		className: "bg-rose-500/10 text-rose-600"
	},
	Communication: {
		icon: MessageSquare,
		className: "bg-cyan-500/10 text-cyan-600"
	},
	Juridique: {
		icon: Scale,
		className: "bg-slate-500/10 text-slate-600"
	},
	"Finance & comptabilité": {
		icon: Wallet,
		className: "bg-amber-500/10 text-amber-600"
	},
	"Ressources humaines": {
		icon: UsersRound,
		className: "bg-emerald-500/10 text-emerald-600"
	},
	"Conseil en stratégie": {
		icon: Compass,
		className: "bg-orange-500/10 text-orange-600"
	}
};
var STATUS_STYLES = {
	draft: "bg-accent text-muted-foreground",
	published: "bg-primary/10 text-primary",
	awaiting: "bg-amber-500/10 text-amber-600",
	in_progress: "bg-sky-500/10 text-sky-600",
	finished: "bg-emerald-500/10 text-emerald-600",
	suspended: "bg-orange-500/10 text-orange-600",
	rejected: "bg-destructive/10 text-destructive"
};
function formatProjectTitle(raw) {
	const trimmed = raw.trim().replace(/\s+/g, " ").replace(/\.{2,}$/, "");
	if (!trimmed) return "Projet sans titre";
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
var PAGE_SIZE = 20;
function ClientProjectsPage() {
	const projectsQuery = useQuery({
		queryKey: ["client", "projects"],
		queryFn: () => getMyProjects()
	});
	const isLoading = projectsQuery.isPending;
	const allProjects = (0, import_react.useMemo)(() => projectsQuery.data?.items ?? [], [projectsQuery.data]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeStatus, setActiveStatus] = (0, import_react.useState)("all");
	const [sortDirection, setSortDirection] = (0, import_react.useState)("recent");
	const [page, setPage] = (0, import_react.useState)(1);
	const counts = (0, import_react.useMemo)(() => {
		const result = { all: allProjects.length };
		for (const project of allProjects) result[project.status] = (result[project.status] ?? 0) + 1;
		return result;
	}, [allProjects]);
	const filteredProjects = (0, import_react.useMemo)(() => {
		const normalizedQuery = query.trim().toLowerCase();
		let items = allProjects.filter((project) => {
			const matchesStatus = activeStatus === "all" || project.status === activeStatus;
			const matchesQuery = normalizedQuery.length === 0 || project.title.toLowerCase().includes(normalizedQuery) || project.reference.toLowerCase().includes(normalizedQuery) || project.category.toLowerCase().includes(normalizedQuery);
			return matchesStatus && matchesQuery;
		});
		items = [...items].sort((a, b) => sortDirection === "recent" ? b.lastActivity.localeCompare(a.lastActivity) : a.lastActivity.localeCompare(b.lastActivity));
		return items;
	}, [
		allProjects,
		activeStatus,
		query,
		sortDirection
	]);
	const total = filteredProjects.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const projects = filteredProjects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "client",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-[24px] font-bold tracking-tight",
							children: "Mes projets"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[14px] text-muted-foreground",
							children: "Suivez l'ensemble de vos projets."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/client/postuler-un-projet",
						className: "flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:justify-self-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-3.5 w-3.5",
							strokeWidth: 2
						}), "Postuler un projet"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-7 flex items-center gap-3 rounded-md border border-border px-4 py-3 transition-colors focus-within:border-primary/50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "h-[18px] w-[18px] shrink-0 text-muted-foreground",
						strokeWidth: 1.7
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Rechercher un projet...",
						className: "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex items-center gap-2 overflow-x-auto border-b border-border pb-3",
					children: STATUS_TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setActiveStatus(tab.value);
							setPage(1);
						},
						"aria-pressed": activeStatus === tab.value,
						className: "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors " + (activeStatus === tab.value ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"),
						children: [tab.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-1.5 font-normal opacity-70",
							children: counts[tab.value] ?? 0
						})]
					}, tab.value))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Catégorie",
							placeholder: "Toutes les catégories"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Statut",
							placeholder: "Tous les statuts"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Période",
							placeholder: "Toutes les périodes"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-[14px] font-semibold",
						children: [
							total,
							" projet",
							total > 1 ? "s" : ""
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setSortDirection((current) => current === "recent" ? "old" : "recent"),
						type: "button",
						className: "flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground",
						children: [
							"Trier par : ",
							sortDirection === "recent" ? "Plus récents" : "Plus anciens",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								className: "h-3.5 w-3.5",
								strokeWidth: 1.8
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 overflow-hidden rounded-lg border border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] gap-4 border-b border-border bg-accent/40 px-5 py-3 lg:grid",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Projet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Catégorie"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Agence"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Statut"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Budget"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Dernière activité"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
								children: "Action"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-4" })
						]
					}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-5 py-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableSkeleton, {
							rows: 8,
							columns: 7
						})
					}) : projects.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun projet à afficher." })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border",
						children: projects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectRow, { project }) }, project.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPagination, {
					page: currentPage,
					totalPages,
					onPageChange: setPage
				})
			]
		})]
	});
}
function ProjectActionsMenu({ canRepost, canDelete, isReposting, isDeleting, onRepost, onDelete, className }) {
	if (!canRepost && !canDelete) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Plus d'actions",
			className: "rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground " + (className ?? ""),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, {
				className: "h-4 w-4",
				strokeWidth: 1.8
			})
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "end",
		children: [canRepost ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
			disabled: isReposting,
			onClick: onRepost,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, {
				className: "mr-2 h-3.5 w-3.5",
				strokeWidth: 1.8
			}), isReposting ? "Republication..." : "Repostuler"]
		}) : null, canDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
			disabled: isDeleting,
			className: "text-destructive focus:text-destructive",
			onClick: onDelete,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
				className: "mr-2 h-3.5 w-3.5",
				strokeWidth: 1.8
			}), isDeleting ? "Suppression..." : "Supprimer"]
		}) : null]
	})] });
}
function AgencyLink({ project }) {
	if (!project.agencyId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-[13px] text-muted-foreground",
		children: "—"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/agences/$id",
		params: { id: project.agencyId },
		className: "flex min-w-0 items-center gap-1.5 text-[13px] font-semibold transition-colors hover:text-primary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
			className: "h-3.5 w-3.5 shrink-0",
			strokeWidth: 1.8
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "truncate",
			children: project.partnerAgencyName ?? "Voir l'agence"
		})]
	});
}
function ProjectRow({ project }) {
	const queryClient = useQueryClient();
	const repostMutation = useMutation({
		mutationFn: () => repostProject(project.id),
		onSuccess: () => {
			toast("Projet republié auprès des agences pertinentes.");
			queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de republier ce projet.");
		}
	});
	const deleteMutation = useMutation({
		mutationFn: () => deleteProject(project.id),
		onSuccess: () => {
			toast("Projet supprimé.");
			queryClient.invalidateQueries({ queryKey: ["client", "projects"] });
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de supprimer ce projet.");
		}
	});
	function handleDelete() {
		if (window.confirm("Supprimer définitivement ce projet ?")) deleteMutation.mutate();
	}
	const canRepost = project.status === "published";
	const canDelete = project.status === "draft" || project.status === "published";
	const categoryStyle = CATEGORY_STYLES[project.category] ?? DEFAULT_CATEGORY_STYLE;
	const CategoryIcon = categoryStyle.icon;
	const statusStyle = STATUS_STYLES[project.status] ?? "bg-accent text-muted-foreground";
	const title = formatProjectTitle(project.title);
	const resumeLink = project.status === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/client/postuler-un-projet",
		search: { resume: project.id },
		className: "block w-full rounded-md border border-border px-3 py-2 text-center text-[13px] font-semibold transition-colors hover:bg-accent",
		children: "Reprendre le brouillon"
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/client/mes-projets/$id",
		params: { id: project.id },
		className: "block w-full rounded-md border border-border px-3 py-2 text-center text-[13px] font-semibold transition-colors hover:bg-accent",
		children: "Voir le projet"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hidden px-5 py-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_auto] lg:items-center lg:gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + categoryStyle.className,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
						className: "h-[16px] w-[16px]",
						strokeWidth: 1.7
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "line-clamp-2 text-[13.5px] font-bold leading-snug",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[12.5px] text-muted-foreground",
						children: project.reference
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[13px] font-semibold",
					children: project.category
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[13px] text-muted-foreground",
					children: project.subCategory
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgencyLink, { project })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-flex items-center rounded-full px-2.5 py-1 text-[12.5px] font-semibold " + statusStyle,
					children: project.statusLabel
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "truncate text-[13px]",
				children: [
					project.budgetMin,
					" € - ",
					project.budgetMax,
					" €"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] text-muted-foreground",
				children: project.lastActivity
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0",
				children: resumeLink
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectActionsMenu, {
				canRepost,
				canDelete,
				isReposting: repostMutation.isPending,
				isDeleting: deleteMutation.isPending,
				onRepost: () => repostMutation.mutate(),
				onDelete: handleDelete,
				className: "justify-self-center"
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 p-4 lg:hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " + categoryStyle.className,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
							className: "h-[18px] w-[18px]",
							strokeWidth: 1.7
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[14px] font-bold leading-snug",
							children: title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-[12.5px] text-muted-foreground",
							children: project.reference
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectActionsMenu, {
						canRepost,
						canDelete,
						isReposting: repostMutation.isPending,
						isDeleting: deleteMutation.isPending,
						onRepost: () => repostMutation.mutate(),
						onDelete: handleDelete
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold " + statusStyle,
					children: project.statusLabel
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground",
					children: project.category
				})]
			}),
			project.agencyId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5 text-[12.5px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] uppercase tracking-wide",
					children: "Agence :"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgencyLink, { project })]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 text-[12.5px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[11px] uppercase tracking-wide",
						children: "Budget"
					}),
					project.budgetMin,
					" € - ",
					project.budgetMax,
					" €"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-[11px] uppercase tracking-wide",
					children: "Dernière activité"
				}), project.lastActivity] })]
			}),
			resumeLink
		]
	})] });
}
//#endregion
export { ClientProjectsPage as component };
