"use strict";

const logger = require("../utils/logger");
const frappeClient = require("./frappeClient");

const CACHE_TTL_MS = Number(process.env.SCORING_RULES_CACHE_TTL_MS || 5 * 60 * 1000);

const FALLBACK_RULES = {
  rules: [
    { action: "Consultation du profil", base_points: 10, bonus_condition: "durée > 1 min", bonus_points: 15 },
    { action: "Consultation portfolio", base_points: 5, bonus_condition: "> 5 projets consultés", bonus_points: 10 },
    { action: "Consultation avis", base_points: 5, bonus_condition: "> 3 avis lus", bonus_points: 5 },
    { action: "Consultation équipe", base_points: 3, bonus_condition: "> 2 membres consultés", bonus_points: 5 },
    {
      action: "Consultation certifications",
      base_points: 3,
      bonus_condition: "> 2 certificats consultés",
      bonus_points: 5,
    },
    {
      action: "Consultation prestations",
      base_points: 3,
      bonus_condition: "> 2 prestations consultées",
      bonus_points: 5,
    },
    {
      action: "Ajout aux favoris",
      base_points: 20,
      bonus_condition: "signal fort — aucun palier supplémentaire",
      bonus_points: 0,
    },
  ],
  thresholds: { hot: 40, warm_min: 15, warm_max: 39, window_days: 7 },
};

const ACTIONS = FALLBACK_RULES.rules.map((r) => r.action);

const ACTION_ALIASES = {
  profile: "Consultation du profil",
  profile_view: "Consultation du profil",
  portfolio: "Consultation portfolio",
  portfolio_view: "Consultation portfolio",
  reviews: "Consultation avis",
  reviews_view: "Consultation avis",
  avis: "Consultation avis",
  team: "Consultation équipe",
  team_view: "Consultation équipe",
  equipe: "Consultation équipe",
  certifications: "Consultation certifications",
  certifications_view: "Consultation certifications",
  services: "Consultation prestations",
  services_view: "Consultation prestations",
  prestations: "Consultation prestations",
  favorite: "Ajout aux favoris",
  favorite_add: "Ajout aux favoris",
  favoris: "Ajout aux favoris",
  add_favorite: "Ajout aux favoris",
};

const BONUS_RULES = {
  "Consultation du profil": (ctx) => Number(ctx.duration_seconds || 0) > 60,
  "Consultation portfolio": (ctx) =>
      Number(ctx.count || 0) > 5 && Number(ctx.duration_seconds || 0) > 20,
  "Consultation avis": (ctx) =>
      Number(ctx.count || 0) > 3 && Number(ctx.duration_seconds || 0) > 15,
  "Consultation équipe": (ctx) =>
      Number(ctx.count || 0) > 2 && Number(ctx.duration_seconds || 0) > 10,
  "Consultation certifications": (ctx) =>
      Number(ctx.count || 0) > 2 && Number(ctx.duration_seconds || 0) > 10,
  "Consultation prestations": (ctx) =>
      Number(ctx.count || 0) > 2 && Number(ctx.duration_seconds || 0) > 10,
  "Ajout aux favoris": () => false, // "aucun palier supplémentaire"
};

function normalizeAction(rawAction) {
  if (!rawAction || typeof rawAction !== "string") return null;
  const trimmed = rawAction.trim();
  if (ACTIONS.includes(trimmed)) return trimmed;
  const alias = ACTION_ALIASES[trimmed.toLowerCase()];
  return alias || null;
}

let cache = { data: null, fetchedAt: 0, source: null };

async function getRules({ forceRefresh = false } = {}) {
  const isFresh = cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh && !forceRefresh) return cache;

  try {
    const live = await frappeClient.getScoringRules();
    if (!live || !Array.isArray(live.rules) || live.rules.length === 0) {
      throw new Error("Frappe returned no scoring rules");
    }
    cache = { data: live, fetchedAt: Date.now(), source: "frappe" };
    logger.debug("Refreshed scoring rules from Frappe", { ruleCount: live.rules.length });
  } catch (err) {
    logger.warn("Could not fetch live scoring rules from Frappe — using fallback defaults", {
      error: err.message,
    });
    cache = { data: FALLBACK_RULES, fetchedAt: Date.now(), source: "fallback-defaults" };
  }

  return cache;
}

function findRule(rules, action) {
  return rules.find((r) => r.action === action);
}

async function computePoints(action, ctx = {}) {
  const canonicalAction = normalizeAction(action);
  if (!canonicalAction) {
    throw Object.assign(new Error(`Unknown action: ${action}`), { statusCode: 400 });
  }

  const { data, source } = await getRules();
  const rule = findRule(data.rules, canonicalAction);
  const basePoints = rule ? Number(rule.base_points || 0) : 0;
  const bonusCheck = BONUS_RULES[canonicalAction] || (() => false);
  const bonusApplies = bonusCheck(ctx);
  const bonusPoints = bonusApplies && rule ? Number(rule.bonus_points || 0) : 0;

  return {
    action: canonicalAction,
    basePoints,
    bonusApplies,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    rulesSource: source,
  };
}

async function classify(cumulativeScore) {
  const { data } = await getRules();
  const thresholds = data.thresholds || FALLBACK_RULES.thresholds;

  if (cumulativeScore >= thresholds.hot) {
    return "Chaud";
  }
  if (cumulativeScore >= thresholds.warm_min) {
    return "Tiède";
  }
  return "Froid";
}

async function getWindowDays() {
  const { data } = await getRules();
  return (data.thresholds && data.thresholds.window_days) || FALLBACK_RULES.thresholds.window_days;
}

module.exports = {
  ACTIONS,
  normalizeAction,
  getRules,
  computePoints,
  classify,
  getWindowDays,
};