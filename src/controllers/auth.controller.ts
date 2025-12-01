import { Request, Response } from "express";
import { AuthService } from "../businesslogic/auth.service";
import { sendResponse } from "../utils/sendResponse";
import { AuthMessage, General } from "../constants";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { Operations } from "../utils/operations";
import { Customer } from "../models/mmsql/customer.model";
import { sequelize } from "../db";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async signUp(req: Request, res: Response) {
    const data = await this.authService.signUp(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

  async verifyRetailerOtp(req: Request, res: Response) {
    const data = await this.authService.verfiyRetailerOtp(req.body);
    sendResponse(res, 200, true, data, General.SUCCESS);
  }
  
  async login(req: Request, res: Response) {
  const data = await this.authService.loginUser(req.body, req); 
  sendResponse(res, 200, true, data, AuthMessage.OTP_SENT);
}


  async verfiyOtp(req: Request, res: Response) {
    const data = await this.authService.verfifyOpt(req.body,req);
    sendResponse(res, 200, true, data, AuthMessage.LOGIN_SUCCESS);
  }
  async test(req: Request, res: Response) {
    const result = await Customer.findAll({

      attributes: ['C_Number', 'C_Name']
    });

    console.log(result);
    sendResponse(res, 200, true, result, AuthMessage.LOGIN_SUCCESS);
  }

  async checkUserWareHouse(req: Request, res: Response) {
    const data = "test";
    sendResponse(res, 200, true, data, General.SUCCESS);
  }

 async forgotPassword(req: Request, res: Response) {
  const data = await this.authService.forgotPassword(req.body);
  sendResponse(res, 200, true, data, AuthMessage.FORGOT_EMAIL_SEND);
 }
 
 async resetPassword(req: Request, res: Response) { 
  const data = await this.authService.resetPasswordWord(req.body);
  sendResponse(res, 200, true, data, AuthMessage.PASSWORD_CHANGE);
 }

async loginWithPassword(req: Request, res: Response) {
  const data = await this.authService.loginUserWithPassword(req.body, req);
  sendResponse(res, 200, true, data, AuthMessage.LOGIN_SUCCESS);
}
 async verifyToken(req: Request, res: Response) {
  const data = await this.authService.verifyToken(req.body.token);
  if(data) sendResponse(res, 200, true, data, General.SUCCESS);
  else sendResponse(res, 403, false, data, General.FAIL);
 }

  async loginSalesUser(req: Request, res: Response) {
    const data = await this.authService.loginSalesUser(req.body);
    sendResponse(res, 200, true, data, AuthMessage.LOGIN_SUCCESS);
  }

  async epikLogin(req: Request, res: Response) {
    const data = await this.authService.epikLogin(req.body);
    sendResponse(res, 200, true, data, AuthMessage.LOGIN_SUCCESS);
  }

  async checkerLogin(req: Request, res: Response) {
      const data = await this.authService.checkerLogin(req.body);
      sendResponse(res, 200, true, data, AuthMessage.LOGIN_SUCCESS);
  }
  

  async changePassword(req: AuthRequest, res: Response) {
  const data = await this.authService.changePassword(req.body, req);
  sendResponse(res, 200, true, data, AuthMessage.PASSWORD_CHANGED);
}
async logout(req: AuthRequest, res: Response) {
  const data = await this.authService.logoutRetailer(req);
  sendResponse(res, 200, true, data, AuthMessage.LOGOUT_SUCCESS);
}
async deleteAccount(req: AuthRequest, res: Response) {
  const data = await this.authService.deleteAccount(req);
  sendResponse(res, 200, true, data, "Account deactivated successfully.");
}
async resendOtp(req: AuthRequest, res: Response) {
  const data = await this.authService.resendOpt(req.body);
  sendResponse(res, 200, true, data, "OTP sent successfully.");
}

async getServerDetail(req: Request, res: Response) {
  const data = await this.authService.getServerDetail(req.params.serverId);
  sendResponse(res, 200, true, data, General.SUCCESS);
}
}
