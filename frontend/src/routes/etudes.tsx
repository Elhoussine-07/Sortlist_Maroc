import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileBarChart } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export const Route = createFileRoute("/etudes")({
  head: () => ({
    meta: [
      { title: "Études et rapports — Sortlist" },
      {
        name: "description",
        content: "Études et rapports Sortlist sur le marché B2B, bientôt disponibles.",
      },
    ],
  }),
  component: StudiesPage,
});

function StudiesPage() {
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
          <span className="text-foreground">Études et rapports</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">Études et rapports</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            Des analyses et rapports sur le marché B2B et les tendances de collaboration entre
            entreprises et agences.
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <FileBarChart className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">Aucune étude publiée pour le moment</p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            Nos premières études et rapports seront publiés ici.
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
