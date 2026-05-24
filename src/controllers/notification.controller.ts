import { Request, Response } from "express";

import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../services/notification.service";
import { ApiError } from "../utils/api-error";

const parseUnreadOnly = (value: unknown): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return value === "true" || value === true;
};

export class NotificationController {
  listNotificationsController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const result = await listNotifications({
      userId: req.user.id,
      role: req.user.role,
      page: req.query.page as unknown as number,
      limit: req.query.limit as unknown as number,
      unreadOnly: parseUnreadOnly(req.query.unreadOnly)
    });

    res.status(200).json({
      success: true,
      data: result
    });
  };

  markNotificationAsReadController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const { id } = req.params as { id: string };
    const notification = await markNotificationAsRead(id, req.user.id, req.user.role);

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    res.status(200).json({
      success: true,
      data: {
        notification
      }
    });
  };

  markAllNotificationsAsReadController = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const result = await markAllNotificationsAsRead(req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      data: result
    });
  };
}

export const notificationController = new NotificationController();
