"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
const api_error_1 = require("../utils/api-error");
const parseUnreadOnly = (value) => {
    if (value === undefined) {
        return undefined;
    }
    return value === "true" || value === true;
};
class NotificationController {
    listNotificationsController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const result = await (0, notification_service_1.listNotifications)({
            userId: req.user.id,
            role: req.user.role,
            page: req.query.page,
            limit: req.query.limit,
            unreadOnly: parseUnreadOnly(req.query.unreadOnly)
        });
        res.status(200).json({
            success: true,
            data: result
        });
    };
    markNotificationAsReadController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const { id } = req.params;
        const notification = await (0, notification_service_1.markNotificationAsRead)(id, req.user.id, req.user.role);
        if (!notification) {
            throw new api_error_1.ApiError(404, "Notification not found");
        }
        res.status(200).json({
            success: true,
            data: {
                notification
            }
        });
    };
    markAllNotificationsAsReadController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const result = await (0, notification_service_1.markAllNotificationsAsRead)(req.user.id, req.user.role);
        res.status(200).json({
            success: true,
            data: result
        });
    };
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
