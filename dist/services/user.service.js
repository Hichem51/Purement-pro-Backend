"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.updateUserStatus = exports.getUserById = exports.listUsers = exports.setInvitedUserPassword = exports.resendInvitation = exports.inviteUser = exports.toSafeUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = require("mongoose");
const env_1 = require("../config/env");
const mail_service_1 = require("./mail/mail.service");
const user_model_1 = require("../models/user.model");
const api_error_1 = require("../utils/api-error");
const INVITATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const hashInvitationToken = (token) => {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
};
const createRawInvitationToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
const toSafeUser = (user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    invitedByUserId: user.invitedByUserId,
    invitedAt: user.invitedAt,
    invitedEmailSentAt: user.invitedEmailSentAt,
    invitationResentAt: user.invitationResentAt,
    passwordChangedAt: user.passwordChangedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});
exports.toSafeUser = toSafeUser;
const inviteUser = async (input) => {
    const email = input.email.toLowerCase();
    const existingUser = await user_model_1.User.findOne({ email }).exec();
    if (existingUser) {
        throw new api_error_1.ApiError(409, "A user already exists with this email");
    }
    const rawToken = createRawInvitationToken();
    const invitationTokenHash = hashInvitationToken(rawToken);
    const temporaryPasswordHash = await bcryptjs_1.default.hash(createRawInvitationToken(), 12);
    const invitationTokenExpiresAt = new Date(Date.now() + INVITATION_TOKEN_TTL_MS);
    const setupUrl = `${env_1.env.frontendUrl}/purement-console/set-password?token=${rawToken}`;
    const user = await user_model_1.User.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        role: input.role,
        isActive: false,
        passwordHash: temporaryPasswordHash,
        invitationTokenHash,
        invitationTokenExpiresAt,
        invitedByUserId: new mongoose_1.Types.ObjectId(input.invitedByUserId),
        invitedAt: new Date()
    });
    try {
        const invitedByUser = await user_model_1.User.findById(new mongoose_1.Types.ObjectId(input.invitedByUserId)).exec();
        const invitedByName = invitedByUser
            ? `${invitedByUser.firstName} ${invitedByUser.lastName}`.trim()
            : undefined;
        await (0, mail_service_1.sendManagerInvitationEmail)({
            toEmail: user.email,
            toName: `${user.firstName} ${user.lastName}`.trim(),
            setupUrl,
            invitedByName
        }, { action: "invite" });
        user.invitedEmailSentAt = new Date();
        await user.save();
    }
    catch (error) {
        console.error("Manager invitation email failed", {
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : error
        });
        throw new api_error_1.ApiError(500, "Invitation created but email could not be sent");
    }
    return {
        user: (0, exports.toSafeUser)(user),
        ...(env_1.env.nodeEnv === "development" && {
            setupUrl
        })
    };
};
exports.inviteUser = inviteUser;
const sendInvitationEmailForUser = async (user, rawToken, invitedByUserId) => {
    const setupUrl = `${env_1.env.frontendUrl}/purement-console/set-password?token=${rawToken}`;
    const invitedByUser = await user_model_1.User.findById(new mongoose_1.Types.ObjectId(invitedByUserId)).exec();
    const invitedByName = invitedByUser
        ? `${invitedByUser.firstName} ${invitedByUser.lastName}`.trim()
        : undefined;
    await (0, mail_service_1.sendManagerInvitationEmail)({
        toEmail: user.email,
        toName: `${user.firstName} ${user.lastName}`.trim(),
        setupUrl,
        invitedByName
    }, { action: "resend" });
    return setupUrl;
};
const resendInvitation = async (input) => {
    const user = await user_model_1.User.findById(new mongoose_1.Types.ObjectId(input.id)).exec();
    if (!user) {
        throw new api_error_1.ApiError(404, "User not found");
    }
    if (user.isActive) {
        throw new api_error_1.ApiError(400, "User is already active");
    }
    const rawToken = createRawInvitationToken();
    user.invitationTokenHash = hashInvitationToken(rawToken);
    user.invitationTokenExpiresAt = new Date(Date.now() + INVITATION_TOKEN_TTL_MS);
    user.invitationResentAt = new Date();
    await user.save();
    let setupUrl;
    try {
        setupUrl = await sendInvitationEmailForUser(user, rawToken, input.invitedByUserId);
    }
    catch (error) {
        console.error("Manager invitation resend email failed", {
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : error
        });
        throw new api_error_1.ApiError(500, "Invitation email could not be resent");
    }
    user.invitedEmailSentAt = new Date();
    await user.save();
    return {
        ...(env_1.env.nodeEnv === "development" && {
            setupUrl
        })
    };
};
exports.resendInvitation = resendInvitation;
const setInvitedUserPassword = async (input) => {
    const invitationTokenHash = hashInvitationToken(input.token);
    const user = await user_model_1.User.findOne({
        invitationTokenHash,
        invitationTokenExpiresAt: { $gt: new Date() }
    }).exec();
    if (!user) {
        throw new api_error_1.ApiError(400, "Invitation token is invalid or expired");
    }
    user.passwordHash = await bcryptjs_1.default.hash(input.password, 12);
    user.isActive = true;
    user.invitationTokenHash = undefined;
    user.invitationTokenExpiresAt = undefined;
    user.passwordChangedAt = new Date();
    await user.save();
    return (0, exports.toSafeUser)(user);
};
exports.setInvitedUserPassword = setInvitedUserPassword;
const listUsers = async (input) => {
    const { page, limit, role, isActive, search } = input;
    const filter = {};
    if (role) {
        filter.role = role;
    }
    if (isActive !== undefined) {
        filter.isActive = isActive;
    }
    if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex }
        ];
    }
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        user_model_1.User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        user_model_1.User.countDocuments(filter).exec()
    ]);
    return {
        items: users.map(exports.toSafeUser),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};
exports.listUsers = listUsers;
const getUserById = async (id) => {
    const user = await user_model_1.User.findById(new mongoose_1.Types.ObjectId(id)).exec();
    return user ? (0, exports.toSafeUser)(user) : null;
};
exports.getUserById = getUserById;
const assertCanRemoveActiveAdmin = async (user) => {
    if (user.role !== "admin" || !user.isActive) {
        return;
    }
    const activeAdminCount = await user_model_1.User.countDocuments({
        role: "admin",
        isActive: true
    }).exec();
    if (activeAdminCount <= 1) {
        throw new api_error_1.ApiError(400, "You cannot remove the last active admin");
    }
};
const updateUserStatus = async (input) => {
    if (input.id === input.currentUserId && !input.isActive) {
        throw new api_error_1.ApiError(400, "You cannot deactivate your own user account");
    }
    const user = await user_model_1.User.findById(new mongoose_1.Types.ObjectId(input.id)).exec();
    if (!user) {
        return null;
    }
    if (!input.isActive) {
        await assertCanRemoveActiveAdmin(user);
    }
    user.isActive = input.isActive;
    await user.save();
    return (0, exports.toSafeUser)(user);
};
exports.updateUserStatus = updateUserStatus;
const updateUserRole = async (input) => {
    if (input.id === input.currentUserId && input.role !== "admin") {
        throw new api_error_1.ApiError(400, "You cannot demote your own user account");
    }
    const user = await user_model_1.User.findById(new mongoose_1.Types.ObjectId(input.id)).exec();
    if (!user) {
        return null;
    }
    if (user.role === "admin" && input.role !== "admin") {
        await assertCanRemoveActiveAdmin(user);
    }
    user.role = input.role;
    await user.save();
    return (0, exports.toSafeUser)(user);
};
exports.updateUserRole = updateUserRole;
