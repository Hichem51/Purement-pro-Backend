import { RequestHandler } from "express";
import { validationResult } from "express-validator";

export const validateRequest: RequestHandler = (req, res, next) => {
  const result = validationResult(req);

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
