import { Request, Response } from "express";
import { DriverService } from "../businesslogic/driver.service";
import { sendResponse } from "../utils/sendResponse";
import { General } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { AppError } from "../utils/AppError";

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

    async getDriverProfile(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.getProfile(driverId);
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

    async updateDriverLation(req: AuthRequest, res: Response) {
        const data = await this.driverService.updateDriverLation(Number(req.user.id), req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getPaymentOptions(req: AuthRequest, res: Response) {
        const data = await this.driverService.getPaymentOptions();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async createDriverExpense(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.createDriverExpense(driverId, req.body);
        sendResponse(res, 201, true, data, General.SUCCESS);
    }

    async listDriverExpenses(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.listDriverExpenses(driverId, req.query as any);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getDriverExpenseById(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const expenseId = Number(req.params.expenseId);
        const data = await this.driverService.getDriverExpenseById(driverId, expenseId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async updateDriverExpense(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const expenseId = Number(req.params.expenseId);
        const data = await this.driverService.updateDriverExpense(driverId, expenseId, req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async deleteDriverExpense(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const expenseId = Number(req.params.expenseId);
        const data = await this.driverService.deleteDriverExpense(driverId, expenseId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getDriverCurrentVehicle(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const data = await this.driverService.getDriverCurrentVehicle(driverId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async reScheduleStop(req: AuthRequest, res: Response) {
        try {
            const driverId = parseInt(req.user.id);
            const stopId = parseInt(req.params.stopId);

            if (isNaN(driverId)) throw new AppError('Invalid driverId', 400);
            if (isNaN(stopId)) throw new AppError('Invalid stopId', 400);

            const result = await this.driverService.reScheduleStop(
                driverId,
                stopId,
                req.body
            );

            res.status(200).json({ success: true, data: result });
        } catch (error) {
            sendResponse(res, 500, false, null, (error as AppError).message);
        }
    }


    async getDriverPendingStop(req: AuthRequest, res: Response) {
        const routeId = Number(req.params.routeId);
        const data = await this.driverService.getDriverPendingStop(routeId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async cancelStop(req: AuthRequest, res: Response) {
        const driverId = Number(req.user?.id);
        const stopId = Number(req.params.stopId);
        const data = await this.driverService.cancelStop(
            driverId,
            stopId,
            req.body.cancelledReason
        );
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
}