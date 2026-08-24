import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileQuestion } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/ressources")({
  head: () => ({
    meta: [
      { title: "Ressources et conseils — Sortlist" },
      {
        name: "description",
        content: "Ressources et conseils pour bien utiliser Sortlist, bientôt disponibles.",
      },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
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
          <span className="text-foreground">Ressources et conseils</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">Ressources et conseils</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            Des guides et conseils pour aider les agences à mieux utiliser Sortlist.
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <FileQuestion className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">Aucune ressource publiée pour le moment</p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            Cette section sera alimentée prochainement avec des guides et conseils pratiques.
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
