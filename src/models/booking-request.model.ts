import { Document, Model, Schema, Types, model } from "mongoose";

export type CleaningType =
  | "airbnb_cleaning"
  | "residential_cleaning"
  | "office_cleaning";

export type ContactPreference = "email" | "sms" | "phone" | "whatsapp";

export type BookingLanguage = "fr" | "en";

export type BookingRequestSource = "website" | "dashboard";

export const BOOKING_REQUEST_STATUSES = [
  "new",
  "reviewed",
  "contacted",
  "scheduled",
  "cancelled",
  "completed"
] as const;

export type BookingRequestStatus = (typeof BOOKING_REQUEST_STATUSES)[number];

export interface IBookingPhoto {
  url: string;
  secureUrl?: string;
  publicId?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface IBookingPhone {
  number: string;
  smsOptIn: boolean;
}

export interface IBookingRequest extends Document {
  customerId?: Types.ObjectId;
  requestNumber?: string;
  source: BookingRequestSource;
  firstName: string;
  lastName: string;
  email: string;
  phone: IBookingPhone;
  streetAddress: string;
  city: string;
  provinceState: string;
  postalCode: string;
  country: string;
  propertyType: string;
  cleaningType: CleaningType;
  roomsOffices: number;
  bathrooms: number;
  levels: number;
  propertyDescription?: string;
  useEcoProducts: boolean;
  preferredStartDate: Date;
  preferredEndDate?: Date;
  preferredTime: string;
  frequency: string;
  contactPreference: ContactPreference;
  referralSource?: string;
  bookingSmsConsent: boolean;
  marketingEmailConsent: boolean;
  language: BookingLanguage;
  photos: IBookingPhoto[];
  status: BookingRequestStatus;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingPhotoSchema = new Schema<IBookingPhoto>(
  {
    url: { type: String, required: true, trim: true },
    secureUrl: { type: String, trim: true },
    publicId: { type: String, trim: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number }
  },
  { _id: false }
);

const bookingPhoneSchema = new Schema<IBookingPhone>(
  {
    number: { type: String, required: true, trim: true },
    smsOptIn: { type: Boolean, default: false }
  },
  { _id: false }
);

const bookingRequestSchema = new Schema<IBookingRequest>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    requestNumber: { type: String, required: true, unique: true, sparse: true, trim: true },
    source: { type: String, enum: ["website", "dashboard"], default: "website" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: bookingPhoneSchema, required: true },
    streetAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    provinceState: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: "Canada", trim: true },
    propertyType: { type: String, required: true, trim: true },
    cleaningType: {
      type: String,
      enum: ["airbnb_cleaning", "residential_cleaning", "office_cleaning"],
      required: true
    },
    roomsOffices: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    levels: { type: Number, required: true },
    propertyDescription: { type: String, trim: true },
    useEcoProducts: { type: Boolean, default: false },
    preferredStartDate: { type: Date, required: true },
    preferredEndDate: { type: Date },
    preferredTime: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    contactPreference: { type: String, enum: ["email", "sms", "phone", "whatsapp"], required: true },
    referralSource: { type: String, trim: true },
    bookingSmsConsent: { type: Boolean, default: false },
    marketingEmailConsent: { type: Boolean, default: false },
    language: { type: String, enum: ["fr", "en"], default: "fr" },
    photos: { type: [bookingPhotoSchema], default: [] },
    status: {
      type: String,
      enum: BOOKING_REQUEST_STATUSES,
      default: "new"
    },
    internalNotes: { type: String, trim: true }
  },
  { timestamps: true }
);

bookingRequestSchema.index({ email: 1 });
bookingRequestSchema.index({ "phone.number": 1 });
bookingRequestSchema.index({ status: 1 });
bookingRequestSchema.index({ preferredStartDate: 1 });
bookingRequestSchema.index({ createdAt: 1 });

export const BookingRequest: Model<IBookingRequest> = model<IBookingRequest>(
  "BookingRequest",
  bookingRequestSchema
);
