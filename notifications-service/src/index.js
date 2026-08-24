"use strict";

const { buildServer } = require("./server");
const { startLeadHotConsumer } = require("./services/notificationService");

const PORT = process.env.PORT || 8085;

function start() {
  const { httpServer, io } = buildServer();

  httpServer.listen(PORT, () => {
    console.log(`[notifications-service] listening on port ${PORT}`);
  });

  if (process.env.DISABLE_LEAD_HOT_CONSUMER !== "true") {
    startLeadHotConsumer(io).catch((err) => {
      console.warn(
        `[notifications-service] lead.hot consumer failed to start: ${err.message}`,
      );
    });
  }

  return { httpServer, io };
}

if (require.main === module) {
  start();
}

module.exports = { start };
