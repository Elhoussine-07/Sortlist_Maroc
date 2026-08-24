"use strict";

const logger = require("../utils/logger");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 15000);

function buildPrompt(lead) {
  const company =
    lead.company_name || "cette entreprise (identité non confirmée)";
  return [
    "Tu rédiges un court email de prospection B2B en français, professionnel et chaleureux, sans être intrusif.",
    `Contexte: un visiteur associé à "${company}" a consulté le profil public d'une agence prestataire sur une marketplace B2B.`,
    `Score d'intention d'achat: ${lead.cumulative_score} points, classification "${lead.classification}".`,
    `Dernière action observée: "${lead.last_action || "consultation du profil"}".`,
    "Rédige un objet (une ligne) et un corps d'email (120-180 mots), qui: mentionne l'intérêt observé sans être intrusif sur la manière dont il a été détecté, propose un échange (appel ou démo), inclut un appel à l'action clair, signe \"L'équipe [Agence]\".",
    'Réponds strictement en JSON: {"subject": "...", "body": "..."}',
  ].join("\n");
}

function stubDraft(lead) {
  const company = lead.company_name || "votre entreprise";
  const subject = `${company} — une question sur votre besoin en prestataires`;
  const body = [
    `Bonjour,`,
    ``,
    `Nous avons remarqué l'intérêt de ${company} pour notre profil sur la plateforme` +
      ` (consultation récente : ${lead.last_action || "profil"}, score d'intention ${lead.cumulative_score}/100).`,
    ``,
    `Si vous êtes actuellement en réflexion sur un projet, nous serions ravis d'échanger 15 minutes` +
      ` pour comprendre votre besoin et voir comment nous pourrions vous accompagner.`,
    ``,
    `Seriez-vous disponible cette semaine pour un rapide appel ?`,
    ``,
    `Bien cordialement,`,
    `L'équipe agence`,
  ].join("\n");

  return {
    subject,
    body,
    provider: "stub",
    note: "OPENAI_API_KEY not configured — deterministic template used instead of AI generation.",
  };
}

async function generateViaOpenAI(lead) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: buildPrompt(lead) }],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI responded ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI response missing message content");

    const parsed = JSON.parse(content);
    if (!parsed.subject || !parsed.body)
      throw new Error("OpenAI response missing subject/body");

    return {
      subject: parsed.subject,
      body: parsed.body,
      provider: "openai",
      model: OPENAI_MODEL,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function generateEmail(lead) {
  if (!process.env.OPENAI_API_KEY) {
    return stubDraft(lead);
  }

  try {
    return await generateViaOpenAI(lead);
  } catch (err) {
    logger.warn(
      "OpenAI email generation failed — falling back to stub template",
      { error: err.message },
    );
    return { ...stubDraft(lead), degraded: true, reason: err.message };
  }
}

module.exports = { generateEmail };
