import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
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
  ArrowRight,
  Building2,
  Globe,
  Clock,
  DollarSign,
  PenLine,
  Send,
  Users,
  Briefcase,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BriefingStepper } from "./BriefingStepper";
import { EmptyState } from "@/components/common/EmptyState";
import { StackSkeleton } from "@/components/common/Skeletons";
import type { Agency } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const DELAY_PRESETS: Array<{ label: string; days: number; icon: typeof Clock }> = [
  { label: "Urgent (7 jours)", days: 7, icon: Clock },
  { label: "Normal (30 jours)", days: 30, icon: Clock },
  { label: "Flexible (60 jours)", days: 60, icon: Clock },
];

type SummaryKey = keyof BriefingSummary | "title";

const SUMMARY_ROWS: Array<{
  key: SummaryKey;
  label: string;
  icon: typeof LayoutGrid;
  description: string;
}> = [
  {
    key: "category",
    label: "Catégorie du besoin",
    icon: LayoutGrid,
    description: "Type de prestation recherchée",
  },
  {
    key: "description",
    label: "Description du besoin",
    icon: FileText,
    description: "Détails de votre projet",
  },
  { key: "budget", label: "Budget", icon: CreditCard, description: "Enveloppe budgétaire" },
  { key: "location", label: "Localisation", icon: MapPin, description: "Lieu d'exécution" },
  {
    key: "deadline",
    label: "Délai de réalisation",
    icon: Calendar,
    description: "Calendrier souhaité",
  },
  { key: "title", label: "Titre du projet", icon: Heading, description: "Nom de votre projet" },
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
      toast("Votre projet est publié ! Il est maintenant visible par les agences.");
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
      toast("CDC généré ! Votre projet a été publié et est déjà visible des agences.");
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

  const currentStepData = step > 0 && step <= SUMMARY_ROWS.length ? SUMMARY_ROWS[step - 1] : null;

  if (isLoadingResumedDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <StackSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1180px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-slate-900 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.ico" alt="Sortlist Pro" className="h-8 w-auto" />
              <span>Sortlist</span>
            </Link>
            <div className="flex items-center gap-3">
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
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-[14px] font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Recommencer
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-[14px] font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-all hover:bg-indigo-100 hover:scale-105"
              >
                <CircleUserRound className="h-[20px] w-[20px]" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mb-12">
          <BriefingStepper
            currentStep={ready ? 6 : step}
            completedSteps={
              ready ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6].filter((id) => id < step)
            }
            onStepClick={ready ? (id) => handleEdit(id) : undefined}
          />
        </div>

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
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-white/70 p-8 shadow-sm border border-slate-200/60 backdrop-blur-sm">
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    {currentStepData?.icon && <currentStepData.icon className="h-5 w-5" />}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {currentStepData?.label || ""}
                  </h2>
                </div>
                <p className="mt-2 text-sm text-slate-500 ml-13">
                  {currentStepData?.description || ""}
                </p>
              </div>

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

              <div className="mt-10 flex items-center justify-between gap-3 border-t border-slate-200/60 pt-6">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={step === 1}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-[14px] font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                  Précédent
                </button>
                <div className="flex items-center gap-2">
                  {isStepSkippable(step) ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:border-slate-300"
                    >
                      <SkipForward className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Passer
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canGoNext}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {step === 6 ? "Terminer" : "Suivant"}
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 p-8 shadow-sm border border-slate-200/60 backdrop-blur-sm">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <FileText className="h-4 w-4" strokeWidth={1.8} />
                </span>
                Résumé de votre CDC
                <span className="ml-1 text-sm font-normal text-slate-400">(temps réel)</span>
              </h2>

              <div className="mt-6 space-y-5">
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
                    <div
                      key={row.key}
                      className="group flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                        <row.icon className="h-4 w-4" strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700">{row.label}</p>
                        {displayValue ? (
                          <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                            {displayValue}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-sm text-slate-400 italic">À compléter</p>
                        )}
                        {subValue ? <p className="text-sm text-slate-400">{subValue}</p> : null}
                      </div>
                      {isDone ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.6} />
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 p-4 border border-indigo-100/50">
                <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" strokeWidth={1.8} />
                  <span>
                    Une étape = un champ. Vous pourrez revenir modifier certaines réponses depuis le
                    récapitulatif final.
                  </span>
                </p>
              </div>
            </div>
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
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700">
          Catégorie de prestation
          <span className="ml-2 text-sm font-normal text-slate-400">(optionnel)</span>
        </label>
        <CategoryCascadeMenu
          categories={categories}
          isLoadingCategories={isLoadingCategories}
          selectedCategoryId={brief.category}
          selectedSubCategoryId={brief.sub_category}
          onSelect={(categoryId, subCategoryId) =>
            updateBrief({ category: categoryId, sub_category: subCategoryId })
          }
        />
        <p className="mt-2 text-sm text-slate-400">
          Sélectionnez la catégorie qui correspond le mieux à votre projet
        </p>
      </div>
    </div>
  );
}

function CategoryCascadeMenu({
  categories,
  isLoadingCategories,
  selectedCategoryId,
  selectedSubCategoryId,
  onSelect,
}: {
  categories: CategoryOption[];
  isLoadingCategories: boolean;
  selectedCategoryId: string | undefined;
  selectedSubCategoryId: string | undefined;
  onSelect: (categoryId: string | undefined, subCategoryId: string | undefined) => void;
}) {
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;
  const selectedSub =
    selectedCategory?.subCategories.find((sub) => sub.id === selectedSubCategoryId) ?? null;

  const label = selectedCategory
    ? selectedSub
      ? `${selectedCategory.name} → ${selectedSub.name}`
      : selectedCategory.name
    : "Sélectionner une catégorie...";

  if (isLoadingCategories) {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500">Chargement du catalogue...</p>
      </div>
    );
  }
  if (categories.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm text-slate-500">
          Aucune catégorie disponible pour le moment — vous pouvez passer cette étape.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm outline-none transition-all hover:border-slate-300 hover:shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <span className={selectedCategory ? "text-slate-700" : "text-slate-400"}>{label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[280px] rounded-xl border-slate-200 shadow-lg p-1"
        >
          {selectedCategory ? (
            <>
              <DropdownMenuItem
                onClick={() => onSelect(undefined, undefined)}
                className="rounded-lg text-sm text-slate-400 hover:bg-slate-50"
              >
                Effacer la sélection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {categories.map((category) =>
            category.subCategories.length > 0 ? (
              <DropdownMenuSub key={category.id}>
                <DropdownMenuSubTrigger className="rounded-lg text-sm">
                  {category.name}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl border-slate-200 shadow-lg p-1">
                  <DropdownMenuItem
                    onClick={() => onSelect(category.id, undefined)}
                    className="rounded-lg text-sm font-medium text-indigo-600"
                  >
                    {category.name} (toutes)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {category.subCategories.map((sub) => (
                    <DropdownMenuItem
                      key={sub.id}
                      onClick={() => onSelect(category.id, sub.id)}
                      className="rounded-lg text-sm hover:bg-indigo-50"
                    >
                      {sub.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem
                key={category.id}
                onClick={() => onSelect(category.id, undefined)}
                className="rounded-lg text-sm hover:bg-indigo-50"
              >
                {category.name}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
    <div className="space-y-5">
      <div>
        <label
          htmlFor="briefing-description"
          className="block text-sm font-semibold text-slate-700"
        >
          Décrivez votre besoin <span className="ml-1 text-sm font-normal text-red-500">*</span>
        </label>
        <textarea
          id="briefing-description"
          value={brief.description ?? ""}
          onChange={(event) => updateBrief({ description: event.target.value })}
          rows={8}
          placeholder="Décrivez votre projet en détail : objectifs, cibles, contraintes, périmètre..."
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Minimum 20 caractères pour une description complète</span>
          <span>{brief.description?.length || 0} caractères</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onEnrich}
        disabled={isEnriching || !(brief.description ?? "").trim()}
        className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
      >
        {isEnriching ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <Sparkles
            className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform"
            strokeWidth={1.8}
          />
        )}
        {isAuthenticated
          ? "Assistance IA : reformulation + suggestion de budget"
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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="briefing-budget-min"
            className="block text-sm font-semibold text-slate-700"
          >
            Budget minimum (€)
          </label>
          <div className="relative mt-2">
            <DollarSign
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
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
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="briefing-budget-max"
            className="block text-sm font-semibold text-slate-700"
          >
            Budget maximum (€)
          </label>
          <div className="relative mt-2">
            <DollarSign
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
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
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
        <p className="flex items-start gap-2 text-sm text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
          Champ optionnel — vous pouvez passer cette étape si vous ne connaissez pas encore votre
          budget.
        </p>
      </div>
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
    <div className="space-y-5">
      <div>
        <label htmlFor="briefing-location" className="block text-sm font-semibold text-slate-700">
          Localisation
        </label>
        <div className="relative mt-2">
          <MapPin
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <input
            id="briefing-location"
            type="text"
            value={brief.location ?? ""}
            onChange={(event) => updateBrief({ location: event.target.value })}
            placeholder="Ville, pays, ou « à distance »"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="mt-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <p className="flex items-start gap-2 text-sm text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
            Champ optionnel — vous pouvez passer cette étape.
          </p>
        </div>
      </div>
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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Délai de réalisation <span className="ml-1 text-sm font-normal text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DELAY_PRESETS.map((preset) => {
            const isActive = brief.delivery_delay_days === preset.days;
            return (
              <button
                key={preset.days}
                type="button"
                onClick={() => updateBrief({ delivery_delay_days: preset.days })}
                className={`group flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50"
                }`}
              >
                <Clock
                  className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500"}`}
                  strokeWidth={1.8}
                />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label htmlFor="briefing-delay" className="block text-sm font-semibold text-slate-700">
          Ou préciser un nombre de jours
        </label>
        <div className="relative mt-2 max-w-[200px]">
          <Calendar
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <input
            id="briefing-delay"
            type="number"
            min={1}
            value={brief.delivery_delay_days ?? ""}
            onChange={(event) =>
              updateBrief({
                delivery_delay_days:
                  event.target.value === "" ? undefined : Number(event.target.value),
              })
            }
            placeholder="Jours"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
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
    <div className="space-y-5">
      <div>
        <label htmlFor="briefing-title" className="block text-sm font-semibold text-slate-700">
          Titre du projet
          <span className="ml-2 text-sm font-normal text-slate-400">(optionnel)</span>
        </label>
        <div className="relative mt-2">
          <Heading
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <input
            id="briefing-title"
            type="text"
            value={brief.title ?? ""}
            onChange={(event) => updateBrief({ title: event.target.value })}
            placeholder="Ex: Refonte site e-commerce, Création d'application mobile..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="mt-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <p className="flex items-start gap-2 text-sm text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
            Ce titre apparaîtra dans votre tableau de bord. S'il est laissé vide, un titre
            automatique sera attribué.
          </p>
        </div>
      </div>
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
  onGenerateCdc: () => void;
  onPublish: () => void;
  publishedProjectId: string | null;
  shortlist: Agency[];
  isLoadingShortlist: boolean;
  contactedAgencyIds: string[];
  contactingAgencyId: string | null;
  onContactAgency: (agencyId: string) => void;
  onResetBriefing: () => void;
}) {
  return (
    <div className="mx-auto max-w-[820px]">
      <div className="text-center mb-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <Check className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Votre brief est prêt !</h1>
        <p className="mt-3 text-base text-slate-500 max-w-lg mx-auto">
          Voici le récapitulatif de votre cahier des charges. Cliquez sur une étape ci-dessus pour
          la modifier.
        </p>
      </div>

      <div className="rounded-2xl bg-white/80 p-8 shadow-sm border border-slate-200/60 backdrop-blur-sm">
        <dl className="space-y-6">
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
                className="flex items-start gap-4 pb-6 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <row.icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-sm font-semibold text-slate-700">{row.label}</dt>
                  <dd className="mt-1">
                    {displayValue ? (
                      <p className="whitespace-pre-line text-sm font-medium text-slate-900 leading-relaxed">
                        {displayValue}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">À compléter</p>
                    )}
                    {subValue ? <p className="mt-0.5 text-sm text-slate-400">{subValue}</p> : null}
                  </dd>
                </div>
                {displayValue && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.6} />
                  </span>
                )}
              </div>
            );
          })}
        </dl>
      </div>

      {!publishedProjectId ? (
        <div className="mt-10">
          {!isComplete ? (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200/60 p-5">
              <p className="flex items-start gap-3 text-sm text-amber-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
                <span>
                  La description et le délai de réalisation sont obligatoires. Cliquez sur ces
                  étapes ci-dessus pour les compléter avant de générer le CDC.
                </span>
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-sm"
            >
              <PenLine className="h-4 w-4" strokeWidth={1.8} />
              Modifier
            </button>
            <button
              type="button"
              onClick={onGenerateCdc}
              disabled={isGeneratingCdc || !isComplete}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            >
              {isGeneratingCdc ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
              ) : (
                <FileText className="h-4 w-4 text-indigo-500" strokeWidth={1.8} />
              )}
              Générer le CDC (PDF)
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing || !isComplete}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
              ) : (
                <Send className="h-4 w-4" strokeWidth={1.8} />
              )}
              Publier le projet
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p className="flex items-start gap-2 text-sm text-slate-500">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
              <span>
                « Générer le CDC » publie automatiquement votre projet aux agences. « Publier le
                projet » est le point d'entrée normal.
              </span>
            </p>
          </div>
        </div>
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
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Users className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agences recommandées</h2>
          <p className="text-sm text-slate-500">
            Sélection générée par l'IA pour votre projet{" "}
            <span className="font-semibold text-slate-700">#{projectId}</span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white/70 p-6 border border-slate-200/60"
              >
                <div className="h-6 w-32 rounded-lg bg-slate-200" />
                <div className="mt-3 h-4 w-24 rounded-lg bg-slate-100" />
                <div className="mt-4 h-12 rounded-lg bg-slate-100" />
                <div className="mt-4 flex gap-2">
                  <div className="h-10 w-24 rounded-xl bg-slate-200" />
                  <div className="h-10 w-24 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : shortlist.length === 0 ? (
          <div className="rounded-2xl bg-white/70 p-12 text-center border border-slate-200/60">
            <EmptyState message="Aucune agence recommandée pour le moment." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {shortlist.map((agency) => {
              const isContacted = contactedAgencyIds.includes(agency.id);
              return (
                <article
                  key={agency.id}
                  className="group rounded-2xl bg-white/80 p-6 border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {agency.name}
                        </h3>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                        {agency.location}
                      </p>
                    </div>
                    {agency.matchingScore !== null ? (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        <Star className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                        {agency.matchingScore}%
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-500">{agency.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onContactAgency(agency.id)}
                      disabled={isContacted || contactingAgencyId === agency.id}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                        isContacted
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200"
                      }`}
                    >
                      {contactingAgencyId === agency.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isContacted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {isContacted ? "Contactée" : "Contacter"}
                    </button>
                    <Link
                      to="/agences/$id"
                      params={{ id: agency.id }}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
                    >
                      <Globe className="h-4 w-4" strokeWidth={1.8} />
                      Voir profil
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 pt-8 border-t border-slate-200/60">
        <Link
          to="/client/mes-projets"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
        >
          <Briefcase className="h-4 w-4" strokeWidth={1.8} />
          Voir mes projets
        </Link>
        <button
          type="button"
          onClick={onResetBriefing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
          Nouveau projet
        </button>
      </div>
    </div>
  );
}
