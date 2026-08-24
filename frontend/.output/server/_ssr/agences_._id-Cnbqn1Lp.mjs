import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $t as ArrowLeft, Bt as CalendarDays, Ht as Building2, K as MapPin, L as Phone, O as Send, Xt as Award, a as Users, at as Image, b as Star, ct as Globe, q as Mail } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { f as listAgencyReviews, i as contactAgencyUnicast, o as getAgencyProfile, p as listFavoriteAgencies, s as getCategories, t as EmptyState, x as toggleFavoriteAgency } from "./EmptyState-CjCsYQbe.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { i as SectionCard, s as StatusBadge } from "./Blocks-CStVFDlw.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { o as trackProspectionSignal } from "./prospection.service--95GQsSM.mjs";
import { i as Route$27 } from "./router-CW1fXXIG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agences_._id-Cnbqn1Lp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TAB_ACTIONS = {
	apercu: "profile",
	portfolio: "portfolio",
	prestations: "services",
	certificats: "certifications",
	equipe: "team",
	avis: "reviews"
};
var TAB_ORDER = [
	{
		key: "apercu",
		label: "Aperçu"
	},
	{
		key: "portfolio",
		label: "Portfolio"
	},
	{
		key: "prestations",
		label: "Prestations"
	},
	{
		key: "certificats",
		label: "Certificats"
	},
	{
		key: "equipe",
		label: "Équipe"
	},
	{
		key: "avis",
		label: "Avis"
	}
];
function useTabbedProspectionTracking(agencyId, ready, countFor, clientEmail, clientName) {
	const [activeTab, setActiveTab] = (0, import_react.useState)("apercu");
	const activeTabRef = (0, import_react.useRef)("apercu");
	const enteredAtRef = (0, import_react.useRef)(Date.now());
	const initializedRef = (0, import_react.useRef)(false);
	const latestRef = (0, import_react.useRef)({
		countFor,
		clientEmail,
		clientName
	});
	latestRef.current = {
		countFor,
		clientEmail,
		clientName
	};
	function flush(tab) {
		const elapsed = Math.round((Date.now() - enteredAtRef.current) / 1e3);
		if (elapsed >= 1) trackProspectionSignal(agencyId, TAB_ACTIONS[tab], {
			durationSeconds: elapsed,
			count: latestRef.current.countFor(tab),
			clientEmail: latestRef.current.clientEmail,
			clientName: latestRef.current.clientName
		}).catch(() => {});
	}
	function trackClick(tab) {
		trackProspectionSignal(agencyId, TAB_ACTIONS[tab], {
			count: latestRef.current.countFor(tab),
			clientEmail: latestRef.current.clientEmail,
			clientName: latestRef.current.clientName
		}).catch(() => {});
	}
	(0, import_react.useEffect)(() => {
		if (!ready || !agencyId || initializedRef.current) return;
		initializedRef.current = true;
		enteredAtRef.current = Date.now();
		trackClick("apercu");
	}, [ready, agencyId]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (initializedRef.current) flush(activeTabRef.current);
		};
	}, []);
	function selectTab(tab) {
		if (tab === activeTabRef.current) return;
		flush(activeTabRef.current);
		trackClick(tab);
		activeTabRef.current = tab;
		enteredAtRef.current = Date.now();
		setActiveTab(tab);
	}
	return {
		activeTab,
		selectTab
	};
}
function PublicAgencyProfilePage() {
	const { id } = Route$27.useParams();
	const token = useAuthStore((state) => state.token);
	const authUser = useAuthStore((state) => state.user);
	const authRole = useAuthStore((state) => state.role);
	const clientEmail = authRole === "client" ? authUser?.email : void 0;
	const clientName = authRole === "client" ? authUser?.displayName : void 0;
	const [agency, setAgency] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [reviews, setReviews] = (0, import_react.useState)([]);
	const [isReviewsLoading, setIsReviewsLoading] = (0, import_react.useState)(true);
	const [isContactOpen, setIsContactOpen] = (0, import_react.useState)(false);
	const [isSubmittingContact, setIsSubmittingContact] = (0, import_react.useState)(false);
	const [contactForm, setContactForm] = (0, import_react.useState)({
		needType: "Projet",
		title: "",
		description: "",
		category: "",
		subCategory: "",
		budgetMin: "",
		budgetMax: "",
		location: "",
		deliveryDelayDays: ""
	});
	const [categories, setCategories] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getCategories().then(setCategories).catch(() => setCategories([]));
	}, []);
	const selectedCategorySubOptions = categories.find((cat) => cat.id === contactForm.category)?.subCategories ?? [];
	const [isFavorite, setIsFavorite] = (0, import_react.useState)(false);
	const [isTogglingFavorite, setIsTogglingFavorite] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setIsLoading(true);
		getAgencyProfile(id).then(setAgency).catch((error) => {
			toast(error instanceof ApiError ? error.message : "Impossible de charger cette agence.");
			setAgency(null);
		}).finally(() => setIsLoading(false));
		setIsReviewsLoading(true);
		listAgencyReviews(id).then(setReviews).catch(() => setReviews([])).finally(() => setIsReviewsLoading(false));
	}, [id]);
	(0, import_react.useEffect)(() => {
		if (!token || authRole !== "client") return;
		listFavoriteAgencies().then((favorites) => setIsFavorite(favorites.some((fav) => fav.agency === id))).catch(() => {});
	}, [
		id,
		token,
		authRole
	]);
	async function handleToggleFavorite() {
		if (!token) {
			window.location.href = "/connexion";
			return;
		}
		setIsTogglingFavorite(true);
		try {
			const result = await toggleFavoriteAgency(id);
			setIsFavorite(result.favorited);
			toast(result.favorited ? "Agence ajoutée à vos favoris" : "Agence retirée de vos favoris");
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Action impossible.");
		} finally {
			setIsTogglingFavorite(false);
		}
	}
	const portfolio = (agency?.portfolio ?? []).map((item, index) => ({
		id: item.id ?? String(index),
		title: item.title,
		status: item.status
	}));
	const team = agency?.team ?? [];
	const services = agency?.services ?? [];
	const certifications = agency?.certifications ?? [];
	function countFor(tab) {
		switch (tab) {
			case "portfolio": return portfolio.length;
			case "prestations": return services.length;
			case "certificats": return certifications.length;
			case "equipe": return team.length;
			case "avis": return reviews.length;
			default: return;
		}
	}
	const { activeTab, selectTab } = useTabbedProspectionTracking(id, !isLoading && agency !== null, countFor, clientEmail, clientName);
	const strongIntentSentRef = (0, import_react.useRef)(false);
	function trackStrongIntentClick() {
		if (strongIntentSentRef.current) return;
		strongIntentSentRef.current = true;
		trackProspectionSignal(id, "favorite", {
			clientEmail,
			clientName
		}).catch(() => {});
	}
	function openContactModal() {
		trackStrongIntentClick();
		if (!token) {
			window.location.href = "/connexion";
			return;
		}
		setIsContactOpen(true);
	}
	async function handleSubmitContact() {
		if (!contactForm.description.trim()) {
			toast("Décrivez votre besoin avant d'envoyer.");
			return;
		}
		setIsSubmittingContact(true);
		try {
			await contactAgencyUnicast(id, {
				needType: contactForm.needType,
				description: contactForm.description,
				...contactForm.title ? { title: contactForm.title } : {},
				...contactForm.category ? { category: contactForm.category } : {},
				...contactForm.subCategory ? { subCategory: contactForm.subCategory } : {},
				...contactForm.budgetMin ? { budgetMin: Number(contactForm.budgetMin) } : {},
				...contactForm.budgetMax ? { budgetMax: Number(contactForm.budgetMax) } : {},
				...contactForm.location ? { location: contactForm.location } : {},
				...contactForm.deliveryDelayDays ? { deliveryDelayDays: Number(contactForm.deliveryDelayDays) } : {}
			});
			toast(contactForm.needType === "Projet" ? "Votre demande a été envoyée à l'agence, avec le cahier des charges généré à partir de vos informations." : "Votre demande a été envoyée à l'agence.");
			setIsContactOpen(false);
			setContactForm({
				needType: "Projet",
				title: "",
				description: "",
				category: "",
				subCategory: "",
				budgetMin: "",
				budgetMax: "",
				location: "",
				deliveryDelayDays: ""
			});
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Envoi impossible.");
		} finally {
			setIsSubmittingContact(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, {
				variant: "search",
				active: "agencies"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-[1080px] px-4 pb-20 sm:px-6 lg:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/agences",
						className: "mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-4 w-4",
							strokeWidth: 1.8
						}), "Retour aux agences"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-5 rounded-lg border border-border p-6",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : agency === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune donnée disponible pour cette agence." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-[68px] w-[68px] items-center justify-center rounded-lg border border-border text-[24px] font-bold",
									children: agency.logoText
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "text-[26px] font-bold leading-tight tracking-tight",
											children: agency.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
														className: "h-4 w-4 shrink-0",
														strokeWidth: 1.7
													}), agency.location]
												}),
												agency.foundedYear ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
															className: "h-4 w-4 shrink-0",
															strokeWidth: 1.7
														}),
														"Depuis ",
														agency.foundedYear
													]
												}) : null,
												agency.teamSize ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
														className: "h-4 w-4 shrink-0",
														strokeWidth: 1.7
													}), agency.teamSize]
												}) : null
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-3 flex items-center gap-2 text-[14px] font-semibold",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
													className: "h-4 w-4 fill-current",
													strokeWidth: 0
												}),
												agency.rating,
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-normal text-muted-foreground",
													children: [
														"(",
														agency.reviewsCount,
														" avis)"
													]
												}),
												agency.legalIdValid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: "Identifiant légal vérifié" }) : null
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-4 max-w-[62ch] text-[15px] leading-[1.6] text-muted-foreground",
											children: agency.description
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2 sm:w-[190px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: openContactModal,
											className: "rounded-md bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
											children: "Contacter l'agence"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/postuler-un-projet",
											onClick: trackStrongIntentClick,
											className: "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-[14px] font-semibold transition-colors hover:bg-accent",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
												className: "h-4 w-4",
												strokeWidth: 1.8
											}), "Postuler un projet"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleToggleFavorite,
											disabled: isTogglingFavorite,
											className: "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-[14px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
												className: "h-4 w-4",
												strokeWidth: 1.8,
												fill: isFavorite ? "currentColor" : "none"
											}), isFavorite ? "Dans vos favoris" : "Ajouter aux favoris"]
										})
									]
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5 border-b border-border pb-3",
							children: TAB_ORDER.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => selectTab(tab.key),
								className: `rounded-md px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`,
								children: tab.label
							}, tab.key))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6",
							children: [
								activeTab === "apercu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
									title: "Compétences et technologies",
									description: "Domaines d'expertise déclarés par l'agence.",
									children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : agency === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune donnée disponible" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[13px] text-muted-foreground",
												children: "Compétences"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 flex flex-wrap gap-2",
												children: (agency.skills ?? []).map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: skill }, skill))
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[13px] text-muted-foreground",
												children: "Technologies"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 flex flex-wrap gap-2",
												children: (agency.techStack ?? []).map((tech) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: tech }, tech))
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[13px] text-muted-foreground",
												children: "Langues"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 flex flex-wrap gap-2",
												children: (agency.languages ?? []).map((language) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: language }, language))
											})] })
										]
									})
								}) : null,
								activeTab === "portfolio" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
									title: "Portfolio",
									description: "Réalisations publiées par l'agence.",
									children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : portfolio.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune réalisation à afficher." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
										children: portfolio.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "rounded-lg border border-border p-4 transition-colors hover:bg-accent",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
													className: "h-[18px] w-[18px]",
													strokeWidth: 1.6
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-3 text-[14px] font-bold",
													children: item.title
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[13px] text-muted-foreground",
													children: item.status
												})
											]
										}, item.id))
									})
								}) : null,
								activeTab === "prestations" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
									title: "Prestations",
									description: "Services proposés par l'agence (CDC §2.2.2).",
									children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : services.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune prestation renseignée." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
										children: services.map((service, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "rounded-lg border border-border p-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[14px] font-bold",
													children: service.serviceName
												}),
												service.priceRange ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[13px] text-muted-foreground",
													children: service.priceRange
												}) : null,
												service.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1.5 text-[13.5px] leading-[1.5] text-muted-foreground",
													children: service.description
												}) : null
											]
										}, index))
									})
								}) : null,
								activeTab === "certificats" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
									title: "Certificats",
									description: "Certifications mises en avant par l'agence (CDC §2.2.5).",
									children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : certifications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun certificat renseigné." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
										children: certifications.map((cert, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-3 rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, {
												className: "mt-0.5 h-[18px] w-[18px] shrink-0",
												strokeWidth: 1.6
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[14px] font-bold",
														children: cert.title
													}),
													cert.issuingOrganization ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[13px] text-muted-foreground",
														children: [cert.issuingOrganization, cert.level ? ` · ${cert.level}` : ""]
													}) : null,
													cert.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1.5 text-[13.5px] leading-[1.5] text-muted-foreground",
														children: cert.description
													}) : null
												]
											})]
										}, index))
									})
								}) : null,
								activeTab === "equipe" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
									title: "Équipe",
									description: "Membres de l'agence mis en avant publiquement.",
									children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : team.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun membre d'équipe renseigné." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
										children: team.map((member, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-3 rounded-lg border border-border p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-[13px] font-bold",
												children: member.member?.slice(0, 2).toUpperCase()
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[14px] font-bold",
													children: member.member
												}), member.role ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[13px] text-muted-foreground",
													children: member.role
												}) : null]
											})]
										}, index))
									})
								}) : null,
								activeTab === "avis" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
									title: "Avis clients",
									description: "Retours des clients ayant collaboré avec l'agence.",
									children: isReviewsLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : reviews.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun avis à afficher." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "divide-y divide-border",
										children: reviews.map((review) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
											className: "py-4 first:pt-0 last:pb-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-[13px] font-bold",
													children: review.authorInitials
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[14px] font-bold",
															children: review.authorName
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
																	className: "h-3.5 w-3.5 fill-current",
																	strokeWidth: 0
																}),
																review.rating,
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "font-normal text-muted-foreground",
																	children: ["· ", review.publishedAt]
																})
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "mt-2 text-[14px] leading-[1.6] text-muted-foreground",
															children: review.comment
														})
													]
												})]
											})
										}, review.id))
									})
								}) : null
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
							className: "lg:sticky lg:top-6 lg:self-start",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionCard, {
								title: "Coordonnées",
								description: "Informations de contact publiques.",
								children: [isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : agency === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune donnée disponible" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "space-y-3 text-[14px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
												className: "mt-0.5 h-4 w-4 shrink-0",
												strokeWidth: 1.7
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 break-words",
												children: agency.address
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
												className: "mt-0.5 h-4 w-4 shrink-0",
												strokeWidth: 1.7
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0 break-words",
												children: [
													agency.phoneCountryCode,
													" ",
													agency.phone
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
												className: "mt-0.5 h-4 w-4 shrink-0",
												strokeWidth: 1.7
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 break-words",
												children: agency.email
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, {
												className: "mt-0.5 h-4 w-4 shrink-0",
												strokeWidth: 1.7
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 break-words",
												children: agency.website
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, {
												className: "mt-0.5 h-4 w-4 shrink-0",
												strokeWidth: 1.7
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0",
												children: ["Travail à distance : ", agency.remoteWork ? "Oui" : "Non"]
											})]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-4 text-[13px] text-muted-foreground",
									children: ["Référence agence : ", id]
								})]
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: isContactOpen,
				onOpenChange: setIsContactOpen,
				title: "Contacter l'agence",
				description: contactForm.needType === "Projet" ? "Flux Unicast : renseignez votre besoin, le cahier des charges (CDC) est généré automatiquement et envoyé uniquement à cette agence." : "Flux Unicast : votre demande sera envoyée uniquement à cette agence.",
				confirmLabel: isSubmittingContact ? "Envoi..." : "Envoyer",
				onConfirm: handleSubmitContact,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-[60vh] space-y-4 overflow-y-auto pr-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[13px] font-semibold",
							htmlFor: "contact-need-type",
							children: "Type de besoin"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							id: "contact-need-type",
							value: contactForm.needType,
							onChange: (event) => setContactForm((prev) => ({
								...prev,
								needType: event.target.value
							})),
							className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Projet",
									children: "Projet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Stage",
									children: "Stage"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Job",
									children: "Job"
								})
							]
						})] }),
						contactForm.needType === "Projet" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[13px] font-semibold",
							htmlFor: "contact-title",
							children: "Titre du projet"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "contact-title",
							type: "text",
							value: contactForm.title,
							onChange: (event) => setContactForm((prev) => ({
								...prev,
								title: event.target.value
							})),
							className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none",
							placeholder: "Ex. Refonte de notre site vitrine"
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[13px] font-semibold",
							htmlFor: "contact-description",
							children: "Décrivez votre besoin"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							id: "contact-description",
							value: contactForm.description,
							onChange: (event) => setContactForm((prev) => ({
								...prev,
								description: event.target.value
							})),
							rows: 4,
							className: "mt-1.5 w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none",
							placeholder: "Contexte, objectifs, contraintes..."
						})] }),
						contactForm.needType === "Projet" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[13px] font-semibold",
									htmlFor: "contact-category",
									children: "Catégorie"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									id: "contact-category",
									value: contactForm.category,
									onChange: (event) => setContactForm((prev) => ({
										...prev,
										category: event.target.value,
										subCategory: ""
									})),
									className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Sélectionner..."
									}), categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: cat.id,
										children: cat.name
									}, cat.id))]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[13px] font-semibold",
									htmlFor: "contact-sub-category",
									children: "Sous-catégorie"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									id: "contact-sub-category",
									value: contactForm.subCategory,
									onChange: (event) => setContactForm((prev) => ({
										...prev,
										subCategory: event.target.value
									})),
									disabled: selectedCategorySubOptions.length === 0,
									className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none disabled:cursor-not-allowed disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Sélectionner..."
									}), selectedCategorySubOptions.map((sub) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: sub.id,
										children: sub.name
									}, sub.id))]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[13px] font-semibold",
									htmlFor: "contact-budget-min",
									children: "Budget min (€)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "contact-budget-min",
									type: "number",
									min: "0",
									value: contactForm.budgetMin,
									onChange: (event) => setContactForm((prev) => ({
										...prev,
										budgetMin: event.target.value
									})),
									className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[13px] font-semibold",
									htmlFor: "contact-budget-max",
									children: "Budget max (€)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "contact-budget-max",
									type: "number",
									min: "0",
									value: contactForm.budgetMax,
									onChange: (event) => setContactForm((prev) => ({
										...prev,
										budgetMax: event.target.value
									})),
									className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[13px] font-semibold",
									htmlFor: "contact-location",
									children: "Localisation"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "contact-location",
									type: "text",
									value: contactForm.location,
									onChange: (event) => setContactForm((prev) => ({
										...prev,
										location: event.target.value
									})),
									className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none",
									placeholder: "Ex. Casablanca, à distance..."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[13px] font-semibold",
									htmlFor: "contact-delay",
									children: "Délai souhaité (jours)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "contact-delay",
									type: "number",
									min: "0",
									value: contactForm.deliveryDelayDays,
									onChange: (event) => setContactForm((prev) => ({
										...prev,
										deliveryDelayDays: event.target.value
									})),
									className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none"
								})] })]
							})
						] }) : null
					]
				})
			})
		]
	});
}
//#endregion
export { PublicAgencyProfilePage as component };
