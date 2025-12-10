import { Router } from 'express';
import verifyRole from '../middlewares/verifyUser.middleware';
import { ROLES } from '../interfaces/request.body.interface';
import { catchAsync } from '../utils/catchAsync';
import { DashboardController } from '../controllers/dashboard.controller';
import verifyToken from '../middlewares/verifyToken.middleware';
const router = Router();


const dashboardController = new DashboardController();

// router.post('/distributorDashboard',verifyRole(ROLES.MANAGER),catchAsync(dashboardController.getDistributorDashboard.bind(dashboardController)));
router.post('/distributorDashboard',catchAsync(dashboardController.getDistributorDashboardV1.bind(dashboardController)));
router.post('/epickDashboard',catchAsync(dashboardController.getEpickDashboard.bind(dashboardController)));
router.get('/discountedItems',verifyToken,catchAsync(dashboardController.getDiscountedItems.bind(dashboardController)));
router.get('/newItem',verifyToken,catchAsync(dashboardController.getNewItem.bind(dashboardController)));
router.get('/popularItems',verifyToken,catchAsync(dashboardController.getPopularItems.bind(dashboardController)));
router.get('/promotedItems',verifyToken,catchAsync(dashboardController.getPromotedItems.bind(dashboardController)));
router.get('/topProductForSales',verifyRole(ROLES.SALES,ROLES.CHECKER),catchAsync(dashboardController.getTopProductForSales.bind(dashboardController)));
 
export default router; 