"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceController = exports.InvoiceController = void 0;
const invoice_service_1 = require("../services/invoice.service");
const api_error_1 = require("../utils/api-error");
class InvoiceController {
    createInvoiceController = async (req, res) => {
        const invoice = await (0, invoice_service_1.createInvoice)(req.body);
        res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: {
                invoice
            }
        });
    };
    listInvoicesController = async (req, res) => {
        const result = await (0, invoice_service_1.listInvoices)({
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status,
            paymentStatus: req.query.paymentStatus,
            search: req.query.search,
            sort: req.query.sort
        });
        res.status(200).json({
            success: true,
            data: result
        });
    };
    getInvoiceByIdController = async (req, res) => {
        const { id } = req.params;
        const invoice = await (0, invoice_service_1.getInvoiceById)(id);
        if (!invoice) {
            throw new api_error_1.ApiError(404, "Invoice not found");
        }
        res.status(200).json({
            success: true,
            data: {
                invoice
            }
        });
    };
    updateInvoiceController = async (req, res) => {
        const { id } = req.params;
        const invoice = await (0, invoice_service_1.updateInvoice)(id, req.body);
        if (!invoice) {
            throw new api_error_1.ApiError(404, "Invoice not found");
        }
        res.status(200).json({
            success: true,
            data: {
                invoice
            }
        });
    };
    updateInvoiceStatusController = async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const invoice = await (0, invoice_service_1.updateInvoiceStatus)(id, status);
        if (!invoice) {
            throw new api_error_1.ApiError(404, "Invoice not found");
        }
        res.status(200).json({
            success: true,
            data: {
                invoice
            }
        });
    };
    updateInvoicePaymentStatusController = async (req, res) => {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        const invoice = await (0, invoice_service_1.updateInvoicePaymentStatus)(id, paymentStatus);
        if (!invoice) {
            throw new api_error_1.ApiError(404, "Facture introuvable.");
        }
        res.status(200).json({
            success: true,
            message: "Statut de paiement mis à jour avec succès.",
            data: {
                invoice
            }
        });
    };
    cancelInvoiceController = async (req, res) => {
        const { id } = req.params;
        const invoice = await (0, invoice_service_1.cancelInvoice)(id);
        if (!invoice) {
            throw new api_error_1.ApiError(404, "Invoice not found");
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
exports.InvoiceController = InvoiceController;
exports.invoiceController = new InvoiceController();
