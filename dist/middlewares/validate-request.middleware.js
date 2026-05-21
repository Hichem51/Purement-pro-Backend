"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const result = (0, express_validator_1.validationResult)(req);
    if (result.isEmpty()) {
        next();
        return;
    }
    res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.array().map((error) => ({
            type: error.type,
            message: error.msg,
            path: "path" in error ? error.path : undefined,
            location: "location" in error ? error.location : undefined
        }))
    });
};
exports.validateRequest = validateRequest;
