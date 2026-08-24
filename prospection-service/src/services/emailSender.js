"use strict";

const logger = require("../utils/logger");

async function sendEmail({ to, subject, body }) {
  logger.info("Simulating outreach email send (no SMTP provider configured)", {
    to: to || "(unknown recipient)",
    subject,
    bodyLength: body ? body.length : 0,
  });

  return {
    provider: "stub",
    sent_on: new Date().toISOString(),
    note: "SMTP transport not configured — the send was simulated, not actually delivered.",
  };
}

module.exports = { sendEmail };
