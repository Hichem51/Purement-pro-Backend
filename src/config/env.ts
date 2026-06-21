import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "production" | "test";

interface EnvConfig {
  port: number;
  host: string;
  nodeEnv: NodeEnv;
  frontendUrl: string;
  frontendUrls: string[];
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  internalApiKey: string;
  brevoApiKey?: string;
  mailFromEmail?: string;
  mailFromName: string;
}

const baseRequiredEnvVars = [
  "PORT",
  "NODE_ENV",
  "FRONTEND_URL",
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "INTERNAL_API_KEY"
] as const;

const productionRequiredEnvVars = ["BREVO_API_KEY"] as const;

const requiredEnvVars =
  process.env.NODE_ENV === "production"
    ? [...baseRequiredEnvVars, ...productionRequiredEnvVars]
    : baseRequiredEnvVars;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const validNodeEnvs: NodeEnv[] = ["development", "production", "test"];
const nodeEnv = process.env.NODE_ENV as NodeEnv;

if (!validNodeEnvs.includes(nodeEnv)) {
  throw new Error("NODE_ENV must be one of: development, production, test");
}

const frontendUrls = (process.env.FRONTEND_URL as string)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const localFrontendUrls = ["http://localhost:3000", "http://127.0.0.1:3000"];
const allowedFrontendUrls = Array.from(new Set([...frontendUrls, ...localFrontendUrls]));

if (frontendUrls.length === 0) {
  throw new Error("FRONTEND_URL must include at least one allowed origin");
}

export const env: EnvConfig = {
  port,
  host: process.env.HOST?.trim() || "0.0.0.0",
  nodeEnv,
  frontendUrl: frontendUrls[0],
  frontendUrls: allowedFrontendUrls,
  mongodbUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN as string,
  internalApiKey: process.env.INTERNAL_API_KEY as string,
  brevoApiKey: process.env.BREVO_API_KEY?.trim() || undefined,
  mailFromEmail: process.env.MAIL_FROM_EMAIL?.trim() || undefined,
  mailFromName: process.env.MAIL_FROM_NAME?.trim() || "Purement Pro"
};
