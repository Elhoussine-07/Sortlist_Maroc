import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Dt as CircleUserRound, W as Menu } from "../_libs/lucide-react.mjs";
import { n as DropdownMenuContent, o as DropdownMenuTrigger, r as DropdownMenuItem, t as DropdownMenu } from "./dropdown-menu-CHGFKbne.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/MarketingHeader-CTcyVmuL.js
var import_jsx_runtime = require_jsx_runtime();
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: "group flex shrink-0 items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 28 28",
			"aria-hidden": "true",
			className: "h-6 w-6 text-primary transition-transform group-hover:scale-105",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "6",
					cy: "6",
					r: "3.2",
					fill: "currentColor",
					fillOpacity: "0.35"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "6",
					cy: "22",
					r: "3.2",
					fill: "currentColor",
					fillOpacity: "0.35"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "22",
					cy: "14",
					r: "3.6",
					fill: "currentColor"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "8.6",
					y1: "7.4",
					x2: "19.4",
					y2: "12.6",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeOpacity: "0.5"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "8.6",
					y1: "20.6",
					x2: "19.4",
					y2: "15.4",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeOpacity: "0.5"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-[20px] font-bold tracking-tight",
			children: "Sortlist"
		})]
	});
}
function MarketingHeader({ variant = "landing", active = null, applyDisabled = false }) {
	const token = useAuthStore((state) => state.token);
	const dashboardPath = useAuthStore((state) => state.role) === "agency" ? "/agence/tableau-de-bord" : "/client/tableau-de-bord";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}), variant === "landing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "ml-8 hidden items-center gap-6 lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/fonctionnalites/$slug",
						params: { slug: "matching-intelligent" },
						className: "text-[14.5px] font-medium text-foreground/80 transition-colors hover:text-foreground",
						children: "Fonctionnalités"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						title: "Page à venir",
						className: "cursor-not-allowed text-[14.5px] font-medium text-muted-foreground/50",
						children: "Comment ça marche"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						title: "Page à venir",
						className: "cursor-not-allowed text-[14.5px] font-medium text-muted-foreground/50",
						children: "À propos"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ml-auto flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/agences",
						className: "hidden rounded-md px-3 py-2 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-foreground sm:inline-flex",
						children: "Trouvez l'agence idéale"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/projets",
						className: "hidden rounded-md px-3 py-2 text-[14px] font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-foreground sm:inline-flex",
						children: "Trouvez le projet idéal"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/postuler-un-projet",
						className: "rounded-md bg-primary px-3.5 py-2 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow",
						children: "Postuler un projet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: token ? dashboardPath : "/connexion",
						"aria-label": "Mon compte",
						className: "ml-1 flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUserRound, {
							className: "h-[22px] w-[22px]",
							strokeWidth: 1.5
						})
					})
				]
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "ml-6 hidden items-center gap-1 rounded-lg border border-border p-1 md:flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/agences",
					className: active === "agencies" ? "rounded-md bg-primary px-4 py-1.5 text-[14px] font-semibold text-primary-foreground" : "rounded-md px-4 py-1.5 text-[14px] font-semibold text-foreground/75 transition-colors hover:bg-accent hover:text-foreground",
					children: "Trouvez l'agence idéale"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/projets",
					className: active === "projects" ? "rounded-md bg-primary px-4 py-1.5 text-[14px] font-semibold text-primary-foreground" : "rounded-md px-4 py-1.5 text-[14px] font-semibold text-foreground/75 transition-colors hover:bg-accent hover:text-foreground",
					children: "Trouvez le projet idéal"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ml-auto flex items-center gap-3",
				children: [
					applyDisabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden cursor-not-allowed items-center rounded-md px-4 py-2 text-[14px] font-semibold text-muted-foreground/50 sm:inline-flex",
						children: "Postuler un projet"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/postuler-un-projet",
						className: "hidden rounded-md bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow sm:inline-flex",
						children: "Postuler un projet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: token ? dashboardPath : "/connexion",
						"aria-label": "Mon compte",
						className: "flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUserRound, {
							className: "h-[22px] w-[22px]",
							strokeWidth: 1.5
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Menu",
							className: "flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground md:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
								className: "h-[22px] w-[22px]",
								strokeWidth: 1.5
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
						align: "end",
						className: "w-56",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/agences",
									children: "Trouvez l'agence idéale"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/projets",
									children: "Trouvez le projet idéal"
								})
							}),
							!applyDisabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/postuler-un-projet",
									children: "Postuler un projet"
								})
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: token ? dashboardPath : "/connexion",
									children: token ? "Mon tableau de bord" : "Se connecter"
								})
							})
						]
					})] })
				]
			})] })]
		})
	});
}
//#endregion
export { MarketingHeader as t };
