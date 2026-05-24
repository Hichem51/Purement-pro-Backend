import { FilterQuery, Types } from "mongoose";

import {
  IInvoice,
  IInvoiceItem,
  Invoice,
  InvoicePaymentStatus,
  InvoiceStatus
} from "../models/invoice.model";
import { createNotificationSafely } from "./notification.service";

export interface ManualInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  bookingRequestId?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  items: ManualInvoiceItemInput[];
  taxAmount?: number;
  discountAmount?: number;
  currency?: string;
  issuedAt?: Date;
  dueAt?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdByUserId?: string;
}

export interface UpdateInvoiceInput {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  billingAddress?: string;
  items?: ManualInvoiceItemInput[];
  taxAmount?: number;
  discountAmount?: number;
  currency?: string;
  issuedAt?: Date;
  dueAt?: Date;
  notes?: string;
}

export interface ListInvoicesInput {
  page: number;
  limit: number;
  status?: InvoiceStatus;
  paymentStatus?: InvoicePaymentStatus;
  search?: string;
  sort: "newest" | "oldest";
}

export interface PaginatedInvoices {
  items: IInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const roundMoney = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const calculateInvoiceTotals = (
  items: ManualInvoiceItemInput[],
  taxAmount = 0,
  discountAmount = 0
): Pick<IInvoice, "items" | "subtotal" | "taxAmount" | "discountAmount" | "totalAmount"> => {
  const calculatedItems: IInvoiceItem[] = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: roundMoney(item.quantity * item.unitPrice)
  }));

  const subtotal = roundMoney(
    calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  );
  const normalizedTaxAmount = roundMoney(taxAmount);
  const normalizedDiscountAmount = roundMoney(discountAmount);
  const totalAmount = roundMoney(subtotal + normalizedTaxAmount - normalizedDiscountAmount);

  return {
    items: calculatedItems,
    subtotal,
    taxAmount: normalizedTaxAmount,
    discountAmount: normalizedDiscountAmount,
    totalAmount
  };
};

const generateInvoiceNumber = async (year: number): Promise<string> => {
  const prefix = `PP-${year}-`;
  const latestInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}\\d{4}$` }
  })
    .sort({ invoiceNumber: -1 })
    .select("invoiceNumber")
    .lean()
    .exec();

  const latestSequence = latestInvoice?.invoiceNumber
    ? Number.parseInt(latestInvoice.invoiceNumber.replace(prefix, ""), 10)
    : 0;
  const nextSequence = latestSequence + 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

const invoicePaymentStatusLabels: Record<InvoicePaymentStatus, string> = {
  unpaid: "non payée",
  partial: "partiellement payée",
  paid: "payée"
};

export const createInvoice = async (input: CreateInvoiceInput): Promise<IInvoice> => {
  const issuedAt = input.issuedAt ?? new Date();
  const year = issuedAt.getFullYear();
  const totals = calculateInvoiceTotals(input.items, input.taxAmount, input.discountAmount);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const invoiceNumber = await generateInvoiceNumber(year);

    try {
      const invoice = new Invoice({
        bookingRequestId: input.bookingRequestId
          ? new Types.ObjectId(input.bookingRequestId)
          : undefined,
        customerId: input.customerId ? new Types.ObjectId(input.customerId) : undefined,
        createdByUserId: input.createdByUserId
          ? new Types.ObjectId(input.createdByUserId)
          : undefined,
        invoiceNumber,
        status: "draft",
        paymentStatus: "unpaid",
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        billingAddress: input.billingAddress,
        currency: input.currency ?? "CAD",
        issuedAt,
        dueAt: input.dueAt,
        notes: input.notes,
        metadata: input.metadata,
        ...totals
      });

      const savedInvoice = await invoice.save();

      await createNotificationSafely({
        type: "invoice_created",
        title: "Facture créée",
        message: `Facture ${savedInvoice.invoiceNumber} créée pour ${savedInvoice.customerName}`,
        href: `/purement-console/invoices/${savedInvoice.id}`,
        audience: "all",
        createdByUserId: input.createdByUserId,
        relatedResourceType: "invoice",
        relatedResourceId: savedInvoice.id
      });

      return savedInvoice;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000 &&
        attempt < 2
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to generate a unique invoice number");
};

export const listInvoices = async (input: ListInvoicesInput): Promise<PaginatedInvoices> => {
  const { page, limit, status, paymentStatus, search, sort } = input;
  const filter: FilterQuery<IInvoice> = {};

  if (status) {
    filter.status = status;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { invoiceNumber: searchRegex },
      { customerName: searchRegex },
      { customerEmail: searchRegex },
      { customerPhone: searchRegex }
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sort === "oldest" ? 1 : -1;

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: sortDirection }).skip(skip).limit(limit).exec(),
    Invoice.countDocuments(filter).exec()
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getInvoiceById = async (id: string): Promise<IInvoice | null> => {
  return Invoice.findById(new Types.ObjectId(id)).exec();
};

export const updateInvoice = async (
  id: string,
  input: UpdateInvoiceInput
): Promise<IInvoice | null> => {
  const existingInvoice = await Invoice.findById(new Types.ObjectId(id)).exec();

  if (!existingInvoice) {
    return null;
  }

  const nextItems = input.items ?? existingInvoice.items;
  const nextTaxAmount = input.taxAmount ?? existingInvoice.taxAmount;
  const nextDiscountAmount = input.discountAmount ?? existingInvoice.discountAmount;
  const totals = calculateInvoiceTotals(nextItems, nextTaxAmount, nextDiscountAmount);
  const editableUpdates: UpdateInvoiceInput = {};

  if (input.customerName !== undefined) {
    editableUpdates.customerName = input.customerName;
  }

  if (input.customerEmail !== undefined) {
    editableUpdates.customerEmail = input.customerEmail;
  }

  if (input.customerPhone !== undefined) {
    editableUpdates.customerPhone = input.customerPhone;
  }

  if (input.billingAddress !== undefined) {
    editableUpdates.billingAddress = input.billingAddress;
  }

  if (input.currency !== undefined) {
    editableUpdates.currency = input.currency;
  }

  if (input.issuedAt !== undefined) {
    editableUpdates.issuedAt = input.issuedAt;
  }

  if (input.dueAt !== undefined) {
    editableUpdates.dueAt = input.dueAt;
  }

  if (input.notes !== undefined) {
    editableUpdates.notes = input.notes;
  }

  existingInvoice.set({
    ...editableUpdates,
    ...totals
  });

  return existingInvoice.save();
};

export const updateInvoiceStatus = async (
  id: string,
  status: InvoiceStatus
): Promise<IInvoice | null> => {
  const update: { status: InvoiceStatus; sentAt?: Date } = { status };

  if (status === "sent") {
    const existingInvoice = await Invoice.findById(new Types.ObjectId(id)).select("sentAt").exec();

    if (!existingInvoice) {
      return null;
    }

    if (!existingInvoice.sentAt) {
      update.sentAt = new Date();
    }
  }

  return Invoice.findByIdAndUpdate(new Types.ObjectId(id), update, {
    new: true,
    runValidators: true
  }).exec();
};

export const updateInvoicePaymentStatus = async (
  id: string,
  paymentStatus: InvoicePaymentStatus,
  updatedByUserId?: string
): Promise<IInvoice | null> => {
  const invoice = await Invoice.findByIdAndUpdate(
    new Types.ObjectId(id),
    { paymentStatus },
    { new: true, runValidators: true }
  ).exec();

  if (invoice) {
    await createNotificationSafely({
      type: "invoice_payment_updated",
      title: "Statut de paiement mis à jour",
      message: `Facture ${invoice.invoiceNumber} marquée comme ${invoicePaymentStatusLabels[invoice.paymentStatus]}`,
      href: `/purement-console/invoices/${invoice.id}`,
      audience: "all",
      createdByUserId: updatedByUserId,
      relatedResourceType: "invoice",
      relatedResourceId: invoice.id
    });
  }

  return invoice;
};

export const cancelInvoice = async (id: string): Promise<IInvoice | null> => {
  return Invoice.findByIdAndUpdate(
    new Types.ObjectId(id),
    { status: "cancelled" },
    { new: true, runValidators: true }
  ).exec();
};
