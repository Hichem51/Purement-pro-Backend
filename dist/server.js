"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        const server = app_1.default.listen(env_1.env.port, env_1.env.host, () => {
            console.log(`Purement Pro API listening on ${env_1.env.host}:${env_1.env.port}`);
        });
        const shutdown = (signal) => {
            console.log(`${signal} received. Shutting down Purement Pro API.`);
            server.close(() => {
                process.exit(0);
            });
        };
        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    }
    catch (error) {
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
