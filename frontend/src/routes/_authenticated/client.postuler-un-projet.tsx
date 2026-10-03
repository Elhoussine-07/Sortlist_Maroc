import { createFileRoute } from "@tanstack/react-router";
import { SmartBriefing } from "@/components/briefing/SmartBriefing";
import { ArrowLeft, Sparkles, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

interface ClientPostulerUnProjetSearch {
  resume?: string | undefined;
}

export const Route = createFileRoute("/_authenticated/client/postuler-un-projet")({
  validateSearch: (search: Record<string, unknown>): ClientPostulerUnProjetSearch => ({
    resume: typeof search["resume"] === "string" ? search["resume"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Postuler un projet | Sortlist" },
      {
        name: "description",
        content:
          "Déposez un nouveau projet : le Smart Briefing IA structure votre cahier des charges en cinq étapes.",
      },
      { property: "og:title", content: "Postuler un projet | Sortlist" },
      {
        property: "og:description",
        content: "Déposez un nouveau projet et trouvez les meilleures agences.",
      },
    ],
  }),
  component: ClientApplyPage,
});

const PAGE_TEXT = {
  "Reprendre mon projet": {
    en: "Resume my project",
    ar: "متابعة مشروعي",
    es: "Reanudar mi proyecto",
  },
  "Nouveau projet": {
    en: "New project",
    ar: "مشروع جديد",
    es: "Nuevo proyecto",
  },
  "IA": {
    en: "AI",
    ar: "ذكاء اصطناعي",
    es: "IA",
  },
  "brouillon": {
    en: "draft",
    ar: "مسودة",
    es: "borrador",
  },
  "Projet visible par les agences correspondantes • 100% gratuit": {
    en: "Project visible to matching agencies • 100% free",
    ar: "المشروع مرئي للوكالات المطابقة • مجاني 100%",
    es: "Proyecto visible para las agencias coincidentes • 100% gratis",
  },
} satisfies PageTextDict;

function ClientApplyPage() {
  const { resume } = Route.useSearch();
  const { tt } = usePageText(PAGE_TEXT);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-4 py-3 sm:px-6 lg:px-8">
        {/* ✅ EN-TÊTE MINIMALISTE */}
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Link
            to="/client/mes-projets"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[18px] font-bold tracking-tight">
              {resume ? tt("Reprendre mon projet") : tt("Nouveau projet")}
            </h1>
            {!resume && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
                {tt("IA")}
              </span>
            )}
            {resume && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Clock className="h-2.5 w-2.5" strokeWidth={2} />
                {tt("brouillon")}
              </span>
            )}
          </div>
        </div>

        {/* ✅ SMART BRIEFING */}
        <div className="mt-3">
          <SmartBriefing resumeProjectId={resume} />
        </div>

        {/* ✅ FOOTER MINIMALISTE */}
        <div className="mt-3 text-center text-[11px] text-muted-foreground">
          <span>{tt("Projet visible par les agences correspondantes • 100% gratuit")}</span>
        </div>
      </div>
    </div>
  );
}
