import { Document, Model, Schema, Types, model } from "mongoose";

export const NOTIFICATION_TYPES = [
  "booking_created",
  "invoice_created",
  "invoice_payment_updated",
  "manager_added",
  "booking_status_updated"
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_AUDIENCES = ["admin", "manager", "all"] as const;

export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

export const NOTIFICATION_RELATED_RESOURCE_TYPES = ["booking", "invoice", "user"] as const;

export type NotificationRelatedResourceType =
  (typeof NOTIFICATION_RELATED_RESOURCE_TYPES)[number];

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  audience: NotificationAudience;
  isReadBy: Types.ObjectId[];
  createdByUserId?: Types.ObjectId;
  relatedResourceType?: NotificationRelatedResourceType;
  relatedResourceId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    href: { type: String, trim: true },
    audience: {
      type: String,
      enum: NOTIFICATION_AUDIENCES,
      required: true
    },
    isReadBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: []
    },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    relatedResourceType: {
      type: String,
      enum: NOTIFICATION_RELATED_RESOURCE_TYPES
    },
    relatedResourceId: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isReadBy: 1 });
notificationSchema.index({ relatedResourceType: 1, relatedResourceId: 1 });

export const Notification: Model<INotification> = model<INotification>(
  "Notification",
  notificationSchema
);
