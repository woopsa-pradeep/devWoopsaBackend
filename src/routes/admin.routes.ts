import { Router } from "express";
import { AdminController } from "../controllers/admin.controlleer";
import { catchAsync } from "../utils/catchAsync";
import { ROLES } from "../interfaces/request.body.interface";
import verifyRole from "../middlewares/verifyUser.middleware";

const router = Router();
const adminController = new AdminController();

router.get(
  '/orders-by-source',
//   verifyRole(ROLES.MANAGER),
  catchAsync(adminController.getOrdersBySource.bind(adminController))
);

export default router;
