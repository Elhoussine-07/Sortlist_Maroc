"use strict";

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";

const connections = new Map();

function registerSocket(email, socketId) {
  if (!connections.has(email)) {
    connections.set(email, new Set());
  }
  connections.get(email).add(socketId);
}

function unregisterSocket(email, socketId) {
  const set = connections.get(email);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) {
    connections.delete(email);
  }
}

function connectedSocketCount(email) {
  return connections.get(email)?.size || 0;
}

function totalConnectedCount() {
  let total = 0;
  for (const set of connections.values()) {
    total += set.size;
  }
  return total;
}

function extractToken(socket) {
  const queryToken = socket.handshake.query?.token;
  const authToken = socket.handshake.auth?.token;
  return authToken || queryToken || null;
}

function authMiddleware(socket, next) {
  const token = extractToken(socket);
  if (!token) {
    return next(new Error("authentication error: missing token"));
  }

  try {
    const claims = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (!claims.sub) {
      return next(new Error("authentication error: token missing sub claim"));
    }
    socket.claims = claims;
    return next();
  } catch (err) {
    return next(new Error(`authentication error: ${err.message}`));
  }
}

function attach(io) {
  io.use(authMiddleware);

  io.on("connection", (socket) => {
    const email = socket.claims.sub;

    socket.join(email);
    registerSocket(email, socket.id);

    socket.on("disconnect", () => {
      unregisterSocket(email, socket.id);
    });
  });
}

module.exports = {
  attach,
  authMiddleware,
  connectedSocketCount,
  totalConnectedCount,
};
