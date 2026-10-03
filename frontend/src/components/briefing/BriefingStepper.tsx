import { Check } from "lucide-react";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const BRIEFING_STEPPER_TEXT = {
  Catégorie: { en: "Category", ar: "فئة", es: "Categoría" },
  "du besoin": { en: "of the need", ar: "الاحتياج", es: "de la necesidad" },
  Description: { en: "Description", ar: "وصف", es: "Descripción" },
  Budget: { en: "Budget", ar: "الميزانية", es: "Presupuesto" },
  Localisation: { en: "Location", ar: "الموقع", es: "Ubicación" },
  "Délai de": { en: "Delivery", ar: "مدة", es: "Plazo de" },
  réalisation: { en: "timeline", ar: "الإنجاز", es: "ejecución" },
  "Titre du": { en: "Project", ar: "عنوان", es: "Título del" },
  projet: { en: "title", ar: "المشروع", es: "proyecto" },
} satisfies PageTextDict;

export const BRIEFING_STEPS = [
  { id: 1, line1: "Catégorie", line2: "du besoin" },
  { id: 2, line1: "Description", line2: "du besoin" },
  { id: 3, line1: "Budget", line2: "" },
  { id: 4, line1: "Localisation", line2: "" },
  { id: 5, line1: "Délai de", line2: "réalisation" },
  { id: 6, line1: "Titre du", line2: "projet" },
] as const;

export function BriefingStepper({
  currentStep,
  completedSteps,
  onStepClick,
}: {
  currentStep: number;
  completedSteps: number[];

  onStepClick?: ((stepId: number) => void) | undefined;
}) {
  const { tt } = usePageText(BRIEFING_STEPPER_TEXT);
  return (
    <ol className="flex items-start">
      {BRIEFING_STEPS.map((step, index) => {
        const isDone = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isFilled = isDone || isCurrent;
        const isClickable = Boolean(onStepClick) && (isDone || isCurrent);

        return (
          <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={index === 0 ? "h-px flex-1 bg-transparent" : "h-px flex-1 bg-border"}
              />
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick?.(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={
                  isFilled
                    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13.5px] font-semibold text-primary-foreground disabled:cursor-default"
                    : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[13.5px] font-semibold disabled:cursor-default"
                }
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : step.id}
              </button>
              <span
                className={
                  index === BRIEFING_STEPS.length - 1
                    ? "h-px flex-1 bg-transparent"
                    : "h-px flex-1 bg-border"
                }
              />
            </div>
            <p className="mt-2 text-center text-[13px] leading-[1.35]">
              {tt(step.line1)}
              {step.line2 ? (
                <>
                  <br />
                  {tt(step.line2)}
                </>
              ) : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
