
import { useAuthStore } from "@/store/auth.store";

export const GATEWAY_URL: string =
  (import.meta.env.VITE_GATEWAY_URL as string | undefined) ?? "http://localhost:8080";

function encodeURIOnce(url: string): string {
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return encodeURI(url);
  }
}

export function resolveFileUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("data:")) return url;
  if (/^(https?:)?\/\//.test(url)) return encodeURIOnce(url);
  return encodeURIOnce(`${GATEWAY_URL}${url.startsWith("/") ? "" : "/"}${url}`);
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RestCallOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  statusCode: number;
  frappeExcType?: string;

  constructor(message: string, statusCode: number, frappeExcType?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    if (frappeExcType !== undefined) {
      this.frappeExcType = frappeExcType;
    }
  }
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorMessage(
  response: Response,
): Promise<{ message: string; excType?: string }> {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    // corps non-JSON ou vide — on retombe sur le message générique plus bas.
  }

  if (body) {
    const excType = typeof body["exc_type"] === "string" ? (body["exc_type"] as string) : undefined;

    const serverMessages = body["_server_messages"];
    if (typeof serverMessages === "string") {
      try {
        const outer = JSON.parse(serverMessages) as unknown[];
        const firstRaw = outer[0];
        if (typeof firstRaw === "string") {
          const first = JSON.parse(firstRaw) as { message?: string };
          if (first.message) {
            return excType !== undefined
              ? { message: first.message, excType }
              : { message: first.message };
          }
        }
      } catch {
        // _server_messages malformé — on continue avec les autres champs.
      }
    }

    const exception = body["exception"];
    if (typeof exception === "string") {
      return excType !== undefined ? { message: exception, excType } : { message: exception };
    }

    const error = body["error"];
    if (typeof error === "string") {
      return { message: error };
    }

    const message = body["message"];
    if (typeof message === "string") {
      return { message };
    }
  }

  return { message: "Une erreur est survenue" };
}

function handleUnauthorized(): void {
  useAuthStore.getState().reset();
  if (typeof window !== "undefined") {
    window.location.href = "/connexion";
  }
}

const ANONYMOUS_AUTH_METHODS = new Set([
  "auth.login",
  "auth.register_client",
  "auth.register_agency",
  "auth.request_otp",
  "auth.verify_otp",
  "auth.request_password_reset",
  "auth.reset_password",
]);

async function throwForErrorResponse(response: Response, method?: string): Promise<never> {
  const isAnonymousAuthCall = method !== undefined && ANONYMOUS_AUTH_METHODS.has(method);
  if (response.status === 401 && useAuthStore.getState().token && !isAnonymousAuthCall) {
    handleUnauthorized();
  }
  const { message, excType } = await parseErrorMessage(response);
  throw new ApiError(message, response.status, excType);
}

function buildQueryString(query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const key of Object.keys(query)) {
    const value = query[key];
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function frappeCall<T>(
  method: string,
  args: Record<string, unknown> = {},
  options?: { signal?: AbortSignal },
): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(args),
  };
  if (options?.signal) {
    init.signal = options.signal;
  }

  const response = await fetch(
    `${GATEWAY_URL}/api/method/platform_core.platform_core.api.${method}`,
    init,
  );

  if (!response.ok) {
    await throwForErrorResponse(response, method);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as { message?: T };
  return json.message as T;
}

export async function restCall<T>(
  service: "matching" | "ia" | "prospection",
  path: string,
  options: RestCallOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal } = options;
  const queryString = method === "GET" ? buildQueryString(query) : "";

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  };
  if (method !== "GET" && body !== undefined) {
    init.body = JSON.stringify(body);
  }
  if (signal) {
    init.signal = signal;
  }

  const response = await fetch(`${GATEWAY_URL}/api/${service}${path}${queryString}`, init);

  if (!response.ok) {
    await throwForErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export async function fetchBlob(
  url: string,
  signal?: AbortSignal,
  body?: Record<string, unknown>,
): Promise<Blob> {
  const init: RequestInit = {
    headers: {
      ...authHeaders(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
  };
  if (body) {
    init.method = "POST";
    init.body = JSON.stringify(body);
  }
  if (signal) {
    init.signal = signal;
  }
  const response = await fetch(url, init);
  if (!response.ok) {
    await throwForErrorResponse(response);
  }
  return response.blob();
}

export function parseCommaList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function camelizeKeys(input: unknown): any {
  if (Array.isArray(input)) {
    return input.map((item) => camelizeKeys(item));
  }
  if (input !== null && typeof input === "object" && !(input instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const camelKey = key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
      result[camelKey] = camelizeKeys(value);
    }
    return result;
  }
  return input;
}
