"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const paymentSchema = new mongoose_1.Schema({
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Invoice", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "CAD", trim: true },
    method: {
        type: String,
        enum: ["cash", "card", "bank_transfer", "etransfer", "other"],
        required: true
    },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    paidAt: { type: Date },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true }
}, { timestamps: true });
paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paidAt: 1 });
exports.Payment = (0, mongoose_1.model)("Payment", paymentSchema);
