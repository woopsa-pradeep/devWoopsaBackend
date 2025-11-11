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


    async getOrderItem(req: Request, res: Response) {
        const data = await this.epickService.getOrderItem(Number(req.params.orderNumber));
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async addOrderBox(req: Request, res: Response) {
        const data = await this.epickService.addOrderBox(req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrder(req: Request, res: Response) {
        const data = await this.epickService.getOrder();
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
 
}