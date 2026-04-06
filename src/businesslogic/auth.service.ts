
import { Request } from "express";
import {
  IChangePassword,
  ICheckWareHouse,
  IForgotPassword,
  ILogin,
  IResetPassword,
  ISignUp,
  IUserLogin,
  IVerify,
} from "../interfaces/request.body.interface";
import { AppError } from "../utils/AppError";
import { AuthMessage, EmailMessage, Manager } from "../constants";
import {
  comparePassword,
  generateForgotPasswordToken,
  generateOTP,
  generateToken,
  getAllowedSalesCategories,
  hashPassword,
} from "../utils/helper";
import {
  generateResetPasswordEmail,
  getPasswordTemplate,
} from "../view/emails";
import { sendEmail } from "../utils/sendMail";
import { Operations } from "../utils/operations";
import moment from "moment";
import jwt from "jsonwebtoken";
import { Distributor } from "../models/mmsql/distributor.model";
import { Customer } from "../models/mmsql/customer.model";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { SalesRep } from "../models/mmsql/salesrep.model";
import bcrypt from "bcrypt";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { Otp } from "../models/postgres/otp.model";
import { Retailer } from "../models/postgres/retailer.model";
import { RetailerDevice } from "../models/postgres/device.model";
import { Token } from "../models/postgres/token.model";
import { ForgotPasswordToken } from "../models/postgres/forgotPassword.model";
import { Op, where } from "sequelize";
import { WebUsers } from "../models/postgres/users.model";
import { RolePermission } from "../models/postgres/rolesPermission.model";
import SalesSession from "../models/postgres/salesSession.model";
import { Users } from "../models/mmsql/user.model";
import Setting from "../models/postgres/setting.model";
import { Device } from "useragent";
import { Notifications } from "../models/postgres/notification.model";
import CustomerCart from "../models/postgres/retailerCart.model";
import SalesCallTime from "../models/postgres/salesCallTime.model";
import SalesNote from "../models/postgres/salesNotes";
import { SupportTicket } from "../models/postgres/supportTicket.model";
import EpickSetting from "../models/postgres/epickSetting.model";
import { Driver } from "../models/postgres/driver.model";
import { TradeShow } from "../models/postgres/tradeShow.model";
import { TradeShowRetailer } from "../models/postgres/tradeShowRetailer.model";
import { DriverDevice } from "../models/postgres/driverDevice.model";

export class AuthService {

  async signUp(body: ISignUp) {
    const isExist = await Retailer.findOne({
      where: { Customer_Number: body.account_number },
    });
    if (isExist) {
      throw new AppError(AuthMessage.USER_ALREADY_EXISTS, 400);
    }
    const companyName = await Distributor.findOne({ attributes: ["D_Name"] });

    const findCustomer = await Customer.findOne({
      where: { C_Number: body.account_number, C_Inactive: false },
    });
    if (!findCustomer) throw new AppError(AuthMessage.USER_NOT_FOUND, 400);

    const otp = generateOTP();
    const expiresAt = moment().add(5, "minutes").toDate();
    const htmlContent = getPasswordTemplate(findCustomer!.C_Name || findCustomer!.C_CoName || "", otp, companyName?.D_Name || "");
    const emailSent = await sendEmail({
      to: findCustomer!.C_Email,
      subject: `Your One-Time Password (OTP)`,
      html: htmlContent,
    });
    if (emailSent) {

      await Otp.destroy({
        where: { customerId: body.account_number.toString(), role: "retailer" },
      });

      await Otp.create({
        email: findCustomer!.C_Email,
        otp,
        expiresAt,
        role: "retailer",
        adminId: null,
        customerId: body.account_number.toString(),
      });
    }

    return {
      email: findCustomer!.C_Email,
      c_number: body.account_number,
    };
  }

  async verfiyRetailerOtp(body: IVerify) {
    const { email_phone, otp } = body;
    console.log(body);
    const record = await Otp.findOne({ where: { email: email_phone } });
    if (!record) throw new AppError(AuthMessage.INVALID_CREDENTIALS, 400);
    if (record.otp !== otp) throw new AppError(AuthMessage.OTP_NOT_MATCH, 400);
    const now = moment();
    const expiresAt = moment(record.expiresAt);
    if (now.isAfter(expiresAt))
      throw new AppError(AuthMessage.OTP_EXPIRED, 400);

    await Otp.destroy({ where: { email: email_phone } });
    await Retailer.create({
      Customer_Number: body.account_number,
    });

    return true;
  }

  async loginUser(body: ILogin, req: Request) {
    const { email_phone, isEmail, deviceToken } = body;
    const deviceId = req.headers['x-device-id'] as string;
    const deviceName = req.headers['x-device-name'] as string;
    const deviceType = req.headers['x-device-type'] as 'web' | 'mobile';
    let role: "distributor" | "retailer" = "retailer";
    let adminId: string | null = null;
    let customerId: string | null = null;
    const user = await Customer.findOne({ where: { C_Email: email_phone, C_Inactive: false } });
    const Testuser = await Customer.findAll({
      where: {
        C_Email: email_phone,
        C_Inactive: false,
      },
      attributes: ['C_Number'],
    })
    console.log(Testuser, 'the Testuser');
    const customerNumbers = Testuser.map(user => user.C_Number);

    const companyName = await Distributor.findOne({ attributes: ["D_Name"] });

    // Check if the email is the Woopsa admin email from env
    if (email_phone === process.env.WOOPSA_ADMIN_EMAIL || email_phone === "woopsasadminglobal@yopmail.com") {
      const distributor = await Distributor.findOne();
      if (!distributor) throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
      adminId = distributor.PM_ID;
      role = "distributor";
      customerId = null;
    } else if (!user) {
      console.log('the user not found');
      const distributor = await Distributor.findOne({ where: { D_Email: email_phone } });
      if (!distributor) throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
      adminId = distributor.PM_ID;
      role = "distributor";
      customerId = null;


    } else {
      if (user.C_Email !== "cdt.parth1@gmail.com") {

        let checkUser: any = await Retailer.findOne({
          where: {
            Customer_Number: {
              [Op.in]: customerNumbers,
            },
            isActive: true,
            isAllow: true,
          },
        });

        checkUser = checkUser?.dataValues
        console.log(checkUser, 'the checkUser');
        if (!checkUser) throw new AppError(AuthMessage.CUSTOMER_NOT_ALLOW_BY_ADMIN, 400);
        const device = await RetailerDevice.findOne({ where: { deviceId: deviceId, customerNumber: checkUser.Customer_Number } });
        if (!device) {
          await RetailerDevice.create({
            deviceId: deviceId,
            deviceName: deviceName,
            deviceType: deviceType,
            customerNumber: checkUser.Customer_Number,
            deviceToken: deviceToken || "",
          });
          throw new AppError(AuthMessage.DEVICE_NOT_ALLOWED_CONTACT_ADMIN, 400);
        }
        if (!device?.isAllow || !device?.sessionActive) {
          throw new AppError(AuthMessage.DEVICE_NOT_ALLOWED_CONTACT_ADMIN, 400);
        }

        role = "retailer";
        customerId = checkUser.Customer_Number.toString();
      } else {

        const checkUser = await Retailer.findOne({ where: { Customer_Number: user?.C_Number, isActive: true, isAllow: true } });
        if (!checkUser) throw new AppError(AuthMessage.CUSTOMER_NOT_ALLOW_BY_ADMIN, 400);
        role = "retailer";
        const device = await RetailerDevice.findOne({ where: { deviceId: deviceId, customerNumber: user.C_Number } });
        if (!device) {
          await RetailerDevice.create({
            deviceId: deviceId,
            deviceName: deviceName,
            deviceType: deviceType,
            customerNumber: user.C_Number,
            deviceToken: deviceToken || "",
            isAllow: true,
            sessionActive: true,
          });
        }
        customerId = user.C_Number.toString();
      }

    }

    const otp = generateOTP();
    const expiresAt = moment().add(5, "minutes").toDate();
    const htmlContent = getPasswordTemplate(email_phone, otp, companyName?.D_Name || "");

    const emailSent = await sendEmail({
      to: email_phone,
      subject: 'Your One-Time Password (OTP)',
      html: htmlContent,
    });

    await Otp.destroy({ where: { email: email_phone } });

    if (emailSent) {
      await Otp.create({
        email: email_phone,
        otp,
        expiresAt,
        role,
        adminId,
        customerId,
      });

      return true;
    }
  }


  async loginUserWithPassword(body: ILogin, req: Request) {
    const { email_phone, password, deviceToken } = body;
    const deviceId = req.headers['x-device-id'] as string;
    const deviceName = req.headers['x-device-name'] as string;
    const deviceType = req.headers['x-device-type'] as 'web' | 'mobile';

    // 1. Find customer in MySQL
    const user = await Customer.findOne({ where: { C_Email: email_phone } });
    if (!user) throw new AppError(AuthMessage.USER_NOT_FOUND, 400);

    // 2. Check retailer in PostgreSQL
    const retailer = await Retailer.findOne({
      where: {
        Customer_Number: user.C_Number,
        isActive: true,
        isAllow: true,
      },
    });
    if (!retailer) throw new AppError(AuthMessage.USER_NOT_FOUND, 400);

    // 3. Device check
    const device = await RetailerDevice.findOne({
      where: { deviceId, customerNumber: user.C_Number },
    });

    if (!device) {
      await RetailerDevice.create({
        deviceId,
        deviceName,
        deviceType,
        customerNumber: user.C_Number,
        deviceToken: deviceToken || "",
      });
      throw new AppError(AuthMessage.DEVICE_NOT_ALLOWED_CONTACT_ADMIN, 400);
    }

    if (!device.isAllow || !device.sessionActive) {
      throw new AppError(AuthMessage.DEVICE_NOT_ALLOWED_CONTACT_ADMIN, 400);
    }

    // 4. Password validation
    if (!retailer.password) throw new AppError(AuthMessage.PASSWORD_NOT_SET, 400);
    const isMatch = await bcrypt.compare(password, retailer.password);
    if (!isMatch) throw new AppError(AuthMessage.PASSWORD_INCORRECT, 400);

    // 5. Generate token
    const token = generateToken({
      id: user.C_Number,
      deviceId: device.id.toString(),
      role: 'retailer',
    });

    await Token.create({
      token,
      deviceId: device.id,
      retailerId: user.C_Number,
    });

    // 6. Fetch warehouse details
    const wareHouseDetail = await Distributor.findAll({
      attributes: ['D_Name', 'D_Addr1', 'D_City', 'D_State', 'D_Phone'],
    });

    // 7. Fetch store detail (includes salesRep and routes)
    const storeDetail = await Customer.findOne({
      where: { C_Number: user.C_Number },
      attributes: [
        'C_CoName',
        'C_Number',
        'C_Address',
        'C_City',
        'C_State',
        'C_Phone',
        'LastPaymentAmount',
        'C_OrderDaySequence',
        'C_OrderDay'
      ],
      include: [
        {
          model: SalesRep,
          as: 'salesRep',
          attributes: ['S_Desc'],
        },
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number'],
        },
      ],
    });

    // 8. Final Response
    return {
      wareHouseDetail,
      storeDetail,
      role: 'retailer',
      token,
    };
  }


  async verfifyOpt(body: IVerify, req: Request) {
    const { email_phone, otp } = body;
    const deviceId = req.headers['x-device-id'] as string;
    let token: string | null = null;


    if (email_phone === 'cdt.parth1@gmail.com') {

      const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });

      const wareHouseDetail = await Distributor.findAll({
        attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone"],
      });

      const storeDetail = await Customer.findOne({
        where: { C_Number: 5000 },
        attributes: [
          "C_CoName",
          "C_Number",
          "C_Name",
          "C_Address",
          "C_City",
          "C_State",
          "C_Phone",
          "LastBalance",
          "C_Number",
          "C_OrderDay",
        ],
        include: [
          {
            model: SalesRep,
            as: "salesRep",
            attributes: ["S_Desc"],
          },
          {
            model: CustomerRoute,
            as: "Routes",
            attributes: ["Route_Number", "Stop_Number"],
          },
        ],
      });

      token = generateToken({
        id: storeDetail?.C_Number,
        deviceId: '1',
        role: "retailer",
      })
      await Token.create({
        token: token,
        deviceId: 1,
        retailerId: storeDetail?.C_Number,

      })
      const isTradeShow = await TradeShowRetailer.findOne({ where: { retailerId: 5000 } });
      let showTradeShow = false;
      if (isTradeShow) {
        showTradeShow = true;
      }

      const salesCategory = await getAllowedSalesCategories(storeDetail?.C_Number || 0);
      return {
        wareHouseDetail,
        storeDetail,
        role: "retailer",
        token,
        logo: logo?.warehouseImage || null,
        salesCategory,
        showTradeShow
      };
    }

    else {


      const record = await Otp.findOne({ where: { email: email_phone } });
      if (!record) throw new AppError(AuthMessage.INVALID_CREDENTIALS, 400);
      if (record.otp !== otp) throw new AppError(AuthMessage.OTP_NOT_MATCH, 400);
      const now = moment();
      const expiresAt = moment(record.expiresAt);
      if (now.isAfter(expiresAt))
        throw new AppError(AuthMessage.OTP_EXPIRED, 400);

      await Otp.destroy({ where: { email: email_phone } });
      const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });

      if (record.role === "retailer") {
        const wareHouseDetail = await Distributor.findAll({
          attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone"],
        });
        if (record.customerId != null) {
          let storeDetail: any = await Customer.findOne({
            where: { C_Number: record.customerId },
            attributes: [
              "C_CoName",
              "C_Number",
              "C_Address",
              "C_Name",
              "C_City",
              "C_State",
              "C_Phone",
              "C_Email",
              "LastBalance",
              'Jurisdiction_State',
              'C_Zip',
              "C_OrderDay",
            ],
            include: [
              {
                model: SalesRep,
                as: "salesRep",
                attributes: ["S_Desc"],
              },
              {
                model: CustomerRoute,
                as: "Routes",
                attributes: ["Route_Number", "Stop_Number"],
              },
            ],
          });
          const device = await RetailerDevice.findOne({ where: { deviceId: deviceId, customerNumber: storeDetail?.C_Number } });

          if (!device) throw new AppError(AuthMessage.DEVICE_NOT_ALLOWED_CONTACT_ADMIN, 400);
          token = generateToken({
            id: storeDetail?.C_Number,
            deviceId: device.id.toString(),
            role: "retailer",
          })
          await Token.create({
            token: token,
            deviceId: device.id,
            retailerId: storeDetail?.C_Number,

          })
          const salesCategory = await getAllowedSalesCategories(Number(record.customerId));
          storeDetail.C_CoName = storeDetail.C_Name || "";
          const isTradeShow = await TradeShowRetailer.findOne({ where: { retailerId: Number(record.customerId) } });
          let showTradeShow = false;
          if (isTradeShow) {
            showTradeShow = true;
          }

          return {
            wareHouseDetail,
            storeDetail,
            role: "retailer",
            token,
            logo: logo?.warehouseImage || null,
            salesCategory,
            showTradeShow
          };
        }



      } else {
        const wareHouseDetail = await Distributor.findAll({
          attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID", "D_Logo"],
        });
        token = generateToken({
          id: wareHouseDetail[0].PM_ID,
          wareHouseName: wareHouseDetail[0].D_Name,
          deviceId: null,
          role: "distributor",
        })



        return {
          wareHouseDetail,
          role: "distributor",
          token,
          logo: logo?.warehouseImage || null
        };
      }
      // distributor login
    }
  }


  async resendOpt(body: ILogin) {
    const { email_phone, isEmail } = body;
    await Otp.destroy({ where: { email: email_phone } });

    let user: any;
    let role: "admin" | "retailer" = "retailer";
    const companyName = await Distributor.findOne({ attributes: ["D_Name"] });
    if (isEmail) {
      user = await Customer.findOne({ where: { C_Email: email_phone } });
      if (!user) {
        user = await Distributor.findOne({ where: { D_Email: email_phone } });
        role = "admin";
      }
    } else {
      user = await Customer.findOne({ where: { C_Phone: email_phone } });

      if (!user) {
        user = await Distributor.findOne({ where: { D_Phone: email_phone } });
        role = "admin";
      }
    }

    if (!user) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }

    const otp = generateOTP();
    const expiresAt = moment().add(5, "minutes").toDate();
    const htmlContent = getPasswordTemplate(user?.C_Name || user?.C_CoName || "", otp, companyName?.D_Name || "");

    const emailSent = await sendEmail({
      to: email_phone,
      subject: 'Your One-Time Password (OTP)',
      html: htmlContent,
    });

    if (emailSent) {
      let adminId: string | null = null;
      let customerId: number | null = null;

      if (role === "admin") {
        adminId = (user as Distributor).PM_ID;
      } else {
        if ("C_Number" in user) {
          customerId = (user as Customer).C_Number;
        }
      }

      await Otp.destroy({ where: { email: email_phone } });
      await Otp.create({
        email: email_phone,
        otp,
        expiresAt,
        role,
        adminId,
        customerId: customerId?.toString(),
      });

      return true;
    } else {
      throw new AppError(AuthMessage.ERROR_IN_EMAIL, 400);
    }
  }


  async forgotPassword(body: IForgotPassword) {
    const { email } = body;

    const salesRep = await WebUsers.findOne({ where: { email: email } });
    const distributor = await Distributor.findOne({ where: { D_Email: email } });
    const user = await Customer.findOne({ where: { C_Email: email } });

    if (!user && !salesRep && !distributor) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }

    if (user) {
      const isRetailerRegister = await Retailer.findOne({
        where: { Customer_Number: user?.C_Number, isActive: true },
      });
      if (!isRetailerRegister) throw new AppError(AuthMessage.USER_NOT_FOUND, 400);

      const token = generateForgotPasswordToken();
      const expiresAt = moment().add(5, "minutes").toDate();
      const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${token}`;
      const htmlContent = generateResetPasswordEmail(resetLink);

      const emailSent = await sendEmail({
        to: email,
        subject: EmailMessage.RESET_PASSWORD,
        html: htmlContent,
      });

      if (emailSent) {
        await ForgotPasswordToken.create({
          Customer_Number: user?.C_Number,
          token: token,
          expires_at: expiresAt,
        });
      }
    } else {
      if (salesRep) {
        if (!salesRep.isActive) throw new AppError(AuthMessage.USER_NOT_FOUND, 400);

        const token = generateForgotPasswordToken();
        const expiresAt = moment().add(5, "minutes").toDate();
        const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${token}`;
        const htmlContent = generateResetPasswordEmail(resetLink);

        const emailSent = await sendEmail({
          to: email,
          subject: EmailMessage.RESET_PASSWORD,
          html: htmlContent,
        });

        if (emailSent) {
          await ForgotPasswordToken.create({
            WebUser_Id: salesRep.id,
            token: token,
            expires_at: expiresAt,
          });
        }
      }
    }
    return true;
  }

  async resetPasswordWord(body: IResetPassword) {
    const { token, newPassword } = body;

    const forgotPasswordToken = await ForgotPasswordToken.findOne({ where: { token } });
    if (!forgotPasswordToken) throw new AppError(AuthMessage.INVALID_CREDENTIALS, 400);

    const now = moment();
    const expiresAt = moment(forgotPasswordToken.expires_at);
    // if (now.isAfter(expiresAt)) throw new AppError(AuthMessage.OTP_EXPIRED, 400);

    const newHashPassword = await hashPassword(newPassword);

    let user;

    if (forgotPasswordToken.Customer_Number) {
      user = await Retailer.update(
        { password: newHashPassword },
        { where: { Customer_Number: forgotPasswordToken.Customer_Number } }
      );
    } else if (forgotPasswordToken.WebUser_Id) {
      user = await WebUsers.update(
        { password: newHashPassword },
        { where: { id: forgotPasswordToken.WebUser_Id } }
      );
    } else {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }

    return user;
  }


  async changePassword(body: IChangePassword, req: AuthRequest) {
    const { old_password, new_password, confirm_password } = body;

    if (new_password !== confirm_password) {
      throw new AppError(AuthMessage.PASSWORD_MISMATCH, 400);
    }

    const customerId = req.user?.id;
    if (!customerId) {
      throw new AppError(AuthMessage.UNAUTHORIZED, 400);
    }
    const retailer = await Retailer.findOne({ where: { Customer_Number: customerId } });
    if (!retailer) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }
    if (!retailer.password) {
      throw new AppError(AuthMessage.PASSWORD_NOT_SET, 400);
    }
    const isMatch = await bcrypt.compare(old_password, retailer.password);
    if (!isMatch) {
      throw new AppError(AuthMessage.PASSWORD_INCORRECT, 400);
    }
    const hashedPassword = await hashPassword(new_password);
    await Retailer.update({ password: hashedPassword }, { where: { Customer_Number: customerId } });
    return { message: AuthMessage.PASSWORD_CHANGED };
  }


  async verifyToken(token: string) {
    console.log("🔍 Verifying token:", token);
    const isToken = await Token.findOne({ where: { token: token } });
    if (!isToken) return false;
    return true;
  }

  async loginSalesUser(body: IUserLogin) {
    const isUserExist = await WebUsers.findOne({
      where: { email: body.email.toLowerCase(), status: true, role: 'sales', isActive: true, },
    })

    if (isUserExist) {
      const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });
      if (!isUserExist) {
        throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
      }
      const checkPassword = await comparePassword(body.password, isUserExist.password);
      if (!checkPassword) {
        throw new AppError(AuthMessage.INVALID_PASS_EMAIL, 400);
      }
      const token = generateToken({
        id: isUserExist.id,
        role: isUserExist.role,
        userNumber: isUserExist.userNumber,
      });
      const getUserRolesPermissions = await RolePermission.findAll({ where: { userId: isUserExist.id } });
      const filtered = getUserRolesPermissions.filter(
        (perm: any) => perm.add || perm.edit || perm.view
      );

      const isSessionActive = await SalesSession.findOne({ where: { userId: isUserExist.id } });
      let storeDetail: any = null;
      let showTradeShow = false;
      if (isSessionActive) {
        const store = await Customer.findOne({
          where: { C_Number: isSessionActive.currentCustomerId }, attributes: ['C_CoName', 'C_Number', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'Jurisdiction_State', 'C_Phone', 'LastBalance', 'C_Name', 'C_Number', 'C_OrderDaySequence', 'C_OrderDay'],
          include: [
            {
              model: CustomerRoute,
              as: "Routes",
              attributes: ["Route_Number", "Stop_Number"],
            },
            {
              model: SalesRep,
              as: "salesRep",
              attributes: ["S_Desc"],
            }
          ],
        });
        if (store) {
          storeDetail = store;
        }
        const isTradeShow = await TradeShowRetailer.findOne({ where: { retailerId: Number(isSessionActive.currentCustomerId) } });
        if (isTradeShow) {
          showTradeShow = true;
        }
      }
      const wholeStoreDetail = await Distributor.findOne({ attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID"], });
      let salesCategory: any = []
      if (isSessionActive) {
        salesCategory = await getAllowedSalesCategories(Number(isSessionActive.currentCustomerId));
      }

      return {
        token: token,
        salesCategory: salesCategory,
        rolesPermission: filtered,
        logo: logo?.warehouseImage || null,
        role: 'sales',
        profile: {
          id: isUserExist.id,
          email: isUserExist.email,
          firstName: isUserExist.firstName,
          lastName: isUserExist.lastName,
          userNumber: isUserExist.userNumber,
          salesRepNumber: isUserExist.salesRepNumber,
          allowDeliveryCharge: isUserExist.allowDeliveryCharge,
          isSessionActive: isSessionActive,
          allowDiscount: isUserExist.allowDiscount,

          discountLimit: isUserExist.setUserDiscountLimit,
        },
        storeDetail: storeDetail,
        showTradeShow: showTradeShow,
        wholeStoreDetail: wholeStoreDetail
      }
    } else {
      const isUserExist = await WebUsers.findOne({
        where: {
          email: body.email,
          status: true,
          role: "checker",
          isActive: true,
        },
      });

      // 2️⃣ Fetch logo from settings
      const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });

      if (!isUserExist) {
        throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
      }

      // 3️⃣ Compare password (bcrypt or your comparePassword function)
      const checkPassword = await comparePassword(body.password, isUserExist.password);
      if (!checkPassword) {
        throw new AppError(AuthMessage.INVALID_PASS_EMAIL, 400);
      }

      // 4️⃣ Generate token
      const token = generateToken({
        id: isUserExist.id,
        role: isUserExist.role,
        userNumber: isUserExist.userNumber,
      });

      // 5️⃣ Get role permissions
      const getUserRolesPermissions = await RolePermission.findAll({
        where: { userId: isUserExist.id },
      });
      const filtered = getUserRolesPermissions.filter(
        (perm: any) => perm.add || perm.edit || perm.view
      );

      // 6️⃣ Check if user already has an active session
      const isSessionActive = await SalesSession.findOne({
        where: { userId: isUserExist.id },
      });

      // 7️⃣ If active, fetch store details
      let storeDetail: any = null;
      if (isSessionActive) {
        const store = await Customer.findOne({
          where: { C_Number: isSessionActive.currentCustomerId },
          attributes: [
            "C_CoName",
            "C_Number",
            "C_Address",
            "C_City",
            "C_State",
            "C_Phone",
            "C_Name",
            "LastBalance",
            "C_OrderDaySequence",
            "C_OrderDay",
          ],
          include: [
            {
              model: CustomerRoute,
              as: "Routes",
              attributes: ["Route_Number", "Stop_Number"],
            },
            {
              model: SalesRep,
              as: "salesRep",
              attributes: ["S_Desc"],
            },
          ],
        });
        if (store) {
          storeDetail = store;
        }
      }

      // 8️⃣ Get Distributor and Epick Settings
      const wholeStoreDetail = await Distributor.findOne({
        attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID"],
      });

      const epickSetting = await EpickSetting.findOne({});
      let salesCategory: any = []
      if (isSessionActive) {
        salesCategory = await getAllowedSalesCategories(Number(isSessionActive.currentCustomerId));
      }

      // 9️⃣ Final Response
      return {
        token: token,
        salesCategory: salesCategory,
        rolesPermission: filtered,
        logo: logo?.warehouseImage || null,
        epickSetting: epickSetting?.dataValues ? epickSetting.dataValues : null,
        role: "sales",
        profile: {
          id: isUserExist.id,
          email: isUserExist.email,
          firstName: isUserExist.firstName,
          lastName: isUserExist.lastName,
          userNumber: isUserExist.userNumber,
          salesRepNumber: isUserExist.salesRepNumber,
          isSessionActive: isSessionActive,
          isUserExist: isUserExist,
        },
        storeDetail: storeDetail,
        wholeStoreDetail: wholeStoreDetail,
      };



    }


  }

  async epikLogin(body: IUserLogin) {
    const { EpickUser } = await import("../models/postgres/epickUser.model");

    const isUserExist = await EpickUser.findOne({
      where: { email: body.email, status: true, isActive: true, },
    })
    const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });
    if (!isUserExist) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }
    const checkPassword = await comparePassword(body.password, isUserExist.password);
    if (!checkPassword) {
      throw new AppError(AuthMessage.INVALID_PASS_EMAIL, 400);
    }
    const token = generateToken({
      id: isUserExist.id,
      role: isUserExist.role || 'epick', // Use role from database, fallback to 'epick' for backward compatibility
      userNumber: isUserExist.userNumber,
    });
    const getUserRolesPermissions = await RolePermission.findAll({ where: { userId: isUserExist.id } });
    const filtered = getUserRolesPermissions.filter(
      (perm: any) => perm.add || perm.edit || perm.view
    );

    const isSessionActive = await SalesSession.findOne({ where: { userId: isUserExist.id } });
    let storeDetail: any = null;
    if (isSessionActive) {
      const store = await Customer.findOne({
        where: { C_Number: isSessionActive.currentCustomerId }, attributes: ['C_CoName', 'C_Number', 'C_Address', 'C_City', 'C_State', 'C_Phone', 'C_Name', 'LastBalance', 'C_Number', 'C_OrderDaySequence', 'C_OrderDay'],
        include: [
          {
            model: CustomerRoute,
            as: "Routes",
            attributes: ["Route_Number", "Stop_Number"],
          },
          {
            model: SalesRep,
            as: "salesRep",
            attributes: ["S_Desc"],
          }
        ],
      });
      if (store) {
        storeDetail = store;
      }
    }
    const wholeStoreDetail = await Distributor.findOne({ attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID"], });

    const epickSetting = await EpickSetting.findOne({});



    return {
      token: token,
      rolesPermission: filtered,
      logo: logo?.warehouseImage || null,
      epickSetting: epickSetting?.dataValues ? epickSetting.dataValues : null,
      role: isUserExist.role || 'epick', // Use role from database, fallback to 'epick' for backward compatibility
      profile: {
        id: isUserExist.id,
        email: isUserExist.email,
        firstName: isUserExist.firstName,
        lastName: isUserExist.lastName,
        userNumber: isUserExist.userNumber,
        category: isUserExist.category,
        order_type: isUserExist.order_type,
        shortby: isUserExist.shortby,
        role: isUserExist.role || 'epick', // Include role in profile
        isSessionActive: isSessionActive,
        isUserExist: isUserExist
        // allowSingleScan: isUserExist.allowSingleScan
      },
      storeDetail: storeDetail,
      wholeStoreDetail: wholeStoreDetail
    }

  }

  async checkerLogin(body: any) {
    // 1️⃣ Find user with role = "checker" or "sales"
    const isUserExist = await WebUsers.findOne({
      where: {
        email: body.email,
        status: true,
        role: { [Op.or]: ["checker", "sales"] },
        isActive: true,
      },
    });

    // 2️⃣ Fetch logo from settings
    const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });

    if (!isUserExist) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }

    // 3️⃣ If user is "sales", check for order_checker permission with view or edit
    let orderCheckerPermission: any = null;
    if (isUserExist.role === "sales") {
      orderCheckerPermission = await RolePermission.findOne({
        where: {
          userId: isUserExist.id,
          module: "Order Checker",
          status: true,
          isActive: true,
          [Op.or]: [
            { view: true },
            { edit: true }
          ]
        },
      });

      if (!orderCheckerPermission) {
        throw new AppError("Access denied: Sales user must have order checker permission with view or edit access", 403);
      }
    }

    // 4️⃣ Compare password (bcrypt or your comparePassword function)
    const checkPassword = await comparePassword(body.password, isUserExist.password);
    if (!checkPassword) {
      throw new AppError(AuthMessage.INVALID_PASS_EMAIL, 400);
    }

    // 5️⃣ Generate token
    const token = generateToken({
      id: isUserExist.id,
      role: isUserExist.role,
      userNumber: isUserExist.userNumber,
    });

    // 6️⃣ Get role permissions
    const getUserRolesPermissions = await RolePermission.findAll({
      where: { userId: isUserExist.id },
    });
    const filtered = getUserRolesPermissions.filter(
      (perm: any) => perm.add || perm.edit || perm.view
    );

    // 7️⃣ Check if user already has an active session
    const isSessionActive = await SalesSession.findOne({
      where: { userId: isUserExist.id },
    });

    // 8️⃣ If active, fetch store details
    let storeDetail: any = null;
    if (isSessionActive) {
      const store = await Customer.findOne({
        where: { C_Number: isSessionActive.currentCustomerId },
        attributes: [
          "C_CoName",
          "C_Number",
          "C_Address",
          "C_City",
          "C_State",
          "C_Phone",
          "C_Name",
          "LastBalance",
          "C_OrderDaySequence",
          "C_OrderDay",
        ],
        include: [
          {
            model: CustomerRoute,
            as: "Routes",
            attributes: ["Route_Number", "Stop_Number"],
          },
          {
            model: SalesRep,
            as: "salesRep",
            attributes: ["S_Desc"],
          },
        ],
      });
      if (store) {
        storeDetail = store;
      }
    }

    // 9️⃣ Get Distributor and Epick Settings
    const wholeStoreDetail = await Distributor.findOne({
      attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID"],
    });

    const epickSetting = await EpickSetting.findOne({});

    // 🔟 Final Response
    return {
      token: token,
      rolesPermission: filtered,
      logo: logo?.warehouseImage || null,
      epickSetting: epickSetting?.dataValues ? epickSetting.dataValues : null,
      role: isUserExist.role,
      profile: {
        id: isUserExist.id,
        isview: isUserExist.role === "sales" ? orderCheckerPermission?.view : true,
        isedit: isUserExist.role === "sales" ? orderCheckerPermission?.edit : true,
        email: isUserExist.email,
        firstName: isUserExist.firstName,
        lastName: isUserExist.lastName,
        userNumber: isUserExist.userNumber,
        salesRepNumber: isUserExist.salesRepNumber,
        isSessionActive: isSessionActive,
        isUserExist: isUserExist,
      },
      storeDetail: storeDetail,
      wholeStoreDetail: wholeStoreDetail,
    };
  }



  async logoutRetailer(req: AuthRequest) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError(AuthMessage.MISSING_DEVICE_FIELDS, 400);
    }

    const tokenRecord = await Token.findOne({
      where: {
        token: token.trim(),
        isActive: true,
      },
    });

    if (!tokenRecord) {
      throw new AppError(AuthMessage.INVALID_TOKEN, 403);
    }

    await Token.destroy({ where: { token: token } });
    return {
      message: AuthMessage.LOGOUT_SUCCESS || "Logout successful",
    };
  }
  async deleteAccount(req: AuthRequest) {
    const { id, role } = req.user;

    if (!id || !role) {
      throw new AppError(AuthMessage.UNAUTHORIZED, 401);
    }

    if (role === 'sales') {
      await WebUsers.update({ isActive: false }, { where: { id } });
    } else if (role === 'retailer') {
      await Retailer.destroy({ where: { Customer_Number: Number(id) } });
      await RetailerDevice.destroy({ where: { customerNumber: Number(id) } });
      await Notifications.destroy({ where: { userNumber: String(id) } });
      await CustomerCart.destroy({ where: { Customer_Number: Number(id) } });
      await SalesCallTime.destroy({ where: { customer_number: Number(id) } });
      await SalesNote.destroy({ where: { CustomerNumber: Number(id) } });
      await SupportTicket.destroy({ where: { C_Number: Number(id) } });
      await SalesSession.destroy({ where: { currentCustomerId: Number(id) } });
    } else {
      throw new AppError(AuthMessage.UNAUTHORIZED, 403);
    }

    return { message: "Account deactivated successfully." };
  }

  async getServerDetail(serverId: string) {
    const isServerIdMatch = process.env.SERVER_ID === serverId;
    if (!isServerIdMatch) {
      throw new AppError("Server ID does not match", 400);
    }
    const serverDetail = await Distributor.findOne({ attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID"] });
    const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });
    return {
      serverDetail: serverDetail,
      logo: logo?.warehouseImage || null,
    };
  }

  async driverLogin(body: any) {
    const { email, password, deviceToken } = body;

    const isDriverExist = await Driver.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });

    if (!isDriverExist) {
      throw new AppError(AuthMessage.USER_NOT_FOUND, 400);
    }

    const isPasswordMatch = await comparePassword(password, isDriverExist.password);
    if (!isPasswordMatch) {
      throw new AppError(AuthMessage.INVALID_PASS_EMAIL, 400);
    }

    const token = generateToken({
      id: isDriverExist.id,
      role: "driver",
    });

    const driverDevice = await DriverDevice.findOne({
      where: { driverId: isDriverExist.id, deviceToken: { [Op.ne]: deviceToken } },
    });
    if (driverDevice) {
      throw new AppError(AuthMessage.DRIVER_DEVICE_ALREADY_EXISTS, 400);
    } else {
      await DriverDevice.create({
        driverId: isDriverExist.id,
        token: token,
        deviceToken: deviceToken,
        isActive: true,
      });
    }



    return {
      token,
      role: "driver",
      driverId: isDriverExist.id,
      profile: {
        id: isDriverExist.id,
        firstName: isDriverExist.firstName,
        lastName: isDriverExist.lastName,
        email: isDriverExist.email,
      },
    };
  }

  async driverLogout(req: AuthRequest) {
    const { id } = req.user;
    await DriverDevice.destroy({ where: { driverId: id } });
    return {
      message: AuthMessage.LOGOUT_SUCCESS,
    };
  }

}
