import { Router } from "express";
import { DriverController } from "../controllers/driver.controller";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { catchAsync } from "../utils/catchAsync";
import { multerUpload } from "../middlewares/upload.middleware";
import { validateRequest, validateQuery } from "../middlewares/validation.middleware";
import { updateDriverLatLongSchema, startDeliveryRouteSchema } from "../validations/auth.validation";
import {
  createDriverExpenseSchema,
  updateDriverExpenseSchema,
  driverExpenseIdParamSchema,
  driverExpenseListQuerySchema,
  rescheduleStopParamSchema,
  reScheduleStopBodySchema,
  cancelStopParamSchema,
  cancelStopBodySchema,
  allowToCompleteStopBodySchema,
  createDeliveryRouteReturnSchema,
  setCustomerLocationSchema,
  updateTransferredStopBodySchema,
  placeReturnOrderSchema,
  updateReturnOrderSchema,
} from "../validations/driver.validation";



const router = Router();

const driverController = new DriverController();

router.get('/getDriverOrderList', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverOrderList.bind(driverController)));
router.get('/getTodayDriverOrders', verifyRole(ROLES.DRIVER), catchAsync(driverController.getTodayDriverOrders.bind(driverController)));
router.get('/startNavigation/:routeId', verifyRole(ROLES.DRIVER), catchAsync(driverController.startNavigation.bind(driverController)));
router.get('/getRouteFullDetails/:routeId', verifyRole(ROLES.DRIVER), catchAsync(driverController.getRouteFullDetails.bind(driverController)));
router.get('/getDriverDashboardDetails', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverDashboardDetails.bind(driverController)));
router.post('/previewMultiDriverRoutes', verifyRole(ROLES.DRIVER, ROLES.MANAGER), catchAsync(driverController.previewMultiDriverRoutes.bind(driverController)));
router.post('/createMultiDriverRoutes', verifyRole(ROLES.DRIVER, ROLES.MANAGER), catchAsync(driverController.createMultiDriverRoutes.bind(driverController)));
router.post(
  '/updateDriverLocation',
  verifyRole(ROLES.DRIVER),
  validateRequest(updateDriverLatLongSchema),
  catchAsync(driverController.updateDriverLatLong.bind(driverController))
);
router.put('/startDeliveryRoute', verifyRole(ROLES.DRIVER), validateRequest(startDeliveryRouteSchema), catchAsync(driverController.startDeliveryRoute.bind(driverController)));
router.post('/updateDeliveryPod/:podId', verifyRole(ROLES.DRIVER), catchAsync(driverController.updateDeliveryPod.bind(driverController)));
router.post('/uploadImages', verifyRole(ROLES.DRIVER), multerUpload.single('image'), catchAsync(driverController.uploadImages.bind(driverController)));
router.put('/updateStop/:stopId', verifyRole(ROLES.DRIVER), catchAsync(driverController.updateStop.bind(driverController)));

router.post('/orderStopCompleted/:stopId', verifyRole(ROLES.DRIVER), catchAsync(driverController.orderStopCompleted.bind(driverController)));
router.get('/getDriverCurrentOrder/:id', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverCurrentOrder.bind(driverController)));
router.get('/getDriverCurrentLocation', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverCurrentLocation.bind(driverController)));
router.get('/getTodayDriverStops', verifyRole(ROLES.DRIVER), catchAsync(driverController.getTodayDriverStops.bind(driverController)));
router.put('/updateDriverLocation', verifyRole(ROLES.DRIVER), catchAsync(driverController.updateDriverLation.bind(driverController)));
router.get('/getDriverProfile', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverProfile.bind(driverController)));
router.get('/getPaymentOptions', verifyRole(ROLES.DRIVER), catchAsync(driverController.getPaymentOptions.bind(driverController)));

router.post(
  '/expenses',
  verifyRole(ROLES.DRIVER),
  validateRequest(createDriverExpenseSchema),
  catchAsync(driverController.createDriverExpense.bind(driverController))
);
router.get(
  '/expenses',
  verifyRole(ROLES.DRIVER),
  validateQuery(driverExpenseListQuerySchema),
  catchAsync(driverController.listDriverExpenses.bind(driverController))
);
router.get(
  '/expenses/:expenseId',
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getDriverExpenseById.bind(driverController))
);
router.put(
  '/expenses/:expenseId',
  verifyRole(ROLES.DRIVER),
  validateRequest(updateDriverExpenseSchema),
  catchAsync(driverController.updateDriverExpense.bind(driverController))
);
router.delete(
  '/expenses/:expenseId',
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.deleteDriverExpense.bind(driverController))
);
router.get(
  '/currentVehicle',
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getDriverCurrentVehicle.bind(driverController))
);

router.put(
  '/reScheduleStop/:stopId',
  verifyRole(ROLES.DRIVER),
  validateRequest(reScheduleStopBodySchema),
  catchAsync(driverController.reScheduleStop.bind(driverController))
);

router.get(
  '/pendingStop/:routeId',
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getDriverPendingStop.bind(driverController))
);

router.put(
  '/cancelStop/:stopId',
  verifyRole(ROLES.DRIVER),
  validateRequest(cancelStopBodySchema),
  catchAsync(driverController.cancelStop.bind(driverController))
);


router.post(
  '/allowToCompleteStop',
  verifyRole(ROLES.DRIVER),
  validateRequest(allowToCompleteStopBodySchema),
  catchAsync(driverController.allowToCompleteStop.bind(driverController))
);

router.post(
  '/completeRoute/:routeId',
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.completeRoute.bind(driverController))
);

router.post(
  '/uploadSignature',
  verifyRole(ROLES.DRIVER),
  multerUpload.single('image'),
  catchAsync(driverController.uploadSignature.bind(driverController))
);

router.get(
  '/getDriverHistory',
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getDriverHistory.bind(driverController))
);
router.get(
  '/getDriverHistory/:routeId',
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getDriverHistoryByRouteId.bind(driverController))
);


router.get(
  "/getCustomerRouteNumber/:customerId",
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getCustomerRouteNumber.bind(driverController))
);
router.get(
  "/getDriverNearByCustomer/:routeNumber",
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getDriverNearByCustomer.bind(driverController))
);

router.post(
  "/setCustomerLocation",
  verifyRole(ROLES.DRIVER),
  validateRequest(setCustomerLocationSchema),
  catchAsync(driverController.setCustomerLocation.bind(driverController))
);

router.put(
  "/updateTransferredStop/:stopId",
  verifyRole(ROLES.DRIVER),
  validateRequest(updateTransferredStopBodySchema),
  catchAsync(driverController.updateTransferredStop.bind(driverController))
);

router.get(
  "/getOrderDetails/:orderNumber",
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.getOrderDetails.bind(driverController))
);

router.post(
  "/placeReturnOrder/:customerId",
  verifyRole(ROLES.DRIVER),
  catchAsync(driverController.placeReturnOrder.bind(driverController))
);

router.put(
  "/updateReturnOrder",
  verifyRole(ROLES.DRIVER),
  validateRequest(updateReturnOrderSchema),
  catchAsync(driverController.updateReturnOrder.bind(driverController))
);

export default router;

