import { Request, Response } from "express";

import { ApiError } from "../utils/api-error";
import { BookingRequestStatus } from "../models/booking-request.model";
import {
  createBookingRequest,
  getBookingRequestById,
  listBookingRequests,
  updateBookingRequestNotes,
  updateBookingRequestPhotos,
  updateBookingRequestStatus
} from "../services/booking-request.service";

export class BookingRequestController {
  createBookingRequestController = async (req: Request, res: Response): Promise<void> => {
    const bookingRequest = await createBookingRequest(req.body);

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

  createManualBookingRequestController = async (req: Request, res: Response): Promise<void> => {
    const bookingRequest = await createBookingRequest({
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

  listBookingRequestsController = async (req: Request, res: Response): Promise<void> => {
    const result = await listBookingRequests({
      page: req.query.page as unknown as number,
      limit: req.query.limit as unknown as number,
      status: req.query.status as BookingRequestStatus | undefined,
      search: req.query.search as string | undefined,
      sort: req.query.sort as "newest" | "oldest"
    });

    res.status(200).json({
      success: true,
      data: result
    });
  };

  getBookingRequestByIdController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const bookingRequest = await getBookingRequestById(id);

    if (!bookingRequest) {
      throw new ApiError(404, "Booking request not found");
    }

    res.status(200).json({
      success: true,
      data: {
        bookingRequest
      }
    });
  };

  updateBookingRequestStatusController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: BookingRequestStatus };

    const bookingRequest = await updateBookingRequestStatus(id, status);

    if (!bookingRequest) {
      throw new ApiError(404, "Booking request not found");
    }

    res.status(200).json({
      success: true,
      data: {
        bookingRequest
      }
    });
  };

  updateBookingRequestNotesController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { internalNotes } = req.body as { internalNotes?: string | null };

    const bookingRequest = await updateBookingRequestNotes(id, internalNotes);

    if (!bookingRequest) {
      throw new ApiError(404, "Booking request not found");
    }

    res.status(200).json({
      success: true,
      data: {
        bookingRequest
      }
    });
  };

  updateBookingRequestPhotosController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { photos } = req.body;

    const bookingRequest = await updateBookingRequestPhotos(id, { photos });

    if (!bookingRequest) {
      throw new ApiError(404, "Booking request not found");
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

export const bookingRequestController = new BookingRequestController();
