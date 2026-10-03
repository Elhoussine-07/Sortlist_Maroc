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
  "Presse": {
    en: "Press",
    ar: "الصحافة",
    es: "Prensa",
  },
  "Pour toute demande presse, contactez notre équipe directement.": {
    en: "For any press inquiry, contact our team directly.",
    ar: "لأي استفسار صحفي، يرجى التواصل مباشرة مع فريقنا.",
    es: "Para cualquier consulta de prensa, contacta directamente con nuestro equipo.",
  },
  "Aucune mention presse pour le moment": {
    en: "No press mentions yet",
    ar: "لا توجد إشارات صحفية حتى الآن",
    es: "Aún no hay menciones en prensa",
  },
  "Pour toute question presse, écrivez-nous à contact@sortlistpro.com.": {
    en: "For any press question, write to us at contact@sortlistpro.com.",
    ar: "لأي سؤال صحفي، راسلونا على contact@sortlistpro.com.",
    es: "Para cualquier pregunta de prensa, escríbenos a contact@sortlistpro.com.",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/presse")({
  head: () => ({
    meta: [
      { title: "Presse — Sortlist" },
      {
        name: "description",
        content: "Espace presse Sortlist : ressources et contact presse.",
      },
    ],
  }),
  component: PressPage,
});

function PressPage() {
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
          <span className="text-foreground">{tt("Presse")}</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">{tt("Presse")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt("Pour toute demande presse, contactez notre équipe directement.")}
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <Newspaper className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">
            {tt("Aucune mention presse pour le moment")}
          </p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            {tt("Pour toute question presse, écrivez-nous à contact@sortlistpro.com.")}
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
