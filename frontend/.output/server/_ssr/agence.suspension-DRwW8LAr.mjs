import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { E as ShieldAlert } from "../_libs/lucide-react.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { c as StatusTabs, i as SectionCard, l as TextAreaField, r as SearchInput, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as ListPagination, t as FilterSelect } from "./ListControls-FMqnx6XI.mjs";
import { t as DataTable } from "./DataTable-EspjDfBC.mjs";
import { a as respondToLitigeNotice, i as respondToAmicableSuspension, n as getSuspensionCases, o as respondToSuspension, r as getSuspensionHistory } from "./agency-projects.service-phWEnAJj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agence.suspension-DRwW8LAr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function isPendingLitigeNotice(item) {
	return item.litigeNoticeStatus === "Pending";
}
function describeNoticeDeadline(deadline) {
	if (!deadline) return "";
	const diffMs = new Date(deadline).getTime() - Date.now();
	if (diffMs <= 0) return "Délai dépassé — en cours de traitement";
	return `${Math.floor(diffMs / 36e5)}h${Math.floor(diffMs % 36e5 / 6e4).toString().padStart(2, "0")} restantes pour répondre`;
}
var TABS = [
	{
		value: "all",
		label: "Tous"
	},
	{
		value: "amicable",
		label: "Résolution amiable"
	},
	{
		value: "dispute",
		label: "Litige"
	},
	{
		value: "closed",
		label: "Clôturés"
	}
];
function isPendingAmicableFromClient(item) {
	return item.category === "amicable" && item.requestedBy === "client" && item.status === "Requested";
}
function buildColumns(onSelect, onDecide, onRespondToLitigeNotice, onViewDetails) {
	return [
		{
			key: "case",
			header: "Dossier",
			width: "minmax(0,2.2fr)",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[13.5px] font-bold",
					children: item.projectTitle
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[13px] text-muted-foreground",
					children: item.clientName
				})]
			})
		},
		{
			key: "reason",
			header: "Motif",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px]",
				children: item.reason
			})
		},
		{
			key: "status",
			header: "Statut",
			render: (item) => isPendingLitigeNotice(item) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: "Litige fondé — préavis" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[12px] text-muted-foreground",
					children: describeNoticeDeadline(item.agencyNoticeDeadline)
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: item.statusLabel })
		},
		{
			key: "openedAt",
			header: "Ouvert le",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] text-muted-foreground",
				children: item.openedAt
			})
		},
		{
			key: "moderator",
			header: "Modérateur",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-[13px] text-muted-foreground",
				children: item.moderator ?? "—"
			})
		},
		{
			key: "action",
			header: "Action",
			render: (item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [isPendingLitigeNotice(item) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onRespondToLitigeNotice(item),
					className: "rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
					children: "Répondre à la justification"
				}) : isPendingAmicableFromClient(item) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onDecide(item, "accept"),
					className: "rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
					children: "Accepter"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onDecide(item, "refuse"),
					className: "rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
					children: "Refuser"
				})] }) : item.status === "Requested" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onSelect(item),
					className: "rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
					children: "Répondre"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onViewDetails(item),
					className: "rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
					children: "Voir le dossier"
				})]
			})
		}
	];
}
function AgencySuspensionPage() {
	const queryClient = useQueryClient();
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [isRespondOpen, setIsRespondOpen] = (0, import_react.useState)(false);
	const [response, setResponse] = (0, import_react.useState)("");
	const [selectedCase, setSelectedCase] = (0, import_react.useState)(null);
	const [page] = (0, import_react.useState)(1);
	const casesQuery = useQuery({
		queryKey: [
			"agency",
			"suspensions",
			activeTab,
			query,
			page
		],
		queryFn: () => getSuspensionCases({
			...query.trim() ? { query: query.trim() } : {},
			...activeTab !== "all" ? { status: activeTab } : {},
			page,
			pageSize: 20
		})
	});
	const cases = casesQuery.data?.items ?? [];
	const isLoading = casesQuery.isLoading;
	const counts = casesQuery.data?.counts ?? {};
	const totalPages = casesQuery.data?.totalPages ?? null;
	const historyQuery = useQuery({
		queryKey: [
			"agency",
			"suspensions",
			"history",
			selectedCase?.id
		],
		queryFn: () => getSuspensionHistory(selectedCase?.id ?? ""),
		enabled: selectedCase !== null
	});
	const history = historyQuery.data ?? [];
	const isHistoryLoading = historyQuery.isLoading;
	const respondMutation = useMutation({
		mutationFn: (payload) => {
			if (!selectedCase) throw new Error("Sélectionnez d'abord un dossier dans la liste.");
			return respondToSuspension(selectedCase.id, payload);
		},
		onSuccess: () => {
			toast("Réponse envoyée");
			queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
			setIsRespondOpen(false);
			setResponse("");
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Endpoint indisponible pour le moment.");
		}
	});
	const [litigeNoticeTarget, setLitigeNoticeTarget] = (0, import_react.useState)(null);
	const [litigeNoticeMessage, setLitigeNoticeMessage] = (0, import_react.useState)("");
	const litigeNoticeMutation = useMutation({
		mutationFn: () => {
			if (!litigeNoticeTarget) throw new Error("Aucun dossier sélectionné.");
			return respondToLitigeNotice(litigeNoticeTarget.id, litigeNoticeMessage.trim());
		},
		onSuccess: () => {
			toast("Justification envoyée au modérateur.");
			queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
			setLitigeNoticeTarget(null);
			setLitigeNoticeMessage("");
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'envoyer votre justification.");
		}
	});
	const [decisionTarget, setDecisionTarget] = (0, import_react.useState)(null);
	const [decisionType, setDecisionType] = (0, import_react.useState)(null);
	const [decisionMessage, setDecisionMessage] = (0, import_react.useState)("");
	const decisionMutation = useMutation({
		mutationFn: () => {
			if (!decisionTarget || !decisionType) throw new Error("Aucune demande sélectionnée.");
			return respondToAmicableSuspension(decisionTarget.id, decisionType, decisionMessage.trim() || void 0);
		},
		onSuccess: () => {
			toast(decisionType === "accept" ? "Suspension acceptée — le projet passe Suspendu." : "Demande refusée.");
			queryClient.invalidateQueries({ queryKey: ["agency", "suspensions"] });
			setDecisionTarget(null);
			setDecisionType(null);
			setDecisionMessage("");
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer votre décision.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "agency",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-[1080px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
								className: "mt-1 h-[22px] w-[22px] shrink-0",
								strokeWidth: 1.6
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-[24px] font-bold tracking-tight",
									children: "Suspension"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[14px] text-muted-foreground",
									children: "Litiges, signalements et suivi de leur résolution."
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								if (!selectedCase) {
									toast("Sélectionnez d'abord un dossier dans la liste ci-dessous.");
									return;
								}
								setIsRespondOpen(true);
							},
							className: "rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:justify-self-end",
							children: "Répondre à un signalement"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-7",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchInput, {
							value: query,
							onChange: setQuery,
							placeholder: "Rechercher un dossier..."
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
								label: "Statut",
								placeholder: "Tous les statuts"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
								label: "Période",
								placeholder: "Toutes les périodes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterSelect, {
								label: "Motif",
								placeholder: "Tous les motifs"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
							columns: buildColumns((item) => {
								setSelectedCase(item);
								setIsRespondOpen(true);
							}, (item, decision) => {
								setDecisionTarget(item);
								setDecisionType(decision);
								setDecisionMessage("");
							}, (item) => {
								setLitigeNoticeTarget(item);
								setLitigeNoticeMessage("");
							}, (item) => {
								setSelectedCase(item);
								document.getElementById("dossier-detail")?.scrollIntoView({
									behavior: "smooth",
									block: "start"
								});
							}),
							rows: cases,
							isLoading
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPagination, {
						page,
						totalPages
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "dossier-detail",
						className: "mt-9 scroll-mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
							title: selectedCase ? `Dossier — ${selectedCase.projectTitle}` : "Détail du dossier",
							description: selectedCase ? `${selectedCase.clientName} — ${selectedCase.category === "dispute" ? "Litige" : "Suspension amiable"} — ${selectedCase.statusLabel}` : "Cliquez sur « Voir le dossier » sur une ligne pour afficher son détail.",
							children: selectedCase === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun dossier sélectionné." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 gap-3 text-[13.5px] sm:grid-cols-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: "Motif : "
										}), selectedCase.reason || "—"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: "Ouvert le : "
										}), selectedCase.openedAt || "—"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: "Demandé par : "
										}), selectedCase.requestedBy === "client" ? "Le client" : selectedCase.requestedBy === "agency" ? "Vous (agence)" : selectedCase.requestedBy === "system" ? "Système" : "—"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold",
											children: "Modérateur : "
										}), selectedCase.moderator ?? "—"] })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-3 text-[13.5px] font-bold",
									children: "Chronologie"
								}), isHistoryLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune donnée disponible" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-4",
									children: history.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "border-l border-border pl-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[13px] text-muted-foreground",
												children: entry.date
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 text-[13.5px] font-semibold",
												children: entry.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[13px] text-muted-foreground",
												children: entry.description
											})
										]
									}, entry.id))
								})] })]
							})
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: isRespondOpen,
				onOpenChange: (open) => {
					setIsRespondOpen(open);
					if (!open) setSelectedCase(null);
				},
				title: "Répondre au signalement",
				description: selectedCase ? `Dossier "${selectedCase.projectTitle}" — votre réponse est transmise au client et au modérateur.` : "Votre réponse est transmise au client et au modérateur.",
				confirmLabel: respondMutation.isPending ? "Envoi..." : "Envoyer la réponse",
				onConfirm: () => {
					if (!response.trim()) {
						toast("Renseignez une réponse avant d'envoyer.");
						return;
					}
					respondMutation.mutate({ message: response.trim() });
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
					label: "Votre réponse",
					rows: 5,
					value: response,
					onChange: (event) => setResponse(event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: decisionTarget !== null,
				onOpenChange: (open) => {
					if (!open) {
						setDecisionTarget(null);
						setDecisionType(null);
						setDecisionMessage("");
					}
				},
				title: decisionType === "accept" ? "Accepter la suspension" : "Refuser la suspension",
				description: decisionTarget ? `Dossier "${decisionTarget.projectTitle}" — ${decisionType === "accept" ? "le projet passera Suspendu dès confirmation." : "le projet reste En cours, le client est notifié du refus."}` : "",
				confirmLabel: decisionMutation.isPending ? "Envoi..." : decisionType === "accept" ? "Accepter" : "Refuser",
				onConfirm: () => decisionMutation.mutate(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
					label: "Message de réponse (optionnel)",
					rows: 4,
					value: decisionMessage,
					onChange: (event) => setDecisionMessage(event.target.value),
					placeholder: "Expliquez votre décision au client..."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: litigeNoticeTarget !== null,
				onOpenChange: (open) => {
					if (!open) {
						setLitigeNoticeTarget(null);
						setLitigeNoticeMessage("");
					}
				},
				title: "Répondre au litige",
				description: litigeNoticeTarget ? `Dossier "${litigeNoticeTarget.projectTitle}" — le modérateur a jugé le litige du client fondé. Votre justification sera examinée avant toute décision finale (rejet ou reprise du projet). ${describeNoticeDeadline(litigeNoticeTarget.agencyNoticeDeadline)}` : "",
				confirmLabel: litigeNoticeMutation.isPending ? "Envoi..." : "Envoyer ma justification",
				onConfirm: () => {
					if (!litigeNoticeMessage.trim()) {
						toast("Renseignez votre justification avant d'envoyer.");
						return;
					}
					litigeNoticeMutation.mutate();
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
					label: "Votre justification",
					rows: 5,
					value: litigeNoticeMessage,
					onChange: (event) => setLitigeNoticeMessage(event.target.value),
					placeholder: "Expliquez pourquoi le projet devrait reprendre..."
				})
			})
		]
	});
}
//#endregion
export { AgencySuspensionPage as component };
