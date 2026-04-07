import { Router } from 'express';
import { LiteDriverController } from '../controllers/liteDriver.controller';
import verifyRole from '../middlewares/verifyUser.middleware';
import { ROLES } from '../interfaces/request.body.interface';
import { catchAsync } from '../utils/catchAsync';
import { validateQuery, validateRequest } from '../middlewares/validation.middleware';
import {
  getCustomerForLatLongQuerySchema,
  setCustomerLatLongSchema,
} from '../validations/liteDriver.validation';


const router = Router();
const liteDriverController = new LiteDriverController();

router.get(
  '/getCustomerForLatLong',
  verifyRole(ROLES.DRIVER),
  validateQuery(getCustomerForLatLongQuerySchema),
  catchAsync(liteDriverController.getCustomerForLatLong.bind(liteDriverController))
);

router.get(
  '/getCustomerByCNumber',
  verifyRole(ROLES.DRIVER),
  catchAsync(liteDriverController.getCustomerByCNumber.bind(liteDriverController))
);

router.post(
  '/setCustomerLatLong',
  verifyRole(ROLES.DRIVER),
  validateRequest(setCustomerLatLongSchema),
  catchAsync(liteDriverController.setCustomerLatLong.bind(liteDriverController))
);

export default router;
