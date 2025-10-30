// import { AppError } from "../utils/AppError";
// import { uploadFileToAzure } from "../utils/azureUploader";
// import { Request, Response } from "express";
// import { UserService } from "../businesslogic/user.service";
// import { General, Manager } from "../constants";

// export class UserController {
//   private userService: UserService;

//   constructor() {
//     this.userService = new UserService();
//   }

//   async checkCustomerId(req: Request, res: Response): Promise<Response> {
//     const cNumber = Number(req.params.cNumber);

//     if (cNumber === 0) {
//       return res.status(400).json({
//         success: false,
//         message: Manager.CUSTOMER_NOT_FOUND,
//       });
//     }

//     const result = await this.userService.checkCustomerId(cNumber);

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async checkEmailId(req: Request, res: Response): Promise<Response> {
//     const cNumber = Number(req.params.cNumber);
//     const emailId = req.params.emailId;

//     if (!emailId) {
//       return res.status(400).json({
//         success: false,
//         message: Manager.EMAIL_EXITS,
//       });
//     }

//     const result = await this.userService.checkEmailId(cNumber, emailId);

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async checkUserName(req: Request, res: Response): Promise<Response> {
//     const cNumber = Number(req.params.cNumber);
//     const username = req.params.username;
//     const registrationScreen = req.params.registrationscreen === "true";

//     if (!username) {
//       return res.status(400).json({
//         success: false,
//         message: Manager.NAME_EXITS,
//       });
//     }

//     const result = await this.userService.checkUserName(cNumber, username, registrationScreen);

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async getUserSettings(req: Request, res: Response): Promise<Response> {
//     const result = await this.userService.getUserSettings();
//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async updateUserSettings(req: Request, res: Response): Promise<Response> {
//     const { key, value } = req.body;

//     const result = await this.userService.updateUserSettings(key, value);

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async getContact(req: Request, res: Response): Promise<Response> {
//     const contactId =
//       req.query.contactid !== undefined ? Number(req.query.contactid) : undefined;

//     const result = await this.userService.getContact(contactId);

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async getWareHouseBanner(req: Request, res: Response): Promise<Response> {
//     const result = await this.userService.getWareHouseBanner();

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async checkActiveStatus(req: Request, res: Response): Promise<Response> {
//     const uniqueId = req.query.uniqueId as string;
//     const token = req.headers.authorization || "";

//     if (!uniqueId) {
//       return res.status(400).json({
//         success: false,
//         message: Manager.CUSTOMER_NOT_FOUND,
//       });
//     }

//     const result = await this.userService.checkActiveStatus(uniqueId, token);
//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async loginDeviceRegistration(req: Request, res: Response): Promise<Response> {
//     const loginDevice = req.body;

//     const result = await this.userService.loginDeviceRegistration(loginDevice);

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async loginDeviceSessionInActive(req: Request, res: Response): Promise<Response> {
//     const loginDevice = req.body;

//     const result = await this.userService.loginDeviceSessionInActive(loginDevice);

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }

//   async getClientByWHId(req: Request, res: Response): Promise<Response> {
//     const { id } = req.query;

//     if (!id || typeof id !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: Manager.WAREHOUSE_NOT_FOUND,
//       });
//     }

//     const result = await this.userService.getClientByWHId(id);

//     if (!result || result.Id === 0) {
//       return res.status(417).json({
//         success: false,
//         message: Manager.WAREHOUSE_NOT_FOUND,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: General.SUCCESS,
//       data: result,
//     });
//   }
// }
