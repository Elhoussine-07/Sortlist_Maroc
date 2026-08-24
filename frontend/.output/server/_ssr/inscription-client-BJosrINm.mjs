import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $t as ArrowLeft, Qt as ArrowRight } from "../_libs/lucide-react.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { c as registerClient, l as requestEmailCode } from "./auth.service-F3thChuN.mjs";
import { u as TextField } from "./Blocks-CStVFDlw.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inscription-client-BJosrINm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var registrationSchema = objectType({
	firstName: stringType().trim().min(1, "Champ requis").max(80),
	lastName: stringType().trim().min(1, "Champ requis").max(80),
	companyName: stringType().trim().max(120).optional(),
	country: stringType().trim().min(1, "Champ requis").max(80),
	phone: stringType().trim().min(1, "Champ requis").max(30),
	email: stringType().trim().email("E-mail invalide").max(255),
	password: stringType().trim().min(8, "Minimum 8 caractères").max(255),
	verificationCode: stringType().trim().min(4, "Code invalide").max(8)
});
function ClientRegistrationPage() {
	const [step, setStep] = (0, import_react.useState)(1);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	const setToken = useAuthStore((state) => state.setToken);
	const setUser = useAuthStore((state) => state.setUser);
	const setStoreRole = useAuthStore((state) => state.setRole);
	const form = useForm({
		resolver: u(registrationSchema),
		mode: "onTouched",
		defaultValues: {
			firstName: "",
			lastName: "",
			companyName: "",
			country: "",
			phone: "",
			email: "",
			password: "",
			verificationCode: ""
		}
	});
	form.watch("email");
	const handleSendCode = async () => {
		const emailValue = form.getValues("email");
		if (!emailValue) {
			toast("Renseignez votre email d'abord.");
			return;
		}
		try {
			await requestEmailCode(emailValue);
			toast("Code envoyé par email.", { description: "Vérifiez votre boîte de réception." });
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Envoi du code impossible.");
		}
	};
	const onSubmit = form.handleSubmit(async (values) => {
		setIsSubmitting(true);
		try {
			const { token, user, detectedRole } = await registerClient({
				email: values.email,
				password: values.password,
				firstName: values.firstName,
				lastName: values.lastName,
				country: values.country,
				companyName: values.companyName || "",
				phone: values.phone,
				verificationCode: values.verificationCode
			});
			setToken(token);
			setUser(user);
			setStoreRole(detectedRole);
			toast("Compte client créé avec succès !");
			navigate({ to: "/client/tableau-de-bord" });
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Inscription impossible.");
		} finally {
			setIsSubmitting(false);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-[720px] px-4 py-12 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[32px] font-bold tracking-tight",
					children: "Inscription client"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-[14px] text-muted-foreground",
					children: "Créez votre compte pour déposer vos projets en quelques clics."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit,
					className: "mt-9 space-y-6",
					noValidate: true,
					children: [
						step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 gap-5 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Prénom",
										error: form.formState.errors.firstName?.message,
										...form.register("firstName")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Nom",
										error: form.formState.errors.lastName?.message,
										...form.register("lastName")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Raison sociale (optionnel)",
										error: form.formState.errors.companyName?.message,
										...form.register("companyName")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
										label: "Pays",
										error: form.formState.errors.country?.message,
										...form.register("country")
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
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
								label: "Mot de passe",
								type: "password",
								error: form.formState.errors.password?.message,
								...form.register("password")
							})]
						}) : null,
						step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[14px] text-muted-foreground",
									children: "Un code de vérification a été envoyé à votre adresse email."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
									label: "Code de vérification",
									error: form.formState.errors.verificationCode?.message,
									...form.register("verificationCode")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: handleSendCode,
									type: "button",
									className: "text-[13.5px] font-semibold underline underline-offset-2",
									children: "Renvoyer le code"
								})
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setStep((current) => Math.max(1, current - 1)),
								disabled: step === 1,
								className: "flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), "Précédent"]
							}), step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									const fields = [
										"firstName",
										"lastName",
										"country",
										"phone",
										"email",
										"password"
									];
									if (fields.every((field) => !form.formState.errors[field]) && form.getValues("email")) {
										handleSendCode();
										setStep(2);
									} else {
										form.trigger(fields);
										toast("Veuillez remplir tous les champs correctement.");
									}
								},
								className: "flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
								children: ["Suivant", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: isSubmitting,
								className: "rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
								children: isSubmitting ? "Création..." : "Créer mon compte client"
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
export { ClientRegistrationPage as component };
