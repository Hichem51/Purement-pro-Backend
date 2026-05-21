import { Router } from "express";

import { userController } from "../controllers/user.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate-request.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  getUserByIdValidators,
  inviteUserValidators,
  listUsersValidators,
  resendInvitationValidators,
  setPasswordValidators,
  updateUserRoleValidators,
  updateUserStatusValidators
} from "../validators/user.validators";

const router = Router();
const adminOnly = [requireAuth, requireRole("admin")];

router.post(
  "/invite",
  ...adminOnly,
  inviteUserValidators,
  validateRequest,
  asyncHandler(userController.inviteUserController)
);

router.post(
  "/set-password",
  setPasswordValidators,
  validateRequest,
  asyncHandler(userController.setPasswordController)
);

router.get(
  "/",
  ...adminOnly,
  listUsersValidators,
  validateRequest,
  asyncHandler(userController.listUsersController)
);

router.post(
  "/:id/resend-invitation",
  ...adminOnly,
  resendInvitationValidators,
  validateRequest,
  asyncHandler(userController.resendInvitationController)
);

router.get(
  "/:id",
  ...adminOnly,
  getUserByIdValidators,
  validateRequest,
  asyncHandler(userController.getUserByIdController)
);

router.patch(
  "/:id/status",
  ...adminOnly,
  updateUserStatusValidators,
  validateRequest,
  asyncHandler(userController.updateUserStatusController)
);

router.patch(
  "/:id/role",
  ...adminOnly,
  updateUserRoleValidators,
  validateRequest,
  asyncHandler(userController.updateUserRoleController)
);

export default router;
