"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingRequestById = exports.createBookingRequest = void 0;
const mongoose_1 = require("mongoose");
const booking_request_model_1 = require("../../models/booking-request.model");
const createBookingRequest = async (input) => {
    const bookingRequest = new booking_request_model_1.BookingRequest(input);
    return bookingRequest.save();
};
exports.createBookingRequest = createBookingRequest;
const getBookingRequestById = async (id) => {
    return booking_request_model_1.BookingRequest.findById(new mongoose_1.Types.ObjectId(id)).exec();
};
exports.getBookingRequestById = getBookingRequestById;
