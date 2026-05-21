import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDatabase } from "../config/database";
import { User } from "../models/user.model";

interface SeedAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
};

const readSeedAdminInput = (): SeedAdminInput => {
  const firstName = getRequiredEnv("SEED_ADMIN_FIRST_NAME");
  const lastName = getRequiredEnv("SEED_ADMIN_LAST_NAME");
  const email = getRequiredEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = getRequiredEnv("SEED_ADMIN_PASSWORD");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SEED_ADMIN_EMAIL must be a valid email address");
  }

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters");
  }

  return {
    firstName,
    lastName,
    email,
    password
  };
};

const seedAdmin = async (): Promise<void> => {
  const input = readSeedAdminInput();

  await connectDatabase();

  const existingUser = await User.findOne({ email: input.email }).exec();

  if (existingUser) {
    console.log(`Admin user already exists for ${input.email}. No user was created.`);
    return;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash,
    role: "admin",
    isActive: true
  });

  console.log(`Admin user created for ${input.email}.`);
};

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed admin user");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
