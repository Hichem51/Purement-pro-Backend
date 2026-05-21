"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidators = void 0;
const express_validator_1 = require("express-validator");
exports.loginValidators = [
    (0, express_validator_1.body)("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email must be valid")
        .toLowerCase(),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage("Password is required")
        .isString()
        .withMessage("Password must be a string")
];
