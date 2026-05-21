"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingRequestPhotos = exports.updateBookingRequestNotes = exports.updateBookingRequestStatus = exports.getBookingRequestById = exports.listBookingRequests = exports.createBookingRequest = void 0;
const mongoose_1 = require("mongoose");
const booking_request_model_1 = require("../models/booking-request.model");
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
const createBookingRequest = async (input) => {
    const bookingRequest = new booking_request_model_1.BookingRequest(input);
    return bookingRequest.save();
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
