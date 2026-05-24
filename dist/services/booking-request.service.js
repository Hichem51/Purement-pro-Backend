"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingRequestPhotos = exports.updateBookingRequestNotes = exports.updateBookingRequestStatus = exports.updateBookingRequest = exports.getBookingRequestById = exports.listBookingRequests = exports.createBookingRequest = void 0;
const mongoose_1 = require("mongoose");
const booking_request_model_1 = require("../models/booking-request.model");
const api_error_1 = require("../utils/api-error");
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
const isDuplicateKeyError = (error) => {
    return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
};
const generateRequestNumber = async (year) => {
    const prefix = `PP-DMD-${year}-`;
    const latestBookingRequest = await booking_request_model_1.BookingRequest.findOne({
        requestNumber: { $regex: `^${prefix}\\d{4}$` }
    })
        .sort({ requestNumber: -1 })
        .select("requestNumber")
        .lean()
        .exec();
    const latestSequence = latestBookingRequest?.requestNumber
        ? Number.parseInt(latestBookingRequest.requestNumber.replace(prefix, ""), 10)
        : 0;
    const nextSequence = latestSequence + 1;
    return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};
const createBookingRequest = async (input) => {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const requestNumber = await generateRequestNumber(year);
        try {
            const bookingRequest = new booking_request_model_1.BookingRequest({
                ...input,
                requestNumber,
                source: input.source ?? "website"
            });
            return await bookingRequest.save();
        }
        catch (error) {
            if (isDuplicateKeyError(error)) {
                continue;
            }
            throw error;
        }
    }
    throw new api_error_1.ApiError(500, "Unable to generate a unique booking request number");
};
exports.createBookingRequest = createBookingRequest;
const listBookingRequests = async (input) => {
    const { page, limit, status, search, sort } = input;
    const filter = {};
    if (status) {
        filter.status = status;
    }
    if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { requestNumber: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { city: searchRegex }
        ];
    }
    const skip = (page - 1) * limit;
    const sortDirection = sort === "oldest" ? 1 : -1;
    const [items, total] = await Promise.all([
        booking_request_model_1.BookingRequest.find(filter).sort({ createdAt: sortDirection }).skip(skip).limit(limit).exec(),
        booking_request_model_1.BookingRequest.countDocuments(filter).exec()
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
exports.listBookingRequests = listBookingRequests;
const getBookingRequestById = async (id) => {
    return booking_request_model_1.BookingRequest.findById(new mongoose_1.Types.ObjectId(id)).exec();
};
exports.getBookingRequestById = getBookingRequestById;
const updateBookingRequest = async (id, input) => {
    const allowedUpdates = {};
    if (input.firstName !== undefined) {
        allowedUpdates.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
        allowedUpdates.lastName = input.lastName;
    }
    if (input.email !== undefined) {
        allowedUpdates.email = input.email;
    }
    if (input.phone !== undefined) {
        allowedUpdates.phone = input.phone;
    }
    if (input.streetAddress !== undefined) {
        allowedUpdates.streetAddress = input.streetAddress;
    }
    if (input.city !== undefined) {
        allowedUpdates.city = input.city;
    }
    if (input.provinceState !== undefined) {
        allowedUpdates.provinceState = input.provinceState;
    }
    if (input.postalCode !== undefined) {
        allowedUpdates.postalCode = input.postalCode;
    }
    if (input.country !== undefined) {
        allowedUpdates.country = input.country;
    }
    if (input.propertyType !== undefined) {
        allowedUpdates.propertyType = input.propertyType;
    }
    if (input.cleaningType !== undefined) {
        allowedUpdates.cleaningType = input.cleaningType;
    }
    if (input.roomsOffices !== undefined) {
        allowedUpdates.roomsOffices = input.roomsOffices;
    }
    if (input.bathrooms !== undefined) {
        allowedUpdates.bathrooms = input.bathrooms;
    }
    if (input.levels !== undefined) {
        allowedUpdates.levels = input.levels;
    }
    if (input.propertyDescription !== undefined) {
        allowedUpdates.propertyDescription = input.propertyDescription;
    }
    if (input.useEcoProducts !== undefined) {
        allowedUpdates.useEcoProducts = input.useEcoProducts;
    }
    if (input.preferredStartDate !== undefined) {
        allowedUpdates.preferredStartDate = input.preferredStartDate;
    }
    if (input.preferredEndDate !== undefined) {
        allowedUpdates.preferredEndDate = input.preferredEndDate;
    }
    if (input.preferredTime !== undefined) {
        allowedUpdates.preferredTime = input.preferredTime;
    }
    if (input.frequency !== undefined) {
        allowedUpdates.frequency = input.frequency;
    }
    if (input.contactPreference !== undefined) {
        allowedUpdates.contactPreference = input.contactPreference;
    }
    if (input.referralSource !== undefined) {
        allowedUpdates.referralSource = input.referralSource;
    }
    if (input.bookingSmsConsent !== undefined) {
        allowedUpdates.bookingSmsConsent = input.bookingSmsConsent;
    }
    if (input.marketingEmailConsent !== undefined) {
        allowedUpdates.marketingEmailConsent = input.marketingEmailConsent;
    }
    if (input.language !== undefined) {
        allowedUpdates.language = input.language;
    }
    return booking_request_model_1.BookingRequest.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), allowedUpdates, {
        new: true,
        runValidators: true
    }).exec();
};
exports.updateBookingRequest = updateBookingRequest;
const updateBookingRequestStatus = async (id, status) => {
    return booking_request_model_1.BookingRequest.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { status }, { new: true, runValidators: true }).exec();
};
exports.updateBookingRequestStatus = updateBookingRequestStatus;
const updateBookingRequestNotes = async (id, internalNotes) => {
    return booking_request_model_1.BookingRequest.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { internalNotes }, { new: true, runValidators: true }).exec();
};
exports.updateBookingRequestNotes = updateBookingRequestNotes;
const updateBookingRequestPhotos = async (id, input) => {
    return booking_request_model_1.BookingRequest.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { photos: input.photos }, { new: true, runValidators: true }).exec();
};
exports.updateBookingRequestPhotos = updateBookingRequestPhotos;
