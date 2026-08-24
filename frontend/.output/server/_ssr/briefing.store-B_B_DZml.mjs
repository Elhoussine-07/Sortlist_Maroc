import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/briefing.store-B_B_DZml.js
var initialState = {
	currentBrief: {},
	step: 1,
	ready: false,
	projectId: null,
	projectStatus: null,
	cdcFileUrl: null,
	autoPublishRequested: false
};
var useBriefingStore = create()(persist((set, get) => ({
	...initialState,
	updateBrief: (patch) => set((state) => ({ currentBrief: {
		...state.currentBrief,
		...patch
	} })),
	setStep: (step) => set({ step }),
	setReady: (ready) => set({ ready }),
	setProjectId: (id) => set({ projectId: id }),
	setProjectStatus: (status) => set({ projectStatus: status }),
	setCdcFileUrl: (url) => set({ cdcFileUrl: url }),
	setAutoPublishRequested: (value) => set({ autoPublishRequested: value }),
	hasDraft: () => {
		const brief = get().currentBrief;
		return Object.values(brief).some((value) => value !== void 0 && value !== null && value !== "");
	},
	reset: () => set({ ...initialState })
}), {
	name: "briefing-draft",
	partialize: (state) => ({
		currentBrief: state.currentBrief,
		step: state.step,
		ready: state.ready,
		projectId: state.projectId,
		projectStatus: state.projectStatus,
		cdcFileUrl: state.cdcFileUrl,
		autoPublishRequested: state.autoPublishRequested
	})
}));
//#endregion
export { useBriefingStore as t };
