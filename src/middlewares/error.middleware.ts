import { ErrorRequestHandler } from "express";

import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : "Internal server error";

  if (!(error instanceof ApiError) || statusCode >= 500) {
    console.error("Request failed", error);
  } else if (env.nodeEnv === "development") {
    console.error(error.message);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};
