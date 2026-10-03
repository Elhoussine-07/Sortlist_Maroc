import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileBarChart } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const PAGE_TEXT = {
  "Fil d'ariane": {
    en: "Breadcrumb",
    ar: "مسار التنقل",
    es: "Ruta de navegación",
  },
  "Accueil": {
    en: "Home",
    ar: "الرئيسية",
    es: "Inicio",
  },
  "Études et rapports": {
    en: "Studies & reports",
    ar: "دراسات وتقارير",
    es: "Estudios e informes",
  },
  "Des analyses et rapports sur le marché B2B et les tendances de collaboration entre entreprises et agences.":
    {
      en: "Analyses and reports on the B2B market and collaboration trends between companies and agencies.",
      ar: "تحليلات وتقارير حول سوق B2B واتجاهات التعاون بين الشركات والوكالات.",
      es: "Análisis e informes sobre el mercado B2B y las tendencias de colaboración entre empresas y agencias.",
    },
  "Aucune étude publiée pour le moment": {
    en: "No studies published yet",
    ar: "لا توجد دراسات منشورة حتى الآن",
    es: "Aún no hay estudios publicados",
  },
  "Nos premières études et rapports seront publiés ici.": {
    en: "Our first studies and reports will be published here.",
    ar: "سيتم نشر أولى دراساتنا وتقاريرنا هنا.",
    es: "Aquí publicaremos nuestros primeros estudios e informes.",
  },
} satisfies PageTextDict;

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
  const { tt } = usePageText(PAGE_TEXT);
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader variant="landing" />

      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
        <nav
          aria-label={tt("Fil d'ariane")}
          className="flex items-center gap-2 pt-6 text-[13px] text-muted-foreground"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            {tt("Accueil")}
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={1.8} />
          <span className="text-foreground">{tt("Études et rapports")}</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">{tt("Études et rapports")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt(
              "Des analyses et rapports sur le marché B2B et les tendances de collaboration entre entreprises et agences.",
            )}
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <FileBarChart className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">
            {tt("Aucune étude publiée pour le moment")}
          </p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            {tt("Nos premières études et rapports seront publiés ici.")}
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
