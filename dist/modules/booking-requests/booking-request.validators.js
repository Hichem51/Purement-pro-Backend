"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingRequestByIdValidators = exports.createBookingRequestValidators = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
const cleaningTypes = [
    "regular_residential",
    "commercial",
    "airbnb_rental",
    "deep_cleaning",
    "decluttering"
];
const contactPreferences = ["email", "sms", "phone", "whatsapp"];
const unsafeDescriptionPatterns = [/<script/i, /<\/script/i, /javascript:/i];
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
