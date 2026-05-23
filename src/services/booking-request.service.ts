import { FilterQuery, Types } from "mongoose";

import {
  BookingLanguage,
  BookingRequest,
  BookingRequestSource,
  BookingRequestStatus,
  CleaningType,
  ContactPreference,
  IBookingPhoto,
  IBookingRequest
} from "../models/booking-request.model";
import { ApiError } from "../utils/api-error";

export interface CreateBookingRequestInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  bookingSmsConsent?: boolean;
  marketingEmailConsent?: boolean;
  language?: BookingLanguage;
  photos?: IBookingPhoto[];
  internalNotes?: string;
  source?: BookingRequestSource;
}

export interface ListBookingRequestsInput {
  page: number;
  limit: number;
  status?: BookingRequestStatus;
  search?: string;
  sort: "newest" | "oldest";
}

export interface UpdateBookingRequestPhotosInput {
  photos: IBookingPhoto[];
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

export const createBookingRequest = async (
  input: CreateBookingRequestInput
): Promise<IBookingRequest> => {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const requestNumber = await generateRequestNumber(year);

    try {
      const bookingRequest = new BookingRequest({
        ...input,
        requestNumber,
        source: input.source ?? "website"
      });

      return await bookingRequest.save();
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

export const updateBookingRequestStatus = async (
  id: string,
  status: BookingRequestStatus
): Promise<IBookingRequest | null> => {
  return BookingRequest.findByIdAndUpdate(
    new Types.ObjectId(id),
    { status },
    { new: true, runValidators: true }
  ).exec();
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
