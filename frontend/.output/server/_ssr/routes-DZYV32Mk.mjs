import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { A as Scale, G as Megaphone, H as MessageSquare, I as Play, Jt as Ban, Mt as ChevronRight, N as Rocket, Nt as ChevronLeft, Qt as ArrowRight, R as Palette, Ut as Briefcase, _ as Target, a as Users, bt as Compass, c as UserRound, dt as FileText, et as LifeBuoy, i as Wallet, jt as CircleCheck, mt as Eye, o as UsersRound, st as Handshake, w as Shield, wt as ClipboardCheck, x as Sparkles, xt as CodeXml } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Footer } from "./Footer-ltp81XHe.mjs";
import { t as MarketingHeader } from "./MarketingHeader-CTcyVmuL.mjs";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-CwLzEEob.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DZYV32Mk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AUDIENCES = [
	{
		icon: UserRound,
		title: "Entreprises",
		description: "Trouvez l'agence parfaite pour vos projets."
	},
	{
		icon: Briefcase,
		title: "Agences",
		description: "Trouvez les projets qui correspondent à votre expertise."
	},
	{
		icon: Shield,
		title: "Sécurité",
		description: "Une collaboration transparente et en toute confiance."
	}
];
var TWO_ACTORS = [{
	icon: Rocket,
	title: "Vous êtes une entreprise",
	description: "Décrivez votre projet et trouvez les agences idéales.",
	points: [
		"Briefing guidé en quelques étapes",
		"Agences pré-qualifiées",
		"Recevez et comparez les propositions",
		"Choisissez votre partenaire"
	],
	ctaLabel: "Découvrir pour les entreprises",
	ctaTo: "/agences"
}, {
	icon: Users,
	title: "Vous êtes une agence",
	description: "Recevez des projets qualifiés et développez votre activité.",
	points: [
		"Opportunités ciblées",
		"Matching avec vos expertises",
		"Répondez aux projets",
		"Développez votre réseau"
	],
	ctaLabel: "Découvrir pour les agences",
	ctaTo: "/projets"
}];
var ADVANTAGES = [
	{
		icon: Target,
		title: "Matching intelligent",
		slug: "matching-intelligent",
		mockType: "score",
		description: "Notre IA analyse vos besoins et votre expertise pour vous proposer les meilleurs partenaires ou projets. Elle identifie les agences ou projets les plus pertinents en fonction de leur expertise, de leurs réalisations passées et de leur compatibilité avec vos critères.",
		benefits: [
			{
				title: "Des recommandations ultra-ciblées",
				description: "Recevez uniquement des suggestions pertinentes et alignées avec vos objectifs, sans avoir à trier des dizaines de profils non adaptés."
			},
			{
				title: "Gain de temps considérable",
				description: "Fini les recherches interminables : notre IA fait le travail pour vous et vous présente directement les meilleurs candidats."
			},
			{
				title: "Meilleure qualité de collaboration",
				description: "Connectez-vous avec les partenaires ou projets qui partagent vos valeurs, votre secteur et votre vision du travail."
			}
		],
		mock: [
			{
				label: "Agence A",
				value: "98%"
			},
			{
				label: "Agence B",
				value: "95%"
			},
			{
				label: "Agence C",
				value: "93%"
			}
		]
	},
	{
		icon: FileText,
		title: "Projets ciblés",
		slug: "projets-cibles",
		mockType: "cards",
		description: "Accédez à des projets qualifiés et pertinents, adaptés à vos compétences et à vos objectifs. Fini les candidatures envoyées à l'aveugle.",
		benefits: [
			{
				title: "Des projets réellement adaptés",
				description: "Chaque opportunité affichée correspond à votre secteur, votre expertise et votre budget de prédilection."
			},
			{
				title: "Moins de candidatures, plus de résultats",
				description: "Concentrez vos efforts sur les projets où vous avez de vraies chances d'être sélectionné."
			},
			{
				title: "Visibilité sur les critères clés",
				description: "Budget, délais, secteur d'activité : toutes les informations essentielles sont visibles avant de postuler."
			}
		],
		mock: [
			{
				label: "Refonte site web",
				value: "96%"
			},
			{
				label: "Campagne marketing",
				value: "94%"
			},
			{
				label: "Identité de marque",
				value: "91%"
			}
		]
	},
	{
		icon: Users,
		title: "Collaboration simplifiée",
		slug: "collaboration-simplifiee",
		mockType: "chat",
		description: "Outils intégrés pour gérer vos échanges, vos fichiers, et vos suivis de projet efficacement, du premier contact jusqu'à la livraison finale.",
		benefits: [
			{
				title: "Une communication centralisée",
				description: "Messages, fichiers et validations restent regroupés au même endroit, sans dispersion entre emails et outils tiers."
			},
			{
				title: "Un suivi de projet clair",
				description: "Visualisez l'avancement de chaque collaboration en un coup d'œil, avec des statuts toujours à jour."
			},
			{
				title: "Moins de friction, plus d'efficacité",
				description: "Les échanges répétitifs sont simplifiés grâce à des outils pensés pour le quotidien des équipes."
			}
		],
		mock: [
			{
				label: "Messages échangés",
				value: "24"
			},
			{
				label: "Fichiers partagés",
				value: "12"
			},
			{
				label: "Avancement du projet",
				value: "80%"
			}
		]
	},
	{
		icon: Ban,
		title: "Zéro frais de dépôt",
		slug: "zero-frais-de-depot",
		mockType: "price",
		description: "Aucun frais d'inscription ni frais de dépôt. Vous payez uniquement pour la réussite, sans mauvaise surprise ni engagement caché.",
		benefits: [
			{
				title: "Aucun coût à l'entrée",
				description: "Créer un compte, publier un projet ou parcourir les agences ne vous coûte rien, dès le premier jour."
			},
			{
				title: "Un modèle basé sur la réussite",
				description: "Vous n'êtes jamais facturé pour une mise en relation qui n'aboutit pas à une collaboration réelle."
			},
			{
				title: "Une tarification transparente",
				description: "Les conditions sont claires dès le départ, sans frais cachés ni clause surprise en cours de route."
			}
		],
		mock: [
			{
				label: "Frais d'inscription",
				value: "0€"
			},
			{
				label: "Frais de dépôt",
				value: "0€"
			},
			{
				label: "Commission",
				value: "sur réussite"
			}
		]
	}
];
var HOW_IT_WORKS = [
	{
		icon: ClipboardCheck,
		title: "Créez votre profil",
		description: "Renseignez vos informations, votre secteur et vos besoins en quelques minutes, sans engagement."
	},
	{
		icon: Sparkles,
		title: "Recevez des recommandations",
		description: "Notre algorithme identifie les agences ou projets les plus adaptés à votre profil et vos objectifs."
	},
	{
		icon: Handshake,
		title: "Collaborez en toute confiance",
		description: "Échangez, validez les étapes clés et suivez votre projet depuis un espace centralisé, jusqu'à la livraison."
	}
];
var COMMITMENTS = [
	{
		icon: Shield,
		title: "Sécurité",
		description: "Vos échanges et vos informations restent confidentiels, protégés à chaque étape de la collaboration."
	},
	{
		icon: Eye,
		title: "Transparence",
		description: "Aucune clause cachée : les conditions, les critères de sélection et les frais sont clairs dès le départ."
	},
	{
		icon: LifeBuoy,
		title: "Accompagnement",
		description: "Une équipe disponible pour vous guider, que vous soyez une entreprise ou une agence, à chaque étape."
	}
];
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
var COUNTRIES = [
	{
		name: "Algérie",
		viewBox: "922.6 328.9 126.8 128.9",
		d: "M1021 336.9l-3.6.4-2.2-1.5h-5.6l-4.9 2.6-2.7-1-8.7.5-8.9 1.2-5 2-3.4 2.6-5.7 1.2-5.1 3.5 2 4.1.3 3.9 1.8 6.7 1.4 1.4-1 2.5-7 1-2.5 2.4-3.1.5-.3 4.7-6.3 2.5-2.1 3.2-4.4 1.7-5.4 1-8.9 4.7-.1 7.5v.4l-.1 1.2 20.3 15.5 18.4 13.9 18.6 13.8 1.3 3 3.4 1.8 2.6 1.1.1 4 6.1-.6 7.8-2.8 15.8-12.5 18.6-12.2-2.5-4-4.3-2.9-2.6 1.2-2-3.6-.2-2.7-3.4-4.7 2.1-2.6-.5-4 .6-3.5-.5-2.9.9-5.2-.4-3-1.9-5.6-2.6-11.3-3.4-2.6v-1.5l-4.5-3.8-.6-4.8 3.2-3.6 1.1-5.3-1-6.2 1-3.3z"
	},
	{
		name: "Ghana",
		viewBox: "956.1 499.2 29.0 45.5",
		d: "M976.8 502.1l-2.6-.5-1.8 1-2.4-.5-9.7.3-.2 3.6.8 4.8 1.4 9.1-2.3 5.3-1.5 7.2 2.4 5.5-.2 2.5 5 1.8 5-1.9 3.2-2.1 8.7-3.8-1.2-2.2-1.5-4-.4-3.2 1.2-5.7-1.4-2.3-.6-5.1.1-4.6-2.4-3.3.4-1.9z"
	},
	{
		name: "Cameroun",
		viewBox: "1020.1 486.0 50.8 79.4",
		d: "M1060.1 502.9l.2-4.3-.5-4.2-2.2-4.1-1.6.4-.2 2 2.3 2.6-.6 1.1-.3 2.1-4.6 5-1.5 4-.7 3.3-1.2 1.4-1.1 4.5-3 2.6-.8 3.2-1.2 2.6-.5 2.6-3.9 2.2-3.2-2.6-2.1.1-3.3 3.7-1.6.1-2.7 6.1-1.4 4.5v1.8l1.4.9 1.1 2.8 2.6 1.1 2.2 4.2-.8 5 9.2.2 2.6-.4 3.4.8 3.4-.8.7.3 7.1.3 4.5 1.7 4.5 1.5.4-3.5-.6-1.8-.3-2.9-2.6-2.1-2.1-3.2-.5-2.3-2.6-3.3.4-1.9-.6-2.7.4-5 1.4-1.1 2.7-6.5.9-1.7-1.8-4.4-.8-2.6-2.5-1.1-3.3-3.7 1.2-3 2.5.6 1.6-.4 3.1.1-3.1-5.8z"
	},
	{
		name: "Éthiopie",
		viewBox: "1156.4 472.0 93.1 83.4",
		d: "M1187.6 477l-1.5 4.7-6.5-1.3-.7 5.5-2.1 6.2-3.2 3.2-2.3 4.8-.5 2.6-2.6 1.8-1.4 6.7v.7l.2 5-.8 2-3 .1-1.8 3.6 3.4.5 2.9 3.1 1 2.5 2.6 1.5 3.5 6.9 2.9 1.1v3.6l2 2.1h3.9l7.2 5.4h1.8l1.3-.1 1.2.7 3.8.5 1.6-2.7 5.1-2.6 2.3 2.1h3.8l1.5-2 3.6-.1 4.9-4.5 7.4-.3 15.4-19.1-4.8.1-18.5-7.6-2.2-2.2-2.1-3.1-2.2-3.5 1.1-2.3-1.3-1.1-1.3.5-3.1-.1-.2-2-.5-1.7 1.8-3 1.9-2.8-2-2.1-2.5-3.7-2.5-2.1-1.6-2.2-4.9-2.5-3.9-.1-1.4-1.3-3.2 1.5-3.5-2.9z"
	},
	{
		name: "Afrique du Sud",
		viewBox: "1059.9 707.3 101.0 91.8",
		d: "M1148.2 713.7l-2.9-.6-1.9.8-2.6-1.1-2.2-.1-8 4.7-5.2 4.7-2 4.3-1.7 2.4-3 .5-1.2 3-.6 2-3.6 1.5-4.4-.3-2.5-1.8-2.3-.8-2.7 1.5-1.5 3.1-2.7 1.9-2.8 2.8-4 .7-1.1-2.3.7-3.8-3-6.1-1.4-1-1.1 23.6-5 3.2-2.9.5-3.3-1.2-2.4-.5-.8-2.7-2.1-1.8-2.7 3.2 3.5 8.2v.1l2.5 5.3 3.2 6-.2 4.8-1.7 1.2 1.4 4.2-.2 3.8.6 1.7.3-.9 2.1 2.9 1.8.1 2.1 2.3 2.4-.2 3.5-2.4 4.6-1 5.6-2.5 2.2.3 3.3-.8 5.7 1.2 2.7-1.2 3.2 1 .8-1.8 2.7-.3 5.8-2.5 4.3-2.9 4.1-3.8 6.7-6.5 3.4-4.6 1.8-3.2 2.5-3.3 1.2-.9 3.9-3.2 1.6-2.9 1.1-5.2 1.7-4.7h-4.1l-1.3 2.8-3.3.7-3-3.5.1-2.2 1.6-2.4.7-1.8 1.6-.5 2.7 1.2-.4-2.3 1.4-7.1-1.1-4.5-2.2-9zm-20.1 52.8l-2 .6-3.7-4.9 3.2-4 3.1-2.5 2.6-1.3 2.3 2 1.7 1.9-1.9 3.1-1.1 2.1-3.1 1-1.1 2z"
	},
	{
		name: "Maroc",
		viewBox: "877.5 339.1 98.7 102.3",
		d: "M965.2 348.4l-2.3-.1-5.5-1.4-5 .4-3.1-2.7h-3.9l-1.8 3.9-3.7 6.7-4 2.6-5.4 2.9-3.5 4.3-.9 3.4-2.1 5.4 1.1 7.9-4.7 5.3-2.7 1.7-4.4 4.4-5.1.7-2.8 2.4-.1.1-3.6 6.5-3.7 2.3-2.1 4-.2 3.3-1.6 3.8-1.9 1-3.1 4-2 4.5.3 2.2-1.9 3.3-2.2 1.7-.3 3h.1l12.4-.5.7-2.3 2.3-2.9 2-8.8 7.8-6.8 2.8-8.1 1.7-.4 1.9-5 4.6-.7 1.9.9h2.5l1.8-1.5 3.4-.2-.1-3.4h.8l.1-7.5 8.9-4.7 5.4-1 4.4-1.7 2.1-3.2 6.3-2.5.3-4.7 3.1-.5 2.5-2.4 7-1 1-2.5-1.4-1.4-1.8-6.7-.3-3.9-2-4.1z"
	},
	{
		name: "Sénégal",
		viewBox: "876.6 464.6 38.2 31.2",
		d: "M908.9 479.2l-3.6-4.4-3.2-4.7-3.7-1.7-2.6-1.8h-3.1l-2.8 1.4-2.7-.5-2 2-1.3 3.3-2.8 4.4-2.5 1.2 2.7 2.3 2.2 5 6.1-.2 1.3-1.5 1.8-.1 2.1 1.5 1.8.1 1.8-1.1 1.1 1.8-2.4 1.5-2.4-.1-2.4-1.4-2.1 1.5h-1l-1.4.9-5-.1.8 4.9 3-1.1 1.8.2 1.5-.7 10.3.3 2.7.1 4 1.5 1.3-.1.4-.7 3 .5.8-.4.3-2-.4-2.4-2.1-1.8-1.1-3.7-.2-3.9z"
	},
	{
		name: "Côte d'Ivoire",
		viewBox: "926.1 502.8 38.5 44.1",
		d: "M946.5 506.2l-2.3.9-1.3.8-.9-2.7-1.6.7-1-.1-1 1.9-4.3-.1-1.6-1-.7.6-1.1.5-.5 2.2 1.3 2.6 1.3 5.1-2 .8-.6.9.4 1.2-.3 2.8h-.9l-.3 1.8.6 3.1-1.2 2.8 1.6 1.8 1.8.4 2.3 2.7.2 2.5-.5.8-.5 5.2 1.1.2 5.6-2.4 3.9-1.8 6.6-1.1 3.6-.1 3.9 1.3 2.6-.1.2-2.5-2.4-5.5 1.5-7.2 2.3-5.3-1.4-9.1-3.8-1.6-2.7.2-1.9 1.6-2.5-1.3-1-2.1-2.5-1.4z"
	},
	{
		name: "Égypte",
		viewBox: "1105.7 367.0 78.0 69.4",
		d: "M1129.7 374.8l-5.5-1.9-5.3-1.7-7.1.2-1.8 3 1.1 2.7-1.2 3.9 2 5.1 1.3 22.7 1 23.4h65.3l-1-1.3-6.8-5.7-.4-4.2 1-1.1-5.3-7-2-3.6-2.3-3.5-4.8-9.9-3.9-6.4-2.8-6.7.5-.6 4.6 9.1 2.7 2.9 2 2 1.2-1.1 1.2-3.3.7-4.8 1.3-2.5-.7-1.7-3.9-9.2-2.5 1.6-4.2-.4-4.4-1.5-1.1 2.1-1.7-3.2-3.9-.8-4.7.6-2.1 1.8-3.9 2-2.6-1z"
	},
	{
		name: "Nigeria",
		viewBox: "987.8 479.9 74.3 69.3",
		d: "M1055.8 492.7l-1 .2-3.9-7-1.3-.2-4.3 3.5-4.3-1.8-3-.4-1.6.9-3.3-.2-3.3 2.7-2.8.2-6.8-3.3-2.6 1.5-2.9-.1-2.1-2.4-5.6-2.4-6 .8-1.4 1.4-.8 3.6-1.6 2.6-.3 5.7-.2 2.1 1.2 3.8-1.1 2.5.6 1.7-2.7 4-1.7 1.9-1 4 .1 4.1-.3 10.2h9.2l3.9 4.2 1.9 4.6 3 3.9 4.5.2 2.2-1.4 2.1.3 5.8-2.3 1.4-4.5 2.7-6.1 1.6-.1 3.3-3.7 2.1-.1 3.2 2.6 3.9-2.2.5-2.6 1.2-2.6.8-3.2 3-2.6 1.1-4.5 1.2-1.4.7-3.3 1.5-4 4.6-5 .3-2.1.6-1.1-2.3-2.6z"
	},
	{
		name: "Tunisie",
		viewBox: "1014.0 331.6 26.7 50.4",
		d: "M1038 361.4l-2-1-1.5-3-2.8-.1-1.1-3.5 3.4-3.2.5-5.6-1.9-1.6-.1-3 2.5-3.2-.4-1.3-4.4 2.4.1-3.3-3.7-.7-5.6 2.6-1 3.3 1 6.2-1.1 5.3-3.2 3.6.6 4.8 4.5 3.8v1.5l3.4 2.6 2.6 11.3 2.6-1.4.4-2.7-.7-2.6 3.7-2.5 1.5-2 2.6-1.8.1-4.9z"
	},
	{
		name: "Kenya",
		viewBox: "1163.3 533.2 52.3 72.6",
		d: "M1211.7 547.2h-3.8l-2.3-2.1-5.1 2.6-1.6 2.7-3.8-.5-1.2-.7-1.3.1h-1.8l-7.2-5.4h-3.9l-2-2.1v-3.6l-2.9-1.1-3.8 4.2-3.4 3.8 2.7 4.4.7 3.2 2.6 7.3-2.1 4.7-2.7 4.2-1.6 2.6v.3l1.4 2.4-.4 4.7 20.2 13 .4 3.7 8 6.3 2.2-2.1 1.2-4.2 1.8-2.6.9-4.5 2.1-.4 1.4-2.7 4-2.5-3.3-5.3-.2-23.2 4.8-7.2z"
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
function HomePage() {
	const [openDemoSlug, setOpenDemoSlug] = (0, import_react.useState)(null);
	const countriesScrollRef = (0, import_react.useRef)(null);
	const demoFeature = ADVANTAGES.find((item) => item.slug === openDemoSlug) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketingHeader, { variant: "landing" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "pt-16 text-center sm:pt-20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mx-auto max-w-[640px] text-[38px] font-bold leading-[1.15] tracking-tight sm:text-[46px]",
								children: "La plateforme B2B qui connecte vos projets aux meilleures agences."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mx-auto mt-5 max-w-[520px] text-[15px] leading-6 text-foreground",
								children: "Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins. Que vous soyez une entreprise ou une agence, Sortlist simplifie chaque étape."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-8 flex justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/inscription-client",
									className: "inline-flex items-center rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
									children: "Créer mon compte gratuitement"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto mt-12 grid max-w-[880px] grid-cols-1 gap-8 text-left sm:grid-cols-3",
								children: AUDIENCES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg border border-border p-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
										className: "mt-0.5 h-[22px] w-[22px] shrink-0",
										strokeWidth: 1.6
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-[14px] font-bold",
											children: item.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[13.5px] leading-[1.45] text-muted-foreground",
											children: item.description
										})]
									})]
								}, item.title))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg bg-muted/30 py-16",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-center text-[16px] font-bold",
							children: "Une plateforme, deux acteurs."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2",
							children: TWO_ACTORS.map((actor) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-6 sm:p-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(actor.icon, {
										className: "h-6 w-6",
										strokeWidth: 1.6
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-4 text-[16px] font-bold",
										children: actor.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-[13.5px] leading-[1.5] text-muted-foreground",
										children: actor.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-5 space-y-2.5",
										children: actor.points.map((point) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-center gap-2 text-[13px]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
												className: "h-[15px] w-[15px] shrink-0",
												strokeWidth: 1.8
											}), point]
										}, point))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: actor.ctaTo,
										className: "mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-accent",
										children: [actor.ctaLabel, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
											className: "h-3.5 w-3.5",
											strokeWidth: 2
										})]
									})
								]
							}, actor.title))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "pt-20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-center text-[16px] font-bold",
							children: "Pourquoi choisir Sortlist ?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mt-12 grid grid-cols-2 gap-y-10 sm:grid-cols-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-[12.5%] right-[12.5%] top-[18px] hidden border-t border-dashed border-border sm:block" }), ADVANTAGES.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "#" + item.slug,
								className: "flex flex-col items-center text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
											className: "h-4 w-4",
											strokeWidth: 1.6
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-3 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background",
										children: String(index + 1).padStart(2, "0")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-3 text-[13.5px] font-bold",
										children: item.title
									})
								]
							}, item.title))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: ADVANTAGES[0].slug,
						className: "scroll-mt-8 pt-20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureDetail, {
							feature: ADVANTAGES[0],
							index: 0,
							onDemo: () => setOpenDemoSlug(ADVANTAGES[0].slug)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "comment-ca-marche",
						className: "scroll-mt-8 pt-20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-center text-[16px] font-bold",
							children: "Comment ça marche ?"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3",
							children: HOW_IT_WORKS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(step.icon, {
											className: "h-5 w-5",
											strokeWidth: 1.6
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-4 text-[13px] font-semibold text-muted-foreground",
										children: ["Étape ", index + 1]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-1 text-[15px] font-bold",
										children: step.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mx-auto mt-2 max-w-[260px] text-[13.5px] leading-[1.5] text-muted-foreground",
										children: step.description
									})
								]
							}, step.title))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: ADVANTAGES[1].slug,
						className: "scroll-mt-8 pt-20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureDetail, {
							feature: ADVANTAGES[1],
							index: 1,
							onDemo: () => setOpenDemoSlug(ADVANTAGES[1].slug)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "pt-20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-center text-[16px] font-bold",
							children: "Nos engagements"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3",
							children: COMMITMENTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
										className: "h-6 w-6",
										strokeWidth: 1.6
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "mt-4 text-[15px] font-bold",
										children: item.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-[13.5px] leading-[1.5] text-muted-foreground",
										children: item.description
									})
								]
							}, item.title))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: ADVANTAGES[2].slug,
						className: "scroll-mt-8 pt-20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureDetail, {
							feature: ADVANTAGES[2],
							index: 2,
							onDemo: () => setOpenDemoSlug(ADVANTAGES[2].slug)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "overflow-hidden pt-20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-center text-[16px] font-bold",
								children: "Des secteurs variés"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mx-auto mt-3 max-w-[440px] text-center text-[13.5px] leading-[1.5] text-muted-foreground",
								children: "Quel que soit votre domaine d'activité, trouvez une agence spécialisée qui comprend vos enjeux."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative mt-10 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "animate-scroll-horizontal flex w-max gap-5",
									children: [...SECTORS, ...SECTORS].map((sector, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex w-[220px] shrink-0 flex-col rounded-lg border border-border p-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(sector.icon, {
												className: "h-6 w-6",
												strokeWidth: 1.6
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "mt-4 text-[14px] font-bold",
												children: sector.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-[12.5px] leading-[1.5] text-muted-foreground",
												children: sector.description
											})
										]
									}, sector.title + index))
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: ADVANTAGES[3].slug,
						className: "scroll-mt-8 pt-20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureDetail, {
							feature: ADVANTAGES[3],
							index: 3,
							onDemo: () => setOpenDemoSlug(ADVANTAGES[3].slug)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "pt-16",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-center text-[16px] font-bold",
								children: "Présent partout où vous en avez besoin"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mx-auto mt-3 max-w-[440px] text-center text-[13.5px] leading-[1.5] text-muted-foreground",
								children: "Trouvez des agences et des projets dans plusieurs pays d'Afrique."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative mt-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => countriesScrollRef.current?.scrollBy({
											left: -220,
											behavior: "smooth"
										}),
										"aria-label": "Défiler vers la gauche",
										className: "absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent sm:flex",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
											className: "h-4 w-4",
											strokeWidth: 1.8
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										ref: countriesScrollRef,
										className: "flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
										children: COUNTRIES.map((country) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex w-[160px] shrink-0 flex-col items-center rounded-lg border border-border p-5 text-center",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "flex h-12 w-12 items-center justify-center rounded-full bg-muted",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
														viewBox: country.viewBox,
														className: "h-6 w-6",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
															d: country.d,
															fill: "currentColor"
														})
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "mt-3 text-[14px] font-bold",
													children: country.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: "Page à venir",
													className: "mt-3 cursor-not-allowed text-[12px] font-semibold text-muted-foreground/50",
													children: "Découvrir →"
												})
											]
										}, country.name))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => countriesScrollRef.current?.scrollBy({
											left: 220,
											behavior: "smooth"
										}),
										"aria-label": "Défiler vers la droite",
										className: "absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent sm:flex",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
											className: "h-4 w-4",
											strokeWidth: 1.8
										})
									})
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "my-20 grid grid-cols-1 gap-10 rounded-lg bg-foreground p-10 text-background sm:p-16 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-12 w-12 items-center justify-center rounded-full border border-background/25",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rocket, {
							className: "h-5 w-5",
							strokeWidth: 1.6
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-6 text-[26px] font-bold leading-[1.25] tracking-tight sm:text-[32px]",
						children: "Prêt à trouver l'agence ou le projet idéal ?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-[440px] text-[14px] leading-[1.6] text-background/70",
						children: "Créez votre compte gratuitement et découvrez des recommandations adaptées à vos besoins en quelques minutes."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-wrap items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/inscription-client",
							className: "inline-flex items-center gap-2 rounded-md bg-background px-6 py-3 text-[14px] font-semibold text-foreground transition-opacity hover:opacity-90",
							children: ["Créer mon compte gratuitement", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "h-3.5 w-3.5",
								strokeWidth: 2
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/connexion",
							className: "inline-flex items-center rounded-md border border-background/30 px-6 py-3 text-[14px] font-semibold text-background transition-colors hover:bg-background/10",
							children: "Se connecter"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] font-medium text-background/70",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), "Gratuit"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), "Sans engagement"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
									className: "h-3.5 w-3.5",
									strokeWidth: 1.8
								}), "Sans frais cachés"]
							})
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-background/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0",
					children: HOW_IT_WORKS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: index === 0 ? "flex gap-4 pb-6" : "flex gap-4 border-t border-background/15 py-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-background/25 text-[12px] font-semibold",
							children: index + 1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-[14px] font-bold",
								children: step.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 text-[12.5px] leading-[1.5] text-background/60",
								children: step.description
							})]
						})]
					}, step.title))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: demoFeature !== null,
				onOpenChange: (open) => !open && setOpenDemoSlug(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-[640px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-[16px] font-bold",
						children: demoFeature?.title
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative overflow-hidden rounded-lg border border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border p-4 md:border-b-0 md:border-r",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[14px] font-bold tracking-tight",
									children: "Sortlist"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
									className: "mt-4 space-y-2.5",
									children: DEMO_NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center gap-2 text-[12.5px] font-medium",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3 w-3 rounded-sm border border-border" }), item]
									}, item))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[13px] font-bold",
										children: demoFeature?.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 truncate text-[12px] text-muted-foreground",
										children: "Nous avons trouvé 0 agences correspondant à vos critères"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 })
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/connexion",
							"aria-label": "Se connecter pour lancer la démonstration",
							className: "absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "h-4 w-4 fill-current",
								strokeWidth: 0
							})
						})]
					})]
				})
			})
		]
	});
}
function FeatureDetail({ feature, index, onDemo }) {
	const number = String(index + 1).padStart(2, "0");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-lg border border-border p-6 sm:p-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-8 lg:flex-row lg:gap-12" + (index % 2 === 1 ? " lg:flex-row-reverse" : ""),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:w-[45%]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[36px] font-bold leading-none text-muted-foreground/30",
							children: number
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(feature.icon, {
							className: "h-6 w-6",
							strokeWidth: 1.6
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-5 text-[24px] font-bold tracking-tight",
						children: feature.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-[14px] leading-[1.65] text-foreground",
						children: feature.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 overflow-hidden rounded-lg border border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full border border-border" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full border border-border" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full border border-border" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
									children: feature.title
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureMock, { feature })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onDemo,
						className: "mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
							className: "h-3.5 w-3.5 fill-current",
							strokeWidth: 0
						}), "Voir la démo"]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-1 flex-col justify-center gap-6 border-t border-border pt-8 text-center lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0",
				children: feature.benefits.map((benefit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
							className: "h-[18px] w-[18px]",
							strokeWidth: 1.6
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 text-[14px] font-bold",
							children: benefit.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-[13px] leading-[1.5] text-muted-foreground",
							children: benefit.description
						})
					]
				}, benefit.title))
			})]
		})
	});
}
function FeatureMock({ feature }) {
	if (feature.mockType === "score") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3",
		children: feature.mock.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between text-[12.5px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted-foreground",
				children: row.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-semibold",
				children: row.value
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full rounded-full bg-foreground",
				style: { width: row.value }
			})
		})] }, row.label))
	});
	if (feature.mockType === "cards") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2.5",
		children: feature.mock.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between rounded-md border border-border px-3 py-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex h-8 w-8 items-center justify-center rounded-md bg-muted text-[11px] font-bold",
					children: row.label.charAt(0)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[13px] font-medium",
					children: row.label
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold",
				children: [row.value, " match"]
			})]
		}, row.label))
	});
	if (feature.mockType === "chat") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-2.5",
		children: feature.mock.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2.5 " + (index % 2 === 1 ? "flex-row-reverse text-right" : ""),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold",
				children: index % 2 === 1 ? "V" : "A"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-border px-3 py-2 text-[12.5px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: row.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 text-muted-foreground",
					children: row.value
				})]
			})]
		}, row.label))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
			children: feature.mock[0].label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-[28px] font-bold tracking-tight",
			children: feature.mock[0].value
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 divide-y divide-border border-t border-border",
			children: feature.mock.slice(1).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between py-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[13px] text-muted-foreground",
					children: row.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[13px] font-semibold",
					children: row.value
				})]
			}, row.label))
		})
	] });
}
//#endregion
export { HomePage as component };
