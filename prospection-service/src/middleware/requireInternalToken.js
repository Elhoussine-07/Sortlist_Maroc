"use strict";

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || "dev-insecure-internal-token";

/**
 * Verifie que l'appel entrant porte le meme jeton partage que celui deja
 * utilise par ce service pour appeler Frappe en sortant (frappeClient.js),
 * injecte par l'api-gateway. Applique uniquement aux routes accessibles
 * depuis l'espace agence authentifie -- /visit et /track restent ouverts
 * car appeles directement depuis le navigateur d'un visiteur anonyme, qui
 * ne peut jamais connaitre ce secret.
 */
function requireInternalToken(req, res, next) {
  const token = req.headers["x-internal-token"];
  if (!token || token !== INTERNAL_SERVICE_TOKEN) {
    return res.status(401).json({ error: "unauthorized", message: "Jeton interne manquant ou invalide" });
  }
  return next();
}

module.exports = requireInternalToken;
