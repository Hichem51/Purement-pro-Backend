import mongoose from "mongoose";

import { env } from "./env";

const databaseName = "purement-pro";

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  await mongoose.connect(env.mongodbUri, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10000
  });

  console.log(`Using MongoDB database: ${databaseName}`);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};
