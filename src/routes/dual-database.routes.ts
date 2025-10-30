import { Router } from 'express';
// import DualDatabaseController from '../controllers/dual-database.controller';

const router = Router();

// // PostgreSQL routes
// router.get('/postgres/users', DualDatabaseController.getPostgresUsers);
// router.post('/postgres/users', DualDatabaseController.createPostgresUser);

// // MSSQL routes
// router.get('/mssql/customers', DualDatabaseController.getMssqlCustomers);

// // Cross-database routes
// router.get('/both', DualDatabaseController.getDataFromBothDatabases);
// router.post('/transaction', DualDatabaseController.performCrossDatabaseTransaction);

export default router; 