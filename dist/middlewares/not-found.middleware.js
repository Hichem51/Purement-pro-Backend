"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = void 0;
const api_error_1 = require("../utils/api-error");
const notFoundMiddleware = (req, _res, next) => {
    next(new api_error_1.ApiError(404, `Route not found: ${req.originalUrl}`));
};
exports.notFoundMiddleware = notFoundMiddleware;
