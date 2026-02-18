import { Request, Response } from "express";
import { ReceivableService } from "../businesslogic/receivable.service";
import { General, AuthMessage } from "../constants";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { WebUsers } from "../models/postgres/users.model";
import { AppError } from "../utils/AppError";
import { ReceivableUser } from "../models/postgres/receivableUser.model";

export class ReceivableController {

    private receivableService: ReceivableService;

    constructor() {
        this.receivableService = new ReceivableService();
    }

    /**
     * Login for Receivable users
     */
    async login(req: Request, res: Response) {
        const data = await this.receivableService.login(req.body);
        sendResponse(res, 200, true, data, AuthMessage.LOGIN_SUCCESS);
    }

    /**
     * Get all Purchase Orders for Receivable module
     * Returns PO_Header records where PO_Posted = 0 and Confirmed = 0
     * Excludes orders locked in Record_Locks with Lock_Type = 1
     */
    async getOrders(req: AuthRequest, res: Response) {
        const data = await this.receivableService.getOrders(req.query as PaginationOptions);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get Invoice_Terms (only TermsType = 1)
     */
    async getInvoiceTerms(req: AuthRequest, res: Response) {
        const data = await this.receivableService.getInvoiceTerms();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get user report with date range (same structure as Epick getUserReportWithDateRange).
     * Returns only completed PO orders where PO_Header.Confirmed = 1.
     * Query: userId (optional), fromDate, toDate, page, limit.
     */
    async getUserReportWithDateRange(req: AuthRequest, res: Response) {
        const userId = req.query.userId ? Number(req.query.userId) : null;
        const fromDate = req.query.fromDate ? String(req.query.fromDate) : null;
        const toDate = req.query.toDate ? String(req.query.toDate) : null;
        const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
        const limit = Math.min(10000, Math.max(1, parseInt(String(req.query.limit), 10) || 10));

        if (userId != null && isNaN(userId)) {
            return sendResponse(res, 400, false, null, 'Invalid userId parameter');
        }

        const data = await this.receivableService.getUserReportWithDateRange(userId, fromDate, toDate, page, limit);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Accept Order - Lock the order in Record_Locks with Lock_Type = 1
     */
    async acceptOrder(req: AuthRequest, res: Response) {
        const poNumber = Number(req.body.poNumber || req.body.PO_Number);
        const userId = Number(req.user?.id);

        if (!poNumber) {
            return sendResponse(res, 400, false, null, 'PO Number is required');
        }

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        // Verify user exists in receivable_user table
        const isUserExist = await ReceivableUser.findByPk(userId);

        if (!isUserExist) {
            return sendResponse(res, 404, false, null, 'User not found or not authorized');
        }

        // Use the verified user's ID
        const data = await this.receivableService.acceptOrder(poNumber, isUserExist.id);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    async getOrderItems(req: AuthRequest, res: Response) {
        const poNumber = Number(req.params.poNumber);
        const userId = Number(req.user?.id);

        if (!poNumber) {
            return sendResponse(res, 400, false, null, 'PO Number is required');
        }

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        const data = await this.receivableService.getOrderItems(poNumber, userId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get report by PO number - same as getOrderItems with Quantity_Recd per item
     */
    async getReportById(req: AuthRequest, res: Response) {
        const poNumber = Number(req.params.poNumber ?? req.params.id);
        const userId = Number(req.user?.id);

        if (!poNumber) {
            return sendResponse(res, 400, false, null, 'PO Number is required');
        }

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        const data = await this.receivableService.getReportById(poNumber, userId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get the first item from a purchase order based on user's item_sort_by preference
     */
    async getFirstItem(req: AuthRequest, res: Response) {
        const poNumber = Number(req.params.poNumber);
        const userId = Number(req.user?.id);

        if (!poNumber) {
            return sendResponse(res, 400, false, null, 'PO Number is required');
        }

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        const data = await this.receivableService.getFirstItem(poNumber, userId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get user's current order (if any)
     * Returns the PO_Header for the order that the user has locked (accepted)
     */
    async getUserCurrentOrder(req: AuthRequest, res: Response) {
        const userId = Number(req.user?.id);

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        const data = await this.receivableService.getUserCurrentOrder(userId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Exit Order - Remove lock from Record_Locks and delete entry from ReceivablePick
     */
    async exitOrder(req: AuthRequest, res: Response) {
        const poNumber = Number(req.body.poNumber || req.body.PO_Number);
        const userId = Number(req.user?.id);

        if (!poNumber) {
            return sendResponse(res, 400, false, null, 'PO Number is required');
        }

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        // Verify user exists in receivable_user table
        const isUserExist = await ReceivableUser.findByPk(userId);

        if (!isUserExist) {
            return sendResponse(res, 404, false, null, 'User not found or not authorized');
        }

        const data = await this.receivableService.exitOrder(poNumber, isUserExist.id);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Update PO Shipping Info
     * Updates shipping-related fields in PO_Header
     */
    async updatePOShippingInfo(req: AuthRequest, res: Response) {
        const poNumber = Number(req.body.poNumber);
        const userId = Number(req.user?.id);

        if (!poNumber) {
            return sendResponse(res, 400, false, null, 'PO Number is required');
        }

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        // Verify user exists in receivable_user table
        const isUserExist = await ReceivableUser.findByPk(userId);

        if (!isUserExist) {
            return sendResponse(res, 404, false, null, 'User not found or not authorized');
        }

        const data = await this.receivableService.updatePOShippingInfo(poNumber, isUserExist.id, req.body);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Complete Order - Update Quantity_Recd per item, set PO Confirmed=1, remove lock
     */
    async completeOrder(req: AuthRequest, res: Response) {
        const poNumber = Number(req.body.poNumber || req.body.PO_Number);
        const userId = Number(req.user?.id);
        const items = req.body.items as { itemNumber: number; quantity: number }[];

        if (!poNumber) {
            return sendResponse(res, 400, false, null, 'PO Number is required');
        }

        if (!userId) {
            return sendResponse(res, 401, false, null, 'User not authenticated');
        }

        const isUserExist = await ReceivableUser.findByPk(userId);
        if (!isUserExist) {
            return sendResponse(res, 404, false, null, 'User not found or not authorized');
        }

        const data = await this.receivableService.completeOrder(poNumber, isUserExist.id, items);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

}
