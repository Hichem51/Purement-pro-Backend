import { Document, Model, Schema, Types, model } from "mongoose";

export type NotificationType = "email" | "sms";

export type NotificationStatus = "pending" | "sent" | "failed";

export interface INotification extends Document {
  bookingRequestId?: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  type: NotificationType;
  recipient: string;
  subject?: string;
  status: NotificationStatus;
  provider?: string;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    bookingRequestId: { type: Schema.Types.ObjectId, ref: "BookingRequest" },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    type: { type: String, enum: ["email", "sms"], required: true },
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    provider: { type: String, trim: true },
    providerMessageId: { type: String, trim: true },
    errorMessage: { type: String, trim: true },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

notificationSchema.index({ bookingRequestId: 1 });
notificationSchema.index({ invoiceId: 1 });
notificationSchema.index({ customerId: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: 1 });

export const Notification: Model<INotification> = model<INotification>(
  "Notification",
  notificationSchema
);
