import { Router } from "express";
import { ReceivableController } from "../controllers/receivable.controller";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { catchAsync } from "../utils/catchAsync";
import { validateRequest } from "../middlewares/validation.middleware";
import { loginSalesSchema } from "../validations/auth.validation";
import { acceptReceivableOrderSchema, updatePOShippingInfoSchema, completeOrderSchema } from "../validations/receivable.validation";

const router = Router();
const receivableController = new ReceivableController();

// Receivable Login
router.post('/login', validateRequest(loginSalesSchema), catchAsync(receivableController.login.bind(receivableController)));

// Get all Purchase Orders for Receivable
router.get('/orders', verifyRole(ROLES.RECEIVABLE), catchAsync(receivableController.getOrders.bind(receivableController)));

// Get Invoice_Terms (only TermsType = 1)
router.get('/invoiceTerms', verifyRole(ROLES.RECEIVABLE), catchAsync(receivableController.getInvoiceTerms.bind(receivableController)));

// Get user report with date range (completed POs only, PO_Header.Confirmed = 1)
router.get('/getUserReportWithDateRange', verifyRole(ROLES.RECEIVABLE), catchAsync(receivableController.getUserReportWithDateRange.bind(receivableController)));

// Accept Order - Lock the order
router.post('/acceptOrder', verifyRole(ROLES.RECEIVABLE), validateRequest(acceptReceivableOrderSchema), catchAsync(receivableController.acceptOrder.bind(receivableController)));

// Exit Order - Remove lock and delete ReceivablePick entry
router.post('/exitOrder', verifyRole(ROLES.RECEIVABLE), validateRequest(acceptReceivableOrderSchema), catchAsync(receivableController.exitOrder.bind(receivableController)));

router.get('/orderItems/:poNumber', verifyRole(ROLES.RECEIVABLE), catchAsync(receivableController.getOrderItems.bind(receivableController)));

// Get report by PO number - same as order items with Quantity_Recd
router.get('/getReportById/:poNumber', verifyRole(ROLES.RECEIVABLE), catchAsync(receivableController.getReportById.bind(receivableController)));

// Get first item from purchase order based on user's item_sort_by preference
router.get('/getFirstItem/:poNumber', verifyRole(ROLES.RECEIVABLE), catchAsync(receivableController.getFirstItem.bind(receivableController)));

// Get user's current order (if any)
router.get('/getUserCurrentOrder', verifyRole(ROLES.RECEIVABLE), catchAsync(receivableController.getUserCurrentOrder.bind(receivableController)));

// Update PO Shipping Info
router.put('/poshippinginfo', verifyRole(ROLES.RECEIVABLE), validateRequest(updatePOShippingInfoSchema), catchAsync(receivableController.updatePOShippingInfo.bind(receivableController)));

// Complete Order - Update Quantity_Recd per item, set PO Confirmed=1, remove lock
router.post('/completeOrder', verifyRole(ROLES.RECEIVABLE), validateRequest(completeOrderSchema), catchAsync(receivableController.completeOrder.bind(receivableController)));

export default router;
