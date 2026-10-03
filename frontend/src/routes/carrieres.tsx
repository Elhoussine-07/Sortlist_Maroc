import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, ChevronRight } from "lucide-react";
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
  "Carrières": {
    en: "Careers",
    ar: "الوظائف",
    es: "Empleo",
  },
  "Envie de rejoindre l'aventure Sortlist ?": {
    en: "Want to join the Sortlist adventure?",
    ar: "هل ترغب في الانضمام إلى مغامرة Sortlist؟",
    es: "¿Quieres unirte a la aventura Sortlist?",
  },
  "Aucune offre publiée pour le moment": {
    en: "No openings published yet",
    ar: "لا توجد عروض عمل منشورة حاليًا",
    es: "Aún no hay ofertas publicadas",
  },
  "Nous n'avons pas d'offres ouvertes actuellement. Revenez bientôt.": {
    en: "We don't have any open positions right now. Check back soon.",
    ar: "لا توجد لدينا وظائف شاغرة حاليًا. عودوا قريبًا.",
    es: "Actualmente no tenemos vacantes abiertas. Vuelve pronto.",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/carrieres")({
  head: () => ({
    meta: [
      { title: "Carrières — Sortlist" },
      {
        name: "description",
        content: "Aucune offre d'emploi n'est publiée pour le moment chez Sortlist.",
      },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
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
          <span className="text-foreground">{tt("Carrières")}</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">{tt("Carrières")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt("Envie de rejoindre l'aventure Sortlist ?")}
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <Briefcase className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">
            {tt("Aucune offre publiée pour le moment")}
          </p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            {tt("Nous n'avons pas d'offres ouvertes actuellement. Revenez bientôt.")}
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
