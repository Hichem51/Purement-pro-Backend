import mongoose from "mongoose";

import { env } from "./env";

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.mongodbUri);

  if (env.nodeEnv === "development") {
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  }
};
