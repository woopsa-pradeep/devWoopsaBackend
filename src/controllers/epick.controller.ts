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

    async getOrderItemFirst(req: Request, res: Response) {
        const data = await this.epickService.getOrderItemFirst(Number(req.params.orderNumber));
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

    /**
     * Get order details by order number
     * Returns complete order details with override requests, order items, and picking time
     * Same structure as getUserReportWithDateRange but for a single order
     * 
     * Full Example Response:
     * {
     *   "success": true,
     *   "message": "Success",
     *   "data": {
     *     "id": 1,
     *     "orderNumber": 132698,
     *     "customerNumber": 100,
     *     "pickerUserNumber": 10,
     *     "status": "completed",
     *     "startedAt": "2024-01-15T08:30:00.000Z",
     *     "completedAt": "2024-01-15T10:45:00.000Z",
     *     "totalLines": 25,
     *     "totalQty": 150.5000,
     *     "scannedLines": 25,
     *     "scannedQty": 150.5000,
     *     "OutOfStockItem": 2,
     *     "notes": "Handle with care",
     *     "picker": {
     *       "id": 10,
     *       "firstName": "John",
     *       "lastName": "Doe",
     *       "email": "john.doe@example.com",
     *       "userNumber": 10
     *     },
     *     "customer": {
     *       "C_Number": 100,
     *       "C_Name": "ABC Store",
     *       "Routes": [
     *         {
     *           "Route_Number": 1,
     *           "Stop_Number": 5
     *         }
     *       ]
     *     },
     *     "overrideRequestCount": 3,
     *     "overrideRequests": [
     *       {
     *         "id": 1,
     *         "orderNumber": 132698,
     *         "itemNumber": 234786,
     *         "pickerUserNumber": 10,
     *         "status": "approved",
     *         "note": "Item out of stock",
     *         "rejectionReason": null,
     *         "createdAt": "2024-01-15T09:00:00.000Z",
     *         "updatedAt": "2024-01-15T09:05:00.000Z"
     *       },
     *       {
     *         "id": 2,
     *         "orderNumber": 132698,
     *         "itemNumber": 234787,
     *         "pickerUserNumber": 10,
     *         "status": "pending",
     *         "note": "Need manager approval",
     *         "rejectionReason": null,
     *         "createdAt": "2024-01-15T09:10:00.000Z",
     *         "updatedAt": "2024-01-15T09:10:00.000Z"
     *       },
     *       {
     *         "id": 3,
     *         "orderNumber": 132698,
     *         "itemNumber": 234788,
     *         "pickerUserNumber": 10,
     *         "status": "rejected",
     *         "note": "Requesting override",
     *         "rejectionReason": "Not approved by manager",
     *         "createdAt": "2024-01-15T09:15:00.000Z",
     *         "updatedAt": "2024-01-15T09:20:00.000Z"
     *       }
     *     ],
     *     "orderItems": [
     *       {
     *         "Order_Number": 132698,
     *         "Line_Number": 1,
     *         "Item_Number": 234786,
     *         "Quantity_Ordered": 1,
     *         "Quantity_Shipped": 1,
     *         "Pack": 5,
     *         "CaseCount": 15,
     *         "Confirmed": true,
     *         "inventory": {
     *           "Item_Number": 234786,
     *           "Description": "MOJO 50MG ENG PCH MINT $4.99 15CT",
     *           "Section": "A1",
     *           "Location": 10,
     *           "SalesCategory": {
     *             "Category_Desc": "General Merchandise",
     *             "Sales_Category": 1
     *           }
     *         }
     *       },
     *       {
     *         "Order_Number": 132698,
     *         "Line_Number": 2,
     *         "Item_Number": 234787,
     *         "Quantity_Ordered": 2,
     *         "Quantity_Shipped": 0,
     *         "Pack": 10,
     *         "CaseCount": 20,
     *         "Confirmed": true,
     *         "inventory": {
     *           "Item_Number": 234787,
     *           "Description": "Product Name 2",
     *           "Section": "B2",
     *           "Location": 15,
     *           "SalesCategory": {
     *             "Category_Desc": "Tobacco",
     *             "Sales_Category": 2
     *           }
     *         }
     *       },
     *       {
     *         "Order_Number": 132698,
     *         "Line_Number": 3,
     *         "Item_Number": 234788,
     *         "Quantity_Ordered": 3,
     *         "Quantity_Shipped": 3,
     *         "Pack": 12,
     *         "CaseCount": 24,
     *         "Confirmed": true,
     *         "inventory": {
     *           "Item_Number": 234788,
     *           "Description": "Product Name 3",
     *           "Section": "C3",
     *           "Location": 20,
     *           "SalesCategory": {
     *             "Category_Desc": "Beverages",
     *             "Sales_Category": 3
     *           }
     *         }
     *       }
     *     ],
     *     "pickingTimeSeconds": 8100,
     *     "pickingTimeFormatted": "02:15:00",
     *     "distributor": {
     *       "D_Name": "ABC Distributors",
     *       "D_Addr1": "123 Main Street",
     *       "D_Addr2": "Suite 100",
     *       "D_City": "New York",
     *       "D_State": "NY",
     *       "D_Zip": "10001",
     *       "D_Phone": "555-1234",
     *       "D_Email": "info@abcdist.com"
     *     },
     *     "logo": "https://woopsacdn.blob.core.windows.net/warehouse-images/logo.jpg"
     *   }
     * }
     */
    async getOrderDetailsByOrderNumber(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.epickService.getOrderDetailsByOrderNumber(orderNumber);
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

    /**
     * Get user report with date range filter
     * Query params: userId (optional), fromDate, toDate
     * Returns full data (no pagination) with override request details, order items, and picking times
     * 
     * Example Response:
     * {
     *   "success": true,
     *   "message": "Success",
     *   "data": {
     *     "data": [
     *       {
     *         "id": 1,
     *         "orderNumber": 132698,
     *         "customerNumber": 100,
     *         "pickerUserNumber": 10,
     *         "status": "completed",
     *         "startedAt": "2024-01-15T08:30:00.000Z",
     *         "completedAt": "2024-01-15T10:45:00.000Z",
     *         "totalLines": 25,
     *         "totalQty": 150.5000,
     *         "scannedLines": 25,
     *         "scannedQty": 150.5000,
     *         "OutOfStockItem": 2,
     *         "notes": null,
     *         "picker": {
     *           "id": 10,
     *           "firstName": "John",
     *           "lastName": "Doe",
     *           "email": "john.doe@example.com",
     *           "userNumber": 10
     *         },
     *         "customer": {
     *           "C_Number": 100,
     *           "C_Name": "ABC Store",
     *           "Routes": [
     *             {
     *               "Route_Number": 1,
     *               "Stop_Number": 5
     *             }
     *           ]
     *         },
     *         "overrideRequestCount": 3,
     *         "overrideRequests": [
     *           {
     *             "id": 1,
     *             "orderNumber": 132698,
     *             "itemNumber": 234786,
     *             "pickerUserNumber": 10,
     *             "status": "approved",
     *             "note": "Item out of stock",
     *             "rejectionReason": null,
     *             "createdAt": "2024-01-15T09:00:00.000Z",
     *             "updatedAt": "2024-01-15T09:05:00.000Z"
     *           }
     *         ],
     *         "orderItems": [
     *           {
     *             "Order_Number": 132698,
     *             "Line_Number": 1,
     *             "Item_Number": 234786,
     *             "Quantity_Ordered": 1,
     *             "Quantity_Shipped": 1,
     *             "Pack": 5,
     *             "CaseCount": 15,
     *             "Confirmed": true,
     *             "inventory": {
     *               "Item_Number": 234786,
     *               "Description": "MOJO 50MG ENG PCH MINT $4.99 15CT",
     *               "Section": "A1",
     *               "Location": 10
     *             }
     *           }
     *         ],
     *         "pickingTimeSeconds": 8100,
     *         "pickingTimeFormatted": "02:15:00"
     *       }
     *     ],
     *     "totalCount": 1,
     *     "summary": {
     *       "totalOrders": 1,
     *       "totalPickingTimeSeconds": 8100,
     *       "totalPickingTimeFormatted": "02:15:00",
     *       "averagePickingTimeSeconds": 8100
     *     }
     *   }
     * }
     */
    async getUserReportWithDateRange(req: AuthRequest, res: Response) {
        const userId = req.query.userId ? Number(req.query.userId) : null;
        const fromDate = req.query.fromDate ? String(req.query.fromDate) : null;
        const toDate = req.query.toDate ? String(req.query.toDate) : null;

        if (userId && isNaN(userId)) {
            return sendResponse(res, 400, false, null, "Invalid userId parameter");
        }

        const data = await this.epickService.getUserReportWithDateRange(
            userId,
            fromDate,
            toDate
        );
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
     * Create override request (Epick user) - Pass type
     */
    async createOverrideRequest(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            return sendResponse(res, 401, false, null, "User not authenticated");
        }

        const { orderNumber, itemNumber, qty, note } = req.body;

        if (!orderNumber || !itemNumber) {
            return sendResponse(res, 400, false, null, "orderNumber and itemNumber are required");
        }

        const data = await this.epickService.createOverrideRequest(
            { orderNumber, itemNumber, qty, note },
            userId
        );

        sendResponse(res, 201, true, data, "Override request created successfully");
    }

    /**
     * Create scan override request (Epick user) - Scan type with quantity
     */
    async createScanOverrideRequest(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            return sendResponse(res, 401, false, null, "User not authenticated");
        }

        const { orderNumber, itemNumber, qty, note } = req.body;

        if (!orderNumber || !itemNumber) {
            return sendResponse(res, 400, false, null, "orderNumber and itemNumber are required");
        }

        if (!qty || qty <= 0) {
            return sendResponse(res, 400, false, null, "qty is required and must be greater than 0");
        }

        const data = await this.epickService.createScanOverrideRequest(
            { orderNumber, itemNumber, qty, note },
            userId
        );

        sendResponse(res, 201, true, data, "Scan override request created successfully");
    }



    async requestAllStatusOverride(req: AuthRequest, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.epickService.requestAllStatusOverride(orderNumber, req.query);
        sendResponse(res, 200, true, data, General.SUCCESS);
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
     * Check scan override request status (Epick user - for polling scan requests)
     */
    async checkScanOverrideRequest(req: AuthRequest, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            return sendResponse(res, 401, false, null, "User not authenticated");
        }

        const requestId = Number(req.params.requestId);
        if (!requestId || isNaN(requestId)) {
            return sendResponse(res, 400, false, null, "Invalid request ID");
        }

        const data = await this.epickService.checkScanOverrideRequest(requestId, userId);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get list of all complete orders ready for checker
     */
    async getCompleteOrder(req: Request, res: Response) {
        const data = await this.epickService.getCompleteOrder();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get complete order details with items, override requests, and checker status
     */
    async getCompleteOrderDetails(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.epickService.getCompleteOrderDetails(orderNumber);
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
     * Get pending override requests by order number (Distributor)
     */
    async getPendingOverrideRequestsByOrder(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.epickService.getPendingOverrideRequestsByOrder(orderNumber);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get all override requests for an order (Epick user)
     */
    async getAllOverrideRequests(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.epickService.getAllOverrideRequests(orderNumber);
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get approved override requests (Distributor)
     */
    async getApprovedOverrideRequests(req: Request, res: Response) {
        const data = await this.epickService.getApprovedOverrideRequests();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Get cancelled override requests (Distributor)
     */
    async getCancelledOverrideRequests(req: Request, res: Response) {
        const data = await this.epickService.getCancelledOverrideRequests();
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

    /**
     * Get all ongoing orders (Distributor/Admin)
     */
    async getOngoingOrders(req: Request, res: Response) {
        const data = await this.epickService.getOngoingOrders();
        sendResponse(res, 200, true, data, General.SUCCESS);
    }

    /**
     * Remove/delete an ongoing order (Distributor/Admin)
     */
    async removeOngoingOrder(req: Request, res: Response) {
        const orderNumber = Number(req.params.orderNumber);
        if (!orderNumber || isNaN(orderNumber)) {
            return sendResponse(res, 400, false, null, "Invalid order number");
        }

        const data = await this.epickService.removeOngoingOrder(orderNumber);
        sendResponse(res, 200, true, data, "Ongoing order removed successfully");
    }
}