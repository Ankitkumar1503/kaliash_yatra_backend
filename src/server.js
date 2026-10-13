import "dotenv/config";
import db from "./config/db.js";
import app from "./app.js";
import logger from "./utils/logger.js";

const port = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    await db.query("SELECT 1");
  } catch (error) {
    logger.error("Database connection failed during startup", { code: error.code });
    await db.end().catch(() => {});
    process.exitCode = 1;
    return;
  }

  const server = app.listen(port, () => logger.info("Server listening", { port }));
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Graceful shutdown started", { signal });
    const timeout = setTimeout(() => {
      logger.error("Graceful shutdown timed out");
      process.exit(1);
    }, 10000);
    timeout.unref();
    server.close(async (error) => {
      if (error) logger.error("HTTP server shutdown failed", { message: error.message });
      await db.end();
      clearTimeout(timeout);
      process.exitCode = error ? 1 : 0;
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  logger.error("Server startup failed", { message: error.message });
  process.exitCode = 1;
});
