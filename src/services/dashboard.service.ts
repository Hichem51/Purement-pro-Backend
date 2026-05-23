import {
  BOOKING_REQUEST_STATUSES,
  BookingRequest,
  BookingRequestStatus
} from "../models/booking-request.model";
import {
  INVOICE_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  Invoice,
  InvoicePaymentStatus,
  InvoiceStatus
} from "../models/invoice.model";

type CountBucket<T extends string> = Record<T, number>;

interface BookingStatusCount {
  _id: BookingRequestStatus;
  count: number;
}

interface InvoiceStatusCount {
  _id: InvoiceStatus;
  count: number;
}

interface InvoicePaymentStatusCount {
  _id: InvoicePaymentStatus;
  count: number;
}

interface InvoiceAmountSummary {
  totalAmount?: number;
  paidAmount?: number;
  unpaidAmount?: number;
}

const createCountBucket = <T extends string>(keys: readonly T[]): CountBucket<T> => {
  return keys.reduce((bucket, key) => {
    bucket[key] = 0;
    return bucket;
  }, {} as CountBucket<T>);
};

export const getDashboardOverview = async () => {
  const [
    totalBookings,
    bookingStatusCounts,
    totalInvoices,
    invoiceStatusCounts,
    invoicePaymentStatusCounts,
    invoiceAmountSummary,
    recentBookings,
    recentInvoices
  ] = await Promise.all([
    BookingRequest.countDocuments().exec(),
    BookingRequest.aggregate<BookingStatusCount>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).exec(),
    Invoice.countDocuments().exec(),
    Invoice.aggregate<InvoiceStatusCount>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).exec(),
    Invoice.aggregate<InvoicePaymentStatusCount>([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 }
        }
      }
    ]).exec(),
    Invoice.aggregate<InvoiceAmountSummary>([
      {
        $match: {
          status: { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0]
            }
          },
          unpaidAmount: {
            $sum: {
              $cond: [{ $in: ["$paymentStatus", ["unpaid", "partial"]] }, "$totalAmount", 0]
            }
          }
        }
      }
    ]).exec(),
    BookingRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "firstName lastName email phone cleaningType status preferredStartDate preferredEndDate createdAt"
      )
      .lean()
      .exec(),
    Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("invoiceNumber customerName customerEmail status paymentStatus totalAmount currency createdAt")
      .lean()
      .exec()
  ]);

  const bookingCounts = createCountBucket(BOOKING_REQUEST_STATUSES);
  const invoiceStatusBucket = createCountBucket(INVOICE_STATUSES);
  const invoicePaymentStatusBucket = createCountBucket(INVOICE_PAYMENT_STATUSES);

  bookingStatusCounts.forEach(({ _id, count }) => {
    bookingCounts[_id] = count;
  });

  invoiceStatusCounts.forEach(({ _id, count }) => {
    invoiceStatusBucket[_id] = count;
  });

  invoicePaymentStatusCounts.forEach(({ _id, count }) => {
    invoicePaymentStatusBucket[_id] = count;
  });

  const amounts = invoiceAmountSummary[0] ?? {};

  return {
    bookings: {
      total: totalBookings,
      ...bookingCounts
    },
    invoices: {
      total: totalInvoices,
      ...invoiceStatusBucket,
      ...invoicePaymentStatusBucket,
      totalAmount: amounts.totalAmount ?? 0,
      paidAmount: amounts.paidAmount ?? 0,
      unpaidAmount: amounts.unpaidAmount ?? 0
    },
    recentBookings: recentBookings.map((booking) => ({
      id: booking._id.toString(),
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phone: booking.phone,
      cleaningType: booking.cleaningType,
      status: booking.status,
      preferredStartDate: booking.preferredStartDate,
      preferredEndDate: booking.preferredEndDate,
      createdAt: booking.createdAt
    })),
    recentInvoices: recentInvoices.map((invoice) => ({
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      createdAt: invoice.createdAt
    }))
  };
};
