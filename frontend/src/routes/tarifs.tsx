import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — Sortlist" },
      {
        name: "description",
        content: "Sortlist est gratuit : aucun frais de dépôt, aucune commission cachée.",
      },
    ],
  }),
  component: PricingPage,
});

const POINTS = [
  "Créer votre profil, gratuit",
  "Publier un projet, gratuit",
  "Postuler à une mission, gratuit",
  "Aucune commission cachée",
];

function PricingPage() {
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
          <span className="text-foreground">Prix</span>
        </nav>

        <section className="mt-8 max-w-[600px] mx-auto text-center">
          <h1 className="text-[30px] font-bold tracking-tight">Nos tarifs</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            Sortlist est entièrement gratuit, que vous soyez une entreprise ou une agence.
          </p>
        </section>

        <section className="mt-12 pb-20">
          <div className="mx-auto max-w-[420px] rounded-lg border border-border p-8 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              Utilisation de la plateforme
            </p>
            <p className="mt-3 text-[40px] font-bold tracking-tight">0 €</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Sans engagement</p>
            <ul className="mt-6 space-y-3 text-left">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                  <span className="text-[13.5px]">{point}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/connexion"
              className="mt-7 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
