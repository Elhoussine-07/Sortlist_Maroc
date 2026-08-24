import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $t as ArrowLeft, Bt as CalendarDays, E as ShieldAlert, Et as CircleX, K as MapPin, P as RefreshCcw, St as Clock, Y as Lock, _t as Download, b as Star, dt as FileText, ht as ExternalLink, i as Wallet, jt as CircleCheck } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as frappeCall, i as fetchBlob, n as GATEWAY_URL, r as camelizeKeys, t as ApiError } from "./http-BM0VI1yy.mjs";
import { i as getProject } from "./projects.service-BHaNpgMa.mjs";
import { l as getProjectShortlist, r as contactAgencies, t as EmptyState, u as listAgencyApplications, y as respondToAgencyApplication } from "./EmptyState-CjCsYQbe.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { i as SectionCard, l as TextAreaField, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { i as resumeProject, n as relaunchAgencySearch, r as requestSuspension, t as getDispute } from "./disputes.service-C_k2fHNI.mjs";
import { n as Route } from "./router-CW1fXXIG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.mes-projets_._id-6OANKvnn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function mapProposal(raw) {
	const data = camelizeKeys(raw);
	return {
		id: String(data["name"] ?? ""),
		agencyId: String(data["agency"] ?? ""),
		agencyName: String(data["agencyName"] ?? data["agency"] ?? ""),
		amount: Number(data["amount"] ?? 0),
		description: String(data["description"] ?? ""),
		submittedDate: data["submittedDate"] ?? null,
		responseDeadline: data["responseDeadline"] ?? null,
		extendedDeadline: data["extendedDeadline"] ?? null,
		devisFile: data["devisFile"] ?? null
	};
}
async function getPendingProposals(projectId) {
	const raw = await frappeCall("project.get_pending_proposals", { project: projectId });
	return Array.isArray(raw) ? raw.map(mapProposal) : [];
}
async function respondToQuote(proposalId, decision) {
	await frappeCall("project.respond_to_quote", {
		proposal: proposalId,
		decision
	});
}
function useNow(intervalMs = 6e4) {
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setNow(Date.now()), intervalMs);
		return () => window.clearInterval(id);
	}, [intervalMs]);
	return now;
}
function describeQuoteDeadline(proposal, now) {
	const responseDeadline = proposal.responseDeadline ? new Date(proposal.responseDeadline).getTime() : null;
	const extendedDeadline = proposal.extendedDeadline ? new Date(proposal.extendedDeadline).getTime() : null;
	const activeDeadline = responseDeadline !== null && now < responseDeadline ? {
		time: responseDeadline,
		prefix: ""
	} : extendedDeadline !== null && now < extendedDeadline ? {
		time: extendedDeadline,
		prefix: "Délai de rappel — "
	} : null;
	if (!activeDeadline) return {
		label: "Délai de réponse dépassé — en cours de vérification",
		expired: true,
		urgent: false
	};
	const diffMinutes = Math.max(0, Math.round((activeDeadline.time - now) / 6e4));
	const hours = Math.floor(diffMinutes / 60);
	const minutes = diffMinutes % 60;
	return {
		label: `${activeDeadline.prefix}${hours}h${minutes.toString().padStart(2, "0")} restantes pour répondre`,
		expired: false,
		urgent: diffMinutes <= 360
	};
}
function hashSeed(seed) {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}
function seedGradient(seed) {
	const hue = hashSeed(seed) % 360;
	return `linear-gradient(135deg, hsl(${hue} 72% 56%), hsl(${(hue + 42) % 360} 72% 44%))`;
}
function initialsOf(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
function formatBudget(min, max) {
	if (min === null && max === null) return "Non renseigné";
	if (min !== null && max !== null) return `${min} € - ${max} €`;
	return `${min ?? max} €`;
}
function ClientProjectDetailPage() {
	const { id } = Route.useParams();
	const queryClient = useQueryClient();
	const projectQuery = useQuery({
		queryKey: [
			"client",
			"project",
			id
		],
		queryFn: () => getProject(id)
	});
	const project = projectQuery.data ?? null;
	const isLoading = projectQuery.isPending;
	const [isOpeningCdc, setIsOpeningCdc] = (0, import_react.useState)(false);
	async function handleOpenCdc() {
		if (!project?.cdcFile) return;
		setIsOpeningCdc(true);
		try {
			const url = project.cdcFile.startsWith("http") ? project.cdcFile : `${GATEWAY_URL}${project.cdcFile}`;
			const blob = await fetchBlob(url);
			const objectUrl = URL.createObjectURL(blob);
			window.open(objectUrl, "_blank");
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Impossible d'ouvrir le CDC.");
		} finally {
			setIsOpeningCdc(false);
		}
	}
	const shortlistQuery = useQuery({
		queryKey: [
			"client",
			"project",
			id,
			"shortlist"
		],
		queryFn: () => getProjectShortlist(id),
		enabled: project !== null && (project.status === "published" || project.status === "awaiting")
	});
	const shortlist = shortlistQuery.data ?? [];
	const now = useNow();
	const pendingProposals = useQuery({
		queryKey: [
			"client",
			"project",
			id,
			"pending-proposals"
		],
		queryFn: () => getPendingProposals(id),
		enabled: project !== null && (project.status === "awaiting" || project.status === "published")
	}).data ?? [];
	const [downloadingProposalId, setDownloadingProposalId] = (0, import_react.useState)(null);
	async function handleDownloadDevis(proposal) {
		if (!proposal.devisFile) return;
		setDownloadingProposalId(proposal.id);
		try {
			const url = proposal.devisFile.startsWith("http") ? proposal.devisFile : `${GATEWAY_URL}${proposal.devisFile}`;
			const blob = await fetchBlob(url);
			const objectUrl = URL.createObjectURL(blob);
			window.open(objectUrl, "_blank");
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Impossible d'ouvrir le devis.");
		} finally {
			setDownloadingProposalId(null);
		}
	}
	const [respondingProposalId, setRespondingProposalId] = (0, import_react.useState)(null);
	const respondMutation = useMutation({
		mutationFn: ({ proposalId, decision }) => respondToQuote(proposalId, decision),
		onMutate: ({ proposalId }) => setRespondingProposalId(proposalId),
		onSuccess: (_data, variables) => {
			toast(variables.decision === "accept" ? "Devis accepté — le projet passe En cours." : "Devis refusé.");
			queryClient.invalidateQueries({ queryKey: [
				"client",
				"project",
				id
			] });
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer votre décision.");
		},
		onSettled: () => setRespondingProposalId(null)
	});
	const agencyApplications = useQuery({
		queryKey: [
			"client",
			"project",
			id,
			"agency-applications"
		],
		queryFn: () => listAgencyApplications(id),
		enabled: project !== null && (project.status === "published" || project.status === "awaiting")
	}).data ?? [];
	const [respondingApplicationId, setRespondingApplicationId] = (0, import_react.useState)(null);
	const respondToApplicationMutation = useMutation({
		mutationFn: ({ opportunityId, decision }) => respondToAgencyApplication(opportunityId, decision),
		onMutate: ({ opportunityId }) => setRespondingApplicationId(opportunityId),
		onSuccess: (_data, variables) => {
			toast(variables.decision === "accept" ? "Candidature acceptée — l'agence peut désormais envoyer un devis." : "Candidature refusée.");
			queryClient.invalidateQueries({ queryKey: [
				"client",
				"project",
				id
			] });
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer votre décision.");
		},
		onSettled: () => setRespondingApplicationId(null)
	});
	const [contactingAgencyId, setContactingAgencyId] = (0, import_react.useState)(null);
	const [contactedAgencyIds, setContactedAgencyIds] = (0, import_react.useState)([]);
	async function handleContactAgency(agencyId) {
		setContactingAgencyId(agencyId);
		try {
			await contactAgencies(id, [agencyId], void 0);
			setContactedAgencyIds((current) => [...current, agencyId]);
			toast("Demande envoyée à l'agence.");
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Envoi impossible.");
		} finally {
			setContactingAgencyId(null);
		}
	}
	const disputeQuery = useQuery({
		queryKey: [
			"client",
			"project",
			id,
			"dispute"
		],
		queryFn: () => getDispute(id),
		enabled: project !== null,
		retry: false
	});
	const dispute = disputeQuery.data && disputeQuery.data.status && disputeQuery.data.status.toLowerCase() !== "none" ? disputeQuery.data : null;
	const [isSuspensionModalOpen, setIsSuspensionModalOpen] = (0, import_react.useState)(false);
	const [suspensionReason, setSuspensionReason] = (0, import_react.useState)("");
	const [suspensionCategory, setSuspensionCategory] = (0, import_react.useState)("amicable");
	const suspensionMutation = useMutation({
		mutationFn: () => requestSuspension({
			projectId: id,
			reason: suspensionReason,
			category: suspensionCategory
		}),
		onSuccess: () => {
			toast("Demande de suspension envoyée.");
			setIsSuspensionModalOpen(false);
			setSuspensionReason("");
			queryClient.invalidateQueries({ queryKey: [
				"client",
				"project",
				id
			] });
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Envoi impossible.");
		}
	});
	const relaunchMutation = useMutation({
		mutationFn: () => relaunchAgencySearch(id),
		onSuccess: () => {
			toast("Recherche d'agence relancée.");
			queryClient.invalidateQueries({ queryKey: [
				"client",
				"project",
				id
			] });
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de relancer la recherche.");
		}
	});
	const resumeMutation = useMutation({
		mutationFn: () => resumeProject(id),
		onSuccess: () => {
			toast("Projet repris — la nouvelle date de fin prévue a été recalculée.");
			queryClient.invalidateQueries({ queryKey: [
				"client",
				"project",
				id
			] });
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de reprendre le projet.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "client",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-[1080px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/client/mes-projets",
						className: "inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-4 w-4",
							strokeWidth: 1.8
						}), "Retour à mes projets"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-5 rounded-lg border border-border p-6",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : project === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Projet introuvable." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-start gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
									className: "h-[22px] w-[22px]",
									strokeWidth: 1.7
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "font-display text-[24px] font-bold tracking-tight",
											children: project.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: project.statusLabel })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-[13.5px] text-muted-foreground",
										children: [
											project.category,
											project.subCategory ? ` — ${project.subCategory}` : "",
											" · ID ",
											project.reference
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex flex-wrap gap-x-6 gap-y-3 text-[13.5px]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
													className: "h-3.5 w-3.5 shrink-0 text-primary",
													strokeWidth: 1.8
												}), formatBudget(project.budgetMin, project.budgetMax)]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
													className: "h-3.5 w-3.5 shrink-0 text-primary",
													strokeWidth: 1.8
												}), project.location || "Non renseignée"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
													className: "h-3.5 w-3.5 shrink-0 text-primary",
													strokeWidth: 1.8
												}), project.deadline || "Délai non renseigné"]
											})
										]
									})
								]
							})]
						})
					}),
					project ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 space-y-6",
						children: [
							project.agencyId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
								title: "Agence",
								description: "L'agence qui travaille actuellement sur ce projet.",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex min-w-0 items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { backgroundImage: seedGradient(project.agencyId) },
											className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white",
											children: initialsOf(project.partnerAgencyName ?? "Agence")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "min-w-0 truncate text-[15px] font-bold",
											children: project.partnerAgencyName ?? "Agence partenaire"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/agences/$id",
										params: { id: project.agencyId },
										className: "flex shrink-0 items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent",
										children: ["Voir le profil", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
											className: "h-3.5 w-3.5",
											strokeWidth: 1.8
										})]
									})]
								})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
								title: "Cahier des charges",
								description: "Document généré à partir de votre brief.",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleOpenCdc,
											disabled: !project.cdcFile || isOpeningCdc,
											className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
												className: "h-4 w-4",
												strokeWidth: 1.8
											}), isOpeningCdc ? "Ouverture..." : "Ouvrir le CDC (PDF)"]
										}),
										project.locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
												className: "h-3.5 w-3.5 shrink-0",
												strokeWidth: 1.8
											}), "Verrouillé"]
										}) : null,
										!project.cdcFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[13px] text-muted-foreground",
											children: "Aucun CDC disponible pour ce projet."
										}) : null
									]
								})
							}),
							agencyApplications.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
								title: "Candidatures d'agences",
								description: "Ces agences ont postulé spontanément à votre projet — acceptez pour qu'elles puissent vous envoyer un devis.",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-4",
									children: agencyApplications.map((application) => {
										const isResponding = respondingApplicationId === application.id && respondToApplicationMutation.isPending;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
											className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex min-w-0 items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													style: { backgroundImage: seedGradient(application.agencyName) },
													className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white",
													children: initialsOf(application.agencyName)
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "min-w-0 truncate text-[15px] font-bold",
													children: application.agencyName
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													disabled: isResponding,
													onClick: () => respondToApplicationMutation.mutate({
														opportunityId: application.id,
														decision: "accept"
													}),
													className: "flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
														className: "h-3.5 w-3.5",
														strokeWidth: 1.8
													}), isResponding ? "..." : "Accepter"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													disabled: isResponding,
													onClick: () => respondToApplicationMutation.mutate({
														opportunityId: application.id,
														decision: "refuse"
													}),
													className: "flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
														className: "h-3.5 w-3.5",
														strokeWidth: 1.8
													}), "Refuser"]
												})]
											})]
										}, application.id);
									})
								})
							}) : null,
							pendingProposals.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
								title: "Devis reçus",
								description: "Chaque devis dispose de son propre délai de réponse (48h, puis +24h de rappel).",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-4",
									children: pendingProposals.map((proposal) => {
										const deadline = describeQuoteDeadline(proposal, now);
										const isResponding = respondingProposalId === proposal.id && respondMutation.isPending;
										const deadlineStyle = deadline.expired ? "bg-destructive/10 text-destructive" : deadline.urgent ? "bg-amber-500/10 text-amber-600" : "bg-accent text-foreground/80";
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
											className: "rounded-lg border border-border p-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-start justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex min-w-0 items-center gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															style: { backgroundImage: seedGradient(proposal.agencyName) },
															className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white",
															children: initialsOf(proposal.agencyName)
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "truncate text-[15px] font-bold",
																children: proposal.agencyName
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-0.5 text-[15px] font-semibold text-primary",
																children: [proposal.amount.toLocaleString("fr-FR"), " €"]
															})]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold " + deadlineStyle,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
															className: "h-3 w-3 shrink-0",
															strokeWidth: 2
														}), deadline.label]
													})]
												}),
												proposal.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-3 text-[13px] text-muted-foreground",
													children: proposal.description
												}) : null,
												proposal.devisFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-3 flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
															className: "h-4 w-4 shrink-0 text-muted-foreground",
															strokeWidth: 1.8
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "min-w-0 flex-1 truncate text-[13px] text-muted-foreground",
															children: "Devis détaillé — informations de l'agence, prestations, tarifs"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															type: "button",
															disabled: downloadingProposalId === proposal.id,
															onClick: () => void handleDownloadDevis(proposal),
															className: "flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
																className: "h-3.5 w-3.5",
																strokeWidth: 1.8
															}), downloadingProposalId === proposal.id ? "..." : "Télécharger le PDF"]
														})
													]
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-4 flex flex-wrap gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														disabled: isResponding || deadline.expired,
														onClick: () => respondMutation.mutate({
															proposalId: proposal.id,
															decision: "accept"
														}),
														className: "flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
															className: "h-3.5 w-3.5",
															strokeWidth: 1.8
														}), isResponding ? "..." : "Accepter"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														disabled: isResponding || deadline.expired,
														onClick: () => respondMutation.mutate({
															proposalId: proposal.id,
															decision: "refuse"
														}),
														className: "flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
															className: "h-3.5 w-3.5",
															strokeWidth: 1.8
														}), "Refuser"]
													})]
												})
											]
										}, proposal.id);
									})
								})
							}) : null,
							project.status === "published" || project.status === "awaiting" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
								title: "Shortlist d'agences recommandées",
								description: "Sélection générée par le matching IA pour ce projet.",
								children: shortlistQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : shortlist.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune agence recommandée pour le moment." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
									children: shortlist.map((agency) => {
										const isContacted = contactedAgencyIds.includes(agency.id);
										const scoreStyle = agency.matchingScore !== null && agency.matchingScore >= 80 ? "bg-emerald-500/10 text-emerald-600" : agency.matchingScore !== null && agency.matchingScore >= 50 ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground";
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
											className: "rounded-lg border border-border p-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex min-w-0 items-center gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															style: { backgroundImage: seedGradient(agency.id) },
															className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white",
															children: initialsOf(agency.name)
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "truncate text-[15px] font-bold",
																children: agency.name
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
																	className: "h-3.5 w-3.5 shrink-0",
																	strokeWidth: 1.8
																}), agency.location]
															})]
														})]
													}), agency.matchingScore !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold " + scoreStyle,
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
																className: "h-3 w-3 fill-current",
																strokeWidth: 0
															}),
															agency.matchingScore,
															"%"
														]
													}) : null]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-3 line-clamp-2 text-[13px] text-muted-foreground",
													children: agency.description
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-4 flex flex-wrap gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => handleContactAgency(agency.id),
														disabled: isContacted || contactingAgencyId === agency.id,
														className: "rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
														children: contactingAgencyId === agency.id ? "Envoi..." : isContacted ? "Envoyé" : "Envoyer"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
														to: "/agences/$id",
														params: { id: agency.id },
														className: "rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
														children: "Voir profil"
													})]
												})
											]
										}, agency.id);
									})
								})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
								title: "Suspension et litiges",
								description: "Suivi des suspensions ou litiges éventuels sur ce projet.",
								children: disputeQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : dispute ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: dispute.statusLabel }), dispute.status === "Validated" && dispute.category === "Suspension amiable" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => resumeMutation.mutate(),
										disabled: resumeMutation.isPending,
										className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, {
											className: "h-4 w-4",
											strokeWidth: 1.8
										}), resumeMutation.isPending ? "Reprise..." : "Reprendre"]
									}) : null]
								}), dispute.history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-[13.5px] text-muted-foreground",
									children: "Aucun historique disponible."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "relative mt-5 space-y-5 border-l border-border pl-5",
									children: dispute.history.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "relative",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[12.5px] text-muted-foreground",
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
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-3",
									children: [
										project.status === "in_progress" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setIsSuspensionModalOpen(true),
											className: "flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
												className: "h-4 w-4",
												strokeWidth: 1.8
											}), "Demander une suspension"]
										}) : null,
										project.status === "rejected" && project.rejectionSubstatus === "Agence défaillante" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => relaunchMutation.mutate(),
											disabled: relaunchMutation.isPending,
											className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, {
												className: "h-4 w-4",
												strokeWidth: 1.8
											}), relaunchMutation.isPending ? "Relance..." : "Relancer la recherche"]
										}) : null,
										project.status !== "in_progress" && !(project.status === "rejected" && project.rejectionSubstatus === "Agence défaillante") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[13.5px] text-muted-foreground",
											children: "Aucun litige ni suspension en cours sur ce projet."
										}) : null
									]
								})
							})
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: isSuspensionModalOpen,
				onOpenChange: setIsSuspensionModalOpen,
				title: "Demander une suspension",
				description: "Décrivez le motif de votre demande. Une suspension amiable est privilégiée avant l'ouverture d'un litige.",
				confirmLabel: suspensionMutation.isPending ? "Envoi..." : "Envoyer la demande",
				onConfirm: () => {
					if (!suspensionReason.trim()) {
						toast("Renseignez un motif avant d'envoyer.");
						return;
					}
					suspensionMutation.mutate();
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-[13px] font-semibold",
						htmlFor: "suspension-category",
						children: "Type de demande"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						id: "suspension-category",
						value: suspensionCategory,
						onChange: (event) => setSuspensionCategory(event.target.value),
						className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "amicable",
							children: "Suspension amiable"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "dispute",
							children: "Litige"
						})]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
						label: "Motif",
						rows: 4,
						value: suspensionReason,
						onChange: (event) => setSuspensionReason(event.target.value),
						placeholder: "Expliquez la raison de cette demande..."
					})]
				})
			})
		]
	});
}
//#endregion
export { ClientProjectDetailPage as component };
