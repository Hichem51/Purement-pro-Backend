import { Router } from "express";

import { invoiceController } from "../controllers/invoice.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate-request.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  createInvoiceValidators,
  getInvoiceByIdValidators,
  listInvoicesValidators,
  updateInvoicePaymentStatusValidators,
  updateInvoiceStatusValidators,
  updateInvoiceValidators
} from "../validators/invoice.validators";

const router = Router();
const dashboardAccess = [requireAuth, requireRole("admin", "manager")];

router.post(
  "/",
  ...dashboardAccess,
  createInvoiceValidators,
  validateRequest,
  asyncHandler(invoiceController.createInvoiceController)
);

router.get(
  "/",
  ...dashboardAccess,
  listInvoicesValidators,
  validateRequest,
  asyncHandler(invoiceController.listInvoicesController)
);

router.get(
  "/:id",
  ...dashboardAccess,
  getInvoiceByIdValidators,
  validateRequest,
  asyncHandler(invoiceController.getInvoiceByIdController)
);

router.patch(
  "/:id",
  ...dashboardAccess,
  updateInvoiceValidators,
  validateRequest,
  asyncHandler(invoiceController.updateInvoiceController)
);

router.patch(
  "/:id/status",
  ...dashboardAccess,
  updateInvoiceStatusValidators,
  validateRequest,
  asyncHandler(invoiceController.updateInvoiceStatusController)
);

router.patch(
  "/:id/payment-status",
  ...dashboardAccess,
  updateInvoicePaymentStatusValidators,
  validateRequest,
  asyncHandler(invoiceController.updateInvoicePaymentStatusController)
);

router.delete(
  "/:id",
  ...dashboardAccess,
  getInvoiceByIdValidators,
  validateRequest,
  asyncHandler(invoiceController.cancelInvoiceController)
);

export default router;
