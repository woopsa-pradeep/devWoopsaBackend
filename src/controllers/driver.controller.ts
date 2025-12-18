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

async getDriverOrder(req: AuthRequest, res: Response) {
    const { id } = req.user;
    const data = await this.driverService.getDriverOrder(req.query,Number(id));
    sendResponse(res, 200, true, data, General.SUCCESS);
}

async startOrder(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.driverService.startOrder(Number(id), req.user.id)
    sendResponse(res, 200, true, data, General.SUCCESS);
}

async getCurrentOrderList(req: AuthRequest, res: Response) {
    const { id } = req.user;
    const data = await this.driverService.getCurrentOrderList(Number(id));
    sendResponse(res, 200, true, data, General.SUCCESS);
}

async updateDeliveryOrder(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.driverService.updateDeliveryOrder(Number(id), req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
}

async completeOrder(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const data = await this.driverService.completeOrder(id);
    sendResponse(res, 200, true, data, General.SUCCESS);
}

async orderHistory(req: AuthRequest, res: Response) {
    const { id } = req.user;
    const data = await this.driverService.orderHistory(Number(id), req.query);
    sendResponse(res, 200, true, data, General.SUCCESS);
}   


}