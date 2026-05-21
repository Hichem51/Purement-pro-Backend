import { Document, Model, Schema, model } from "mongoose";

export interface ICustomer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  marketingEmailConsent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    marketingEmailConsent: { type: Boolean, default: false },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });

export const Customer: Model<ICustomer> = model<ICustomer>("Customer", customerSchema);
