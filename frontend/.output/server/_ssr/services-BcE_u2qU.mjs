import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { A as Scale, G as Megaphone, H as MessageSquare, Mt as ChevronRight, R as Palette, bt as Compass, i as Wallet, o as UsersRound, xt as CodeXml } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Footer } from "./Footer-ltp81XHe.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/services-BcE_u2qU.js
var import_jsx_runtime = require_jsx_runtime();
var SECTORS = [
	{
		icon: Megaphone,
		title: "Marketing digital",
		description: "SEO, publicité en ligne, réseaux sociaux et stratégie de contenu."
	},
	{
		icon: CodeXml,
		title: "Développement web",
		description: "Sites vitrines, applications sur mesure et plateformes e-commerce."
	},
	{
		icon: Palette,
		title: "Design & branding",
		description: "Identité visuelle, UX/UI et design de produits digitaux."
	},
	{
		icon: MessageSquare,
		title: "Communication",
		description: "Relations presse, événementiel et communication de marque."
	},
	{
		icon: Scale,
		title: "Juridique",
		description: "Conseil juridique, contrats et conformité pour votre activité."
	},
	{
		icon: Wallet,
		title: "Finance & comptabilité",
		description: "Gestion comptable, fiscalité et pilotage financier."
	},
	{
		icon: UsersRound,
		title: "Ressources humaines",
		description: "Recrutement, formation et gestion des talents."
	},
	{
		icon: Compass,
		title: "Conseil en stratégie",
		description: "Accompagnement stratégique pour structurer votre croissance."
	}
];
function ServicesPage() {
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
								children: "Services couverts"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-8 max-w-[720px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[30px] font-bold tracking-tight",
							children: "Services couverts"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-[14px] leading-[1.65] text-muted-foreground",
							children: "Sortlist couvre un large éventail de secteurs, avec des agences spécialisées prêtes à accompagner votre projet."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-12 pb-20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4",
							children: SECTORS.map((sector) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-10 w-10 items-center justify-center rounded-full border border-border",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(sector.icon, {
											className: "h-4.5 w-4.5",
											strokeWidth: 1.6
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-4 text-[14px] font-bold",
										children: sector.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1.5 text-[12.5px] leading-[1.5] text-muted-foreground",
										children: sector.description
									})
								]
							}, sector.title))
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "bg-foreground text-background",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-[1080px] px-4 py-14 text-center sm:px-6 lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[24px] font-bold tracking-tight",
						children: "Prêt à trouver le partenaire idéal ?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/postuler-un-projet",
							className: "rounded-md bg-background px-6 py-3 text-[14px] font-semibold text-foreground transition-opacity hover:opacity-90",
							children: "Publier un projet"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/agences",
							className: "rounded-md border border-background/30 px-6 py-3 text-[14px] font-semibold text-background transition-opacity hover:opacity-90",
							children: "Découvrir les agences"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { ServicesPage as component };
