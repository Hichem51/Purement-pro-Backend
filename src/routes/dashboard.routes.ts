import { Router } from "express";

import { dashboardController } from "../controllers/dashboard.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
const dashboardAccess = [requireAuth, requireRole("admin", "manager")];

router.get(
  "/search",
  ...dashboardAccess,
  asyncHandler(dashboardController.searchController)
);

router.get(
  "/overview",
  ...dashboardAccess,
  asyncHandler(dashboardController.getOverviewController)
);

export default router;
