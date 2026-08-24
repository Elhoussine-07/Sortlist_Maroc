import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as Route$2 } from "./router-CW1fXXIG.mjs";
import { t as SmartBriefing } from "./SmartBriefing-DF8rrTVN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.postuler-un-projet-aUw57i35.js
var import_jsx_runtime = require_jsx_runtime();
function ClientApplyPage() {
	const { resume } = Route$2.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmartBriefing, { resumeProjectId: resume });
}
//#endregion
export { ClientApplyPage as component };
