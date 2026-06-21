import mongoose from "mongoose";

import { env } from "./env";

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10000
  });

  console.log("MongoDB connected");
};
