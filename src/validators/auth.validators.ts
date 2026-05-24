import { body } from "express-validator";

export const loginValidators = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .toLowerCase(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string")
];

export const updateMeAvatarValidators = [
  body("avatarUrl")
    .trim()
    .notEmpty()
    .withMessage("Avatar URL is required")
    .isURL({ require_protocol: true })
    .withMessage("Avatar URL must be valid"),

  body("avatarPublicId")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Avatar public ID must be at most 300 characters")
];
