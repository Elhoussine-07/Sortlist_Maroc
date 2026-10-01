import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Sortlist" },
      {
        name: "description",
        content: "Comment Sortlist collecte, utilise et protège vos données personnelles.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
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
          <span className="text-foreground">Politique de confidentialité</span>
        </nav>

        <div className="mt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight">
            Politique de confidentialité
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Dernière mise à jour :{" "}
            {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
          </p>
        </div>

        <div className="mt-10 space-y-8 text-[13.5px] leading-[1.7] text-muted-foreground">
          <section>
            <h2 className="text-[15px] font-bold text-foreground">Données collectées</h2>
            <p className="mt-2">
              Lors de la création de votre compte et de l'utilisation de la plateforme, nous
              collectons les données que vous nous transmettez directement (identité, coordonnées,
              informations de profil, contenu des projets et des devis) ainsi que certaines données
              techniques nécessaires au fonctionnement du service (adresse IP, journaux de
              connexion, préférences).
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Utilisation des données</h2>
            <p className="mt-2">Vos données sont utilisées pour :</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Mettre en relation les clients et les agences sur la plateforme ;</li>
              <li>Améliorer la pertinence des recommandations et du moteur de correspondance ;</li>
              <li>Vous envoyer les notifications liées à vos projets, devis et factures ;</li>
              <li>Assurer la sécurité du service et prévenir les usages frauduleux.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Partage des données</h2>
            <p className="mt-2">
              Vos données ne sont partagées qu'avec les autres utilisateurs strictement nécessaires
              à l'exécution du service (par exemple, un client et l'agence avec laquelle il échange
              sur un projet donné). Elles ne sont jamais vendues à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Conservation des données</h2>
            <p className="mt-2">
              Vos données sont conservées pendant la durée de vie de votre compte, puis archivées ou
              supprimées conformément aux obligations légales applicables (notamment comptables et
              fiscales pour les données de facturation).
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-bold text-foreground">Vos droits</h2>
            <p className="mt-2">
              Conformément à la réglementation applicable en matière de protection des données, vous
              disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos
              données. Vous pouvez exercer ces droits en nous contactant à{" "}
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
            <h2 className="text-[15px] font-bold text-foreground">Sécurité</h2>
            <p className="mt-2">
              Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables
              (chiffrement des échanges, contrôle d'accès) pour protéger vos données contre l'accès,
              la modification ou la divulgation non autorisés.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
