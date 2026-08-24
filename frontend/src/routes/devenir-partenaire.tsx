import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Handshake } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/devenir-partenaire")({
  head: () => ({
    meta: [
      { title: "Devenir partenaire — Sortlist" },
      {
        name: "description",
        content:
          "Devenez partenaire de Sortlist et développez votre activité avec de nouveaux projets.",
      },
    ],
  }),
  component: BecomePartnerPage,
});

function BecomePartnerPage() {
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
          <span className="text-foreground">Devenir partenaire</span>
        </nav>

        <section className="mt-8 max-w-[600px] mx-auto text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <Handshake className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[30px] font-bold tracking-tight">Devenir partenaire</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            Vous êtes une agence et souhaitez rejoindre Sortlist pour recevoir des projets
            qualifiés ? Créez votre profil gratuitement pour commencer.
          </p>
          <Link
            to="/inscription-agence"
            className="mt-7 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Créer mon profil agence
          </Link>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
