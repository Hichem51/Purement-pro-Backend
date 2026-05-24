"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.listNotifications = exports.createNotificationSafely = exports.createNotification = void 0;
const mongoose_1 = require("mongoose");
const notification_model_1 = require("../models/notification.model");
const visibleNotificationFilter = (role) => ({
    audience: { $in: ["all", role] }
});
const toObjectId = (value) => {
    if (!value) {
        return undefined;
    }
    return typeof value === "string" ? new mongoose_1.Types.ObjectId(value) : value;
};
const toNotificationItem = (notification, userObjectId) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    href: notification.href,
    audience: notification.audience,
    isRead: notification.isReadBy.some((readByUserId) => readByUserId.equals(userObjectId)),
    createdByUserId: notification.createdByUserId?.toString(),
    relatedResourceType: notification.relatedResourceType,
    relatedResourceId: notification.relatedResourceId?.toString(),
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
});
const createNotification = async (input) => {
    return notification_model_1.Notification.create({
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href,
        audience: input.audience,
        createdByUserId: toObjectId(input.createdByUserId),
        relatedResourceType: input.relatedResourceType,
        relatedResourceId: toObjectId(input.relatedResourceId)
    });
};
exports.createNotification = createNotification;
const createNotificationSafely = async (input) => {
    try {
        await (0, exports.createNotification)(input);
    }
    catch (error) {
        console.warn("Dashboard notification creation failed", {
            type: input.type,
            audience: input.audience,
            relatedResourceType: input.relatedResourceType,
            relatedResourceId: input.relatedResourceId?.toString(),
            error: error instanceof Error ? error.message : error
        });
    }
};
exports.createNotificationSafely = createNotificationSafely;
const listNotifications = async (input) => {
    const userObjectId = new mongoose_1.Types.ObjectId(input.userId);
    const filter = visibleNotificationFilter(input.role);
    if (input.unreadOnly) {
        filter.isReadBy = { $ne: userObjectId };
    }
    const skip = (input.page - 1) * input.limit;
    const unreadFilter = {
        ...visibleNotificationFilter(input.role),
        isReadBy: { $ne: userObjectId }
    };
    const [items, total, unreadCount] = await Promise.all([
        notification_model_1.Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit).exec(),
        notification_model_1.Notification.countDocuments(filter).exec(),
        notification_model_1.Notification.countDocuments(unreadFilter).exec()
    ]);
    return {
        items: items.map((notification) => toNotificationItem(notification, userObjectId)),
        unreadCount,
        pagination: {
            page: input.page,
            limit: input.limit,
            total,
            pages: Math.ceil(total / input.limit)
        }
    };
};
exports.listNotifications = listNotifications;
const markNotificationAsRead = async (id, userId, role) => {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const notification = await notification_model_1.Notification.findOneAndUpdate({
        _id: new mongoose_1.Types.ObjectId(id),
        ...visibleNotificationFilter(role)
    }, {
        $addToSet: { isReadBy: userObjectId }
    }, {
        new: true,
        runValidators: true
    }).exec();
    return notification ? toNotificationItem(notification, userObjectId) : null;
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (userId, role) => {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const result = await notification_model_1.Notification.updateMany({
        ...visibleNotificationFilter(role),
        isReadBy: { $ne: userObjectId }
    }, {
        $addToSet: { isReadBy: userObjectId }
    }).exec();
    return {
        modifiedCount: result.modifiedCount
    };
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
