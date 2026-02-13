import { AdminService } from "../businesslogic/admin.service";
import { Response } from "express";
import { General } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { sendResponse } from "../utils/sendResponse";

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  async getOrdersBySource(req: AuthRequest, res: Response) {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return sendResponse(res, 400, false, null, "startDate and endDate are required");
    }

    const data = await this.adminService.getOrdersBySource(
      startDate as string,
      endDate as string
    );
    
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
}
