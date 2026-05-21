import { Document, Model, Schema, Types, model } from "mongoose";

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "etransfer" | "other";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface IPayment extends Document {
  invoiceId: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: Date;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "CAD", trim: true },
    method: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "etransfer", "other"],
      required: true
    },
    status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    paidAt: { type: Date },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paidAt: 1 });

export const Payment: Model<IPayment> = model<IPayment>("Payment", paymentSchema);
