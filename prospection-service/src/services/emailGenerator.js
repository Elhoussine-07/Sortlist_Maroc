"use strict";

const logger = require("../utils/logger");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 15000);

/**
 * Détecte le type de lead en fonction de l'email
 */
function detectLeadType(email, companyName) {
  if (!email) return 'unknown';

  const domain = email.split('@')[1]?.toLowerCase() || '';

  // 1. Email étudiant (.edu, .ac.ma, etc.)
  if (email.includes('.edu') ||
      email.includes('@edu.') ||
      email.includes('@uiz.ac.ma') ||
      email.includes('.ac.ma') ||
      email.includes('@univ-') ||
      email.includes('@ens.') ||
      email.includes('@ecole.')) {
    return 'student';
  }

  // 2. Email personnel (Gmail, Yahoo, Outlook, etc.)
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'live.fr', 'live.com', 'msn.com', 'orange.fr', 'sfr.fr',
    'free.fr', 'laposte.net', 'wanadoo.fr'
  ];

  if (personalDomains.some(d => domain === d)) {
    return 'personal';
  }

  // 3. Email professionnel (nom de domaine personnalisé)
  if (companyName) {
    return 'company';
  }

  // 4. Si le domaine n'est pas dans la liste des personnels, c'est probablement une entreprise
  if (domain && !personalDomains.some(d => domain.includes(d))) {
    return 'company';
  }

  return 'unknown';
}

/**
 * Extrait le prénom de l'email
 */
function extractFirstName(email) {
  if (!email) return '';
  const namePart = email.split('@')[0];
  // Remplacer . et _ par des espaces
  const clean = namePart.replace(/[._-]/g, ' ');
  // Mettre en majuscule la première lettre de chaque mot
  return clean.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Construit le prompt pour l'IA en fonction des données du lead
 */
function buildPrompt(lead) {
  const email = lead.email || '';
  const company = lead.company_name || '';
  const type = detectLeadType(email, company);
  const firstName = lead.first_name || extractFirstName(email);

  let context = "";
  let instruction = "";

  switch(type) {
    case 'student':
      context = `Contexte: un étudiant (${email}) a consulté le profil public d'une agence prestataire. Il n'a pas d'entreprise.`;
      instruction = "L'email doit être adapté à un étudiant : parler de projet personnel, stage ou mémoire, pas d'entreprise.";
      break;

    case 'personal':
      context = `Contexte: un particulier (${email}) a consulté le profil public d'une agence prestataire. Ce n'est pas une entreprise.`;
      instruction = "L'email doit être adapté à un particulier : parler de projet personnel, pas d'entreprise.";
      break;

    case 'company':
      context = `Contexte: un visiteur associé à "${company}" a consulté le profil public d'une agence prestataire. C'est une entreprise.`;
      instruction = "L'email doit être B2B professionnel, parler de son entreprise.";
      break;

    default:
      context = `Contexte: un visiteur a consulté le profil public d'une agence prestataire.`;
      instruction = "L'email doit être générique et professionnel.";
  }

  const industry = lead.industry || "votre secteur d'activité";
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  return [
    "Tu rédiges un court email de prospection en français, professionnel et chaleureux, sans être intrusif.",
    "",
    context,
    `Secteur d'activité: ${industry}`,
    `Score d'intention d'achat: ${lead.cumulative_score || 0} points, classification "${lead.classification || 'intéressé'}"`,
    `Dernière action observée: "${lead.last_action || 'consultation du profil'}"`,
    "",
    "Rédige un objet (une ligne) et un corps d'email (120-180 mots) qui:",
    "- Mentionne l'intérêt observé sans être intrusif sur la manière dont il a été détecté",
    "- Propose un échange (appel ou démo)",
    "- Inclut un appel à l'action clair",
    `- Utilise "${greeting}" comme salutation`,
    "- Signe \"L'équipe [Agence]\"",
    "",
    instruction,
    "",
    'Réponds strictement en JSON: {"subject": "...", "body": "..."}',
  ].join("\n");
}

/**
 * Template de secours quand OpenAI n'est pas disponible
 */
function stubDraft(lead) {
  const email = lead.email || '';
  const company = lead.company_name || '';
  const type = detectLeadType(email, company);
  const firstName = lead.first_name || extractFirstName(email);

  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  let subject = "";
  let body = "";

  switch(type) {
    case 'student':
      subject = "Projet étudiant — une question sur vos besoins";
      body = `${greeting}

Nous avons remarqué votre intérêt pour notre agence suite à votre consultation de notre profil.

En tant qu'étudiant, vous êtes peut-être à la recherche d'un prestataire pour un projet personnel, un stage ou un mémoire. Nous serions ravis d'échanger avec vous pour comprendre vos besoins.

Si vous souhaitez en savoir plus sur nos services, n'hésitez pas à nous répondre.

Au plaisir d'échanger,
L'équipe agence`;
      break;

    case 'personal':
      subject = "Projet personnel — une question sur vos besoins";
      body = `${greeting}

Nous avons remarqué votre intérêt pour notre agence suite à votre consultation de notre profil.

En tant que particulier, vous avez peut-être un projet personnel ou professionnel pour lequel vous cherchez des prestataires. Nous serions ravis d'échanger avec vous pour comprendre vos besoins.

Si vous souhaitez en savoir plus sur nos services, n'hésitez pas à nous répondre.

Au plaisir d'échanger,
L'équipe agence`;
      break;

    default: // company ou unknown
      subject = `${company || 'votre entreprise'} — une question sur votre besoin en prestataires`;
      body = `${greeting}

Nous avons noté l'intérêt que ${company || 'votre entreprise'} porte à notre agence, suite à votre récente consultation de notre profil (${lead.last_action || "dernière activité"}, avec un score d'intention de ${lead.cumulative_score || 0}/100).

Si vous êtes actuellement en phase de réflexion pour un projet, nous serions ravis d'échanger 15 minutes avec vous. Cela nous permettrait de mieux comprendre vos besoins et d'explorer comment nous pourrions vous accompagner.

Seriez-vous disponible pour un court appel cette semaine ?

Dans l'attente de votre retour,
L'équipe agence`;
  }

  return {
    subject,
    body,
    provider: "stub",
    note: "OPENAI_API_KEY non configurée — template déterministe utilisé à la place de la génération IA.",
  };
}

/**
 * Génère un email via l'API OpenAI
 */
async function generateViaOpenAI(lead) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI a répondu ${response.status}: ${text.slice(0, 300)}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("La réponse OpenAI ne contient pas de message");
    }

    const parsed = JSON.parse(content);

    if (!parsed.subject || !parsed.body) {
      throw new Error("La réponse OpenAI ne contient pas subject/body");
    }

    logger.info("Email généré via OpenAI", {
      model: OPENAI_MODEL,
      subject: parsed.subject,
      bodyLength: parsed.body.length
    });

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

/**
 * Génère un email de prospection pour un lead
 *
 * @param {object} lead - Les données du lead
 * @param {string} lead.email - Email du contact
 * @param {string} lead.company_name - Nom de l'entreprise
 * @param {number} lead.cumulative_score - Score d'intention (0-100)
 * @param {string} lead.classification - Classification du lead
 * @param {string} lead.last_action - Dernière action observée
 * @param {string} [lead.first_name] - Prénom du contact (optionnel)
 * @param {string} [lead.industry] - Secteur d'activité (optionnel)
 * @returns {Promise<{subject: string, body: string, provider: string, model?: string, note?: string, degraded?: boolean, reason?: string}>}
 */
async function generateEmail(lead) {
  // Vérifier que le lead a des données minimales
  if (!lead || typeof lead !== 'object') {
    logger.error("Lead invalide pour la génération d'email");
    return stubDraft({ company_name: "Prospect" });
  }

  // Si pas de clé API OpenAI, utiliser le template
  if (!process.env.OPENAI_API_KEY) {
    logger.info("Utilisation du template stub (OPENAI_API_KEY non configurée)");
    return stubDraft(lead);
  }

  // Essayer la génération via OpenAI
  try {
    const result = await generateViaOpenAI(lead);
    return result;
  } catch (error) {
    // En cas d'erreur, fallback sur le template
    logger.warn(
        "La génération OpenAI a échoué — fallback sur le template stub",
        {
          error: error.message,
          lead: lead.company_name || 'unknown'
        }
    );

    const stub = stubDraft(lead);
    return {
      ...stub,
      degraded: true,
      reason: error.message
    };
  }
}

module.exports = { generateEmail, detectLeadType, extractFirstName };