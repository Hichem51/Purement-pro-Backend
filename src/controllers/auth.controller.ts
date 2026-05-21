import { Request, Response } from "express";

import { login, toAuthUser } from "../services/auth.service";
import { ApiError } from "../utils/api-error";

export class AuthController {
  loginController = async (req: Request, res: Response): Promise<void> => {
    const result = await login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  };

  meController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    res.status(200).json({
      success: true,
      data: {
        user: toAuthUser(req.user)
      }
    });
  };

  logoutController = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  };
}

export const authController = new AuthController();
