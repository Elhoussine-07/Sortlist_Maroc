import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Et as CircleX, jt as CircleCheck } from "../_libs/lucide-react.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { c as StatusTabs, i as SectionCard, l as TextAreaField, r as SearchInput, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { a as listPendingSuspensions, c as refuseSuspensionAsModerator, i as listPendingLitigeNotices, l as resolveDispute, t as approveSuspensionAsModerator, u as resolveLitigeNotice } from "./moderation.service-B1NHqU6r.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.litiges-CNlrAgKz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		value: "all",
		label: "Tous"
	},
	{
		value: "dispute",
		label: "Litiges"
	},
	{
		value: "amicable",
		label: "Suspensions amiables"
	}
];
function describeNoticeDeadline(deadline) {
	if (!deadline) return "";
	const diffMs = new Date(deadline).getTime() - Date.now();
	if (diffMs <= 0) return "Délai dépassé";
	return `${Math.floor(diffMs / 36e5)}h${Math.floor(diffMs % 36e5 / 6e4).toString().padStart(2, "0")} restantes pour l'agence`;
}
function AdminLitigesPage() {
	const role = useAuthStore((state) => state.role);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
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
	const allCases = (0, import_react.useMemo)(() => casesQuery.data ?? [], [casesQuery.data]);
	const noticesQuery = useQuery({
		queryKey: [
			"admin",
			"moderation",
			"litige-notices"
		],
		queryFn: () => listPendingLitigeNotices(),
		enabled: role === "admin"
	});
	const litigeNotices = (0, import_react.useMemo)(() => noticesQuery.data ?? [], [noticesQuery.data]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("dispute");
	const counts = (0, import_react.useMemo)(() => ({
		all: allCases.length,
		dispute: allCases.filter((item) => item.category === "dispute").length,
		amicable: allCases.filter((item) => item.category === "amicable").length
	}), [allCases]);
	const filteredCases = (0, import_react.useMemo)(() => {
		let items = allCases;
		if (activeTab !== "all") items = items.filter((item) => item.category === activeTab);
		const normalizedQuery = query.trim().toLowerCase();
		if (normalizedQuery) items = items.filter((item) => `${item.projectTitle} ${item.clientName} ${item.agencyName ?? ""} ${item.justification}`.toLowerCase().includes(normalizedQuery));
		return [...items].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
	}, [
		allCases,
		activeTab,
		query
	]);
	const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });
	const [verdictTarget, setVerdictTarget] = (0, import_react.useState)(null);
	const [decisionNote, setDecisionNote] = (0, import_react.useState)("");
	const [pendingFounded, setPendingFounded] = (0, import_react.useState)(null);
	const resolveMutation = useMutation({
		mutationFn: ({ id, founded }) => resolveDispute(id, founded, decisionNote.trim() || void 0),
		onSuccess: (_data, variables) => {
			toast(variables.founded ? "Litige tranché : fondé — pour un litige déposé par l'agence, le projet est rejeté immédiatement ; pour un litige déposé par le client, l'agence dispose désormais d'un délai de réponse avant décision finale (cf. section « Litiges en préavis »)." : "Litige tranché : non fondé — le projet reprend son cours normal.");
			invalidate();
			setVerdictTarget(null);
			setDecisionNote("");
			setPendingFounded(null);
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer le verdict.");
		}
	});
	const overrideMutation = useMutation({
		mutationFn: ({ id, decision }) => decision === "approve" ? approveSuspensionAsModerator(id) : refuseSuspensionAsModerator(id),
		onSuccess: (_data, variables) => {
			toast(variables.decision === "approve" ? "Suspension amiable validée par le modérateur." : "Suspension amiable refusée par le modérateur.");
			invalidate();
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer la décision.");
		}
	});
	const [noticeTarget, setNoticeTarget] = (0, import_react.useState)(null);
	const [noticeDecisionNote, setNoticeDecisionNote] = (0, import_react.useState)("");
	const [noticeAccept, setNoticeAccept] = (0, import_react.useState)(null);
	const noticeMutation = useMutation({
		mutationFn: ({ id, accept }) => resolveLitigeNotice(id, accept, noticeDecisionNote.trim() || void 0),
		onSuccess: (_data, variables) => {
			toast(variables.accept ? "Justification de l'agence acceptée — le projet reprend son cours normal." : "Justification jugée insuffisante — le projet est rejeté (conséquences CDC §2.5.3 appliquées).");
			invalidate();
			setNoticeTarget(null);
			setNoticeDecisionNote("");
			setNoticeAccept(null);
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer la décision.");
		}
	});
	if (role !== "admin") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "admin",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-[1080px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-[24px] font-bold tracking-tight",
						children: "Litiges & suspensions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[14px] text-muted-foreground",
						children: "File d'attente des dossiers en attente, tous projets/agences/clients confondus."
					}),
					litigeNotices.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-7",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
							title: "Litiges en préavis — décision finale",
							description: "Litiges client déjà jugés fondés : l'agence a été invitée à répondre avant conséquences finales (rejet du projet).",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-4",
								children: litigeNotices.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-lg border border-border p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-start justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[15px] font-bold",
													children: item.projectTitle
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 text-[13px] text-muted-foreground",
													children: [
														item.clientName,
														" — ",
														item.agencyName ?? "Agence inconnue"
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: item.litigeNoticeStatus === "Responded" ? "Agence a répondu" : `En attente — ${describeNoticeDeadline(item.agencyNoticeDeadline)}` })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-3 text-[13px] text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold",
												children: "Justification client : "
											}), item.justification]
										}),
										item.agencyResponse ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 rounded-md bg-accent/40 p-2.5 text-[13px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold",
												children: "Réponse de l'agence : "
											}), item.agencyResponse]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-[13px] text-muted-foreground",
											children: "L'agence n'a pas encore répondu."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													setNoticeTarget(item);
													setNoticeAccept(true);
												},
												className: "flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Accepter — reprendre le projet"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													setNoticeTarget(item);
													setNoticeAccept(false);
												},
												className: "flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Rejeter le projet"]
											})]
										})
									]
								}, item.id))
							})
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchInput, {
							value: query,
							onChange: setQuery,
							placeholder: "Rechercher par projet, client, agence..."
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: casesQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 4 }) : filteredCases.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun dossier en attente dans cette vue." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4",
							children: filteredCases.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-lg border border-border p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-start justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[15px] font-bold",
												children: item.projectTitle
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 text-[13px] text-muted-foreground",
												children: [
													item.clientName,
													" — ",
													item.agencyName ?? "Agence inconnue"
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: item.category === "dispute" ? "Litige" : "Suspension amiable" })]
									}),
									item.justification ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-[13px] text-muted-foreground",
										children: item.justification
									}) : null,
									item.category === "dispute" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												setVerdictTarget(item);
												setPendingFounded(true);
											},
											className: "flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
												className: "h-3.5 w-3.5",
												strokeWidth: 1.8
											}), "Litige fondé"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												setVerdictTarget(item);
												setPendingFounded(false);
											},
											className: "flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
												className: "h-3.5 w-3.5",
												strokeWidth: 1.8
											}), "Litige non fondé"]
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[13px] text-muted-foreground",
											children: "En attente de la décision directe de l'agence. Le bouton ci-dessous est un filet de sécurité (agence injoignable/inactive) — pas le flux nominal."
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												disabled: overrideMutation.isPending,
												onClick: () => overrideMutation.mutate({
													id: item.id,
													decision: "approve"
												}),
												className: "flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Forcer la validation"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												disabled: overrideMutation.isPending,
												onClick: () => overrideMutation.mutate({
													id: item.id,
													decision: "refuse"
												}),
												className: "flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Forcer le refus"]
											})]
										})]
									})
								]
							}, item.id))
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: verdictTarget !== null,
				onOpenChange: (open) => {
					if (!open) {
						setVerdictTarget(null);
						setDecisionNote("");
						setPendingFounded(null);
					}
				},
				title: pendingFounded ? "Confirmer : litige fondé" : "Confirmer : litige non fondé",
				description: pendingFounded ? "Litige déposé par l'agence (client inactif) : le projet est rejeté immédiatement et la commission créditée à l'agence. Litige déposé par le client (agence défaillante) : le projet reste Suspendu, l'agence reçoit un délai de réponse avant décision finale (section « Litiges en préavis »)." : "Le projet reprend son cours normal, comme un simple « Reprendre ».",
				confirmLabel: resolveMutation.isPending ? "..." : "Confirmer le verdict",
				onConfirm: () => {
					if (!verdictTarget || pendingFounded === null) return;
					resolveMutation.mutate({
						id: verdictTarget.id,
						founded: pendingFounded
					});
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
					label: "Note de décision (optionnel)",
					rows: 4,
					value: decisionNote,
					onChange: (event) => setDecisionNote(event.target.value),
					placeholder: "Motivation du verdict, visible dans l'historique du dossier..."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: noticeTarget !== null,
				onOpenChange: (open) => {
					if (!open) {
						setNoticeTarget(null);
						setNoticeDecisionNote("");
						setNoticeAccept(null);
					}
				},
				title: noticeAccept ? "Confirmer : reprendre le projet" : "Confirmer : rejeter le projet",
				description: noticeAccept ? "Le projet repasse En cours, l'opportunité de l'agence repasse Gagnée." : "Le projet passe Rejeté (sous-statut Agence défaillante), l'agence reçoit une pénalité PQI.",
				confirmLabel: noticeMutation.isPending ? "..." : "Confirmer",
				onConfirm: () => {
					if (!noticeTarget || noticeAccept === null) return;
					noticeMutation.mutate({
						id: noticeTarget.id,
						accept: noticeAccept
					});
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
					label: "Note de décision (optionnel)",
					rows: 4,
					value: noticeDecisionNote,
					onChange: (event) => setNoticeDecisionNote(event.target.value),
					placeholder: "Motivation de la décision finale..."
				})
			})
		]
	});
}
//#endregion
export { AdminLitigesPage as component };
