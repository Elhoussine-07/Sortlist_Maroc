import { createFileRoute } from "@tanstack/react-router";
import { SmartBriefing } from "@/components/briefing/SmartBriefing";

interface PostulerUnProjetSearch {
  resume?: string | undefined;
}

export const Route = createFileRoute("/postuler-un-projet")({
  validateSearch: (search: Record<string, unknown>): PostulerUnProjetSearch => ({
    resume: typeof search["resume"] === "string" ? search["resume"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Postuler un projet — Sortlist" },
      {
        name: "description",
        content:
          "Décrivez votre besoin avec le Smart Briefing IA et générez votre cahier des charges en cinq étapes.",
      },
      { property: "og:title", content: "Postuler un projet — Sortlist" },
      {
        property: "og:description",
        content: "Décrivez votre besoin avec le Smart Briefing IA.",
      },
    ],
  }),
  component: ApplyProjectPage,
});

function ApplyProjectPage() {
  const { resume } = Route.useSearch();
  return <SmartBriefing resumeProjectId={resume} />;
}
