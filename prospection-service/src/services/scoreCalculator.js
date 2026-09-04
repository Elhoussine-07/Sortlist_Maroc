"use strict";

/**
 * Score d'intention d'achat (cahier des charges 2.6.1).
 *
 * The point barème (base_points / bonus_points / bonus_condition per action)
 * and the chaud/tiède/froid thresholds live in Frappe (`LeadScoringRule`
 * doctype + `PlatformSettings`), fetched live via
 * platform_core.api.prospection.get_scoring_rules and cached briefly here so
 * an admin can retune the barème without redeploying this service, without
 * hammering Frappe on every single tracked action.
 *
 * What IS fixed in code below is only the *shape* of each action's bonus
 * condition (which observable metric it depends on, and at what cardinality
 * it flips on) — e.g. "profile view bonus depends on duration_seconds > 60".
 * This is unavoidable: `LeadScoringRule.bonus_condition` is a free-text Data
 * field in Frappe ("durée > 1 min", "> 5 projets consultés", ...) meant for
 * humans reading the Admin UI, not a machine-parseable expression. The
 * cahier des charges (2.6.1) fixes these thresholds explicitly as part of
 * the action semantics, so hardcoding *which field crosses which threshold*
 * here is consistent with "seed defaults" being genuinely code-level
 * behaviour — the tunable part (base_points / bonus_points / hot / warm_min /
 * warm_max / window_days) always comes from Frappe.
 */

const logger = require("../utils/logger");
const frappeClient = require("./frappeClient");

const CACHE_TTL_MS = Number(process.env.SCORING_RULES_CACHE_TTL_MS || 5 * 60 * 1000);

// Fallback used ONLY if Frappe is unreachable on first fetch (service must
// not hard-fail /track just because Frappe is briefly down). Mirrors the
// exact seed defaults in platform_core/platform_core/setup.py
// (_ensure_lead_scoring_rules) — kept in sync deliberately, but this is a
// last-resort safety net, never the primary source: every call to
// getRules() attempts a live Frappe fetch first, and falls back only on
// error, with a loud warning log (never a silent "fake success").
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

// slug/alias -> canonical French action label (matches LeadScoringRule /
// VisitorLog Select field options). The exact French label is always
// accepted as-is too.
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

// Which context field each action's bonus depends on, and the strict
// threshold it must exceed (cf. cahier des charges 2.6.1 table).
// BUG CORRIGÉ : le bonus des sous-sections (portfolio/avis/équipe/
// certifications/prestations) ne testait que `ctx.count` — qui vaut
// `portfolio.length`/`services.length`/etc. côté frontend, c'est-à-dire le
// nombre d'éléments que l'AGENCE possède, pas le nombre que le VISITEUR a
// réellement consultés. Un simple clic sur un onglet d'une agence bien
// fournie déclenchait donc le bonus complet instantanément, quel que soit le
// temps réellement passé — d'où un score qui grimpait trop facilement.
// `duration_seconds` (déjà envoyé pour chaque action depuis la correction du
// double-comptage côté frontend, cf. `agences_.$id.tsx`) est maintenant
// requis EN PLUS de `count`, sur le même principe que "Consultation du
// profil" (déjà basée sur la durée) : les deux doivent être vrais.
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

/**
 * Computes the points for one tracked action given optional context
 * (duration_seconds for profile views, count for portfolio/reviews/team/
 * certifications item counts).
 */
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

/**
 * Classifies a cumulative score per cahier des charges 2.6.1:
 *   Chaud: cumulative >= thresholds.hot
 *   Tiède: thresholds.warm_min <= cumulative < thresholds.hot
 *   Froid: cumulative < thresholds.warm_min
 *
 * BUG CORRIGÉ (demande explicite) : "Ajout aux favoris" forçait "Chaud"
 * immédiatement, indépendamment du score cumulé — un simple clic sur
 * l'étoile suffisait à classer "Chaud" même à 20/100. Retiré : les 20
 * points de "Ajout aux favoris" (cf. FALLBACK_RULES) s'ajoutent désormais
 * au score cumulé comme n'importe quelle autre action, et c'est uniquement
 * ce score qui détermine la classification — plus de court-circuit.
 */
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