"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const api_error_1 = require("../utils/api-error");
const errorMiddleware = (error, _req, res, _next) => {
    const statusCode = error instanceof api_error_1.ApiError ? error.statusCode : 500;
    const message = error instanceof api_error_1.ApiError ? error.message : "Internal server error";
    res.status(statusCode).json({
        success: false,
        message
    });
};
exports.errorMiddleware = errorMiddleware;
