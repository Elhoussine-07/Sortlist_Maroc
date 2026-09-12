"use strict";

const logger = require("../utils/logger");

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isEnabled() {
  return Boolean(nodemailer && process.env.SMTP_HOST);
}

function buildTransport() {
  const config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false"
    }
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    config.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    };
  }

  return nodemailer.createTransport(config);
}

async function sendEmail({ to, subject, body, htmlBody }) {
  if (!isValidEmail(to)) {
    logger.warn("Invalid recipient email blocked", { to });
    return {
      provider: "stub",
      sent: false,
      sent_on: new Date().toISOString(),
      note: `Adresse email invalide: "${to}" - l'envoi a été bloqué.`,
    };
  }

  if (!isEnabled()) {
    logger.info("Simulating outreach email send (SMTP_HOST not configured)", {
      to,
      subject,
      bodyLength: body ? body.length : 0,
    });

    return {
      provider: "stub",
      sent: false,
      sent_on: new Date().toISOString(),
      note: "SMTP transport not configured (SMTP_HOST manquant) - l'envoi a été simulé, pas réellement délivré.",
    };
  }

  try {
    const transport = buildTransport();

    await transport.verify();

    const from = process.env.SMTP_FROM || "prospection@platform-core.local";

    const mailOptions = {
      from,
      to,
      subject,
      text: body, // Version texte
    };

    if (htmlBody) {
      mailOptions.html = htmlBody;
    } else if (body) {
      mailOptions.html = body;
    }

    const info = await transport.sendMail(mailOptions);

    logger.info("Outreach email sent via SMTP", {
      to,
      subject,
      messageId: info.messageId,
      from
    });

    return {
      provider: "smtp",
      sent: true,
      sent_on: new Date().toISOString(),
      messageId: info.messageId,
      note: "E-mail délivré via le transport SMTP configuré.",
    };

  } catch (error) {
    const errorMessage = error.message || 'Unknown SMTP error';

    logger.error("SMTP send failed", {
      to,
      subject,
      error: errorMessage,
      code: error.code
    });

    let userNote = `Échec d'envoi SMTP: ${errorMessage}`;
    if (error.code === 'EAUTH') {
      userNote = 'Échec d\'authentification SMTP - Vérifiez SMTP_USER et SMTP_PASSWORD';
    } else if (error.code === 'ECONNECTION') {
      userNote = 'Impossible de se connecter au serveur SMTP - Vérifiez SMTP_HOST et SMTP_PORT';
    } else if (error.code === 'ETIMEDOUT') {
      userNote = 'Connexion SMTP expirée - Vérifiez votre réseau et firewall';
    }

    return {
      provider: "smtp",
      sent: false,
      sent_on: new Date().toISOString(),
      note: userNote,
      error: errorMessage
    };
  }
}

module.exports = { sendEmail, isEnabled, isValidEmail };