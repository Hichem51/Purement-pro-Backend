"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVars = [
    "PORT",
    "NODE_ENV",
    "FRONTEND_URL",
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "INTERNAL_API_KEY"
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}
const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
}
const validNodeEnvs = ["development", "production", "test"];
const nodeEnv = process.env.NODE_ENV;
if (!validNodeEnvs.includes(nodeEnv)) {
    throw new Error("NODE_ENV must be one of: development, production, test");
}
const frontendUrls = process.env.FRONTEND_URL
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
if (frontendUrls.length === 0) {
    throw new Error("FRONTEND_URL must include at least one allowed origin");
}
exports.env = {
    port,
    nodeEnv,
    frontendUrl: frontendUrls[0],
    frontendUrls,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    internalApiKey: process.env.INTERNAL_API_KEY,
    brevoApiKey: process.env.BREVO_API_KEY?.trim() || undefined,
    mailFromEmail: process.env.MAIL_FROM_EMAIL?.trim() || undefined,
    mailFromName: process.env.MAIL_FROM_NAME?.trim() || "Purement Pro"
};
