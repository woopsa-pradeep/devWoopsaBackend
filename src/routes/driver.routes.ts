import { Router } from "express";
import { DriverController } from "../controllers/driver.controller";
import verifyRole from "../middlewares/verifyUser.middleware";
import { ROLES } from "../interfaces/request.body.interface";
import { catchAsync } from "../utils/catchAsync";



const router = Router(); 

const driverController = new DriverController();

router.get('/getDriverOrderList', verifyRole(ROLES.DRIVER), catchAsync(driverController.getDriverOrderList.bind(driverController)));






export default router;

