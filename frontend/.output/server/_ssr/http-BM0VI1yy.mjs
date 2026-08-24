import { t as useAuthStore } from "./auth.store-DaIrLnl9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/http-BM0VI1yy.js
var GATEWAY_URL = "http://localhost:8080";
var ApiError = class extends Error {
	statusCode;
	frappeExcType;
	constructor(message, statusCode, frappeExcType) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
		if (frappeExcType !== void 0) this.frappeExcType = frappeExcType;
	}
};
function authHeaders() {
	const token = useAuthStore.getState().token;
	return token ? { Authorization: `Bearer ${token}` } : {};
}
async function parseErrorMessage(response) {
	let body = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}
	if (body) {
		const excType = typeof body["exc_type"] === "string" ? body["exc_type"] : void 0;
		const serverMessages = body["_server_messages"];
		if (typeof serverMessages === "string") try {
			const firstRaw = JSON.parse(serverMessages)[0];
			if (typeof firstRaw === "string") {
				const first = JSON.parse(firstRaw);
				if (first.message) return excType !== void 0 ? {
					message: first.message,
					excType
				} : { message: first.message };
			}
		} catch {}
		const exception = body["exception"];
		if (typeof exception === "string") return excType !== void 0 ? {
			message: exception,
			excType
		} : { message: exception };
		const error = body["error"];
		if (typeof error === "string") return { message: error };
		const message = body["message"];
		if (typeof message === "string") return { message };
	}
	return { message: "Une erreur est survenue" };
}
function handleUnauthorized() {
	useAuthStore.getState().reset();
	if (typeof window !== "undefined") window.location.href = "/connexion";
}
async function throwForErrorResponse(response) {
	if (response.status === 401) handleUnauthorized();
	const { message, excType } = await parseErrorMessage(response);
	throw new ApiError(message, response.status, excType);
}
function buildQueryString(query) {
	if (!query) return "";
	const params = new URLSearchParams();
	for (const key of Object.keys(query)) {
		const value = query[key];
		if (value !== void 0) params.set(key, String(value));
	}
	const qs = params.toString();
	return qs ? `?${qs}` : "";
}
async function frappeCall(method, args = {}, options) {
	const init = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...authHeaders()
		},
		body: JSON.stringify(args)
	};
	if (options?.signal) init.signal = options.signal;
	const response = await fetch(`${GATEWAY_URL}/api/method/platform_core.platform_core.api.${method}`, init);
	if (!response.ok) await throwForErrorResponse(response);
	if (response.status === 204) return;
	return (await response.json()).message;
}
async function restCall(service, path, options = {}) {
	const { method = "GET", body, query, signal } = options;
	const queryString = method === "GET" ? buildQueryString(query) : "";
	const init = {
		method,
		headers: {
			"Content-Type": "application/json",
			...authHeaders()
		}
	};
	if (method !== "GET" && body !== void 0) init.body = JSON.stringify(body);
	if (signal) init.signal = signal;
	const response = await fetch(`${GATEWAY_URL}/api/${service}${path}${queryString}`, init);
	if (!response.ok) await throwForErrorResponse(response);
	if (response.status === 204) return;
	if ((response.headers.get("content-type") ?? "").includes("application/json")) return await response.json();
	return await response.text();
}
async function fetchBlob(url, signal, body) {
	const init = { headers: {
		...authHeaders(),
		...body ? { "Content-Type": "application/json" } : {}
	} };
	if (body) {
		init.method = "POST";
		init.body = JSON.stringify(body);
	}
	if (signal) init.signal = signal;
	const response = await fetch(url, init);
	if (!response.ok) await throwForErrorResponse(response);
	return response.blob();
}
function resolveFileUrl(url) {
	if (!url) return null;
	if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
	return url.startsWith("/") ? `${GATEWAY_URL}${url}` : url;
}
function camelizeKeys(input) {
	if (Array.isArray(input)) return input.map((item) => camelizeKeys(item));
	if (input !== null && typeof input === "object" && !(input instanceof Date)) {
		const result = {};
		for (const [key, value] of Object.entries(input)) {
			const camelKey = key.replace(/_([a-z0-9])/g, (_match, char) => char.toUpperCase());
			result[camelKey] = camelizeKeys(value);
		}
		return result;
	}
	return input;
}
//#endregion
export { frappeCall as a, fetchBlob as i, GATEWAY_URL as n, resolveFileUrl as o, camelizeKeys as r, restCall as s, ApiError as t };
