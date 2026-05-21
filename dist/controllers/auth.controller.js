"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const api_error_1 = require("../utils/api-error");
class AuthController {
    loginController = async (req, res) => {
        const result = await (0, auth_service_1.login)(req.body);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });
    };
    meController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        res.status(200).json({
            success: true,
            data: {
                user: (0, auth_service_1.toAuthUser)(req.user)
            }
        });
    };
    logoutController = async (_req, res) => {
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
