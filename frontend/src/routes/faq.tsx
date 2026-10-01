import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Sortlist" },
      {
        name: "description",
        content:
          "Les réponses aux questions les plus fréquentes sur la mise en relation entre clients et agences sur Sortlist.",
      },
    ],
  }),
  component: FaqPage,
});

const FAQ_SECTIONS: Array<{
  title: string;
  items: Array<{ question: string; answer: string }>;
}> = [
  {
    title: "Pour les entreprises",
    items: [
      {
        question: "Comment publier un projet ?",
        answer:
          "Depuis votre espace client, cliquez sur « Postuler un projet », décrivez votre besoin (objectif, budget, délais) et publiez-le. Les agences pertinentes peuvent alors vous envoyer un devis.",
      },
      {
        question: "Est-ce gratuit de publier un projet ?",
        answer:
          "Oui, la publication d'un projet et la réception de devis sont entièrement gratuites pour les entreprises.",
      },
      {
        question: "Comment choisir la bonne agence ?",
        answer:
          "Comparez les devis reçus, consultez les profils d'agences (avis, spécialités, portfolio) et échangez directement via la messagerie avant de faire votre choix.",
      },
      {
        question: "Que se passe-t-il si une agence ne répond pas à temps ?",
        answer:
          "Chaque devis a un délai de réponse. Passé ce délai, vous recevez un rappel, puis le projet peut être automatiquement suspendu ou rouvert à d'autres agences si aucune décision n'est prise.",
      },
    ],
  },
  {
    title: "Pour les agences",
    items: [
      {
        question: "Comment être visible auprès des clients ?",
        answer:
          "Complétez votre profil d'agence (spécialités, zone géographique, portfolio) : plus il est détaillé, plus notre moteur de correspondance pourra vous recommander sur les projets pertinents.",
      },
      {
        question: "Qu'est-ce que l'indice de qualité de profil (PQI) ?",
        answer:
          "Le PQI mesure la complétude et la fiabilité de votre profil (informations renseignées, réactivité, avis clients). Un PQI élevé améliore votre position dans les recommandations.",
      },
      {
        question: "Comment fonctionne la commission sur les projets gagnés ?",
        answer:
          "Une commission est facturée uniquement lorsqu'un projet est gagné et validé. Le détail (montant, échéance) est indiqué sur chaque facture dans votre espace de facturation.",
      },
      {
        question: "Que se passe-t-il en cas de facture impayée ?",
        answer:
          "Des rappels automatiques sont envoyés avant et après échéance. En cas de retard prolongé, la publication de nouvelles offres peut être temporairement suspendue jusqu'à régularisation.",
      },
    ],
  },
  {
    title: "Compte et sécurité",
    items: [
      {
        question: "Comment modifier mes informations de compte ?",
        answer:
          "Rendez-vous dans la section « Profil » de votre tableau de bord pour mettre à jour vos informations à tout moment.",
      },
      {
        question: "Mes échanges sont-ils confidentiels ?",
        answer:
          "Oui, les messages et documents échangés entre un client et une agence ne sont visibles que par les parties concernées et notre équipe de modération en cas de litige.",
      },
    ],
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-[14.5px] font-semibold">{question}</span>
        <ChevronRight
          className={
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform " +
            (open ? "rotate-90" : "")
          }
          strokeWidth={1.8}
        />
      </button>
      {open ? (
        <p className="mt-3 text-[13.5px] leading-[1.65] text-muted-foreground">{answer}</p>
      ) : null}
    </div>
  );
}

function FaqPage() {
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
          <span className="text-foreground">FAQ</span>
        </nav>

        <div className="mt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <HelpCircle className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[30px] font-bold tracking-tight">Questions fréquentes</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            Vous ne trouvez pas de réponse à votre question ?{" "}
            <a
              href="mailto:contact@sortlistpro.com"
              className="font-semibold text-foreground underline underline-offset-2"
            >
              Contactez notre équipe
            </a>
            .
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {section.title}
              </h2>
              <div className="mt-2">
                {section.items.map((item) => (
                  <FaqItem key={item.question} question={item.question} answer={item.answer} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
