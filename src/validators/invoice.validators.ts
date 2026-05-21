import { body, param, query } from "express-validator";
import { isValidObjectId } from "mongoose";

import { INVOICE_PAYMENT_STATUSES, INVOICE_STATUSES } from "../models/invoice.model";

const objectIdValidator = (field: string) =>
  body(field)
    .optional()
    .custom((value: string) => isValidObjectId(value))
    .withMessage(`${field} must be a valid MongoDB ObjectId`);

const invoiceItemsValidators = (isRequired: boolean) => {
  const itemsValidator = isRequired
    ? body("items")
        .exists()
        .withMessage("Items are required")
        .bail()
        .isArray({ min: 1 })
        .withMessage("Items must be an array with at least one item")
    : body("items")
        .optional()
        .isArray({ min: 1 })
        .withMessage("Items must be an array with at least one item");

  return [
    itemsValidator,

    body("items.*.description")
      .if(body("items").exists())
      .trim()
      .notEmpty()
      .withMessage("Item description is required")
      .isLength({ max: 300 })
      .withMessage("Item description must be at most 300 characters"),

    body("items.*.quantity")
      .if(body("items").exists())
      .isFloat({ min: 0.01, max: 999 })
      .withMessage("Item quantity must be a number between 0.01 and 999")
      .toFloat(),

    body("items.*.unitPrice")
      .if(body("items").exists())
      .isFloat({ min: 0, max: 100000 })
      .withMessage("Item unit price must be a number between 0 and 100000")
      .toFloat()
  ];
};

export const createInvoiceValidators = [
  objectIdValidator("bookingRequestId"),
  objectIdValidator("customerId"),

  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({ max: 160 })
    .withMessage("Customer name must be at most 160 characters"),

  body("customerEmail")
    .trim()
    .notEmpty()
    .withMessage("Customer email is required")
    .isEmail()
    .withMessage("Customer email must be valid")
    .toLowerCase(),

  body("customerPhone")
    .optional()
    .trim()
    .isLength({ max: 40 })
    .withMessage("Customer phone must be at most 40 characters"),

  body("billingAddress")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Billing address must be at most 500 characters"),

  ...invoiceItemsValidators(true),

  body("taxAmount")
    .default(0)
    .isFloat({ min: 0 })
    .withMessage("Tax amount must be a number greater than or equal to 0")
    .toFloat(),

  body("discountAmount")
    .default(0)
    .isFloat({ min: 0 })
    .withMessage("Discount amount must be a number greater than or equal to 0")
    .toFloat(),

  body("currency")
    .default("CAD")
    .trim()
    .isLength({ max: 10 })
    .withMessage("Currency must be at most 10 characters"),

  body("issuedAt")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Issued date must be a valid ISO date")
    .toDate(),

  body("dueAt")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Due date must be a valid ISO date")
    .toDate(),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Notes must be at most 2000 characters"),

  body("metadata").optional().isObject().withMessage("Metadata must be an object")
];

export const listInvoicesValidators = [
  query("page")
    .default(1)
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .default(20)
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),

  query("status").optional().isIn(INVOICE_STATUSES).withMessage("Status is invalid"),

  query("paymentStatus")
    .optional()
    .isIn(INVOICE_PAYMENT_STATUSES)
    .withMessage("Payment status is invalid"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search must be at most 200 characters"),

  query("sort")
    .default("newest")
    .isIn(["newest", "oldest"])
    .withMessage("Sort must be newest or oldest")
];

export const getInvoiceByIdValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Invoice ID must be a valid MongoDB ObjectId")
];

export const updateInvoiceValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Invoice ID must be a valid MongoDB ObjectId"),

  body("customerName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Customer name cannot be empty")
    .isLength({ max: 160 })
    .withMessage("Customer name must be at most 160 characters"),

  body("customerEmail")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Customer email must be valid")
    .toLowerCase(),

  body("customerPhone")
    .optional()
    .trim()
    .isLength({ max: 40 })
    .withMessage("Customer phone must be at most 40 characters"),

  body("billingAddress")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Billing address must be at most 500 characters"),

  ...invoiceItemsValidators(false),

  body("taxAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax amount must be a number greater than or equal to 0")
    .toFloat(),

  body("discountAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount amount must be a number greater than or equal to 0")
    .toFloat(),

  body("currency")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("Currency must be at most 10 characters"),

  body("issuedAt")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Issued date must be a valid ISO date")
    .toDate(),

  body("dueAt")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Due date must be a valid ISO date")
    .toDate(),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Notes must be at most 2000 characters")
];

export const updateInvoiceStatusValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Invoice ID must be a valid MongoDB ObjectId"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(INVOICE_STATUSES)
    .withMessage("Status is invalid")
];

export const updateInvoicePaymentStatusValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Invoice ID must be a valid MongoDB ObjectId"),

  body("paymentStatus")
    .notEmpty()
    .withMessage("Statut de paiement invalide.")
    .isIn(INVOICE_PAYMENT_STATUSES)
    .withMessage("Statut de paiement invalide.")
];
