import { Router } from "express";

import { notificationController } from "../controllers/notification.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate-request.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  listNotificationsValidators,
  markNotificationAsReadValidators
} from "../validators/notification.validators";

const router = Router();
const dashboardAccess = [requireAuth, requireRole("admin", "manager")];

router.get(
  "/",
  ...dashboardAccess,
  listNotificationsValidators,
  validateRequest,
  asyncHandler(notificationController.listNotificationsController)
);

router.patch(
  "/read-all",
  ...dashboardAccess,
  asyncHandler(notificationController.markAllNotificationsAsReadController)
);

router.patch(
  "/:id/read",
  ...dashboardAccess,
  markNotificationAsReadValidators,
  validateRequest,
  asyncHandler(notificationController.markNotificationAsReadController)
);

export default router;
