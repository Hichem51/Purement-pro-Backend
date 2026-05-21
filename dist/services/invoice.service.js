"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelInvoice = exports.updateInvoicePaymentStatus = exports.updateInvoiceStatus = exports.updateInvoice = exports.getInvoiceById = exports.listInvoices = exports.createInvoice = void 0;
const mongoose_1 = require("mongoose");
const invoice_model_1 = require("../models/invoice.model");
const roundMoney = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
};
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
const calculateInvoiceTotals = (items, taxAmount = 0, discountAmount = 0) => {
    const calculatedItems = items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: roundMoney(item.quantity * item.unitPrice)
    }));
    const subtotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const normalizedTaxAmount = roundMoney(taxAmount);
    const normalizedDiscountAmount = roundMoney(discountAmount);
    const totalAmount = roundMoney(subtotal + normalizedTaxAmount - normalizedDiscountAmount);
    return {
        items: calculatedItems,
        subtotal,
        taxAmount: normalizedTaxAmount,
        discountAmount: normalizedDiscountAmount,
        totalAmount
    };
};
const generateInvoiceNumber = async (year) => {
    const prefix = `PP-${year}-`;
    const latestInvoice = await invoice_model_1.Invoice.findOne({
        invoiceNumber: { $regex: `^${prefix}\\d{4}$` }
    })
        .sort({ invoiceNumber: -1 })
        .select("invoiceNumber")
        .lean()
        .exec();
    const latestSequence = latestInvoice?.invoiceNumber
        ? Number.parseInt(latestInvoice.invoiceNumber.replace(prefix, ""), 10)
        : 0;
    const nextSequence = latestSequence + 1;
    return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};
const createInvoice = async (input) => {
    const issuedAt = input.issuedAt ?? new Date();
    const year = issuedAt.getFullYear();
    const totals = calculateInvoiceTotals(input.items, input.taxAmount, input.discountAmount);
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const invoiceNumber = await generateInvoiceNumber(year);
        try {
            const invoice = new invoice_model_1.Invoice({
                bookingRequestId: input.bookingRequestId
                    ? new mongoose_1.Types.ObjectId(input.bookingRequestId)
                    : undefined,
                customerId: input.customerId ? new mongoose_1.Types.ObjectId(input.customerId) : undefined,
                invoiceNumber,
                status: "draft",
                paymentStatus: "unpaid",
                customerName: input.customerName,
                customerEmail: input.customerEmail,
                customerPhone: input.customerPhone,
                billingAddress: input.billingAddress,
                currency: input.currency ?? "CAD",
                issuedAt,
                dueAt: input.dueAt,
                notes: input.notes,
                metadata: input.metadata,
                ...totals
            });
            return await invoice.save();
        }
        catch (error) {
            if (typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === 11000 &&
                attempt < 2) {
                continue;
            }
            throw error;
        }
    }
    throw new Error("Unable to generate a unique invoice number");
};
exports.createInvoice = createInvoice;
const listInvoices = async (input) => {
    const { page, limit, status, paymentStatus, search, sort } = input;
    const filter = {};
    if (status) {
        filter.status = status;
    }
    if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
    }
    if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { invoiceNumber: searchRegex },
            { customerName: searchRegex },
            { customerEmail: searchRegex },
            { customerPhone: searchRegex }
        ];
    }
    const skip = (page - 1) * limit;
    const sortDirection = sort === "oldest" ? 1 : -1;
    const [items, total] = await Promise.all([
        invoice_model_1.Invoice.find(filter).sort({ createdAt: sortDirection }).skip(skip).limit(limit).exec(),
        invoice_model_1.Invoice.countDocuments(filter).exec()
    ]);
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};
exports.listInvoices = listInvoices;
const getInvoiceById = async (id) => {
    return invoice_model_1.Invoice.findById(new mongoose_1.Types.ObjectId(id)).exec();
};
exports.getInvoiceById = getInvoiceById;
const updateInvoice = async (id, input) => {
    const existingInvoice = await invoice_model_1.Invoice.findById(new mongoose_1.Types.ObjectId(id)).exec();
    if (!existingInvoice) {
        return null;
    }
    const nextItems = input.items ?? existingInvoice.items;
    const nextTaxAmount = input.taxAmount ?? existingInvoice.taxAmount;
    const nextDiscountAmount = input.discountAmount ?? existingInvoice.discountAmount;
    const totals = calculateInvoiceTotals(nextItems, nextTaxAmount, nextDiscountAmount);
    const editableUpdates = {};
    if (input.customerName !== undefined) {
        editableUpdates.customerName = input.customerName;
    }
    if (input.customerEmail !== undefined) {
        editableUpdates.customerEmail = input.customerEmail;
    }
    if (input.customerPhone !== undefined) {
        editableUpdates.customerPhone = input.customerPhone;
    }
    if (input.billingAddress !== undefined) {
        editableUpdates.billingAddress = input.billingAddress;
    }
    if (input.currency !== undefined) {
        editableUpdates.currency = input.currency;
    }
    if (input.issuedAt !== undefined) {
        editableUpdates.issuedAt = input.issuedAt;
    }
    if (input.dueAt !== undefined) {
        editableUpdates.dueAt = input.dueAt;
    }
    if (input.notes !== undefined) {
        editableUpdates.notes = input.notes;
    }
    existingInvoice.set({
        ...editableUpdates,
        ...totals
    });
    return existingInvoice.save();
};
exports.updateInvoice = updateInvoice;
const updateInvoiceStatus = async (id, status) => {
    const update = { status };
    if (status === "sent") {
        const existingInvoice = await invoice_model_1.Invoice.findById(new mongoose_1.Types.ObjectId(id)).select("sentAt").exec();
        if (!existingInvoice) {
            return null;
        }
        if (!existingInvoice.sentAt) {
            update.sentAt = new Date();
        }
    }
    return invoice_model_1.Invoice.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), update, {
        new: true,
        runValidators: true
    }).exec();
};
exports.updateInvoiceStatus = updateInvoiceStatus;
const updateInvoicePaymentStatus = async (id, paymentStatus) => {
    return invoice_model_1.Invoice.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { paymentStatus }, { new: true, runValidators: true }).exec();
};
exports.updateInvoicePaymentStatus = updateInvoicePaymentStatus;
const cancelInvoice = async (id) => {
    return invoice_model_1.Invoice.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { status: "cancelled" }, { new: true, runValidators: true }).exec();
};
exports.cancelInvoice = cancelInvoice;
