import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Mt as ChevronRight, st as Handshake } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Footer } from "./Footer-ltp81XHe.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/devenir-partenaire-BiDL99LA.js
var import_jsx_runtime = require_jsx_runtime();
function BecomePartnerPage() {
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
								children: "Devenir partenaire"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-8 max-w-[600px] mx-auto text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handshake, {
									className: "h-5 w-5",
									strokeWidth: 1.6
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-5 text-[30px] font-bold tracking-tight",
								children: "Devenir partenaire"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-[14px] leading-[1.65] text-muted-foreground",
								children: "Vous êtes une agence et souhaitez rejoindre Sortlist pour recevoir des projets qualifiés ? Créez votre profil gratuitement pour commencer."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/inscription-agence",
								className: "mt-7 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
								children: "Créer mon profil agence"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: "pb-20" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { BecomePartnerPage as component };
