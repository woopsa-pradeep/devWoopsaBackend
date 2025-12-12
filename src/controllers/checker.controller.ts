import { Request, Response } from "express";
import { CheckerService } from "../businesslogic/checker.service";
import { General } from "../constants";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "../middlewares/verifyToken.middleware";

export class CheckerController {

    private checkerService: CheckerService;

    constructor() {
        this.checkerService = new CheckerService();
    }

    async getOrder(req: Request, res: Response) {
        const data = await this.checkerService.getOrder();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getCompleteCheckerOrder(req: Request, res: Response) {
        const data = await this.checkerService.getCompleteCheckerOrder();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getBoxItem(req: Request, res: Response) {
        const boxId = Number(req.params.boxId);
        if (!boxId || isNaN(boxId)) {
            return sendResponse(res, 400, false, null, "Invalid box ID");
        }
        const data = await this.checkerService.getBoxItem(boxId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderDetails(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }
        const data = await this.checkerService.getOrderDetails(orderNumber);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderItems(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }
        const groupByBox = req.query.groupByBox === 'true' || req.query.groupByBox === '1';
        const data = await this.checkerService.getOrderItems(orderNumber, groupByBox);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async moveItemsToBox(req: Request, res: Response) {
        const { sourceBoxId, destinationBoxId, itemNumber, qty } = req.body;
        
        // Validate required fields
        if (!sourceBoxId || !destinationBoxId || !itemNumber || !qty) {
            return sendResponse(res, 400, false, null, "Missing required fields: sourceBoxId, destinationBoxId, itemNumber, qty");
        }

        // Validate types
        if (typeof sourceBoxId !== 'number' || typeof destinationBoxId !== 'number' || 
            typeof itemNumber !== 'number' || typeof qty !== 'number') {
            return sendResponse(res, 400, false, null, "All fields must be numbers");
        }

        if (qty <= 0) {
            return sendResponse(res, 400, false, null, "Quantity must be greater than 0");
        }

        const data = await this.checkerService.moveItemsToBox({
            sourceBoxId,
            destinationBoxId,
            itemNumber,
            qty
        });
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async capturePhotos(req: AuthRequest, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }
        const data = await this.checkerService.capturePhotos(req, orderNumber);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async printLabels(req: Request, res: Response) {
        const { orderNumber, size, boxIds } = req.body;

        // Validate required fields
        if (!orderNumber || !size) {
            return sendResponse(res, 400, false, null, "Missing required fields: orderNumber, size");
        }

        // Validate size
        const validSizes = ['4x3', '4x6', '3x6', '3x2', '4x4', '2x2', '2x3', 'A4'];
        if (!validSizes.includes(size)) {
            return sendResponse(res, 400, false, null, `Invalid size. Must be one of: ${validSizes.join(', ')}`);
        }

        // Validate types
        if (typeof orderNumber !== 'number') {
            return sendResponse(res, 400, false, null, "orderNumber must be a number");
        }

        if (boxIds && !Array.isArray(boxIds)) {
            return sendResponse(res, 400, false, null, "boxIds must be an array");
        }

        const data = await this.checkerService.printLabels({
            orderNumber,
            size,
            boxIds: boxIds || undefined,
        });
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async updateItemQty(req: Request, res: Response) {
        const { orderNumber, itemNumber, boxId, qty } = req.body;

        // Validate required fields (allow qty to be 0)
        if (!orderNumber || !itemNumber || !boxId || qty === undefined || qty === null) {
            return sendResponse(res, 400, false, null, "Missing required fields: orderNumber, itemNumber, boxId, qty");
        }

        // Validate types
        if (typeof orderNumber !== 'number' || typeof itemNumber !== 'number' || typeof boxId !== 'number' || typeof qty !== 'number') {
            return sendResponse(res, 400, false, null, "orderNumber, itemNumber, boxId, and qty must be numbers");
        }

        const data = await this.checkerService.updateItemQty({
            orderNumber,
            itemNumber,
            boxId,
            qty
        });
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async createContainerAndMoveItems(req: Request, res: Response) {
        const { orderNumber, containerType, sourceBoxId, items } = req.body;

        // Validate required fields
        if (!orderNumber || !containerType || !sourceBoxId || !items) {
            return sendResponse(res, 400, false, null, "Missing required fields: orderNumber, containerType, sourceBoxId, items");
        }

        // Validate types
        if (typeof orderNumber !== 'number' || typeof sourceBoxId !== 'number') {
            return sendResponse(res, 400, false, null, "orderNumber and sourceBoxId must be numbers");
        }

        if (!['box', 'tote', 'drink'].includes(containerType)) {
            return sendResponse(res, 400, false, null, "containerType must be 'box', 'tote', or 'drink'");
        }

        if (!Array.isArray(items) || items.length === 0) {
            return sendResponse(res, 400, false, null, "items must be a non-empty array");
        }

        // Validate items array structure
        for (const item of items) {
            if (typeof item.itemNumber !== 'number' || typeof item.qty !== 'number') {
                return sendResponse(res, 400, false, null, "Each item must have itemNumber and qty as numbers");
            }
            if (item.qty <= 0) {
                return sendResponse(res, 400, false, null, "Each item qty must be greater than 0");
            }
        }

        const data = await this.checkerService.createContainerAndMoveItems({
            orderNumber,
            containerType,
            sourceBoxId,
            items
        });
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async readyForDelivery(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber || req.body.orderNumber);
        
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.checkerService.readyForDelivery(orderNumber);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async generateTestLabels(req: Request, res: Response) {
        const size = req.query.size as '4x3' | '4x6' | '3x6' | '3x2' | '4x4' | '2x2' | '2x3' | 'A4' | undefined;
        const data = await this.checkerService.generateTestLabels(size);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderPhotos(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }
        const data = await this.checkerService.getOrderPhotos(orderNumber);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async updateBoxPhotos(req: AuthRequest, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.checkerService.updateBoxPhotos(req, orderNumber, null);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async deleteBoxPhoto(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        const { photoUrl } = req.body;
        
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        if (!photoUrl || typeof photoUrl !== 'string') {
            return sendResponse(res, 400, false, null, "Missing or invalid photoUrl in request body");
        }

        const data = await this.checkerService.deleteBoxPhoto(orderNumber, photoUrl);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }


    async requestAllStatusOverride(req: AuthRequest, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.checkerService.requestAllStatusOverride(orderNumber, req.query);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }
}