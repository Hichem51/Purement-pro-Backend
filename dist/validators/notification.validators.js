"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationAsReadValidators = exports.listNotificationsValidators = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
exports.listNotificationsValidators = [
    (0, express_validator_1.query)("page")
        .default(1)
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    (0, express_validator_1.query)("limit")
        .default(10)
        .isInt({ min: 1, max: 50 })
        .withMessage("Limit must be an integer between 1 and 50")
        .toInt(),
    (0, express_validator_1.query)("unreadOnly")
        .optional()
        .isBoolean()
        .withMessage("Unread only must be a boolean")
        .toBoolean()
];
exports.markNotificationAsReadValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("Notification ID must be a valid MongoDB ObjectId")
];
