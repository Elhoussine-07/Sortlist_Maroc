import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Info,
  LayoutGrid,
  Loader2,
  Lock,
  MapPin,
  Save,
  SkipForward,
  Sparkles,
  CircleUserRound,
  RotateCcw,
  Star,
  Heading,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BriefingStepper } from "./BriefingStepper";
import { EmptyState } from "@/components/common/EmptyState";
import { StackSkeleton } from "@/components/common/Skeletons";
import type { Agency } from "@/lib/types";
import {
  enrichBriefingDescription,
  generateCdcPdf,
  summaryFromBrief,
  type BriefingSummary,
} from "@/services/briefing.service";
import {
  contactAgencies,
  getCategories,
  getProjectShortlist,
  type CategoryOption,
} from "@/services/agencies.service";
import {
  createProject,
  getProject,
  publishProject,
  saveProjectDraft,
} from "@/services/projects.service";
import { ApiError } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";
import { useBriefingStore, type BriefingBrief } from "@/store/briefing.store";

/**
 * SMART BRIEFING IA — écrans 04a (questionnaire) et 04b (récapitulatif final).
 *
 * Réécrit en questionnaire à 6 étapes fixes (5 champs réels du Project + titre).
 * La logique est conservée du 2ème code, le design du 1er.
 */

const NEED_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "Projet", label: "Projet" },
  { value: "Stage", label: "Stage" },
  { value: "Job", label: "Emploi (Job)" },
];

const DELAY_PRESETS: Array<{ label: string; days: number }> = [
  { label: "Urgent (7 jours)", days: 7 },
  { label: "Normal (30 jours)", days: 30 },
  { label: "Flexible (60 jours)", days: 60 },
];

type SummaryKey = keyof BriefingSummary | "title";

const SUMMARY_ROWS: Array<{
  key: SummaryKey;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { key: "category", label: "Catégorie du besoin", icon: LayoutGrid },
  { key: "description", label: "Description du besoin", icon: FileText },
  { key: "budget", label: "Budget", icon: CreditCard },
  { key: "location", label: "Localisation", icon: MapPin },
  { key: "deadline", label: "Délai de réalisation", icon: Calendar },
  { key: "title", label: "Titre du projet", icon: Heading },
];

function isStepSkippable(step: number): boolean {
  return step !== 2 && step !== 5;
}

function isStepValid(step: number, brief: BriefingBrief): boolean {
  if (step === 2) return Boolean(brief.description && brief.description.trim().length > 0);
  if (step === 5)
    return typeof brief.delivery_delay_days === "number" && brief.delivery_delay_days > 0;
  return true;
}

function toCamelBrief(brief: BriefingBrief) {
  return {
    needType: brief.need_type,
    category: brief.category,
    subCategory: brief.sub_category,
    budgetMin: brief.budget_min,
    budgetMax: brief.budget_max,
    location: brief.location,
    deliveryDelayDays: brief.delivery_delay_days,
    description: brief.description,
    title: brief.title,
  };
}

function hasAnyBriefValue(brief: BriefingBrief): boolean {
  return Object.values(brief).some(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function redirectToLoginPreservingDraft() {
  window.location.href = "/connexion?redirect=postuler-un-projet";
}

export function SmartBriefing({ resumeProjectId }: { resumeProjectId?: string | undefined } = {}) {
  const token = useAuthStore((state) => state.token);

  const currentBrief = useBriefingStore((state) => state.currentBrief);
  const step = useBriefingStore((state) => state.step);
  const ready = useBriefingStore((state) => state.ready);
  const projectId = useBriefingStore((state) => state.projectId);
  const projectStatus = useBriefingStore((state) => state.projectStatus);
  const autoPublishRequested = useBriefingStore((state) => state.autoPublishRequested);
  const updateBrief = useBriefingStore((state) => state.updateBrief);
  const setStep = useBriefingStore((state) => state.setStep);
  const setReady = useBriefingStore((state) => state.setReady);
  const setProjectId = useBriefingStore((state) => state.setProjectId);
  const setProjectStatus = useBriefingStore((state) => state.setProjectStatus);
  const setCdcFileUrl = useBriefingStore((state) => state.setCdcFileUrl);
  const setAutoPublishRequested = useBriefingStore((state) => state.setAutoPublishRequested);
  const resetBriefing = useBriefingStore((state) => state.reset);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingCdc, setIsGeneratingCdc] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [publishedProjectId, setPublishedProjectId] = useState<string | null>(null);
  const [shortlist, setShortlist] = useState<Agency[]>([]);
  const [isLoadingShortlist, setIsLoadingShortlist] = useState(false);
  const [contactedAgencyIds, setContactedAgencyIds] = useState<string[]>([]);
  const [contactingAgencyId, setContactingAgencyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentBrief.need_type) {
      updateBrief({ need_type: "Projet" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isLoadingResumedDraft, setIsLoadingResumedDraft] = useState(false);

  useEffect(() => {
    if (!resumeProjectId || resumeProjectId === projectId) return;
    let cancelled = false;
    setIsLoadingResumedDraft(true);
    getProject(resumeProjectId)
      .then((project) => {
        if (cancelled) return;
        updateBrief({
          need_type: project.needType || "Projet",
          category: project.category || undefined,
          sub_category: project.subCategory || undefined,
          description: project.description || undefined,
          budget_min: project.budgetMin ?? undefined,
          budget_max: project.budgetMax ?? undefined,
          location: project.location || undefined,
          delivery_delay_days: project.deliveryDelayDays ?? undefined,
          title: project.title || undefined,
        });
        setProjectId(project.id);
        setProjectStatus("draft");
        setStep(6);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast(error instanceof ApiError ? error.message : "Impossible de charger ce brouillon.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingResumedDraft(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeProjectId]);

  const selectedCategory = categories.find((c) => c.id === currentBrief.category) ?? null;
  const summary = useMemo(
    () =>
      summaryFromBrief(currentBrief, {
        categoryLabel: selectedCategory?.name ?? null,
        subCategoryLabel:
          selectedCategory?.subCategories.find((s) => s.id === currentBrief.sub_category)?.name ??
          null,
      }),
    [currentBrief, selectedCategory],
  );

  async function loadShortlist(id: string) {
    setIsLoadingShortlist(true);
    try {
      const items = await getProjectShortlist(id);
      setShortlist(items);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible de charger la shortlist.");
    } finally {
      setIsLoadingShortlist(false);
    }
  }

  async function runPublish() {
    setIsPublishing(true);
    try {
      let finalProjectId = projectId;

      if (finalProjectId && projectStatus === "draft") {
        const project = await publishProject(finalProjectId);
        finalProjectId = project.id;
        setProjectStatus("posted");
      } else if (!finalProjectId || projectStatus !== "posted") {
        const { blob, projectId: newId } = await generateCdcPdf(currentBrief);
        finalProjectId = newId;
        setProjectId(newId);
        setProjectStatus("posted");
        setCdcFileUrl(URL.createObjectURL(blob));
      }

      setPublishedProjectId(finalProjectId);
      toast("Votre projet est publié — il est maintenant visible par les agences.");
      await loadShortlist(finalProjectId);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible de publier le projet.");
    } finally {
      setIsPublishing(false);
    }
  }

  useEffect(() => {
    if (!autoPublishRequested) return;
    setAutoPublishRequested(false);
    if (ready) {
      void runPublish();
    } else {
      toast("Vous êtes connecté(e) : reprenez votre questionnaire, il a été conservé.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPublishRequested]);

  useEffect(() => {
    return () => {
      useBriefingStore.getState().reset();
    };
  }, []);

  function goNext() {
    if (step >= 6) {
      setReady(true);
      return;
    }
    setStep(step + 1);
  }

  function goPrev() {
    if (step > 1) setStep(step - 1);
  }

  async function handleEnrich() {
    if (!token) {
      redirectToLoginPreservingDraft();
      return;
    }
    const description = (currentBrief.description ?? "").trim();
    if (!description) return;
    setIsEnriching(true);
    try {
      const result = await enrichBriefingDescription({
        description,
        category: currentBrief.category ?? null,
      });
      const patch: Partial<BriefingBrief> = { description: result.description };
      if (currentBrief.budget_min == null && result.budgetMin != null) {
        patch.budget_min = result.budgetMin;
      }
      if (currentBrief.budget_max == null && result.budgetMax != null) {
        patch.budget_max = result.budgetMax;
      }
      updateBrief(patch);
      toast(
        patch.budget_min != null || patch.budget_max != null
          ? "Description reformulée et budget suggéré (modifiables à l'étape suivante)."
          : "Description reformulée par l'IA.",
      );
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible de contacter l'assistant IA.");
    } finally {
      setIsEnriching(false);
    }
  }

  async function handleSaveDraft() {
    if (!token) {
      redirectToLoginPreservingDraft();
      return;
    }
    setIsSavingDraft(true);
    try {
      const payload = toCamelBrief(currentBrief);
      const project =
        projectId && projectStatus === "draft"
          ? await saveProjectDraft(projectId, payload)
          : await createProject(payload);
      setProjectId(project.id);
      setProjectStatus("draft");
      toast("Brouillon enregistré.");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible d'enregistrer le brouillon.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleGenerateCdc() {
    if (!token) {
      redirectToLoginPreservingDraft();
      return;
    }
    setIsGeneratingCdc(true);
    try {
      const { blob, projectId: newProjectId } = await generateCdcPdf(currentBrief);
      setProjectId(newProjectId);
      setProjectStatus("posted");
      const url = URL.createObjectURL(blob);
      setCdcFileUrl(url);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cdc-${newProjectId}.pdf`;
      link.click();
      toast(
        "CDC généré — votre projet a été publié et est déjà visible des agences (le backend actuel ne permet pas de générer un aperçu sans publier).",
      );
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Impossible de générer le CDC.");
    } finally {
      setIsGeneratingCdc(false);
    }
  }

  function handlePublish() {
    if (!token) {
      redirectToLoginPreservingDraft();
      return;
    }
    void runPublish();
  }

  async function handleContactAgency(agencyId: string) {
    if (!publishedProjectId) return;
    setContactingAgencyId(agencyId);
    try {
      await contactAgencies(publishedProjectId, [agencyId], undefined);
      setContactedAgencyIds((ids) => [...ids, agencyId]);
      toast("Message envoyé à l'agence.");
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "Envoi impossible.");
    } finally {
      setContactingAgencyId(null);
    }
  }

  function handleEdit(targetStep?: number) {
    setReady(false);
    if (targetStep) setStep(targetStep);
  }

  const canGoNext = isStepValid(step, currentBrief);
  const showRecommencer = !ready && hasAnyBriefValue(currentBrief);

  if (isLoadingResumedDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <StackSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="truncate text-[22px] font-bold tracking-tight">
            Sortlist Pro
          </Link>
          <div className="flex shrink-0 items-center gap-4">
            {showRecommencer ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Recommencer le Smart Briefing ? Les réponses déjà saisies seront perdues.",
                    )
                  ) {
                    resetBriefing();
                  }
                }}
                className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-[14px] font-semibold text-muted-foreground transition-colors hover:bg-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                Recommencer
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-[14px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingDraft ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
              ) : (
                <Save className="h-3.5 w-3.5" strokeWidth={1.8} />
              )}
              Enregistrer brouillon
            </button>
            <Link
              to={token ? "/client/tableau-de-bord" : "/connexion"}
              aria-label="Mon compte"
              className="transition-opacity hover:opacity-70"
            >
              <CircleUserRound className="h-[22px] w-[22px]" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <BriefingStepper
          currentStep={ready ? 6 : step}
          completedSteps={ready ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6].filter((id) => id < step)}
          onStepClick={ready ? (id) => handleEdit(id) : undefined}
        />

        {ready ? (
          <RecapView
            summary={summary}
            title={currentBrief.title}
            isComplete={isStepValid(2, currentBrief) && isStepValid(5, currentBrief)}
            isGeneratingCdc={isGeneratingCdc}
            isPublishing={isPublishing}
            onEdit={() => handleEdit()}
            onGenerateCdc={handleGenerateCdc}
            onPublish={handlePublish}
            publishedProjectId={publishedProjectId}
            shortlist={shortlist}
            isLoadingShortlist={isLoadingShortlist}
            contactedAgencyIds={contactedAgencyIds}
            contactingAgencyId={contactingAgencyId}
            onContactAgency={handleContactAgency}
            onResetBriefing={() => {
              resetBriefing();
              setPublishedProjectId(null);
              setShortlist([]);
            }}
          />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <section>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                {SUMMARY_ROWS[step - 1]?.label ?? ""}
              </h2>

              <div className="mt-6">
                {step === 1 ? (
                  <CategoryStep
                    brief={currentBrief}
                    updateBrief={updateBrief}
                    categories={categories}
                    isLoadingCategories={isLoadingCategories}
                  />
                ) : null}
                {step === 2 ? (
                  <DescriptionStep
                    brief={currentBrief}
                    updateBrief={updateBrief}
                    isAuthenticated={Boolean(token)}
                    isEnriching={isEnriching}
                    onEnrich={handleEnrich}
                  />
                ) : null}
                {step === 3 ? <BudgetStep brief={currentBrief} updateBrief={updateBrief} /> : null}
                {step === 4 ? (
                  <LocationStep brief={currentBrief} updateBrief={updateBrief} />
                ) : null}
                {step === 5 ? <DelayStep brief={currentBrief} updateBrief={updateBrief} /> : null}
                {step === 6 ? <TitleStep brief={currentBrief} updateBrief={updateBrief} /> : null}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={step === 1}
                  className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Précédent
                </button>
                <div className="flex items-center gap-2">
                  {isStepSkippable(step) ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:bg-accent"
                    >
                      <SkipForward className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Passer cette étape
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canGoNext}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {step === 6 ? "Terminer" : "Suivant"}
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </section>

            {/* Colonne droite — résumé du CDC en temps réel (design du 1er) */}
            <section>
              <h2 className="text-[13.5px] font-semibold">
                Résumé de votre CDC{" "}
                <span className="font-normal text-muted-foreground">(en temps réel)</span>
              </h2>

              <div className="mt-5 space-y-6">
                {SUMMARY_ROWS.map((row) => {
                  let displayValue: string | null = null;
                  let isDone = false;
                  let subValue: string | null = null;

                  if (row.key === "title") {
                    displayValue = currentBrief.title || null;
                    isDone = Boolean(displayValue);
                  } else {
                    const entry = summary[row.key as keyof BriefingSummary];
                    displayValue = entry?.value ?? null;
                    isDone = Boolean(entry?.done);
                    if (entry && "subValue" in entry) subValue = entry.subValue;
                  }

                  return (
                    <div key={row.key} className="flex items-start gap-3">
                      <row.icon className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold">{row.label}</p>
                        {displayValue ? (
                          <p className="mt-0.5 whitespace-pre-line text-[13px] leading-[1.5]">
                            {displayValue}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[13px] text-muted-foreground">À compléter</p>
                        )}
                        {subValue ? (
                          <p className="text-[13px] text-muted-foreground">{subValue}</p>
                        ) : null}
                      </div>
                      {isDone ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={2.6} />
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <p className="mt-7 flex items-start gap-2 text-[13px] leading-[1.5] text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                Une étape = un champ. Vous pourrez revenir modifier certaines réponses depuis le
                récapitulatif final, avant de générer le CDC.
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function CategoryStep({
  brief,
  updateBrief,
  categories,
  isLoadingCategories,
}: {
  brief: BriefingBrief;
  updateBrief: (patch: Partial<BriefingBrief>) => void;
  categories: CategoryOption[];
  isLoadingCategories: boolean;
}) {
  const selectedCategory = categories.find((c) => c.id === brief.category) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[13.5px] font-semibold">Type de besoin</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {NEED_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateBrief({ need_type: option.value })}
              className={
                brief.need_type === option.value
                  ? "rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground"
                  : "rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="briefing-category" className="block text-[13.5px] font-semibold">
          Catégorie de prestation{" "}
          <span className="font-normal text-muted-foreground">(optionnel)</span>
        </label>
        {isLoadingCategories ? (
          <p className="mt-2 text-[13px] text-muted-foreground">Chargement du catalogue...</p>
        ) : categories.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            Aucune catégorie disponible pour le moment — vous pouvez passer cette étape.
          </p>
        ) : (
          <select
            id="briefing-category"
            value={brief.category ?? ""}
            onChange={(event) =>
              updateBrief({ category: event.target.value || undefined, sub_category: undefined })
            }
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none"
          >
            <option value="">Sélectionner...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedCategory && selectedCategory.subCategories.length > 0 ? (
        <div>
          <label htmlFor="briefing-subcategory" className="block text-[13.5px] font-semibold">
            Sous-catégorie <span className="font-normal text-muted-foreground">(optionnel)</span>
          </label>
          <select
            id="briefing-subcategory"
            value={brief.sub_category ?? ""}
            onChange={(event) => updateBrief({ sub_category: event.target.value || undefined })}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none"
          >
            <option value="">Sélectionner...</option>
            {selectedCategory.subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

function DescriptionStep({
  brief,
  updateBrief,
  isAuthenticated,
  isEnriching,
  onEnrich,
}: {
  brief: BriefingBrief;
  updateBrief: (patch: Partial<BriefingBrief>) => void;
  isAuthenticated: boolean;
  isEnriching: boolean;
  onEnrich: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="briefing-description" className="block text-[13.5px] font-semibold">
          Décrivez votre besoin
        </label>
        <textarea
          id="briefing-description"
          value={brief.description ?? ""}
          onChange={(event) => updateBrief({ description: event.target.value })}
          rows={8}
          placeholder="Décrivez le projet que vous souhaitez confier à un prestataire..."
          className="mt-2 w-full resize-none rounded-md border border-border bg-transparent px-3 py-2.5 text-[13.5px] leading-[1.55] outline-none placeholder:text-muted-foreground"
        />
      </div>
      <button
        type="button"
        onClick={onEnrich}
        disabled={isEnriching || !(brief.description ?? "").trim()}
        className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isEnriching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
        ) : (
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
        )}
        {isAuthenticated
          ? "Reformuler avec l'IA + suggérer un budget"
          : "Connectez-vous pour l'assistance IA"}
      </button>
    </div>
  );
}

function BudgetStep({
  brief,
  updateBrief,
}: {
  brief: BriefingBrief;
  updateBrief: (patch: Partial<BriefingBrief>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="briefing-budget-min" className="block text-[13.5px] font-semibold">
          Budget minimum (€)
        </label>
        <input
          id="briefing-budget-min"
          type="number"
          min={0}
          value={brief.budget_min ?? ""}
          onChange={(event) =>
            updateBrief({
              budget_min: event.target.value === "" ? undefined : Number(event.target.value),
            })
          }
          placeholder="Ex : 2000"
          className="mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div>
        <label htmlFor="briefing-budget-max" className="block text-[13.5px] font-semibold">
          Budget maximum (€)
        </label>
        <input
          id="briefing-budget-max"
          type="number"
          min={0}
          value={brief.budget_max ?? ""}
          onChange={(event) =>
            updateBrief({
              budget_max: event.target.value === "" ? undefined : Number(event.target.value),
            })
          }
          placeholder="Ex : 5000"
          className="mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-[13px] text-muted-foreground sm:col-span-2">
        Champ optionnel — vous pouvez passer cette étape si vous ne connaissez pas encore votre
        budget.
      </p>
    </div>
  );
}

function LocationStep({
  brief,
  updateBrief,
}: {
  brief: BriefingBrief;
  updateBrief: (patch: Partial<BriefingBrief>) => void;
}) {
  return (
    <div>
      <label htmlFor="briefing-location" className="block text-[13.5px] font-semibold">
        Localisation
      </label>
      <input
        id="briefing-location"
        type="text"
        value={brief.location ?? ""}
        onChange={(event) => updateBrief({ location: event.target.value })}
        placeholder="Ville, pays, ou « à distance »"
        className="mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
      />
      <p className="mt-2 text-[13px] text-muted-foreground">
        Champ optionnel — vous pouvez passer cette étape.
      </p>
    </div>
  );
}

function DelayStep({
  brief,
  updateBrief,
}: {
  brief: BriefingBrief;
  updateBrief: (patch: Partial<BriefingBrief>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {DELAY_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => updateBrief({ delivery_delay_days: preset.days })}
            className={
              brief.delivery_delay_days === preset.days
                ? "rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground"
                : "rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent"
            }
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="briefing-delay-custom" className="block text-[13.5px] font-semibold">
          Ou précisez un nombre de jours
        </label>
        <input
          id="briefing-delay-custom"
          type="number"
          min={1}
          value={brief.delivery_delay_days ?? ""}
          onChange={(event) =>
            updateBrief({
              delivery_delay_days:
                event.target.value === "" ? undefined : Number(event.target.value),
            })
          }
          placeholder="Ex : 21"
          className="mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function TitleStep({
  brief,
  updateBrief,
}: {
  brief: BriefingBrief;
  updateBrief: (patch: Partial<BriefingBrief>) => void;
}) {
  return (
    <div>
      <label htmlFor="briefing-title" className="block text-[13.5px] font-semibold">
        Titre du projet <span className="font-normal text-muted-foreground">(optionnel)</span>
      </label>
      <input
        id="briefing-title"
        type="text"
        value={brief.title ?? ""}
        onChange={(event) => updateBrief({ title: event.target.value })}
        placeholder="Ex : Refonte site e-commerce, Création d'application mobile..."
        className="mt-2 w-full rounded-md border border-border bg-transparent px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
      />
      <p className="mt-2 text-[13px] text-muted-foreground">
        Ce titre apparaîtra dans votre tableau de bord. S'il est laissé vide, un titre automatique
        sera attribué.
      </p>
    </div>
  );
}

function RecapView({
  summary,
  title,
  isComplete,
  isGeneratingCdc,
  isPublishing,
  onEdit,
  onGenerateCdc,
  onPublish,
  publishedProjectId,
  shortlist,
  isLoadingShortlist,
  contactedAgencyIds,
  contactingAgencyId,
  onContactAgency,
  onResetBriefing,
}: {
  summary: BriefingSummary;
  title?: string | undefined;
  isComplete: boolean;
  isGeneratingCdc: boolean;
  isPublishing: boolean;
  onEdit: () => void;
  onGenerateCdc: () => void | Promise<void>;
  onPublish: () => void | Promise<void>;
  publishedProjectId: string | null;
  shortlist: Agency[];
  isLoadingShortlist: boolean;
  contactedAgencyIds: string[];
  contactingAgencyId: string | null;
  onContactAgency: (agencyId: string) => void | Promise<void>;
  onResetBriefing: () => void;
}) {
  return (
    <div className="mx-auto mt-12 max-w-[720px]">
      <h1 className="text-center text-[30px] font-bold tracking-tight">Votre brief est prêt !</h1>
      <p className="mt-2 text-center text-[14px] text-muted-foreground">
        Voici le récapitulatif de votre cahier des charges. Cliquez sur une étape ci-dessus pour la
        modifier.
      </p>

      <dl className="mt-10 space-y-7">
        {SUMMARY_ROWS.map((row) => {
          let displayValue: string | null = null;
          let subValue: string | null = null;

          if (row.key === "title") {
            displayValue = title || null;
          } else {
            const entry = summary[row.key as keyof BriefingSummary];
            displayValue = entry?.value ?? null;
            if (entry && "subValue" in entry) subValue = entry.subValue;
          }

          return (
            <div
              key={row.key}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[auto_200px_minmax(0,1fr)]"
            >
              <row.icon className="mt-0.5 h-[19px] w-[19px] shrink-0" strokeWidth={1.6} />
              <dt className="min-w-0 text-[13.5px] font-bold">{row.label}</dt>
              <dd className="col-span-2 min-w-0 sm:col-span-1">
                {displayValue ? (
                  <p className="whitespace-pre-line text-[13.5px] font-bold leading-[1.55]">
                    {displayValue}
                  </p>
                ) : (
                  <p className="text-[13.5px] font-bold text-muted-foreground">À compléter</p>
                )}
                {subValue ? (
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{subValue}</p>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>

      {!publishedProjectId ? (
        <>
          {!isComplete ? (
            <p className="mt-8 flex items-start gap-2 rounded-md border border-border bg-accent/40 px-4 py-3 text-[13px] leading-[1.5] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
              La description et le délai de réalisation sont obligatoires — cliquez sur ces étapes
              ci-dessus pour les compléter avant de générer le CDC.
            </p>
          ) : null}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md border border-border py-3.5 text-[14px] font-semibold transition-colors hover:bg-accent"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={onGenerateCdc}
              disabled={isGeneratingCdc || !isComplete}
              className="flex items-center justify-center gap-2 rounded-md border border-border py-3.5 text-[14px] font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeneratingCdc ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
              ) : null}
              Générer le CDC (PDF)
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing || !isComplete}
              className="flex items-center justify-center gap-2 rounded-md bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} /> : null}
              Postuler le projet
            </button>
          </div>

          <p className="mt-5 flex items-start gap-2 text-[13px] leading-[1.5] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            En l'état du backend, "Générer le CDC" publie déjà votre projet aux agences (pas
            d'aperçu sans effet de bord disponible) — "Postuler le projet" reste le point d'entrée
            normal.
          </p>
        </>
      ) : (
        <ShortlistSection
          projectId={publishedProjectId}
          shortlist={shortlist}
          isLoading={isLoadingShortlist}
          contactedAgencyIds={contactedAgencyIds}
          contactingAgencyId={contactingAgencyId}
          onContactAgency={onContactAgency}
          onResetBriefing={onResetBriefing}
        />
      )}
    </div>
  );
}

function ShortlistSection({
  projectId,
  shortlist,
  isLoading,
  contactedAgencyIds,
  contactingAgencyId,
  onContactAgency,
  onResetBriefing,
}: {
  projectId: string;
  shortlist: Agency[];
  isLoading: boolean;
  contactedAgencyIds: string[];
  contactingAgencyId: string | null;
  onContactAgency: (agencyId: string) => void;
  onResetBriefing: () => void;
}) {
  return (
    <div className="mt-10 border-t border-border pt-10">
      <h2 className="text-[18px] font-bold tracking-tight">Shortlist d'agences recommandées</h2>
      <p className="mt-1 text-[13.5px] text-muted-foreground">
        Sélection générée par le matching IA pour votre projet{" "}
        <span className="font-semibold">{projectId}</span>.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <StackSkeleton count={3} />
        ) : shortlist.length === 0 ? (
          <EmptyState message="Aucune agence recommandée pour le moment." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shortlist.map((agency) => {
              const isContacted = contactedAgencyIds.includes(agency.id);
              return (
                <article key={agency.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold">{agency.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                        {agency.location}
                      </p>
                    </div>
                    {agency.matchingScore !== null ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[12.5px] font-semibold">
                        <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                        {agency.matchingScore}%
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                    {agency.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onContactAgency(agency.id)}
                      disabled={isContacted || contactingAgencyId === agency.id}
                      className="rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {contactingAgencyId === agency.id
                        ? "Envoi..."
                        : isContacted
                          ? "Envoyé"
                          : "Envoyer"}
                    </button>
                    <Link
                      to="/agences/$id"
                      params={{ id: agency.id }}
                      className="rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold transition-colors hover:bg-accent"
                    >
                      Voir profil
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/client/mes-projets"
          className="rounded-md bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Voir mes projets
        </Link>
        <button
          type="button"
          onClick={onResetBriefing}
          className="rounded-md border border-border px-5 py-3 text-[14px] font-semibold transition-colors hover:bg-accent"
        >
          Publier un nouveau projet
        </button>
      </div>
    </div>
  );
}
