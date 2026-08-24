import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { b as Star } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as ApiError } from "./http-BM0VI1yy.mjs";
import { p as listFavoriteAgencies, t as EmptyState, x as toggleFavoriteAgency } from "./EmptyState-CjCsYQbe.mjs";
import { n as StackSkeleton } from "./Skeletons-COgUvsAH.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as DashboardShell } from "./DashboardShell-t2TYp7B0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.agences-favorites-Cw6Qpp_w.js
var import_jsx_runtime = require_jsx_runtime();
function initialsOf(name) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
function ClientFavoriteAgenciesPage() {
	const queryClient = useQueryClient();
	const favoritesQuery = useQuery({
		queryKey: ["client", "favorite-agencies"],
		queryFn: listFavoriteAgencies
	});
	const favorites = favoritesQuery.data ?? [];
	const isLoading = favoritesQuery.isPending;
	const removeMutation = useMutation({
		mutationFn: (agencyId) => toggleFavoriteAgency(agencyId),
		onSuccess: (_result, agencyId) => {
			queryClient.setQueryData(["client", "favorite-agencies"], (current) => (current ?? []).filter((fav) => fav.agency !== agencyId));
			toast("Agence retirée de vos favoris");
		},
		onError: (error) => {
			toast(error instanceof ApiError ? error.message : "Action impossible.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardShell, {
		role: "client",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1080px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[24px] font-bold tracking-tight",
					children: "Agences favorites"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[14px] text-muted-foreground",
					children: "Agences que vous avez ajoutées à vos favoris, à recontacter pour un prochain projet."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-7",
					children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackSkeleton, { count: 3 }) : favorites.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: "Aucune agence favorite pour l'instant. Ajoutez-en une depuis son profil public." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
						children: favorites.map((favorite) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "flex items-start justify-between gap-3 rounded-lg border border-border p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-[13px] font-bold",
									children: initialsOf(favorite.agencyName || favorite.agency)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-[14px] font-bold",
											children: favorite.agencyName || favorite.agency
										}),
										favorite.dateAdded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[13px] text-muted-foreground",
											children: ["Ajoutée le ", favorite.dateAdded]
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/agences/$id",
												params: { id: favorite.agency },
												className: "rounded-md border border-border px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-accent",
												children: "Voir le profil"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => removeMutation.mutate(favorite.agency),
												disabled: removeMutation.isPending,
												className: "flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
													className: "h-3 w-3",
													strokeWidth: 1.8,
													fill: "currentColor"
												}), "Retirer"]
											})]
										})
									]
								})]
							})
						}, favorite.agency))
					})
				})
			]
		})
	});
}
//#endregion
export { ClientFavoriteAgenciesPage as component };
