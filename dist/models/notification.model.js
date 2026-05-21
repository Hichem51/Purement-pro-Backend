"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    bookingRequestId: { type: mongoose_1.Schema.Types.ObjectId, ref: "BookingRequest" },
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Invoice" },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Customer" },
    type: { type: String, enum: ["email", "sms"], required: true },
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    provider: { type: String, trim: true },
    providerMessageId: { type: String, trim: true },
    errorMessage: { type: String, trim: true },
    sentAt: { type: Date }
}, { timestamps: true });
notificationSchema.index({ bookingRequestId: 1 });
notificationSchema.index({ invoiceId: 1 });
notificationSchema.index({ customerId: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: 1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
