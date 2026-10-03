import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Newspaper } from "lucide-react";
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
  "Blog": {
    en: "Blog",
    ar: "المدونة",
    es: "Blog",
  },
  "Actualités, conseils et retours d'expérience autour du B2B.": {
    en: "News, advice and B2B experience from the field.",
    ar: "أخبار ونصائح وتجارب ميدانية حول عالم الأعمال بين الشركات (B2B).",
    es: "Novedades, consejos y experiencias sobre el mundo B2B.",
  },
  "Aucun article publié pour le moment": {
    en: "No articles published yet",
    ar: "لا توجد مقالات منشورة حتى الآن",
    es: "Aún no hay artículos publicados",
  },
  "Revenez bientôt pour découvrir nos premiers articles.": {
    en: "Check back soon to read our first articles.",
    ar: "عودوا قريبًا لاكتشاف أولى مقالاتنا.",
    es: "Vuelve pronto para descubrir nuestros primeros artículos.",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Sortlist" },
      {
        name: "description",
        content: "Le blog Sortlist : actualités et conseils, bientôt disponibles.",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
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
          <span className="text-foreground">{tt("Blog")}</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">{tt("Blog")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt("Actualités, conseils et retours d'expérience autour du B2B.")}
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <Newspaper className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">
            {tt("Aucun article publié pour le moment")}
          </p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            {tt("Revenez bientôt pour découvrir nos premiers articles.")}
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
