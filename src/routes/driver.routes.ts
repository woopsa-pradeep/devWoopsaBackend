import { Router } from "express";
import { DriverController } from "../controllers/driver.controller";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { catchAsync } from "../utils/catchAsync";
import { multerUpload } from "../middlewares/upload.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { updateDriverLatLongSchema } from "../validations/auth.validation";



const router = Router(); 

const driverController = new DriverController();

router.get('/getDriverOrderList', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverOrderList.bind(driverController)));
router.get('/getTodayDriverOrders', verifyRole(ROLES.DRIVER), catchAsync(driverController.getTodayDriverOrders.bind(driverController)));
router.get('/startNavigation/:routeId', verifyRole(ROLES.DRIVER), catchAsync(driverController.startNavigation.bind(driverController)));
router.get('/getRouteFullDetails/:routeId', verifyRole(ROLES.DRIVER), catchAsync(driverController.getRouteFullDetails.bind(driverController)));
router.get('/getDriverDashboardDetails', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverDashboardDetails.bind(driverController)));
router.post('/previewMultiDriverRoutes', verifyRole(ROLES.DRIVER,ROLES.MANAGER), catchAsync(driverController.previewMultiDriverRoutes.bind(driverController)));
router.post('/createMultiDriverRoutes', verifyRole(ROLES.DRIVER,ROLES.MANAGER), catchAsync(driverController.createMultiDriverRoutes.bind(driverController)));
router.post(
  '/updateDriverLatLong',
  verifyRole(ROLES.DRIVER),
  validateRequest(updateDriverLatLongSchema),
  catchAsync(driverController.updateDriverLatLong.bind(driverController))
);


export default router;

