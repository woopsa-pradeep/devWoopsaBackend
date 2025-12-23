import { Router } from "express";
import { EpickController } from "../controllers/epick.controller";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { catchAsync } from "../utils/catchAsync";
import { orderPickCreateSchema } from "../validations/epik.validation";
import { validateRequest } from "../middlewares/validation.middleware";
import { multerUpload } from "../middlewares/upload.middleware";
import { hasExistingOrder, hasOrderTakenByOtherPicker } from "../middlewares/epick.middleware";


const router = Router(); 
 const epickController = new EpickController();
 router.get('/getOrder',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getOrder.bind(epickController)));
 router.get('/getOrderBox/:orderNumber',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getOrderBox.bind(epickController)));
 router.get('/getOrderItem/:orderNumber',verifyRole(ROLES.EPIK, ROLES.SALES),hasOrderTakenByOtherPicker,catchAsync(epickController.getOrderItem.bind(epickController)));
 router.get('/getOrderItemFirst/:orderNumber',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getOrderItemFirst.bind(epickController)));
 router.post('/addProductInBox',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.addProductInBox.bind(epickController)));
 router.post('/addProductsInBoxBatch',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.addProductsInBoxBatch.bind(epickController)));
 router.post('/addOrderBox',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.addOrderBox.bind(epickController)));
 router.post('/acceptOrder',verifyRole(ROLES.EPIK, ROLES.SALES),validateRequest(orderPickCreateSchema),hasExistingOrder,hasOrderTakenByOtherPicker,catchAsync(epickController.acceptOrder.bind(epickController)));
 router.post('/addImagesNotes/:id',verifyRole(ROLES.EPIK, ROLES.SALES),multerUpload.array('images'),catchAsync(epickController.addImagesNotes.bind(epickController)));
 router.put('/OrderCompleted/:id',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.OrderCompleted.bind(epickController)));
 router.get('/getUserHistory',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getUserHistory.bind(epickController)));
 router.get('/getOrderDetailByOrderNumber/:orderNumber',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getOrderDetailByOrderNumber.bind(epickController)));
 router.get('/getOrderDetailsByOrderNumber/:orderNumber',verifyRole( ROLES.MANAGER),catchAsync(epickController.getOrderDetailsByOrderNumber.bind(epickController)));
router.get('/getUserCurrentOrder',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getUserCurrentOrder.bind(epickController)));
router.get('/getItemAsPerBox/:boxId',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getIntemDataAsPerBox.bind(epickController)));
router.get('/getOrderSummary/:orderNumber',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getOrderSummary.bind(epickController)));
router.get('/getCompleteOrder',verifyRole(ROLES.MANAGER),catchAsync(epickController.getCompleteOrder.bind(epickController)));
router.get('/getCompleteOrderDetails/:orderNumber',verifyRole(ROLES.MANAGER),catchAsync(epickController.getCompleteOrderDetails.bind(epickController)));


//reports 
 router.get('/getReportDate',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getReportDate.bind(epickController)));
 router.get('/getReportById/:id',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getReportById.bind(epickController)));
 router.get('/getUserReportWithDateRange',verifyRole(ROLES.MANAGER),catchAsync(epickController.getUserReportWithDateRange.bind(epickController)));
 router.post('/getSubsituteProduct',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getSubsituteProduct.bind(epickController)));
 router.post('/addSubsituteProduct',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.addSubsituteProduct.bind(epickController)));
 router.post('/putPassScanItem',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.putPassScanItem.bind(epickController)));
 router.post('/checkPin',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.checkPin.bind(epickController)));

// Override Request routes
router.post('/createOverrideRequest',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.createOverrideRequest.bind(epickController)));
router.post('/createScanOverrideRequest',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.createScanOverrideRequest.bind(epickController)));
router.get('/checkOverrideRequest/:requestId',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.checkOverrideRequest.bind(epickController)));
router.get('/checkScanOverrideRequest/:requestId',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.checkScanOverrideRequest.bind(epickController)));
router.get('/getAllOverrideRequests/:orderNumber',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.getAllOverrideRequests.bind(epickController)));
router.get('/getAllOverrideRequestsForEpick/:orderNumber',verifyRole(ROLES.EPIK),catchAsync(epickController.getAllOverrideRequestsForEpick.bind(epickController)));
router.post('/cancelOverrideRequest/:requestId',verifyRole(ROLES.EPIK, ROLES.SALES),catchAsync(epickController.cancelOverrideRequest.bind(epickController)));

router.put('/requestAllStatusOverride/:orderNumber',verifyRole( ROLES.MANAGER),catchAsync(epickController.requestAllStatusOverride.bind(epickController)));


export default router;
