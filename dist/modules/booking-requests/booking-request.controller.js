"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRequestController = exports.BookingRequestController = void 0;
const api_error_1 = require("../../utils/api-error");
const booking_request_service_1 = require("./booking-request.service");
class BookingRequestController {
    createBookingRequestController = async (req, res) => {
        const bookingRequest = await (0, booking_request_service_1.createBookingRequest)(req.body);
        res.status(201).json({
            success: true,
            message: "Booking request created successfully",
            data: {
                bookingRequestId: bookingRequest.id,
                status: bookingRequest.status
            }
        });
    };
    getBookingRequestByIdController = async (req, res) => {
        const { id } = req.params;
        const bookingRequest = await (0, booking_request_service_1.getBookingRequestById)(id);
        if (!bookingRequest) {
            throw new api_error_1.ApiError(404, "Booking request not found");
        }
        res.status(200).json({
            success: true,
            data: {
                bookingRequest
            }
        });
    };
}
exports.BookingRequestController = BookingRequestController;
exports.bookingRequestController = new BookingRequestController();
