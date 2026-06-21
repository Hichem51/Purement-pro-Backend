"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthOrInternalApiKey = exports.requireRole = exports.requireAuth = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const user_model_1 = require("../models/user.model");
const api_error_1 = require("../utils/api-error");
const isInternalApiKeyValid = (providedKey) => {
    if (!providedKey) {
        return false;
    }
    const expectedKeyBuffer = Buffer.from(env_1.env.internalApiKey);
    const providedKeyBuffer = Buffer.from(providedKey);
    if (expectedKeyBuffer.length !== providedKeyBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(expectedKeyBuffer, providedKeyBuffer);
};
const requireAuth = async (req, _res, next) => {
    try {
        const authorizationHeader = req.header("Authorization");
        if (!authorizationHeader?.startsWith("Bearer ")) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const token = authorizationHeader.replace("Bearer ", "").trim();
        if (!token) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        if (!payload.sub) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const user = await user_model_1.User.findOne({ _id: payload.sub, isActive: true }).exec();
        if (!user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            next(error);
            return;
        }
        next(new api_error_1.ApiError(401, "Authentication required"));
    }
};
exports.requireAuth = requireAuth;
const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user) {
        next(new api_error_1.ApiError(401, "Authentication required"));
        return;
    }
    if (!roles.includes(req.user.role)) {
        next(new api_error_1.ApiError(403, "Forbidden"));
        return;
    }
    next();
};
exports.requireRole = requireRole;
const requireAuthOrInternalApiKey = (...roles) => async (req, res, next) => {
    try {
        const internalApiKey = req.header("x-internal-api-key");
        if (isInternalApiKeyValid(internalApiKey)) {
            next();
            return;
        }
        await (0, exports.requireAuth)(req, res, (authError) => {
            if (authError) {
                next(authError);
                return;
            }
            (0, exports.requireRole)(...roles)(req, res, next);
        });
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuthOrInternalApiKey = requireAuthOrInternalApiKey;
