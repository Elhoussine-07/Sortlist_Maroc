import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as useNavigate, f as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
import { i as getCurrentUser } from "./auth.service-F3thChuN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-GySCL6PQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ENFORCE_AUTH = true;
function AuthenticatedLayout() {
	const token = useAuthStore((state) => state.token);
	const setUser = useAuthStore((state) => state.setUser);
	const reset = useAuthStore((state) => state.reset);
	const navigate = useNavigate();
	const [isChecking, setIsChecking] = (0, import_react.useState)(ENFORCE_AUTH);
	(0, import_react.useEffect)(() => {
		if (!token) {
			navigate({
				to: "/connexion",
				replace: true
			});
			return;
		}
		let cancelled = false;
		setIsChecking(true);
		getCurrentUser().then((user) => {
			if (cancelled) return;
			setUser(user);
			setIsChecking(false);
		}).catch(() => {
			if (cancelled) return;
			reset();
			navigate({
				to: "/connexion",
				replace: true
			});
		});
		return () => {
			cancelled = true;
		};
	}, [
		token,
		navigate,
		setUser,
		reset
	]);
	if (!token || isChecking) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
}
//#endregion
export { AuthenticatedLayout as component };
