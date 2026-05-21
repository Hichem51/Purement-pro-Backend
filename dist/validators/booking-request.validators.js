"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingRequestPhotosValidators = exports.updateBookingRequestNotesValidators = exports.updateBookingRequestStatusValidators = exports.getBookingRequestByIdValidators = exports.createBookingRequestValidators = exports.listBookingRequestsValidators = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
const booking_request_model_1 = require("../models/booking-request.model");
const cleaningTypes = [
    "regular_residential",
    "commercial",
    "airbnb_rental",
    "deep_cleaning",
    "decluttering"
];
const contactPreferences = ["email", "sms", "phone", "whatsapp"];
const unsafeDescriptionPatterns = [/<script/i, /<\/script/i, /javascript:/i];
exports.listBookingRequestsValidators = [
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
    (0, express_validator_1.query)("status")
        .optional()
        .isIn(booking_request_model_1.BOOKING_REQUEST_STATUSES)
        .withMessage("Status is invalid"),
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
exports.createBookingRequestValidators = [
    (0, express_validator_1.body)("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .isLength({ max: 80 })
        .withMessage("First name must be at most 80 characters"),
    (0, express_validator_1.body)("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .isLength({ max: 80 })
        .withMessage("Last name must be at most 80 characters"),
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be valid")
        .toLowerCase()
        .isLength({ max: 254 })
        .withMessage("Email must be at most 254 characters"),
    (0, express_validator_1.body)("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone is required")
        .isLength({ max: 30 })
        .withMessage("Phone must be at most 30 characters"),
    (0, express_validator_1.body)("streetAddress")
        .trim()
        .notEmpty()
        .withMessage("Street address is required")
        .isLength({ max: 200 })
        .withMessage("Street address must be at most 200 characters"),
    (0, express_validator_1.body)("city")
        .trim()
        .notEmpty()
        .withMessage("City is required")
        .isLength({ max: 100 })
        .withMessage("City must be at most 100 characters"),
    (0, express_validator_1.body)("provinceState")
        .trim()
        .notEmpty()
        .withMessage("Province or state is required")
        .isLength({ max: 100 })
        .withMessage("Province or state must be at most 100 characters"),
    (0, express_validator_1.body)("postalCode")
        .trim()
        .notEmpty()
        .withMessage("Postal code is required")
        .isLength({ max: 30 })
        .withMessage("Postal code must be at most 30 characters"),
    (0, express_validator_1.body)("country")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Country must be at most 100 characters"),
    (0, express_validator_1.body)("propertyType")
        .trim()
        .notEmpty()
        .withMessage("Property type is required")
        .isLength({ max: 100 })
        .withMessage("Property type must be at most 100 characters"),
    (0, express_validator_1.body)("cleaningType")
        .notEmpty()
        .withMessage("Cleaning type is required")
        .isIn(cleaningTypes)
        .withMessage("Cleaning type is invalid"),
    (0, express_validator_1.body)("roomsOffices")
        .notEmpty()
        .withMessage("Rooms/offices is required")
        .isInt({ min: 0, max: 100 })
        .withMessage("Rooms/offices must be an integer between 0 and 100")
        .toInt(),
    (0, express_validator_1.body)("bathrooms")
        .notEmpty()
        .withMessage("Bathrooms is required")
        .isInt({ min: 0, max: 50 })
        .withMessage("Bathrooms must be an integer between 0 and 50")
        .toInt(),
    (0, express_validator_1.body)("levels")
        .notEmpty()
        .withMessage("Levels is required")
        .isInt({ min: 0, max: 20 })
        .withMessage("Levels must be an integer between 0 and 20")
        .toInt(),
    (0, express_validator_1.body)("propertyDescription")
        .trim()
        .notEmpty()
        .withMessage("Property description is required")
        .isLength({ max: 2000 })
        .withMessage("Property description must be at most 2000 characters")
        .custom((value) => {
        if (unsafeDescriptionPatterns.some((pattern) => pattern.test(value))) {
            throw new Error("Property description contains unsafe content");
        }
        return true;
    }),
    (0, express_validator_1.body)("useEcoProducts")
        .optional()
        .isBoolean()
        .withMessage("Use eco products must be a boolean")
        .toBoolean(),
    (0, express_validator_1.body)("preferredStartDate")
        .notEmpty()
        .withMessage("Preferred start date is required")
        .isISO8601({ strict: true })
        .withMessage("Preferred start date must be a valid ISO date")
        .toDate(),
    (0, express_validator_1.body)("preferredEndDate")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Preferred end date must be a valid ISO date")
        .toDate()
        .custom((preferredEndDate, { req }) => {
        const preferredStartDate = new Date(req.body.preferredStartDate);
        if (preferredEndDate < preferredStartDate) {
            throw new Error("Preferred end date must not be before preferred start date");
        }
        return true;
    }),
    (0, express_validator_1.body)("preferredTime")
        .trim()
        .notEmpty()
        .withMessage("Preferred time is required")
        .isLength({ max: 100 })
        .withMessage("Preferred time must be at most 100 characters"),
    (0, express_validator_1.body)("frequency")
        .trim()
        .notEmpty()
        .withMessage("Frequency is required")
        .isLength({ max: 100 })
        .withMessage("Frequency must be at most 100 characters"),
    (0, express_validator_1.body)("contactPreference")
        .notEmpty()
        .withMessage("Contact preference is required")
        .isIn(contactPreferences)
        .withMessage("Contact preference is invalid"),
    (0, express_validator_1.body)("referralSource")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Referral source must be at most 200 characters"),
    (0, express_validator_1.body)("bookingSmsConsent")
        .optional()
        .isBoolean()
        .withMessage("Booking SMS consent must be a boolean")
        .toBoolean(),
    (0, express_validator_1.body)("marketingEmailConsent")
        .optional()
        .isBoolean()
        .withMessage("Marketing email consent must be a boolean")
        .toBoolean(),
    (0, express_validator_1.body)("language").optional().isIn(["fr", "en"]).withMessage("Language must be fr or en")
];
exports.getBookingRequestByIdValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Booking request ID must be a valid MongoDB ObjectId")
];
exports.updateBookingRequestStatusValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Booking request ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(booking_request_model_1.BOOKING_REQUEST_STATUSES)
        .withMessage("Status is invalid")
];
exports.updateBookingRequestNotesValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Booking request ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("internalNotes")
        .optional({ nullable: true })
        .trim()
        .isString()
        .withMessage("Internal notes must be a string")
        .isLength({ max: 3000 })
        .withMessage("Internal notes must be at most 3000 characters")
];
exports.updateBookingRequestPhotosValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Booking request ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("photos")
        .isArray({ max: 5 })
        .withMessage("Photos must be an array with at most 5 items"),
    (0, express_validator_1.body)("photos.*.url")
        .notEmpty()
        .withMessage("Photo URL is required")
        .isURL({ require_protocol: true })
        .withMessage("Photo URL must be valid"),
    (0, express_validator_1.body)("photos.*.secureUrl")
        .optional()
        .isURL({ require_protocol: true })
        .withMessage("Secure photo URL must be valid"),
    (0, express_validator_1.body)("photos.*.publicId")
        .optional()
        .trim()
        .isLength({ max: 300 })
        .withMessage("Photo public ID must be at most 300 characters"),
    (0, express_validator_1.body)("photos.*.originalName")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Photo original name must be at most 200 characters"),
    (0, express_validator_1.body)("photos.*.mimeType")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Photo MIME type must be at most 100 characters"),
    (0, express_validator_1.body)("photos.*.size")
        .optional()
        .isFloat({ min: 0, max: 5242880 })
        .withMessage("Photo size must be between 0 and 5242880 bytes")
        .toFloat()
];
