import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { F as Plus, Ft as Check, X as LoaderCircle, at as Image, b as Star, d as Upload, h as Trash2, n as X } from "../_libs/lucide-react.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { d as listAgencyMembers, f as listAgencyReviews, t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { i as SectionCard, l as TextAreaField, s as StatusBadge, t as FormSkeleton, u as TextField } from "./Blocks-CStVFDlw.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { a as updateAgencyProfile, c as uploadFile, t as getAgencyProfile } from "./profile.service-C-cGw1M0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agence.profil-CXbrtqWn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAX_IMAGE_SIZE_BYTES = 4194304;
var EMPTY_SERVICE = {
	serviceName: "",
	description: "",
	priceRange: "",
	techStack: "",
	skills: "",
	projectsInProgress: 0
};
var EMPTY_PORTFOLIO_ITEM = {
	title: "",
	status: "In Progress",
	image: "",
	videoUrl: "",
	resultUrl: "",
	budget: null,
	collaborationPeriod: "",
	agencyFeedback: "",
	problemSolution: "",
	clientConfirmed: false
};
var EMPTY_TEAM_ITEM = {
	member: "",
	photo: "",
	role: "",
	description: "",
	history: "",
	linkedinUrl: ""
};
var EMPTY_CERTIFICATION = {
	photo: "",
	title: "",
	description: "",
	issuingOrganization: "",
	level: "Foundation"
};
function servicesToPayload(items) {
	return items.filter((item) => item.serviceName.trim().length > 0).map((item) => ({
		service_name: item.serviceName,
		description: item.description,
		price_range: item.priceRange,
		tech_stack: item.techStack,
		skills: item.skills,
		projects_in_progress: item.projectsInProgress
	}));
}
function portfolioToPayload(items) {
	return items.filter((item) => item.title.trim().length > 0).map((item) => ({
		title: item.title,
		status: item.status,
		image: item.image,
		video_url: item.videoUrl,
		result_url: item.resultUrl,
		budget: item.budget,
		collaboration_period: item.collaborationPeriod,
		agency_feedback: item.agencyFeedback,
		problem_solution: item.problemSolution,
		client_confirmed: item.clientConfirmed ? 1 : 0
	}));
}
function teamToPayload(items) {
	return items.filter((item) => item.member.trim().length > 0).map((item) => ({
		member: item.member,
		photo: item.photo,
		role: item.role,
		description: item.description,
		history: item.history,
		linkedin_url: item.linkedinUrl
	}));
}
function certificationsToPayload(items) {
	return items.filter((item) => item.title.trim().length > 0).map((item) => ({
		photo: item.photo,
		title: item.title,
		description: item.description,
		issuing_organization: item.issuingOrganization,
		level: item.level
	}));
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
function ImageUploader({ value, onChange, label = "Image" }) {
	const [isUploading, setIsUploading] = (0, import_react.useState)(false);
	async function handleFileChange(event) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Le fichier doit être une image (PNG, JPG, SVG...).");
			return;
		}
		if (file.size > MAX_IMAGE_SIZE_BYTES) {
			toast.error("Image trop lourde (4 Mo maximum).");
			return;
		}
		try {
			setIsUploading(true);
			onChange(await uploadFile(file));
			toast.success("Image téléversée avec succès.");
		} catch {
			toast.error("Échec du téléversement de l'image.");
		} finally {
			setIsUploading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[13px] font-semibold text-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-4",
			children: [value ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: value,
					alt: "Aperçu",
					className: "h-full w-full object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onChange(""),
					className: "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-destructive hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-accent/50 text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-6 w-6 stroke-[1.5]" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
				children: [
					isUploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-4 w-4" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: value ? "Changer" : "Téléverser" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "file",
						accept: "image/*",
						className: "hidden",
						onChange: handleFileChange,
						disabled: isUploading
					})
				]
			})]
		})]
	});
}
function ItemCardHeader({ label, onRemove }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-1 flex items-center justify-between sm:col-span-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onRemove,
			"aria-label": "Retirer",
			className: "flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
				className: "h-3.5 w-3.5",
				strokeWidth: 1.8
			})
		})]
	});
}
function SaveButton({ onClick, isPending, pendingLabel, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		disabled: isPending,
		className: "flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
		children: [isPending ? pendingLabel : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
			className: "h-3.5 w-3.5",
			strokeWidth: 2
		}), !isPending ? label : null]
	});
}
var profileSchema = objectType({
	name: stringType().trim().min(1, "Champ requis").max(120),
	description: stringType().trim().min(1, "Champ requis").max(2e3),
	foundedYear: stringType().trim().min(4, "Année invalide").max(4),
	teamSize: stringType().trim().min(1, "Champ requis").max(40),
	website: stringType().trim().url("URL invalide").max(255),
	location: stringType().trim().min(1, "Champ requis").max(120),
	legalIdValue: stringType().trim().min(1, "Champ requis").max(80),
	phoneCountryCode: stringType().trim().min(1, "Champ requis").max(6),
	phone: stringType().trim().min(1, "Champ requis").max(30),
	email: stringType().trim().email("E-mail invalide").max(255),
	address: stringType().trim().min(1, "Champ requis").max(255),
	logo: stringType().optional(),
	coverImage: stringType().optional()
});
function AgencyProfilePage() {
	const queryClient = useQueryClient();
	const profileQuery = useQuery({
		queryKey: ["agency", "profile"],
		queryFn: getAgencyProfile
	});
	const profile = profileQuery.data ?? null;
	const isLoading = profileQuery.isLoading;
	const form = useForm({
		resolver: u(profileSchema),
		defaultValues: {
			name: "",
			description: "",
			foundedYear: "",
			teamSize: "",
			website: "",
			location: "",
			legalIdValue: "",
			phoneCountryCode: "",
			phone: "",
			email: "",
			address: "",
			logo: "",
			coverImage: ""
		}
	});
	(0, import_react.useEffect)(() => {
		if (!profile) return;
		form.reset({
			name: profile.name ?? "",
			description: profile.description ?? "",
			foundedYear: profile.foundedYear ? String(profile.foundedYear) : "",
			teamSize: profile.teamSize ? String(profile.teamSize) : "",
			website: profile.website ?? "",
			location: profile.location ?? "",
			legalIdValue: profile.legalIdValue ?? "",
			phoneCountryCode: profile.phoneCountryCode ?? "",
			phone: profile.phone ?? "",
			email: profile.email ?? "",
			address: profile.address ?? "",
			logo: profile.logo ?? "",
			coverImage: profile.coverImage ?? ""
		});
	}, [profile, form]);
	const updateMutation = useMutation({
		mutationFn: (values) => updateAgencyProfile({
			...values,
			year_founded: values.foundedYear ? parseInt(values.foundedYear, 10) : void 0,
			team_size: values.teamSize ? parseInt(values.teamSize, 10) : void 0,
			legal_id: values.legalIdValue,
			cover_image: values.coverImage
		}),
		onSuccess: (updated) => {
			queryClient.setQueryData(["agency", "profile"], updated);
			toast.success("Profil mis à jour");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
		}
	});
	const onSubmit = form.handleSubmit((values) => {
		updateMutation.mutate(values);
	});
	const [services, setServices] = (0, import_react.useState)([]);
	const [portfolioItems, setPortfolioItems] = (0, import_react.useState)([]);
	const [team, setTeam] = (0, import_react.useState)([]);
	const [certifications, setCertifications] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!profile) return;
		setServices(profile.services ?? []);
		setPortfolioItems(profile.portfolio ?? []);
		setTeam(profile.team ?? []);
		setCertifications(profile.certifications ?? []);
	}, [profile]);
	const membersQuery = useQuery({
		queryKey: ["agency", "members"],
		queryFn: listAgencyMembers
	});
	const reviewsQuery = useQuery({
		queryKey: [
			"agency",
			"profile",
			"reviews",
			profile?.id
		],
		queryFn: () => listAgencyReviews(profile.id),
		enabled: Boolean(profile?.id)
	});
	const servicesMutation = useMutation({
		mutationFn: () => updateAgencyProfile({ services: servicesToPayload(services) }),
		onSuccess: (updated) => {
			queryClient.setQueryData(["agency", "profile"], updated);
			toast.success("Prestations mises à jour");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
		}
	});
	const portfolioMutation = useMutation({
		mutationFn: () => updateAgencyProfile({ portfolio: portfolioToPayload(portfolioItems) }),
		onSuccess: (updated) => {
			queryClient.setQueryData(["agency", "profile"], updated);
			toast.success("Portfolio mis à jour");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
		}
	});
	const teamMutation = useMutation({
		mutationFn: () => updateAgencyProfile({ team: teamToPayload(team) }),
		onSuccess: (updated) => {
			queryClient.setQueryData(["agency", "profile"], updated);
			toast.success("Équipe mise à jour");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
		}
	});
	const certificationsMutation = useMutation({
		mutationFn: () => updateAgencyProfile({ certifications: certificationsToPayload(certifications) }),
		onSuccess: (updated) => {
			queryClient.setQueryData(["agency", "profile"], updated);
			toast.success("Certificats mis à jour");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Mise à jour impossible.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "agency",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px] space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-[24px] font-bold tracking-tight",
					children: "Profil agence"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[14px] text-muted-foreground",
					children: "Ces informations composent votre profil public sur la plateforme."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Présentation",
					description: "Logo, bannière, nom, description, année de création et taille de l'équipe.",
					action: profile?.legalIdValid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: "Identifiant légal vérifié" }) : null,
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSkeleton, { fields: 6 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit,
						className: "space-y-5",
						noValidate: true,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-5 rounded-lg border border-border/60 bg-accent/20 p-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
									label: "Logo de l'agence",
									value: form.watch("logo"),
									onChange: (url) => form.setValue("logo", url, { shouldDirty: true })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
									label: "Image de couverture (Bannière)",
									value: form.watch("coverImage"),
									onChange: (url) => form.setValue("coverImage", url, { shouldDirty: true })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-5 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Nom de l'agence",
										error: form.formState.errors.name?.message,
										...form.register("name")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Année de création",
										error: form.formState.errors.foundedYear?.message,
										...form.register("foundedYear")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Taille de l'équipe",
										error: form.formState.errors.teamSize?.message,
										...form.register("teamSize")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Site web",
										error: form.formState.errors.website?.message,
										...form.register("website")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Localisation",
										error: form.formState.errors.location?.message,
										...form.register("location")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Numéro d'identification légal",
										error: form.formState.errors.legalIdValue?.message,
										...form.register("legalIdValue")
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
								label: "Description de l'agence",
								rows: 5,
								error: form.formState.errors.description?.message,
								...form.register("description")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "pt-2 text-[13px] font-bold tracking-wide text-muted-foreground",
								children: "COORDONNÉES"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-5 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Indicatif pays",
										error: form.formState.errors.phoneCountryCode?.message,
										...form.register("phoneCountryCode")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Téléphone",
										error: form.formState.errors.phone?.message,
										...form.register("phone")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "E-mail",
										error: form.formState.errors.email?.message,
										...form.register("email")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Adresse",
										error: form.formState.errors.address?.message,
										...form.register("address")
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: updateMutation.isPending,
								className: "flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
								children: [updateMutation.isPending ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "h-3.5 w-3.5",
									strokeWidth: 2
								}), updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Prestations (Services)",
					description: "Services proposés, utilisés pour le matching avec les projets clients.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setServices((current) => [...current, { ...EMPTY_SERVICE }]),
						className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}), "Ajouter un service"]
					}),
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							services.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun service renseigné." }) : null,
							services.map((service, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemCardHeader, {
										label: service.serviceName || `Service ${index + 1}`,
										onRemove: () => setServices((current) => current.filter((_, i) => i !== index))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Nom du service",
										value: service.serviceName,
										onChange: (event) => setServices((current) => current.map((row, i) => i === index ? {
											...row,
											serviceName: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Fourchette de prix",
										value: service.priceRange,
										onChange: (event) => setServices((current) => current.map((row, i) => i === index ? {
											...row,
											priceRange: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Stack technique",
										value: service.techStack,
										onChange: (event) => setServices((current) => current.map((row, i) => i === index ? {
											...row,
											techStack: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Compétences",
										value: service.skills,
										onChange: (event) => setServices((current) => current.map((row, i) => i === index ? {
											...row,
											skills: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sm:col-span-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
											label: "Description",
											rows: 3,
											value: service.description,
											onChange: (event) => setServices((current) => current.map((row, i) => i === index ? {
												...row,
												description: event.target.value
											} : row))
										})
									})
								]
							}, index)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, {
								onClick: () => servicesMutation.mutate(),
								isPending: servicesMutation.isPending,
								pendingLabel: "Enregistrement...",
								label: "Enregistrer les services"
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Portfolio",
					description: "Réalisations présentées aux clients.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setPortfolioItems((current) => [...current, { ...EMPTY_PORTFOLIO_ITEM }]),
						className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}), "Ajouter"]
					}),
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							portfolioItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune réalisation renseignée." }) : null,
							portfolioItems.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemCardHeader, {
										label: item.title || `Réalisation ${index + 1}`,
										onRemove: () => setPortfolioItems((current) => current.filter((_, i) => i !== index))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sm:col-span-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
											label: "Image d'illustration du projet",
											value: item.image,
											onChange: (url) => setPortfolioItems((current) => current.map((row, i) => i === index ? {
												...row,
												image: url
											} : row))
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Titre",
										value: item.title,
										onChange: (event) => setPortfolioItems((current) => current.map((row, i) => i === index ? {
											...row,
											title: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Période de collaboration",
										value: item.collaborationPeriod,
										onChange: (event) => setPortfolioItems((current) => current.map((row, i) => i === index ? {
											...row,
											collaborationPeriod: event.target.value
										} : row))
									})
								]
							}, index)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, {
								onClick: () => portfolioMutation.mutate(),
								isPending: portfolioMutation.isPending,
								pendingLabel: "Enregistrement...",
								label: "Enregistrer le portfolio"
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Staff (équipe)",
					description: "Membres de l'agence affichés sur le profil public.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setTeam((current) => [...current, { ...EMPTY_TEAM_ITEM }]),
						className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}), "Ajouter un membre"]
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							team.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun membre renseigné." }) : null,
							team.map((member, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemCardHeader, {
										label: member.role || `Membre ${index + 1}`,
										onRemove: () => setTeam((current) => current.filter((_, i) => i !== index))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sm:col-span-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
											label: "Photo de profil",
											value: member.photo,
											onChange: (url) => setTeam((current) => current.map((row, i) => i === index ? {
												...row,
												photo: url
											} : row))
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[13px] font-semibold",
										children: "Collaborateur"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: member.member,
										onChange: (event) => setTeam((current) => current.map((row, i) => i === index ? {
											...row,
											member: event.target.value
										} : row)),
										className: "mt-1.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13.5px] outline-none",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Sélectionner un membre"
										}), (membersQuery.data ?? []).map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: option.id,
											children: [
												option.user,
												" (",
												option.role,
												")"
											]
										}, option.id))]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Rôle affiché",
										value: member.role,
										onChange: (event) => setTeam((current) => current.map((row, i) => i === index ? {
											...row,
											role: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sm:col-span-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
											label: "Description",
											rows: 2,
											value: member.description,
											onChange: (event) => setTeam((current) => current.map((row, i) => i === index ? {
												...row,
												description: event.target.value
											} : row))
										})
									})
								]
							}, index)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, {
								onClick: () => teamMutation.mutate(),
								isPending: teamMutation.isPending,
								pendingLabel: "Enregistrement...",
								label: "Enregistrer l'équipe"
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Certificats",
					description: "Certifications mises en avant sur le profil public.",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setCertifications((current) => [...current, { ...EMPTY_CERTIFICATION }]),
						className: "flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}), "Ajouter un certificat"]
					}),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							certifications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun certificat renseigné." }) : null,
							certifications.map((cert, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemCardHeader, {
										label: cert.title || `Certificat ${index + 1}`,
										onRemove: () => setCertifications((current) => current.filter((_, i) => i !== index))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sm:col-span-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
											label: "Image / Logo du certificat",
											value: cert.photo,
											onChange: (url) => setCertifications((current) => current.map((row, i) => i === index ? {
												...row,
												photo: url
											} : row))
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Titre",
										value: cert.title,
										onChange: (event) => setCertifications((current) => current.map((row, i) => i === index ? {
											...row,
											title: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Organisme émetteur",
										value: cert.issuingOrganization,
										onChange: (event) => setCertifications((current) => current.map((row, i) => i === index ? {
											...row,
											issuingOrganization: event.target.value
										} : row))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sm:col-span-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
											label: "Description",
											rows: 2,
											value: cert.description,
											onChange: (event) => setCertifications((current) => current.map((row, i) => i === index ? {
												...row,
												description: event.target.value
											} : row))
										})
									})
								]
							}, index)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveButton, {
								onClick: () => certificationsMutation.mutate(),
								isPending: certificationsMutation.isPending,
								pendingLabel: "Enregistrement...",
								label: "Enregistrer les certificats"
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Avis",
					description: "Avis déposés par vos clients sur des projets terminés.",
					children: reviewsQuery.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 2 }) : (reviewsQuery.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucun avis pour le moment." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-4",
						children: (reviewsQuery.data ?? []).map((review) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg border border-border p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { backgroundImage: seedGradient(review.authorName) },
										className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
										children: initialsOf(review.authorName)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-1.5 text-[13.5px] font-bold",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
												className: "h-3.5 w-3.5 fill-primary text-primary",
												strokeWidth: 0
											}),
											review.rating,
											"/5 — ",
											review.authorName
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[13px] text-muted-foreground",
									children: review.publishedAt
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[13px] text-muted-foreground",
								children: review.comment
							})]
						}, review.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Aperçu public",
					description: "Ce que voient les clients sur votre fiche agence.",
					children: profile === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune donnée disponible" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-4",
						children: [profile.logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: profile.logo,
							alt: profile.name,
							className: "h-14 w-14 shrink-0 rounded-2xl border border-border object-cover shadow-sm"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { backgroundImage: seedGradient(profile.id) },
							className: "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold text-white shadow-sm",
							children: initialsOf(profile.name)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-[15px] font-bold",
								children: profile.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] text-muted-foreground",
								children: profile.location
							})]
						})]
					})
				})
			]
		})]
	});
}
//#endregion
export { AgencyProfilePage as component };
