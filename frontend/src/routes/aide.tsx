import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, LifeBuoy } from "lucide-react";
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
  "Centre d'aide": {
    en: "Help center",
    ar: "مركز المساعدة",
    es: "Centro de ayuda",
  },
  "Une question sur votre compte, un projet ou le fonctionnement de la plateforme ? Consultez notre FAQ ou contactez notre équipe directement.":
    {
      en: "A question about your account, a project, or how the platform works? Check our FAQ or contact our team directly.",
      ar: "هل لديك سؤال حول حسابك أو أحد مشاريعك أو طريقة عمل المنصة؟ اطّلع على الأسئلة الشائعة أو تواصل مباشرة مع فريقنا.",
      es: "¿Tienes alguna pregunta sobre tu cuenta, un proyecto o el funcionamiento de la plataforma? Consulta nuestras preguntas frecuentes o contacta directamente con nuestro equipo.",
    },
  "Consulter la FAQ": {
    en: "View the FAQ",
    ar: "الاطلاع على الأسئلة الشائعة",
    es: "Ver las preguntas frecuentes",
  },
  "Nous contacter": {
    en: "Contact us",
    ar: "تواصل معنا",
    es: "Contáctanos",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Centre d'aide — Sortlist" },
      {
        name: "description",
        content: "Besoin d'aide ? Contactez l'équipe Sortlist ou consultez notre FAQ.",
      },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
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
          <span className="text-foreground">{tt("Centre d'aide")}</span>
        </nav>

        <section className="mt-8 max-w-[600px] mx-auto text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <LifeBuoy className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h1 className="mt-5 text-[30px] font-bold tracking-tight">{tt("Centre d'aide")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt(
              "Une question sur votre compte, un projet ou le fonctionnement de la plateforme ? Consultez notre FAQ ou contactez notre équipe directement.",
            )}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/faq"
              className="rounded-md border border-border px-6 py-3 text-[13.5px] font-semibold transition-colors hover:bg-muted/40"
            >
              {tt("Consulter la FAQ")}
            </Link>

            <a
              href="mailto:contact@sortlistpro.com"
              className="rounded-md bg-primary px-6 py-3 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {tt("Nous contacter")}
            </a>
          </div>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
