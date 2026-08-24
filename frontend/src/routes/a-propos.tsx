import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, DoorOpen, Link2, Sparkles, TrendingUp } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Sortlist" },
      {
        name: "description",
        content:
          "Découvrez la mission de Sortlist, la plateforme B2B qui connecte entreprises et agences grâce à un matching intelligent.",
      },
      { property: "og:title", content: "À propos — Sortlist" },
      {
        property: "og:description",
        content: "La mission, la vision et l'approche de Sortlist.",
      },
    ],
  }),
  component: AboutPage,
});

const APPROACH = [
  {
    icon: Link2,
    title: "Connexion",
    description:
      "Nous rapprochons les entreprises pertinentes pour créer des relations à forte valeur ajoutée.",
  },
  {
    icon: Sparkles,
    title: "Simplicité",
    description:
      "Une expérience fluide et intuitive pour des échanges rapides, clairs et efficaces.",
  },
  {
    icon: TrendingUp,
    title: "Opportunités",
    description:
      "Nous ouvrons la porte à de nouvelles collaborations et à des opportunités de croissance durable.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <section className="mx-auto grid max-w-[1080px] grid-cols-1 items-center gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            À propos
          </p>
          <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight sm:text-[38px]">
            Nous créons de nouvelles façons de connecter les entreprises.
          </h1>
          <p className="mt-5 max-w-[440px] text-[14px] leading-[1.65] text-muted-foreground">
            Notre approche B2B repense la manière dont les entreprises se rencontrent, collaborent
            et se développent ensemble. Nous construisons un écosystème simple, utile et efficace
            pour générer des opportunités qui ont du sens.
          </p>

          <a
            href="#notre-approche"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Découvrir notre concept
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src="https://images.unsplash.com/photo-1551161440-88a5c5b09ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Architecture moderne, immeuble de bureaux"
            className="h-[380px] w-full object-cover grayscale"
          />
        </div>
      </section>

      <section id="notre-vision" className="mt-20 border-t border-border">
        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Notre vision
            </p>
            <h2 className="mt-3 text-[24px] font-bold leading-tight tracking-tight">
              Réinventer les connexions B2B pour un avenir plus collaboratif, agile et innovant.
            </h2>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <p className="text-[13.5px] leading-[1.65] text-muted-foreground">
              Nous croyons que chaque entreprise a le potentiel de grandir grâce aux bonnes
              connexions.
            </p>
            <p className="text-[13.5px] leading-[1.65] text-muted-foreground">
              Notre mission est de créer un environnement de confiance où les échanges sont
              facilités et les opportunités dévoilées.
            </p>
          </div>
        </div>
      </section>

      <section id="notre-approche" className="border-t border-border">
        <div className="mx-auto max-w-[1080px] px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Notre approche
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {APPROACH.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border">
                  <item.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-[14px] font-bold uppercase tracking-wide">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border lg:grid-cols-2">
          <div className="flex min-h-[260px] items-center justify-center bg-foreground">
            <DoorOpen className="h-16 w-16 text-background" strokeWidth={1.2} />
          </div>
          <div className="flex flex-col justify-center bg-foreground p-8 text-background sm:p-10">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-background/60">
              Un concept nouveau
            </p>
            <h2 className="mt-3 text-[22px] font-bold leading-tight tracking-tight">
              Nous ne suivons pas le chemin existant. Nous en créons un nouveau.
            </h2>
            <p className="mt-4 text-[13.5px] leading-[1.6] text-background/70">
              Notre concept est en cours de lancement. Nous construisons avec nos premiers
              partenaires un écosystème B2B différent.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 border-t border-border">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="max-w-[520px] text-[14px] leading-[1.6] text-foreground">
            Vous souhaitez découvrir notre concept ou en savoir plus sur notre approche ?
          </p>

          <a
            href="mailto:contact@sortlistpro.com"
            className="shrink-0 rounded-md bg-primary px-6 py-3 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Nous contacter
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
