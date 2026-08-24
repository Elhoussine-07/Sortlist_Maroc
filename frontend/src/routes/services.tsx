import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Code2,
  Compass,
  MessageSquare,
  Megaphone,
  Palette,
  Scale,
  Users2,
  Wallet,
} from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services couverts — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez les secteurs et services couverts par les agences présentes sur Sortlist.",
      },
    ],
  }),
  component: ServicesPage,
});

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

function ServicesPage() {
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
          <span className="text-foreground">Services couverts</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">Services couverts</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            Sortlist couvre un large éventail de secteurs, avec des agences spécialisées prêtes
            à accompagner votre projet.
          </p>
        </section>

        <section className="mt-12 pb-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECTORS.map((sector) => (
              <div key={sector.title} className="rounded-lg border border-border p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
                  <sector.icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[14px] font-bold">{sector.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted-foreground">
                  {sector.description}
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
