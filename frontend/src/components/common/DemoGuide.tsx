import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle, X } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { getDemoGuide, setDemoProgress, type DemoGuideStep } from "@/services/demo.service";
import { ApiError } from "@/services/http";
import { EmptyState } from "@/components/common/EmptyState";
import { StackSkeleton } from "@/components/common/Skeletons";

const FALLBACK_VIDEO_URL = "https://player.vimeo.com/video/000000000";

const FALLBACK_STEPS: Record<UserRole, DemoGuideStep[]> = {
  client: [
    { step: 0, title: "Bienvenue", videoUrl: FALLBACK_VIDEO_URL },
    { step: 1, title: "Postuler un projet (Smart Briefing IA)", videoUrl: FALLBACK_VIDEO_URL },
    { step: 2, title: "Suivre Mes Projets", videoUrl: FALLBACK_VIDEO_URL },
    { step: 3, title: "Actions rapides : Unicast & Multicast", videoUrl: FALLBACK_VIDEO_URL },
    { step: 4, title: "Collaborations & avis", videoUrl: FALLBACK_VIDEO_URL },
  ],
  agency: [
    { step: 0, title: "Bienvenue", videoUrl: FALLBACK_VIDEO_URL },
    { step: 1, title: "Compléter votre profil (PQI)", videoUrl: FALLBACK_VIDEO_URL },
    { step: 2, title: "Gérer vos Opportunités", videoUrl: FALLBACK_VIDEO_URL },
    { step: 3, title: "Analytics & Prospection", videoUrl: FALLBACK_VIDEO_URL },
    { step: 4, title: "Facturation", videoUrl: FALLBACK_VIDEO_URL },
  ],
  admin: [
    { step: 0, title: "Bienvenue", videoUrl: FALLBACK_VIDEO_URL },
    { step: 1, title: "Traiter les litiges & suspensions", videoUrl: FALLBACK_VIDEO_URL },
  ],
};

export function DemoGuide({
  accountType,
  open,
  onOpenChange,
}: {
  accountType: UserRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [steps, setSteps] = useState<DemoGuideStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    setHasError(false);
    getDemoGuide(accountType)
      .then((guide) => {
        setSteps(guide.steps.length > 0 ? guide.steps : FALLBACK_STEPS[accountType]);
        setCurrentStep(guide.currentStep);
      })
      .catch(() => {
        setHasError(true);
        setSteps(FALLBACK_STEPS[accountType]);
      })
      .finally(() => setIsLoading(false));
  }, [open, accountType]);

  function goTo(step: number) {
    if (step < 0 || step >= steps.length) return;
    setCurrentStep(step);
    void setDemoProgress(step, step === steps.length - 1).catch(() => {});
  }

  if (!open) return null;

  const activeStep = steps[currentStep];
  const progressPercent =
    steps.length > 0 ? Math.round(((currentStep + 1) / steps.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[640px] rounded-lg border border-border bg-background shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-[15px] font-bold">
            Guide de démarrage —{" "}
            {accountType === "agency"
              ? "Agence"
              : accountType === "admin"
                ? "Administration"
                : "Client"}
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer le guide"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </header>

        <div className="px-6 py-6">
          {isLoading ? (
            <StackSkeleton count={2} />
          ) : steps.length === 0 ? (
            <EmptyState message="Aucune étape de démonstration disponible." />
          ) : (
            <>
              {hasError ? (
                <p className="mb-3 text-[12.5px] text-muted-foreground">
                  Guide affiché en mode hors-ligne (impossible de contacter le serveur).
                </p>
              ) : null}

              <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-accent/40">
                {activeStep ? (
                  <a
                    href={activeStep.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <PlayCircle className="h-10 w-10" strokeWidth={1.5} />
                    <span className="text-[12.5px]">Regarder la vidéo</span>
                  </a>
                ) : null}
              </div>

              <p className="mt-4 text-[14px] font-bold">{activeStep?.title}</p>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                Étape {currentStep + 1} sur {steps.length}
              </p>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goTo(currentStep - 1)}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Précédent
                </button>
                {currentStep === steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Terminer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => goTo(currentStep + 1)}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Suivant
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
