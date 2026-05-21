"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoicePaymentStatusValidators = exports.updateInvoiceStatusValidators = exports.updateInvoiceValidators = exports.getInvoiceByIdValidators = exports.listInvoicesValidators = exports.createInvoiceValidators = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
const invoice_model_1 = require("../models/invoice.model");
const objectIdValidator = (field) => (0, express_validator_1.body)(field)
    .optional()
    .custom((value) => (0, mongoose_1.isValidObjectId)(value))
    .withMessage(`${field} must be a valid MongoDB ObjectId`);
const invoiceItemsValidators = (isRequired) => {
    const itemsValidator = isRequired
        ? (0, express_validator_1.body)("items")
            .exists()
            .withMessage("Items are required")
            .bail()
            .isArray({ min: 1 })
            .withMessage("Items must be an array with at least one item")
        : (0, express_validator_1.body)("items")
            .optional()
            .isArray({ min: 1 })
            .withMessage("Items must be an array with at least one item");
    return [
        itemsValidator,
        (0, express_validator_1.body)("items.*.description")
            .if((0, express_validator_1.body)("items").exists())
            .trim()
            .notEmpty()
            .withMessage("Item description is required")
            .isLength({ max: 300 })
            .withMessage("Item description must be at most 300 characters"),
        (0, express_validator_1.body)("items.*.quantity")
            .if((0, express_validator_1.body)("items").exists())
            .isFloat({ min: 0.01, max: 999 })
            .withMessage("Item quantity must be a number between 0.01 and 999")
            .toFloat(),
        (0, express_validator_1.body)("items.*.unitPrice")
            .if((0, express_validator_1.body)("items").exists())
            .isFloat({ min: 0, max: 100000 })
            .withMessage("Item unit price must be a number between 0 and 100000")
            .toFloat()
    ];
};
exports.createInvoiceValidators = [
    objectIdValidator("bookingRequestId"),
    objectIdValidator("customerId"),
    (0, express_validator_1.body)("customerName")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required")
        .isLength({ max: 160 })
        .withMessage("Customer name must be at most 160 characters"),
    (0, express_validator_1.body)("customerEmail")
        .trim()
        .notEmpty()
        .withMessage("Customer email is required")
        .isEmail()
        .withMessage("Customer email must be valid")
        .toLowerCase(),
    (0, express_validator_1.body)("customerPhone")
        .optional()
        .trim()
        .isLength({ max: 40 })
        .withMessage("Customer phone must be at most 40 characters"),
    (0, express_validator_1.body)("billingAddress")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Billing address must be at most 500 characters"),
    ...invoiceItemsValidators(true),
    (0, express_validator_1.body)("taxAmount")
        .default(0)
        .isFloat({ min: 0 })
        .withMessage("Tax amount must be a number greater than or equal to 0")
        .toFloat(),
    (0, express_validator_1.body)("discountAmount")
        .default(0)
        .isFloat({ min: 0 })
        .withMessage("Discount amount must be a number greater than or equal to 0")
        .toFloat(),
    (0, express_validator_1.body)("currency")
        .default("CAD")
        .trim()
        .isLength({ max: 10 })
        .withMessage("Currency must be at most 10 characters"),
    (0, express_validator_1.body)("issuedAt")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Issued date must be a valid ISO date")
        .toDate(),
    (0, express_validator_1.body)("dueAt")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Due date must be a valid ISO date")
        .toDate(),
    (0, express_validator_1.body)("notes")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Notes must be at most 2000 characters"),
    (0, express_validator_1.body)("metadata").optional().isObject().withMessage("Metadata must be an object")
];
exports.listInvoicesValidators = [
    (0, express_validator_1.query)("page")
        .default(1)
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    (0, express_validator_1.query)("limit")
        .default(20)
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be an integer between 1 and 100")
        .toInt(),
    (0, express_validator_1.query)("status").optional().isIn(invoice_model_1.INVOICE_STATUSES).withMessage("Status is invalid"),
    (0, express_validator_1.query)("paymentStatus")
        .optional()
        .isIn(invoice_model_1.INVOICE_PAYMENT_STATUSES)
        .withMessage("Payment status is invalid"),
    (0, express_validator_1.query)("search")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Search must be at most 200 characters"),
    (0, express_validator_1.query)("sort")
        .default("newest")
        .isIn(["newest", "oldest"])
        .withMessage("Sort must be newest or oldest")
];
exports.getInvoiceByIdValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Invoice ID must be a valid MongoDB ObjectId")
];
exports.updateInvoiceValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Invoice ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("customerName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Customer name cannot be empty")
        .isLength({ max: 160 })
        .withMessage("Customer name must be at most 160 characters"),
    (0, express_validator_1.body)("customerEmail")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Customer email must be valid")
        .toLowerCase(),
    (0, express_validator_1.body)("customerPhone")
        .optional()
        .trim()
        .isLength({ max: 40 })
        .withMessage("Customer phone must be at most 40 characters"),
    (0, express_validator_1.body)("billingAddress")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Billing address must be at most 500 characters"),
    ...invoiceItemsValidators(false),
    (0, express_validator_1.body)("taxAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Tax amount must be a number greater than or equal to 0")
        .toFloat(),
    (0, express_validator_1.body)("discountAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Discount amount must be a number greater than or equal to 0")
        .toFloat(),
    (0, express_validator_1.body)("currency")
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage("Currency must be at most 10 characters"),
    (0, express_validator_1.body)("issuedAt")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Issued date must be a valid ISO date")
        .toDate(),
    (0, express_validator_1.body)("dueAt")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Due date must be a valid ISO date")
        .toDate(),
    (0, express_validator_1.body)("notes")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Notes must be at most 2000 characters")
];
exports.updateInvoiceStatusValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Invoice ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(invoice_model_1.INVOICE_STATUSES)
        .withMessage("Status is invalid")
];
exports.updateInvoicePaymentStatusValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Invoice ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("paymentStatus")
        .notEmpty()
        .withMessage("Statut de paiement invalide.")
        .isIn(invoice_model_1.INVOICE_PAYMENT_STATUSES)
        .withMessage("Statut de paiement invalide.")
];
