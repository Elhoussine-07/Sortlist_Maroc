"use strict";

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (err) {
  nodemailer = null;
}

function isEnabled() {
  return Boolean(nodemailer && process.env.SMTP_HOST);
}

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

async function sendEmail({ to, subject, text, html }) {
  if (!isEnabled()) {
    return { sent: false, reason: "disabled" };
  }

  const transport = buildTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM || "notifications@platform-core.local",
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
}

module.exports = { sendEmail, isEnabled };
