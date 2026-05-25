"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const api_error_1 = require("../utils/api-error");
class DashboardController {
    getOverviewController = async (req, res) => {
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const overview = await (0, dashboard_service_1.getDashboardOverview)(req.user.role);
        res.status(200).json({
            success: true,
            data: overview
        });
    };
    searchController = async (req, res) => {
        const rawQuery = req.query.q;
        if (typeof rawQuery !== "string") {
            throw new api_error_1.ApiError(400, "Search query is required");
        }
        const query = rawQuery.trim();
        if (query.length < 2) {
            throw new api_error_1.ApiError(400, "Search query must be at least 2 characters");
        }
        if (query.length > 100) {
            throw new api_error_1.ApiError(400, "Search query must be at most 100 characters");
        }
        if (!req.user) {
            throw new api_error_1.ApiError(401, "Authentication required");
        }
        const results = await (0, dashboard_service_1.searchDashboard)(query, req.user.role);
        res.status(200).json({
            success: true,
            data: results
        });
    };
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
