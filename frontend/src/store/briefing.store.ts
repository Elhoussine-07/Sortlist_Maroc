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
  /** URL de la photo optionnelle du projet, déjà téléversée via `uploadFile()` (cf. SmartBriefing.tsx::TitleStep). */
  cover_image?: string | undefined;
}

export interface BriefingState {
  currentBrief: BriefingBrief;
  step: number;
  /** `true` quand l'utilisateur a validé l'étape 5 -> vue récapitulative (04b). */
  ready: boolean;
  /**
   * Identifiant du `Project` déjà créé côté backend par un appel précédent à
   * `generateCdcPdf` (voir le commentaire dans `briefing.service.ts` :
   * `create_project_from_briefing` poste réellement le projet, il n'existe
   * pas de brouillon intermédiaire pour ce chemin-là). `null` tant qu'aucun
   * appel n'a réussi.
   */
  projectId: string | null;
  /**
   * Statut connu du `Project` référencé par `projectId` :
   *  - "draft" : créé via `saveProjectDraft`/`createProject` (statut Frappe
   *    réel `Draft`) — `projects.service.ts::publishProject` est alors
   *    l'action correcte pour le publier.
   *  - "posted" : créé via `briefing.service.ts::generateCdcPdf`, qui poste
   *    le projet immédiatement côté backend (voir le commentaire détaillé
   *    dans ce fichier) — republier lèverait une erreur backend
   *    ("Ce projet est déjà publié"), donc `handlePublish` ne le fait pas.
   */
  projectStatus: "draft" | "posted" | null;
  /** Dernière URL de CDC PDF générée (blob object URL), pour affichage/téléchargement. */
  cdcFileUrl: string | null;
  /**
   * Positionné par `connexion.tsx` juste avant de naviguer vers le Smart
   * Briefing authentifié, quand un brief persistant existe et que
   * `?redirect=postuler-un-projet` est présent dans l'URL de connexion.
   * `SmartBriefing` consomme ce flag une fois (déclenche `handlePublish`
   * automatiquement) puis le remet à `false`.
   */
  autoPublishRequested: boolean;

  updateBrief: (patch: Partial<BriefingBrief>) => void;
  setStep: (step: number) => void;
  setReady: (ready: boolean) => void;
  setProjectId: (id: string | null) => void;
  setProjectStatus: (status: "draft" | "posted" | null) => void;
  setCdcFileUrl: (url: string | null) => void;
  setAutoPublishRequested: (value: boolean) => void;
  /** `true` s'il existe un brief en cours (utilisé par `connexion.tsx` pour décider de rediriger). */
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
