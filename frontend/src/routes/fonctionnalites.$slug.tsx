import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Play, Target } from "lucide-react";
import { useState } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { StackSkeleton } from "@/components/common/Skeletons";

export const Route = createFileRoute("/fonctionnalites/$slug")({
  head: () => ({
    meta: [
      { title: "Fonctionnalités — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez en détail les fonctionnalités de Sortlist : matching intelligent, projets ciblés, collaboration simplifiée.",
      },
      { property: "og:title", content: "Fonctionnalités — Sortlist" },
      {
        property: "og:description",
        content: "Découvrez en détail les fonctionnalités de Sortlist.",
      },
    ],
  }),
  component: FeatureDetailPage,
});

const BENEFITS = [
  {
    title: "Des recommandations ultra-ciblées",
    description: "Recevez uniquement des suggestions pertinentes et alignées avec vos objectifs.",
  },
  {
    title: "Gain de temps considérable",
    description: "Fini les recherches interminables : notre IA fait le travail pour vous.",
  },
  {
    title: "Meilleure qualité de collaboration",
    description:
      "Connectez-vous avec les partenaires ou projets qui partagent vos valeurs et votre vision.",
  },
];

const DEMO_NAV = ["Dashboard", "Projets", "Agences", "Messages", "Favoris", "Paramètres"];

function FeatureDetailPage() {
  const [feature] = useState<null>(null);

  const [demoAgencies] = useState<[]>([]);
  const [isDemoLoading] = useState(false);

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
          <span>Fonctionnalités</span>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">Matching intelligent</span>
        </nav>

        <section className="mt-8 flex gap-5">
          <Target className="mt-1 h-6 w-6 shrink-0" strokeWidth={1.6} />
          <div className="min-w-0">
            <h1 className="text-[30px] font-bold tracking-tight">Matching intelligent</h1>
            <p className="mt-4 max-w-[720px] text-[14px] leading-[1.65] text-foreground">
              Notre algorithme d'intelligence artificielle analyse des milliers de données pour
              comprendre vos besoins, vos objectifs et votre contexte. Il identifie ensuite les
              agences ou projets les plus pertinents en fonction de leur expertise, de leurs
              réalisations passées et de leur compatibilité avec vos critères. Vous gagnez du temps
              et vous maximisez vos chances de succès.
            </p>

            <ul className="mt-8 space-y-5">
              {(feature ?? BENEFITS).map((benefit) => (
                <li key={benefit.title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-[17px] w-[17px] shrink-0" strokeWidth={1.6} />
                  <div className="min-w-0">
                    <h2 className="text-[13.5px] font-bold">{benefit.title}</h2>
                    <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Démonstration
          </h2>

          <div className="relative mt-4 overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-b border-border p-5 md:border-b-0 md:border-r">
                <p className="text-[16px] font-bold tracking-tight">Sortlist</p>
                <nav className="mt-5 space-y-3">
                  {DEMO_NAV.map((item) => (
                    <p key={item} className="flex items-center gap-2 text-[13px] font-medium">
                      <span className="h-3.5 w-3.5 rounded-sm border border-border" />
                      {item}
                    </p>
                  ))}
                </nav>
              </div>

              <div className="p-5">
                <p className="text-[14px] font-bold">Matching intelligent</p>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <p className="truncate text-[13px] text-muted-foreground">
                    {}
                    Nous avons trouvé {demoAgencies.length} agences correspondant à vos critères
                  </p>
                  <div className="flex shrink-0 items-center gap-4 text-[13px] text-muted-foreground">
                    <span>Filtres (0)</span>
                    <span>Trier par : Pertinence</span>
                  </div>
                </div>

                <div className="mt-5">
                  {isDemoLoading ? (
                    <StackSkeleton count={3} />
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      {demoAgencies.map(() => null)}
                      {demoAgencies.length === 0
                        ? Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="space-y-2">
                              <p className="h-3.5 rounded bg-muted" />
                              <p className="h-2.5 w-2/3 rounded bg-muted" />
                              <p className="h-2.5 rounded bg-muted" />
                              <p className="h-2.5 w-1/2 rounded bg-muted" />
                              <div className="flex items-center justify-between pt-4">
                                <p className="h-2.5 w-24 rounded bg-muted" />
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[13px] font-semibold" />
                              </div>
                            </div>
                          ))
                        : null}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <Link
              to="/connexion"
              aria-label="Se connecter pour lancer la démonstration"
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Play className="h-5 w-5 fill-current" strokeWidth={0} />
            </Link>
          </div>
        </section>

        <section className="py-16 text-center">
          <p className="text-[13.5px] text-muted-foreground">
            Prêt à essayer ? Créez votre compte gratuitement
          </p>
          <Link
            to="/connexion"
            className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            S'inscrire maintenant
          </Link>
        </section>
      </main>
    </div>
  );
}
