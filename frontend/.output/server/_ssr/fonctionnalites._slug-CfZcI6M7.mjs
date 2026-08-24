import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { I as Play, Mt as ChevronRight, _ as Target, jt as CircleCheck } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fonctionnalites._slug-CfZcI6M7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BENEFITS = [
	{
		title: "Des recommandations ultra-ciblées",
		description: "Recevez uniquement des suggestions pertinentes et alignées avec vos objectifs."
	},
	{
		title: "Gain de temps considérable",
		description: "Fini les recherches interminables : notre IA fait le travail pour vous."
	},
	{
		title: "Meilleure qualité de collaboration",
		description: "Connectez-vous avec les partenaires ou projets qui partagent vos valeurs et votre vision."
	}
];
var DEMO_NAV = [
	"Dashboard",
	"Projets",
	"Agences",
	"Messages",
	"Favoris",
	"Paramètres"
];
function FeatureDetailPage() {
	const [feature] = (0, import_react.useState)(null);
	const [demoAgencies] = (0, import_react.useState)([]);
	const [isDemoLoading] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, { variant: "landing" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "Fil d'ariane",
					className: "flex items-center gap-2 pt-6 text-[13px] text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "transition-colors hover:text-foreground",
							children: "Accueil"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Fonctionnalités" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							className: "h-3 w-3",
							strokeWidth: 1.8
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-foreground",
							children: "Matching intelligent"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8 flex gap-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, {
						className: "mt-1 h-6 w-6 shrink-0",
						strokeWidth: 1.6
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-[30px] font-bold tracking-tight",
								children: "Matching intelligent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-[720px] text-[14px] leading-[1.65] text-foreground",
								children: "Notre algorithme d'intelligence artificielle analyse des milliers de données pour comprendre vos besoins, vos objectifs et votre contexte. Il identifie ensuite les agences ou projets les plus pertinents en fonction de leur expertise, de leurs réalisations passées et de leur compatibilité avec vos critères. Vous gagnez du temps et vous maximisez vos chances de succès."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-8 space-y-5",
								children: (feature ?? BENEFITS).map((benefit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
										className: "mt-0.5 h-[17px] w-[17px] shrink-0",
										strokeWidth: 1.6
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-[13.5px] font-bold",
											children: benefit.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[13px] leading-[1.5] text-muted-foreground",
											children: benefit.description
										})]
									})]
								}, benefit.title))
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
						children: "Démonstration"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-4 overflow-hidden rounded-lg border border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border p-5 md:border-b-0 md:border-r",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[16px] font-bold tracking-tight",
									children: "Sortlist"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
									className: "mt-5 space-y-3",
									children: DEMO_NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-2 text-[13px] font-medium",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3.5 w-3.5 rounded-sm border border-border" }), item]
									}, item))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[14px] font-bold",
										children: "Matching intelligent"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "truncate text-[13px] text-muted-foreground",
											children: [
												"Nous avons trouvé ",
												demoAgencies.length,
												" agences correspondant à vos critères"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex shrink-0 items-center gap-4 text-[13px] text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Filtres (0)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Trier par : Pertinence" })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-5",
										children: isDemoLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 gap-6 sm:grid-cols-3",
											children: [demoAgencies.map(() => null), demoAgencies.length === 0 ? Array.from({ length: 3 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "h-3.5 rounded bg-muted" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "h-2.5 w-2/3 rounded bg-muted" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "h-2.5 rounded bg-muted" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "h-2.5 w-1/2 rounded bg-muted" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between pt-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "h-2.5 w-24 rounded bg-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex h-8 w-8 items-center justify-center rounded-full border border-border text-[13px] font-semibold" })]
													})
												]
											}, index)) : null]
										})
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/connexion",
							"aria-label": "Se connecter pour lancer la démonstration",
							className: "absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "h-5 w-5 fill-current",
								strokeWidth: 0
							})
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "py-16 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[13.5px] text-muted-foreground",
						children: "Prêt à essayer ? Créez votre compte gratuitement"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/connexion",
						className: "mt-4 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
						children: "S'inscrire maintenant"
					})]
				})
			]
		})]
	});
}
//#endregion
export { FeatureDetailPage as component };
