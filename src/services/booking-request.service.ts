import { FilterQuery, Types } from "mongoose";

import {
  BookingLanguage,
  BookingRequest,
  BookingRequestSource,
  BookingRequestStatus,
  CleaningType,
  ContactPreference,
  IBookingPhone,
  IBookingRequest
} from "../models/booking-request.model";
import { createNotificationSafely } from "./notification.service";
import { ApiError } from "../utils/api-error";

export interface CreateBookingRequestInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: IBookingPhone;
  streetAddress: string;
  city: string;
  provinceState: string;
  postalCode: string;
  country?: string;
  propertyType: string;
  cleaningType: CleaningType;
  roomsOffices: number;
  bathrooms: number;
  levels: number;
  propertyDescription?: string;
  useEcoProducts?: boolean;
  preferredStartDate: Date;
  preferredEndDate?: Date;
  preferredTime: string;
  frequency: string;
  contactPreference: ContactPreference;
  referralSource?: string;
  marketingEmailConsent?: boolean;
  language?: BookingLanguage;
  photos?: string[];
  internalNotes?: string;
  source?: BookingRequestSource;
  createdByUserId?: string;
}

export interface ListBookingRequestsInput {
  page: number;
  limit: number;
  status?: BookingRequestStatus;
  search?: string;
  sort: "newest" | "oldest";
}

export interface UpdateBookingRequestInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: IBookingPhone;
  streetAddress?: string;
  city?: string;
  provinceState?: string;
  postalCode?: string;
  country?: string;
  propertyType?: string;
  cleaningType?: CleaningType;
  roomsOffices?: number;
  bathrooms?: number;
  levels?: number;
  propertyDescription?: string;
  useEcoProducts?: boolean;
  preferredStartDate?: Date;
  preferredEndDate?: Date;
  preferredTime?: string;
  frequency?: string;
  contactPreference?: ContactPreference;
  referralSource?: string;
  marketingEmailConsent?: boolean;
  language?: BookingLanguage;
}

export interface UpdateBookingRequestPhotosInput {
  photos: string[];
}

export interface PaginatedBookingRequests {
  items: IBookingRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
};

const generateRequestNumber = async (year: number): Promise<string> => {
  const prefix = `PP-DMD-${year}-`;
  const latestBookingRequest = await BookingRequest.findOne({
    requestNumber: { $regex: `^${prefix}\\d{4}$` }
  })
    .sort({ requestNumber: -1 })
    .select("requestNumber")
    .lean()
    .exec();

  const latestSequence = latestBookingRequest?.requestNumber
    ? Number.parseInt(latestBookingRequest.requestNumber.replace(prefix, ""), 10)
    : 0;
  const nextSequence = latestSequence + 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

const bookingStatusLabels: Record<BookingRequestStatus, string> = {
  new: "Nouveau",
  reviewed: "Revu",
  contacted: "Contacté",
  scheduled: "Planifié",
  cancelled: "Annulé",
  completed: "Terminé"
};

export const createBookingRequest = async (
  input: CreateBookingRequestInput
): Promise<IBookingRequest> => {
  const year = new Date().getFullYear();
  const { createdByUserId, ...bookingInput } = input;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const requestNumber = await generateRequestNumber(year);

    try {
      const bookingRequest = new BookingRequest({
        ...bookingInput,
        requestNumber,
        source: bookingInput.source ?? "website"
      });

      const savedBookingRequest = await bookingRequest.save();
      const clientName = `${savedBookingRequest.firstName} ${savedBookingRequest.lastName}`.trim();
      const wasCreatedManually = savedBookingRequest.source === "dashboard";

      await createNotificationSafely({
        type: "booking_created",
        title: "Nouvelle demande reçue",
        message: wasCreatedManually
          ? `Demande ${savedBookingRequest.requestNumber} créée manuellement pour ${clientName}`
          : `Demande ${savedBookingRequest.requestNumber} créée pour ${clientName}`,
        href: `/purement-console/bookings/${savedBookingRequest.id}`,
        audience: "all",
        createdByUserId,
        relatedResourceType: "booking",
        relatedResourceId: savedBookingRequest.id
      });

      return savedBookingRequest;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new ApiError(500, "Unable to generate a unique booking request number");
};

export const listBookingRequests = async (
  input: ListBookingRequestsInput
): Promise<PaginatedBookingRequests> => {
  const { page, limit, status, search, sort } = input;
  const filter: FilterQuery<IBookingRequest> = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { requestNumber: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { "phone.number": searchRegex },
      { city: searchRegex }
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sort === "oldest" ? 1 : -1;

  const [items, total] = await Promise.all([
    BookingRequest.find(filter).sort({ createdAt: sortDirection }).skip(skip).limit(limit).exec(),
    BookingRequest.countDocuments(filter).exec()
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

export const getBookingRequestById = async (id: string): Promise<IBookingRequest | null> => {
  return BookingRequest.findById(new Types.ObjectId(id)).exec();
};

export const updateBookingRequest = async (
  id: string,
  input: UpdateBookingRequestInput
): Promise<IBookingRequest | null> => {
  const allowedUpdates: UpdateBookingRequestInput = {};

  if (input.firstName !== undefined) {
    allowedUpdates.firstName = input.firstName;
  }

  if (input.lastName !== undefined) {
    allowedUpdates.lastName = input.lastName;
  }

  if (input.email !== undefined) {
    allowedUpdates.email = input.email;
  }

  if (input.phone !== undefined) {
    allowedUpdates.phone = input.phone;
  }

  if (input.streetAddress !== undefined) {
    allowedUpdates.streetAddress = input.streetAddress;
  }

  if (input.city !== undefined) {
    allowedUpdates.city = input.city;
  }

  if (input.provinceState !== undefined) {
    allowedUpdates.provinceState = input.provinceState;
  }

  if (input.postalCode !== undefined) {
    allowedUpdates.postalCode = input.postalCode;
  }

  if (input.country !== undefined) {
    allowedUpdates.country = input.country;
  }

  if (input.propertyType !== undefined) {
    allowedUpdates.propertyType = input.propertyType;
  }

  if (input.cleaningType !== undefined) {
    allowedUpdates.cleaningType = input.cleaningType;
  }

  if (input.roomsOffices !== undefined) {
    allowedUpdates.roomsOffices = input.roomsOffices;
  }

  if (input.bathrooms !== undefined) {
    allowedUpdates.bathrooms = input.bathrooms;
  }

  if (input.levels !== undefined) {
    allowedUpdates.levels = input.levels;
  }

  if (input.propertyDescription !== undefined) {
    allowedUpdates.propertyDescription = input.propertyDescription;
  }

  if (input.useEcoProducts !== undefined) {
    allowedUpdates.useEcoProducts = input.useEcoProducts;
  }

  if (input.preferredStartDate !== undefined) {
    allowedUpdates.preferredStartDate = input.preferredStartDate;
  }

  if (input.preferredEndDate !== undefined) {
    allowedUpdates.preferredEndDate = input.preferredEndDate;
  }

  if (input.preferredTime !== undefined) {
    allowedUpdates.preferredTime = input.preferredTime;
  }

  if (input.frequency !== undefined) {
    allowedUpdates.frequency = input.frequency;
  }

  if (input.contactPreference !== undefined) {
    allowedUpdates.contactPreference = input.contactPreference;
  }

  if (input.referralSource !== undefined) {
    allowedUpdates.referralSource = input.referralSource;
  }

  if (input.marketingEmailConsent !== undefined) {
    allowedUpdates.marketingEmailConsent = input.marketingEmailConsent;
  }

  if (input.language !== undefined) {
    allowedUpdates.language = input.language;
  }

  return BookingRequest.findByIdAndUpdate(new Types.ObjectId(id), allowedUpdates, {
    new: true,
    runValidators: true
  }).exec();
};

export const updateBookingRequestStatus = async (
  id: string,
  status: BookingRequestStatus,
  updatedByUserId?: string
): Promise<IBookingRequest | null> => {
  const bookingRequest = await BookingRequest.findByIdAndUpdate(
    new Types.ObjectId(id),
    { status },
    { new: true, runValidators: true }
  ).exec();

  if (bookingRequest) {
    await createNotificationSafely({
      type: "booking_status_updated",
      title: "Statut de demande mis à jour",
      message: `Demande ${bookingRequest.requestNumber} marquée comme ${bookingStatusLabels[bookingRequest.status]}`,
      href: `/purement-console/bookings/${bookingRequest.id}`,
      audience: "all",
      createdByUserId: updatedByUserId,
      relatedResourceType: "booking",
      relatedResourceId: bookingRequest.id
    });
  }

  return bookingRequest;
};

export const updateBookingRequestNotes = async (
  id: string,
  internalNotes?: string | null
): Promise<IBookingRequest | null> => {
  return BookingRequest.findByIdAndUpdate(
    new Types.ObjectId(id),
    { internalNotes },
    { new: true, runValidators: true }
  ).exec();
};

export const updateBookingRequestPhotos = async (
  id: string,
  input: UpdateBookingRequestPhotosInput
): Promise<IBookingRequest | null> => {
  return BookingRequest.findByIdAndUpdate(
    new Types.ObjectId(id),
    { photos: input.photos },
    { new: true, runValidators: true }
  ).exec();
};
