"use strict";

const { connectedSocketCount } = require("../socket/socketHandler");

const LEAD_HOT_QUEUE = "lead.hot";

function deliverNotification(io, payload) {
  const { recipient_email } = payload;
  const connectedSockets = connectedSocketCount(recipient_email);

  io.to(recipient_email).emit("notification", payload);

  return {
    delivered: connectedSockets > 0,
    connected_sockets: connectedSockets,
  };
}

async function startLeadHotConsumer(io) {
  let amqp;
  try {
    amqp = require("amqplib");
  } catch (err) {
    console.warn(
      "[notifications-service] amqplib not installed, skipping lead.hot consumer",
    );
    return null;
  }

  const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

  try {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertQueue(LEAD_HOT_QUEUE, { durable: true });

    channel.consume(LEAD_HOT_QUEUE, (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString());
        const recipientEmail = event.recipient_email || event.agency_email;

        if (recipientEmail) {
          deliverNotification(io, {
            recipient_email: recipientEmail,
            type: "lead.hot",
            title: event.title || "Nouveau lead qualifié",
            body:
              event.body ||
              `Un lead chaud a été détecté${event.company_name ? ` pour ${event.company_name}` : ""}.`,
            link: event.link || null,
            notification_id: event.notification_id || null,
          });
        }
        channel.ack(msg);
      } catch (err) {
        console.error(
          "[notifications-service] failed to process lead.hot message:",
          err.message,
        );
        channel.nack(msg, false, false);
      }
    });

    connection.on("error", (err) => {
      console.error(
        "[notifications-service] RabbitMQ connection error:",
        err.message,
      );
    });
    connection.on("close", () => {
      console.warn("[notifications-service] RabbitMQ connection closed");
    });

    console.log(
      `[notifications-service] listening on RabbitMQ queue "${LEAD_HOT_QUEUE}"`,
    );
    return { connection, channel };
  } catch (err) {
    console.warn(
      `[notifications-service] RabbitMQ unavailable, skipping lead.hot consumer (${err.message}). ` +
        "This is optional polish — the core HTTP->socket relay is unaffected.",
    );
    return null;
  }
}

module.exports = { deliverNotification, startLeadHotConsumer, LEAD_HOT_QUEUE };
