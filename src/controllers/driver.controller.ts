import { Request, Response } from "express";
import { DriverService } from "../businesslogic/driver.service";
import { sendResponse } from "../utils/sendResponse";
import { General } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";

export class DriverController {
    private driverService: DriverService;
    constructor() {
        this.driverService = new DriverService();
    }

async getDriverOrderList(req: AuthRequest, res: Response) {
    const data = await this.driverService.getDriverOrderList();
    sendResponse(res, 200, true, data, General.SUCCESS);
}


}