import { FilterQuery, Types } from "mongoose";

import {
  BookingLanguage,
  BookingRequest,
  BookingRequestStatus,
  CleaningType,
  ContactPreference,
  IBookingPhoto,
  IBookingRequest
} from "../models/booking-request.model";

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
  propertyDescription: string;
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

export const createBookingRequest = async (
  input: CreateBookingRequestInput
): Promise<IBookingRequest> => {
  const bookingRequest = new BookingRequest(input);
  return bookingRequest.save();
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
