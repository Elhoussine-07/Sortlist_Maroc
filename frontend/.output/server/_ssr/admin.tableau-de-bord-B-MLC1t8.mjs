import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Qt as ArrowRight, lt as Gavel, st as Handshake } from "../_libs/lucide-react.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { a as StatCard, i as SectionCard, o as StatGrid, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { n as StackSkeleton, r as StatSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { a as listPendingSuspensions } from "./moderation.service-B1NHqU6r.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.tableau-de-bord-B-MLC1t8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminDashboardPage() {
	const role = useAuthStore((state) => state.role);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (role && role !== "admin") navigate({ to: role === "agency" ? "/agence/tableau-de-bord" : "/client/tableau-de-bord" });
	}, [role, navigate]);
	const casesQuery = useQuery({
		queryKey: [
			"admin",
			"moderation",
			"pending"
		],
		queryFn: () => listPendingSuspensions(),
		enabled: role === "admin"
	});
	const cases = casesQuery.data ?? [];
	const stats = (0, import_react.useMemo)(() => {
		return {
			pendingDisputes: cases.filter((item) => item.category === "dispute").length,
			pendingAmicable: cases.filter((item) => item.category === "amicable").length,
			total: cases.length
		};
	}, [cases]);
	const recentDisputes = (0, import_react.useMemo)(() => cases.filter((item) => item.category === "dispute").slice(0, 5), [cases]);
	if (role !== "admin") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardShell, {
		role: "admin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[24px] font-bold tracking-tight",
					children: "Tableau de bord — Administration"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[14px] text-muted-foreground",
					children: "Vue d'ensemble des litiges et suspensions en attente, tous projets confondus."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-7",
					children: casesQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatSkeleton, { count: 3 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StatGrid, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							icon: Gavel,
							label: "Litiges en attente de verdict",
							value: String(stats.pendingDisputes)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							icon: Handshake,
							label: "Suspensions amiables en attente",
							value: String(stats.pendingAmicable),
							footer: "Décidées en priorité par l'agence — modérateur en filet de sécurité"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
							icon: Gavel,
							label: "Dossiers en attente au total",
							value: String(stats.total)
						})
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
						title: "Litiges en attente de verdict",
						description: "Nécessitent une décision Fondé / Non fondé du modérateur.",
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin/litiges",
							className: "flex items-center gap-1.5 text-[13.5px] font-semibold text-primary transition-opacity hover:opacity-80",
							children: ["Voir tous les dossiers", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "h-3.5 w-3.5",
								strokeWidth: 1.8
							})]
						}),
						children: casesQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : recentDisputes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun litige en attente pour le moment." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: recentDisputes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/admin/litiges",
								className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[14px] font-bold",
										children: item.projectTitle
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 truncate text-[13px] text-muted-foreground",
										children: [
											item.clientName,
											" — ",
											item.agencyName ?? "Agence inconnue"
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: "Litige — à trancher" })]
							}, item.id))
						})
					})
				})
			]
		})
	});
}
//#endregion
export { AdminDashboardPage as component };
