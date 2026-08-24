"use strict";

const { Pool } = require("pg");
const logger = require("./utils/logger");

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.warn(
      "DATABASE_URL is not set — Postgres pool will fail on first query",
    );
  }

  pool = new Pool({
    connectionString: connectionString || undefined,
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (err) => {
    logger.error("Unexpected Postgres pool error", { error: err.message });
  });

  return pool;
}

async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}

async function checkConnection() {
  try {
    await query("select 1");
    return { up: true };
  } catch (err) {
    return { up: false, error: err.message };
  }
}

module.exports = { getPool, query, checkConnection };
