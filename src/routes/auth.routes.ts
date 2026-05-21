import { Router } from "express";

import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate-request.middleware";
import { asyncHandler } from "../utils/async-handler";
import { loginValidators } from "../validators/auth.validators";

const router = Router();

router.post(
  "/login",
  loginValidators,
  validateRequest,
  asyncHandler(authController.loginController)
);

router.get("/me", requireAuth, asyncHandler(authController.meController));

router.post("/logout", asyncHandler(authController.logoutController));

export default router;
