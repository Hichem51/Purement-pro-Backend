"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NOTIFICATION_RELATED_RESOURCE_TYPES = exports.NOTIFICATION_AUDIENCES = exports.NOTIFICATION_TYPES = void 0;
const mongoose_1 = require("mongoose");
exports.NOTIFICATION_TYPES = [
    "booking_created",
    "invoice_created",
    "invoice_payment_updated",
    "manager_added",
    "booking_status_updated"
];
exports.NOTIFICATION_AUDIENCES = ["admin", "manager", "all"];
exports.NOTIFICATION_RELATED_RESOURCE_TYPES = ["booking", "invoice", "user"];
const notificationSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: exports.NOTIFICATION_TYPES,
        required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    href: { type: String, trim: true },
    audience: {
        type: String,
        enum: exports.NOTIFICATION_AUDIENCES,
        required: true
    },
    isReadBy: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
        default: []
    },
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    relatedResourceType: {
        type: String,
        enum: exports.NOTIFICATION_RELATED_RESOURCE_TYPES
    },
    relatedResourceId: { type: mongoose_1.Schema.Types.ObjectId }
}, { timestamps: true });
notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isReadBy: 1 });
notificationSchema.index({ relatedResourceType: 1, relatedResourceId: 1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
