"use strict";

const logger = require("../utils/logger");

function notConfiguredProvider(name) {
  return {
    async export(lead) {
      logger.info(`CRM sync requested for unconfigured provider "${name}"`, {
        provider: name,
        leadId: lead.id,
      });
      return {
        status: "not_configured",
        provider: name,
        message:
          `${name} integration is not implemented yet (SHOULD-priority feature). ` +
          "No API credentials are wired up — this call is a documented no-op.",
      };
    },
  };
}

const PROVIDERS = {
  hubspot: notConfiguredProvider("hubspot"),
  pipedrive: notConfiguredProvider("pipedrive"),
  teamleader: notConfiguredProvider("teamleader"),
};

async function exportLead(lead, provider) {
  const impl = PROVIDERS[String(provider || "").toLowerCase()];
  if (!impl) {
    return {
      status: "unknown_provider",
      provider,
      message: `Unknown CRM provider "${provider}". Supported (but not yet wired up): ${Object.keys(PROVIDERS).join(", ")}.`,
    };
  }
  return impl.export(lead);
}

module.exports = { exportLead, PROVIDERS: Object.keys(PROVIDERS) };
