"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager"], default: "admin" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    invitationTokenHash: { type: String },
    invitationTokenExpiresAt: { type: Date },
    invitedByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    invitedAt: { type: Date },
    invitedEmailSentAt: { type: Date },
    invitationResentAt: { type: Date },
    passwordChangedAt: { type: Date }
}, { timestamps: true });
userSchema.index({ invitationTokenHash: 1 });
exports.User = (0, mongoose_1.model)("User", userSchema);
