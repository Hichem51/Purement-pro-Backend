"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDatabase = async () => {
    mongoose_1.default.connection.on("disconnected", () => {
        console.error("MongoDB disconnected");
    });
    mongoose_1.default.connection.on("reconnected", () => {
        console.log("MongoDB reconnected");
    });
    await mongoose_1.default.connect(env_1.env.mongodbUri, {
        serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB connected");
};
exports.connectDatabase = connectDatabase;
