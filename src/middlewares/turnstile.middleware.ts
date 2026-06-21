import { RequestHandler } from "express";

import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

const turnstileVerifyEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const verifyTurnstileToken: RequestHandler = async (req, _res, next) => {
  try {
    const token = typeof req.body.cfTurnstileToken === "string"
      ? req.body.cfTurnstileToken.trim()
      : "";

    delete req.body.cfTurnstileToken;

    if (!token) {
      next(new ApiError(403, "Turnstile verification failed"));
      return;
    }

    if (!env.turnstileSecretKey) {
      if (env.nodeEnv !== "production") {
        next();
        return;
      }

      next(new ApiError(500, "Turnstile is not configured"));
      return;
    }

    const payload = new URLSearchParams();
    payload.set("secret", env.turnstileSecretKey);
    payload.set("response", token);

    if (req.ip) {
      payload.set("remoteip", req.ip);
    }

    const response = await fetch(turnstileVerifyEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: payload
    });

    if (!response.ok) {
      console.error("Turnstile verification request failed", {
        status: response.status,
        statusText: response.statusText
      });

      next(new ApiError(403, "Turnstile verification failed"));
      return;
    }

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      console.error("Turnstile verification failed", {
        errorCodes: result["error-codes"]
      });

      next(new ApiError(403, "Turnstile verification failed"));
      return;
    }

    next();
  } catch (error) {
    console.error("Turnstile verification error", error);
    next(new ApiError(403, "Turnstile verification failed"));
  }
};
