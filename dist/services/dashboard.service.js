"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDashboard = exports.getDashboardOverview = void 0;
const booking_request_model_1 = require("../models/booking-request.model");
const invoice_model_1 = require("../models/invoice.model");
const notification_model_1 = require("../models/notification.model");
const user_model_1 = require("../models/user.model");
const CLEANING_TYPES = [
    "regular_residential",
    "commercial",
    "airbnb_rental",
    "deep_cleaning",
    "decluttering"
];
const createCountBucket = (keys) => {
    return keys.reduce((bucket, key) => {
        bucket[key] = 0;
        return bucket;
    }, {});
};
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
const createRegex = (value) => {
    return new RegExp(escapeRegex(value), "i");
};
const startOfUtcDay = (date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};
const formatDateKey = (date) => {
    return date.toISOString().slice(0, 10);
};
const createLast30DayKeys = () => {
    const today = startOfUtcDay(new Date());
    return Array.from({ length: 30 }, (_, index) => {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() - (29 - index));
        return formatDateKey(date);
    });
};
const joinSubtitleParts = (parts) => {
    return parts.filter(Boolean).join(" · ");
};
const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency
    }).format(amount);
};
const bookingStatusLabels = {
    new: "Nouveau",
    reviewed: "Revu",
    contacted: "Contacté",
    scheduled: "Planifié",
    cancelled: "Annulé",
    completed: "Terminé"
};
const invoicePaymentStatusLabels = {
    unpaid: "Non payée",
    partial: "Partielle",
    paid: "Payée"
};
const userRoleLabels = {
    admin: "Admin",
    manager: "Manager"
};
const createBookingActivity = (booking) => {
    const clientName = [booking.firstName, booking.lastName].filter(Boolean).join(" ");
    return {
        type: "booking_created",
        title: "Nouvelle demande reçue",
        message: `Demande ${booking.requestNumber ?? booking._id.toString()} créée pour ${clientName}`,
        href: `/purement-console/bookings/${booking._id.toString()}`,
        createdAt: booking.createdAt
    };
};
const createInvoiceActivity = (invoice) => ({
    type: "invoice_created",
    title: "Facture créée",
    message: `Facture ${invoice.invoiceNumber} créée pour ${invoice.customerName}`,
    href: `/purement-console/invoices/${invoice._id.toString()}`,
    createdAt: invoice.createdAt
});
const getDashboardOverview = async (role) => {
    const dateKeys = createLast30DayKeys();
    const trendStartDate = new Date(`${dateKeys[0]}T00:00:00.000Z`);
    const visibleNotificationFilter = {
        audience: { $in: ["all", role] },
        ...(role === "manager" ? { type: { $ne: "manager_added" } } : {})
    };
    const [bookingAnalytics, invoiceAnalytics, userStatsCounts, recentBookings, recentInvoices, recentNotifications] = await Promise.all([
        booking_request_model_1.BookingRequest.aggregate([
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
        invoice_model_1.Invoice.aggregate([
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
            ? user_model_1.User.aggregate([
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
        booking_request_model_1.BookingRequest.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("requestNumber firstName lastName email phone cleaningType status preferredStartDate preferredEndDate createdAt")
            .lean()
            .exec(),
        invoice_model_1.Invoice.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("invoiceNumber customerName customerEmail status paymentStatus totalAmount currency createdAt")
            .lean()
            .exec(),
        notification_model_1.Notification.find(visibleNotificationFilter)
            .sort({ createdAt: -1 })
            .limit(8)
            .select("type title message href createdAt")
            .lean()
            .exec()
    ]);
    const bookingCounts = createCountBucket(booking_request_model_1.BOOKING_REQUEST_STATUSES);
    const invoiceStatusBucket = createCountBucket(invoice_model_1.INVOICE_STATUSES);
    const invoicePaymentStatusBucket = createCountBucket(invoice_model_1.INVOICE_PAYMENT_STATUSES);
    const cleaningTypeBucket = createCountBucket(CLEANING_TYPES);
    const paymentAmountBucket = createCountBucket(invoice_model_1.INVOICE_PAYMENT_STATUSES);
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
    const bookingTrendCounts = new Map(bookingAnalyticsResult.bookingTrend.map((bucket) => [bucket._id, bucket.count]));
    const invoiceTrendCounts = new Map(invoiceAnalyticsResult.invoiceTrend.map((bucket) => [
        bucket._id,
        { count: bucket.count, amount: bucket.amount }
    ]));
    const amounts = invoiceAnalyticsResult.amountSummary[0] ?? {};
    const users = role === "admin"
        ? userStatsCounts.reduce((stats, bucket) => {
            stats.total += bucket.count;
            stats[bucket._id.role === "admin" ? "admins" : "managers"] += bucket.count;
            stats[bucket._id.isActive ? "active" : "inactive"] += bucket.count;
            return stats;
        }, {
            total: 0,
            admins: 0,
            managers: 0,
            active: 0,
            inactive: 0
        })
        : null;
    const recentActivity = recentNotifications.length > 0
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
            bookingStatusDistribution: booking_request_model_1.BOOKING_REQUEST_STATUSES.map((status) => ({
                status,
                count: bookingCounts[status]
            })),
            invoicePaymentDistribution: invoice_model_1.INVOICE_PAYMENT_STATUSES.map((paymentStatus) => ({
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
exports.getDashboardOverview = getDashboardOverview;
const searchDashboard = async (query, role) => {
    const regex = createRegex(query);
    const searchFilter = (fields) => ({
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
        booking_request_model_1.BookingRequest.find(searchFilter(["requestNumber", "firstName", "lastName", "email", "phone", "city"]))
            .sort({ createdAt: -1 })
            .limit(5)
            .select("requestNumber firstName lastName email status createdAt")
            .lean()
            .exec(),
        invoice_model_1.Invoice.find(searchFilter(["invoiceNumber", "customerName", "customerEmail", "customerPhone"]))
            .sort({ createdAt: -1 })
            .limit(5)
            .select("invoiceNumber customerName totalAmount currency paymentStatus createdAt")
            .lean()
            .exec(),
        searchUsers
            ? user_model_1.User.find(userSearchFilter)
                .sort({ createdAt: -1 })
                .limit(5)
                .select("firstName lastName email role createdAt")
                .lean()
                .exec()
            : Promise.resolve([])
    ]);
    const results = [
        ...bookings.map((booking) => ({
            type: "booking",
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
            type: "invoice",
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
            type: "user",
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
exports.searchDashboard = searchDashboard;
