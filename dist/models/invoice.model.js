"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = exports.INVOICE_PAYMENT_STATUSES = exports.INVOICE_STATUSES = void 0;
const mongoose_1 = require("mongoose");
exports.INVOICE_STATUSES = ["draft", "sent", "cancelled"];
exports.INVOICE_PAYMENT_STATUSES = ["unpaid", "partial", "paid"];
const invoiceItemSchema = new mongoose_1.Schema({
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true }
}, { _id: false });
const invoiceSchema = new mongoose_1.Schema({
    bookingRequestId: { type: mongoose_1.Schema.Types.ObjectId, ref: "BookingRequest" },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Customer" },
    createdByUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: exports.INVOICE_STATUSES, default: "draft" },
    paymentStatus: { type: String, enum: exports.INVOICE_PAYMENT_STATUSES, default: "unpaid" },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, trim: true },
    billingAddress: { type: String, trim: true },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "CAD", trim: true },
    issuedAt: { type: Date },
    dueAt: { type: Date },
    sentAt: { type: Date },
    notes: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ customerEmail: 1 });
invoiceSchema.index({ createdAt: 1 });
exports.Invoice = (0, mongoose_1.model)("Invoice", invoiceSchema);
