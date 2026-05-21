"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const api_error_1 = require("../utils/api-error");
class UserController {
    inviteUserController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const result = await (0, user_service_1.inviteUser)({
            ...req.body,
            invitedByUserId: req.user.id
        });
        res.status(201).json({
            success: true,
            message: "User invitation created successfully",
            data: result
        });
    };
    setPasswordController = async (req, res) => {
        await (0, user_service_1.setInvitedUserPassword)(req.body);
        res.status(200).json({
            success: true,
            message: "Password set successfully"
        });
    };
    resendInvitationController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const { id } = req.params;
        const result = await (0, user_service_1.resendInvitation)({
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
    listUsersController = async (req, res) => {
        const result = await (0, user_service_1.listUsers)({
            page: req.query.page,
            limit: req.query.limit,
            role: req.query.role,
            isActive: req.query.isActive,
            search: req.query.search
        });
        res.status(200).json({
            success: true,
            data: result
        });
    };
    getUserByIdController = async (req, res) => {
        const { id } = req.params;
        const user = await (0, user_service_1.getUserById)(id);
        if (!user) {
            throw new api_error_1.ApiError(404, "User not found");
        }
        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    };
    updateUserStatusController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const { id } = req.params;
        const { isActive } = req.body;
        const user = await (0, user_service_1.updateUserStatus)({
            id,
            isActive,
            currentUserId: req.user.id
        });
        if (!user) {
            throw new api_error_1.ApiError(404, "User not found");
        }
        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    };
    updateUserRoleController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const { id } = req.params;
        const { role } = req.body;
        const user = await (0, user_service_1.updateUserRole)({
            id,
            role,
            currentUserId: req.user.id
        });
        if (!user) {
            throw new api_error_1.ApiError(404, "User not found");
        }
        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    };
}
exports.UserController = UserController;
exports.userController = new UserController();
