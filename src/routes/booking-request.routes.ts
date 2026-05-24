import { Router } from "express";

import { bookingRequestController } from "../controllers/booking-request.controller";
import { requireAuth, requireAuthOrInternalApiKey, requireRole } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate-request.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  createBookingRequestValidators,
  createManualBookingRequestValidators,
  getBookingRequestByIdValidators,
  listBookingRequestsValidators,
  updateBookingRequestValidator,
  updateBookingRequestNotesValidators,
  updateBookingRequestPhotosValidators,
  updateBookingRequestStatusValidators
} from "../validators/booking-request.validators";

const router = Router();
const dashboardAccess = [requireAuth, requireRole("admin", "manager")];

router.post(
  "/",
  createBookingRequestValidators,
  validateRequest,
  asyncHandler(bookingRequestController.createBookingRequestController)
);

router.post(
  "/manual",
  ...dashboardAccess,
  createManualBookingRequestValidators,
  validateRequest,
  asyncHandler(bookingRequestController.createManualBookingRequestController)
);

router.get(
  "/",
  ...dashboardAccess,
  listBookingRequestsValidators,
  validateRequest,
  asyncHandler(bookingRequestController.listBookingRequestsController)
);

router.get(
  "/:id",
  ...dashboardAccess,
  getBookingRequestByIdValidators,
  validateRequest,
  asyncHandler(bookingRequestController.getBookingRequestByIdController)
);

router.patch(
  "/:id",
  ...dashboardAccess,
  updateBookingRequestValidator,
  validateRequest,
  asyncHandler(bookingRequestController.updateBookingRequestController)
);

router.patch(
  "/:id/photos",
  requireAuthOrInternalApiKey("admin", "manager"),
  updateBookingRequestPhotosValidators,
  validateRequest,
  asyncHandler(bookingRequestController.updateBookingRequestPhotosController)
);

router.patch(
  "/:id/status",
  ...dashboardAccess,
  updateBookingRequestStatusValidators,
  validateRequest,
  asyncHandler(bookingRequestController.updateBookingRequestStatusController)
);

router.patch(
  "/:id/notes",
  ...dashboardAccess,
  updateBookingRequestNotesValidators,
  validateRequest,
  asyncHandler(bookingRequestController.updateBookingRequestNotesController)
);

export default router;
