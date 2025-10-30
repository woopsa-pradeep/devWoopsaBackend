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

export default router; 


