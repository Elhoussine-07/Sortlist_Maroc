import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BriefingBrief {
  need_type?: string | undefined;
  category?: string | undefined;
  sub_category?: string | undefined;
  description?: string | undefined;
  budget_min?: number | undefined;
  budget_max?: number | undefined;
  location?: string | undefined;
  delivery_delay_days?: number | undefined;
  title?: string | undefined;
  cover_image?: string | undefined;
}

export interface BriefingState {
  currentBrief: BriefingBrief;
  step: number;
  ready: boolean;
  projectId: string | null;
  projectStatus: "draft" | "posted" | null;
  cdcFileUrl: string | null;
  autoPublishRequested: boolean;

  updateBrief: (patch: Partial<BriefingBrief>) => void;
  setStep: (step: number) => void;
  setReady: (ready: boolean) => void;
  setProjectId: (id: string | null) => void;
  setProjectStatus: (status: "draft" | "posted" | null) => void;
  setCdcFileUrl: (url: string | null) => void;
  setAutoPublishRequested: (value: boolean) => void;
  hasDraft: () => boolean;
  reset: () => void;
}

const initialState = {
  currentBrief: {} as BriefingBrief,
  step: 1,
  ready: false,
  projectId: null as string | null,
  projectStatus: null as "draft" | "posted" | null,
  cdcFileUrl: null as string | null,
  autoPublishRequested: false,
};

export const useBriefingStore = create<BriefingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      updateBrief: (patch) =>
        set((state) => ({ currentBrief: { ...state.currentBrief, ...patch } })),
      setStep: (step) => set({ step }),
      setReady: (ready) => set({ ready }),
      setProjectId: (id) => set({ projectId: id }),
      setProjectStatus: (status) => set({ projectStatus: status }),
      setCdcFileUrl: (url) => set({ cdcFileUrl: url }),
      setAutoPublishRequested: (value) => set({ autoPublishRequested: value }),
      hasDraft: () => {
        const brief = get().currentBrief;
        return Object.values(brief).some(
          (value) => value !== undefined && value !== null && value !== "",
        );
      },
      reset: () => set({ ...initialState }),
    }),
    {
      name: "briefing-draft",
      partialize: (state) => ({
        currentBrief: state.currentBrief,
        step: state.step,
        ready: state.ready,
        projectId: state.projectId,
        projectStatus: state.projectStatus,
        cdcFileUrl: state.cdcFileUrl,
        autoPublishRequested: state.autoPublishRequested,
      }),
    },
  ),
);
