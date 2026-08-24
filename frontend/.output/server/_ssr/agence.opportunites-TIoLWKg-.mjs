import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { At as CirclePause, Et as CircleX, It as CheckCheck, K as MapPin, O as Send, Pt as ChevronDown, Ut as Briefcase, dt as FileText, jt as CircleCheck, tn as Archive } from "../_libs/lucide-react.mjs";
import { i as fetchBlob, n as GATEWAY_URL, t as ApiError } from "./http-BM0VI1yy.mjs";
import { i as getProject } from "./projects.service-BHaNpgMa.mjs";
import { s as getCategories } from "./EmptyState-CjCsYQbe.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { c as StatusTabs, r as SearchInput, s as StatusBadge, u as TextField } from "./Blocks-CStVFDlw.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as ListPagination } from "./ListControls-FMqnx6XI.mjs";
import { t as DataTable } from "./DataTable-EspjDfBC.mjs";
import { a as refuseOpportunity, i as getOpportunityCdc, n as expressInterest, o as sendQuote, r as getOpportunities, t as acceptOpportunity } from "./opportunities.service-CTW7kUZZ.mjs";
import { a as signalReady } from "./disputes.service-C_k2fHNI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agence.opportunites-TIoLWKg-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		value: "all",
		label: "Offres"
	},
	{
		value: "available",
		label: "Disponibles"
	},
	{
		value: "applied",
		label: "Postulé"
	},
	{
		value: "won",
		label: "Gagnées"
	},
	{
		value: "paused",
		label: "En pause"
	},
	{
		value: "finished",
		label: "Terminées"
	},
	{
		value: "archived",
		label: "Archivées"
	}
];
var BUDGET_OPTIONS = [
	{
		value: "0-1000",
		label: "Moins de 1 000 €"
	},
	{
		value: "1000-5000",
		label: "1 000 € - 5 000 €"
	},
	{
		value: "5000-20000",
		label: "5 000 € - 20 000 €"
	},
	{
		value: "20000-100000",
		label: "20 000 € - 100 000 €"
	},
	{
		value: "100000-",
		label: "Plus de 100 000 €"
	}
];
function tabToOpportunityTab(uiTab) {
	if (uiTab === "all") return "offers";
	return uiTab;
}
function getOpportunityStatusVisual(opportunity, activeTab) {
	const status = `${(opportunity.rawStatus ?? "").trim().toLowerCase()} ${(opportunity.stepLabel ?? "").trim().toLowerCase()}`;
	if (status.includes("archiv")) return {
		icon: Archive,
		className: "bg-muted text-muted-foreground"
	};
	if (status.includes("rejet") || status.includes("refus")) return {
		icon: CircleX,
		className: "bg-destructive/10 text-destructive"
	};
	if (status.includes("pause")) return {
		icon: CirclePause,
		className: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
	};
	if (status.includes("termin")) return {
		icon: CheckCheck,
		className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
	};
	if (status.includes("gagn") || status.includes("won")) return {
		icon: CircleCheck,
		className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
	};
	if (status.includes("devis")) return {
		icon: FileText,
		className: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
	};
	if (status.includes("accept")) return {
		icon: Send,
		className: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
	};
	if (status.includes("reç") || status.includes("recue")) return {
		icon: Briefcase,
		className: "bg-primary/10 text-primary"
	};
	switch (activeTab) {
		case "available": return {
			icon: Briefcase,
			className: "bg-primary/10 text-primary"
		};
		case "applied": return {
			icon: Send,
			className: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
		};
		case "won": return {
			icon: CircleCheck,
			className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
		};
		case "paused": return {
			icon: CirclePause,
			className: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
		};
		case "finished": return {
			icon: CheckCheck,
			className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
		};
		case "archived": return {
			icon: Archive,
			className: "bg-muted text-muted-foreground"
		};
		default: return {
			icon: Briefcase,
			className: "bg-primary/10 text-primary"
		};
	}
}
function isAcceptedAwaitingQuote(opportunity) {
	return opportunity.rawStatus === "Acceptée";
}
function isPendingAgencyDecision(opportunity) {
	return opportunity.rawStatus === "Reçue";
}
function AgencyOpportunitiesPage() {
	const queryClient = useQueryClient();
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [page, setPage] = (0, import_react.useState)(1);
	const [sortDirection, setSortDirection] = (0, import_react.useState)("recent");
	const [openingCdcId, setOpeningCdcId] = (0, import_react.useState)(null);
	const [subCategoryFilter, setSubCategoryFilter] = (0, import_react.useState)("");
	const [budgetFilter, setBudgetFilter] = (0, import_react.useState)("");
	const [locationFilter, setLocationFilter] = (0, import_react.useState)("");
	const subCategoryOptions = (useQuery({
		queryKey: ["categories"],
		queryFn: getCategories
	}).data ?? []).flatMap((category) => category.subCategories.map((sub) => ({
		id: sub.id,
		name: sub.name
	})));
	const [quoteTarget, setQuoteTarget] = (0, import_react.useState)(null);
	const [quoteAmount, setQuoteAmount] = (0, import_react.useState)("");
	const [detailsProject, setDetailsProject] = (0, import_react.useState)(null);
	const [loadingDetailsId, setLoadingDetailsId] = (0, import_react.useState)(null);
	async function handleViewProjectDetails(projectId) {
		setLoadingDetailsId(projectId);
		try {
			const project = await getProject(projectId);
			setDetailsProject(project);
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Impossible de charger les détails du projet.");
		} finally {
			setLoadingDetailsId(null);
		}
	}
	async function handleOpenCdc(opportunityId) {
		setOpeningCdcId(opportunityId);
		try {
			const { cdcUrl } = await getOpportunityCdc(opportunityId);
			if (!cdcUrl) {
				toast("Aucun CDC disponible pour cette opportunité.");
				return;
			}
			const url = cdcUrl.startsWith("http") ? cdcUrl : `${GATEWAY_URL}${cdcUrl}`;
			const blob = await fetchBlob(url);
			const objectUrl = URL.createObjectURL(blob);
			window.open(objectUrl, "_blank");
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Impossible d'ouvrir le CDC.");
		} finally {
			setOpeningCdcId(null);
		}
	}
	const opportunityTab = tabToOpportunityTab(activeTab);
	const opportunitiesQuery = useQuery({
		queryKey: [
			"agency",
			"opportunities",
			opportunityTab,
			page,
			subCategoryFilter,
			budgetFilter,
			locationFilter
		],
		queryFn: () => getOpportunities({
			tab: opportunityTab,
			page,
			pageSize: 20,
			...subCategoryFilter ? { subCategory: subCategoryFilter } : {},
			...budgetFilter ? { budget: budgetFilter } : {},
			...locationFilter ? { location: locationFilter } : {}
		})
	});
	const opportunities = opportunitiesQuery.data?.items ?? [];
	const isLoading = opportunitiesQuery.isLoading;
	const counts = opportunitiesQuery.data?.counts ?? {};
	const total = opportunitiesQuery.data?.total ?? null;
	const totalPages = opportunitiesQuery.data?.totalPages ?? null;
	const searchFilteredOpportunities = query.trim() ? opportunities.filter((opportunity) => `${opportunity.projectTitle} ${opportunity.companyName}`.toLowerCase().includes(query.trim().toLowerCase())) : opportunities;
	const filteredOpportunities = sortDirection === "old" ? [...searchFilteredOpportunities].reverse() : searchFilteredOpportunities;
	function invalidateOpportunities() {
		queryClient.invalidateQueries({ queryKey: ["agency", "opportunities"] });
	}
	const acceptMutation = useMutation({
		mutationFn: acceptOpportunity,
		onSuccess: () => {
			toast("Opportunité acceptée", { description: "Envoyez votre devis pour passer à l'étape suivante." });
			invalidateOpportunities();
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'accepter l'opportunité.");
		}
	});
	const expressInterestMutation = useMutation({
		mutationFn: expressInterest,
		onSuccess: () => {
			toast("Intérêt manifesté", { description: "Ce projet apparaît désormais dans vos offres — envoyez votre devis." });
			invalidateOpportunities();
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de manifester votre intérêt.");
		}
	});
	const refuseMutation = useMutation({
		mutationFn: refuseOpportunity,
		onSuccess: () => {
			toast("Opportunité refusée");
			invalidateOpportunities();
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de refuser l'opportunité.");
		}
	});
	const sendQuoteMutation = useMutation({
		mutationFn: ({ id, amount }) => sendQuote(id, amount),
		onSuccess: () => {
			toast("Devis envoyé", { description: "Le client a été notifié de votre proposition." });
			invalidateOpportunities();
			setQuoteTarget(null);
			setQuoteAmount("");
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Envoi du devis impossible.");
		}
	});
	const signalReadyMutation = useMutation({
		mutationFn: signalReady,
		onSuccess: () => {
			toast("Signalement envoyé", { description: "Le client a été notifié." });
			invalidateOpportunities();
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Endpoint indisponible pour le moment.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "agency",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-[1080px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, {
							className: "mt-1 h-[22px] w-[22px] shrink-0",
							strokeWidth: 1.6
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-[24px] font-bold tracking-tight",
								children: "Opportunités"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[14px] text-muted-foreground",
								children: "Répondez aux projets qui correspondent à vos compétences."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-7",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchInput, {
							value: query,
							onChange: setQuery,
							placeholder: "Rechercher une opportunité..."
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-1.5 block text-[13.5px] font-semibold",
								children: "Catégorie"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: subCategoryFilter,
								onChange: (event) => {
									setSubCategoryFilter(event.target.value);
									setPage(1);
								},
								className: "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Toutes les catégories"
								}), subCategoryOptions.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: option.id,
									children: option.name
								}, option.id))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-1.5 block text-[13.5px] font-semibold",
								children: "Budget"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: budgetFilter,
								onChange: (event) => {
									setBudgetFilter(event.target.value);
									setPage(1);
								},
								className: "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Tous les budgets"
								}), BUDGET_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: option.value,
									children: option.label
								}, option.value))]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-1.5 block text-[13.5px] font-semibold",
								children: "Localisation"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: locationFilter,
								onChange: (event) => {
									setLocationFilter(event.target.value);
									setPage(1);
								},
								placeholder: "Toutes les villes",
								className: "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary"
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-[14px] font-semibold",
							children: [total ?? 0, " opportunités"]
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
							columns: [
								{
									key: "opportunity",
									header: "Opportunité",
									width: "minmax(0,2.2fr)",
									render: (opportunity) => {
										const statusVisual = getOpportunityStatusVisual(opportunity, activeTab);
										const StatusIcon = statusVisual.icon;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex min-w-0 items-start gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusVisual.className}`,
												title: opportunity.stepLabel || opportunity.rawStatus || "Projet",
												"aria-label": opportunity.stepLabel || opportunity.rawStatus || "Projet",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, {
													className: "h-[18px] w-[18px]",
													strokeWidth: 1.8
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [activeTab === "available" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => void handleViewProjectDetails(opportunity.project ?? opportunity.id),
													disabled: loadingDetailsId === (opportunity.project ?? opportunity.id),
													className: "truncate text-left text-[13.5px] font-bold text-foreground underline-offset-2 hover:underline disabled:opacity-60",
													children: loadingDetailsId === (opportunity.project ?? opportunity.id) ? "Chargement..." : opportunity.projectTitle
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "truncate text-[13.5px] font-bold",
													children: opportunity.projectTitle
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "truncate text-[13px] text-muted-foreground",
													children: opportunity.companyName
												})]
											})]
										});
									}
								},
								{
									key: "category",
									header: "Catégorie",
									render: (opportunity) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[13px]",
										children: opportunity.category
									})
								},
								{
									key: "budget",
									header: "Budget",
									render: (opportunity) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[13px]",
										children: opportunity.budgetMin === null || opportunity.budgetMax === null ? "—" : `${opportunity.budgetMin} € - ${opportunity.budgetMax} €`
									})
								},
								{
									key: "location",
									header: "Localisation",
									render: (opportunity) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
											className: "h-3.5 w-3.5 shrink-0",
											strokeWidth: 1.7
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: opportunity.location
										})]
									})
								},
								{
									key: "step",
									header: "Étape",
									render: (opportunity) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: opportunity.stepLabel })
								},
								{
									key: "action",
									header: "Action",
									render: (opportunity) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap gap-2",
										children: [
											activeTab === "available" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => expressInterestMutation.mutate(opportunity.id),
												disabled: expressInterestMutation.isPending,
												className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Postuler"]
											}) : null,
											activeTab === "all" && isPendingAgencyDecision(opportunity) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => acceptMutation.mutate(opportunity.id),
												disabled: acceptMutation.isPending,
												className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Accepter"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => refuseMutation.mutate(opportunity.id),
												disabled: refuseMutation.isPending,
												className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:opacity-60",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Refuser"]
											})] }) : null,
											(activeTab === "all" || activeTab === "applied") && isAcceptedAwaitingQuote(opportunity) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													setQuoteTarget(opportunity);
													setQuoteAmount("");
												},
												className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Envoyer un devis"]
											}) : null,
											activeTab === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => signalReadyMutation.mutate(opportunity.id),
												disabled: signalReadyMutation.isPending,
												className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), "Signaler que je suis prêt"]
											}) : null,
											activeTab !== "available" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => void handleOpenCdc(opportunity.id),
												type: "button",
												disabled: openingCdcId === opportunity.id,
												className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
													className: "h-3.5 w-3.5",
													strokeWidth: 1.8
												}), openingCdcId === opportunity.id ? "Ouverture..." : "Consulter le CDC"]
											}) : null
										]
									})
								}
							],
							rows: filteredOpportunities,
							isLoading
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPagination, {
						page,
						totalPages,
						onPageChange: setPage
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: quoteTarget !== null,
				onOpenChange: (open) => {
					if (!open) {
						setQuoteTarget(null);
						setQuoteAmount("");
					}
				},
				title: "Envoyer un devis",
				...quoteTarget ? { description: `Proposez un montant pour "${quoteTarget.projectTitle}" — ${quoteTarget.companyName}.` } : {},
				confirmLabel: sendQuoteMutation.isPending ? "Envoi..." : "Envoyer le devis",
				onConfirm: () => {
					const amount = Number(quoteAmount);
					if (!quoteTarget || !quoteAmount.trim() || Number.isNaN(amount) || amount <= 0) {
						toast("Renseignez un montant valide.");
						return;
					}
					sendQuoteMutation.mutate({
						id: quoteTarget.id,
						amount
					});
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
					label: "Montant du devis (€)",
					type: "number",
					min: 0,
					value: quoteAmount,
					onChange: (event) => setQuoteAmount(event.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: detailsProject !== null,
				onOpenChange: (open) => {
					if (!open) setDetailsProject(null);
				},
				title: detailsProject?.title ?? "Détails du projet",
				confirmLabel: expressInterestMutation.isPending ? "Envoi..." : "Postuler",
				cancelLabel: "Fermer",
				onConfirm: () => {
					if (!detailsProject) return;
					expressInterestMutation.mutate(detailsProject.id);
					setDetailsProject(null);
				},
				children: detailsProject ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-[13.5px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-4 rounded-lg border border-border p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground",
								children: "Catégorie"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: detailsProject.category || "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground",
								children: "Sous-catégorie"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: detailsProject.subCategory || "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground",
								children: "Budget"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: detailsProject.budgetMin === null || detailsProject.budgetMax === null ? "—" : `${detailsProject.budgetMin} € - ${detailsProject.budgetMax} €`
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground",
								children: "Localisation"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: detailsProject.location || "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-muted-foreground",
								children: "Délai souhaité"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: detailsProject.deliveryDelayDays ? `${detailsProject.deliveryDelayDays} jours` : "—"
							})] })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] text-muted-foreground",
						children: "Description"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 whitespace-pre-wrap leading-[1.6]",
						children: detailsProject.description || detailsProject.objective || "—"
					})] })]
				}) : null
			})
		]
	});
}
//#endregion
export { AgencyOpportunitiesPage as component };
