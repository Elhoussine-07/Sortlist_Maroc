import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight } from "lucide-react";
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
  "Guides et tutoriels": {
    en: "Guides & tutorials",
    ar: "أدلة ودروس تعليمية",
    es: "Guías y tutoriales",
  },
  "Des guides pratiques pour tirer le meilleur parti de Sortlist.": {
    en: "Practical guides to help you get the most out of Sortlist.",
    ar: "أدلة عملية لمساعدتك على الاستفادة القصوى من Sortlist.",
    es: "Guías prácticas para sacar el máximo partido a Sortlist.",
  },
  "Aucun guide publié pour le moment": {
    en: "No guides published yet",
    ar: "لا توجد أدلة منشورة حتى الآن",
    es: "Aún no hay guías publicadas",
  },
  "Cette section sera bientôt enrichie de guides pratiques.": {
    en: "This section will soon be filled with practical guides.",
    ar: "سيتم إثراء هذا القسم قريبًا بأدلة عملية.",
    es: "Esta sección se enriquecerá pronto con guías prácticas.",
  },
} satisfies PageTextDict;

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Guides et tutoriels — Sortlist" },
      {
        name: "description",
        content: "Guides et tutoriels pour bien démarrer sur Sortlist, bientôt disponibles.",
      },
    ],
  }),
  component: GuidesPage,
});

function GuidesPage() {
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
          <span className="text-foreground">{tt("Guides et tutoriels")}</span>
        </nav>

        <section className="mt-8 max-w-[720px]">
          <h1 className="text-[30px] font-bold tracking-tight">{tt("Guides et tutoriels")}</h1>
          <p className="mt-4 text-[14px] leading-[1.65] text-muted-foreground">
            {tt("Des guides pratiques pour tirer le meilleur parti de Sortlist.")}
          </p>
        </section>

        <section className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-4 text-[14px] font-semibold">
            {tt("Aucun guide publié pour le moment")}
          </p>
          <p className="mt-1.5 max-w-[360px] text-[13px] leading-[1.5] text-muted-foreground">
            {tt("Cette section sera bientôt enrichie de guides pratiques.")}
          </p>
        </section>

        <section className="pb-20" />
      </main>

      <Footer />
    </div>
  );
}
