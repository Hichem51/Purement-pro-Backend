import { Request, Response } from "express";

import {
  inviteUser,
  getUserById,
  listUsers,
  resendInvitation,
  setInvitedUserPassword,
  updateUserRole,
  updateUserStatus
} from "../services/user.service";
import { ApiError } from "../utils/api-error";

export class UserController {
  inviteUserController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const result = await inviteUser({
      ...req.body,
      invitedByUserId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "User invitation created successfully",
      data: result
    });
  };

  setPasswordController = async (req: Request, res: Response): Promise<void> => {
    await setInvitedUserPassword(req.body);

    res.status(200).json({
      success: true,
      message: "Password set successfully"
    });
  };

  resendInvitationController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const { id } = req.params as { id: string };
    const result = await resendInvitation({
      id,
      invitedByUserId: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Invitation email resent successfully",
      ...(result.setupUrl && {
        data: {
          setupUrl: result.setupUrl
        }
      })
    });
  };

  listUsersController = async (req: Request, res: Response): Promise<void> => {
    const result = await listUsers({
      page: req.query.page as unknown as number,
      limit: req.query.limit as unknown as number,
      role: req.query.role as "admin" | "manager" | undefined,
      isActive: req.query.isActive as unknown as boolean | undefined,
      search: req.query.search as string | undefined
    });

    res.status(200).json({
      success: true,
      data: result
    });
  };

  getUserByIdController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = await getUserById(id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  };

  updateUserStatusController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const { id } = req.params as { id: string };
    const { isActive } = req.body as { isActive: boolean };

    const user = await updateUserStatus({
      id,
      isActive,
      currentUserId: req.user.id
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  };

  updateUserRoleController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const { id } = req.params as { id: string };
    const { role } = req.body as { role: "admin" | "manager" };

    const user = await updateUserRole({
      id,
      role,
      currentUserId: req.user.id
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  };
}

export const userController = new UserController();
