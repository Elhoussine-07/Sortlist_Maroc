"use strict";

const LEVELS = ["debug", "info", "warn", "error"];
const MIN_LEVEL = LEVELS.includes(process.env.LOG_LEVEL)
  ? process.env.LOG_LEVEL
  : "info";

function shouldLog(level) {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(MIN_LEVEL);
}

function write(level, msg, meta) {
  if (!shouldLog(level)) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    service: "prospection-service",
    msg,
    ...(meta ? { meta } : {}),
  };
  const out =
    level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
}

module.exports = {
  debug: (msg, meta) => write("debug", msg, meta),
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
};
