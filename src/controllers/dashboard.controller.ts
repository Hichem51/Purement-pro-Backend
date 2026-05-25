import { Request, Response } from "express";

import { getDashboardOverview, searchDashboard } from "../services/dashboard.service";
import { ApiError } from "../utils/api-error";

export class DashboardController {
  getOverviewController = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const overview = await getDashboardOverview(req.user.role);

    res.status(200).json({
      success: true,
      data: overview
    });
  };

  searchController = async (req: Request, res: Response): Promise<void> => {
    const rawQuery = req.query.q;

    if (typeof rawQuery !== "string") {
      throw new ApiError(400, "Search query is required");
    }

    const query = rawQuery.trim();

    if (query.length < 2) {
      throw new ApiError(400, "Search query must be at least 2 characters");
    }

    if (query.length > 100) {
      throw new ApiError(400, "Search query must be at most 100 characters");
    }

    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const results = await searchDashboard(query, req.user.role);

    res.status(200).json({
      success: true,
      data: results
    });
  };
}

export const dashboardController = new DashboardController();
