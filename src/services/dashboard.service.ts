import { Types } from "mongoose";

import {
  BOOKING_REQUEST_STATUSES,
  BookingRequest,
  BookingRequestStatus,
  CleaningType,
  IBookingPhone
} from "../models/booking-request.model";
import {
  INVOICE_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  Invoice,
  InvoicePaymentStatus,
  InvoiceStatus
} from "../models/invoice.model";
import { Notification, NotificationType } from "../models/notification.model";
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

interface InvoicePaymentDistributionCount {
  _id: InvoicePaymentStatus;
  count: number;
  amount: number;
}

interface InvoiceAmountSummary {
  totalAmount?: number;
  paidAmount?: number;
  unpaidAmount?: number;
}

interface TrendCount {
  _id: string;
  count: number;
}

interface InvoiceTrendCount extends TrendCount {
  amount: number;
}

interface CleaningTypeCount {
  _id: CleaningType;
  count: number;
}

interface UserStatsCount {
  _id: {
    role: UserRole;
    isActive: boolean;
  };
  count: number;
}

interface ActivityItem {
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  createdAt: Date;
}

interface RecentBookingResult {
  _id: Types.ObjectId;
  requestNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: IBookingPhone;
  cleaningType: CleaningType;
  status: BookingRequestStatus;
  preferredStartDate: Date;
  preferredEndDate?: Date;
  createdAt: Date;
}

interface RecentInvoiceResult {
  _id: Types.ObjectId;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
}

const CLEANING_TYPES: readonly CleaningType[] = [
  "regular_residential_cleaning",
  "commercial_cleaning",
  "airbnb_rental_cleaning",
  "deep_cleaning",
  "decluttering_cleaning"
];

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

const startOfUtcDay = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const formatDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const createLast30DayKeys = (): string[] => {
  const today = startOfUtcDay(new Date());

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (29 - index));

    return formatDateKey(date);
  });
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

const createBookingActivity = (booking: RecentBookingResult): ActivityItem => {
  const clientName = [booking.firstName, booking.lastName].filter(Boolean).join(" ");

  return {
    type: "booking_created",
    title: "Nouvelle demande reçue",
    message: `Demande ${booking.requestNumber ?? booking._id.toString()} créée pour ${clientName}`,
    href: `/purement-console/bookings/${booking._id.toString()}`,
    createdAt: booking.createdAt
  };
};

const createInvoiceActivity = (invoice: RecentInvoiceResult): ActivityItem => ({
  type: "invoice_created",
  title: "Facture créée",
  message: `Facture ${invoice.invoiceNumber} créée pour ${invoice.customerName}`,
  href: `/purement-console/invoices/${invoice._id.toString()}`,
  createdAt: invoice.createdAt
});

export const getDashboardOverview = async (role: UserRole) => {
  const dateKeys = createLast30DayKeys();
  const trendStartDate = new Date(`${dateKeys[0]}T00:00:00.000Z`);
  const visibleNotificationFilter = {
    audience: { $in: ["all", role] },
    ...(role === "manager" ? { type: { $ne: "manager_added" } } : {})
  };

  const [
    bookingAnalytics,
    invoiceAnalytics,
    userStatsCounts,
    recentBookings,
    recentInvoices,
    recentNotifications
  ] = await Promise.all([
    BookingRequest.aggregate<{
      total: { count: number }[];
      statusCounts: BookingStatusCount[];
      bookingTrend: TrendCount[];
      cleaningTypeCounts: CleaningTypeCount[];
    }>([
      {
        $facet: {
          total: [{ $count: "count" }],
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          bookingTrend: [
            {
              $match: {
                createdAt: { $gte: trendStartDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: "UTC"
                  }
                },
                count: { $sum: 1 }
              }
            }
          ],
          cleaningTypeCounts: [
            {
              $group: {
                _id: "$cleaningType",
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]).exec(),
    Invoice.aggregate<{
      total: { count: number }[];
      statusCounts: InvoiceStatusCount[];
      paymentStatusCounts: InvoicePaymentDistributionCount[];
      amountSummary: InvoiceAmountSummary[];
      invoiceTrend: InvoiceTrendCount[];
    }>([
      {
        $facet: {
          total: [{ $count: "count" }],
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          paymentStatusCounts: [
            {
              $group: {
                _id: "$paymentStatus",
                count: { $sum: 1 },
                amount: { $sum: "$totalAmount" }
              }
            }
          ],
          amountSummary: [
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
          ],
          invoiceTrend: [
            {
              $match: {
                createdAt: { $gte: trendStartDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: "UTC"
                  }
                },
                count: { $sum: 1 },
                amount: { $sum: "$totalAmount" }
              }
            }
          ]
        }
      }
    ]).exec(),
    role === "admin"
      ? User.aggregate<UserStatsCount>([
          {
            $group: {
              _id: {
                role: "$role",
                isActive: "$isActive"
              },
              count: { $sum: 1 }
            }
          }
        ]).exec()
      : Promise.resolve([]),
    BookingRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "requestNumber firstName lastName email phone cleaningType status preferredStartDate preferredEndDate createdAt"
      )
      .lean<RecentBookingResult[]>()
      .exec(),
    Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("invoiceNumber customerName customerEmail status paymentStatus totalAmount currency createdAt")
      .lean<RecentInvoiceResult[]>()
      .exec(),
    Notification.find(visibleNotificationFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .select("type title message href createdAt")
      .lean<Array<ActivityItem & { _id: Types.ObjectId }>>()
      .exec()
  ]);

  const bookingCounts = createCountBucket(BOOKING_REQUEST_STATUSES);
  const invoiceStatusBucket = createCountBucket(INVOICE_STATUSES);
  const invoicePaymentStatusBucket = createCountBucket(INVOICE_PAYMENT_STATUSES);
  const cleaningTypeBucket = createCountBucket(CLEANING_TYPES);
  const paymentAmountBucket = createCountBucket(INVOICE_PAYMENT_STATUSES);
  const bookingAnalyticsResult = bookingAnalytics[0];
  const invoiceAnalyticsResult = invoiceAnalytics[0];

  bookingAnalyticsResult.statusCounts.forEach(({ _id, count }) => {
    bookingCounts[_id] = count;
  });

  invoiceAnalyticsResult.statusCounts.forEach(({ _id, count }) => {
    invoiceStatusBucket[_id] = count;
  });

  invoiceAnalyticsResult.paymentStatusCounts.forEach(({ _id, count, amount }) => {
    invoicePaymentStatusBucket[_id] = count;
    paymentAmountBucket[_id] = amount;
  });

  bookingAnalyticsResult.cleaningTypeCounts.forEach(({ _id, count }) => {
    cleaningTypeBucket[_id] = count;
  });

  const bookingTrendCounts = new Map(
    bookingAnalyticsResult.bookingTrend.map((bucket) => [bucket._id, bucket.count])
  );
  const invoiceTrendCounts = new Map(
    invoiceAnalyticsResult.invoiceTrend.map((bucket) => [
      bucket._id,
      { count: bucket.count, amount: bucket.amount }
    ])
  );
  const amounts = invoiceAnalyticsResult.amountSummary[0] ?? {};
  const users =
    role === "admin"
      ? userStatsCounts.reduce(
          (stats, bucket) => {
            stats.total += bucket.count;
            stats[bucket._id.role === "admin" ? "admins" : "managers"] += bucket.count;
            stats[bucket._id.isActive ? "active" : "inactive"] += bucket.count;

            return stats;
          },
          {
            total: 0,
            admins: 0,
            managers: 0,
            active: 0,
            inactive: 0
          }
        )
      : null;
  const recentActivity =
    recentNotifications.length > 0
      ? recentNotifications.map((notification) => ({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt
        }))
      : [...recentBookings.map(createBookingActivity), ...recentInvoices.map(createInvoiceActivity)]
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
          .slice(0, 8);

  return {
    role,
    bookings: {
      total: bookingAnalyticsResult.total[0]?.count ?? 0,
      ...bookingCounts
    },
    invoices: {
      total: invoiceAnalyticsResult.total[0]?.count ?? 0,
      ...invoiceStatusBucket,
      ...invoicePaymentStatusBucket,
      totalAmount: amounts.totalAmount ?? 0,
      paidAmount: amounts.paidAmount ?? 0,
      unpaidAmount: amounts.unpaidAmount ?? 0
    },
    users,
    charts: {
      bookingTrend: dateKeys.map((date) => ({
        date,
        count: bookingTrendCounts.get(date) ?? 0
      })),
      invoiceTrend: dateKeys.map((date) => {
        const bucket = invoiceTrendCounts.get(date);

        return {
          date,
          count: bucket?.count ?? 0,
          amount: bucket?.amount ?? 0
        };
      }),
      bookingStatusDistribution: BOOKING_REQUEST_STATUSES.map((status) => ({
        status,
        count: bookingCounts[status]
      })),
      invoicePaymentDistribution: INVOICE_PAYMENT_STATUSES.map((paymentStatus) => ({
        paymentStatus,
        count: invoicePaymentStatusBucket[paymentStatus],
        amount: paymentAmountBucket[paymentStatus]
      })),
      cleaningTypeDistribution: CLEANING_TYPES.map((cleaningType) => ({
        cleaningType,
        count: cleaningTypeBucket[cleaningType]
      }))
    },
    recentBookings: recentBookings.map((booking) => ({
      id: booking._id.toString(),
      requestNumber: booking.requestNumber,
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
    })),
    recentActivity
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
    BookingRequest.find(
      searchFilter(["requestNumber", "firstName", "lastName", "email", "phone", "phone.number", "city"])
    )
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
