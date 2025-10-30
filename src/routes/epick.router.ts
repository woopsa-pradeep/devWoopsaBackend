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
 router.get('/getOrder',verifyRole(ROLES.EPIK),catchAsync(epickController.getOrder.bind(epickController)));
 router.get('/getOrderBox/:orderNumber',verifyRole(ROLES.EPIK),catchAsync(epickController.getOrderBox.bind(epickController)));
 router.get('/getOrderItem/:orderNumber',verifyRole(ROLES.EPIK),hasOrderTakenByOtherPicker,catchAsync(epickController.getOrderItem.bind(epickController)));
 router.post('/addProductInBox',verifyRole(ROLES.EPIK),catchAsync(epickController.addProductInBox.bind(epickController)));
 router.post('/addOrderBox',verifyRole(ROLES.EPIK),catchAsync(epickController.addOrderBox.bind(epickController)));
 router.post('/acceptOrder',verifyRole(ROLES.EPIK),validateRequest(orderPickCreateSchema),hasExistingOrder,hasOrderTakenByOtherPicker,catchAsync(epickController.acceptOrder.bind(epickController)));
 router.post('/addImagesNotes/:id',verifyRole(ROLES.EPIK),multerUpload.array('images'),catchAsync(epickController.addImagesNotes.bind(epickController)));
 router.put('/OrderCompleted/:id',verifyRole(ROLES.EPIK),catchAsync(epickController.OrderCompleted.bind(epickController)));
 router.get('/getUserHistory',verifyRole(ROLES.EPIK),catchAsync(epickController.getUserHistory.bind(epickController)));
 router.get('/getOrderDetailByOrderNumber/:orderNumber',verifyRole(ROLES.EPIK),catchAsync(epickController.getOrderDetailByOrderNumber.bind(epickController)));
router.get('/getUserCurrentOrder',verifyRole(ROLES.EPIK),catchAsync(epickController.getUserCurrentOrder.bind(epickController)));
router.get('/getItemAsPerBox/:boxId',verifyRole(ROLES.EPIK),catchAsync(epickController.getIntemDataAsPerBox.bind(epickController)));
router.get('/getOrderSummary/:orderNumber',verifyRole(ROLES.EPIK),catchAsync(epickController.getOrderSummary.bind(epickController)));


//reports 
 router.get('/getReportDate',verifyRole(ROLES.EPIK),catchAsync(epickController.getReportDate.bind(epickController)));
 router.get('/getReportById/:id',verifyRole(ROLES.EPIK),catchAsync(epickController.getReportById.bind(epickController)));
export default router;
