"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDashboard = exports.getDashboardOverview = void 0;
const booking_request_model_1 = require("../models/booking-request.model");
const invoice_model_1 = require("../models/invoice.model");
const user_model_1 = require("../models/user.model");
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
const getDashboardOverview = async () => {
    const [totalBookings, bookingStatusCounts, totalInvoices, invoiceStatusCounts, invoicePaymentStatusCounts, invoiceAmountSummary, recentBookings, recentInvoices] = await Promise.all([
        booking_request_model_1.BookingRequest.countDocuments().exec(),
        booking_request_model_1.BookingRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]).exec(),
        invoice_model_1.Invoice.countDocuments().exec(),
        invoice_model_1.Invoice.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]).exec(),
        invoice_model_1.Invoice.aggregate([
            {
                $group: {
                    _id: "$paymentStatus",
                    count: { $sum: 1 }
                }
            }
        ]).exec(),
        invoice_model_1.Invoice.aggregate([
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
        booking_request_model_1.BookingRequest.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("firstName lastName email phone cleaningType status preferredStartDate preferredEndDate createdAt")
            .lean()
            .exec(),
        invoice_model_1.Invoice.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("invoiceNumber customerName customerEmail status paymentStatus totalAmount currency createdAt")
            .lean()
            .exec()
    ]);
    const bookingCounts = createCountBucket(booking_request_model_1.BOOKING_REQUEST_STATUSES);
    const invoiceStatusBucket = createCountBucket(invoice_model_1.INVOICE_STATUSES);
    const invoicePaymentStatusBucket = createCountBucket(invoice_model_1.INVOICE_PAYMENT_STATUSES);
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
