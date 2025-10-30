// import { Customer } from '../models/customer.model';
// import { SaasCustomer } from '../models/saas.customer.model';
// import { AppError } from '../utils/AppError';
// import { Sequelize, Op } from 'sequelize';
// import { SaasCustomerPassword } from '../models/saas.customerPassword.model';
// import { SaasSetting } from '../models/saas.setting.model';
// import { IUserSettings } from '../interfaces/user.settings.interface';
// import { SaasContact } from '../models/saas.contact.model';
// import { ContactUsInfo } from '../interfaces/contactusinfo.interface';
// import { SaasWareHouseImage } from '../models/saas.wareHouseImages.mode';
// import { ImagePathsInfo } from '../interfaces/imagePathsInfo.interface';
// import { SaasCustomerDeviceRegistration } from '../models/saas.customerDeviceRegistration.model';
// import { SaasCustomerDevice } from '../models/saas.customerDevice.model';
// import { SaasClient } from '../models/saas.client.model';
// import { Clients } from '../interfaces/clients.interface';

// import axios from 'axios';
// import { User, General, Manager } from '../constants';

// export class UserService {
//   async checkCustomerId(cNumber: number): Promise<object> {
//     let customerdata = await SaasCustomer.findOne({
//       where: { CustomerId: cNumber },
//       include: [
//         {
//           model: Customer,
//           required: true,
//           where: { CInactive: false },
//         },
//       ],
//     });

//     if (!customerdata) {
//       const mainCustomer = await Customer.findOne({
//         where: {
//           CNumber: cNumber,
//           CInactive: false,
//         },
//       });

//       if (mainCustomer) {
//         await SaasCustomer.create({
//           CustomerId: mainCustomer.CNumber,
//           CustomerIdwc: mainCustomer.CNumber,
//           CustomerName: mainCustomer.CName,
//           CustomerEmailCurrent: mainCustomer.CEmail,
//           CustomerPhoneCurrent: mainCustomer.CPhone,
//           CustomerMaxCredit: parseFloat(mainCustomer.CreditLimit?.toString() || '0'),
//           CustomerStatus: 0,
//           CustomerFirebaseUserId: 0,
//         });

//         customerdata = await SaasCustomer.findOne({
//           where: { CustomerId: mainCustomer.CNumber },
//         });

//         if (!customerdata) {
//           throw new AppError(Manager.CUSTOMER_NOT_FOUND, 500);
//         }
//       } else {
//         return {
//           IsExists: false,
//           IsRegistered: false,
//           Message: `${Manager.CUSTOMER_NOT_FOUND} : ${cNumber}`,
//         };
//       }
//     }

//     if (customerdata.CustomerStatus === 1) {
//       return {
//         IsExists: true,
//         IsRegistered: true,
//         Message: `${User.USER_REGISTERED_SUCCESS} : ${cNumber}`,
//         phoneNumber: customerdata.CustomerPhoneCurrent,
//       };
//     } else {
//       return {
//         IsExists: true,
//         IsRegistered: false,
//         Message: `${User.ACCOUNT_INACTIVE} : ${cNumber}`,
//         phoneNumber: customerdata.CustomerPhoneCurrent,
//       };
//     }
//   }

//   async checkEmailId(cNumber: number, email: string): Promise<[boolean, string]> {
//     const customerData = await SaasCustomer.findOne({
//       where: {
//         CustomerId: { [Op.ne]: cNumber },
//         CustomerEmailCurrent: email,
//       },
//     });

//     if (!customerData) {
//       return [true, User.EMAIL_REQUIRED];
//     } else {
//       return [false, User.EMAIL_ALREADY_EXISTS];
//     }
//   }

//   async checkUserName(cNumber: number, username: string, registrationscreen: boolean): Promise<[boolean, string]> {
//     if (!registrationscreen) {
//       const customerdata = await SaasCustomerPassword.findOne({
//         where: { CustomerId: cNumber, UserName: username },
//       });

//       if (!customerdata) {
//         return [false, User.USER_NOT_FOUND];
//       } else {
//         return [true, User.USER_REGISTERED_SUCCESS];
//       }
//     } else {
//       const customerdata2 = await SaasCustomerPassword.findOne({
//         where: { CustomerId: { [Op.ne]: cNumber }, UserName: username },
//       });

//       if (!customerdata2) {
//         return [true, General.SUCCESS];
//       } else {
//         return [false, User.USER_ALREADY_EXISTS];
//       }
//     }
//   }

//   async getUserSettings(): Promise<IUserSettings[]> {
//     const settings = await SaasSetting.findAll({
//       attributes: ['MyKey', 'Key', 'Value', 'IsErpconfig', 'IsEmailConfig'],
//     });

//     return settings.map((s) => ({
//       MyKey: s.MyKey,
//       Key: s.Key,
//       Value: s.Value,
//       IsErpconfig: s.IsErpconfig,
//       IsEmailConfig: s.IsEmailConfig,
//     }));
//   }

//   async updateUserSettings(key: string, value: string): Promise<boolean> {
//     const setting = await SaasSetting.findOne({ where: { Key: key } });

//     if (setting) {
//       const finalValue =
//         value.toLowerCase() === 'true'
//           ? 'True'
//           : value.toLowerCase() === 'false'
//             ? 'False'
//             : value;

//       setting.Value = finalValue;
//       await setting.save();

//       if (key === 'CustomerMaxOrderLimit') {
//         const newOrderLimit = parseInt(value);
//         if (isNaN(newOrderLimit)) {
//           throw new AppError(Manager.RECORD_NOT_FOUND, 400);
//         }

//         await SaasCustomer.update(
//           { OrderLimitPerDay: newOrderLimit },
//           { where: {} }
//         );
//       }

//       return true;
//     }

//     return false;
//   }

//   async getContact(contactId?: number): Promise<ContactUsInfo[]> {
//     const whereCondition = contactId && contactId !== 0 ? { ContactId: contactId } : {};

//     const contacts = await SaasContact.findAll({
//       where: whereCondition,
//       attributes: ['ContactId', 'PhoneNumber', 'Email', 'WhatsAppNumber', 'Address'],
//     });

//     return contacts.map((c) => ({
//       ContactId: c.ContactId,
//       PhoneNumber: c.PhoneNumber,
//       Email: c.Email,
//       WhatsAppNumber: c.WhatsAppNumber,
//       Address: c.Address,
//     }));
//   }

//   async getWareHouseBanner(): Promise<ImagePathsInfo> {
//     const imagePaths = await SaasWareHouseImage.findAll({
//       where: {
//         IsActive: true,
//         IsDeleted: false,
//       },
//       attributes: ['ImagePath'],
//     });

//     return {
//       imagePaths: imagePaths.map((img) => img.ImagePath),
//     };
//   }

//   async checkActiveStatus(ClientUniqueId: string, token: string): Promise<[boolean, string]> {
//     const host = process.env.CDT_HOST;
//     if (!host) return [false, General.FAIL];

//     const requestUrl = `${host}Customer/CheckSubClientActiveStatus?uniqueId=${ClientUniqueId}`;
//     try {
//       const response = await axios.get<{ data: boolean; message: string }>(requestUrl, {
//         headers: { Authorization: token || '' },
//         validateStatus: () => true,
//       });

//       if (response.status === 500) return [false, General.FAIL];
//       if (response.status === 401) return [false, User.ACCOUNT_BLOCKED];
//       if (response.status < 200 || response.status >= 300) return [false, General.FAIL];

//       const { data, message } = response.data;
//       return data !== undefined && message !== undefined
//         ? [data, message]
//         : [false, Manager.RECORD_NOT_FOUND];
//     } catch {
//       return [false, General.FAIL];
//     }
//   }

//   async loginDeviceRegistration(loginDevice: {
//     CustomerId: number;
//     DeviceId: string;
//     DeviceType: string;
//     ApprovedBy?: number;
//   }): Promise<[boolean, string]> {
//     const TestcustomerId = parseInt(process.env.TEST_CUSTOMER_ID || '0');

//     const existing = await SaasCustomerDeviceRegistration.findOne({
//       where: {
//         CustomerId: loginDevice.CustomerId,
//         DeviceType: loginDevice.DeviceType,
//         DeviceId: loginDevice.DeviceId,
//       },
//     });

//     const count = await SaasCustomerDeviceRegistration.count({
//       where: { CustomerId: loginDevice.CustomerId },
//     });

//     const sessionCount = await SaasCustomerDeviceRegistration.count({
//       where: {
//         CustomerId: loginDevice.CustomerId,
//         IsSessionActive: true,
//         DeviceId: { [Op.ne]: loginDevice.DeviceId },
//       },
//     });

//     const isApproved = (d: any) => d?.IsApproved === true;

//     if (existing) {
//       if (count < 2 && existing.ApprovedBy == null) {
//         const session = await SaasCustomerDeviceRegistration.findOne({
//           where: {
//             CustomerId: loginDevice.CustomerId,
//             DeviceType: loginDevice.DeviceType,
//             DeviceId: { [Op.ne]: loginDevice.DeviceId },
//             IsSessionActive: true,
//           },
//         });

//         if (session) {
//           return [false, User.SESSION_ALREADY_ACTIVE];
//         }

//         await SaasCustomerDeviceRegistration.create({
//           ...loginDevice,
//           IsApproved: true,
//           IsSessionActive: true,
//           UpdatedOn: new Date(),
//         });

//         return [true, User.LOGIN_SUCCESS];
//       }

//       if (TestcustomerId === loginDevice.CustomerId) {
//         existing.IsApproved = true;
//         existing.IsSessionActive = true;
//         await existing.save();
//         return [true, User.LOGIN_SUCCESS];
//       }

//       const otherSession = await SaasCustomerDeviceRegistration.findOne({
//         where: {
//           CustomerId: loginDevice.CustomerId,
//           DeviceType: loginDevice.DeviceType,
//           DeviceId: { [Op.ne]: loginDevice.DeviceId },
//           IsSessionActive: true,
//         },
//       });

//       if (!isApproved(existing)) {
//         return [false, User.DEVICE_APPROVAL_PENDING];
//       } else if (otherSession) {
//         return [false, User.SESSION_ALREADY_ACTIVE];
//       } else {
//         existing.IsSessionActive = true;
//         await existing.save();
//         return [true, User.LOGIN_SUCCESS];
//       }
//     }

//     const newDevice = SaasCustomerDeviceRegistration.build({
//       ...loginDevice,
//       IsApproved: TestcustomerId === loginDevice.CustomerId,
//       IsSessionActive: TestcustomerId === loginDevice.CustomerId,
//       ApprovedBy: null,
//       UpdatedOn: new Date(),
//     });

//     await newDevice.save();

//     return newDevice.IsApproved
//       ? [true, User.LOGIN_SUCCESS]
//       : [false, User.DEVICE_APPROVAL_PENDING];
//   }

//   async loginDeviceSessionInActive(loginDevice: {
//     CustomerId: number;
//     DeviceType: string;
//     DeviceId: string;
//   }): Promise<boolean> {
//     const device = await SaasCustomerDeviceRegistration.findOne({
//       where: loginDevice,
//     });

//     if (device) {
//       device.IsSessionActive = false;
//       await device.save();

//       const cust = await SaasCustomerDevice.findOne({
//         where: { CustomerId: loginDevice.CustomerId },
//       });

//       if (cust) {
//         cust.IsActive = false;
//         await cust.save();
//       }

//       return true;
//     }

//     return false;
//   }

//   async getClientByWHId(id: string): Promise<Clients> {
//     const client = await SaasClient.findOne({
//       where: { WareHouseId: id.toLowerCase() },
//       attributes: ['Id', 'ClientName', 'Endpoint', 'WareHouseId', 'IsActive', 'Logo', 'ClientUniqueId'],
//     });

//     return client ? (client.get({ plain: true }) as Clients) : ({} as Clients);
//   }
// }
