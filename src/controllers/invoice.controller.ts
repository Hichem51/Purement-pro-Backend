import { Request, Response } from "express";

import { InvoicePaymentStatus, InvoiceStatus } from "../models/invoice.model";
import {
  cancelInvoice,
  createInvoice,
  getInvoiceById,
  listInvoices,
  updateInvoice,
  updateInvoicePaymentStatus,
  updateInvoiceStatus
} from "../services/invoice.service";
import { ApiError } from "../utils/api-error";

export class InvoiceController {
  createInvoiceController = async (req: Request, res: Response): Promise<void> => {
    const invoice = await createInvoice(req.body);

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: {
        invoice
      }
    });
  };

  listInvoicesController = async (req: Request, res: Response): Promise<void> => {
    const result = await listInvoices({
      page: req.query.page as unknown as number,
      limit: req.query.limit as unknown as number,
      status: req.query.status as InvoiceStatus | undefined,
      paymentStatus: req.query.paymentStatus as InvoicePaymentStatus | undefined,
      search: req.query.search as string | undefined,
      sort: req.query.sort as "newest" | "oldest"
    });

    res.status(200).json({
      success: true,
      data: result
    });
  };

  getInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    res.status(200).json({
      success: true,
      data: {
        invoice
      }
    });
  };

  updateInvoiceController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const invoice = await updateInvoice(id, req.body);

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    res.status(200).json({
      success: true,
      data: {
        invoice
      }
    });
  };

  updateInvoiceStatusController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: InvoiceStatus };
    const invoice = await updateInvoiceStatus(id, status);

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    res.status(200).json({
      success: true,
      data: {
        invoice
      }
    });
  };

  updateInvoicePaymentStatusController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { paymentStatus } = req.body as { paymentStatus: InvoicePaymentStatus };
    const invoice = await updateInvoicePaymentStatus(id, paymentStatus);

    if (!invoice) {
      throw new ApiError(404, "Facture introuvable.");
    }

    res.status(200).json({
      success: true,
      message: "Statut de paiement mis à jour avec succès.",
      data: {
        invoice
      }
    });
  };

  cancelInvoiceController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const invoice = await cancelInvoice(id);

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    res.status(200).json({
      success: true,
      message: "Invoice cancelled successfully",
      data: {
        invoice
      }
    });
  };
}

export const invoiceController = new InvoiceController();
