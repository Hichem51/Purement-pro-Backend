"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const mongoose_1 = require("mongoose");
const customerSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    marketingEmailConsent: { type: Boolean, default: false },
    notes: { type: String, trim: true }
}, { timestamps: true });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
exports.Customer = (0, mongoose_1.model)("Customer", customerSchema);
