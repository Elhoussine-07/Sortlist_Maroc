import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Ht as Building2, Y as Lock, c as UserRound, dt as FileText, mt as Eye, q as Mail, rt as Info } from "../_libs/lucide-react.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { a as login, l as requestEmailCode, n as confirmPasswordReset, r as forgotPassword } from "./auth.service-F3thChuN.mjs";
import { t as ActionModal } from "./ActionModal-B-dtvezp.mjs";
import { u as TextField } from "./Blocks-CStVFDlw.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as useBriefingStore } from "./briefing.store-B_B_DZml.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/connexion-CZt2MV-w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const [role, setRole] = (0, import_react.useState)("client");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [rememberMe, setRememberMe] = (0, import_react.useState)(false);
	const isLoading = useAuthStore((state) => state.isLoading);
	const setLoading = useAuthStore((state) => state.setLoading);
	const setError = useAuthStore((state) => state.setError);
	const setSession = useAuthStore((state) => state.setSession);
	const navigate = useNavigate();
	const [pendingDraft] = (0, import_react.useState)(null);
	async function handleSubmit(event) {
		event.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const { token, user, detectedRole, roleKnown } = await login({
				email,
				password,
				role,
				rememberMe
			});
			if (roleKnown && detectedRole !== "admin" && role !== detectedRole) {
				const errorMessage = `Le compte "${email}" est un compte ${detectedRole === "agency" ? "Agence" : "Client"}. Veuillez sélectionner le bon bouton en haut de l'écran.`;
				setError(errorMessage);
				toast(errorMessage);
				setLoading(false);
				return;
			}
			const finalRole = roleKnown ? detectedRole : role;
			setSession({
				token,
				user,
				role: finalRole
			});
			const redirectTarget = new URLSearchParams(window.location.search).get("redirect");
			const briefingStore = useBriefingStore.getState();
			if (redirectTarget === "postuler-un-projet" && finalRole === "client" && briefingStore.hasDraft()) {
				briefingStore.setAutoPublishRequested(true);
				navigate({ to: "/client/postuler-un-projet" });
				return;
			}
			if (finalRole === "admin") navigate({ to: "/admin/tableau-de-bord" });
			else if (finalRole === "agency") navigate({ to: "/agence/tableau-de-bord" });
			else navigate({ to: "/client/tableau-de-bord" });
		} catch (error) {
			const message = error instanceof ApiError ? error.message : "Connexion impossible.";
			setError(message);
			toast(message);
		} finally {
			setLoading(false);
		}
	}
	async function handleRequestEmailCode() {
		if (!email) {
			toast("Renseignez votre email pour recevoir un code.");
			return;
		}
		try {
			await requestEmailCode(email);
			toast("Code envoyé par email.", { description: "Vérifiez votre boîte de réception." });
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Envoi du code impossible.");
		}
	}
	const [isResetModalOpen, setIsResetModalOpen] = (0, import_react.useState)(false);
	const [isSendingResetCode, setIsSendingResetCode] = (0, import_react.useState)(false);
	const [isConfirmingReset, setIsConfirmingReset] = (0, import_react.useState)(false);
	const [resetCode, setResetCode] = (0, import_react.useState)("");
	const [resetNewPassword, setResetNewPassword] = (0, import_react.useState)("");
	async function handleForgotPassword() {
		if (!email) {
			toast("Renseignez votre email pour réinitialiser votre mot de passe.");
			return;
		}
		setIsSendingResetCode(true);
		try {
			await forgotPassword(email);
			toast("Code envoyé par email.", { description: "Renseignez le code reçu et votre nouveau mot de passe." });
			setResetCode("");
			setResetNewPassword("");
			setIsResetModalOpen(true);
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Envoi impossible.");
		} finally {
			setIsSendingResetCode(false);
		}
	}
	async function handleConfirmPasswordReset() {
		if (!resetCode || !resetNewPassword) {
			toast("Renseignez le code reçu et votre nouveau mot de passe.");
			return;
		}
		setIsConfirmingReset(true);
		try {
			await confirmPasswordReset({
				email,
				code: resetCode,
				newPassword: resetNewPassword
			});
			toast("Mot de passe réinitialisé.", { description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." });
			setIsResetModalOpen(false);
			setResetCode("");
			setResetNewPassword("");
		} catch (error) {
			toast(error instanceof ApiError ? error.message : "Réinitialisation impossible.");
		} finally {
			setIsConfirmingReset(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "px-6 pt-8 sm:px-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-[26px] font-bold tracking-tight",
					children: "Sortlist"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[420px] px-6 pb-16 pt-14",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-center text-[32px] font-bold tracking-tight",
						children: "Bienvenue !"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-center text-[14px] text-muted-foreground",
						children: "Connectez-vous pour accéder à votre espace"
					}),
					pendingDraft ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex gap-4 rounded-lg border border-border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
							className: "h-7 w-7 shrink-0",
							strokeWidth: 1.5
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "min-w-0 text-[13.5px] leading-[1.5]",
							children: [
								"Vous étiez en train de créer votre projet",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
									className: "font-bold",
									children: [
										"\"",
										pendingDraft.title,
										"\""
									]
								}),
								" — connectez-vous pour continuer et le publier automatiquement."
							]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						className: "mt-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setRole("client"),
									"aria-pressed": role === "client",
									className: role === "client" ? "flex items-center justify-center gap-2 rounded-lg border-2 border-primary px-4 py-4 text-[14px] font-bold" : "flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-4 text-[14px] font-medium transition-colors hover:bg-accent",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {
										className: "h-4 w-4 shrink-0",
										strokeWidth: 1.7
									}), "Client (Entreprise)"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setRole("agency"),
									"aria-pressed": role === "agency",
									className: role === "agency" ? "flex items-center justify-center gap-2 rounded-lg border-2 border-primary px-4 py-4 text-[14px] font-bold" : "flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-4 text-[14px] font-medium transition-colors hover:bg-accent",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
										className: "h-4 w-4 shrink-0",
										strokeWidth: 1.7
									}), "Agence"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-7",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "email",
									className: "text-[13.5px] font-bold",
									children: "Email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center gap-3 border-b border-border pb-2 focus-within:border-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
										className: "h-4 w-4 shrink-0 text-muted-foreground",
										strokeWidth: 1.7
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "email",
										type: "email",
										value: email,
										onChange: (event) => setEmail(event.target.value),
										placeholder: "votreemail@entreprise.com",
										className: "min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "password",
									className: "text-[13.5px] font-bold",
									children: "Mot de passe"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center gap-3 border-b border-border pb-2 focus-within:border-primary",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
											className: "h-4 w-4 shrink-0 text-muted-foreground",
											strokeWidth: 1.7
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "password",
											type: showPassword ? "text" : "password",
											value: password,
											onChange: (event) => setPassword(event.target.value),
											className: "min-w-0 flex-1 bg-transparent text-[14px] outline-none"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setShowPassword((value) => !value),
											"aria-label": showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe",
											className: "shrink-0 text-muted-foreground transition-colors hover:text-foreground",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
												className: "h-4 w-4",
												strokeWidth: 1.7
											})
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex items-center justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-center gap-2 text-[13.5px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: rememberMe,
										onChange: (event) => setRememberMe(event.target.checked),
										className: "h-3.5 w-3.5 shrink-0 rounded-[3px] border border-border accent-primary"
									}), "Se souvenir de moi"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: handleForgotPassword,
									type: "button",
									disabled: isSendingResetCode,
									className: "text-[13.5px] font-semibold underline underline-offset-4 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50",
									children: isSendingResetCode ? "Envoi..." : "Mot de passe oublié ?"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: isLoading,
								className: "mt-7 w-full rounded-lg bg-primary py-4 text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
								children: isLoading ? "Connexion..." : "Se connecter"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 text-center text-[13px] text-muted-foreground",
								children: "ou"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleRequestEmailCode,
								type: "button",
								className: "mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-4 text-[14px] font-semibold transition-colors hover:bg-accent",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
									className: "h-4 w-4",
									strokeWidth: 1.7
								}), "Recevoir un code par email"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-7 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground",
									strokeWidth: 1.7
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "min-w-0 text-[13px] leading-[1.5] text-muted-foreground",
									children: "Détection automatique du type de compte après connexion pour vous rediriger vers le bon tableau de bord."
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-12 text-center text-[14px] font-semibold",
						children: [
							"Pas encore de compte ?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: role === "client" ? "/inscription-client" : "/inscription-agence",
								className: "underline underline-offset-4 transition-opacity hover:opacity-70",
								children: ["Créer un compte ", role === "client" ? "client" : "agence"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionModal, {
				open: isResetModalOpen,
				onOpenChange: setIsResetModalOpen,
				title: "Réinitialiser votre mot de passe",
				description: "Saisissez le code reçu par email et votre nouveau mot de passe.",
				confirmLabel: isConfirmingReset ? "Confirmation..." : "Confirmer",
				onConfirm: handleConfirmPasswordReset,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
						label: "Code reçu par email",
						type: "text",
						value: resetCode,
						onChange: (event) => setResetCode(event.target.value),
						placeholder: "Code à 6 chiffres"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextField, {
						label: "Nouveau mot de passe",
						type: "password",
						value: resetNewPassword,
						onChange: (event) => setResetNewPassword(event.target.value)
					})]
				})
			})
		]
	});
}
//#endregion
export { LoginPage as component };
