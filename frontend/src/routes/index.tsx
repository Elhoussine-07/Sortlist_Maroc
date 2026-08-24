import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Ban,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Handshake,
  LifeBuoy,
  Compass,
  Code2,
  Megaphone,
  MessageSquare,
  Palette,
  Play,
  Scale,
  Users2,
  Wallet,
  Rocket,
  Shield,
  Sparkles,
  Target,
  UserRound,
  Users,
  Star,
  Zap,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { StackSkeleton } from "@/components/common/Skeletons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sortlist — La plateforme B2B projets & agences" },
      {
        name: "description",
        content:
          "Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins. Sortlist simplifie chaque étape.",
      },
      {
        property: "og:title",
        content: "Sortlist — La plateforme B2B projets & agences",
      },
      {
        property: "og:description",
        content:
          "Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins.",
      },
    ],
  }),
  component: HomePage,
});

const AUDIENCES = [
  {
    icon: UserRound,
    title: "Entreprises",
    description: "Trouvez l'agence parfaite pour vos projets.",
  },
  {
    icon: Briefcase,
    title: "Agences",
    description: "Trouvez les projets qui correspondent à votre expertise.",
  },
  {
    icon: Shield,
    title: "Sécurité",
    description: "Une collaboration transparente et en toute confiance.",
  },
];

const TWO_ACTORS = [
  {
    icon: Rocket,
    title: "Vous êtes une entreprise",
    description: "Décrivez votre projet et trouvez les agences idéales.",
    points: [
      "Briefing guidé en quelques étapes",
      "Agences pré-qualifiées",
      "Recevez et comparez les propositions",
      "Choisissez votre partenaire",
    ],
    ctaLabel: "Découvrir pour les entreprises",
    ctaTo: "/agences",
    color: "border-blue-200/50 hover:border-blue-400",
  },
  {
    icon: Users,
    title: "Vous êtes une agence",
    description: "Recevez des projets qualifiés et développez votre activité.",
    points: [
      "Opportunités ciblées",
      "Matching avec vos expertises",
      "Répondez aux projets",
      "Développez votre réseau",
    ],
    ctaLabel: "Découvrir pour les agences",
    ctaTo: "/projets",
    color: "border-emerald-200/50 hover:border-emerald-400",
  },
];

type NonEmptyArray<T> = readonly [T, ...T[]];

type Advantage = {
  icon: LucideIcon;
  title: string;
  slug: string;
  mockType: "score" | "cards" | "chat" | "price";
  description: string;
  benefits: NonEmptyArray<{
    title: string;
    description: string;
  }>;
  mock: NonEmptyArray<{
    label: string;
    value: string;
  }>;
};

const ADVANTAGES = [
  {
    icon: Target,
    title: "Matching intelligent",
    slug: "matching-intelligent",
    mockType: "score",
    description:
      "Notre IA analyse vos besoins et votre expertise pour vous proposer les meilleurs partenaires ou projets. Elle identifie les agences ou projets les plus pertinents en fonction de leur expertise, de leurs réalisations passées et de leur compatibilité avec vos critères.",
    benefits: [
      {
        title: "Des recommandations ultra-ciblées",
        description:
          "Recevez uniquement des suggestions pertinentes et alignées avec vos objectifs, sans avoir à trier des dizaines de profils non adaptés.",
      },
      {
        title: "Gain de temps considérable",
        description:
          "Fini les recherches interminables : notre IA fait le travail pour vous et vous présente directement les meilleurs candidats.",
      },
      {
        title: "Meilleure qualité de collaboration",
        description:
          "Connectez-vous avec les partenaires ou projets qui partagent vos valeurs, votre secteur et votre vision du travail.",
      },
    ],
    mock: [
      { label: "Agence A", value: "98%" },
      { label: "Agence B", value: "95%" },
      { label: "Agence C", value: "93%" },
    ],
  },
  {
    icon: FileText,
    title: "Projets ciblés",
    slug: "projets-cibles",
    mockType: "cards",
    description:
      "Accédez à des projets qualifiés et pertinents, adaptés à vos compétences et à vos objectifs. Fini les candidatures envoyées à l'aveugle.",
    benefits: [
      {
        title: "Des projets réellement adaptés",
        description:
          "Chaque opportunité affichée correspond à votre secteur, votre expertise et votre budget de prédilection.",
      },
      {
        title: "Moins de candidatures, plus de résultats",
        description:
          "Concentrez vos efforts sur les projets où vous avez de vraies chances d'être sélectionné.",
      },
      {
        title: "Visibilité sur les critères clés",
        description:
          "Budget, délais, secteur d'activité : toutes les informations essentielles sont visibles avant de postuler.",
      },
    ],
    mock: [
      { label: "Refonte site web", value: "96%" },
      { label: "Campagne marketing", value: "94%" },
      { label: "Identité de marque", value: "91%" },
    ],
  },
  {
    icon: Users,
    title: "Collaboration simplifiée",
    slug: "collaboration-simplifiee",
    mockType: "chat",
    description:
      "Outils intégrés pour gérer vos échanges, vos fichiers, et vos suivis de projet efficacement, du premier contact jusqu'à la livraison finale.",
    benefits: [
      {
        title: "Une communication centralisée",
        description:
          "Messages, fichiers et validations restent regroupés au même endroit, sans dispersion entre emails et outils tiers.",
      },
      {
        title: "Un suivi de projet clair",
        description:
          "Visualisez l'avancement de chaque collaboration en un coup d'œil, avec des statuts toujours à jour.",
      },
      {
        title: "Moins de friction, plus d'efficacité",
        description:
          "Les échanges répétitifs sont simplifiés grâce à des outils pensés pour le quotidien des équipes.",
      },
    ],
    mock: [
      { label: "Messages échangés", value: "24" },
      { label: "Fichiers partagés", value: "12" },
      { label: "Avancement du projet", value: "80%" },
    ],
  },
  {
    icon: Ban,
    title: "Zéro frais de dépôt",
    slug: "zero-frais-de-depot",
    mockType: "price",
    description:
      "Aucun frais d'inscription ni frais de dépôt. Vous payez uniquement pour la réussite, sans mauvaise surprise ni engagement caché.",
    benefits: [
      {
        title: "Aucun coût à l'entrée",
        description:
          "Créer un compte, publier un projet ou parcourir les agences ne vous coûte rien, dès le premier jour.",
      },
      {
        title: "Un modèle basé sur la réussite",
        description:
          "Vous n'êtes jamais facturé pour une mise en relation qui n'aboutit pas à une collaboration réelle.",
      },
      {
        title: "Une tarification transparente",
        description:
          "Les conditions sont claires dès le départ, sans frais cachés ni clause surprise en cours de route.",
      },
    ],
    mock: [
      { label: "Frais d'inscription", value: "0€" },
      { label: "Frais de dépôt", value: "0€" },
      { label: "Commission", value: "sur réussite" },
    ],
  },
] satisfies readonly [Advantage, Advantage, Advantage, Advantage];

const HOW_IT_WORKS = [
  {
    icon: ClipboardCheck,
    title: "Créez votre profil",
    description:
      "Renseignez vos informations, votre secteur et vos besoins en quelques minutes, sans engagement.",
    step: "01",
  },
  {
    icon: Sparkles,
    title: "Recevez des recommandations",
    description:
      "Notre algorithme identifie les agences ou projets les plus adaptés à votre profil et vos objectifs.",
    step: "02",
  },
  {
    icon: Handshake,
    title: "Collaborez en toute confiance",
    description:
      "Échangez, validez les étapes clés et suivez votre projet depuis un espace centralisé, jusqu'à la livraison.",
    step: "03",
  },
];

const COMMITMENTS = [
  {
    icon: Shield,
    title: "Sécurité",
    description:
      "Vos échanges et vos informations restent confidentiels, protégés à chaque étape de la collaboration.",
    color: "border-blue-200/50 hover:border-blue-400",
  },
  {
    icon: Eye,
    title: "Transparence",
    description:
      "Aucune clause cachée : les conditions, les critères de sélection et les frais sont clairs dès le départ.",
    color: "border-emerald-200/50 hover:border-emerald-400",
  },
  {
    icon: LifeBuoy,
    title: "Accompagnement",
    description:
      "Une équipe disponible pour vous guider, que vous soyez une entreprise ou une agence, à chaque étape.",
    color: "border-purple-200/50 hover:border-purple-400",
  },
];

const SECTORS = [
  {
    icon: Megaphone,
    title: "Marketing digital",
    description: "SEO, publicité en ligne, réseaux sociaux et stratégie de contenu.",
  },
  {
    icon: Code2,
    title: "Développement web",
    description: "Sites vitrines, applications sur mesure et plateformes e-commerce.",
  },
  {
    icon: Palette,
    title: "Design & branding",
    description: "Identité visuelle, UX/UI et design de produits digitaux.",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    description: "Relations presse, événementiel et communication de marque.",
  },
  {
    icon: Scale,
    title: "Juridique",
    description: "Conseil juridique, contrats et conformité pour votre activité.",
  },
  {
    icon: Wallet,
    title: "Finance & comptabilité",
    description: "Gestion comptable, fiscalité et pilotage financier.",
  },
  {
    icon: Users2,
    title: "Ressources humaines",
    description: "Recrutement, formation et gestion des talents.",
  },
  {
    icon: Compass,
    title: "Conseil en stratégie",
    description: "Accompagnement stratégique pour structurer votre croissance.",
  },
];

const COUNTRIES = [
  { name: "Algérie", viewBox: "922.6 328.9 126.8 128.9", d: "M1021 336.9l-3.6.4-2.2-1.5h-5.6l-4.9 2.6-2.7-1-8.7.5-8.9 1.2-5 2-3.4 2.6-5.7 1.2-5.1 3.5 2 4.1.3 3.9 1.8 6.7 1.4 1.4-1 2.5-7 1-2.5 2.4-3.1.5-.3 4.7-6.3 2.5-2.1 3.2-4.4 1.7-5.4 1-8.9 4.7-.1 7.5v.4l-.1 1.2 20.3 15.5 18.4 13.9 18.6 13.8 1.3 3 3.4 1.8 2.6 1.1.1 4 6.1-.6 7.8-2.8 15.8-12.5 18.6-12.2-2.5-4-4.3-2.9-2.6 1.2-2-3.6-.2-2.7-3.4-4.7 2.1-2.6-.5-4 .6-3.5-.5-2.9.9-5.2-.4-3-1.9-5.6-2.6-11.3-3.4-2.6v-1.5l-4.5-3.8-.6-4.8 3.2-3.6 1.1-5.3-1-6.2 1-3.3z" },
  { name: "Maroc", viewBox: "877.5 339.1 98.7 102.3", d: "M965.2 348.4l-2.3-.1-5.5-1.4-5 .4-3.1-2.7h-3.9l-1.8 3.9-3.7 6.7-4 2.6-5.4 2.9-3.5 4.3-.9 3.4-2.1 5.4 1.1 7.9-4.7 5.3-2.7 1.7-4.4 4.4-5.1.7-2.8 2.4-.1.1-3.6 6.5-3.7 2.3-2.1 4-.2 3.3-1.6 3.8-1.9 1-3.1 4-2 4.5.3 2.2-1.9 3.3-2.2 1.7-.3 3h.1l12.4-.5.7-2.3 2.3-2.9 2-8.8 7.8-6.8 2.8-8.1 1.7-.4 1.9-5 4.6-.7 1.9.9h2.5l1.8-1.5 3.4-.2-.1-3.4h.8l.1-7.5 8.9-4.7 5.4-1 4.4-1.7 2.1-3.2 6.3-2.5.3-4.7 3.1-.5 2.5-2.4 7-1 1-2.5-1.4-1.4-1.8-6.7-.3-3.9-2-4.1z" },
  { name: "Tunisie", viewBox: "1014.0 331.6 26.7 50.4", d: "M1038 361.4l-2-1-1.5-3-2.8-.1-1.1-3.5 3.4-3.2.5-5.6-1.9-1.6-.1-3 2.5-3.2-.4-1.3-4.4 2.4.1-3.3-3.7-.7-5.6 2.6-1 3.3 1 6.2-1.1 5.3-3.2 3.6.6 4.8 4.5 3.8v1.5l3.4 2.6 2.6 11.3 2.6-1.4.4-2.7-.7-2.6 3.7-2.5 1.5-2 2.6-1.8.1-4.9z" },
  { name: "Sénégal", viewBox: "876.6 464.6 38.2 31.2", d: "M908.9 479.2l-3.6-4.4-3.2-4.7-3.7-1.7-2.6-1.8h-3.1l-2.8 1.4-2.7-.5-2 2-1.3 3.3-2.8 4.4-2.5 1.2 2.7 2.3 2.2 5 6.1-.2 1.3-1.5 1.8-.1 2.1 1.5 1.8.1 1.8-1.1 1.1 1.8-2.4 1.5-2.4-.1-2.4-1.4-2.1 1.5h-1l-1.4.9-5-.1.8 4.9 3-1.1 1.8.2 1.5-.7 10.3.3 2.7.1 4 1.5 1.3-.1.4-.7 3 .5.8-.4.3-2-.4-2.4-2.1-1.8-1.1-3.7-.2-3.9z" },
  { name: "Côte d'Ivoire", viewBox: "926.1 502.8 38.5 44.1", d: "M946.5 506.2l-2.3.9-1.3.8-.9-2.7-1.6.7-1-.1-1 1.9-4.3-.1-1.6-1-.7.6-1.1.5-.5 2.2 1.3 2.6 1.3 5.1-2 .8-.6.9.4 1.2-.3 2.8h-.9l-.3 1.8.6 3.1-1.2 2.8 1.6 1.8 1.8.4 2.3 2.7.2 2.5-.5.8-.5 5.2 1.1.2 5.6-2.4 3.9-1.8 6.6-1.1 3.6-.1 3.9 1.3 2.6-.1.2-2.5-2.4-5.5 1.5-7.2 2.3-5.3-1.4-9.1-3.8-1.6-2.7.2-1.9 1.6-2.5-1.3-1-2.1-2.5-1.4z" },
  { name: "Ghana", viewBox: "956.1 499.2 29.0 45.5", d: "M976.8 502.1l-2.6-.5-1.8 1-2.4-.5-9.7.3-.2 3.6.8 4.8 1.4 9.1-2.3 5.3-1.5 7.2 2.4 5.5-.2 2.5 5 1.8 5-1.9 3.2-2.1 8.7-3.8-1.2-2.2-1.5-4-.4-3.2 1.2-5.7-1.4-2.3-.6-5.1.1-4.6-2.4-3.3.4-1.9z" },
  { name: "Nigeria", viewBox: "987.8 479.9 74.3 69.3", d: "M1055.8 492.7l-1 .2-3.9-7-1.3-.2-4.3 3.5-4.3-1.8-3-.4-1.6.9-3.3-.2-3.3 2.7-2.8.2-6.8-3.3-2.6 1.5-2.9-.1-2.1-2.4-5.6-2.4-6 .8-1.4 1.4-.8 3.6-1.6 2.6-.3 5.7-.2 2.1 1.2 3.8-1.1 2.5.6 1.7-2.7 4-1.7 1.9-1 4 .1 4.1-.3 10.2h9.2l3.9 4.2 1.9 4.6 3 3.9 4.5.2 2.2-1.4 2.1.3 5.8-2.3 1.4-4.5 2.7-6.1 1.6-.1 3.3-3.7 2.1-.1 3.2 2.6 3.9-2.2.5-2.6 1.2-2.6.8-3.2 3-2.6 1.1-4.5 1.2-1.4.7-3.3 1.5-4 4.6-5 .3-2.1.6-1.1-2.3-2.6z" },
  { name: "Cameroun", viewBox: "1020.1 486.0 50.8 79.4", d: "M1060.1 502.9l.2-4.3-.5-4.2-2.2-4.1-1.6.4-.2 2 2.3 2.6-.6 1.1-.3 2.1-4.6 5-1.5 4-.7 3.3-1.2 1.4-1.1 4.5-3 2.6-.8 3.2-1.2 2.6-.5 2.6-3.9 2.2-3.2-2.6-2.1.1-3.3 3.7-1.6.1-2.7 6.1-1.4 4.5v1.8l1.4.9 1.1 2.8 2.6 1.1 2.2 4.2-.8 5 9.2.2 2.6-.4 3.4.8 3.4-.8.7.3 7.1.3 4.5 1.7 4.5 1.5.4-3.5-.6-1.8-.3-2.9-2.6-2.1-2.1-3.2-.5-2.3-2.6-3.3.4-1.9-.6-2.7.4-5 1.4-1.1 2.7-6.5.9-1.7-1.8-4.4-.8-2.6-2.5-1.1-3.3-3.7 1.2-3 2.5.6 1.6-.4 3.1.1-3.1-5.8z" },
  { name: "Éthiopie", viewBox: "1156.4 472.0 93.1 83.4", d: "M1187.6 477l-1.5 4.7-6.5-1.3-.7 5.5-2.1 6.2-3.2 3.2-2.3 4.8-.5 2.6-2.6 1.8-1.4 6.7v.7l.2 5-.8 2-3 .1-1.8 3.6 3.4.5 2.9 3.1 1 2.5 2.6 1.5 3.5 6.9 2.9 1.1v3.6l2 2.1h3.9l7.2 5.4h1.8l1.3-.1 1.2.7 3.8.5 1.6-2.7 5.1-2.6 2.3 2.1h3.8l1.5-2 3.6-.1 4.9-4.5 7.4-.3 15.4-19.1-4.8.1-18.5-7.6-2.2-2.2-2.1-3.1-2.2-3.5 1.1-2.3-1.3-1.1-1.3.5-3.1-.1-.2-2-.5-1.7 1.8-3 1.9-2.8-2-2.1-2.5-3.7-2.5-2.1-1.6-2.2-4.9-2.5-3.9-.1-1.4-1.3-3.2 1.5-3.5-2.9z" },
  { name: "Kenya", viewBox: "1163.3 533.2 52.3 72.6", d: "M1211.7 547.2h-3.8l-2.3-2.1-5.1 2.6-1.6 2.7-3.8-.5-1.2-.7-1.3.1h-1.8l-7.2-5.4h-3.9l-2-2.1v-3.6l-2.9-1.1-3.8 4.2-3.4 3.8 2.7 4.4.7 3.2 2.6 7.3-2.1 4.7-2.7 4.2-1.6 2.6v.3l1.4 2.4-.4 4.7 20.2 13 .4 3.7 8 6.3 2.2-2.1 1.2-4.2 1.8-2.6.9-4.5 2.1-.4 1.4-2.7 4-2.5-3.3-5.3-.2-23.2 4.8-7.2z" },
  { name: "Afrique du Sud", viewBox: "1059.9 707.3 101.0 91.8", d: "M1148.2 713.7l-2.9-.6-1.9.8-2.6-1.1-2.2-.1-8 4.7-5.2 4.7-2 4.3-1.7 2.4-3 .5-1.2 3-.6 2-3.6 1.5-4.4-.3-2.5-1.8-2.3-.8-2.7 1.5-1.5 3.1-2.7 1.9-2.8 2.8-4 .7-1.1-2.3.7-3.8-3-6.1-1.4-1-1.1 23.6-5 3.2-2.9.5-3.3-1.2-2.4-.5-.8-2.7-2.1-1.8-2.7 3.2 3.5 8.2v.1l2.5 5.3 3.2 6-.2 4.8-1.7 1.2 1.4 4.2-.2 3.8.6 1.7.3-.9 2.1 2.9 1.8.1 2.1 2.3 2.4-.2 3.5-2.4 4.6-1 5.6-2.5 2.2.3 3.3-.8 5.7 1.2 2.7-1.2 3.2 1 .8-1.8 2.7-.3 5.8-2.5 4.3-2.9 4.1-3.8 6.7-6.5 3.4-4.6 1.8-3.2 2.5-3.3 1.2-.9 3.9-3.2 1.6-2.9 1.1-5.2 1.7-4.7h-4.1l-1.3 2.8-3.3.7-3-3.5.1-2.2 1.6-2.4.7-1.8 1.6-.5 2.7 1.2-.4-2.3 1.4-7.1-1.1-4.5-2.2-9zm-20.1 52.8l-2 .6-3.7-4.9 3.2-4 3.1-2.5 2.6-1.3 2.3 2 1.7 1.9-1.9 3.1-1.1 2.1-3.1 1-1.1 2z" },
  { name: "Égypte", viewBox: "1105.7 367.0 78.0 69.4", d: "M1129.7 374.8l-5.5-1.9-5.3-1.7-7.1.2-1.8 3 1.1 2.7-1.2 3.9 2 5.1 1.3 22.7 1 23.4h65.3l-1-1.3-6.8-5.7-.4-4.2 1-1.1-5.3-7-2-3.6-2.3-3.5-4.8-9.9-3.9-6.4-2.8-6.7.5-.6 4.6 9.1 2.7 2.9 2 2 1.2-1.1 1.2-3.3.7-4.8 1.3-2.5-.7-1.7-3.9-9.2-2.5 1.6-4.2-.4-4.4-1.5-1.1 2.1-1.7-3.2-3.9-.8-4.7.6-2.1 1.8-3.9 2-2.6-1z" },
];

const DEMO_NAV = ["Dashboard", "Projets", "Agences", "Messages", "Favoris", "Paramètres"];

function HomePage() {
  const [openDemoSlug, setOpenDemoSlug] = useState<string | null>(null);
  const countriesScrollRef = useRef<HTMLDivElement>(null);
  const demoFeature = ADVANTAGES.find((item) => item.slug === openDemoSlug) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
        {/* ✅ HERO SECTION - CARTES SANS COULEURS */}
        <section className="relative pt-16 text-center sm:pt-20">
          <div className="absolute -top-20 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 bg-gradient-radial from-primary/5 to-transparent opacity-30" />

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/50 px-4 py-1.5 text-[13px] font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Nouvelle version disponible
          </div>

          <h1 className="mx-auto max-w-[640px] text-[38px] font-bold leading-[1.15] tracking-tight sm:text-[46px]">
            La plateforme B2B qui connecte vos projets aux{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              meilleures agences
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-6 text-foreground/70">
            Trouvez, collaborez et réussissez avec les agences les plus adaptées à vos besoins. Que
            vous soyez une entreprise ou une agence, Sortlist simplifie chaque étape.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/inscription-client"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
            >
              Créer mon compte gratuitement
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              to="/connexion"
              className="inline-flex items-center rounded-lg border border-border bg-background px-6 py-3 text-[14px] font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
            >
              Se connecter
            </Link>
          </div>

          {/* ✅ CARTES SANS COULEURS */}
          <div className="mx-auto mt-12 grid max-w-[880px] grid-cols-1 gap-6 text-left sm:grid-cols-3">
            {AUDIENCES.map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <item.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
                <h2 className="mt-4 text-[15px] font-bold">{item.title}</h2>
                <p className="mt-1 text-[13.5px] leading-[1.45] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ DEUX ACTEURS MODERNISÉS */}
        <section className="mt-16 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 py-16">
          <h2 className="text-center text-[18px] font-bold">Une plateforme, deux acteurs.</h2>
          <div className="relative mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {TWO_ACTORS.map((actor) => (
              <div
                key={actor.title}
                className={`group rounded-xl border ${actor.color} bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <actor.icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[17px] font-bold">{actor.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.5] text-muted-foreground">
                  {actor.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {actor.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-[13px]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  to={actor.ctaTo}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                >
                  {actor.ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ POURQUOI CHOISIR MODERNISÉ */}
        <section className="pt-20">
          <h2 className="text-center text-[18px] font-bold">Pourquoi choisir Sortlist ?</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            Des fonctionnalités conçues pour simplifier vos collaborations.
          </p>

          <div className="relative mt-12 grid grid-cols-2 gap-y-10 sm:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-[18px] hidden border-t-2 border-dashed border-border sm:block" />
            {ADVANTAGES.map((item, index) => (
              <a
                key={item.title}
                href={"#" + item.slug}
                className="group flex flex-col items-center text-center transition-transform hover:scale-105"
              >
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background transition-colors group-hover:border-primary group-hover:bg-primary/10">
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" strokeWidth={1.6} />
                </span>
                <span className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-[13.5px] font-bold group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </a>
            ))}
          </div>
        </section>

        {/* ✅ FEATURES DÉTAILLÉES */}
        {ADVANTAGES.map((feature, index) => (
          <section key={feature.slug} id={feature.slug} className="scroll-mt-8 pt-20">
            <FeatureDetail
              feature={feature}
              index={index}
              onDemo={() => setOpenDemoSlug(feature.slug)}
            />
          </section>
        ))}

        {/* ✅ COMMENT ÇA MARCHE MODERNISÉ */}
        <section id="comment-ca-marche" className="scroll-mt-8 pt-20">
          <h2 className="text-center text-[18px] font-bold">Comment ça marche ?</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            Trois étapes simples pour trouver votre partenaire idéal.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="group text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-background transition-colors group-hover:border-primary">
                  <step.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" strokeWidth={1.6} />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-[16px] font-bold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-[260px] text-[13.5px] leading-[1.5] text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ NOS ENGAGEMENTS MODERNISÉS */}
        <section className="pt-20">
          <h2 className="text-center text-[18px] font-bold">Nos engagements</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            Des valeurs qui guident chacune de nos actions.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {COMMITMENTS.map((item) => (
              <div
                key={item.title}
                className={`group rounded-xl border ${item.color} bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <item.icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[16px] font-bold">{item.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.5] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ SECTEURS - SANS COULEURS */}
        <section className="overflow-hidden pt-20">
          <h2 className="text-center text-[18px] font-bold">Des secteurs variés</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            Quel que soit votre domaine d'activité, trouvez une agence spécialisée qui comprend vos
            enjeux.
          </p>

          <div className="relative mt-10 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-scroll-horizontal flex w-max gap-5">
              {[...SECTORS, ...SECTORS].map((sector, index) => (
                <div
                  key={sector.title + index}
                  className="group flex w-[220px] shrink-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <sector.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
                  <h3 className="mt-4 text-[14px] font-bold">{sector.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-[1.5] text-muted-foreground">
                    {sector.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ PAYS MODERNISÉS */}
        <section className="pt-16">
          <h2 className="text-center text-[18px] font-bold">
            Présent partout où vous en avez besoin
          </h2>
          <p className="mx-auto mt-3 max-w-[440px] text-center text-[14px] text-muted-foreground">
            Trouvez des agences et des projets dans plusieurs pays d'Afrique.
          </p>

          <div className="relative mt-8">
            <button
              type="button"
              onClick={() =>
                countriesScrollRef.current?.scrollBy({ left: -220, behavior: "smooth" })
              }
              aria-label="Défiler vers la gauche"
              className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md sm:flex"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>

            <div
              ref={countriesScrollRef}
              className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {COUNTRIES.map((country) => (
                <div
                  key={country.name}
                  className="group flex w-[160px] shrink-0 flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                    <svg viewBox={country.viewBox} className="h-7 w-7">
                      <path d={country.d} fill="currentColor" />
                    </svg>
                  </span>
                  <h3 className="mt-3 text-[14px] font-bold">{country.name}</h3>
                  <span className="mt-3 text-[12px] font-semibold text-muted-foreground/50 group-hover:text-primary/70 transition-colors">
                    Découvrir →
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                countriesScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })
              }
              aria-label="Défiler vers la droite"
              className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-5 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md sm:flex"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </section>
      </main>

      {/* ✅ CTA FINAL MODERNISÉ */}
      <section className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8 my-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-foreground/90 p-10 text-background sm:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-background/20 bg-background/10">
                <Rocket className="h-6 w-6" strokeWidth={1.6} />
              </div>
              <h2 className="mt-6 text-[28px] font-bold leading-[1.25] tracking-tight sm:text-[34px]">
                Prêt à trouver l'agence ou le projet idéal ?
              </h2>
              <p className="mt-4 max-w-[440px] text-[14px] leading-[1.6] text-background/70">
                Créez votre compte gratuitement et découvrez des recommandations adaptées à vos besoins
                en quelques minutes.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/inscription-client"
                  className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-[14px] font-semibold text-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                >
                  Créer mon compte gratuitement
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <Link
                  to="/connexion"
                  className="inline-flex items-center rounded-lg border border-background/30 px-6 py-3 text-[14px] font-semibold text-background transition-colors hover:bg-background/10"
                >
                  Se connecter
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] font-medium text-background/70">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  Gratuit
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  Sans engagement
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                  Sans frais cachés
                </span>
              </div>
            </div>

            <div className="border-t border-background/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {HOW_IT_WORKS.map((step, index) => (
                <div
                  key={step.title}
                  className={
                    index === 0 ? "flex gap-4 pb-6" : "flex gap-4 border-t border-background/15 py-6"
                  }
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-background/25 text-[12px] font-semibold">
                    {step.step}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.5] text-background/60">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ✅ MODAL DEMO MODERNISÉE */}
      <Dialog open={demoFeature !== null} onOpenChange={(open) => !open && setOpenDemoSlug(null)}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">{demoFeature?.title}</DialogTitle>
          </DialogHeader>

          <div className="relative overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-b border-border bg-accent/30 p-4 md:border-b-0 md:border-r">
                <p className="text-[14px] font-bold tracking-tight">Sortlist</p>
                <nav className="mt-4 space-y-2.5">
                  {DEMO_NAV.map((item, index) => (
                    <p
                      key={item}
                      className={`flex items-center gap-2 text-[12.5px] font-medium ${index === 0 ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <span className={`h-3 w-3 rounded-sm border ${index === 0 ? "border-primary bg-primary/10" : "border-border"}`} />
                      {item}
                    </p>
                  ))}
                </nav>
              </div>

              <div className="p-4">
                <p className="text-[13px] font-bold">{demoFeature?.title}</p>
                <p className="mt-3 text-[12px] text-muted-foreground">
                  Nous avons trouvé 0 agences correspondant à vos critères
                </p>
                <div className="mt-4">
                  <StackSkeleton count={3} />
                </div>
              </div>
            </div>

            <Link
              to="/connexion"
              aria-label="Se connecter pour lancer la démonstration"
              className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
            >
              <Play className="h-6 w-6 fill-current" strokeWidth={0} />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureDetail({
                         feature,
                         index,
                         onDemo,
                       }: {
  feature: Advantage;
  index: number;
  onDemo: () => void;
}) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md sm:p-10">
      <div
        className={
          "flex flex-col gap-8 lg:flex-row lg:gap-12" +
          (index % 2 === 1 ? " lg:flex-row-reverse" : "")
        }
      >
        <div className="lg:w-[45%]">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-muted-foreground/30">{number}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <feature.icon className="h-5 w-5" strokeWidth={1.6} />
            </div>
          </div>
          <h2 className="mt-5 text-[26px] font-bold tracking-tight">{feature.title}</h2>
          <p className="mt-4 text-[14px] leading-[1.65] text-foreground/80">{feature.description}</p>

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {feature.title}
              </span>
            </div>
            <div className="p-4">
              <FeatureMock feature={feature} />
            </div>
          </div>

          <button
            type="button"
            onClick={onDemo}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            <Play className="h-4 w-4 fill-current" strokeWidth={0} />
            Voir la démo
          </button>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-6 border-t border-border pt-8 text-center lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          {feature.benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="mt-3 text-[14px] font-bold">{benefit.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureMock({ feature }: { feature: Advantage }) {
  if (feature.mockType === "score") {
    return (
      <div className="space-y-3">
        {feature.mock.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold">{row.value}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all"
                style={{ width: row.value }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feature.mockType === "cards") {
    return (
      <div className="space-y-2.5">
        {feature.mock.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                {row.label.charAt(0)}
              </span>
              <span className="text-[13px] font-medium">{row.label}</span>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {row.value} match
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (feature.mockType === "chat") {
    return (
      <div className="space-y-2.5">
        {feature.mock.map((row, index) => (
          <div
            key={row.label}
            className={
              "flex items-center gap-2.5 " + (index % 2 === 1 ? "flex-row-reverse text-right" : "")
            }
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index % 2 === 1 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {index % 2 === 1 ? "V" : "A"}
            </span>
            <div className="rounded-lg border border-border px-3 py-2 text-[12.5px]">
              <span className="font-medium">{row.label}</span>
              <span className="ml-2 text-muted-foreground">{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {feature.mock[0].label}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-primary">{feature.mock[0].value}</p>
      <div className="mt-4 divide-y divide-border border-t border-border">
        {feature.mock.slice(1).map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-muted-foreground">{row.label}</span>
            <span className="text-[13px] font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}