import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Mt as ChevronRight, jt as CircleCheck } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Footer } from "./Footer-ltp81XHe.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tarifs-BQck8QIF.js
var import_jsx_runtime = require_jsx_runtime();
var POINTS = [
	"Créer votre profil, gratuit",
	"Publier un projet, gratuit",
	"Postuler à une mission, gratuit",
	"Aucune commission cachée"
];
function PricingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, { variant: "landing" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: "Prix"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-8 max-w-[600px] mx-auto text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[30px] font-bold tracking-tight",
							children: "Nos tarifs"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-[14px] leading-[1.65] text-muted-foreground",
							children: "Sortlist est entièrement gratuit, que vous soyez une entreprise ou une agence."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-12 pb-20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto max-w-[420px] rounded-lg border border-border p-8 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[13px] font-semibold uppercase tracking-wide text-muted-foreground",
									children: "Utilisation de la plateforme"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-[40px] font-bold tracking-tight",
									children: "0 €"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[13px] text-muted-foreground",
									children: "Sans engagement"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-6 space-y-3 text-left",
									children: POINTS.map((point) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-start gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
											className: "mt-0.5 h-4 w-4 shrink-0",
											strokeWidth: 1.6
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[13.5px]",
											children: point
										})]
									}, point))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/connexion",
									className: "mt-7 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
									children: "Créer mon compte gratuitement"
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { PricingPage as component };
