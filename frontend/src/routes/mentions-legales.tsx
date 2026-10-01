import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Scale } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Sortlist" },
      {
        name: "description",
        content: "Mentions légales de la plateforme Sortlist.",
      },
    ],
  }),
  component: LegalNoticePage,
});

function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[760px] px-4 pb-20 sm:px-6 lg:px-8">
        <nav
          aria-label="Fil d'ariane"
          className="flex items-center gap-2 pt-6 text-[13px] text-muted-foreground"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Accueil
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">Mentions légales</span>
        </nav>

        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <Scale className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight">Mentions légales</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Dernière mise à jour :{" "}
            {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
          </p>
        </div>

        <div className="mt-10 space-y-8 text-[13.5px] leading-[1.7] text-muted-foreground">
          <section>
            <h2 className="text-[15px] font-bold text-foreground">Éditeur du site</h2>
            <p className="mt-2">
              Le site Sortlist est édité par Sortlist Pro. Pour toute question relative à l'édition
              du site, vous pouvez contacter notre équipe à l'adresse{" "}
              <a
                href="mailto:contact@sortlistpro.com"
                className="text-foreground underline underline-offset-2"
              >
                contact@sortlistpro.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Hébergement</h2>
            <p className="mt-2">
              L'application et les données associées sont hébergées sur une infrastructure serveur
              dédiée, exploitée conformément aux standards usuels de sécurité et de disponibilité.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Propriété intellectuelle</h2>
            <p className="mt-2">
              L'ensemble des éléments présents sur le site (textes, graphismes, logos, interface)
              sont la propriété de Sortlist Pro ou de ses partenaires, sauf mention contraire, et
              sont protégés par le droit de la propriété intellectuelle. Toute reproduction sans
              autorisation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Responsabilité</h2>
            <p className="mt-2">
              Sortlist agit en tant qu'intermédiaire de mise en relation entre entreprises et
              agences. Les contenus publiés par les utilisateurs (descriptions de projets, profils
              d'agence, avis) relèvent de leur seule responsabilité. Sortlist met en œuvre une
              modération raisonnable mais ne saurait être tenu responsable des contrats conclus
              entre un client et une agence.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Contact</h2>
            <p className="mt-2">
              Pour toute question relative aux présentes mentions légales, vous pouvez nous écrire à{" "}
              <a
                href="mailto:contact@sortlistpro.com"
                className="text-foreground underline underline-offset-2"
              >
                contact@sortlistpro.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
