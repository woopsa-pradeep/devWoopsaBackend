// import { mssqlSequelize, postgresSequelize } from '../db';
// import { User } from '../models/postgres';
// import { Customer } from '../models/mmsql/customer.model'; // Assuming this is your MSSQL model

// export class DualDatabaseService {
  
//   // PostgreSQL operations
//   async createPostgresUser(userData:any) {
//     try {
//       const user = await User.create(userData);
//       return user;
//     } catch (error) {
//       throw new Error(`Error creating PostgreSQL user: ${error}`);
//     }
//   }

//   async getPostgresUsers() {
//     try {
//       const users = await User.findAll({
//         where: { isActive: true }
//       });
//       return users;
//     } catch (error) {
//       throw new Error(`Error fetching PostgreSQL users: ${error}`);
//     }
//   }

//   // MSSQL operations (using existing models)
//   async getMssqlCustomers() {
//     try {
//       const customers = await Customer.findAll();
//       return customers;
//     } catch (error) {
//       throw new Error(`Error fetching MSSQL customers: ${error}`);
//     }
//   }

//   // Cross-database operations
//   async getDataFromBothDatabases() {
//     try {
//       // Execute queries on both databases concurrently
//       const [postgresUsers, mssqlCustomers] = await Promise.all([
//         User.findAll({ where: { isActive: true } }),
//         Customer.findAll()
//       ]);

//       return {
//         postgresUsers,
//         mssqlCustomers,
//         totalUsers: postgresUsers.length,
//         totalCustomers: mssqlCustomers.length
//       };
//     } catch (error) {
//       throw new Error(`Error fetching data from both databases: ${error}`);
//     }
//   }

//   // Transaction example across databases
//   async performCrossDatabaseTransaction() {
//     // Note: True cross-database transactions require special handling
//     // This is a simplified example
    
//     try {
//       // Start PostgreSQL transaction
//       const postgresTransaction = await postgresSequelize.transaction();
      
//       try {
//         // Create user in PostgreSQL
//         const user = await User.create({
//           email: 'test@example.com',
//           name: 'Test User',
//           role: 'user'
//         }, { transaction: postgresTransaction });

//         // Commit PostgreSQL transaction
//         await postgresTransaction.commit();

//         return { success: true, userId: user.id };
//       } catch (error) {
//         // Rollback PostgreSQL transaction
//         await postgresTransaction.rollback();
//         throw error;
//       }
//     } catch (error) {
//       throw new Error(`Cross-database transaction failed: ${error}`);
//     }
//   }
// }

// export default new DualDatabaseService(); 