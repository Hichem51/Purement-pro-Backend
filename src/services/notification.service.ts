import { FilterQuery, Types } from "mongoose";

import {
  INotification,
  Notification,
  NotificationAudience,
  NotificationRelatedResourceType,
  NotificationType
} from "../models/notification.model";
import { UserRole } from "../models/user.model";

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  audience: NotificationAudience;
  createdByUserId?: string | Types.ObjectId;
  relatedResourceType?: NotificationRelatedResourceType;
  relatedResourceId?: string | Types.ObjectId;
}

export interface ListNotificationsInput {
  userId: string;
  role: UserRole;
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  audience: NotificationAudience;
  isRead: boolean;
  createdByUserId?: string;
  relatedResourceType?: NotificationRelatedResourceType;
  relatedResourceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const visibleNotificationFilter = (
  role: UserRole
): FilterQuery<INotification> => ({
  audience: { $in: ["all", role] }
});

const toObjectId = (value?: string | Types.ObjectId): Types.ObjectId | undefined => {
  if (!value) {
    return undefined;
  }

  return typeof value === "string" ? new Types.ObjectId(value) : value;
};

const toNotificationItem = (
  notification: INotification,
  userObjectId: Types.ObjectId
): NotificationItem => ({
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

export const createNotification = async (
  input: CreateNotificationInput
): Promise<INotification> => {
  return Notification.create({
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

export const createNotificationSafely = async (
  input: CreateNotificationInput
): Promise<void> => {
  try {
    await createNotification(input);
  } catch (error) {
    console.warn("Dashboard notification creation failed", {
      type: input.type,
      audience: input.audience,
      relatedResourceType: input.relatedResourceType,
      relatedResourceId: input.relatedResourceId?.toString(),
      error: error instanceof Error ? error.message : error
    });
  }
};

export const listNotifications = async (input: ListNotificationsInput) => {
  const userObjectId = new Types.ObjectId(input.userId);
  const filter: FilterQuery<INotification> = visibleNotificationFilter(input.role);

  if (input.unreadOnly) {
    filter.isReadBy = { $ne: userObjectId };
  }

  const skip = (input.page - 1) * input.limit;
  const unreadFilter: FilterQuery<INotification> = {
    ...visibleNotificationFilter(input.role),
    isReadBy: { $ne: userObjectId }
  };

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit).exec(),
    Notification.countDocuments(filter).exec(),
    Notification.countDocuments(unreadFilter).exec()
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

export const markNotificationAsRead = async (
  id: string,
  userId: string,
  role: UserRole
): Promise<NotificationItem | null> => {
  const userObjectId = new Types.ObjectId(userId);
  const notification = await Notification.findOneAndUpdate(
    {
      _id: new Types.ObjectId(id),
      ...visibleNotificationFilter(role)
    },
    {
      $addToSet: { isReadBy: userObjectId }
    },
    {
      new: true,
      runValidators: true
    }
  ).exec();

  return notification ? toNotificationItem(notification, userObjectId) : null;
};

export const markAllNotificationsAsRead = async (
  userId: string,
  role: UserRole
): Promise<{ modifiedCount: number }> => {
  const userObjectId = new Types.ObjectId(userId);
  const result = await Notification.updateMany(
    {
      ...visibleNotificationFilter(role),
      isReadBy: { $ne: userObjectId }
    },
    {
      $addToSet: { isReadBy: userObjectId }
    }
  ).exec();

  return {
    modifiedCount: result.modifiedCount
  };
};
