import { Router } from "express";
import { DriverController } from "../controllers/driver.controller";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { catchAsync } from "../utils/catchAsync";
import { multerUpload } from "../middlewares/upload.middleware";



const router = Router(); 

const driverController = new DriverController();

router.get('/getDriverOrderList', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverOrderList.bind(driverController)));

router.get('/getDriverOrder', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverOrder.bind(driverController)));

router.post('/startOrder/:id', verifyRole(ROLES.DRIVER), catchAsync(driverController.startOrder.bind(driverController)));

router.get('/getCurrentOrderList', verifyRole(ROLES.DRIVER), catchAsync(driverController.getCurrentOrderList.bind(driverController)));

router.post('/updateDeliveryOrder/:id', verifyRole(ROLES.DRIVER), catchAsync(driverController.updateDeliveryOrder.bind(driverController)));

router.post('/completeOrder/:id', verifyRole(ROLES.DRIVER), catchAsync(driverController.completeOrder.bind(driverController))); 

router.get('/orderHistory', verifyRole(ROLES.DRIVER), catchAsync(driverController.orderHistory.bind(driverController)));

router.post('/uploadImages', verifyRole(ROLES.DRIVER), multerUpload.single('image'), catchAsync(driverController.uploadImages.bind(driverController)));

export default router;

