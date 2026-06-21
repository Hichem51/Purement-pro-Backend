import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { AuthTokenPayload } from "../services/auth.service";
import { User, UserRole } from "../models/user.model";
import { ApiError } from "../utils/api-error";

const isInternalApiKeyValid = (providedKey?: string): boolean => {
  if (!providedKey) {
    return false;
  }

  const expectedKeyBuffer = Buffer.from(env.internalApiKey);
  const providedKeyBuffer = Buffer.from(providedKey);

  if (expectedKeyBuffer.length !== providedKeyBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedKeyBuffer, providedKeyBuffer);
};

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authorizationHeader = req.header("Authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = authorizationHeader.replace("Bearer ", "").trim();

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;

    if (!payload.sub) {
      throw new ApiError(401, "Authentication required");
    }

    const user = await User.findOne({ _id: payload.sub, isActive: true }).exec();

    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(401, "Authentication required"));
  }
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "Forbidden"));
      return;
    }

    next();
  };

export const requireAuthOrInternalApiKey =
  (...roles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const internalApiKey = req.header("x-internal-api-key");

      if (isInternalApiKeyValid(internalApiKey)) {
        next();
        return;
      }

      await requireAuth(req, res, (authError?: unknown) => {
        if (authError) {
          next(authError);
          return;
        }

        requireRole(...roles)(req, res, next);
      });
    } catch (error) {
      next(error);
    }
  };
