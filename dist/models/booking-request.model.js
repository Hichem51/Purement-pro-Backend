"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRequest = exports.BOOKING_REQUEST_STATUSES = void 0;
const mongoose_1 = require("mongoose");
exports.BOOKING_REQUEST_STATUSES = [
    "new",
    "reviewed",
    "contacted",
    "scheduled",
    "cancelled",
    "completed"
];
const bookingPhotoSchema = new mongoose_1.Schema({
    url: { type: String, required: true, trim: true },
    secureUrl: { type: String, trim: true },
    publicId: { type: String, trim: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number }
}, { _id: false });
const bookingRequestSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Customer" },
    requestNumber: { type: String, required: true, unique: true, sparse: true, trim: true },
    source: { type: String, enum: ["website", "dashboard"], default: "website" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    provinceState: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: "Canada", trim: true },
    propertyType: { type: String, required: true, trim: true },
    cleaningType: {
        type: String,
        enum: ["regular_residential", "commercial", "airbnb_rental", "deep_cleaning", "decluttering"],
        required: true
    },
    roomsOffices: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    levels: { type: Number, required: true },
    propertyDescription: { type: String, trim: true },
    useEcoProducts: { type: Boolean, default: false },
    preferredStartDate: { type: Date, required: true },
    preferredEndDate: { type: Date },
    preferredTime: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    contactPreference: { type: String, enum: ["email", "sms", "phone", "whatsapp"], required: true },
    referralSource: { type: String, trim: true },
    bookingSmsConsent: { type: Boolean, default: false },
    marketingEmailConsent: { type: Boolean, default: false },
    language: { type: String, enum: ["fr", "en"], default: "fr" },
    photos: { type: [bookingPhotoSchema], default: [] },
    status: {
        type: String,
        enum: exports.BOOKING_REQUEST_STATUSES,
        default: "new"
    },
    internalNotes: { type: String, trim: true }
}, { timestamps: true });
bookingRequestSchema.index({ email: 1 });
bookingRequestSchema.index({ phone: 1 });
bookingRequestSchema.index({ status: 1 });
bookingRequestSchema.index({ preferredStartDate: 1 });
bookingRequestSchema.index({ createdAt: 1 });
exports.BookingRequest = (0, mongoose_1.model)("BookingRequest", bookingRequestSchema);
