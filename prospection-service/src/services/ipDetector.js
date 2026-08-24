"use strict";

const logger = require("../utils/logger");

const TIMEOUT_MS = Number(process.env.IP_DETECTOR_TIMEOUT_MS || 3000);
const PROVIDER_URL = process.env.IP_DETECTOR_URL || "https://ipwho.is";

function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const v = ip.trim();
  if (v === "::1" || v === "localhost") return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80"))
    return true;

  const ipv4 = v.startsWith("::ffff:") ? v.slice(7) : v;
  const octets = ipv4.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o))) {
    return !ipv4.includes(".");
  }
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
}

function mockResolution(ip, reason) {
  return {
    provider: "mock",
    confidence: "none",
    company_name: null,
    company_domain: null,
    note:
      reason ||
      "Private/reserved or unresolvable IP — no company can be inferred.",
  };
}

async function resolveViaFreeGeoApi(ip) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${PROVIDER_URL}/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.success === false)
      throw new Error(data.message || "lookup failed");

    const org =
      (data.connection && (data.connection.org || data.connection.isp)) || null;
    return {
      provider: "ipwho.is",
      confidence: "low",
      company_name: org || null,
      company_domain: null,
      note: "Resolved via free IP geolocation (ASN/ISP organization name) — not a paid B2B firmographic match.",
      raw: { country: data.country, region: data.region, city: data.city },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveCompany(ip) {
  if (isPrivateOrReservedIp(ip)) {
    return mockResolution(ip);
  }

  try {
    return await resolveViaFreeGeoApi(ip);
  } catch (err) {
    logger.warn(
      "IP detector: free geo API lookup failed, falling back to mock",
      {
        ip,
        error: err.message,
      },
    );
    return mockResolution(
      ip,
      `Lookup failed (${err.message}) — falling back to no company inferred.`,
    );
  }
}

module.exports = { resolveCompany, isPrivateOrReservedIp };
