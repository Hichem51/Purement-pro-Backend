import { RequestHandler } from "express";
import { validationResult } from "express-validator";

export const validateRequest: RequestHandler = (req, res, next) => {
  const result = validationResult(req);
  const errors = result.array();

  if (result.isEmpty()) {
    next();
    return;
  }

  const missingFields = Array.from(
    new Set(
      errors
        .filter((error) => {
          if (!("path" in error)) {
            return false;
          }

          return /required|must be|invalid|valid|required/i.test(String(error.msg));
        })
        .map((error) => ("path" in error ? error.path : undefined))
        .filter((path): path is string => Boolean(path))
    )
  );

  console.log("VALIDATION FAILED:", {
    method: req.method,
    path: req.originalUrl,
    missingFields,
    errors: errors.map((error) => ({
      type: error.type,
      message: error.msg,
      path: "path" in error ? error.path : undefined,
      location: "location" in error ? error.location : undefined,
      value: "value" in error ? error.value : undefined
    }))
  });

  res.status(400).json({
    success: false,
    message: "Validation failed",
    missingFields,
    errors: errors.map((error) => ({
      type: error.type,
      message: error.msg,
      path: "path" in error ? error.path : undefined,
      location: "location" in error ? error.location : undefined
    }))
  });
};
