"use strict";

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const socketHandler = require("./socket/socketHandler");
const { deliverNotification } = require("./services/notificationService");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const INTERNAL_SERVICE_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN || "dev-insecure-internal-token";

function buildServer() {
  const app = express();

  app.use(cors({ origin: FRONTEND_URL, credentials: true }));
  app.use(express.json());

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, credentials: true },
  });

  socketHandler.attach(io);

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      service: "notifications-service",
      connected_sockets: socketHandler.totalConnectedCount(),
    });
  });

  app.post("/internal/notify", (req, res) => {
    const token = req.get("X-Internal-Token");
    if (!token || token !== INTERNAL_SERVICE_TOKEN) {
      return res
        .status(401)
        .json({ error: "invalid or missing X-Internal-Token" });
    }

    const { recipient_email, type, title, body, link, notification_id } =
      req.body || {};
    if (!recipient_email) {
      return res.status(400).json({ error: "recipient_email is required" });
    }

    const result = deliverNotification(io, {
      recipient_email,
      type,
      title,
      body,
      link,
      notification_id,
    });

    return res.status(200).json(result);
  });

  return { app, httpServer, io };
}

module.exports = { buildServer };
