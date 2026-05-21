"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../config/database");
const user_model_1 = require("../models/user.model");
const getRequiredEnv = (key) => {
    const value = process.env[key]?.trim();
    if (!value) {
        throw new Error(`${key} is required`);
    }
    return value;
};
const readSeedAdminInput = () => {
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
const seedAdmin = async () => {
    const input = readSeedAdminInput();
    await (0, database_1.connectDatabase)();
    const existingUser = await user_model_1.User.findOne({ email: input.email }).exec();
    if (existingUser) {
        console.log(`Admin user already exists for ${input.email}. No user was created.`);
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
    await user_model_1.User.create({
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
    await mongoose_1.default.connection.close();
});
