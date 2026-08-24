import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { k as Search } from "../_libs/lucide-react.mjs";
import { t as Skeleton } from "./skeleton-D9W9wFsj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Blocks-CStVFDlw.js
var import_jsx_runtime = require_jsx_runtime();
function SearchInput({ value, onChange, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-md border border-border px-4 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
			className: "h-[18px] w-[18px] shrink-0 text-muted-foreground",
			strokeWidth: 1.7
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "search",
			value,
			onChange: (event) => onChange(event.target.value),
			placeholder,
			className: "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
		})]
	});
}
function StatusTabs({ tabs, value, onChange, counts }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border pb-3",
		children: tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onChange(tab.value),
			"aria-pressed": value === tab.value,
			className: value === tab.value ? "rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground" : "rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-accent",
			children: [tab.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-1.5 text-[13px] font-normal opacity-70",
				children: counts?.[tab.value] ?? 0
			})]
		}, tab.value))
	});
}
function StatCard({ icon: Icon, label, value, suffix, footer }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-4 p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "mt-1 h-[21px] w-[21px] shrink-0",
			strokeWidth: 1.6
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[13px] text-muted-foreground",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-[28px] font-bold leading-none",
					children: [value, suffix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[14px] font-normal text-muted-foreground",
						children: suffix
					}) : null]
				}),
				footer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2.5 text-[13px] text-muted-foreground",
					children: footer
				}) : null
			]
		})]
	});
}
function StatGrid({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 divide-y divide-border rounded-lg border border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x",
		children
	});
}
function SectionCard({ title, description, action, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-lg border border-border p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[15px] font-bold",
					children: title
				}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[13px] text-muted-foreground",
					children: description
				}) : null]
			}), action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0",
				children: action
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children
		})]
	});
}
function FormSkeleton({ fields = 4 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-5 sm:grid-cols-2",
		children: Array.from({ length: fields }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-3 w-24" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-9 w-full" })]
		}, index))
	});
}
function StatusBadge({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[13px] font-semibold",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-primary" }), label]
	});
}
function TextField({ label, error, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13px] text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				...props,
				className: "mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[14px] outline-none focus:border-foreground"
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-[13px] font-semibold",
				children: error
			}) : null
		]
	});
}
function TextAreaField({ label, error, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13px] text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				...props,
				className: "mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[14px] outline-none focus:border-foreground"
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-[13px] font-semibold",
				children: error
			}) : null
		]
	});
}
function PreferenceRow({ label, description, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-3 last:border-b-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[14px] font-semibold",
				children: label
			}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-[13px] text-muted-foreground",
				children: description
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0",
			children
		})]
	});
}
//#endregion
export { StatCard as a, StatusTabs as c, SectionCard as i, TextAreaField as l, PreferenceRow as n, StatGrid as o, SearchInput as r, StatusBadge as s, FormSkeleton as t, TextField as u };
