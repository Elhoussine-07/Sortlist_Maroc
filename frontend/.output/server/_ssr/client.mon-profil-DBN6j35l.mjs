import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Ht as Building2, Rt as Camera, T as ShieldCheck, X as LoaderCircle, Yt as BadgeCheck } from "../_libs/lucide-react.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { i as SectionCard, s as StatusBadge, t as FormSkeleton, u as TextField } from "./Blocks-CStVFDlw.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { l as verifyClientIdentity, o as updateClientProfile, r as getClientProfile } from "./profile.service-C-cGw1M0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.mon-profil-DBN6j35l.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var companySchema = objectType({
	contactLastName: stringType().trim().min(1, "Champ requis").max(80),
	contactFirstName: stringType().trim().min(1, "Champ requis").max(80),
	companyName: stringType().trim().min(1, "Champ requis").max(120),
	activitySector: stringType().trim().min(1, "Champ requis").max(120),
	country: stringType().trim().min(1, "Champ requis").max(80),
	legalIdType: stringType().trim().min(1, "Champ requis").max(80),
	legalIdValue: stringType().trim().min(1, "Champ requis").max(80)
});
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
var MAX_LOGO_SIZE_BYTES = 4194304;
function ClientProfilePage() {
	const queryClient = useQueryClient();
	const profileQuery = useQuery({
		queryKey: ["client", "profile"],
		queryFn: getClientProfile
	});
	const profile = profileQuery.data ?? null;
	const isLoading = profileQuery.isPending;
	const form = useForm({
		resolver: u(companySchema),
		defaultValues: {
			contactLastName: "",
			contactFirstName: "",
			companyName: "",
			activitySector: "",
			country: "",
			legalIdType: "",
			legalIdValue: ""
		}
	});
	(0, import_react.useEffect)(() => {
		if (profile) form.reset({
			contactLastName: profile.contactLastName,
			contactFirstName: profile.contactFirstName,
			companyName: profile.companyName,
			activitySector: profile.activitySector,
			country: profile.country,
			legalIdType: profile.legalIdType,
			legalIdValue: profile.legalIdValue
		});
	}, [profile]);
	const updateMutation = useMutation({
		mutationFn: (values) => updateClientProfile(values),
		onSuccess: (updated) => {
			queryClient.setQueryData(["client", "profile"], updated);
			toast.success("Profil mis à jour");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Impossible d'enregistrer le profil.");
		}
	});
	const onSubmit = form.handleSubmit((values) => {
		updateMutation.mutate({
			...values,
			logo: logoPreviewUrl ?? profile?.logo ?? void 0
		});
	});
	const verifyIdentityMutation = useMutation({
		mutationFn: verifyClientIdentity,
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["client", "profile"] });
			queryClient.invalidateQueries({ queryKey: ["client", "dashboard"] });
			if (result.verified) toast.success("Identité vérifiée : votre score de confiance a été mis à jour.");
			else toast.error(result.expectedFormat ? `Format d'identifiant invalide. Format attendu : ${result.expectedFormat}` : "Format d'identifiant invalide pour le pays renseigné.");
		},
		onError: (error) => {
			toast.error(error instanceof ApiError ? error.message : "Vérification de l'identité impossible.");
		}
	});
	const logoInputRef = (0, import_react.useRef)(null);
	const [logoPreviewUrl, setLogoPreviewUrl] = (0, import_react.useState)(null);
	function handleLogoChange(event) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Le logo doit être une image (PNG, JPG, SVG...).");
			return;
		}
		if (file.size > MAX_LOGO_SIZE_BYTES) {
			toast.error("Image trop lourde (4 Mo maximum).");
			return;
		}
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64Logo = reader.result;
			setLogoPreviewUrl(base64Logo);
			updateMutation.mutate({
				...form.getValues(),
				logo: base64Logo
			});
		};
		reader.readAsDataURL(file);
	}
	const companyName = form.watch("companyName") || profile?.companyName || "";
	const displayLogo = logoPreviewUrl ?? profile?.logo ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DashboardShell, {
		role: "client",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px] space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-[24px] font-bold tracking-tight",
					children: "Mon profil"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[14px] text-muted-foreground",
					children: "Informations de votre entreprise et niveau de confiance."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Informations entreprise",
					description: "Ces informations sont visibles par les agences que vous contactez.",
					action: profile?.identityVerified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: "Identité vérifiée" }) : null,
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSkeleton, { fields: 7 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit,
						className: "space-y-6",
						noValidate: true,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4 border-b border-border pb-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "group relative shrink-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: displayLogo ? void 0 : { backgroundImage: seedGradient(companyName || "?") },
											className: "flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-[22px] font-bold text-white shadow-sm",
											children: updateMutation.isPending && logoPreviewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-white" }) : displayLogo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: displayLogo,
												alt: "Logo de l'entreprise",
												className: "h-full w-full object-cover"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-display",
												children: (companyName || "?").slice(0, 2).toUpperCase()
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => logoInputRef.current?.click(),
											"aria-label": "Changer le logo",
											className: "absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
												className: "h-3.5 w-3.5",
												strokeWidth: 1.8
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: logoInputRef,
											type: "file",
											accept: "image/*",
											onChange: handleLogoChange,
											className: "hidden"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[14px] font-semibold",
											children: "Logo de l'entreprise"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[13px] leading-[1.5] text-muted-foreground",
											children: "PNG, JPG ou SVG, 4 Mo maximum. Affiché sur votre profil et vos échanges avec les agences."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => logoInputRef.current?.click(),
											className: "mt-2 rounded-md border border-border px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-accent",
											children: "Choisir une image"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-5 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Nom du contact",
										error: form.formState.errors.contactLastName?.message,
										...form.register("contactLastName")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Prénom du contact",
										error: form.formState.errors.contactFirstName?.message,
										...form.register("contactFirstName")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Raison sociale",
										error: form.formState.errors.companyName?.message,
										...form.register("companyName")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Secteur d'activité",
										error: form.formState.errors.activitySector?.message,
										...form.register("activitySector")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Pays",
										error: form.formState.errors.country?.message,
										...form.register("country")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Type d'identifiant légal",
										error: form.formState.errors.legalIdType?.message,
										...form.register("legalIdType")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Identifiant légal",
										error: form.formState.errors.legalIdValue?.message,
										...form.register("legalIdValue")
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: updateMutation.isPending,
									className: "rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
									children: updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => verifyIdentityMutation.mutate(),
									type: "button",
									disabled: verifyIdentityMutation.isPending,
									className: "flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
										className: "h-3.5 w-3.5",
										strokeWidth: 1.8
									}), verifyIdentityMutation.isPending ? "Vérification..." : profile?.identityVerified ? "Revérifier mon identité" : "Vérifier mon identité"]
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Score de confiance",
					description: "Calculé à partir de la complétion du profil et de votre activité.",
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormSkeleton, { fields: 2 }) : profile === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune donnée disponible" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
										className: "h-[22px] w-[22px]",
										strokeWidth: 1.6
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-display text-[28px] font-bold leading-none",
									children: [profile.trustScore, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[14px] font-normal text-muted-foreground",
										children: "/100"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { label: profile.trustScoreLabel })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-3",
							children: profile.trustScoreFactors.map((factor) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-[13px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									children: factor.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-semibold",
									children: [
										factor.value,
										"/",
										factor.max
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1.5 h-1.5 w-full rounded-full bg-accent",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-1.5 rounded-full bg-primary transition-[width]",
									style: { width: `${factor.value / factor.max * 100}%` }
								})
							})] }, factor.id))
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionCard, {
					title: "Complétion du profil",
					description: "Renseignez les champs manquants pour améliorer votre visibilité.",
					children: profile === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune donnée disponible" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
									className: "h-4 w-4",
									strokeWidth: 1.7
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[14px] font-semibold",
								children: [profile.completionPercent, "% complété"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2",
							children: profile.missingFields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-2 text-[13px] text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" }), field.label]
							}, field.id))
						})]
					})
				})
			]
		})]
	});
}
//#endregion
export { ClientProfilePage as component };
