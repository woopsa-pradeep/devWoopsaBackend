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

    async updateDriverLatLong(req: AuthRequest, res: Response) {
        const data = await this.driverService.updateDriverLatLong(req.user.id, req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getTodayDriverOrders(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.getTodayDriverOrders(driverId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async startNavigation(req: AuthRequest, res: Response) {
        const data = await this.driverService.startNavigation(Number(req.params.routeId), req.user.id);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getRouteFullDetails(req: AuthRequest, res: Response) {
        const data = await this.driverService.getRouteFullDetails(Number(req.params.routeId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getDriverDashboardDetails(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.dashboardDetails(driverId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async previewMultiDriverRoutes(req: AuthRequest, res: Response) {
        const data = await this.driverService.previewMultiDriverRoutes(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async createMultiDriverRoutes(req: AuthRequest, res: Response) {
        const data = await this.driverService.createMultiDriverRoutes(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async startDeliveryRoute(req: AuthRequest, res: Response) {
        const data = await this.driverService.startDeliveryRoute(req.body.routeId, req.body.stopId, req.user.id);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async updateDeliveryPod(req: AuthRequest, res: Response) {
        const data = await this.driverService.updateDeliveryPod(Number(req.params.podId), req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async uploadImages(req: AuthRequest, res: Response) {
        const data = await this.driverService.uploadImages(req);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async orderStopCompleted(req: AuthRequest, res: Response) {
        const data = await this.driverService.orderStopCompleted(Number(req.params.stopId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getDriverCurrentOrder(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.getDriverCurrentOrder(driverId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getTodayDriverStops(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.getTodayDriverStops(driverId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
}