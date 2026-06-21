import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const server = app.listen(env.port, env.host, () => {
      console.log(`Purement Pro API listening on ${env.host}:${env.port}`);
    });

    const shutdown = (signal: NodeJS.Signals): void => {
      console.log(`${signal} received. Shutting down Purement Pro API.`);

      server.close(() => {
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start Purement Pro API");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  process.exit(1);
});

void startServer();
