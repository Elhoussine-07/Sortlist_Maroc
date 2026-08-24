import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as Route$33 } from "./router-CW1fXXIG.mjs";
import { t as SmartBriefing } from "./SmartBriefing-DF8rrTVN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/postuler-un-projet-D1z2xfOX.js
var import_jsx_runtime = require_jsx_runtime();
function ApplyProjectPage() {
	const { resume } = Route$33.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartBriefing, { resumeProjectId: resume });
}
//#endregion
export { ApplyProjectPage as component };
