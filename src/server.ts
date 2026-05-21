import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(`Purement Pro API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start Purement Pro API");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

void startServer();
