// import { Sequelize, Op } from 'sequelize';
// import { Customer } from '../models/customer.model';
// import { SaasCustomer } from '../models/saas.customer.model';
// import { SaasCustomerPassword } from '../models/saas.customerPassword.model';
// import { CustomerRoute } from '../models/customerRoute.model';
// import { Route } from '../models/route.model';
// import { SaasUser } from '../models/saas.user.model';
// import { ICustomerResponse } from '../interfaces/customer.response.interface';
// import { ICustomerForSales } from '../interfaces/customer.sales.interface';
// import { SaasCustomerDeviceRegistration } from '../models/saas.customerDeviceRegistration.model';
// import { ISaasCustomerDeviceRegistrationAttributes } from '../interfaces/saas.customerDeviceRegistration.interface'; 
// import { CustReceivable } from '../models/custReceivables.model';
// import { ArDeposits } from '../models/arDeposits.model';
// import { SaasDroNotifications } from '../models/saas.droNotifications.model';
// import { CustomerListItem } from '../interfaces/customer.listitem.interface';
// import {
//   ICustReceivable,
//   ICustReceivablesResponse,
// } from '../interfaces/custReceivables.interface';


// export class CustomerService {
//   async getCustomerData(cNumber: number): Promise<ICustomerResponse[]> {
//     const customers = await Customer.findAll({
//       where: { CNumber: cNumber },
//       attributes: [
//         ['CNumber', 'SaasCustomerId'],
//         ['CName', 'CustomerName'],
//         ['CEmail', 'CustomerEmail'],
//         ['CPhone', 'CustomerPhone'],
//         ['CreditLimit', 'CustomerMaxCredit'],
//         ['CNumber', 'CustomerId'],
//         [Sequelize.literal("ISNULL(CAddress, '') + '_' + ISNULL(CCity, '') + '_' + ISNULL(CCountry, '')"), 'CustomerAddress'],
//       ],
//       include: [
//         {
//           model: SaasCustomer,
//           as: 'SaasCustomer',
//           required: false,
//           attributes: [
//             ['CustomerEmailCurrent', 'CustomerEmailCurrent'],
//             ['CustomerPhoneCurrent', 'CustomerPhoneCurrent']
//           ],
//           include: [
//             {
//               model: SaasCustomerPassword,
//               as: 'PasswordData',
//               required: false,
//               attributes: []              
//             }
//           ]
//         }
//       ]
//     });

//     return customers.map((c) => c.get({ plain: true }) as unknown as ICustomerResponse);
//   }

//   async getCustomerList(search: string, byUserId: number, routeNumber?: number): Promise<ICustomerForSales[]> {
//     let customers: CustomerListItem[] = await Customer.findAll({
//       where: { CInactive: false },
//       attributes: [
//         ['CSalesman', 'CSalesman'],
//         ['CNumber', 'CustomerNumber'],
//         [Sequelize.literal("CAST(CNumber AS VARCHAR) + '_' + ISNULL(LTRIM(RTRIM(CName)), CAST(CNumber AS VARCHAR))"), 'CustomerName']
//       ],
//       raw: true
//     }) as unknown as CustomerListItem[];

//     if (routeNumber) {
//       customers = await Customer.findAll({
//         where: { CInactive: false },
//         include: [
//           {
//             model: CustomerRoute,
//             where: { RouteNumber: routeNumber },
//             required: true,
//             include: [
//               {
//                 model: Route,
//                 where: { RouteNumber: routeNumber },
//                 required: true
//               }
//             ]
//           }
//         ],
//         attributes: [
//           ['CSalesman', 'CSalesman'],
//           ['CNumber', 'CustomerNumber'],
//           [Sequelize.literal("CAST(Customer.CNumber AS VARCHAR) + '_' + ISNULL(LTRIM(RTRIM(Customer.CName)), CAST(Customer.CNumber AS VARCHAR))"), 'CustomerName']
//         ],
//         raw: true
//       }) as unknown as CustomerListItem[];
//     }

//     if (search) {
//       if (/^\d+$/.test(search)) {
//         customers = customers.filter((c) => c.CustomerNumber.toString().includes(search));
//       } else {
//         customers = customers.filter((c) => c.CustomerName.toLowerCase().includes(search.toLowerCase()));
//       }
//     }

//     return [
//       {
//         CustomerNumberList: customers.map((c) => c.CustomerNumber),
//         CustomerNameList: customers.map((c) => c.CustomerName)
//       }
//     ];
//   }

//   async deactivateCustomer(cNumber: number): Promise<boolean> {
//     const customer = await SaasCustomer.findOne({
//       where: { CustomerId: cNumber },
//     });

//     if (customer) {
//       customer.CustomerStatus = 0;
//       await customer.save();
//       return true;
//     }

//     return false;
//   }

//   async getSessionAndApprovalStatusOfCustomer(cNumber: number, deviceId: string): Promise<boolean> {
//     const registration: ISaasCustomerDeviceRegistrationAttributes | null =
//       await SaasCustomerDeviceRegistration.findOne({
//         where: {
//           CustomerId: cNumber,
//           DeviceId: deviceId,
//         },
//       });

//     return registration?.IsSessionActive && registration.IsApproved ? true : false;
//   }

//   async getActiveStatusOfCustomer(cNumber: number): Promise<boolean> {
//     const customer = await Customer.findOne({
//       where: {
//         CNumber: cNumber,
//         CInactive: false,
//       },
//     });

//     return customer !== null;
//   }

//   async getCustomerActiveStatus(customerId: number): Promise<boolean> {
//     const customer = await SaasCustomer.findOne({
//       where: {
//         CustomerId: customerId,
//         CustomerStatus: {
//           [Op.ne]: 0,
//         },
//       },
//     });

//     return customer?.CustomerStatus === 1;
//   }

//   async getCustReceivables(cNumber: number): Promise<ICustReceivablesResponse> {
//     const rawReceivables = await CustReceivable.findAll({
//       where: cNumber === 0 ? {} : { CNumber: cNumber },
//       include: [
//         {
//           model: ArDeposits,
//           required: false,
//           attributes: [['DepositDate', 'ArDepositDate']],
//         },
//       ],
//       attributes: [
//         'ArAmount', 'ArApplied', 'ArArchived', 'ArBatch', 'ArCheckDate',
//         'ArDate', 'ArPos', 'ArReconcile', 'ArRef', 'ArSubType',
//         'ArType', 'CNumberChild', 'InvoiceNumber', 'UserNumber',
//         'WorkstationId', 'DepositId', 'PNumber', 'CNumber'
//       ],
//     });

//     const custRece: ICustReceivable[] = rawReceivables.map((entry: any) => entry.get({ plain: true }));

//     const customer = await Customer.findOne({
//       where: cNumber === 0 ? {} : { CNumber: cNumber },
//       attributes: ['CName'],
//     });

//     return {
//       CName: customer?.CName,
//       CustReceivables: custRece,
//     };
//   }

//   async removeNotifications(rowId: number): Promise<boolean> {
//   const notifications = await SaasDroNotifications.findAll({
//     where: { Rowid: rowId },
//   });

//   if (notifications.length > 0) {
//     await SaasDroNotifications.update(
//       { IsDeleted: true },
//       { where: { Rowid: rowId } }
//     );
//     return true;
//   }

//   return false;
// }
// }
