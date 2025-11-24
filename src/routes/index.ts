import {  Router } from 'express';
import authRoutes from './auth.router'
import retailerRoute from "./retailer.routes"
import dualDatabaseRoutes from "./dual-database.routes"
import managerRoutes from './manager.router'
import listRoutes from './list.routes';
import salesRoutes from './sales.routes';
import dashboardRoutes from './dashboard.routes';
import homeRoutes from './home.router';
import epickRoutes from     './epick.router';
import checkerRoutes from './checker.router';
import appUpdateRoutes from './appUpdate.routes';
import redisRoutes from './redis.routes';

const router = Router();

// User routes
router.use('/auth', authRoutes);
router.use('/retailer',retailerRoute);
router.use('/distrubutor',managerRoutes)
router.use('/dual-db', dualDatabaseRoutes);
router.use('/list',listRoutes);
router.use('/sales', salesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/home', homeRoutes);
router.use('/epick', epickRoutes);
router.use('/checker', checkerRoutes);
router.use('/app', appUpdateRoutes);
router.use('/redis', redisRoutes);
export default router; 


