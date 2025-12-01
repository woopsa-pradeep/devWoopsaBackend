import { Request, Response } from "express";
import { EpickService } from "../businesslogic/epick.service";
import { General } from "../constants";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "../middlewares/verifyToken.middleware";

export class EpickController {

    private epickService: EpickService;

    constructor() {
        this.epickService = new EpickService();
    }

    async addProductInBox(req: Request, res: Response) {
        const data = await this.epickService.addProductInBox(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async addProductsInBoxBatch(req: AuthRequest, res: Response) {
        const data = await this.epickService.addProductsInBoxBatch(req.body, Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async getOrderItem(req: Request, res: Response) {
        const data = await this.epickService.getOrderItem(Number(req.params.orderNumber));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async addOrderBox(req: Request, res: Response) {
        const data = await this.epickService.addOrderBox(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrder(req: AuthRequest, res: Response) {
        const userId = Number(req.user?.id);
        const data = await this.epickService.getOrder(userId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async acceptOrder(req: AuthRequest, res: Response) {
        const data = await this.epickService.acceptOrder(req.body, Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderBox(req: Request, res: Response) {
        const data = await this.epickService.getOrderBox(Number(req.params.orderNumber));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async addImagesNotes(req: AuthRequest, res: Response) {
        const data = await this.epickService.addImagesNotes(req, Number(req.params.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async OrderCompleted(req: AuthRequest, res: Response) {
        const data = await this.epickService.OrderCompleted(Number(req.params.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getUserHistory(req: AuthRequest, res: Response) {
        const data = await this.epickService.getUserHistory(Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderDetailByOrderNumber(req: Request, res: Response) {
        const data = await this.epickService.getOrderDetailByOrderNumber(Number(req.params.orderNumber));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    
       

    async getUserCurrentOrder(req: AuthRequest, res: Response) {
        const data = await this.epickService.getUserCurrentOrder(Number(req.user.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getIntemDataAsPerBox(req: Request, res: Response) {
        const data = await this.epickService.getItemAsPerBox(Number(req.params.boxId));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async getOrderSummary(req: Request, res: Response) {
        const data = await this.epickService.getOrderSummary(Number(req.params.orderNumber));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    async getReportDate(req: AuthRequest, res: Response) {
        const data = await this.epickService.getReportDate(Number(req.user.id), req.query);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getReportById(req: Request, res: Response) {
        const data = await this.epickService.getReportById(Number(req.params.id));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
    async getSubsituteProduct(req: Request, res: Response) {
        const data = await this.epickService.getSubsituteProduct(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async addSubsituteProduct(req: AuthRequest, res: Response) {
        const data = await this.epickService.addSubsituteProduct(req.body,req.user.id);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async putPassScanItem(req: AuthRequest, res: Response) {
        const data = await this.epickService.putPassScanItem(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async checkPin(req: Request, res: Response) {
        const data = await this.epickService.checkPin(req.body.pin);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
 
    /**
     * Create override request (Epick user)
     */
    async createOverrideRequest(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            return sendResponse(res, 401, false, null, "User not authenticated");
        }

        const { orderNumber, itemNumber, note } = req.body;

        if (!orderNumber || !itemNumber) {
            return sendResponse(res, 400, false, null, "orderNumber and itemNumber are required");
        }

        const data = await this.epickService.createOverrideRequest(
            { orderNumber, itemNumber, note },
            userId
        );

        sendResponse(res, 201, true, data, "Override request created successfully");
    }

    /**
     * Check override request status (Epick user - for polling)
     */
    async checkOverrideRequest(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            return sendResponse(res, 401, false, null, "User not authenticated");
        }

        const requestId = Number(req.params.requestId);
        if (!requestId || isNaN(requestId)) {
            return sendResponse(res, 400, false, null, "Invalid request ID");
        }

        const data = await this.epickService.checkOverrideRequest(requestId, userId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get pending override requests (Distributor)
     */
    async getPendingOverrideRequests(req: Request, res: Response) {
        const data = await this.epickService.getPendingOverrideRequests();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Approve override request (Distributor)
     */
    async approveOverrideRequest(req: Request, res: Response) {
        const requestId = Number(req.params.requestId);
        if (!requestId || isNaN(requestId)) {
            return sendResponse(res, 400, false, null, "Invalid request ID");
        }

        const data = await this.epickService.approveOverrideRequest(requestId);
        sendResponse(res, 200, true, data, "Override request approved successfully");
    }

    /**
     * Cancel override request (Distributor)
     */
    async cancelOverrideRequestByDistributor(req: Request, res: Response) {
        const requestId = Number(req.params.requestId);
        if (!requestId || isNaN(requestId)) {
            return sendResponse(res, 400, false, null, "Invalid request ID");
        }

        const data = await this.epickService.cancelOverrideRequestByDistributor(requestId);
        sendResponse(res, 200, true, data, "Override request cancelled successfully");
    }

    /**
     * Reject override request (Distributor)
     */
    async rejectOverrideRequest(req: Request, res: Response) {
        const requestId = Number(req.params.requestId);
        if (!requestId || isNaN(requestId)) {
            return sendResponse(res, 400, false, null, "Invalid request ID");
        }

        const { rejectionReason } = req.body;
        if (!rejectionReason || rejectionReason.trim() === '') {
            return sendResponse(res, 400, false, null, "rejectionReason is required");
        }

        const data = await this.epickService.rejectOverrideRequest(requestId, rejectionReason);
        sendResponse(res, 200, true, data, "Override request rejected successfully");
    }

    /**
     * Cancel override request (Epick user)
     */
    async cancelOverrideRequest(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            return sendResponse(res, 401, false, null, "User not authenticated");
        }

        const requestId = Number(req.params.requestId);
        if (!requestId || isNaN(requestId)) {
            return sendResponse(res, 400, false, null, "Invalid request ID");
        }

        const data = await this.epickService.cancelOverrideRequest(requestId, userId);
        sendResponse(res, 200, true, data, "Override request cancelled successfully");
    }
}