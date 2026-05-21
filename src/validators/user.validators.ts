import { body, param, query } from "express-validator";
import { isValidObjectId } from "mongoose";

export const inviteUserValidators = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 80 })
    .withMessage("First name must be at most 80 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 80 })
    .withMessage("Last name must be at most 80 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .toLowerCase(),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["manager"])
    .withMessage("Only manager invitations are currently allowed")
];

export const setPasswordValidators = [
  body("token").trim().notEmpty().withMessage("Token is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
];

export const listUsersValidators = [
  query("page")
    .default(1)
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .default(20)
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),

  query("role").optional().isIn(["admin", "manager"]).withMessage("Role is invalid"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false")
    .toBoolean(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Search must be at most 200 characters")
];

export const getUserByIdValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("User ID must be a valid MongoDB ObjectId")
];

export const resendInvitationValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("User ID must be a valid MongoDB ObjectId")
];

export const updateUserStatusValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("User ID must be a valid MongoDB ObjectId"),

  body("isActive")
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean()
];

export const updateUserRoleValidators = [
  param("id")
    .custom((value: string) => isValidObjectId(value))
    .withMessage("User ID must be a valid MongoDB ObjectId"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["admin", "manager"])
    .withMessage("Role must be admin or manager")
];
