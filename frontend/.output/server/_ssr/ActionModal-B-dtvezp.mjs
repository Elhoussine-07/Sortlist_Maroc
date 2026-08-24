import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-CwLzEEob.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ActionModal-B-dtvezp.js
var import_jsx_runtime = require_jsx_runtime();
function ActionModal({ open, onOpenChange, title, description, confirmLabel = "Confirmer", cancelLabel = "Annuler", onConfirm, singleAction = false, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-[520px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-[16px] font-bold",
					children: title
				}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "text-[13.5px]",
					children: description
				}) : null] }),
				children ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-2",
					children
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2 sm:gap-2",
					children: [singleAction ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onOpenChange(false),
						className: "rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold transition-colors hover:bg-accent",
						children: cancelLabel
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onConfirm,
						className: "rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90",
						children: confirmLabel
					})]
				})
			]
		})
	});
}
//#endregion
export { ActionModal as t };
