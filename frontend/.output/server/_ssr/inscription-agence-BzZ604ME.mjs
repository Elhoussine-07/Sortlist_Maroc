import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $t as ArrowLeft, Qt as ArrowRight, jt as CircleCheck } from "../_libs/lucide-react.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { d as verifyEmailCode, l as requestEmailCode, s as registerAgency } from "./auth.service-F3thChuN.mjs";
import { l as TextAreaField, u as TextField } from "./Blocks-CStVFDlw.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { a as updateAgencyProfile } from "./profile.service-C-cGw1M0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inscription-agence-BzZ604ME.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STEPS = [
	{
		id: 1,
		label: "Présentation"
	},
	{
		id: 2,
		label: "Compétences"
	},
	{
		id: 3,
		label: "Coordonnées"
	},
	{
		id: 4,
		label: "Vérification"
	}
];
var registrationSchema = objectType({
	name: stringType().trim().min(1, "Champ requis").max(120),
	description: stringType().trim().min(1, "Champ requis").max(2e3),
	foundedYear: stringType().trim().min(4, "Année invalide").max(4),
	teamSize: stringType().trim().min(1, "Champ requis").max(40),
	website: stringType().trim().url("URL invalide").max(255),
	skills: stringType().trim().min(1, "Champ requis").max(500),
	techStack: stringType().trim().min(1, "Champ requis").max(500),
	languages: stringType().trim().min(1, "Champ requis").max(200),
	location: stringType().trim().min(1, "Champ requis").max(120),
	country: stringType().trim().min(1, "Champ requis").max(120),
	address: stringType().trim().min(1, "Champ requis").max(255),
	phoneCountryCode: stringType().trim().min(1, "Champ requis").max(6),
	phone: stringType().trim().min(1, "Champ requis").max(30),
	email: stringType().trim().email("E-mail invalide").max(255),
	legalIdValue: stringType().trim().min(1, "Champ requis").max(80),
	password: stringType().min(8, "8 caractères minimum").max(128),
	confirmPassword: stringType().min(1, "Champ requis"),
	verificationCode: stringType().trim().min(4, "Code invalide").max(8)
}).refine((data) => data.password === data.confirmPassword, {
	message: "Les mots de passe ne correspondent pas",
	path: ["confirmPassword"]
});
var STEP_FIELDS = {
	1: [
		"name",
		"description",
		"foundedYear",
		"teamSize",
		"website"
	],
	2: [
		"skills",
		"techStack",
		"languages"
	],
	3: [
		"location",
		"country",
		"address",
		"phoneCountryCode",
		"phone",
		"email",
		"legalIdValue",
		"password",
		"confirmPassword"
	],
	4: ["verificationCode"]
};
var FIELDS_BEFORE_ACCOUNT_CREATION = [
	...STEP_FIELDS[1],
	...STEP_FIELDS[2],
	...STEP_FIELDS[3]
];
function AgencyRegistrationPage() {
	const [step, setStep] = (0, import_react.useState)(1);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [accountCreated, setAccountCreated] = (0, import_react.useState)(false);
	const [pendingApproval, setPendingApproval] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	const setToken = useAuthStore((state) => state.setToken);
	const setUser = useAuthStore((state) => state.setUser);
	const setStoreRole = useAuthStore((state) => state.setRole);
	const form = useForm({
		resolver: u(registrationSchema),
		mode: "onTouched",
		defaultValues: {
			name: "",
			description: "",
			foundedYear: "",
			teamSize: "",
			website: "",
			skills: "",
			techStack: "",
			languages: "",
			location: "",
			country: "",
			address: "",
			phoneCountryCode: "",
			phone: "",
			email: "",
			legalIdValue: "",
			password: "",
			confirmPassword: "",
			verificationCode: ""
		}
	});
	const email = form.watch("email");
	async function goToNextStep() {
		const fieldsToValidate = STEP_FIELDS[step];
		if (!(fieldsToValidate ? await form.trigger(fieldsToValidate) : true)) return;
		setStep((current) => Math.min(4, current + 1));
	}
	function jumpToFirstErrorStep(errors) {
		const erroredFields = Object.keys(errors);
		const firstErrorStep = Object.entries(STEP_FIELDS).find(([, fields]) => fields.some((field) => erroredFields.includes(field)))?.[0];
		if (firstErrorStep) setStep(Number(firstErrorStep));
		toast("Certains champs sont invalides ou manquants.", { description: "Vérifiez les informations saisies dans les étapes précédentes." });
	}
	async function handleCreateAccount() {
		if (!await form.trigger(FIELDS_BEFORE_ACCOUNT_CREATION)) {
			jumpToFirstErrorStep(form.formState.errors);
			return;
		}
		const values = form.getValues();
		setIsSubmitting(true);
		try {
			if ((await registerAgency({
				email: values.email,
				password: values.password,
				agencyName: values.name,
				country: values.country,
				description: values.description,
				phone: values.phone,
				website: values.website
			})).duplicateAgency) {
				setPendingApproval(true);
				return;
			}
			setAccountCreated(true);
			toast("Compte créé.", { description: "Un code de vérification vient d'être envoyé à votre adresse e-mail." });
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Inscription impossible.");
		} finally {
			setIsSubmitting(false);
		}
	}
	async function handleVerifyCode() {
		if (!await form.trigger("verificationCode")) return;
		const values = form.getValues();
		setIsSubmitting(true);
		try {
			const { token, user, detectedRole } = await verifyEmailCode(values.email, values.verificationCode, "agency");
			setToken(token);
			setUser(user);
			setStoreRole(detectedRole);
			try {
				await updateAgencyProfile({
					foundedYear: values.foundedYear,
					teamSize: values.teamSize,
					languages: values.languages.split(",").map((item) => item.trim()).filter(Boolean),
					location: values.location,
					legalIdValue: values.legalIdValue
				});
			} catch {
				toast("Compte créé, mais certaines informations de profil n'ont pas pu être enregistrées.");
			}
			toast("Compte agence créé.");
			navigate({ to: "/agence/tableau-de-bord" });
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Code invalide ou expiré.");
		} finally {
			setIsSubmitting(false);
		}
	}
	async function handleResendCode() {
		try {
			await requestEmailCode(email);
			toast("Code renvoyé.", { description: "Vérifiez votre boîte de réception." });
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Envoi du code impossible.");
		}
	}
	if (pendingApproval) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
					className: "h-10 w-10",
					strokeWidth: 1.5
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-6 text-[24px] font-bold tracking-tight",
					children: "Demande envoyée"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-[14px] leading-[1.6] text-muted-foreground",
					children: "Une agence portant un nom proche existe déjà sur Sortlist. Votre demande de rattachement a été transmise au propriétaire de cette agence — vous recevrez un e-mail dès qu'elle sera validée."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/connexion",
					className: "mt-8 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
					children: "Retour à la connexion"
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-[720px] px-4 py-12 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[32px] font-bold tracking-tight",
					children: "Inscription agence"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-[14px] text-muted-foreground",
					children: "Complétez les 4 étapes pour publier votre profil."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4",
					children: STEPS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: item.id <= step ? "h-[3px] w-full rounded-full bg-primary" : "h-[3px] w-full rounded-full bg-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 truncate text-[13px] font-semibold",
							children: [
								item.id,
								". ",
								item.label
							]
						})]
					}, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-9 space-y-6",
					children: [
						step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
								label: "Description de l'agence",
								rows: 5,
								error: form.formState.errors.description?.message,
								...form.register("description")
							})]
						}) : null,
						step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
									label: "Compétences (séparées par des virgules)",
									rows: 3,
									error: form.formState.errors.skills?.message,
									...form.register("skills")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAreaField, {
									label: "Technologies (séparées par des virgules)",
									rows: 3,
									error: form.formState.errors.techStack?.message,
									...form.register("techStack")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Langues de travail",
									error: form.formState.errors.languages?.message,
									...form.register("languages")
								})
							]
						}) : null,
						step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 gap-5 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Localisation",
									error: form.formState.errors.location?.message,
									...form.register("location")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Pays",
									error: form.formState.errors.country?.message,
									...form.register("country")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Adresse",
									error: form.formState.errors.address?.message,
									...form.register("address")
								}),
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
									label: "E-mail professionnel",
									error: form.formState.errors.email?.message,
									...form.register("email")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Identifiant légal",
									error: form.formState.errors.legalIdValue?.message,
									...form.register("legalIdValue")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Mot de passe",
									type: "password",
									error: form.formState.errors.password?.message,
									...form.register("password")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Confirmer le mot de passe",
									type: "password",
									error: form.formState.errors.confirmPassword?.message,
									...form.register("confirmPassword")
								})
							]
						}) : null,
						step === 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-5",
							children: accountCreated ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[14px] text-muted-foreground",
									children: "Un code de vérification a été envoyé à l'adresse renseignée."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Code de vérification",
									error: form.formState.errors.verificationCode?.message,
									...form.register("verificationCode")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: handleResendCode,
									type: "button",
									className: "text-[13.5px] font-semibold underline underline-offset-2",
									children: "Renvoyer le code"
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[14px] text-muted-foreground",
								children: "Vérifiez les informations saisies puis cliquez sur \"Créer mon compte agence\" pour recevoir un code de vérification par e-mail."
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setStep((current) => Math.max(1, current - 1)),
								disabled: step === 1 || step === 4 && accountCreated,
								className: "flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), "Précédent"]
							}), step < 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: goToNextStep,
								className: "flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
								children: ["Suivant", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: accountCreated ? handleVerifyCode : handleCreateAccount,
								disabled: isSubmitting,
								className: "rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
								children: isSubmitting ? "Veuillez patienter..." : accountCreated ? "Valider et terminer" : "Créer mon compte agence"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-8 text-[13.5px] text-muted-foreground",
					children: [
						"Vous avez déjà un compte ?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/connexion",
							className: "font-semibold text-foreground underline underline-offset-2",
							children: "Se connecter"
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { AgencyRegistrationPage as component };
