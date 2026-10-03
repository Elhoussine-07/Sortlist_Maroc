import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileQuestion } from "lucide-react";
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
  "Ressources et conseils": {
    en: "Resources & advice",
    ar: "موارد ونصائح",
    es: "Recursos y consejos",
  },
  "Des guides et conseils pour aider les agences à mieux utiliser Sortlist.": {
    en: "Guides and advice to help agencies get more out of Sortlist.",
    ar: "أدلة ونصائح لمساعدة الوكالات على الاستفادة بشكل أفضل من Sortlist.",
    es: "Guías y consejos para ayudar a las agencias a sacar más partido de Sortlist.",
  },
  "Aucune ressource publiée pour le moment": {
    en: "No resources published yet",
    ar: "لا توجد موارد منشورة حتى الآن",
    es: "Aún no hay recursos publicados",
  },
  "Cette section sera alimentée prochainement avec des guides et conseils pratiques.": {
    en: "This section will soon be filled with practical guides and advice.",
    ar: "سيتم تزويد هذا القسم قريبًا بأدلة ونصائح عملية.",
    es: "Esta sección se completará próximamente con guías y consejos prácticos.",
  },
} satisfies PageTextDict;

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
          <span className="text-foreground">{tt("Ressources et conseils")}</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">
            {tt("Ressources et conseils")}
          </h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt("Des guides et conseils pour aider les agences à mieux utiliser Sortlist.")}
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <FileQuestion className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">
            {tt("Aucune ressource publiée pour le moment")}
          </p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            {tt(
              "Cette section sera alimentée prochainement avec des guides et conseils pratiques.",
            )}
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
