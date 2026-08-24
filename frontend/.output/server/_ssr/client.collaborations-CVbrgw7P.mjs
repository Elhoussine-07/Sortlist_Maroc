import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Pt as ChevronDown, b as Star, i as Wallet, k as Search, zt as Calendar } from "../_libs/lucide-react.mjs";
import { a as frappeCall, r as camelizeKeys, t as ApiError } from "./http-BM0VI1yy.mjs";
import { t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { l as TextAreaField } from "./Blocks-CStVFDlw.mjs";
import { i as TableSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as ListPagination, t as FilterSelect } from "./ListControls-FMqnx6XI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.collaborations-CVbrgw7P.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function mapCollaboration(raw) {
	const data = camelizeKeys(raw);
	const agencyName = String(data["agencyName"] ?? data["agency"] ?? "");
	const initials = agencyName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
	return {
		id: String(data["id"] ?? data["name"] ?? data["project"] ?? ""),
		agencyInitials: String(data["agencyInitials"] ?? initials),
		agencyName,
		agencyTagline: String(data["agencyTagline"] ?? data["slogan"] ?? ""),
		ratingReceived: Number(data["ratingReceived"] ?? data["rating"] ?? 0),
		finishedProjects: String(data["finishedProjects"] ?? data["finishedProjectsCount"] ?? ""),
		period: String(data["period"] ?? ""),
		budget: String(data["budget"] ?? ""),
		publicReview: String(data["publicReview"] ?? data["comment"] ?? ""),
		reviewLength: Number(data["reviewLength"] ?? String(data["publicReview"] ?? data["comment"] ?? "").length),
		yourRating: Number(data["yourRating"] ?? data["rating"] ?? 0)
	};
}
async function getCollaborations(params) {
	const page = params?.page ?? 1;
	const pageSize = params?.pageSize ?? 20;
	const raw = await frappeCall("client.list_collaborations", {});
	const items = (Array.isArray(raw) ? raw : []).map((item) => mapCollaboration(item));
	return {
		items,
		page,
		pageSize,
		total: items.length,
		totalPages: 1
	};
}
async function submitCollaborationReview(id, payload) {
	return mapCollaboration(await frappeCall("review.submit_agency_review", {
		project: id,
		rating: payload.rating,
		comment: payload.publicReview
	}));
}
var RATING_TABS = [
	{
		value: "all",
		label: "Toutes"
	},
	{
		value: "reviewed",
		label: "Avis publiés"
	},
	{
		value: "pending",
		label: "Avis à publier"
	}
];
var PAGE_SIZE = 20;
function ClientCollaborationsPage() {
	const queryClient = useQueryClient();
	const collaborationsQuery = useQuery({
		queryKey: ["client", "collaborations"],
		queryFn: () => getCollaborations()
	});
	const isLoading = collaborationsQuery.isPending;
	const allCollaborations = (0, import_react.useMemo)(() => collaborationsQuery.data?.items ?? [], [collaborationsQuery.data]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [page, setPage] = (0, import_react.useState)(1);
	const counts = (0, import_react.useMemo)(() => {
		const reviewed = allCollaborations.filter((c) => c.publicReview.length > 0).length;
		return {
			all: allCollaborations.length,
			reviewed,
			pending: allCollaborations.length - reviewed
		};
	}, [allCollaborations]);
	const filteredCollaborations = (0, import_react.useMemo)(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return allCollaborations.filter((collaboration) => {
			const matchesTab = activeTab === "all" || activeTab === "reviewed" && collaboration.publicReview.length > 0 || activeTab === "pending" && collaboration.publicReview.length === 0;
			const matchesQuery = normalizedQuery.length === 0 || collaboration.agencyName.toLowerCase().includes(normalizedQuery);
			return matchesTab && matchesQuery;
		});
	}, [
		allCollaborations,
		activeTab,
		query
	]);
	const total = filteredCollaborations.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const collaborations = filteredCollaborations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
	const [reviewTarget, setReviewTarget] = (0, import_react.useState)(null);
	const [reviewRating, setReviewRating] = (0, import_react.useState)(5);
	const [reviewComment, setReviewComment] = (0, import_react.useState)("");
	const reviewMutation = useMutation({
		mutationFn: (payload) => submitCollaborationReview(payload.id, {
			rating: payload.rating,
			publicReview: payload.publicReview
		}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["client", "collaborations"] });
			toast.success("Avis envoyé");
			setReviewTarget(null);
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Impossible d'envoyer l'avis.");
		}
	});
	const openReviewModal = (collaboration) => {
		setReviewTarget(collaboration);
		setReviewRating(collaboration.yourRating || 5);
		setReviewComment(collaboration.publicReview);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "client",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[24px] font-bold tracking-tight",
					children: "Collaborations"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[14px] text-muted-foreground",
					children: "Agences avec lesquelles vous avez des projets terminés"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-7 flex items-center gap-3 rounded-md border border-border px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "h-[18px] w-[18px] shrink-0 text-muted-foreground",
						strokeWidth: 1.7
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Rechercher une agence ou un projet...",
						className: "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-3",
					children: RATING_TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setActiveTab(tab.value);
							setPage(1);
						},
						"aria-pressed": activeTab === tab.value,
						className: activeTab === tab.value ? "rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground" : "rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-accent",
						children: [tab.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-1.5 text-[13px] font-normal opacity-70",
							children: counts[tab.value] ?? 0
						})]
					}, tab.value))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Agence",
							placeholder: "Toutes les agences"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Période",
							placeholder: "Toutes les périodes"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
							label: "Note reçue",
							placeholder: "Toutes les notes"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-[14px] font-semibold",
						children: [total, " collaborations"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: true,
						title: "Tri indisponible : le backend n'expose pas de date brute pour les collaborations, seulement une période déjà formatée.",
						className: "flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground opacity-60",
						children: ["Trier par : Plus récentes", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
							className: "h-3.5 w-3.5",
							strokeWidth: 1.8
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 rounded-lg border border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-border px-5 py-3 lg:grid",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold",
								children: "Agence"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold",
								children: "Projets terminés"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold",
								children: "Période"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold",
								children: "Budget"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold",
								children: "Note reçue"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-semibold",
								children: "Action"
							})
						]
					}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableSkeleton, {
							rows: 6,
							columns: 6
						})
					}) : collaborations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune collaboration à afficher." })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border",
						children: collaborations.map((collaboration) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollaborationRow, {
							collaboration,
							onReview: () => openReviewModal(collaboration)
						}) }, collaboration.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPagination, {
					page: currentPage,
					totalPages,
					onPageChange: setPage
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
			open: reviewTarget !== null,
			onOpenChange: (open) => {
				if (!open) setReviewTarget(null);
			},
			title: reviewTarget?.publicReview ? "Votre avis" : "Laisser un avis",
			description: reviewTarget ? `Agence : ${reviewTarget.agencyName}` : "",
			confirmLabel: reviewMutation.isPending ? "Envoi…" : "Envoyer l'avis",
			onConfirm: () => {
				if (!reviewTarget) return;
				reviewMutation.mutate({
					id: reviewTarget.id,
					rating: reviewRating,
					publicReview: reviewComment
				});
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[13px] text-muted-foreground",
					children: "Note"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1.5 flex items-center gap-1.5",
					children: [
						1,
						2,
						3,
						4,
						5
					].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setReviewRating(value),
						"aria-label": `${value} étoile${value > 1 ? "s" : ""}`,
						className: "text-foreground transition-opacity hover:opacity-70",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
							className: "h-5 w-5",
							strokeWidth: 1.8,
							fill: value <= reviewRating ? "currentColor" : "none"
						})
					}, value))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
					label: "Votre avis",
					rows: 4,
					value: reviewComment,
					onChange: (event) => setReviewComment(event.target.value)
				})]
			})
		})]
	});
}
function CollaborationRow({ collaboration, onReview }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center lg:gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-[13px] font-bold",
					children: collaboration.agencyInitials
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[13.5px] font-bold",
						children: collaboration.agencyName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[13px] text-muted-foreground",
						children: collaboration.agencyTagline
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px]",
				children: collaboration.finishedProjects
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
					className: "h-3 w-3 shrink-0",
					strokeWidth: 1.8
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: collaboration.period
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex min-w-0 items-center gap-1.5 text-[13px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
					className: "h-3 w-3 shrink-0",
					strokeWidth: 1.8
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: collaboration.budget
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1.5 text-[13px] font-semibold",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
						className: "h-3 w-3 shrink-0",
						strokeWidth: 1.8
					}),
					collaboration.ratingReceived,
					"/5"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onReview,
					type: "button",
					className: "w-full rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent lg:w-auto",
					children: collaboration.publicReview ? "Voir l'avis" : "Laisser un avis"
				})
			})
		]
	});
}
//#endregion
export { ClientCollaborationsPage as component };
