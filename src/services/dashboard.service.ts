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
import { User, UserRole } from "../models/user.model";

type CountBucket<T extends string> = Record<T, number>;

type DashboardSearchResultType = "booking" | "invoice" | "user";

export interface DashboardSearchResult {
  type: DashboardSearchResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  meta: string;
  createdAt?: Date;
}

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

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createRegex = (value: string): RegExp => {
  return new RegExp(escapeRegex(value), "i");
};

const joinSubtitleParts = (parts: Array<string | undefined>): string => {
  return parts.filter(Boolean).join(" · ");
};

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency
  }).format(amount);
};

const bookingStatusLabels: Record<BookingRequestStatus, string> = {
  new: "Nouveau",
  reviewed: "Revu",
  contacted: "Contacté",
  scheduled: "Planifié",
  cancelled: "Annulé",
  completed: "Terminé"
};

const invoicePaymentStatusLabels: Record<InvoicePaymentStatus, string> = {
  unpaid: "Non payée",
  partial: "Partielle",
  paid: "Payée"
};

const userRoleLabels: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager"
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

export const searchDashboard = async (
  query: string,
  role: UserRole
): Promise<{ results: Omit<DashboardSearchResult, "createdAt">[] }> => {
  const regex = createRegex(query);
  const searchFilter = (fields: string[]) => ({
    $or: fields.map((field) => ({ [field]: regex }))
  });

  const searchUsers = role === "admin";
  const queryParts = query.split(/\s+/).filter(Boolean);
  const userNamePartFilters = queryParts.map((part) => {
    const partRegex = createRegex(part);

    return {
      $or: [{ firstName: partRegex }, { lastName: partRegex }]
    };
  });
  const userSearchFilter = {
    $or: [
      ...searchFilter(["firstName", "lastName", "email", "role"]).$or,
      {
        $and: userNamePartFilters
      }
    ]
  };

  const [bookings, invoices, users] = await Promise.all([
    BookingRequest.find(searchFilter(["requestNumber", "firstName", "lastName", "email", "phone", "city"]))
      .sort({ createdAt: -1 })
      .limit(5)
      .select("requestNumber firstName lastName email status createdAt")
      .lean()
      .exec(),
    Invoice.find(searchFilter(["invoiceNumber", "customerName", "customerEmail", "customerPhone"]))
      .sort({ createdAt: -1 })
      .limit(5)
      .select("invoiceNumber customerName totalAmount currency paymentStatus createdAt")
      .lean()
      .exec(),
    searchUsers
      ? User.find(userSearchFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .select("firstName lastName email role createdAt")
          .lean()
          .exec()
      : Promise.resolve([])
  ]);

  const results: DashboardSearchResult[] = [
    ...bookings.map((booking) => ({
      type: "booking" as const,
      id: booking._id.toString(),
      title: booking.requestNumber ?? "Demande",
      subtitle: joinSubtitleParts([
        [booking.firstName, booking.lastName].filter(Boolean).join(" "),
        booking.email
      ]),
      href: `/purement-console/bookings/${booking._id.toString()}`,
      meta: bookingStatusLabels[booking.status],
      createdAt: booking.createdAt
    })),
    ...invoices.map((invoice) => ({
      type: "invoice" as const,
      id: invoice._id.toString(),
      title: invoice.invoiceNumber,
      subtitle: joinSubtitleParts([
        invoice.customerName,
        formatCurrency(invoice.totalAmount, invoice.currency)
      ]),
      href: `/purement-console/invoices/${invoice._id.toString()}`,
      meta: invoicePaymentStatusLabels[invoice.paymentStatus],
      createdAt: invoice.createdAt
    })),
    ...users.map((user) => ({
      type: "user" as const,
      id: user._id.toString(),
      title: [user.firstName, user.lastName].filter(Boolean).join(" "),
      subtitle: user.email,
      href: "/purement-console/users",
      meta: userRoleLabels[user.role],
      createdAt: user.createdAt
    }))
  ];

  return {
    results: results
      .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0))
      .slice(0, 8)
      .map(({ createdAt: _createdAt, ...result }) => result)
  };
};
