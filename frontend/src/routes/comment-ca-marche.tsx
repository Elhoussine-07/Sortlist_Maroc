import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Handshake,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Star,
  Users2,
  Wallet,
} from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/comment-ca-marche")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez comment fonctionne Sortlist : décrivez votre projet ou votre profil agence, laissez notre IA vous mettre en relation, collaborez en toute confiance.",
      },
      { property: "og:title", content: "Comment ça marche — Sortlist" },
      {
        property: "og:description",
        content: "Découvrez comment fonctionne Sortlist en quelques étapes simples.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const PATHS = [
  {
    icon: Building2,
    title: "Vous êtes une entreprise",
    description: "Trouvez le partenaire idéal pour concrétiser votre projet.",
  },
  {
    icon: Users2,
    title: "Vous êtes une agence",
    description: "Recevez des projets qualifiés et développez votre activité.",
  },
];

const HERO_STEPS = [
  { icon: ClipboardList, label: "Vous décrivez votre besoin" },
  { icon: Sparkles, label: "Notre IA trouve les meilleures correspondances" },
  { icon: MessageSquare, label: "Vous échangez facilement" },
  { icon: Handshake, label: "Vous choisissez le bon partenaire" },
  { icon: Send, label: "Vous collaborez et avancez" },
];

const COMPANY_STEPS = [
  {
    icon: ClipboardList,
    title: "Décrivez votre projet",
    description:
      "Renseignez le détail de votre projet via un formulaire simple : catégorie, description, budget, localisation.",
    visual: "form",
  },
  {
    icon: Search,
    title: "Obtenez votre shortlist",
    description:
      "Notre algorithme analyse votre besoin et sélectionne les agences les plus adaptées à votre profil.",
    visual: "ratings",
  },
  {
    icon: Send,
    title: "Contactez les agences",
    description: "Envoyez votre projet à une ou plusieurs agences de votre shortlist en un clic.",
    visual: "compare",
  },
  {
    icon: Handshake,
    title: "Choisissez et collaborez",
    description:
      "Comparez les propositions reçues et démarrez la collaboration avec l'agence retenue.",
    visual: "chat",
  },
];

const AGENCY_STEPS = [
  {
    icon: BadgeCheck,
    title: "Créez votre profil agence",
    description: "Présentez votre expertise, vos réalisations et vos disponibilités.",
    visual: "form",
  },
  {
    icon: MessageSquare,
    title: "Recevez des opportunités",
    description: "Des projets ciblés correspondant à vos critères vous sont proposés.",
    visual: "opportunity",
  },
  {
    icon: Search,
    title: "Répondez aux projets",
    description: "Consultez le brief et soumettez votre proposition aux entreprises intéressées.",
    visual: "list",
  },
  {
    icon: Handshake,
    title: "Décrochez la mission",
    description: "Échangez avec le client, ajustez votre devis et démarrez la collaboration.",
    visual: "accepted",
  },
];

const MATCHING_ITEMS = [
  { icon: BadgeCheck, label: "Compétences" },
  { icon: Star, label: "Avis" },
  { icon: Wallet, label: "Budget" },
  { icon: MapPin, label: "Localisation" },
  { icon: Clock, label: "Disponibilité" },
  { icon: CalendarClock, label: "Délais" },
];

const AFTER_MATCH = [
  {
    title: "Le client compare",
    description:
      "Il consulte les propositions reçues (expertise, prix, délais, avis) sur son espace.",
  },
  {
    title: "Le client choisit",
    description: "Il sélectionne l'agence qui correspond le mieux à ses attentes et son budget.",
  },
  {
    title: "La collaboration commence",
    description:
      "Les deux parties échangent, valident les étapes clés et suivent le projet ensemble.",
  },
];

const WHY_IT_WORKS = [
  {
    icon: Sparkles,
    title: "IA intelligente",
    description: "Un algorithme de matching qui comprend réellement vos besoins.",
  },
  {
    icon: BadgeCheck,
    title: "Profils vérifiés",
    description: "Chaque profil est contrôlé avant validation sur la plateforme.",
  },
  {
    icon: Handshake,
    title: "Zéro frais de dépôt",
    description: "Publier un projet ou postuler à une mission ne coûte rien.",
  },
  {
    icon: MessageSquare,
    title: "Communication simplifiée",
    description: "Un espace centralisé pour échanger et suivre chaque projet.",
  },
  {
    icon: Eye,
    title: "Transparence totale",
    description: "Aucune donnée cachée, aucune commission surprise.",
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Fil d'ariane"
          className="flex items-center gap-2 pt-6 text-[13px] text-muted-foreground"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">Comment ça marche</span>
        </nav>

        <section className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Fonctionnement simple et efficace
            </p>
            <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-tight">
              Comment ça marche ?
            </h1>
            <p className="mt-4 max-w-[440px] text-[14px] leading-[1.65] text-muted-foreground">
              Sortlist facilite la mise en relation entre les entreprises et les agences grâce à
              un processus clair, intelligent et sécurisé.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/inscription-client"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Building2 className="h-4 w-4" strokeWidth={1.8} />
                Je suis une entreprise
              </Link>
              <Link
                to="/agences"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-[13.5px] font-semibold transition-colors hover:bg-muted/40"
              >
                <Users2 className="h-4 w-4" strokeWidth={1.8} />
                Je suis une agence
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            {HERO_STEPS.map((step) => (
              <div key={step.label} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
                  <step.icon className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <p className="text-[10.5px] leading-[1.4] text-muted-foreground">{step.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Deux parcours, un même objectif : de belles collaborations
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {PATHS.map((path) => (
              <div key={path.title} className="rounded-lg border border-border p-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border">
                  <path.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[15px] font-bold">{path.title}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
                  {path.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Le processus en 4 étapes clés
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto_1fr]">
            <div>
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Côté entreprise
              </p>
              <div className="mt-4 space-y-4">
                {COMPANY_STEPS.map((step, index) => (
                  <div key={step.title} className="rounded-lg border border-border p-4">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[12px] font-bold">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[13.5px] font-bold">
                          <step.icon className="h-4 w-4" strokeWidth={1.6} />
                          {step.title}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                      <StepMock visual={step.visual} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex h-full items-center justify-center">
              <MatchingDiagram />
            </div>

            <div>
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Côté agence
              </p>
              <div className="mt-4 space-y-4">
                {AGENCY_STEPS.map((step, index) => (
                  <div key={step.title} className="rounded-lg border border-border p-4">
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[12px] font-bold">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[13.5px] font-bold">
                          <step.icon className="h-4 w-4" strokeWidth={1.6} />
                          {step.title}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                      <StepMock visual={step.visual} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {AFTER_MATCH.map((item) => (
              <div key={item.title} className="rounded-lg border border-border p-6 text-center">
                <h3 className="text-[14px] font-bold">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 pb-20">
          <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Pourquoi ça fonctionne si bien ?
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_IT_WORKS.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border">
                  <item.icon className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <h3 className="mt-3 text-[13px] font-bold">{item.title}</h3>
                <p className="mt-1.5 text-[12px] leading-[1.5] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1080px] px-4 py-14 text-center sm:px-6 lg:px-8">
          <h2 className="text-[24px] font-bold tracking-tight">
            Prêt à trouver le partenaire idéal ?
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-[1.6] text-background/70">
            Rejoignez les entreprises et agences qui rejoignent Sortlist pour collaborer plus
            simplement.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/postuler-un-projet"
              className="rounded-md bg-background px-6 py-3 text-[14px] font-semibold text-foreground transition-opacity hover:opacity-90"
            >
              Publier un projet
            </Link>
            <Link
              to="/agences"
              className="rounded-md border border-background/30 px-6 py-3 text-[14px] font-semibold text-background transition-opacity hover:opacity-90"
            >
              Découvrir les agences
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-background/60">
            Gratuit · Sans engagement · Sans frais cachés
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function MatchingDiagram() {
  const center = 190;
  const radius = 150;

  return (
    <div className="relative" style={{ width: 380, height: 380, maxWidth: "100%" }}>
      <svg viewBox="0 0 380 380" className="absolute inset-0 h-full w-full">
        {MATCHING_ITEMS.map((item, index) => {
          const angle = ((index * 60 - 90) * Math.PI) / 180;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={item.label}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth={1}
              className="text-border"
            />
          );
        })}
      </svg>

      {MATCHING_ITEMS.map((item, index) => {
        const angle = ((index * 60 - 90) * Math.PI) / 180;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <div
            key={item.label}
            className="absolute flex w-[74px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-lg border border-border bg-background p-2 text-center"
            style={{ left: x, top: y }}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.6} />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </div>
        );
      })}

      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-foreground text-center text-background">
        <Sparkles className="h-5 w-5" strokeWidth={1.6} />
        <p className="mt-1 text-[11px] font-bold leading-tight">MATCHING IA</p>
      </div>
    </div>
  );
}

function StepMock({ visual }: { visual: string }) {
  if (visual === "form") {
    return (
      <div className="space-y-2">
        <p className="h-2 w-3/4 rounded bg-muted" />
        <p className="h-2 w-1/2 rounded bg-muted" />
        <p className="h-2 w-2/3 rounded bg-muted" />
        <span className="mt-1 inline-block rounded border border-border px-2.5 py-1 text-[10px] font-semibold">
          Soumettre
        </span>
      </div>
    );
  }

  if (visual === "ratings") {
    return (
      <div className="space-y-1.5">
        {["Agence A", "Agence B", "Agence C"].map((name) => (
          <div key={name} className="flex items-center justify-between text-[11px]">
            <span className="font-medium">{name}</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "compare") {
    return (
      <div className="space-y-2">
        {["Compétences", "Disponibilité", "Budget"].map((label) => (
          <div key={label}>
            <p className="text-[10.5px] text-muted-foreground">{label}</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/3 rounded-full bg-foreground" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "chat") {
    return (
      <div className="space-y-1.5">
        <p className="w-3/5 rounded-md border border-border px-2.5 py-1.5 text-[10.5px]">
          Proposition reçue
        </p>
        <p className="ml-auto w-2/5 rounded-md border border-border px-2.5 py-1.5 text-right text-[10.5px]">
          Acceptée
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-3/4 rounded-full bg-foreground" />
        </div>
      </div>
    );
  }

  if (visual === "opportunity") {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold">Nouveau projet reçu</p>
        <p className="h-2 w-2/3 rounded bg-muted" />
        <p className="h-2 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  if (visual === "list") {
    return (
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
            <p className="h-2 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.6} />
        Projet accepté
      </span>
      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
        75%
      </span>
    </div>
  );
}
