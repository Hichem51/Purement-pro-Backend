"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleValidators = exports.updateUserStatusValidators = exports.resendInvitationValidators = exports.getUserByIdValidators = exports.listUsersValidators = exports.setPasswordValidators = exports.inviteUserValidators = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
exports.inviteUserValidators = [
    (0, express_validator_1.body)("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .isLength({ max: 80 })
        .withMessage("First name must be at most 80 characters"),
    (0, express_validator_1.body)("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .isLength({ max: 80 })
        .withMessage("Last name must be at most 80 characters"),
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be valid")
        .toLowerCase(),
    (0, express_validator_1.body)("role")
        .notEmpty()
        .withMessage("Role is required")
        .isIn(["manager"])
        .withMessage("Only manager invitations are currently allowed")
];
exports.setPasswordValidators = [
    (0, express_validator_1.body)("token").trim().notEmpty().withMessage("Token is required"),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
];
exports.listUsersValidators = [
    (0, express_validator_1.query)("page")
        .default(1)
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),
    (0, express_validator_1.query)("limit")
        .default(20)
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be an integer between 1 and 100")
        .toInt(),
    (0, express_validator_1.query)("role").optional().isIn(["admin", "manager"]).withMessage("Role is invalid"),
    (0, express_validator_1.query)("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be true or false")
        .toBoolean(),
    (0, express_validator_1.query)("search")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Search must be at most 200 characters")
];
exports.getUserByIdValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("User ID must be a valid MongoDB ObjectId")
];
exports.resendInvitationValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("User ID must be a valid MongoDB ObjectId")
];
exports.updateUserStatusValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("User ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("isActive")
        .isBoolean()
        .withMessage("isActive must be a boolean")
        .toBoolean()
];
exports.updateUserRoleValidators = [
    (0, express_validator_1.param)("id")
        .custom((value) => (0, mongoose_1.isValidObjectId)(value))
        .withMessage("User ID must be a valid MongoDB ObjectId"),
    (0, express_validator_1.body)("role")
        .notEmpty()
        .withMessage("Role is required")
        .isIn(["admin", "manager"])
        .withMessage("Role must be admin or manager")
];
