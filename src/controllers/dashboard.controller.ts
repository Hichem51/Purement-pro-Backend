import { Request, Response } from "express";

import { getDashboardOverview } from "../services/dashboard.service";

export class DashboardController {
  getOverviewController = async (_req: Request, res: Response): Promise<void> => {
    const overview = await getDashboardOverview();

    res.status(200).json({
      success: true,
      data: overview
    });
  };
}

export const dashboardController = new DashboardController();
