import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { O as Send, Pt as ChevronDown } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as StatusTabs, r as SearchInput, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as ListPagination, t as FilterSelect } from "./ListControls-FMqnx6XI.mjs";
import { t as DataTable } from "./DataTable-EspjDfBC.mjs";
import { r as getLeads } from "./prospection.service--95GQsSM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agence.mes-prospections-B2eUycvb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		value: "all",
		label: "Toutes"
	},
	{
		value: "sent",
		label: "Envoyées"
	},
	{
		value: "answered",
		label: "Répondues"
	},
	{
		value: "no_answer",
		label: "Sans réponse"
	}
];
var COLUMNS = [
	{
		key: "prospect",
		header: "Prospect",
		width: "minmax(0,2.2fr)",
		render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-[13px] font-semibold",
				children: item.initials
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[13.5px] font-bold",
					children: item.companyName
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[13px] text-muted-foreground",
					children: item.location
				})]
			})]
		})
	},
	{
		key: "actions",
		header: "Signaux détectés",
		render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "truncate text-[13px]",
			children: item.actions.join(" · ") || "—"
		})
	},
	{
		key: "status",
		header: "Statut",
		render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: item.temperatureLabel })
	},
	{
		key: "score",
		header: "Score",
		render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "truncate text-[13px] text-muted-foreground",
			children: [item.score, "/100"]
		})
	},
	{
		key: "action",
		header: "Action",
		render: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/agence/prospection",
			className: "rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
			children: "Voir le suivi"
		})
	}
];
function AgencyMyProspectionsPage() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [page] = (0, import_react.useState)(1);
	const [sortDirection, setSortDirection] = (0, import_react.useState)("recent");
	const leadsQuery = useQuery({
		queryKey: [
			"agency",
			"prospection",
			"leads",
			"mine"
		],
		queryFn: () => getLeads({
			page,
			pageSize: 50
		})
	});
	const allProspections = (0, import_react.useMemo)(() => {
		const items = leadsQuery.data?.items ?? [];
		return sortDirection === "old" ? [...items].reverse() : items;
	}, [leadsQuery.data, sortDirection]);
	const isLoading = leadsQuery.isLoading;
	const prospections = activeTab === "all" ? allProspections : [];
	const filtered = query.trim() ? prospections.filter((item) => item.companyName.toLowerCase().includes(query.trim().toLowerCase())) : prospections;
	const counts = { all: allProspections.length };
	const total = filtered.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardShell, {
		role: "agency",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
						className: "mt-1 h-[22px] w-[22px] shrink-0",
						strokeWidth: 1.6
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[24px] font-bold tracking-tight",
							children: "Mes prospections"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[14px] text-muted-foreground",
							children: "Suivez les prospects que vous avez contactés."
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-7",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchInput, {
						value: query,
						onChange: setQuery,
						placeholder: "Rechercher une prospection..."
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusTabs, {
						tabs: TABS,
						value: activeTab,
						onChange: setActiveTab,
						counts
					})
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
						children: [total, " prospections"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setSortDirection((current) => current === "recent" ? "old" : "recent"),
						type: "button",
						className: "flex shrink-0 items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground",
						children: [
							"Trier par : ",
							sortDirection === "recent" ? "Plus récentes" : "Plus anciennes",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								className: "h-3.5 w-3.5",
								strokeWidth: 1.8
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
						columns: COLUMNS,
						rows: filtered,
						isLoading
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPagination, {
					page,
					totalPages: null
				})
			]
		})
	});
}
//#endregion
export { AgencyMyProspectionsPage as component };
