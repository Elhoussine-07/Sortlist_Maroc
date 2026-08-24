import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as EmptyState } from "./EmptyState-CjCsYQbe.mjs";
import { i as TableSkeleton } from "./Skeletons-COgUvsAH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/DataTable-EspjDfBC.js
var import_jsx_runtime = require_jsx_runtime();
function DataTable({ columns, rows, isLoading = false, emptyMessage = "Aucune donnée disponible" }) {
	const template = columns.map((column) => column.width ?? "minmax(0,1fr)").join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hidden gap-4 border-b border-border px-5 py-3 lg:grid",
			style: { gridTemplateColumns: template },
			children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[13px] font-semibold",
				children: column.header
			}, column.key))
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableSkeleton, {
				rows: 6,
				columns: columns.length
			})
		}) : rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { message: emptyMessage })
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "divide-y divide-border",
			children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-3 px-5 py-4 lg:items-center lg:gap-4",
				style: { gridTemplateColumns: void 0 },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 gap-3 lg:gap-4",
					style: { gridTemplateColumns: template },
					children: columns.map((column) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-1 text-[13px] font-semibold text-muted-foreground lg:hidden",
							children: column.header
						}), column.render(row)]
					}, column.key))
				})
			}) }, row.id))
		})]
	});
}
//#endregion
export { DataTable as t };
