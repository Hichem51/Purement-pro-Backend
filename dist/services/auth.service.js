"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCurrentUserAvatar = exports.login = exports.signAuthToken = exports.toAuthUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const user_model_1 = require("../models/user.model");
const api_error_1 = require("../utils/api-error");
const invalidCredentialsError = new api_error_1.ApiError(401, "Courriel ou mot de passe invalide.");
const toAuthUser = (user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role
});
exports.toAuthUser = toAuthUser;
const signAuthToken = (user) => {
    const payload = {
        sub: user.id,
        role: user.role
    };
    const options = {
        expiresIn: env_1.env.jwtExpiresIn
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwtSecret, options);
};
exports.signAuthToken = signAuthToken;
const login = async (input) => {
    const user = await user_model_1.User.findOne({ email: input.email }).exec();
    if (!user) {
        throw invalidCredentialsError;
    }
    const isPasswordValid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
        throw invalidCredentialsError;
    }
    if (!user.isActive) {
        throw new api_error_1.ApiError(403, "Votre compte a été désactivé par un administrateur.");
    }
    user.lastLoginAt = new Date();
    await user.save();
    return {
        token: (0, exports.signAuthToken)(user),
        user: (0, exports.toAuthUser)(user)
    };
};
exports.login = login;
const updateCurrentUserAvatar = async (input) => {
    const user = await user_model_1.User.findByIdAndUpdate(input.userId, {
        avatarUrl: input.avatarUrl,
        avatarPublicId: input.avatarPublicId
    }, { new: true, runValidators: true }).exec();
    if (!user) {
        throw new api_error_1.ApiError(404, "User not found");
    }
    return (0, exports.toAuthUser)(user);
};
exports.updateCurrentUserAvatar = updateCurrentUserAvatar;
