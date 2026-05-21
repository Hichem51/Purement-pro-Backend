"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
class DashboardController {
    getOverviewController = async (_req, res) => {
        const overview = await (0, dashboard_service_1.getDashboardOverview)();
        res.status(200).json({
            success: true,
            data: overview
        });
    };
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
