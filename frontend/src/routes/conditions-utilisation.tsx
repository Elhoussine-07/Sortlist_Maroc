import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/conditions-utilisation")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — Sortlist" },
      {
        name: "description",
        content: "Les conditions d'utilisation de la plateforme Sortlist.",
      },
    ],
  }),
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
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
          <span className="text-foreground">Conditions d'utilisation</span>
        </nav>

        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <FileText className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight">Conditions d'utilisation</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Dernière mise à jour :{" "}
            {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
          </p>
        </div>

        <div className="mt-10 space-y-8 text-[13.5px] leading-[1.7] text-muted-foreground">
          <section>
            <h2 className="text-[15px] font-bold text-foreground">1. Objet</h2>
            <p className="mt-2">
              Les présentes conditions régissent l'accès et l'utilisation de la plateforme Sortlist,
              qui met en relation des entreprises ayant des projets digitaux à réaliser et des
              agences prestataires de services. L'utilisation de la plateforme implique
              l'acceptation pleine et entière de ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">2. Inscription et compte</h2>
            <p className="mt-2">
              L'accès aux fonctionnalités de la plateforme nécessite la création d'un compte, en
              tant que client ou en tant qu'agence. Vous vous engagez à fournir des informations
              exactes et à jour, et à préserver la confidentialité de vos identifiants de connexion.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              3. Fonctionnement de la mise en relation
            </h2>
            <p className="mt-2">
              Les clients publient des projets décrivant leur besoin. Les agences peuvent consulter
              ces projets et soumettre des devis. Sortlist facilite cette mise en relation mais
              n'est pas partie au contrat éventuellement conclu entre un client et une agence.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">4. Facturation et commission</h2>
            <p className="mt-2">
              Lorsqu'un projet publié sur la plateforme est remporté par une agence, une commission
              peut être due à Sortlist, selon les modalités indiquées dans l'espace de facturation
              de l'agence. Le non-règlement d'une facture dans les délais impartis peut entraîner la
              suspension temporaire de la publication de nouvelles offres.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              5. Comportement des utilisateurs
            </h2>
            <p className="mt-2">
              Vous vous engagez à utiliser la plateforme de bonne foi, à ne pas publier de contenu
              trompeur, offensant ou illégal, et à respecter les autres utilisateurs. Sortlist se
              réserve le droit de modérer, suspendre ou supprimer tout compte ou contenu ne
              respectant pas ces règles.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">6. Résiliation</h2>
            <p className="mt-2">
              Vous pouvez demander la clôture de votre compte à tout moment en contactant notre
              équipe. Sortlist peut également suspendre ou résilier un compte en cas de manquement
              grave aux présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">
              7. Modification des conditions
            </h2>
            <p className="mt-2">
              Sortlist peut être amené à modifier les présentes conditions. Les utilisateurs seront
              informés de toute modification substantielle, et la poursuite de l'utilisation de la
              plateforme vaudra acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">8. Contact</h2>
            <p className="mt-2">
              Pour toute question relative aux présentes conditions, contactez-nous à{" "}
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
