import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { n as objectType, r as stringType, t as enumType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CW1fXXIG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var styles_default = "/assets/styles-BAa1WPne.css";
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
var useThemeStore = create()(persist((set) => ({
	theme: "system",
	font: "default",
	textSize: 100,
	setTheme: (theme) => set({ theme }),
	setFont: (font) => set({ font }),
	setTextSize: (textSize) => set({ textSize })
}), { name: "theme-preferences" }));
var FONT_STACKS = {
	default: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
	inter: "'Inter', sans-serif",
	system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
	serif: "Georgia, 'Times New Roman', serif",
	mono: "'JetBrains Mono', 'Courier New', monospace"
};
function resolveIsDark(theme) {
	if (theme === "dark") return true;
	if (theme === "light") return false;
	return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function applyDomPreferences(state) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	root.classList.toggle("dark", resolveIsDark(state.theme));
	root.dataset["theme"] = state.theme;
	const stack = FONT_STACKS[state.font] ?? FONT_STACKS["default"];
	root.style.setProperty("--font-sans", stack);
	const clampedSize = Math.min(130, Math.max(80, state.textSize || 100));
	root.style.fontSize = `${clampedSize}%`;
}
function useApplyThemePreferences() {
	(0, import_react.useEffect)(() => {
		applyDomPreferences(useThemeStore.getState());
		const unsubscribe = useThemeStore.subscribe((state) => applyDomPreferences(state));
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onMediaChange = () => {
			if (useThemeStore.getState().theme === "system") applyDomPreferences(useThemeStore.getState());
		};
		media.addEventListener("change", onMediaChange);
		return () => {
			unsubscribe();
			media.removeEventListener("change", onMediaChange);
		};
	}, []);
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$48 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Plateforme agences & projets digitaux" },
			{
				name: "description",
				content: "Mettez en relation clients et agences digitales : briefing IA, opportunités, collaborations et facturation."
			},
			{
				property: "og:title",
				content: "Plateforme agences & projets digitaux"
			},
			{
				property: "og:description",
				content: "Briefing IA, recherche d'agences, suivi des projets et facturation dans un seul espace."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "fr",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$48.useRouteContext();
	useApplyThemePreferences();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-right" })]
	});
}
var $$splitComponentImporter$47 = () => import("./routes-DZYV32Mk.mjs");
var Route$47 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Sortlist — La plateforme B2B projets & agences" },
		{
			name: "description",
			content: "Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins. Sortlist simplifie chaque étape."
		},
		{
			property: "og:title",
			content: "Sortlist — La plateforme B2B projets & agences"
		},
		{
			property: "og:description",
			content: "Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$47, "component")
});
var $$splitComponentImporter$46 = () => import("./route-GySCL6PQ.mjs");
var Route$46 = createFileRoute("/_authenticated")({
	ssr: false,
	component: lazyRouteComponent($$splitComponentImporter$46, "component")
});
var $$splitComponentImporter$45 = () => import("./a-propos-zcOo6FlK.mjs");
var Route$45 = createFileRoute("/a-propos")({
	head: () => ({ meta: [
		{ title: "À propos — Sortlist" },
		{
			name: "description",
			content: "Découvrez la mission de Sortlist, la plateforme B2B qui connecte entreprises et agences grâce à un matching intelligent."
		},
		{
			property: "og:title",
			content: "À propos — Sortlist"
		},
		{
			property: "og:description",
			content: "La mission, la vision et l'approche de Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$45, "component")
});
var $$splitComponentImporter$44 = () => import("./agences-BK-_DOQo.mjs");
var Route$44 = createFileRoute("/agences")({
	head: () => ({ meta: [
		{ title: "Trouvez l'agence idéale — Sortlist" },
		{
			name: "description",
			content: "Recherchez et comparez les agences par catégorie et sous-catégorie pour trouver le partenaire idéal de votre projet."
		},
		{
			property: "og:title",
			content: "Trouvez l'agence idéale — Sortlist"
		},
		{
			property: "og:description",
			content: "Recherchez et comparez les agences pour votre projet."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$44, "component")
});
var $$splitComponentImporter$43 = () => import("./aide-Caw-uH1r.mjs");
var Route$43 = createFileRoute("/aide")({
	head: () => ({ meta: [{ title: "Centre d'aide — Sortlist" }, {
		name: "description",
		content: "Besoin d'aide ? Contactez l'équipe Sortlist ou consultez notre FAQ."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$43, "component")
});
var $$splitComponentImporter$42 = () => import("./blog-CGIrm7i9.mjs");
var Route$42 = createFileRoute("/blog")({
	head: () => ({ meta: [{ title: "Blog — Sortlist" }, {
		name: "description",
		content: "Le blog Sortlist : actualités et conseils, bientôt disponibles."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$42, "component")
});
var $$splitComponentImporter$41 = () => import("./carrieres-DipiYUn8.mjs");
var Route$41 = createFileRoute("/carrieres")({
	head: () => ({ meta: [{ title: "Carrières — Sortlist" }, {
		name: "description",
		content: "Aucune offre d'emploi n'est publiée pour le moment chez Sortlist."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$41, "component")
});
var $$splitComponentImporter$40 = () => import("./comment-ca-marche-DhRsb-cB.mjs");
var Route$40 = createFileRoute("/comment-ca-marche")({
	head: () => ({ meta: [
		{ title: "Comment ça marche — Sortlist" },
		{
			name: "description",
			content: "Découvrez comment fonctionne Sortlist : décrivez votre projet ou votre profil agence, laissez notre IA vous mettre en relation, collaborez en toute confiance."
		},
		{
			property: "og:title",
			content: "Comment ça marche — Sortlist"
		},
		{
			property: "og:description",
			content: "Découvrez comment fonctionne Sortlist en quelques étapes simples."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$40, "component")
});
var $$splitComponentImporter$39 = () => import("./connexion-CZt2MV-w.mjs");
var Route$39 = createFileRoute("/connexion")({
	head: () => ({ meta: [
		{ title: "Connexion | Sortlist" },
		{
			name: "description",
			content: "Connectez-vous à votre espace Sortlist : détection automatique du type de compte après connexion."
		},
		{
			property: "og:title",
			content: "Connexion | Sortlist"
		},
		{
			property: "og:description",
			content: "Connectez-vous pour accéder à votre espace Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$39, "component")
});
var $$splitComponentImporter$38 = () => import("./devenir-partenaire-BiDL99LA.mjs");
var Route$38 = createFileRoute("/devenir-partenaire")({
	head: () => ({ meta: [{ title: "Devenir partenaire — Sortlist" }, {
		name: "description",
		content: "Devenez partenaire de Sortlist et développez votre activité avec de nouveaux projets."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$38, "component")
});
var $$splitComponentImporter$37 = () => import("./etudes-BoVmKM5Q.mjs");
var Route$37 = createFileRoute("/etudes")({
	head: () => ({ meta: [{ title: "Études et rapports — Sortlist" }, {
		name: "description",
		content: "Études et rapports Sortlist sur le marché B2B, bientôt disponibles."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$37, "component")
});
var $$splitComponentImporter$36 = () => import("./guides-Bn9XNql_.mjs");
var Route$36 = createFileRoute("/guides")({
	head: () => ({ meta: [{ title: "Guides et tutoriels — Sortlist" }, {
		name: "description",
		content: "Guides et tutoriels pour bien démarrer sur Sortlist, bientôt disponibles."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$36, "component")
});
var $$splitComponentImporter$35 = () => import("./inscription-agence-BzZ604ME.mjs");
var Route$35 = createFileRoute("/inscription-agence")({
	head: () => ({ meta: [
		{ title: "Inscription agence — Sortlist" },
		{
			name: "description",
			content: "Créez le compte de votre agence : présentation, compétences, coordonnées et vérification."
		},
		{
			property: "og:title",
			content: "Inscription agence — Sortlist"
		},
		{
			property: "og:description",
			content: "Rejoignez Sortlist et recevez des opportunités qualifiées."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$35, "component")
});
objectType({
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
var $$splitComponentImporter$34 = () => import("./inscription-client-BJosrINm.mjs");
var Route$34 = createFileRoute("/inscription-client")({
	head: () => ({ meta: [{ title: "Inscription client | Sortlist" }, {
		name: "description",
		content: "Créez votre compte client pour déposer vos projets sur Sortlist."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$34, "component")
});
objectType({
	firstName: stringType().trim().min(1, "Champ requis").max(80),
	lastName: stringType().trim().min(1, "Champ requis").max(80),
	companyName: stringType().trim().max(120).optional(),
	country: stringType().trim().min(1, "Champ requis").max(80),
	phone: stringType().trim().min(1, "Champ requis").max(30),
	email: stringType().trim().email("E-mail invalide").max(255),
	password: stringType().trim().min(8, "Minimum 8 caractères").max(255),
	verificationCode: stringType().trim().min(4, "Code invalide").max(8)
});
var $$splitComponentImporter$33 = () => import("./postuler-un-projet-D1z2xfOX.mjs");
var Route$33 = createFileRoute("/postuler-un-projet")({
	validateSearch: (search) => ({ resume: typeof search["resume"] === "string" ? search["resume"] : void 0 }),
	head: () => ({ meta: [
		{ title: "Postuler un projet — Sortlist" },
		{
			name: "description",
			content: "Décrivez votre besoin avec le Smart Briefing IA et générez votre cahier des charges en cinq étapes."
		},
		{
			property: "og:title",
			content: "Postuler un projet — Sortlist"
		},
		{
			property: "og:description",
			content: "Décrivez votre besoin avec le Smart Briefing IA."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./presse-DBJ_67s5.mjs");
var Route$32 = createFileRoute("/presse")({
	head: () => ({ meta: [{ title: "Presse — Sortlist" }, {
		name: "description",
		content: "Espace presse Sortlist : ressources et contact presse."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$32, "component")
});
var $$splitComponentImporter$31 = () => import("./projets-D5GDstu8.mjs");
var Route$31 = createFileRoute("/projets")({
	head: () => ({ meta: [
		{ title: "Trouvez le projet idéal — Sortlist" },
		{
			name: "description",
			content: "Parcourez les projets publiés par les entreprises et filtrez par catégorie, sous-catégorie et budget."
		},
		{
			property: "og:title",
			content: "Trouvez le projet idéal — Sortlist"
		},
		{
			property: "og:description",
			content: "Parcourez les projets publiés par les entreprises."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
var $$splitComponentImporter$30 = () => import("./ressources-DwljFJuR.mjs");
var Route$30 = createFileRoute("/ressources")({
	head: () => ({ meta: [{ title: "Ressources et conseils — Sortlist" }, {
		name: "description",
		content: "Ressources et conseils pour bien utiliser Sortlist, bientôt disponibles."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./services-BcE_u2qU.mjs");
var Route$29 = createFileRoute("/services")({
	head: () => ({ meta: [{ title: "Services couverts — Sortlist" }, {
		name: "description",
		content: "Découvrez les secteurs et services couverts par les agences présentes sur Sortlist."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./tarifs-BQck8QIF.mjs");
var Route$28 = createFileRoute("/tarifs")({
	head: () => ({ meta: [{ title: "Tarifs — Sortlist" }, {
		name: "description",
		content: "Sortlist est gratuit : aucun frais de dépôt, aucune commission cachée."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./agences_._id-Cnbqn1Lp.mjs");
var Route$27 = createFileRoute("/agences_/$id")({
	head: () => ({ meta: [
		{ title: "Profil de l'agence — Sortlist" },
		{
			name: "description",
			content: "Consultez la présentation, les compétences, le portfolio et les avis d'une agence avant de la contacter."
		},
		{
			property: "og:title",
			content: "Profil de l'agence — Sortlist"
		},
		{
			property: "og:description",
			content: "Présentation, compétences, réalisations et avis clients de l'agence."
		},
		{
			property: "og:type",
			content: "profile"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./fonctionnalites._slug-CfZcI6M7.mjs");
var Route$26 = createFileRoute("/fonctionnalites/$slug")({
	head: () => ({ meta: [
		{ title: "Fonctionnalités — Sortlist" },
		{
			name: "description",
			content: "Découvrez en détail les fonctionnalités de Sortlist : matching intelligent, projets ciblés, collaboration simplifiée."
		},
		{
			property: "og:title",
			content: "Fonctionnalités — Sortlist"
		},
		{
			property: "og:description",
			content: "Découvrez en détail les fonctionnalités de Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./admin.avis-DmJLjeB6.mjs");
var Route$25 = createFileRoute("/_authenticated/admin/avis")({
	head: () => ({ meta: [{ title: "Avis & comptes — Administration" }] }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
var $$splitComponentImporter$24 = () => import("./admin.litiges-CNlrAgKz.mjs");
var Route$24 = createFileRoute("/_authenticated/admin/litiges")({
	head: () => ({ meta: [{ title: "Litiges & suspensions — Administration" }] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
var $$splitComponentImporter$23 = () => import("./admin.notifications-mI4SXfDO.mjs");
var Route$23 = createFileRoute("/_authenticated/admin/notifications")({
	head: () => ({ meta: [{ title: "Historique des notifications — Administration" }] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./admin.tableau-de-bord-B-MLC1t8.mjs");
var Route$22 = createFileRoute("/_authenticated/admin/tableau-de-bord")({
	head: () => ({ meta: [{ title: "Tableau de bord — Administration" }] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./agence.analytics-BT0KH_Aq.mjs");
var Route$21 = createFileRoute("/_authenticated/agence/analytics")({
	head: () => ({ meta: [
		{ title: "Analytics PQI — Sortlist" },
		{
			name: "description",
			content: "Analysez votre score PQI, vos vues de profil, votre position moyenne et vos notes clients."
		},
		{
			property: "og:title",
			content: "Analytics PQI — Sortlist"
		},
		{
			property: "og:description",
			content: "Indicateurs de performance de votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./agence.facturation-DXPGkunQ.mjs");
var Route$20 = createFileRoute("/_authenticated/agence/facturation")({
	head: () => ({ meta: [
		{ title: "Facturation — Sortlist" },
		{
			name: "description",
			content: "Suivez vos factures émises et reçues, filtrez par statut et téléchargez vos documents."
		},
		{
			property: "og:title",
			content: "Facturation — Sortlist"
		},
		{
			property: "og:description",
			content: "Factures et paiements de votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
objectType({
	methodType: enumType(["Card", "Bank Transfer"]),
	label: stringType().trim().min(1, "Champ requis").max(80),
	providerToken: stringType().trim().min(1, "Champ requis").max(80)
});
var $$splitComponentImporter$19 = () => import("./agence.invitations-7O5Gy6zc.mjs");
var Route$19 = createFileRoute("/_authenticated/agence/invitations")({
	head: () => ({ meta: [{ title: "Invitations — Sortlist" }, {
		name: "description",
		content: "Gérez les demandes de rattachement reçues et suivez vos demandes envoyées."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./agence.mes-prospections-B2eUycvb.mjs");
var Route$18 = createFileRoute("/_authenticated/agence/mes-prospections")({
	head: () => ({ meta: [
		{ title: "Mes prospections — Sortlist" },
		{
			name: "description",
			content: "Recherchez et suivez vos prospections envoyées, leurs réponses et leur statut."
		},
		{
			property: "og:title",
			content: "Mes prospections — Sortlist"
		},
		{
			property: "og:description",
			content: "Suivi des prospections de votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./agence.notifications-CT6yay55.mjs");
var Route$17 = createFileRoute("/_authenticated/agence/notifications")({
	head: () => ({ meta: [
		{ title: "Historique des notifications — Sortlist" },
		{
			name: "description",
			content: "Consultez l'historique complet des notifications de votre agence, filtrez par type et par statut."
		},
		{
			property: "og:title",
			content: "Historique des notifications — Sortlist"
		},
		{
			property: "og:description",
			content: "Centre de notifications de votre espace agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./agence.opportunites-TIoLWKg-.mjs");
var Route$16 = createFileRoute("/_authenticated/agence/opportunites")({
	head: () => ({ meta: [
		{ title: "Opportunités — Sortlist" },
		{
			name: "description",
			content: "Offres disponibles, projets gagnés, en pause, terminés et archivés pour votre agence."
		},
		{
			property: "og:title",
			content: "Opportunités — Sortlist"
		},
		{
			property: "og:description",
			content: "Parcourez et filtrez les opportunités adressées à votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./agence.parametres-DdX5qwJj.mjs");
var Route$15 = createFileRoute("/_authenticated/agence/parametres")({
	head: () => ({ meta: [
		{ title: "Paramètres agence — Sortlist" },
		{
			name: "description",
			content: "Configurez votre compte agence : préférences d'affichage, notifications, sécurité et facturation."
		},
		{
			property: "og:title",
			content: "Paramètres agence — Sortlist"
		},
		{
			property: "og:description",
			content: "Configuration du compte de votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
objectType({
	currentPassword: stringType().min(1, "Champ requis").max(128),
	newPassword: stringType().min(8, "8 caractères minimum").max(128),
	confirmPassword: stringType().min(8, "8 caractères minimum").max(128)
}).refine((values) => values.newPassword === values.confirmPassword, {
	message: "Les mots de passe ne correspondent pas",
	path: ["confirmPassword"]
});
objectType({
	billingEmail: stringType().trim().email("E-mail invalide").max(255),
	vatNumber: stringType().trim().min(1, "Champ requis").max(40),
	billingAddress: stringType().trim().min(1, "Champ requis").max(255)
});
var $$splitComponentImporter$14 = () => import("./agence.profil-CXbrtqWn.mjs");
var Route$14 = createFileRoute("/_authenticated/agence/profil")({
	head: () => ({ meta: [
		{ title: "Profil agence — Sortlist" },
		{
			name: "description",
			content: "Gérez la présentation de votre agence, vos compétences, votre portfolio et vos coordonnées."
		},
		{
			property: "og:title",
			content: "Profil agence — Sortlist"
		},
		{
			property: "og:description",
			content: "Profil public de votre agence sur Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
objectType({
	name: stringType().trim().min(1, "Champ requis").max(120),
	description: stringType().trim().min(1, "Champ requis").max(2e3),
	foundedYear: stringType().trim().min(4, "Année invalide").max(4),
	teamSize: stringType().trim().min(1, "Champ requis").max(40),
	website: stringType().trim().url("URL invalide").max(255),
	location: stringType().trim().min(1, "Champ requis").max(120),
	legalIdValue: stringType().trim().min(1, "Champ requis").max(80),
	phoneCountryCode: stringType().trim().min(1, "Champ requis").max(6),
	phone: stringType().trim().min(1, "Champ requis").max(30),
	email: stringType().trim().email("E-mail invalide").max(255),
	address: stringType().trim().min(1, "Champ requis").max(255),
	logo: stringType().optional(),
	coverImage: stringType().optional()
});
var $$splitComponentImporter$13 = () => import("./agence.projets-en-cours-tzJi9-tJ.mjs");
var Route$13 = createFileRoute("/_authenticated/agence/projets-en-cours")({
	head: () => ({ meta: [
		{ title: "Projets en cours — Sortlist" },
		{
			name: "description",
			content: "Suivez l'avancement de vos projets clients, leurs statuts et leurs échéances."
		},
		{
			property: "og:title",
			content: "Projets en cours — Sortlist"
		},
		{
			property: "og:description",
			content: "Liste des projets en cours de votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./agence.prospection-DXy4Ct-p.mjs");
var Route$12 = createFileRoute("/_authenticated/agence/prospection")({
	head: () => ({ meta: [
		{ title: "Prospection IA — Sortlist" },
		{
			name: "description",
			content: "Découvrez les prospects suggérés par l'IA, leur score d'intérêt et générez vos e-mails de contact."
		},
		{
			property: "og:title",
			content: "Prospection IA — Sortlist"
		},
		{
			property: "og:description",
			content: "Suggestions intelligentes de clients pour votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./agence.suspension-DRwW8LAr.mjs");
var Route$11 = createFileRoute("/_authenticated/agence/suspension")({
	head: () => ({ meta: [
		{ title: "Suspensions et litiges — Sortlist" },
		{
			name: "description",
			content: "Gérez les suspensions de projet, répondez aux signalements et consultez l'historique des litiges."
		},
		{
			property: "og:title",
			content: "Suspensions et litiges — Sortlist"
		},
		{
			property: "og:description",
			content: "Suivi des litiges et signalements côté agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./agence.tableau-de-bord-wM5S36WI.mjs");
var Route$10 = createFileRoute("/_authenticated/agence/tableau-de-bord")({
	head: () => ({ meta: [
		{ title: "Tableau de bord Agence — Sortlist" },
		{
			name: "description",
			content: "Suivez vos opportunités, vos projets en cours, votre score PQI et votre activité récente."
		},
		{
			property: "og:title",
			content: "Tableau de bord Agence — Sortlist"
		},
		{
			property: "og:description",
			content: "Aperçu de l'activité de votre agence sur Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./agence.workflow-Dtk9p042.mjs");
var Route$9 = createFileRoute("/_authenticated/agence/workflow")({
	head: () => ({ meta: [
		{ title: "Workflow des opportunités — Sortlist" },
		{
			name: "description",
			content: "Suivez chaque étape de traitement de vos opportunités : devis, négociation, signature."
		},
		{
			property: "og:title",
			content: "Workflow des opportunités — Sortlist"
		},
		{
			property: "og:description",
			content: "Étapes de traitement des opportunités de votre agence."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./client.agences-favorites-Cw6Qpp_w.mjs");
var Route$8 = createFileRoute("/_authenticated/client/agences-favorites")({
	head: () => ({ meta: [
		{ title: "Agences favorites — Sortlist" },
		{
			name: "description",
			content: "Retrouvez les agences que vous avez ajoutées à vos favoris."
		},
		{
			property: "og:title",
			content: "Agences favorites — Sortlist"
		},
		{
			property: "og:description",
			content: "Vos agences favorites, à recontacter pour un futur projet."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./client.collaborations-CVbrgw7P.mjs");
var Route$7 = createFileRoute("/_authenticated/client/collaborations")({
	head: () => ({ meta: [
		{ title: "Collaborations — Sortlist" },
		{
			name: "description",
			content: "Retrouvez les agences avec lesquelles vous avez des projets terminés, filtrez par période, note et budget."
		},
		{
			property: "og:title",
			content: "Collaborations — Sortlist"
		},
		{
			property: "og:description",
			content: "Agences avec lesquelles vous avez des projets terminés."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./client.mes-projets-D9t4I_3D.mjs");
var Route$6 = createFileRoute("/_authenticated/client/mes-projets")({
	head: () => ({ meta: [
		{ title: "Mes projets — Sortlist" },
		{
			name: "description",
			content: "Recherchez, filtrez et suivez l'ensemble de vos projets : brouillons, publiés, en cours et terminés."
		},
		{
			property: "og:title",
			content: "Mes projets — Sortlist"
		},
		{
			property: "og:description",
			content: "Suivez l'ensemble de vos projets sur Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./client.mon-profil-DBN6j35l.mjs");
var Route$5 = createFileRoute("/_authenticated/client/mon-profil")({
	head: () => ({ meta: [
		{ title: "Mon profil — Sortlist" },
		{
			name: "description",
			content: "Complétez les informations de votre entreprise et suivez votre score de confiance."
		},
		{
			property: "og:title",
			content: "Mon profil — Sortlist"
		},
		{
			property: "og:description",
			content: "Informations entreprise et score de confiance."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
objectType({
	contactLastName: stringType().trim().min(1, "Champ requis").max(80),
	contactFirstName: stringType().trim().min(1, "Champ requis").max(80),
	companyName: stringType().trim().min(1, "Champ requis").max(120),
	activitySector: stringType().trim().min(1, "Champ requis").max(120),
	country: stringType().trim().min(1, "Champ requis").max(80),
	legalIdType: stringType().trim().min(1, "Champ requis").max(80),
	legalIdValue: stringType().trim().min(1, "Champ requis").max(80)
});
var $$splitComponentImporter$4 = () => import("./client.notifications-C3Rjc_9J.mjs");
var Route$4 = createFileRoute("/_authenticated/client/notifications")({
	head: () => ({ meta: [
		{ title: "Historique des notifications — Sortlist" },
		{
			name: "description",
			content: "Consultez l'historique complet de vos notifications, filtrez par type et par statut."
		},
		{
			property: "og:title",
			content: "Historique des notifications — Sortlist"
		},
		{
			property: "og:description",
			content: "Centre de notifications de votre espace client."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./client.parametres-XD4saFha.mjs");
var Route$3 = createFileRoute("/_authenticated/client/parametres")({
	head: () => ({ meta: [
		{ title: "Paramètres — Sortlist" },
		{
			name: "description",
			content: "Gérez vos préférences d'affichage, vos notifications et votre mot de passe."
		},
		{
			property: "og:title",
			content: "Paramètres — Sortlist"
		},
		{
			property: "og:description",
			content: "Préférences et sécurité de votre compte client."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
objectType({
	currentPassword: stringType().min(1, "Champ requis").max(128),
	newPassword: stringType().min(8, "8 caractères minimum").max(128),
	confirmPassword: stringType().min(8, "8 caractères minimum").max(128)
}).refine((values) => values.newPassword === values.confirmPassword, {
	message: "Les mots de passe ne correspondent pas",
	path: ["confirmPassword"]
});
var $$splitComponentImporter$2 = () => import("./client.postuler-un-projet-aUw57i35.mjs");
var Route$2 = createFileRoute("/_authenticated/client/postuler-un-projet")({
	validateSearch: (search) => ({ resume: typeof search["resume"] === "string" ? search["resume"] : void 0 }),
	head: () => ({ meta: [
		{ title: "Postuler un projet — Sortlist" },
		{
			name: "description",
			content: "Déposez un nouveau projet : le Smart Briefing IA structure votre cahier des charges en cinq étapes."
		},
		{
			property: "og:title",
			content: "Postuler un projet — Sortlist"
		},
		{
			property: "og:description",
			content: "Déposez un nouveau projet et trouvez les meilleures agences."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./client.tableau-de-bord-CUXHUWwZ.mjs");
var Route$1 = createFileRoute("/_authenticated/client/tableau-de-bord")({
	head: () => ({ meta: [
		{ title: "Tableau de bord Client — Sortlist" },
		{
			name: "description",
			content: "Suivez votre score de confiance, vos projets publiés, votre taux de réponse et vos collaborations en cours."
		},
		{
			property: "og:title",
			content: "Tableau de bord Client — Sortlist"
		},
		{
			property: "og:description",
			content: "Aperçu de votre activité sur Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./client.mes-projets_._id-6OANKvnn.mjs");
var Route = createFileRoute("/_authenticated/client/mes-projets_/$id")({
	head: () => ({ meta: [
		{ title: "Détail du projet — Sortlist" },
		{
			name: "description",
			content: "Consultez le détail de votre projet : cahier des charges, shortlist d'agences recommandées et suivi des litiges."
		},
		{
			property: "og:title",
			content: "Détail du projet — Sortlist"
		},
		{
			property: "og:description",
			content: "Suivi complet d'un projet publié sur Sortlist."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$47.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$48
});
var AuthenticatedRouteRoute = Route$46.update({
	id: "/_authenticated",
	getParentRoute: () => Route$48
});
var AProposRoute = Route$45.update({
	id: "/a-propos",
	path: "/a-propos",
	getParentRoute: () => Route$48
});
var AgencesRoute = Route$44.update({
	id: "/agences",
	path: "/agences",
	getParentRoute: () => Route$48
});
var AideRoute = Route$43.update({
	id: "/aide",
	path: "/aide",
	getParentRoute: () => Route$48
});
var BlogRoute = Route$42.update({
	id: "/blog",
	path: "/blog",
	getParentRoute: () => Route$48
});
var CarrieresRoute = Route$41.update({
	id: "/carrieres",
	path: "/carrieres",
	getParentRoute: () => Route$48
});
var CommentCaMarcheRoute = Route$40.update({
	id: "/comment-ca-marche",
	path: "/comment-ca-marche",
	getParentRoute: () => Route$48
});
var ConnexionRoute = Route$39.update({
	id: "/connexion",
	path: "/connexion",
	getParentRoute: () => Route$48
});
var DevenirPartenaireRoute = Route$38.update({
	id: "/devenir-partenaire",
	path: "/devenir-partenaire",
	getParentRoute: () => Route$48
});
var EtudesRoute = Route$37.update({
	id: "/etudes",
	path: "/etudes",
	getParentRoute: () => Route$48
});
var GuidesRoute = Route$36.update({
	id: "/guides",
	path: "/guides",
	getParentRoute: () => Route$48
});
var InscriptionAgenceRoute = Route$35.update({
	id: "/inscription-agence",
	path: "/inscription-agence",
	getParentRoute: () => Route$48
});
var InscriptionClientRoute = Route$34.update({
	id: "/inscription-client",
	path: "/inscription-client",
	getParentRoute: () => Route$48
});
var PostulerUnProjetRoute = Route$33.update({
	id: "/postuler-un-projet",
	path: "/postuler-un-projet",
	getParentRoute: () => Route$48
});
var PresseRoute = Route$32.update({
	id: "/presse",
	path: "/presse",
	getParentRoute: () => Route$48
});
var ProjetsRoute = Route$31.update({
	id: "/projets",
	path: "/projets",
	getParentRoute: () => Route$48
});
var RessourcesRoute = Route$30.update({
	id: "/ressources",
	path: "/ressources",
	getParentRoute: () => Route$48
});
var ServicesRoute = Route$29.update({
	id: "/services",
	path: "/services",
	getParentRoute: () => Route$48
});
var TarifsRoute = Route$28.update({
	id: "/tarifs",
	path: "/tarifs",
	getParentRoute: () => Route$48
});
var AgencesIdRoute = Route$27.update({
	id: "/agences_/$id",
	path: "/agences/$id",
	getParentRoute: () => Route$48
});
var FonctionnalitesSlugRoute = Route$26.update({
	id: "/fonctionnalites/$slug",
	path: "/fonctionnalites/$slug",
	getParentRoute: () => Route$48
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAdminAvisRoute: Route$25.update({
		id: "/admin/avis",
		path: "/admin/avis",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAdminLitigesRoute: Route$24.update({
		id: "/admin/litiges",
		path: "/admin/litiges",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAdminNotificationsRoute: Route$23.update({
		id: "/admin/notifications",
		path: "/admin/notifications",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAdminTableauDeBordRoute: Route$22.update({
		id: "/admin/tableau-de-bord",
		path: "/admin/tableau-de-bord",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceAnalyticsRoute: Route$21.update({
		id: "/agence/analytics",
		path: "/agence/analytics",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceFacturationRoute: Route$20.update({
		id: "/agence/facturation",
		path: "/agence/facturation",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceInvitationsRoute: Route$19.update({
		id: "/agence/invitations",
		path: "/agence/invitations",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceMesProspectionsRoute: Route$18.update({
		id: "/agence/mes-prospections",
		path: "/agence/mes-prospections",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceNotificationsRoute: Route$17.update({
		id: "/agence/notifications",
		path: "/agence/notifications",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceOpportunitesRoute: Route$16.update({
		id: "/agence/opportunites",
		path: "/agence/opportunites",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceParametresRoute: Route$15.update({
		id: "/agence/parametres",
		path: "/agence/parametres",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceProfilRoute: Route$14.update({
		id: "/agence/profil",
		path: "/agence/profil",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceProjetsEnCoursRoute: Route$13.update({
		id: "/agence/projets-en-cours",
		path: "/agence/projets-en-cours",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceProspectionRoute: Route$12.update({
		id: "/agence/prospection",
		path: "/agence/prospection",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceSuspensionRoute: Route$11.update({
		id: "/agence/suspension",
		path: "/agence/suspension",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceTableauDeBordRoute: Route$10.update({
		id: "/agence/tableau-de-bord",
		path: "/agence/tableau-de-bord",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAgenceWorkflowRoute: Route$9.update({
		id: "/agence/workflow",
		path: "/agence/workflow",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientAgencesFavoritesRoute: Route$8.update({
		id: "/client/agences-favorites",
		path: "/client/agences-favorites",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientCollaborationsRoute: Route$7.update({
		id: "/client/collaborations",
		path: "/client/collaborations",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientMesProjetsRoute: Route$6.update({
		id: "/client/mes-projets",
		path: "/client/mes-projets",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientMonProfilRoute: Route$5.update({
		id: "/client/mon-profil",
		path: "/client/mon-profil",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientNotificationsRoute: Route$4.update({
		id: "/client/notifications",
		path: "/client/notifications",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientParametresRoute: Route$3.update({
		id: "/client/parametres",
		path: "/client/parametres",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientPostulerUnProjetRoute: Route$2.update({
		id: "/client/postuler-un-projet",
		path: "/client/postuler-un-projet",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientTableauDeBordRoute: Route$1.update({
		id: "/client/tableau-de-bord",
		path: "/client/tableau-de-bord",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedClientMesProjetsIdRoute: Route.update({
		id: "/client/mes-projets_/$id",
		path: "/client/mes-projets/$id",
		getParentRoute: () => AuthenticatedRouteRoute
	})
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AProposRoute,
	AgencesRoute,
	AideRoute,
	BlogRoute,
	CarrieresRoute,
	CommentCaMarcheRoute,
	ConnexionRoute,
	DevenirPartenaireRoute,
	EtudesRoute,
	GuidesRoute,
	InscriptionAgenceRoute,
	InscriptionClientRoute,
	PostulerUnProjetRoute,
	PresseRoute,
	ProjetsRoute,
	RessourcesRoute,
	ServicesRoute,
	TarifsRoute,
	AgencesIdRoute,
	FonctionnalitesSlugRoute
};
var routeTree = Route$48._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { Route$33 as a, Route$27 as i, Route as n, useThemeStore as o, Route$2 as r, router_exports as t };
