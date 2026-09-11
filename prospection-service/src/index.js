"use strict";

const express = require("express");
const db = require("./db");
const logger = require("./utils/logger");
const prospectionRouter = require("./routes/prospection");

const PORT = Number(process.env.PORT || 8084);

function buildApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info(`${req.method} ${req.originalUrl}`, {
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });
    next();
  });

  app.get("/health", async (req, res) => {
    const dbStatus = await db.checkConnection();
    res.status(200).json({
      status: "ok",
      service: "prospection-service",
      uptime_seconds: Math.round(process.uptime()),
      db: dbStatus,
      openai_configured: Boolean(process.env.OPENAI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/prospection", prospectionRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err, req, res, next) => {
    logger.error("Unhandled error", { error: err.message, stack: err.stack });
    const statusCode = err.statusCode || 500;
    res
      .status(statusCode)
      .json({ error: err.message || "Internal server error" });
  });

  return app;
}

function start() {
  const app = buildApp();
  const server = app.listen(PORT, () => {
    logger.info(`prospection-service listening on port ${PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(() => {
      db.getPool()
        .end()
        .catch(() => {})
        .finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

if (require.main === module) {
  start();
}

module.exports = { buildApp, start };
