"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = void 0;
const booking_request_model_1 = require("../models/booking-request.model");
const invoice_model_1 = require("../models/invoice.model");
const createCountBucket = (keys) => {
    return keys.reduce((bucket, key) => {
        bucket[key] = 0;
        return bucket;
    }, {});
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
