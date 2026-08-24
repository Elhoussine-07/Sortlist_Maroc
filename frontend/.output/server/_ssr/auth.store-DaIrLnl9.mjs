import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.store-DaIrLnl9.js
var useAuthStore = create()(persist((set) => ({
	user: null,
	token: null,
	role: null,
	isLoading: false,
	error: null,
	setUser: (user) => set({ user }),
	setToken: (token) => set({ token }),
	setRole: (role) => set({ role }),
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),
	setSession: ({ token, user, role }) => set({
		token,
		user,
		role,
		error: null
	}),
	reset: () => set({
		user: null,
		token: null,
		role: null,
		error: null
	})
}), {
	name: "auth-storage",
	partialize: (state) => ({
		token: state.token,
		user: state.user,
		role: state.role
	})
}));
//#endregion
export { useAuthStore as t };
