"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRequestController = exports.BookingRequestController = void 0;
const api_error_1 = require("../utils/api-error");
const booking_request_service_1 = require("../services/booking-request.service");
class BookingRequestController {
    createBookingRequestController = async (req, res) => {
        const bookingRequest = await (0, booking_request_service_1.createBookingRequest)(req.body);
        res.status(201).json({
            success: true,
            message: "Booking request created successfully",
            data: {
                bookingRequestId: bookingRequest.id,
                requestNumber: bookingRequest.requestNumber,
                status: bookingRequest.status
            }
        });
    };
    createManualBookingRequestController = async (req, res) => {
        const bookingRequest = await (0, booking_request_service_1.createBookingRequest)({
            ...req.body,
            source: "dashboard"
        });
        res.status(201).json({
            success: true,
            message: "Demande créée avec succès.",
            data: {
                bookingRequest
            }
        });
    };
    listBookingRequestsController = async (req, res) => {
        const result = await (0, booking_request_service_1.listBookingRequests)({
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status,
            search: req.query.search,
            sort: req.query.sort
        });
        res.status(200).json({
            success: true,
            data: result
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
    updateBookingRequestController = async (req, res) => {
        const { id } = req.params;
        const bookingRequest = await (0, booking_request_service_1.updateBookingRequest)(id, req.body);
        if (!bookingRequest) {
            throw new api_error_1.ApiError(404, "Booking request not found");
        }
        res.status(200).json({
            success: true,
            message: "Demande mise à jour avec succès.",
            data: {
                bookingRequest
            }
        });
    };
    updateBookingRequestStatusController = async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const bookingRequest = await (0, booking_request_service_1.updateBookingRequestStatus)(id, status);
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
    updateBookingRequestNotesController = async (req, res) => {
        const { id } = req.params;
        const { internalNotes } = req.body;
        const bookingRequest = await (0, booking_request_service_1.updateBookingRequestNotes)(id, internalNotes);
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
    updateBookingRequestPhotosController = async (req, res) => {
        const { id } = req.params;
        const { photos } = req.body;
        const bookingRequest = await (0, booking_request_service_1.updateBookingRequestPhotos)(id, { photos });
        if (!bookingRequest) {
            throw new api_error_1.ApiError(404, "Booking request not found");
        }
        res.status(200).json({
            success: true,
            message: "Photos de la demande mises à jour avec succès.",
            data: {
                bookingRequest
            }
        });
    };
}
exports.BookingRequestController = BookingRequestController;
exports.bookingRequestController = new BookingRequestController();
