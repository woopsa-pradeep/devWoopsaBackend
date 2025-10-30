// import { Request, Response } from 'express';
// import DualDatabaseService from '../businesslogic/dual-database.service';
// import { sendResponse } from '../utils/sendResponse';

// export class DualDatabaseController {
  
//   // Get users from PostgreSQL
//   async getPostgresUsers(req: Request, res: Response) {
//     try {
//       const users = await DualDatabaseService.getPostgresUsers();
//       return sendResponse(res, 200, true, users, 'PostgreSQL users retrieved successfully');
//     } catch (error) {
//       return sendResponse(res, 500, false, null, error as string);
//     }
//   }

//   // Create user in PostgreSQL
//   async createPostgresUser(req: Request, res: Response) {
//     try {
//       const { email, name, role } = req.body;
      
//       if (!email || !name) {
//         return sendResponse(res, 400, false, null, 'Email and name are required');
//       }

//       const user = await DualDatabaseService.createPostgresUser({ email, name, role });
//       return sendResponse(res, 201, true, user, 'PostgreSQL user created successfully');
//     } catch (error) {
//       return sendResponse(res, 500, false, null, error as string);
//     }
//   }

//   // Get customers from MSSQL
//   async getMssqlCustomers(req: Request, res: Response) {
//     try {
//       const customers = await DualDatabaseService.getMssqlCustomers();
//       return sendResponse(res, 200, true, customers, 'MSSQL customers retrieved successfully');
//     } catch (error) {
//       return sendResponse(res, 500, false, null, error as string);
//     }
//   }

//   // Get data from both databases
//   async getDataFromBothDatabases(req: Request, res: Response) {
//     try {
//       const data = await DualDatabaseService.getDataFromBothDatabases();
//       return sendResponse(res, 200, true, data, 'Data retrieved from both databases successfully');
//     } catch (error) {
//       return sendResponse(res, 500, false, null, error as string);
//     }
//   }

//   // Perform cross-database transaction
//   async performCrossDatabaseTransaction(req: Request, res: Response) {
//     try {
//       const result = await DualDatabaseService.performCrossDatabaseTransaction();
//       return sendResponse(res, 200, true, result, 'Cross-database transaction completed successfully');
//     } catch (error) {
//       return sendResponse(res, 500, false, null, error as string);
//     }
//   }
// }

// export default new DualDatabaseController(); 