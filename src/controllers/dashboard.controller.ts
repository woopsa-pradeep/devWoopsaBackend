import { DashboardService } from "../businesslogic/dashboard.service";
import { sendResponse } from "../utils/sendResponse";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { Response } from "express";
import { General } from "../constants";

    
export class DashboardController {
    private dashboardService: DashboardService;

    constructor() {
        this.dashboardService = new DashboardService();
      }

      async getDistributorDashboard(req: AuthRequest, res: Response) {
        const data = await this.dashboardService.getDistributorDashboard(req.body as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
      }

      async getDistributorDashboardV1(req: AuthRequest, res: Response) {
        const data = await this.dashboardService.getDistributorDashboardV1(req.body as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
      }

      async getDiscountedItems(req: AuthRequest, res: Response) {
        const data = await this.dashboardService.getDiscountedItems(req.query as PaginationOptions,Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
      }

      async getTopProductForSales(req: AuthRequest, res: Response) {
        const data = await this.dashboardService.getTopProductForSales(req.query as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
      }

      async getNewItem(req: AuthRequest, res: Response) {
        const data = await this.dashboardService.getNewItem(req.query,Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
      }

      async getPopularItems(req: AuthRequest, res: Response) {
        const {c_number} = req.query;
        const data = await this.dashboardService.getPopularItems(Number(c_number));
        sendResponse(res, 200, true, data, General.SUCCESS);
      }
      
      async getPromotedItems(req: AuthRequest, res: Response) {
        const data = await this.dashboardService.getPromotedItems(req.query as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
      }


}