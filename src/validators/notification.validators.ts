import { param, query } from "express-validator";
import { isValidObjectId } from "mongoose";

export const listNotificationsValidators = [
  query("page")
    .default(1)
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .default(10)
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be an integer between 1 and 50")
    .toInt(),

  query("unreadOnly")
    .optional()
    .isBoolean()
    .withMessage("Unread only must be a boolean")
    .toBoolean()
];

export const markNotificationAsReadValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("Notification ID must be a valid MongoDB ObjectId")
];
