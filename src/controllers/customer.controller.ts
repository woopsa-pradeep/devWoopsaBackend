// import { Request, Response } from 'express';
// import { CustomerService } from '../businesslogic/customer.service';
// import { Customer, Manager } from '../constants';
// import { decodeJWTToken } from '../utils/jwtTokenHelper';
// import { General } from '../constants';

// export class CustomerController {
//   private customerService: CustomerService;

//   constructor() {
//     this.customerService = new CustomerService();
//   }

//   async getCustomerData(req: Request, res: Response): Promise<Response> {
//     try {
//       const cNumber = parseInt(req.query.cNumber as string, 10);

//       if (!cNumber || isNaN(cNumber)) {
//         return res.status(400).json({
//           success: false,
//           message: Customer.CUSTOMER_NUMBER_REQUIRED
//         });
//       }

//       const result = await this.customerService.getCustomerData(cNumber);

//       return res.status(200).json({
//         success: true,
//         message: General.SUCCESS,
//         data: result
//       });
//     } catch (error: any) {
//       console.error('Error in getCustomerData:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Internal server error.'
//       });
//     }
//   }

//   async getCustomerList(req: Request, res: Response): Promise<Response> {
//     try {
//       const token = req.headers['authorization'] as string;
//       if (!token) {
//         return res.status(401).json({
//           success: false,
//           message: 'Authorization token is required'
//         });
//       }

//       const userId = await decodeJWTToken(token);
//       const search = (req.query.search as string) || '';
//       const routeNumber = req.query.routeNumber ? parseInt(req.query.routeNumber as string, 10) : undefined;

//       const result = await this.customerService.getCustomerList(search, userId, routeNumber);

//       return res.status(200).json({
//         success: true,
//         message: General.SUCCESS,
//         data: result
//       });
//     } catch (error: any) {
//       console.error('Error in getCustomerList:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Internal server error.'
//       });
//     }
//   }
// }
