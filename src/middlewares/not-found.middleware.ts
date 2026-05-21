import { RequestHandler } from "express";

import { ApiError } from "../utils/api-error";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};
