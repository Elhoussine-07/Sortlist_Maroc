"use strict";

const logger = require("../utils/logger");

const LEAD_HOT_QUEUE = "lead.hot";

let connectionPromise = null;

async function getChannel() {
  let amqp;
  try {
    amqp = require("amqplib");
  } catch (err) {
    logger.warn("amqplib not installed, lead.hot events will not be published");
    return null;
  }

  if (!connectionPromise) {
    const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    connectionPromise = amqp
      .connect(url)
      .then(async (connection) => {
        connection.on("error", (err) => logger.warn("RabbitMQ connection error", { error: err.message }));
        connection.on("close", () => {
          logger.warn("RabbitMQ connection closed, will reconnect on next publish");
          connectionPromise = null;
        });
        const channel = await connection.createChannel();
        await channel.assertQueue(LEAD_HOT_QUEUE, { durable: true });
        return channel;
      })
      .catch((err) => {
        logger.warn("Could not connect to RabbitMQ, lead.hot events will not be published", {
          error: err.message,
        });
        connectionPromise = null;
        return null;
      });
  }

  return connectionPromise;
}

/**
 * Publie un evenement lead.hot quand un lead vient de franchir le seuil
 * "chaud" (cf. §2.6 du rapport). notifications-service y est abonne et
 * relaie la notification en temps reel via Socket.IO vers le proprietaire
 * de l'agence concernee.
 */
async function publishLeadHot({ recipientEmail, agency, companyName, score }) {
  if (!recipientEmail) {
    logger.debug("Skipping lead.hot publish: no agency owner email resolved", { agency });
    return false;
  }

  const channel = await getChannel();
  if (!channel) {
    return false;
  }

  const payload = {
    recipient_email: recipientEmail,
    title: "Nouveau lead qualifié",
    body: companyName
      ? `${companyName} vient de franchir le seuil de lead chaud (score ${score}).`
      : `Un visiteur vient de franchir le seuil de lead chaud (score ${score}).`,
    link: "/agence/prospection",
    agency,
    company_name: companyName || null,
  };

  try {
    channel.sendToQueue(LEAD_HOT_QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
    return true;
  } catch (err) {
    logger.warn("Failed to publish lead.hot event", { error: err.message, agency });
    return false;
  }
}

module.exports = { publishLeadHot };
