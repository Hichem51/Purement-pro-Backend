import { ErrorRequestHandler } from "express";

import { ApiError } from "../utils/api-error";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message
  });
};
