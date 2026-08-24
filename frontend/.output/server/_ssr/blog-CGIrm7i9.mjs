import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Mt as ChevronRight, z as Newspaper } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Footer } from "./Footer-ltp81XHe.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blog-CGIrm7i9.js
var import_jsx_runtime = require_jsx_runtime();
function BlogPage() {
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
								children: "Blog"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-8 max-w-[720px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[30px] font-bold tracking-tight",
							children: "Blog"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-[14px] leading-[1.65] text-muted-foreground",
							children: "Actualités, conseils et retours d'expérience autour du B2B."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Newspaper, {
								className: "h-8 w-8 text-muted-foreground",
								strokeWidth: 1.4
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-[14px] font-semibold",
								children: "Aucun article publié pour le moment"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground",
								children: "Revenez bientôt pour découvrir nos premiers articles."
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
export { BlogPage as component };
