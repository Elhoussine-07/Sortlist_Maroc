"use strict";

const logger = require("../utils/logger");

const DEFAULT_TIMEOUT_MS = Number(process.env.FRAPPE_TIMEOUT_MS || 5000);

const PROBE_PATH = "/api/method/platform_core.platform_core.api.utils.ping";
const PROBE_TIMEOUT_MS = Number(process.env.FRAPPE_PROBE_TIMEOUT_MS || 1500);
const URL_CACHE_TTL_MS = Number(process.env.FRAPPE_URL_CACHE_TTL_MS || 45000);

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function explicitUrl() {
  const value = (process.env.FRAPPE_URL || "").trim();
  return value ? stripTrailingSlash(value) : null;
}

function containerUrl() {
  return stripTrailingSlash(
    process.env.FRAPPE_URL_CONTAINER || "http://frappe:8000",
  );
}

function localUrl() {
  return stripTrailingSlash(
    process.env.FRAPPE_URL_LOCAL || "http://host.docker.internal:8000",
  );
}

let urlCache = { url: null, resolvedAt: 0 };

let resolvingPromise = null;

async function probe(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${PROBE_PATH}`, {
      signal: controller.signal,
    });

    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

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
        logger.warn("Frappe unreachable on both container and local URLs", {
          container,
          local,
        });
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
      throw new Error(
        `Frappe ${method} responded ${res.status}: ${text.slice(0, 300)}`,
      );
    }

    return Object.prototype.hasOwnProperty.call(json, "message")
      ? json.message
      : json;
  } finally {
    clearTimeout(timer);
  }
}

async function getScoringRules() {
  return callFrappe(
    "platform_core.platform_core.api.prospection.get_scoring_rules",
  );
}

async function getAgencyDirectory() {
  return callFrappe(
    "platform_core.platform_core.api.prospection.get_agency_directory",
  );
}

async function logVisitor({
  agency,
  action,
  visitor_ip,
  company_name,
  company_domain,
  session_id,
}) {
  return callFrappe("platform_core.platform_core.api.prospection.log_visitor", {
    httpMethod: "POST",
    body: {
      agency,
      action,
      visitor_ip,
      company_name,
      company_domain,
      session_id,
    },
  });
}

async function notifyClientInterest({ client_email, agency }) {
  return callFrappe(
    "platform_core.platform_core.api.prospection.notify_client_interest",
    {
      httpMethod: "POST",
      body: { client_email, agency },
    },
  );
}

module.exports = {
  getScoringRules,
  getAgencyDirectory,
  logVisitor,
  notifyClientInterest,
  resolveFrappeUrl,
};
