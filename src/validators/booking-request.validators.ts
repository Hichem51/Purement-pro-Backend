import { RequestHandler } from "express";
import { body, param, query } from "express-validator";
import { isValidObjectId } from "mongoose";

import { BOOKING_REQUEST_STATUSES } from "../models/booking-request.model";

const cleaningTypes = [
  "regular_residential",
  "commercial",
  "airbnb_rental",
  "deep_cleaning",
  "decluttering"
];

const contactPreferences = ["email", "sms", "phone", "whatsapp"];

const unsafeDescriptionPatterns = [/<script/i, /<\/script/i, /javascript:/i];
const protectedUpdateFields = [
  "requestNumber",
  "status",
  "internalNotes",
  "photos",
  "source",
  "createdAt",
  "updatedAt",
  "_id",
  "id"
];

const propertyDescriptionSafetyValidator = (value: string): boolean => {
  if (unsafeDescriptionPatterns.some((pattern) => pattern.test(value))) {
    throw new Error("Property description contains unsafe content");
  }

  return true;
};

export const normalizeBookingPhone: RequestHandler = (req, _res, next) => {
  const phone = req.body.phone;

  if (typeof phone === "string") {
    req.body.phone = {
      number: phone,
      smsOptIn: false
    };
  } else if (phone && typeof phone === "object" && !Array.isArray(phone)) {
    req.body.phone = {
      number: typeof phone.number === "string" ? phone.number : "",
      smsOptIn: phone.smsOptIn === undefined ? false : phone.smsOptIn
    };
  }

  if (req.body.phone && typeof req.body.phone === "object") {
    if (req.body.bookingSmsConsent === undefined) {
      req.body.bookingSmsConsent = req.body.phone.smsOptIn === true;
    }

    console.log("Normalized phone object:", {
      number: req.body.phone.number ? "[provided]" : "",
      smsOptIn: req.body.phone.smsOptIn
    });
  }

  next();
};

export const debugBookingValidation: RequestHandler = (req, _res, next) => {
  const body = req.body;

  console.log("HEADERS:", req.headers);
  console.log("BODY:", body);
  console.log("PHONE:", body.phone);
  console.log("VALIDATION CHECKS:", {
    name: Boolean(body.firstName && body.lastName),
    email: Boolean(body.email),
    phone: Boolean(body.phone?.number),
    service: Boolean(body.cleaningType),
    date: Boolean(body.preferredStartDate)
  });

  next();
};

export const listBookingRequestsValidators = [
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

  query("status")
    .optional()
    .isIn(BOOKING_REQUEST_STATUSES)
    .withMessage("Status is invalid"),

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

export const createBookingRequestValidators = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 80 })
    .withMessage("First name must be at most 80 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 80 })
    .withMessage("Last name must be at most 80 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage("Email must be at most 254 characters"),

  body("phone")
    .isObject()
    .withMessage("Phone must be an object"),

  body("phone.number")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ max: 30 })
    .withMessage("Phone must be at most 30 characters"),

  body("phone.smsOptIn")
    .optional()
    .isBoolean()
    .withMessage("SMS opt-in must be a boolean")
    .toBoolean(),

  body("streetAddress")
    .trim()
    .notEmpty()
    .withMessage("Street address is required")
    .isLength({ max: 200 })
    .withMessage("Street address must be at most 200 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 100 })
    .withMessage("City must be at most 100 characters"),

  body("provinceState")
    .trim()
    .notEmpty()
    .withMessage("Province or state is required")
    .isLength({ max: 100 })
    .withMessage("Province or state must be at most 100 characters"),

  body("postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ max: 30 })
    .withMessage("Postal code must be at most 30 characters"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must be at most 100 characters"),

  body("propertyType")
    .trim()
    .notEmpty()
    .withMessage("Property type is required")
    .isLength({ max: 100 })
    .withMessage("Property type must be at most 100 characters"),

  body("cleaningType")
    .notEmpty()
    .withMessage("Cleaning type is required")
    .isIn(cleaningTypes)
    .withMessage("Cleaning type is invalid"),

  body("roomsOffices")
    .notEmpty()
    .withMessage("Rooms/offices is required")
    .isInt({ min: 0, max: 100 })
    .withMessage("Rooms/offices must be an integer between 0 and 100")
    .toInt(),

  body("bathrooms")
    .notEmpty()
    .withMessage("Bathrooms is required")
    .isInt({ min: 0, max: 50 })
    .withMessage("Bathrooms must be an integer between 0 and 50")
    .toInt(),

  body("levels")
    .notEmpty()
    .withMessage("Levels is required")
    .isInt({ min: 0, max: 20 })
    .withMessage("Levels must be an integer between 0 and 20")
    .toInt(),

  body("propertyDescription")
    .trim()
    .notEmpty()
    .withMessage("Property description is required")
    .isLength({ max: 2000 })
    .withMessage("Property description must be at most 2000 characters")
    .custom(propertyDescriptionSafetyValidator),

  body("useEcoProducts")
    .optional()
    .isBoolean()
    .withMessage("Use eco products must be a boolean")
    .toBoolean(),

  body("preferredStartDate")
    .notEmpty()
    .withMessage("Preferred start date is required")
    .isISO8601({ strict: true })
    .withMessage("Preferred start date must be a valid ISO date")
    .toDate(),

  body("preferredEndDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Preferred end date must be a valid ISO date")
    .toDate()
    .custom((preferredEndDate: Date, { req }) => {
      const preferredStartDate = new Date(req.body.preferredStartDate);

      if (preferredEndDate < preferredStartDate) {
        throw new Error("Preferred end date must not be before preferred start date");
      }

      return true;
    }),

  body("preferredTime")
    .trim()
    .notEmpty()
    .withMessage("Preferred time is required")
    .isLength({ max: 100 })
    .withMessage("Preferred time must be at most 100 characters"),

  body("frequency")
    .trim()
    .notEmpty()
    .withMessage("Frequency is required")
    .isLength({ max: 100 })
    .withMessage("Frequency must be at most 100 characters"),

  body("contactPreference")
    .notEmpty()
    .withMessage("Contact preference is required")
    .isIn(contactPreferences)
    .withMessage("Contact preference is invalid"),

  body("referralSource")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Referral source must be at most 200 characters"),

  body("bookingSmsConsent")
    .optional()
    .isBoolean()
    .withMessage("Booking SMS consent must be a boolean")
    .toBoolean(),

  body("marketingEmailConsent")
    .optional()
    .isBoolean()
    .withMessage("Marketing email consent must be a boolean")
    .toBoolean(),

  body("language").optional().isIn(["fr", "en"]).withMessage("Language must be fr or en")
];

export const createManualBookingRequestValidators = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 80 })
    .withMessage("First name must be at most 80 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 80 })
    .withMessage("Last name must be at most 80 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage("Email must be at most 254 characters"),

  body("phone")
    .isObject()
    .withMessage("Phone must be an object"),

  body("phone.number")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ max: 30 })
    .withMessage("Phone must be at most 30 characters"),

  body("phone.smsOptIn")
    .optional()
    .isBoolean()
    .withMessage("SMS opt-in must be a boolean")
    .toBoolean(),

  body("streetAddress")
    .trim()
    .notEmpty()
    .withMessage("Street address is required")
    .isLength({ max: 200 })
    .withMessage("Street address must be at most 200 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 100 })
    .withMessage("City must be at most 100 characters"),

  body("provinceState")
    .trim()
    .notEmpty()
    .withMessage("Province or state is required")
    .isLength({ max: 100 })
    .withMessage("Province or state must be at most 100 characters"),

  body("postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ max: 30 })
    .withMessage("Postal code must be at most 30 characters"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must be at most 100 characters"),

  body("propertyType")
    .trim()
    .notEmpty()
    .withMessage("Property type is required")
    .isLength({ max: 100 })
    .withMessage("Property type must be at most 100 characters"),

  body("cleaningType")
    .notEmpty()
    .withMessage("Cleaning type is required")
    .isIn(cleaningTypes)
    .withMessage("Cleaning type is invalid"),

  body("roomsOffices")
    .notEmpty()
    .withMessage("Rooms/offices is required")
    .isInt({ min: 0, max: 100 })
    .withMessage("Rooms/offices must be an integer between 0 and 100")
    .toInt(),

  body("bathrooms")
    .notEmpty()
    .withMessage("Bathrooms is required")
    .isInt({ min: 0, max: 50 })
    .withMessage("Bathrooms must be an integer between 0 and 50")
    .toInt(),

  body("levels")
    .notEmpty()
    .withMessage("Levels is required")
    .isInt({ min: 0, max: 20 })
    .withMessage("Levels must be an integer between 0 and 20")
    .toInt(),

  body("propertyDescription")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Property description must be at most 2000 characters")
    .custom(propertyDescriptionSafetyValidator),

  body("useEcoProducts")
    .optional()
    .isBoolean()
    .withMessage("Use eco products must be a boolean")
    .toBoolean(),

  body("preferredStartDate")
    .notEmpty()
    .withMessage("Preferred start date is required")
    .isISO8601({ strict: true })
    .withMessage("Preferred start date must be a valid ISO date")
    .toDate(),

  body("preferredEndDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Preferred end date must be a valid ISO date")
    .toDate()
    .custom((preferredEndDate: Date, { req }) => {
      const preferredStartDate = new Date(req.body.preferredStartDate);

      if (preferredEndDate < preferredStartDate) {
        throw new Error("Preferred end date must not be before preferred start date");
      }

      return true;
    }),

  body("preferredTime")
    .trim()
    .notEmpty()
    .withMessage("Preferred time is required")
    .isLength({ max: 100 })
    .withMessage("Preferred time must be at most 100 characters"),

  body("frequency")
    .trim()
    .notEmpty()
    .withMessage("Frequency is required")
    .isLength({ max: 100 })
    .withMessage("Frequency must be at most 100 characters"),

  body("contactPreference")
    .notEmpty()
    .withMessage("Contact preference is required")
    .isIn(contactPreferences)
    .withMessage("Contact preference is invalid"),

  body("referralSource")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Referral source must be at most 200 characters"),

  body("bookingSmsConsent")
    .optional()
    .isBoolean()
    .withMessage("Booking SMS consent must be a boolean")
    .toBoolean(),

  body("marketingEmailConsent")
    .optional()
    .isBoolean()
    .withMessage("Marketing email consent must be a boolean")
    .toBoolean(),

  body("language").default("fr").isIn(["fr", "en"]).withMessage("Language must be fr or en"),

  body("internalNotes")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("Internal notes must be a string")
    .isLength({ max: 3000 })
    .withMessage("Internal notes must be at most 3000 characters"),

  body("photos")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Photos must be an array with at most 5 items"),

  body("photos.*.url")
    .notEmpty()
    .withMessage("Photo URL is required")
    .isURL({ require_protocol: true })
    .withMessage("Photo URL must be valid"),

  body("photos.*.secureUrl")
    .optional()
    .isURL({ require_protocol: true })
    .withMessage("Secure photo URL must be valid"),

  body("photos.*.publicId")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Photo public ID must be at most 300 characters"),

  body("photos.*.originalName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Photo original name must be at most 200 characters"),

  body("photos.*.mimeType")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Photo MIME type must be at most 100 characters"),

  body("photos.*.size")
    .optional()
    .isFloat({ min: 0, max: 5242880 })
    .withMessage("Photo size must be between 0 and 5242880 bytes")
    .toFloat()
];

export const getBookingRequestByIdValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Booking request ID must be a valid MongoDB ObjectId")
];

export const updateBookingRequestValidator = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Booking request ID must be a valid MongoDB ObjectId"),

  body(protectedUpdateFields)
    .not()
    .exists()
    .withMessage("This field cannot be updated from this route"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("First name must be at most 80 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Last name must be at most 80 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email must be valid")
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage("Email must be at most 254 characters"),

  body("phone")
    .optional()
    .isObject()
    .withMessage("Phone must be an object"),

  body("phone.number")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Phone must be at most 30 characters"),

  body("phone.smsOptIn")
    .optional()
    .isBoolean()
    .withMessage("SMS opt-in must be a boolean")
    .toBoolean(),

  body("streetAddress")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Street address must be at most 200 characters"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must be at most 100 characters"),

  body("provinceState")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Province or state must be at most 100 characters"),

  body("postalCode")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Postal code must be at most 30 characters"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country must be at most 100 characters"),

  body("propertyType")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Property type must be at most 100 characters"),

  body("cleaningType")
    .optional()
    .isIn(cleaningTypes)
    .withMessage("Cleaning type is invalid"),

  body("roomsOffices")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Rooms/offices must be an integer between 0 and 100")
    .toInt(),

  body("bathrooms")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Bathrooms must be an integer between 0 and 50")
    .toInt(),

  body("levels")
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage("Levels must be an integer between 0 and 20")
    .toInt(),

  body("propertyDescription")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Property description must be at most 2000 characters")
    .custom(propertyDescriptionSafetyValidator),

  body("useEcoProducts")
    .optional()
    .isBoolean()
    .withMessage("Use eco products must be a boolean")
    .toBoolean(),

  body("preferredStartDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Preferred start date must be a valid ISO date")
    .toDate(),

  body("preferredEndDate")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Preferred end date must be a valid ISO date")
    .toDate()
    .custom((preferredEndDate: Date, { req }) => {
      if (!req.body.preferredStartDate) {
        return true;
      }

      const preferredStartDate = new Date(req.body.preferredStartDate);

      if (preferredEndDate < preferredStartDate) {
        throw new Error("Preferred end date must not be before preferred start date");
      }

      return true;
    }),

  body("preferredTime")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Preferred time must be at most 100 characters"),

  body("frequency")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Frequency must be at most 100 characters"),

  body("contactPreference")
    .optional()
    .isIn(contactPreferences)
    .withMessage("Contact preference is invalid"),

  body("referralSource")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Referral source must be at most 200 characters"),

  body("bookingSmsConsent")
    .optional()
    .isBoolean()
    .withMessage("Booking SMS consent must be a boolean")
    .toBoolean(),

  body("marketingEmailConsent")
    .optional()
    .isBoolean()
    .withMessage("Marketing email consent must be a boolean")
    .toBoolean(),

  body("language").optional().isIn(["fr", "en"]).withMessage("Language must be fr or en")
];

export const updateBookingRequestStatusValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Booking request ID must be a valid MongoDB ObjectId"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(BOOKING_REQUEST_STATUSES)
    .withMessage("Status is invalid")
];

export const updateBookingRequestNotesValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Booking request ID must be a valid MongoDB ObjectId"),

  body("internalNotes")
    .optional({ nullable: true })
    .trim()
    .isString()
    .withMessage("Internal notes must be a string")
    .isLength({ max: 3000 })
    .withMessage("Internal notes must be at most 3000 characters")
];

export const updateBookingRequestPhotosValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Booking request ID must be a valid MongoDB ObjectId"),

  body("photos")
    .isArray({ max: 5 })
    .withMessage("Photos must be an array with at most 5 items"),

  body("photos.*.url")
    .notEmpty()
    .withMessage("Photo URL is required")
    .isURL({ require_protocol: true })
    .withMessage("Photo URL must be valid"),

  body("photos.*.secureUrl")
    .optional()
    .isURL({ require_protocol: true })
    .withMessage("Secure photo URL must be valid"),

  body("photos.*.publicId")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Photo public ID must be at most 300 characters"),

  body("photos.*.originalName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Photo original name must be at most 200 characters"),

  body("photos.*.mimeType")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Photo MIME type must be at most 100 characters"),

  body("photos.*.size")
    .optional()
    .isFloat({ min: 0, max: 5242880 })
    .withMessage("Photo size must be between 0 and 5242880 bytes")
    .toFloat()
];
