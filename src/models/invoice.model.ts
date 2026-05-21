import { Document, Model, Schema, Types, model } from "mongoose";

export const INVOICE_STATUSES = ["draft", "sent", "cancelled"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;

export type InvoicePaymentStatus = (typeof INVOICE_PAYMENT_STATUSES)[number];

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IInvoice extends Document {
  bookingRequestId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  createdByUserId?: Types.ObjectId;
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  items: IInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  issuedAt?: Date;
  dueAt?: Date;
  sentAt?: Date;
  notes?: string;
  pdfUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true }
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    bookingRequestId: { type: Schema.Types.ObjectId, ref: "BookingRequest" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: INVOICE_STATUSES, default: "draft" },
    paymentStatus: { type: String, enum: INVOICE_PAYMENT_STATUSES, default: "unpaid" },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, trim: true },
    billingAddress: { type: String, trim: true },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "CAD", trim: true },
    issuedAt: { type: Date },
    dueAt: { type: Date },
    sentAt: { type: Date },
    notes: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

invoiceSchema.index({ status: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ customerEmail: 1 });
invoiceSchema.index({ createdAt: 1 });

export const Invoice: Model<IInvoice> = model<IInvoice>("Invoice", invoiceSchema);
