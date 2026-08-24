import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $t as ArrowLeft, Pt as ChevronDown, Qt as ArrowRight } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ListControls-FMqnx6XI.js
var import_jsx_runtime = require_jsx_runtime();
function FilterSelect({ label, placeholder, options, value, onChange }) {
	if (Boolean(options && options.length > 0 && onChange)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-border pb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[13px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
			value: value ?? "",
			onChange: (event) => onChange?.(event.target.value),
			className: "mt-1 w-full bg-transparent text-left text-[14px] outline-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: "",
				children: placeholder
			}), options?.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: option.value,
				children: option.label
			}, option.value))]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-border pb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[13px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			disabled: true,
			title: "Filtre indisponible pour le moment",
			className: "mt-1 flex w-full items-center justify-between gap-2 text-left text-[14px] text-muted-foreground opacity-60",
			children: [placeholder, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
				className: "h-4 w-4 shrink-0",
				strokeWidth: 1.7
			})]
		})]
	});
}
function ListPagination({ page, totalPages, onPageChange }) {
	const pages = totalPages ?? 1;
	const visible = Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1);
	const canNavigate = Boolean(onPageChange) && pages > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		"aria-label": "Pagination",
		className: "mt-10 flex flex-wrap items-center justify-center gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => onPageChange?.(Math.max(1, page - 1)),
				type: "button",
				disabled: !canNavigate || page === 1,
				className: "flex items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
					className: "h-3.5 w-3.5",
					strokeWidth: 1.8
				}), "Précédent"]
			}),
			visible.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => onPageChange?.(p),
				type: "button",
				disabled: !canNavigate,
				"aria-current": p === page ? "page" : void 0,
				className: p === page ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13.5px] font-semibold text-primary-foreground" : "flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
				children: p
			}, p)),
			pages > 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13.5px] text-muted-foreground",
				children: "..."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => onPageChange?.(pages),
				type: "button",
				disabled: !canNavigate,
				className: "flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
				children: pages
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => onPageChange?.(Math.min(pages, page + 1)),
				type: "button",
				disabled: !canNavigate || page >= pages,
				className: "flex items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
				children: ["Suivant", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
					className: "h-3.5 w-3.5",
					strokeWidth: 1.8
				})]
			})
		]
	});
}
//#endregion
export { ListPagination as n, FilterSelect as t };
