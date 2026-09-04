"use strict";

/**
 * Thin client for the internal Frappe endpoints consumed by prospection-service,
 * cf. docs/INTEGRATION.md §4 and §6 ("prospection-service"):
 *   - GET  platform_core.platform_core.api.prospection.get_scoring_rules
 *   - GET  platform_core.platform_core.api.prospection.get_agency_directory
 *   - POST platform_core.platform_core.api.prospection.log_visitor
 *
 * All three require the `X-Internal-Token` header (INTERNAL_SERVICE_TOKEN).
 * Uses Node's built-in fetch (Node >= 18) — no extra HTTP client dependency.
 *
 * Frappe base URL resolution (container/local automatic fallback): see
 * `resolveFrappeUrl()` below and ../../../docs/FRAPPE_FALLBACK.md. Nothing in
 * this module hardcodes "Frappe runs locally" or "in a container" — the base
 * URL is resolved dynamically per call (short-lived cache to avoid probing
 * on every request).
 */

const logger = require("../utils/logger");

const DEFAULT_TIMEOUT_MS = Number(process.env.FRAPPE_TIMEOUT_MS || 5000);

// Probe tuning for the container/local fallback (docs/FRAPPE_FALLBACK.md).
const PROBE_PATH = "/api/method/platform_core.platform_core.api.utils.ping";
const PROBE_TIMEOUT_MS = Number(process.env.FRAPPE_PROBE_TIMEOUT_MS || 1500);
const URL_CACHE_TTL_MS = Number(process.env.FRAPPE_URL_CACHE_TTL_MS || 45000);

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

/** Explicit override (debug): if set, disables the automatic fallback entirely. */
function explicitUrl() {
  const value = (process.env.FRAPPE_URL || "").trim();
  return value ? stripTrailingSlash(value) : null;
}

function containerUrl() {
  return stripTrailingSlash(process.env.FRAPPE_URL_CONTAINER || "http://frappe:8000");
}

function localUrl() {
  return stripTrailingSlash(process.env.FRAPPE_URL_LOCAL || "http://host.docker.internal:8000");
}

// Short cache of the last URL that worked, so we don't probe Frappe on every
// request. It expires and is re-tested (see resolveFrappeUrl doc below).
let urlCache = { url: null, resolvedAt: 0 };
// Coalesces concurrent resolutions during an outage so a burst of requests
// doesn't fire one probe per request.
let resolvingPromise = null;

async function probe(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${PROBE_PATH}`, { signal: controller.signal });
    // Any HTTP response (even 4xx) proves something is listening there;
    // only a network-level failure counts as "unavailable".
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves the Frappe base URL to use *right now*.
 *
 * Tries the "container" URL first (FRAPPE_URL_CONTAINER), and falls back to
 * the "local" URL (FRAPPE_URL_LOCAL) if that probe fails (connection
 * refused, timeout, DNS not found). The result is cached for
 * FRAPPE_URL_CACHE_TTL_MS (default 45s) to avoid probing Frappe on every
 * request, then expires and is re-tested — so if Frappe moves from local to
 * containerized (or vice versa) mid-flight, this service picks it up within
 * one TTL window instead of staying stuck on the wrong choice.
 *
 * If FRAPPE_URL is explicitly set, it is returned as-is and no probing ever
 * happens (fallback disabled).
 */
async function resolveFrappeUrl() {
  const override = explicitUrl();
  if (override) return override;

  const now = Date.now();
  if (urlCache.url && now - urlCache.resolvedAt < URL_CACHE_TTL_MS) {
    return urlCache.url;
  }

  if (!resolvingPromise) {
    resolvingPromise = (async () => {
      const container = containerUrl();
      const local = localUrl();

      let resolved;
      if (await probe(container)) {
        resolved = container;
      } else if (await probe(local)) {
        resolved = local;
      } else {
        // Both probes failed: reuse the last known-good URL (even if stale)
        // rather than flapping; default to the container URL if we never
        // resolved one. Deliberately does NOT refresh urlCache.resolvedAt on
        // this branch when there's no prior url, so the next call retries
        // immediately instead of being stuck for a full TTL window.
        logger.warn("Frappe unreachable on both container and local URLs", { container, local });
        resolved = urlCache.url || container;
        return resolved;
      }

      urlCache = { url: resolved, resolvedAt: Date.now() };
      return resolved;
    })().finally(() => {
      resolvingPromise = null;
    });
  }
  return resolvingPromise;
}

function internalToken() {
  return process.env.INTERNAL_SERVICE_TOKEN || "";
}

async function callFrappe(method, { httpMethod = "GET", body } = {}) {
  const base = await resolveFrappeUrl();
  const url = `${base}/api/method/${method}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: httpMethod,
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": internalToken(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      throw new Error(`Frappe ${method} responded ${res.status}: ${text.slice(0, 300)}`);
    }

    // Frappe whitelisted methods wrap the return value in {"message": ...}
    return Object.prototype.hasOwnProperty.call(json, "message") ? json.message : json;
  } finally {
    clearTimeout(timer);
  }
}

async function getScoringRules() {
  return callFrappe("platform_core.platform_core.api.prospection.get_scoring_rules");
}

async function getAgencyDirectory() {
  return callFrappe("platform_core.platform_core.api.prospection.get_agency_directory");
}

/**
 * Mirrors a visit summary into Frappe's VisitorLog doctype for the Agency
 * Analytics dashboard. This is best-effort: prospection-service's own
 * Postgres database remains the source of truth for full visit history
 * (docs/INTEGRATION.md §6), so a failure here is logged and swallowed by the
 * caller rather than failing the /track request.
 */
async function logVisitor({ agency, action, visitor_ip, company_name, company_domain, session_id }) {
  return callFrappe("platform_core.platform_core.api.prospection.log_visitor", {
    httpMethod: "POST",
    body: { agency, action, visitor_ip, company_name, company_domain, session_id },
  });
}

/**
 * Notifies the IDENTIFIED client (in-app + email, via Frappe's Notification
 * system) that an agency is interested in their profile — triggered when an
 * agency sends a prospection email to a lead that has client_email set.
 *
 * AJOUTÉ (demande explicite, point 3) : `subject`/`body` — le contenu réel
 * de l'e-mail de prospection envoyé (généré par emailGenerator.js, ou édité
 * par l'agence) — sont transmis pour que la notification Frappe (qui, elle,
 * part réellement via frappe.sendmail, cf. notify.py) reprenne ce contenu
 * plutôt qu'un texte générique déconnecté. Optionnels pour rester
 * compatible avec un appel manuel sans brouillon associé ; côté Frappe,
 * `notify_client_interest` retombe sur son texte générique quand ils sont
 * absents.
 */
async function notifyClientInterest({ client_email, agency, subject, body }) {
  return callFrappe("platform_core.platform_core.api.prospection.notify_client_interest", {
    httpMethod: "POST",
    body: { client_email, agency, subject, body },
  });
}

module.exports = { getScoringRules, getAgencyDirectory, logVisitor, notifyClientInterest, resolveFrappeUrl };