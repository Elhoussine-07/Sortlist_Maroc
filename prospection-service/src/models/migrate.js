"use strict";

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const logger = require("../utils/logger");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("DATABASE_URL is not set — cannot run migrations");
    process.exitCode = 1;
    return;
  }

  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    logger.info("Applying schema.sql", { schemaPath });
    await client.query(sql);
    logger.info("Migration complete");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  logger.error("Migration failed", { error: err.message });
  process.exitCode = 1;
});
