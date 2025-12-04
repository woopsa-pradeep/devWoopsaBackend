import { Request } from "express";
import moment from "moment";
import { AuthMessage, EmailMessage, Manager } from "../constants";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { ICreateBanner, ICreateLink, ICreateNotificationScheduler, ICreateRetailerProductCatalog, ICreateStory, ICreateWebView, IGetLinks, IGetNotificationSchedulers, IGetProductInformation, IGetRetailerProductCatalogs, IGetStories, IGetWebViews, IWebViewGroupedResponse, IHomeSettings, IUpdateBanner, IUpdateDevice, IUpdateLink, IUpdateNotificationScheduler, IUpdateRetailerProductCatalog, IUpdateStory, IUpdateWebView, IUpdateUploadProductImage, IUploadProductImage, IWarehouseSetting, IContactUs } from "../interfaces/request.body.interface";
import { Customer } from "../models/mmsql/customer.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { RetailerDevice } from "../models/postgres/device.model";
import { ProductImage } from "../models/postgres/product.model";
import { AppError } from "../utils/AppError";
import { uploadFileToAzure } from "../utils/azureUploader";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { cast, col, literal, Op, Sequelize, where } from 'sequelize';
import { PriceClass } from "../models/mmsql/priceClass.model";
import Banner from "../models/postgres/banner.model";
import { SalesCategory } from "../models/mmsql/salesCategory.model";
import { Vendor } from "../models/mmsql/vendor.model";
import { Users } from "../models/mmsql/user.model"
import { CustReceivables } from "../models/mmsql/custReceivables.model";
import { Token } from "../models/postgres/token.model";
import { Retailer } from "../models/postgres/retailer.model";
import { checkRegisterCustomer, generateRandomString, getDiscount, getFirstValidPrice, getInventoryOnHand, getTaxRateV1, hashPassword, pgArrayToJsArray, sendEmailToMarketing } from "../utils/helper";
import { generateNewCredentialsEmail, generateSupportTicketEmail, generateSupportTicketForDistributor } from "../view/emails";
import { sendDistributorEmail, sendEmail } from "../utils/sendMail";
import { WebUsers } from "../models/postgres/users.model";
import { SalesRep } from "../models/mmsql/salesrep.model";
import { RolePermission } from "../models/postgres/rolesPermission.model";
import { CustomerRequest } from "../models/postgres/retailerRequest.model";
import path from "path";
import { WarehouseSetting } from "../models/postgres/wareHouseSetting.model";
import { ARDefinitions } from "../models/mmsql/arDefinitions.model";
import { ARDetails } from "../models/mmsql/arDetails.model";
import { ARDeposits } from "../models/mmsql/arDeposits.model";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Distributor } from "../models/mmsql/distributor.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import HomeSettings from "../models/postgres/homeSetting.model";
import Setting from "../models/postgres/setting.model";
import { ItemLimit } from "../models/postgres/itemLimit.model";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { NotificationScheduler } from "../models/postgres/notificationSchedular.model";
import InventoryStatus from "../models/mmsql/inventoryStatus.model";
import { SupportTicket } from "../models/postgres/supportTicket.model";
import { Link } from "../models/postgres/links.model";
import { Story } from "../models/postgres/Story.model";
import { RetailerProductCatalog } from "../models/postgres/retailerProductCatalog.model";
import { StoryView } from "../models/postgres/storyView.model";
import WebViewImage from "../models/postgres/WebView.model";
import { Notifications } from "../models/postgres/notification.model";
import { sendMultiFCMNotification } from "../utils/sentNotification";
import Policies from "../models/postgres/policies.model";
import { WebCategory } from "../models/postgres/webCategory.model";
import { WebPriceClass } from "../models/postgres/webPriceClass";
import WebQuickLink from "../models/postgres/WebQuickLink";
import { WebLocation } from "../models/postgres/webLocation.model";
import SalesCallTime from "../models/postgres/salesCallTime.model";
import { Terms } from "../models/mmsql/invoiceTerm.model";
import { SalesNote } from "../models/postgres/salesNotes";
import { ContactUs } from "../models/postgres/contactUs.model";
import { EmailConfig } from "../models/postgres/emailManagement.model";
import { EmailMarketing } from "../models/postgres/emailMarketing.model";
import { generateBarcodeAndUpload } from "../utils/barCodeGenerate";
import { getDefaultInventoryValues, getNextItemNumber } from "../utils/inventory";
import EpickSetting from "../models/postgres/epickSetting.model";
import { PassScanItem } from "../models/postgres/passScanItem.model";
import { getDefaultCustomerValues, getNextCustomerNumber } from "../utils/customer";
import OrderDiscount from "../models/postgres/orderDiscount.model";
import { getDefaultVendorValues, getNextVendorNumber } from "../utils/vendor";
import { getDefaultErpUserValues , getNextUserNumber } from "../utils/erpUsers";
import settings from "../models/postgres/setting.model"
import { emailNotificationQueue } from "../configuration/config";
import { markAsUntransferable } from "worker_threads";
import { PriceSubclass_Defs } from "../models/mmsql/priceSubClassDefs.model";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { postgresSequelize } from "../db";
import { QueryTypes } from "sequelize";

export class ManagerService {

  async getProfile() {
    const getProfile = await Distributor.findOne({

    })
    const getProfileImage = await Setting.findOne({

    })
    return {
      ...getProfile?.dataValues,
      image: getProfileImage?.dataValues.warehouseImage
    };
  }
  async updateRetailerLoginDevice(body: IUpdateDevice, id: string, userId: number) {
    // Find the device first
    let Id = parseInt(id)
    const device = await RetailerDevice.findByPk(Id);

    if (!device) {
      throw new AppError('Device not found', 404);
    }

    const { customerNumber } = device;

    // Use transaction for data consistency
    const transaction = await RetailerDevice.sequelize!.transaction();

    try {
      const updateOperations: Promise<any>[] = [];

      // Handle session deactivation
      if (body.sessionActive === false) {
        // Delete all tokens for this retailer
        updateOperations.push(
          Token.destroy({
            where: { retailerId: customerNumber },
            transaction
          })
        );

        // Update all devices for this customer to inactive session
        updateOperations.push(
          RetailerDevice.update(
            { sessionActive: false, isAllow: false },
            {
              where: { customerNumber },
              transaction
            }
          )
        );
      }

      // Handle device access revocation
      if (body.isAllow === false) {
        // Delete tokens for this specific device
        updateOperations.push(
          Token.destroy({
            where: { deviceId: customerNumber },
            transaction
          })
        );

        // Update this specific device to not allowed
        updateOperations.push(
          RetailerDevice.update(
            { isAllow: false },
            {
              where: { id },
              transaction
            }
          )
        );
      }

      // Execute all operations in parallel
      await Promise.all(updateOperations);

      // Update the main device record
      const [updatedRows] = await RetailerDevice.update(body, {
        where: { id },
        transaction
      });

      // Commit transaction
      await transaction.commit();

      if (updatedRows === 0) {
        throw new AppError('Failed to update device', 400);
      }

      return { success: true, message: 'Device updated successfully' };

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  }

  async getRetailerSignUp(query: PaginationOptions) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    let isAllow = query.isAllow === "true" ? true : false;
    const search = query.search || '';
    const whereCondition: any = { isAllow };

    if (search) {
      whereCondition[Op.and] = [
        where(cast(col("Customer_Number"), "TEXT"), {
          [Op.like]: `%${search}%`,
        }),
      ];
    }

    const { count: totalCount, rows: retailerList } = await Retailer.findAndCountAll({
      where: whereCondition,
    });
    const retailerListWithCustomer = await Promise.all(retailerList.map(async (e: any) => {
      const customer = await this.getRetailerList(e.Customer_Number);
      return {
        ...e.dataValues,
        customer,
      };
    }));
    return {
      totalCount,
      page,
      limit,
      retailerListWithCustomer,
    };
  }

  async updateRetailerSignUp(id: number, body: any) {
    const retailer = await Retailer.findOne({
      where: {
        id: id
      }
    })

    const companyName = await Distributor.findOne({ attributes: ["D_Name"] });
    if (body.isAllow) {
      {
        const customerEmail: any = await Customer.findOne({
          where: {
            C_Number: retailer?.Customer_Number
          },
          attributes: ['C_Email']
        })
        const password = generateRandomString();
        const newPassword = await hashPassword(password);
        await Retailer.update({ password: newPassword }, {
          where: {
            Customer_Number: id
          }
        })

        body.password = newPassword;
        const htmlContent = generateNewCredentialsEmail(customerEmail?.C_Name || customerEmail?.C_CoName || "", customerEmail?.C_Email, password);

        await sendEmail({
          to: customerEmail?.C_Email,
          subject: `Welcome to ${companyName?.D_Name} – Your Account is Ready!`,
          html: htmlContent,
        });

      }
    }
    await Retailer.update(body, {
      where: {
        id: id
      }
    })
    return retailer;
  }

  async getRetailerLoginDevice(query: PaginationOptions) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const isAllow = query.pending === "true" ? false : true;
    const search = query.search || '';
    const whereCondition: any = { isAllow };

    if (search) {
      whereCondition[Op.and] = [
        where(cast(col("customerNumber"), "TEXT"), {
          [Op.like]: `%${search}%`,
        }),
      ];
    }

    console.log(isAllow, 'isAllow')
    const { count: totalCount, rows: deviceList } = await RetailerDevice.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    const deviceListWithCustomer = await Promise.all(deviceList.map(async (e: any) => {
      const customer = await this.getRetailerList(e.customerNumber);
      return {
        ...e.dataValues,
        customer,
      };
    }));
    return {
      totalCount,
      page,
      limit,
      deviceList: deviceListWithCustomer,
    };
  }

  async getCustomerList(query: PaginationOptions & { search?: string }) {
  const page = parseInt(query.page as any) || 1;
  const limit = parseInt(query.limit as any) || 10;
  const search = query.search || '';

  const whereCondition = search
    ? {
        [Op.or]: [
          { C_Number: { [Op.like]: `%${search}%` } },
          { C_Name: { [Op.like]: `%${search}%` } },
          { C_PhoneMobile: { [Op.like]: `%${search}%` } },
          { C_Address: { [Op.like]: `%${search}%` } },
          { C_Email: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const { count: totalCount, rows: customerList } = await Customer.findAndCountAll({
    attributes: [
      'C_Number',
      'C_Name',
      'C_Email',
      'C_Inactive',
      'C_CoName',
      'C_PhoneMobile',
      'C_Address',
      'C_City',
      'C_State',
      'C_Zip',
      'C_DateCreated'
    ],
    where: whereCondition,
    include: [
      {
        model: CustomerRoute,
        as: 'Routes',
        attributes: ['Route_Number', 'Stop_Number'],
      },
    ],
    limit,
    offset: (page - 1) * limit,
    order: [['C_DateCreated', 'DESC']],
  });

  const customerNumbers = customerList.map((c: any) => c.C_Number);

  if (customerNumbers.length === 0) {
    return {
      totalCount,
      page,
      limit,
      totalPages: 0,
      customerList: [],
    };
  }

  const orderStats = await OrderHeader.findAll({
    where: { C_Number: { [Op.in]: customerNumbers } },
    attributes: [
      'C_Number',
      'Order_Source',
      [Sequelize.fn('COUNT', Sequelize.col('Order_Number')), 'orderCount'],
    ],
    group: ['C_Number', 'Order_Source'],
    raw: true,
  });

  const statsMap = new Map();
  orderStats.forEach((stat: any) => {
    if (!statsMap.has(stat.C_Number)) {
      statsMap.set(stat.C_Number, { ERP: 0, Mobile: 0, Web: 0 });
    }
    const item = statsMap.get(stat.C_Number);
    if (stat.Order_Source === 12) item.Mobile = parseInt(stat.orderCount);
    else if (stat.Order_Source === 13) item.Web = parseInt(stat.orderCount);
    else item.ERP = parseInt(stat.orderCount);
  });

  const customerLimits = await Retailer.findAll({
    where: { Customer_Number: { [Op.in]: customerNumbers } },
    attributes: ['Customer_Number', 'maxOrderLimit', 'minOrderAmount'],
    raw: true,
  });

  const limitMap = new Map();
  customerLimits.forEach((limit) => {
    limitMap.set(limit.Customer_Number, {
      maxOrderLimit: limit.maxOrderLimit,
      minOrderAmount: limit.minOrderAmount,
    });
  });

  const registeredCustomers = await Retailer.findAll({
    where: { Customer_Number: { [Op.in]: customerNumbers } },
    attributes: ['Customer_Number'],
    raw: true,
  });

  const registerSet = new Set(registeredCustomers.map((r) => r.Customer_Number));

  const customerListWithStats = customerList.map((customer: any) => {
    const cNum = customer.C_Number;

    return {
      ...customer.toJSON(),
      isRegisterCustomer: registerSet.has(cNum),
      orderStats: statsMap.get(cNum) || { ERP: 0, Mobile: 0, Web: 0 },
      customerLimit: limitMap.get(cNum) || { maxOrderLimit: null, minOrderAmount: null },
    };
  });

  return {
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    customerList: customerListWithStats,
  };
}


  async getCustomerListWithOrderStats(query: PaginationOptions & { search?: string }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition = search
      ? {
        [Op.or]: [
          { C_Number: { [Op.like]: `%${search}%` } },
          { C_Name: { [Op.like]: `%${search}%` } },
          { C_PhoneMobile: { [Op.like]: `%${search}%` } },
          { C_Address: { [Op.like]: `%${search}%` } },
        ],
      }
      : {};

    // Get customers with pagination
    const { count: totalCount, rows: customerList } = await Customer.findAndCountAll({
      attributes: [
        'C_Number',
        'C_Name',
        'C_Email',
        'C_Inactive',
        'C_CoName',
        'C_PhoneMobile',
        'C_Address',
        'C_City',
        'C_State',
        'C_Zip',
        'C_DateCreated',
      ],
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['C_DateCreated', 'DESC']],
    });

    // Get order statistics for each customer
    const customerNumbers = customerList.map((customer: any) => customer.C_Number);

    const orderStats = await OrderHeader.findAll({
      where: {
        C_Number: { [Op.in]: customerNumbers }
      },
      attributes: [
        'C_Number',
        'Order_Source',
        [Sequelize.fn('COUNT', Sequelize.col('Order_Number')), 'orderCount']
      ],
      group: ['C_Number', 'Order_Source'],
      raw: true
    });

    // Create a map for quick lookup of order stats by customer
    const statsMap = new Map();
    orderStats.forEach((stat: any) => {
      const customerNumber = stat.C_Number;
      if (!statsMap.has(customerNumber)) {
        statsMap.set(customerNumber, {
          ERP: 0,
          Mobile: 0,
          Web: 0
        });
      }

      const customerStats = statsMap.get(customerNumber);
      if (stat.Order_Source === 1) {
        customerStats.ERP = parseInt(stat.orderCount);
      } else if (stat.Order_Source === 12) {
        customerStats.Mobile = parseInt(stat.orderCount);
      } else if (stat.Order_Source === 13) {
        customerStats.Web = parseInt(stat.orderCount);
      }
    });

    // Combine customer data with order statistics
    const customerListWithStats = customerList.map((customer: any) => {
      const customerStats = statsMap.get(customer.C_Number) || {
        ERP: 0,
        Mobile: 0,
        Web: 0
      };

      return {
        ...customer.toJSON(),
        orderStats: customerStats
      };
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      customerList: customerListWithStats,
    };
  }

  async getProductList(query: PaginationOptions & { search?: string }) {
    let { page = 1, limit = 10, salesCategoryId, search, priceClassId } = query;

    page = Number(page);
    limit = Number(limit);



    let whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
    };
    let searchInUPC = false;



    if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0 && Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Both filters exist → use OR condition
      whereClause[Op.or] = [
        { Sales_Category: { [Op.in]: salesCategoryId } },
        { Price_Class: { [Op.in]: priceClassId } }
      ];
    } else if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0) {
      // Only Sales_Category filter
      whereClause.Sales_Category = { [Op.in]: salesCategoryId };
    } else if (Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Only Price_Class filter
      whereClause.Price_Class = { [Op.in]: priceClassId };
    }




    if (search) {
      const searchValue = `%${search}%`;

      if (/^\d{8,}$/.test(search)) {
        searchInUPC = true;
      } else {
        whereClause[Op.or] = [
          { Item_Number: { [Op.like]: searchValue } },
          { Description: { [Op.like]: `%${search}%` } },
          { ALT_Description2: { [Op.like]: `%${search}%` } }
        ];
      }
    }


    const includeUPC = {
      model: InventoryUPC,
      as: 'UPCList',
      attributes: ['UPC_Number'],
      where: {
        Status: 0,
        ...(searchInUPC ? { UPC_Number: { [Op.like]: `%${search}%` } } : {})
      },
      required: searchInUPC
    };

    let totalCount = 0;

    if (searchInUPC) {
      const counted = await Inventory.findAll({
        attributes: ['Item_Number'],
        where: whereClause,
        include: [
          {
            ...includeUPC,
            attributes: []
          }
        ],
        group: ['Inventory.Item_Number'],
        raw: true,
        logging: false
      });

      totalCount = counted.length;
    } else {
      totalCount = await Inventory.count({
        where: whereClause,
        logging: false
      });
    }

    const productList = await Inventory.findAll({
      attributes: [
        'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
        'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
        'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
        'OTP_Number', 'Price_Subclass', 'UnitOunces'
      ],
      where: whereClause,
      include: [
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Category_Desc'],
          required: false
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Class_Desc'],
          required: false
        },
        {
          model: InventoryStatus,
          as: 'inventoryStatus',
          attributes: ['Inventory_OnHand'],
          required: false
        },
        includeUPC
      ],
      order: [['Date_Created', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      logging: false
    });

    const itemNumbers = productList.map(e => e.Item_Number);
    const otpNumbers = productList.map(e => e.OTP_Number);

    const productImages = await ProductImage.findAll({
      where: {
        product_number: { [Op.in]: itemNumbers.map(String) },
        isAllow: true
      }
    });
    const imageMap = new Map(productImages.map(img => [img.product_number, img]));

    const finalProductList = await Promise.all(productList.map(async (e: any) => {
      const itemStr = e.Item_Number.toString();
      const productImage = imageMap.get(itemStr) || null;
      let getProductList = await ItemLimit.findOne({
        where: {
          Item_Number: e.Item_Number
        }
      });

      const inventoryOnHand = await getInventoryOnHand(e.Item_Number) || 0;


      return {
        Pack: e.Pack,
        Description: e.Description,
        Item_Number: e.Item_Number,
        CaseCount: e.CaseCount,
        UOM: e.UOM,
        QtyLimit: getProductList || null,
        Price1: e.Price1,
        Price2: e.Price2,

        UnitOunces: e.UnitOunces,
        OTP_Number: e.OTP_Number,
        BaseCost: e.BaseCost,
        Invoice_Cost: e.Invoice_Cost,
        AvgCost: e.AvgCost,
        NetCost: e.NetCost,
        UPCList: e.UPCList,
        imageId: productImage?.id || null,
        Inventory_OnHand: inventoryOnHand,
        SalesCategory: e.SalesCategory?.Category_Desc || null,
        PriceClass: e.PriceClass?.Class_Desc || null,
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
      };
    }));

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      finalProductList
    };
  }

  async getProductById(itemNumber: number) {
    let product = await Inventory.findOne({
      where: { Item_Number: itemNumber },

      include: [
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Category_Desc'],
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Class_Desc'],
        },
        {
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          where: { Status: 0 },
          required: false,
        },
        { model: Vendor, as: 'primaryVendor', attributes: ['V_Description'] },
        { model: Vendor, as: 'manufacturerVendor', attributes: ['V_Description'] },
      ],
    });

    if (!product) {
      throw new Error(Manager.PRODUCT_NOT_FOUND);
    }
    product = product?.dataValues
    const productData = product as any
    let inventoryOnHand = await getInventoryOnHand(product?.Item_Number || 0) || 0;
    let object = {
      ...product,
      inventoryOnHand,
      masterImage: `${process.env.AZUREIMAGESERVER}${productData?.UPCList?.[0]?.UPC_Number}.jpg`,
    }

    return object;
  }


  async uploadProductImage(body: IUploadProductImage, req: AuthRequest) {
    const file = req.file;
    const { wareHouseName } = req.user;
    if (!file) {
      throw new AppError(AuthMessage.FILE_NOT_FOUND, 400);
    }
    const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName);

    if (!result.success) {
      throw new AppError(result.error || AuthMessage.FILE_NOT_FOUND, 500);
    }
    const productImage = await ProductImage.create({
      product_number: body.product_number.toString(),
      img_url: result.url || '',
      isAllow: body.isAllow,
    });
    return productImage;
  }

  async updateProductImage(body: IUpdateUploadProductImage, req: AuthRequest, id: number) {
    const file = req.file;
    const { wareHouseName } = req.user;
    if (file) {

      const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName);
      if (!result.success) {
        throw new AppError(result.error || AuthMessage.FILE_NOT_FOUND, 500);
      }
      const productImage = await ProductImage.update({ img_url: result.url || '' }, {
        where: { id: id }
      });
      return productImage;
    } else {
      const result = await ProductImage.update({ isAllow: body.isAllow }, {
        where: { id: id }
      });
      return result;
    }
  }

  async createBanner(body: ICreateBanner, req: AuthRequest) {
    const file = req.file;
    const { wareHouseName } = req.user;
    if (!file) {
      throw new AppError(AuthMessage.FILE_NOT_FOUND, 400);
    }

    const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName);
    body.image_url = result.url || '';
    const banner = await Banner.create(body as any);
    return banner;
  }

  async updateBanner(body: IUpdateBanner, req: AuthRequest, id: number) {
    const { wareHouseName } = req.user;
    if (req.file) {
      const result = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, wareHouseName);
      body.image_url = result.url || '';
    }
    const banner = await Banner.update(body, {
      where: { id: id }
    });
    return banner;
  }

  async getBannerList() {

    const { count: totalCount, rows: bannerList } = await Banner.findAndCountAll({
      where: {
        isActive: true,
        endDate: {
          [Op.gt]: new Date()
        }
      },
      order: [['createdAt', 'DESC']],
    });


    // Process each banner to include inventory data
    const bannerListWithInventory = await Promise.all(bannerList.map(async (banner: any) => {
      console.log(banner, 'banner')
      const bannerData = banner.toJSON();

      // Parse inventors field if it exists
      if (bannerData.inventors) {
        try {
          // Handle both array and string formats
          let itemNumbers: number[];

          if (Array.isArray(bannerData.inventors)) {
            // If inventors is already an array, convert strings to numbers
            itemNumbers = bannerData.inventors.map((item: string) => parseInt(item));
          } else if (typeof bannerData.inventors === 'string') {
            // If inventors is a string, split by comma and convert to numbers
            itemNumbers = bannerData.inventors.split(',').map((item: string) => parseInt(item.trim()));
          } else {
            itemNumbers = [];
          }

          // Filter out any invalid numbers
          const validItemNumbers = itemNumbers.filter((num: number) => !isNaN(num));

          if (validItemNumbers.length > 0) {
            console.log(validItemNumbers, 'validItemNumbers')
            // Fetch inventory data for these item numbers
            const inventoryData = await Inventory.findAll({
              where: {
                Item_Number: { [Op.in]: validItemNumbers }
              },
              attributes: ['Item_Number', 'Description'],
              raw: true
            });

            bannerData.inventoryItems = inventoryData.map((item: any) => item.Item_Number + ' - ' + item.Description);
          } else {
            bannerData.inventoryItems = [];
          }
        } catch (error) {
          console.error('Error parsing inventors field:', error);
          bannerData.inventoryItems = [];
        }
      } else {
        bannerData.inventoryItems = [];
      }

      return bannerData;
    }));

    return {
      bannerList: bannerListWithInventory,
      totalCount
    };
  }

  async deleteBanner(id: number) {
    const banner = await Banner.update({ isActive: false }, {
      where: { id: id }
    });
    return banner;
  }

  async getVendorList(query: PaginationOptions & { search?: string }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search?.trim() || '';

    let whereCondition = {};

    if (search) {
      const orConditions: any[] = [];

      // If numeric, search by Primary_Vendor
      if (!isNaN(Number(search))) {
        orConditions.push({ Primary_Vendor: Number(search) });
      }

      // Always allow name and other text field matches
      orConditions.push(
        { V_Description: { [Op.like]: `%${search}%` } },
        { V_FEIN: { [Op.like]: `%${search}%` } },
        { V_Addr1: { [Op.like]: `%${search}%` } },
        { V_Addr2: { [Op.like]: `%${search}%` } },
        { V_City: { [Op.like]: `%${search}%` } },
        { V_State: { [Op.like]: `%${search}%` } },
        { V_Zip: { [Op.like]: `%${search}%` } },
        { V_Phone: { [Op.like]: `%${search}%` } },
        { V_Email: { [Op.like]: `%${search}%` } }
      );

      whereCondition = { [Op.or]: orConditions };
    }

    const { count: totalCount, rows: vendorList } = await Vendor.findAndCountAll({
      attributes: [
        'Primary_Vendor',
        'V_Description',
        'V_Addr1',
        'V_Addr2',
        'V_City',
        'V_State',
        'V_Zip',
        'V_Phone',
        'V_Terms',
        'V_Email',
        'V_FEIN',
        'Date_Created',
      ],
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['Date_Created', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      vendorList,
    };
  }

  async getAccountReceivablesList(
    query: PaginationOptions & { tab?: string; search?: string; C_Number?: string; C_Name?: string }
  ) {

    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = (query.search ?? '').trim();
    const tab = (query.tab || 'charges').trim().toLowerCase();
    const offset = (page - 1) * limit;
    const cNumber = query.C_Number ? parseInt(query.C_Number as any) : undefined;
    const cName = (query.C_Name ?? '').trim();

    // 1) Resolve selected customer (by C_Number, C_Name, or search fallback)
    let selectedCustomer: any = null;

    if (cNumber) {
      selectedCustomer = await Customer.findOne({
        where: { C_Number: cNumber },
        attributes: ['C_Number', 'C_Name'],
      });
    } else if (cName) {
      selectedCustomer = await Customer.findOne({
        where: { C_Name: cName },
        attributes: ['C_Number', 'C_Name'],
      });
    }

    let searchUsedForCustomerSelection = false;

    if (!selectedCustomer && search) {
      // Try numeric search as customer number
      if (!isNaN(Number(search))) {
        selectedCustomer = await Customer.findOne({
          where: { C_Number: parseInt(search) },
          attributes: ['C_Number', 'C_Name'],
        });
        if (selectedCustomer) searchUsedForCustomerSelection = true;
      }

      // Try by name contains
      if (!selectedCustomer) {
        selectedCustomer = await Customer.findOne({
          where: { C_Name: { [Op.like]: `%${search}%` } },
          attributes: ['C_Number', 'C_Name'],
        });
        if (selectedCustomer) searchUsedForCustomerSelection = true;
      }
    }

    // If no customer resolved, return empty (as per your original requirement)
    if (!selectedCustomer) {
      return {
        totalCount: 0,
        page,
        limit,
        currentDue: 0,
        accountReceivablesList: [],
      };
    }

    // 2) Build base where per tab
    const whereCondition: any = {
      C_Number: selectedCustomer.C_Number,
    };

    if (tab === 'payments') {
      whereCondition.AR_Type = 'C';
    } else if (tab === 'charges') {
      whereCondition.AR_Type = { [Op.in]: ['I', 'A', 'R'] };
      whereCondition.AR_Amount = { [Op.gt]: 0 };
    } else if (tab === 'refunds') {
      whereCondition.AR_Type = 'I';
      whereCondition.AR_Amount = { [Op.lt]: 0 };
    }

    // 3) Search conditions (only if search wasn't used to pick the customer)
    const searchConditions: any[] = [];
    if (search && !searchUsedForCustomerSelection) {
      const mappedTypes: Record<string, string> = {
        invoice: 'I',
        adjustments: 'A',
        return: 'R',
        credit: 'C',
      };

      const matchType = Object.entries(mappedTypes).find(([label]) =>
        label.startsWith(search.toLowerCase())
      );

      // AR_Ref contains
      searchConditions.push({ AR_Ref: { [Op.like]: `%${search}%` } });

      // Numeric searches
      if (!isNaN(Number(search))) {
        searchConditions.push({ Invoice_Number: { [Op.like]: `%${search}%` } });
        // Note: C_Number is numeric but LIKE works on MSSQL/PG when cast—keep as you had
        searchConditions.push({ C_Number: { [Op.like]: `%${search}%` } });
      }

      // Customer name
      searchConditions.push(
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('customer.C_Name')),
          { [Op.like]: `%${search.toLowerCase()}%` }
        )
      );

      // Type keyword match
      if (matchType) {
        searchConditions.push({ AR_Type: matchType[1] });
      }

      // Payments: subtype match
      if (tab === 'payments') {
        searchConditions.push(
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('arDefinition.AR_SubTypeRef')),
            { [Op.like]: `%${search.toLowerCase()}%` }
          )
        );
      }

      if (tab !== 'refunds' && searchConditions.length > 0) {
        whereCondition[Op.or] = searchConditions;
      }
    }

    // 4) Includes
    const include: any[] = [
      {
        model: Customer,
        as: 'customer',
        attributes: ['C_Number', 'C_Name'],
      },
    ];

    if (tab === 'payments') {
      include.push({
        model: ARDefinitions,
        as: 'arDefinition',
        where: {
          AR_Type: 'C'
        },
        required: false,
        attributes: ['AR_SubTypeRef'],
      });
    }

    if (tab === 'refunds') {
      // IMPORTANT: 'separate: true' prevents row multiplication (duplicates)
      include.push({
        model: ARDetails,
        as: 'details',
        required: false,
        separate: true, // ✅ key fix for duplicates
        attributes: ['P_Number_AppliedFrom', 'P_Number_AppliedTo']
      });
    }

    // 5) Main query with DISTINCT to fix inflated counts when there are joins
    const result: any = await CustReceivables.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      subQuery: false,          // keeps limit/offset on the root
      order: [['AR_CheckDate', 'DESC']],
      attributes: [
        'P_Number',
        'AR_Type',
        'AR_SubType',
        'AR_Ref',
        'AR_Amount',
        'AR_Applied',
        'AR_Date',
        'AR_CheckDate',
        'Invoice_Number',
        'C_Number',
      ],
      include,
      distinct: true,           // ✅ makes COUNT(DISTINCT "CustReceivables"."P_Number")
    });

    const totalCount = typeof result.count === 'number'
      ? result.count
      : Array.isArray(result.count)
        ? result?.count?.length
        : 0;

    let rows = result.rows;

    // 6) Extra in-memory filter for refunds when search wasn't used for customer selection
    if (tab === 'refunds' && search && !searchUsedForCustomerSelection) {
      const searchLower = search.toLowerCase();
      const searchNumber = !isNaN(Number(search)) ? Number(search) : null;
      const mappedTypes: Record<string, string> = { credit: 'C', return: 'R' };
      const matchType = Object.entries(mappedTypes).find(([label]) =>
        label.startsWith(searchLower)
      );

      rows = rows.filter((row: any) => {
        const mainMatch =
          (searchNumber !== null && row.Invoice_Number?.toString().includes(search)) ||
          (searchNumber !== null && row.C_Number?.toString().includes(search)) ||
          (row.customer?.C_Name?.toLowerCase().includes(searchLower)) ||
          (row.AR_Ref && row.AR_Ref.toLowerCase().includes(searchLower)) ||
          (matchType && row.AR_Type === matchType[1]);

        const detailsMatch = row.details?.some((detail: any) =>
          (searchNumber !== null && detail.P_Number_AppliedTo?.toString().includes(search)) ||
          (searchNumber !== null && detail.invoiceTransaction?.Invoice_Number?.toString().includes(search))
        );

        return mainMatch || detailsMatch;
      });
    }

    // 7) Shape rows into your response format
    const accountReceivablesList = rows.map((item: any) => {
      const amount = Number(item.AR_Amount || 0);
      const applied = Number(item.AR_Applied || 0);
      const balance = amount - applied;

      if (tab === 'payments') {
        const subType = item.arDefinition?.AR_SubTypeRef?.trim() || 'N/A';

        return {
          subType,
          reference: item.AR_Ref,
          amount: amount.toFixed(2),
          applied: applied.toFixed(2),
          balance: balance.toFixed(2),
          postingDate: item.AR_CheckDate || item.AR_Date || null,
        };
      }

      if (tab === 'charges') {
        let typeLabel = 'Other';
        if (item.AR_Type === 'I') typeLabel = 'Invoice';
        else if (item.AR_Type === 'A') typeLabel = 'Adjustments';
        else if (item.AR_Type === 'R') typeLabel = 'Return';

        return {
          type: typeLabel,
          reference: item.AR_Ref,
          invoiceNumber: item.Invoice_Number || 0,
          invoiceAmount: amount.toFixed(2),
          invoiceDue: balance.toFixed(2),
          invoiceDate: item.AR_Date,
        };
      }

      if (tab === 'refunds') {
        let typeLabel = 'Other';
        if (item.AR_Type === 'C') typeLabel = 'Credit';
        else if (item.AR_Type === 'R') typeLabel = 'Return';
        else if (item.AR_Type === 'I') typeLabel = 'Invoice';

        return {
          type: typeLabel,
          reference: item.AR_Ref,
          invoiceNumber: item.Invoice_Number || 0,
          invoiceAmount: amount.toFixed(2),
          invoiceDue: balance.toFixed(2),
          invoiceDate: item.AR_Date,
        };
      }

      return {};
    });

    // 8) Current Due calculation (kept same logic as yours)
    const dueWhereCondition: any = {
      AR_Type: whereCondition.AR_Type,
      C_Number: selectedCustomer.C_Number,
    };

    const allDueRecords = await CustReceivables.findAll({
      where: dueWhereCondition,
      attributes: ['AR_Amount', 'AR_Applied'],
    });

    const totalDue = allDueRecords.reduce((sum: number, rec: any) => {
      const amt = Number(rec.AR_Amount || 0);
      const app = Number(rec.AR_Applied || 0);
      return sum + (amt - app);
    }, 0);

    const currentDue = Number(totalDue.toFixed(2));

    return {
      totalCount: tab === 'refunds' && search && !searchUsedForCustomerSelection ? rows.length : totalCount,
      page,
      limit,
      currentDue,
      accountReceivablesList,
    };
  }

  async getBannerInfo(id: number) {
    const banner = await Banner.findOne({
      where: { id: id }
    });
    return banner;
  }

  async getRetailerList(id: number) {
    const retailer = await Customer.findOne({
      where: {
        C_Number: id
      },
      attributes: [
        'C_Number',
        'C_Name',
        'C_Email',

      ]
    })
    return retailer;
  }

  async createUser(body: any) {
    body.firstName = body.firstName.trim();
    body.lastName = body.lastName.trim();
    const existingUser = await WebUsers.findOne({
      where: {
        firstName: body.firstName,
        lastName: body.lastName,
        isActive: true,
      },
    });
    if (existingUser) {
      throw new AppError(Manager.USER_ALREADY_EXISTS, 400);
    }
    const checkEmail = await WebUsers.findOne({
      where: { email: body.email }
    });
    if (checkEmail) {
      throw new AppError(Manager.EMAIL_ALREADY_EXISTS, 400);
    }

    const password = generateRandomString(9);
    const hashedPassword = await hashPassword(password);

    body.password = hashedPassword;
    const companyName = await Distributor.findOne({ attributes: ["D_Name"] });

    const user = await WebUsers.create(body);

    const htmlContent = generateNewCredentialsEmail(body.firstName + " " + body.lastName, body.email, password);
    await sendEmail({
      to: body.email,
      subject: `Welcome to ${companyName?.D_Name} – Your Account is Ready!`,
      html: htmlContent,
    });

    return user;
  }

  async updateUser(id: number, body: any) {
    const updateUser = await WebUsers.update(body, {
      where: { id: id }
    });
    return updateUser;
  }

  /**
   * Update user order preferences (order_type and shortby)
   * order_type: 'order_number' | 'qty_number'
   * shortby: 'asc' | 'des' (case insensitive)
   */
  async updateUserOrderPreferences(userId: number, preferences: { order_type?: string; shortby?: string }) {
    // Validate user exists
    const user = await WebUsers.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate order_type if provided
    if (preferences.order_type !== undefined) {
      const validOrderTypes = ['order_number', 'qty_number'];
      if (!validOrderTypes.includes(preferences.order_type)) {
        throw new AppError(`Invalid order_type. Must be one of: ${validOrderTypes.join(', ')}`, 400);
      }
    }

    // Validate shortby if provided
    if (preferences.shortby !== undefined) {
      const normalizedShortby = preferences.shortby.toLowerCase();
      if (normalizedShortby !== 'asc' && normalizedShortby !== 'des') {
        throw new AppError("Invalid shortby. Must be 'asc' or 'des' (case insensitive)", 400);
      }
      // Normalize to 'Asc' or 'Des' for consistency
      preferences.shortby = normalizedShortby === 'asc' ? 'Asc' : 'Des';
    }

    // Update user preferences
    const updateData: any = {};
    if (preferences.order_type !== undefined) {
      updateData.order_type = preferences.order_type;
    }
    if (preferences.shortby !== undefined) {
      updateData.shortby = preferences.shortby;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No preferences provided to update', 400);
    }

    await WebUsers.update(updateData, {
      where: { id: userId }
    });

    // Return updated user
    const updatedUser = await WebUsers.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'order_type', 'shortby'],
    });

    return {
      message: 'User order preferences updated successfully',
      user: updatedUser,
    };
  }

  /**
   * Get all epick users with order preferences
   * Returns list of all epick users including order_type and shortby
   */
  async getEpickUserDetails() {
    const users = await WebUsers.findAll({
      where: {
        role: 'epick', // Only return epick users
        isActive: true, // Only return active users
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'order_type', 'shortby', 'userNumber', 'isActive', 'status'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    return {
      users: users,
    };
  }

  // async getUserList(query: PaginationOptions) {
  //   const page = parseInt(query.page as any) || 1;
  //   const limit = parseInt(query.limit as any) || 10;
  //   const search = query.search || '';

  //   const whereCondition: any = {
  //     isActive: true,
  //   };

  //   if (search) {
  //     whereCondition[Op.or] = [
  //       { email: { [Op.like]: `%${search}%` } },
  //       { firstName: { [Op.like]: `%${search}%` } },
  //       { lastName: { [Op.like]: `%${search}%` } },
  //     ];
  //   }

  //   const { count: totalCount, rows: userList } = await WebUsers.findAndCountAll({
  //     where: whereCondition,
  //     limit,
  //     offset: (page - 1) * limit,

  //     order: [['createdAt', 'DESC']],
  //   });

  //   const userListWithSalesRep = await Promise.all(userList.map(async (user: any) => {

  //     const salesRepList: string[] = pgArrayToJsArray(user.salesRepNumber);
  //   const newSalesRepArray = salesRepList.map(Number);

  //     const salesRep = await this.getSalesRepUser(Number(newSalesRepArray));
  //     return {
  //       ...user.dataValues,
  //       salesRep: salesRep ? { S_Number: salesRep.S_Number, S_Desc: salesRep.S_Desc } : null,
  //     };
  //   }));
  //   return {
  //     totalCount,
  //     page,
  //     limit,
  //     userListWithSalesRep,
  //   };
  // }

  async getUserList(query: PaginationOptions) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';
  
    const whereCondition: any = {
      isActive: true,
    };
  
    if (search) {
      whereCondition[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }
  
    const { count: totalCount, rows: userList } = await WebUsers.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });
  
    // ✅ ADD SALES REP LIST FOR EACH USER
    const userListWithSalesRep = await Promise.all(
      userList.map(async (user: any) => {
  
        // ✅ Convert PG "{5,2}" → [5,2]
        const salesRepList = pgArrayToJsArray(user.salesRepNumber);   // ["5","2"]
        const salesRepIds = salesRepList.map(Number);                 // [5,2]
  
        // ✅ Fetch all sales reps for this user
        const salesReps = await Promise.all(
          salesRepIds.map((id: number) => this.getSalesRepUser(id))
        );
  
        // ✅ Format: Only send required fields
        const formattedSalesReps = salesReps
          .filter(Boolean) // remove nulls
          .map((rep: any) => ({
            S_Number: rep.S_Number,
            S_Desc: rep.S_Desc,
          }));
  
        return {
          ...user.dataValues,
          salesRep: formattedSalesReps, // ✅ return array instead of single object
        };
      })
    );
  
    return {
      totalCount,
      page,
      limit,
       userListWithSalesRep,
    };
  }

  
  async createRolePermissions(body: any) {
    const { userId, permissions } = body;

    const payload = permissions.map((perm: any) => ({
      userId,
      module: perm.module,
      add: perm.add || false,
      edit: perm.edit || false,
      delete: perm.delete || false,
      view: perm.view || false,
      path: perm.path, // Ensure path is a string
      status: true,
      isActive: true,
    }));

    const data = await RolePermission.bulkCreate(payload);

    return data

  };

  async updateRolePermissions(body: any) {
    const { permissions } = body;

    const updates = await Promise.all(
      permissions.map(async (perm: any) => {
        console.log(perm, "perm")
        const updated = await RolePermission.update(perm, {
          where: {
            id: Number(perm.id),
          },
        });
        return updated;
      })
    );

    return updates;
  }



  async getUserRolePermissions(userId: number) {
    const permissions = await RolePermission.findAll({
      where: { userId, isActive: true },
    });

    if (!permissions || permissions.length === 0) {
      return false
    }

    return permissions;
  }



  async updateSalesRepSetting(body: any) {
    return await Setting.update(body, { where: {} })
  }

  async updateRetailerSetting(body: any) {
    console.log(body, 'body--->')
    return await Setting.update(body, { where: {} })
  }

  async updateItemGlobalSetting(body: any) {
    await Setting.update(body, { where: {} })
    return await Retailer.update({
      maxOrderLimit: body.itemGlobal.maxOrderLimit,
      minOrderAmount: body.itemGlobal.MiniMumOrderAmount,
    }, { where: {} })

  }

  async updateWarehouseProfileSetting(body: any) {
    return await Setting.update(body, { where: {} })
  }


  async getWarehouseSetting() {
    const setting = await Setting.findOne({}); // Assuming only one global setting row
    if (!setting) {
      throw new AppError('Warehouse settings not found', 404);
    }
    return setting;
  }


  async getOrderHistory(query: PaginationOptions) {
    console.log(query, 'query--->')
    // Handle query parameters with potential trailing spaces
    const page = Number(query.page || (query as any)['page ']) || 1;
    const limit = Number(query.limit || (query as any)['limit ']) || 10;
    const customerNumber = query.customerNumber || (query as any)['customerNumber '];
    const startDate = query.startDate || (query as any)['startDate '];
    const endDate = query.endDate || (query as any)['endDate '];

    const offset = (page - 1) * limit;

    // Build where condition
    const whereCondition: any = {};

    if (customerNumber) {
      whereCondition.C_Number = Number(customerNumber);
    }

    if (startDate && endDate) {
      whereCondition.Order_Date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // First, get the order headers with pagination
    const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
      attributes: [
        'Order_Number',
        'C_Number',
        'Order_Source',
        'Order_Date'
      ],
      where: whereCondition,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Country'],
          required: false,
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false
            }
          ]
        }
      ],
      order: [['Order_Number', 'DESC']],
      limit,
      offset,
    });

    // Get the order numbers to fetch quantities
    const orderNumbers = orderList.map((order: any) => order.Order_Number);

    // Get total quantities for these orders
    let quantityMap = new Map();
    if (orderNumbers.length > 0) {
      const quantityResults = await OrderDetail.findAll({
        attributes: [
          'Order_Number',
          [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantity']
        ],
        where: {
          Order_Number: { [Op.in]: orderNumbers }
        },
        group: ['Order_Number'],
        raw: true
      });

      // Create a map for quick lookup
      quantityResults.forEach((result: any) => {
        quantityMap.set(result.Order_Number, Number(result.totalQuantity || 0));
      });
    }

    // Format the response
    const formattedOrderList = orderList.map((order: any) => {
      // Map Order_Source to readable names
      let orderSourceName = 'ERP';
      if (order.Order_Source === 13) {
        orderSourceName = 'Web';
      } else if (order.Order_Source === 12) {
        orderSourceName = 'App';
      }
      const route = order.customer?.Routes?.[0];
      return {
        Order_Number: order.Order_Number,
        C_Number: order.C_Number,
        Order_Source: order.Order_Source,
        Order_Source_Name: orderSourceName,
        Order_Date: order.Order_Date,
        customerName: order.customer?.C_Name || 'N/A',
        address: order.customer?.C_Address || 'N/A',
        city: order.customer?.C_City || 'N/A',
        state: order.customer?.C_State || 'N/A',
        zip: order.customer?.C_Zip || 'N/A',
        country: order.customer?.C_Country || 'N/A',
        route: route?.Route_Number ?? null,
        stop: route?.Stop_Number ?? null,
        totalQuantityOrdered: quantityMap.get(order.Order_Number) || 0
      };
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(Number(totalCount) / Number(limit)),
      orderList: formattedOrderList,
    };
  }

  async getOrderHistoryByOrderNumber(orderNumber: number, query: PaginationOptions) {
    let { page = 1, limit = 10 } = query;
    page = Number(query.page || (query as any)['page ']) || 1;
    limit = Number(query.limit || (query as any)['limit ']) || 10;
    const offset = (page - 1) * limit;
    const orderHeader = await OrderHeader.findByPk(orderNumber, {
      attributes: [
        'Order_Number',
        'Order_Date',
        'User_ID',
        'Order_Source',
        'Delivery_Charge',
      ]
    });

    const totalCount = await OrderDetail.count({
      where: { Order_Number: orderNumber }
    });

    // Get order details with pagination
    const orderDetails = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        'Order_Number',
        'Line_Number',
        'Item_Number',
        'Sales_Category',
        'OTP_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Pack',
        'Price',
        'Price_Reference',
        'Retail',
        'NetCost',
        'BaseCost',
        'Invoice_Cost',
        'AvgCost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',
        'DepositAmount',
        'Price_Subclass',
        'OffInvoice_Amount',
        'Taxable',
        'EBT',
        'Points',
        'STAMP_Qty',
        'ItemDescription',
        'CaseWeight',
        'CaseCount',
        "PrepaidTax_Amount"

      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: [
            'Item_Number',
            'Description',
            'Pack',
            'CaseCount',
            'UOM'
          ],
          required: false,
          include: [
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              where: {
                Status: 0,
              },
              required: false,
            }
          ]
        }
      ],
      order: [['Line_Number', 'ASC']],
      limit,
      offset
    });

    const allOrderDetails = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        'Price',
        'OTP_Amount_State',
        'Quantity_Ordered',
        'OffInvoice_Amount',
        'DepositAmount',
        'PrepaidTax_Amount'
      ]
    });
    // Calculate total price, discount, and deposit
    let totalPrice = 0;
    let totalDiscount = 0;
    let totalDeposit = 0;
    let totalPrepaidTax = 0;
    const orderDiscount = await OrderDiscount.findOne({
      where: { orderNumber: orderNumber }
    });
    if(orderDiscount){
      totalDiscount = orderDiscount.discount;
    }
    for (const detail of allOrderDetails) {

      let price = Number(detail.Price || 0) + Number(detail.OTP_Amount_State || 0);
      price += Number(detail.PrepaidTax_Amount || 0);
      const otpAmount = Number(detail.OTP_Amount_State || 0);
      const quantity = Number(detail.Quantity_Ordered || 0);
      
      totalPrice += (price + otpAmount) * quantity;
      totalPrice += Number(detail.PrepaidTax_Amount || 0);
      totalDiscount += Number(detail.OffInvoice_Amount || 0);
      totalDeposit += Number(detail.DepositAmount || 0);
    }

    // Get product images for each item
    const orderDetailsWithImages = await Promise.all(orderDetails.map(async (detail: any) => {
      const productImage = await ProductImage.findOne({
        where: {
          product_number: detail.Item_Number.toString(),
          isAllow: true
        },
      });

      return {
        ...detail.toJSON(),
        Price: Number(detail.Price || 0) + Number(detail.OTP_Amount_State || 0),
        isDistributorImageShow: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${detail.inventory?.UPCList?.[0]?.UPC_Number}.jpg`,
      };
    }));

    // Get checker images from OrderPickBox using raw SQL query for better performance
    const checkerImagesResult = await postgresSequelize.query(
      `SELECT jsonb_array_elements_text(images) as image_url
       FROM "Order_Pick_Box"
       WHERE "orderNumber" = :orderNumber
         AND images IS NOT NULL
         AND jsonb_typeof(images) = 'array'`,
      {
        replacements: { orderNumber },
        type: QueryTypes.SELECT
      }
    );

    // Extract image URLs from query result
    const checkerImages: string[] = (checkerImagesResult as any[])
      .map((row: any) => row?.image_url)
      .filter((url: any) => url && typeof url === 'string');

    return {
      orderHeader: {
        ...orderHeader?.toJSON(),
        Total_Price: totalPrice,
        Total_Discount: totalDiscount,
        Total_Deposit: totalDeposit
      },
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: orderDetailsWithImages,
      checkerImages: checkerImages
    };
  }

  async getHomeSetting() {
    const homeSetting = await HomeSettings.findOne({
      where: {}
    })
    return homeSetting;
  }

  async updateHomeSetting(body: IHomeSettings) {
    return await HomeSettings.update(body, { where: {} });
  }

  async getProductInformation(body: IGetProductInformation) {
    if (!body.isMultiple) {
      const upc = await InventoryUPC.findOne({
        where: {
          UPC_Number: body.upcNumber
        }
      })
      const product = await Inventory.findOne({
        where: {
          Item_Number: upc?.Item_Number
        },
        include: [
          {
            model: SalesCategory,
            as: 'SalesCategory', // 👈 same as your association
            attributes: ['Sales_Category', 'Category_Desc'], // specify the fields you want
          },
          {
            model: PriceClass,
            as: 'PriceClass', // 👈 same as your association
            attributes: ['Price_Class', 'Class_Desc'], // specify the fields you want
          }
        ]
      })
      return product;
    } else {
      const upc = await InventoryUPC.findAll({
        where: {
          UPC_Number: {
            [Op.in]: body.arrayOfUpc
          }
        }
      })
      const product = await Inventory.findAll({
        where: {
          Item_Number: {
            [Op.in]: upc.map((item: any) => item.Item_Number)
          }
        },
        include: [
          {
            model: SalesCategory,
            as: 'SalesCategory',
            attributes: ['Sales_Category', 'Category_Desc'],
          },
          {
            model: PriceClass,
            as: 'PriceClass',
            attributes: ['Price_Class', 'Class_Desc'],
          }
        ]
      });

      return product;
    }
  }

  async getOrderDeliveryStatus(orderNumber: number) {
    const status: any = await OrderHeader.findOne({
      where: {
        Order_Number: orderNumber
      },
      attributes: ['Picklist_Printed', 'Order_Date', 'Picklist_Time', 'POS_Cash', 'POS_Check', 'POS_Credit', 'POS_Debit', 'POS_Other', 'POS_House', 'POS_Time']
    });

    if (!status) {
      return {
        status: 'Order Not Found',
        time: null
      };
    }

    // Check if any POS field has a value (Order Packed)
    const posFields = ['POS_Cash', 'POS_Check', 'POS_Credit', 'POS_Debit', 'POS_Other', 'POS_House'];
    const hasPosValue = posFields.some(field => status[field] && status[field] > 0);

    if (hasPosValue) {
      return [
        {
          status: 'Order Packed',
          no: 2,
          time: status.POS_Time,
          active: true
        },
        {
          status: 'Picklist Print',
          no: 1,
          time: status.Picklist_Time || null,
          active: false
        },
        {
          status: 'Order Placed',
          no: 0,
          time: status.Order_Date || null,
          active: false
        }
      ];
    }

    // Check if Picklist_Printed is true (Picklist Print)
    if (status.Picklist_Printed) {
      return [
        {
          status: 'Order Packed',
          no: 2,
          time: null,
          active: false
        },
        {
          status: 'Picklist Print',
          no: 1,
          time: status.Picklist_Time || null,
          active: true
        },
        {
          status: 'Order Placed',
          no: 0,
          time: status.Order_Date || null,
          active: false
        }
      ];
    }

    // Default case - Order Placed
    return [
      {
        status: 'Order Packed',
        no: 2,
        time: null,
        active: false
      },
      {
        status: 'Picklist Print',
        no: 1,
        time: null,
        active: false
      },
      {
        status: 'Order Placed',
        no: 0,
        time: status.Order_Date || null,
        active: true
      }
    ];
  }

  // async updateEmailNotification( body: any){
  //   const updatedEmail = await settings.update(body);
  //   return updatedEmail;
  // }

  async updateEmailNotification( body: any) {
    const updatedEmail = await settings.update(body, {
      where: { }
    });
    return updatedEmail;
  }

  // helperfucntion
  async getSalesRepUser(id: number) {
    const user = await SalesRep.findByPk(id, {
      attributes: ['S_Number', 'S_Desc'],
    })
    return user
  }

  async getAccountReceivableTotals() {
    const [charges, payments, credit] = await Promise.all([
      CustReceivables.sum('AR_Amount', {
        where: { AR_Type: { [Op.in]: ['I', 'A', 'R'] } },
      }),
      CustReceivables.sum('AR_Amount', {
        where: { AR_Type: 'C' },
      }),
      CustReceivables.sum('AR_Amount', {
        where: { AR_Type: 'R' },
      }),
    ]);

    return {
      totalCharges: Number(charges || 0),
      totalCredit: Number(credit || 0),
      totalPayments: Number(payments || 0),
    };
  }

  async uploadWarehouseImage(req: AuthRequest) {
    const file = req.file;
    const { wareHouseName } = req.user;

    if (!file) {
      throw new AppError(AuthMessage.FILE_NOT_FOUND, 400);
    }

    const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName);
    if (!result.success) {
      throw new AppError(result.error || AuthMessage.FILE_NOT_FOUND, 500);
    }


    await Setting.update({ warehouseImage: result.url }, { where: {} });


    return { success: true, imageUrl: result.url };
  }


  async getWarehouseContactDetails() {
    const warehouseSetting = await WarehouseSetting.findOne({

    });
    return warehouseSetting;
  }

  // ItemLimit CRUD methods
  async createItemLimit(body: any) {
    // Check if item limit already exists for this item number
    const existingItemLimit = await ItemLimit.findOne({
      where: { Item_Number: body.Item_Number }
    });

    if (existingItemLimit) {
      throw new AppError(Manager.ITEM_LIMIT_ALREADY_EXISTS, 400);
    }

    const itemLimit = await ItemLimit.create(body);
    return itemLimit;
  }

  async getItemLimitById(id: number) {
    const itemLimit = await ItemLimit.findByPk(id);

    if (!itemLimit) {
      throw new AppError(Manager.ITEM_LIMIT_NOT_FOUND, 404);
    }

    return itemLimit;
  }

  async getItemLimitByItemNumber(itemNumber: string) {
    const itemLimit = await ItemLimit.findOne({
      where: { Item_Number: itemNumber }
    });

    if (!itemLimit) {
      throw new AppError(Manager.ITEM_LIMIT_NOT_FOUND, 404);
    }

    return itemLimit;
  }

  async getAllItemLimits(query: PaginationOptions & { search?: string }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition = search
      ? {
        [Op.or]: [
          { Item_Number: { [Op.like]: `%${search}%` } },
        ],
      }
      : {};

    const { count: totalCount, rows: itemLimits } = await ItemLimit.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      itemLimits,
    };
  }

  async updateItemLimit(id: number, body: Partial<{ Item_Number: string; QtyLimit: number; UseDefault: boolean }>) {
    const itemLimit = await ItemLimit.findByPk(id);

    if (!itemLimit) {
      throw new AppError(Manager.ITEM_LIMIT_NOT_FOUND, 404);
    }

    // If Item_Number is being updated, check if it already exists for another record
    if (body.Item_Number && body.Item_Number !== itemLimit.Item_Number) {
      const existingItemLimit = await ItemLimit.findOne({
        where: {
          Item_Number: body.Item_Number,
          id: { [Op.ne]: id } // Exclude current record
        }
      });

      if (existingItemLimit) {
        throw new AppError(Manager.ITEM_LIMIT_ALREADY_EXISTS, 400);
      }
    }

    await itemLimit.update(body);
    return itemLimit;
  }

  async deleteItemLimit(id: number) {
    const itemLimit = await ItemLimit.findByPk(id);

    if (!itemLimit) {
      throw new AppError(Manager.ITEM_LIMIT_NOT_FOUND, 404);
    }

    await itemLimit.destroy();
    return { success: true, message: 'Item limit deleted successfully' };
  }

  // NotificationScheduler CRUD methods
  async createNotificationScheduler(body: ICreateNotificationScheduler) {
    const notification = await NotificationScheduler.create({
      userId: body.userId,
      title: body.title,
      description: body.description,
      date: body.date,
      time: body.time,
      isActive: body.isActive ?? true,
      stopNumber: body.stopNumber ?? null,
      routeNumber: body.routeNumber ?? null,
      isExpire: false
    });

    return notification;
  }

  async getAllNotificationSchedulers(query: PaginationOptions & IGetNotificationSchedulers) {
    let { page = 1, limit = 10, search, isExpire, date } = query;
    const offset = (page - 1) * limit;
    page = parseInt(page.toString());
    limit = parseInt(limit.toString());

    const whereClause: any = {
      isActive: true
    };

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }



    if (isExpire !== undefined) {
      whereClause.isExpire = isExpire;
    }

    if (date) {
      whereClause.date = date;
    }

    const { count, rows } = await NotificationScheduler.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      notifications: rows,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit.toString()))
      }
    };
  }

  async getNotificationSchedulerById(id: number) {
    const notification = await NotificationScheduler.findByPk(id);
    if (!notification) {
      throw new AppError('Notification scheduler not found', 404);
    }
    return notification;
  }

  async updateNotificationScheduler(id: number, body: IUpdateNotificationScheduler) {
    const notification = await NotificationScheduler.findByPk(id);
    if (!notification) {
      throw new AppError('Notification scheduler not found', 404);
    }

    // If updating date/time, ensure it's not in the past
    if (body.date || body.time) {
      const updateDate = body.date || notification.date;
      const updateTime = body.time || notification.time;
      const scheduledDateTime = new Date(`${updateDate}T${updateTime}`);

      if (scheduledDateTime <= new Date()) {
        throw new AppError('Scheduled date and time cannot be in the past', 400);
      }
    }

    await notification.update(body);
    return notification;
  }

  async deleteNotificationScheduler(id: number) {
    const notification = await NotificationScheduler.findByPk(id);
    if (!notification) {
      throw new AppError('Notification scheduler not found', 404);
    }

    await notification.destroy();
    return { message: 'Notification scheduler deleted successfully' };
  }

  async getNotificationSchedulersByUser(userId: number, query: PaginationOptions) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await NotificationScheduler.findAndCountAll({
      where: {
        userId: {
          [Op.contains]: [userId]
        }
      },
      limit: parseInt(limit.toString()),
      offset,
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    return {
      notifications: rows,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit.toString()))
      }
    };
  }

  async toggleNotificationSchedulerStatus(id: number) {
    const notification = await NotificationScheduler.findByPk(id);
    if (!notification) {
      throw new AppError('Notification scheduler not found', 404);
    }

    await notification.update({
      isActive: !notification.isActive
    });

    return notification;
  }

  async setCustomerLimit(body: any, id: number) {
    const { maxOrderLimit, minOrderAmount } = body;
    const customer = await Retailer.findOne({
      where: {
        Customer_Number: id
      }
    });
    if (!customer) {
      throw new AppError('Customer not register in the system', 404);
    }
    const updateCustomer = await Retailer.update({
      maxOrderLimit,
      minOrderAmount
    }, { where: { Customer_Number: id } });
    return updateCustomer;
  }

  async getSupportTicket(query: PaginationOptions, status: string) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;
    const { count, rows } = await SupportTicket.findAndCountAll({
      where: { status },
      limit,
      offset
    });

    const supportTicketWithCustomer = await Promise.all(rows.map(async (ticket: any) => {
      const customer = await Customer.findByPk(ticket.C_Number, { attributes: ['C_Name', 'C_Number'] });
      return {
        ...ticket.toJSON(),
        customer
      };
    }));
    return {
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: supportTicketWithCustomer
    };
  }

  async updateSupportTicket(id: number, body: any) {

    const supportTicket = await SupportTicket.findByPk(id);
    if (!supportTicket) {
      throw new AppError('Support ticket not found', 404);
    }
    const [customer, distributor] = await Promise.all([
      Customer.findByPk(supportTicket.C_Number, {
        attributes: ['C_Email', 'C_Name', 'C_Number']
      }),
      Distributor.findOne()
    ]);
    if (body.status !== 'resolved') {
      body.completeNote = null;
    }
    const updatedSupportTicket = await supportTicket.update(body);

    if (body.status !== 'archived') {
      this.sendSupportTicketEmails(updatedSupportTicket, customer, distributor);
      this.notificationScheduler({
        title: `Support Ticket Updated`,
        description: `Your ticket is updated successfully. Current status: ${body.status}`,
        userNumber: supportTicket.C_Number.toString()
      })
    }
    return updatedSupportTicket;
  }


  async sendSupportTicketEmails(supportTicket: SupportTicket, customer: any, distributor: any) {
    try {
      const { id, subject, description, status } = supportTicket;

      const emailJobs: Promise<any>[] = [];

      if (customer?.C_Email) {
        const customerHtml = generateSupportTicketEmail(id, subject, description, status);
        emailJobs.push(
          sendEmail({
            to: customer.C_Email,
            subject: `Support Ticket #${id}`,
            html: customerHtml
          })
        );
      }

      if (distributor?.D_Email) {
        const distributorHtml = generateSupportTicketForDistributor(
          id,
          subject,
          description,
          status,
          customer?.C_Name,
          customer?.C_Number
        );
        emailJobs.push(
          sendEmail({
            to: distributor.D_Email,
            subject: `Support Ticket #${id}`,
            html: distributorHtml
          })
        );
      }

      await Promise.allSettled(emailJobs);
    } catch (error) {
      console.error(`Email sending failed for Support Ticket #${supportTicket.id}:`, error);
      // Optional: log to external logger / retry queue
    }
  }

  async notificationScheduler(body: any) {
    await Notifications.create({
      ...body,
      isActive: true,
    });
    const findDeviceToken = await RetailerDevice.findAll({
      where: {
        customerNumber: Number(body.userNumber)
      }
    });
    const deviceToken = findDeviceToken.map((e: any) => e.deviceToken);
    await sendMultiFCMNotification({
      tokens: deviceToken,
      title: body.title,
      body: body.description
    });
  }

  // Link CRUD methods
  async createLink(body: ICreateLink, req: AuthRequest) {
    const file = req.file;
    if (!file) {
      throw new AppError(Manager.LINK_IMAGE_REQUIRED, 400);
    }
    const { wareHouseName } = req.user;
    const fileUrl = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'links');

    const linkData = {
      name: body.name,
      description: body.description || '',
      logo: fileUrl.url || '',
      url: body.url,
      showInWeb: true,
      isActive: true,
      status: true
    };
    const link = await Link.create(linkData);
    return link;
  }

  async getLinkById(id: number) {
    const link = await Link.findByPk(id);
    if (!link) {
      throw new AppError(Manager.LINK_NOT_FOUND, 404);
    }
    return link;
  }

  async getAllLinks(query: PaginationOptions & IGetLinks) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';
    const isActive = query.isActive;

    const whereCondition: any = {};

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { url: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    const { count: totalCount, rows: links } = await Link.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      links,
    };
  }

  async updateLink(id: number, body: IUpdateLink, req: AuthRequest) {
    console.log(body, 'this is body');
    const file = req.file;
    const { wareHouseName } = req.user;
    if (file) {
      const fileUrl = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'links');
      body.logo = fileUrl.url || '';
    }
    if (body.logo === undefined || body.logo === 'undefined') {
      delete body.logo;
    }

    const link = await Link.findByPk(id);
    if (!link) {
      throw new AppError(Manager.LINK_NOT_FOUND, 404);
    }

    await link.update(body);
    return link;
  }

  async deleteLink(id: number) {
    const link = await Link.findByPk(id);
    if (!link) {
      throw new AppError(Manager.LINK_NOT_FOUND, 404);
    }

    await link.destroy();
    return { success: true, message: Manager.LINK_DELETED_SUCCESSFULLY };
  }

  async toggleLinkStatus(id: number) {
    const link = await Link.findByPk(id);
    if (!link) {
      throw new AppError(Manager.LINK_NOT_FOUND, 404);
    }

    await link.update({
      isActive: !link.isActive
    });

    return link;
  }

  // Story CRUD methods
  async createStory(body: ICreateStory, req: AuthRequest) {
    const file = req.file;
    if (!file) {
      throw new AppError(Manager.STORY_MEDIA_REQUIRED, 400);
    }
    const { wareHouseName } = req.user;
    const fileUrl = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'stories');

    const storyData = {
      mediaUrl: fileUrl.url || '',
      mediaType: body.mediaType,
      caption: body.caption || '',
      expiresAt: moment().add(1, 'day').toDate(),
    };
    const story = await Story.create(storyData);
    return story;
  }

  async getStoryById(id: number) {
    const story = await Story.findByPk(id, {
      attributes: ['id', 'mediaUrl', 'mediaType', 'caption', 'expiresAt'],
      // findByPk ignores where; if you want this filter, use findOne({ where: { id, ... } })
      include: [
        {
          association: 'views',          // <-- matches hasMany alias
          attributes: ['id', 'viewerId', 'viewedAt'],
          separate: true,                // keeps result size small if many views
          order: [['viewedAt', 'DESC']]
        }
      ]
    });

    if (!story) {
      throw new AppError(Manager.STORY_NOT_FOUND, 404);
    }
    return story;
  }

  async getAllStories(query: PaginationOptions & IGetStories) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';
    const mediaType = query.mediaType;

    const whereCondition: any = {
      isActive: true,
      expiresAt: { [Op.gt]: moment().toDate() }
    };

    if (search) {
      whereCondition[Op.or] = [
        { caption: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (mediaType) {
      whereCondition.mediaType = mediaType;
    }

    const { count: totalCount, rows: stories } = await Story.findAndCountAll({
      where: whereCondition,
      include: [
        {
          association: 'views',
          attributes: ['id', 'viewerId', 'viewedAt'],
          separate: true,
          order: [['viewedAt', 'DESC']]
        }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    const storyWithViewers = await Promise.all(stories.map(async (story: any) => {
      const viewers = await Customer.findAll({
        where: { C_Number: story.views.map((v: any) => v.viewerId) }, // multiple IDs
        attributes: ['C_Name', 'C_Number']
      });

      return {
        ...story.toJSON(),
        viewers,
        viewsCount: story.views.length // total number of views
      };
    }));

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stories: storyWithViewers,
    };
  }


  async updateStory(id: number, body: IUpdateStory, req: AuthRequest) {
    const file = req.file;
    const { wareHouseName } = req.user;

    const story = await Story.findByPk(id);
    if (!story) {
      throw new AppError(Manager.STORY_NOT_FOUND, 404);
    }

    if (file) {
      const fileUrl = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'stories');
      body.mediaUrl = fileUrl.url || '';
    }

    await story.update(body);
    return story;
  }

  async deleteStory(id: number) {
    const story = await Story.findByPk(id);
    if (!story) {
      throw new AppError(Manager.STORY_NOT_FOUND, 404);
    }

    await story.destroy();
    return { success: true, message: Manager.STORY_DELETED_SUCCESSFULLY };
  }



  async toggleStoryStatus(id: number) {
    const story = await Story.findByPk(id);
    if (!story) {
      throw new AppError(Manager.STORY_NOT_FOUND, 404);
    }

    await story.update({
      isActive: !story.isActive
    });

    return story;
  }

  // catalog

  async createRetailerProductCatalog(body: ICreateRetailerProductCatalog, req: AuthRequest) {
    const file = req.file;
    const { id } = req.user;
    if (!file) {

      const catalogData = {
        name: body.name,
        description: body.description || '',
        C_Number: id,
        status: true,
        attachment: '',
        isActive: true,
        link: body.link || null
      };
      const catalog = await RetailerProductCatalog.create(catalogData);
      return catalog;

    } else {
      const { wareHouseName } = req.user;
      const fileUrl = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'retailer-product-catalogs');

      const catalogData = {
        name: body.name,
        description: body.description || '',
        C_Number: id,
        status: true,
        attachment: fileUrl.url || '',
        isActive: true,
        link: body.link || null
      };
      const catalog = await RetailerProductCatalog.create(catalogData);
      return catalog;
    }

  }

  async updateRetailerProductCatalog(id: number, body: IUpdateRetailerProductCatalog, req: AuthRequest) {
    const file = req.file;
    const { wareHouseName } = req.user;
    if (file) {
      const fileUrl = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'retailer-product-catalogs');
      body.attachment = fileUrl.url || '';
    }
    const catalog = await RetailerProductCatalog.findByPk(id);
    if (!catalog) {
      throw new AppError(Manager.RETAILER_PRODUCT_CATALOG_NOT_FOUND, 404);
    }
    console.log(body, 'this is body');

    await catalog.update(body);
    return catalog;
  }

  async getAllRetailerProductCatalogs(query: PaginationOptions & IGetRetailerProductCatalogs) {
    let { page = 1, limit = 10, search, isActive, status } = query;
    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    let whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { status: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count: totalCount, rows: catalogs } = await RetailerProductCatalog.findAndCountAll({
      where: whereClause,
      order: [['id', 'DESC']],
      limit,
      offset
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      catalogs
    };
  }

  async deleteRetailerProductCatalog(id: number) {
    const catalog = await RetailerProductCatalog.findByPk(id);
    if (!catalog) {
      throw new AppError(Manager.RETAILER_PRODUCT_CATALOG_NOT_FOUND, 404);
    }

    await catalog.destroy();
    return { message: "Retailer product catalog deleted successfully" };
  }

  // WebView CRUD methods
  async createWebView(body: ICreateWebView, req: AuthRequest) {
    const { section, order = 0 } = body;

    // Check if image is uploaded
    if (!req.file) {
      throw new AppError(Manager.WEBVIEW_IMAGE_REQUIRED, 400);
    }

    // Upload image to Azure
    const uploadedImageUrl = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, 'webview');

    const webView = await WebViewImage.create({
      section,
      image_url: uploadedImageUrl.url || '',
      isActive: true,
      order,
      productArray: body.productsList
        ? JSON.parse(body.productsList) as number[]
        : null,
    });


    return webView;
  }

  async getWebViewById(id: number) {
    const webView = await WebViewImage.findByPk(id);
    if (!webView) {
      throw new AppError(Manager.WEBVIEW_NOT_FOUND, 404);
    }
    return webView;
  }

  async getAllWebViews(query: PaginationOptions & IGetWebViews) {
    const { page = 1, limit = 10, search, section, groupBySection = false } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      isActive: true
    };

    if (search) {
      whereClause[Op.or] = [
        { section: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (section) {
      whereClause.section = section;
    }

    // If grouping is requested, get all records without pagination

    // Regular paginated response
    const { count, rows } = await WebViewImage.findAndCountAll({
      where: whereClause,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
    });

    const webViewsWithProducts = await Promise.all(rows.map(async (webView: any) => {
      const products = await Inventory.findAll({
        where: { Item_Number: webView.productArray },
        attributes: ['Item_Number', 'Description', 'AltDesc']
      });
      return { ...webView.toJSON(), products };
    }));

    return {
      webViews: webViewsWithProducts,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async updateWebView(id: number, body: IUpdateWebView, req: AuthRequest) {
    const webView = await WebViewImage.findByPk(id);
    if (!webView) {
      throw new AppError(Manager.WEBVIEW_NOT_FOUND, 404);
    }

    const updateData: any = { ...body };

    // Handle image upload if provided
    if (req.file) {
      const uploadedImageUrl = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, 'webview');
      updateData.image_url = uploadedImageUrl.url || '';
    }

    await webView.update(updateData);
    return webView;
  }

  async deleteWebView(id: number) {
    const webView = await WebViewImage.findByPk(id);
    if (!webView) {
      throw new AppError(Manager.WEBVIEW_NOT_FOUND, 404);
    }

    await webView.destroy();
    return { message: Manager.WEBVIEW_DELETED_SUCCESSFULLY };
  }

  async getWebViewsBySection(section: 'header' | 'middle' | 'bottom') {
    const webViews = await WebViewImage.findAll({
      where: { section },
      order: [['order', 'ASC'], ['created_at', 'DESC']],
    });

    return webViews;
  }

  async updateWebViewProducts(id: number, body: any) {
    const webView = await WebViewImage.findByPk(id);
    if (!webView) {
      throw new AppError(Manager.WEBVIEW_NOT_FOUND, 404);
    }
    await webView.update({ productArray: body.productIds });
  }

  async getWebViewsGroupedBySection(query: PaginationOptions & IGetWebViews): Promise<IWebViewGroupedResponse> {
    const { search, section } = query;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { section: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (section) {
      whereClause.section = section;
    }

    const { count, rows } = await WebViewImage.findAndCountAll({
      where: whereClause,
      order: [['order', 'ASC'], ['created_at', 'DESC']],
    });

    // Group the results by section
    const grouped = {
      header: rows.filter(item => item.section === 'header'),
      middle: rows.filter(item => item.section === 'middle'),
      bottom: rows.filter(item => item.section === 'bottom'),
      pagination: {
        total: count,
        page: 1,
        limit: count,
        totalPages: 1,
      },
    };

    return grouped;
  }

  async getAllWebViewsGrouped(): Promise<Omit<IWebViewGroupedResponse, 'pagination'>> {
    const rows = await WebViewImage.findAll({
      order: [['order', 'ASC'], ['created_at', 'DESC']],
    });

    // Group the results by section
    const grouped = {
      header: rows.filter(item => item.section === 'header'),
      middle: rows.filter(item => item.section === 'middle'),
      bottom: rows.filter(item => item.section === 'bottom'),
    };

    return grouped;
  }

  // Retailer Request CRUD operations
  async createRetailerRequest(body: any) {
    try {

      body.owners = JSON.parse(body.owners);
      body.references = JSON.parse(body.references);
      body.createdBy = 'system';
      const retailerRequest = await CustomerRequest.create(body);
      return retailerRequest;
    } catch (error) {
      throw new AppError('Failed to create retailer request', 500);
    }
  }


  async getRetailerRequestById(id: string) {
    const retailerRequest = await CustomerRequest.findByPk(id);
    if (!retailerRequest) {
      throw new AppError('Retailer request not found', 404);
    }
    return retailerRequest;
  }

  async getAllRetailerRequests(query: any) {
    const { page = 1, limit = 10, search, status, business_type, credit_limit_requested } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { business_name: { [Op.iLike]: `%${search}%` } },
        { primary_contact: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { physical_city: { [Op.iLike]: `%${search}%` } },
        { physical_state: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (business_type) {
      whereClause.business_type = business_type;
    }

    if (credit_limit_requested !== undefined) {
      whereClause.credit_limit_requested = credit_limit_requested;
    }

    const { count, rows } = await CustomerRequest.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit.toString()),
      offset: parseInt(offset.toString()),
    });

    return {
      retailerRequests: rows,
      pagination: {
        total: count,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        totalPages: Math.ceil(count / parseInt(limit.toString())),
      },
    };
  }

  async updateRetailerRequest(id: number, body: any) {
    const retailerRequest = await CustomerRequest.findByPk(id);
    if (!retailerRequest) {
      throw new AppError('Retailer request not found', 404);
    }

    await retailerRequest.update(body);
    return retailerRequest;
  }

  async deleteRetailerRequest(id: number) {
    const retailerRequest = await CustomerRequest.findByPk(id);
    if (!retailerRequest) {
      throw new AppError('Retailer request not found', 404);
    }

    await retailerRequest.destroy();
    return { message: 'Retailer request deleted successfully' };
  }

  async updateRetailerRequestStatus(id: number, status: 'PENDING' | 'REVIEW' | 'APPROVED' | 'REJECTED', notes?: string) {
    const retailerRequest = await CustomerRequest.findByPk(id);
    if (!retailerRequest) {
      throw new AppError('Retailer request not found', 404);
    }

    const updateData: any = { status };
    if (notes) {
      updateData.notes = notes;
    }

    await retailerRequest.update(updateData);
    return retailerRequest;
  }

  // Policies CRUD methods
  async createPolicies(body: any) {
    // Check if policies already exist (assuming only one record should exist)
    const existingPolicies = await Policies.findOne();

    if (existingPolicies) {
      throw new AppError('Policies already exist. Use update instead.', 400);
    }

    const policies = await Policies.create(body);
    return policies;
  }

  async getPolicies() {
    const policies = await Policies.findOne();

    if (!policies) {
      throw new AppError('Policies not found', 404);
    }

    return policies;
  }

  async updatePolicies(body: any) {
    const policies = await Policies.findOne();

    if (!policies) {
      throw new AppError('Policies not found', 404);
    }

    await policies.update(body);
    return policies;
  }

  async updateRefundPolicies(refundPolicies: string) {
    const policies = await Policies.findOne();

    if (!policies) {
      throw new AppError('Policies not found', 404);
    }

    await policies.update({ RefundPolicies: refundPolicies });
    return policies;
  }

  async deletePolicies() {
    const policies = await Policies.findOne();

    if (!policies) {
      throw new AppError('Policies not found', 404);
    }

    await policies.destroy();
    return { success: true, message: 'Policies deleted successfully' };
  }

  // WebCategory CRUD methods
  async createWebCategory(body: any, req: AuthRequest) {
    if (req.file) {
      const uploadedImageUrl = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, 'webview');
      body.image = uploadedImageUrl.url || '';
    }
    const webCategory = await WebCategory.create(body);
    return webCategory;
  }

  async getAllWebCategories(query: PaginationOptions) {
    let { page = 1, limit = 10, search, isActive } = query;

    page = Number(page);
    limit = Number(limit);
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause: any = {
      isActive: true
    };

    if (search) {
      whereClause.name = { [Op.iLike]: `%${String(search)}%` };
    }



    const { count, rows } = await WebCategory.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      webCategories: rows,
      pagination: {
        total: count,
        page: page,
        limit: limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getWebCategoryById(id: number) {
    const webCategory = await WebCategory.findByPk(id);

    if (!webCategory) {
      throw new AppError('Web category not found', 404);
    }

    return webCategory;
  }

  async updateWebCategory(id: number, body: any, req: AuthRequest) {
    if (req.file) {
      const uploadedImageUrl = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, 'webview');
      body.image = uploadedImageUrl.url || '';
    }
    const webCategory = await WebCategory.findByPk(id);

    if (!webCategory) {
      throw new AppError('Web category not found', 404);
    }

    await webCategory.update(body);
    return webCategory;
  }

  async deleteWebCategory(id: number) {
    const webCategory = await WebCategory.findByPk(id);

    if (!webCategory) {
      throw new AppError('Web category not found', 404);
    }

    await webCategory.update({ isActive: false });
    return { success: true, message: 'Web category deleted successfully' };
  }

  // WebPriceClass CRUD methods
  async createWebPriceClass(body: any, req: AuthRequest) {
    if (req.file) {
      const uploadedImageUrl = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, 'webview');
      body.image = uploadedImageUrl.url || '';
    }
    const webPriceClass = await WebPriceClass.create(body);
    return webPriceClass;
  }

  async getAllWebPriceClasses(query: PaginationOptions) {
    let { page = 1, limit = 10, search } = query;

    page = Number(page);
    limit = Number(limit);
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause: any = {
      isActive: true
    };

    if (search) {
      whereClause.name = { [Op.iLike]: `%${String(search)}%` };
    }




    const { count, rows } = await WebPriceClass.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      webPriceClasses: rows,
      pagination: {
        total: count,
        page: page,
        limit: limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getWebPriceClassById(id: number) {
    const webPriceClass = await WebPriceClass.findByPk(id);

    if (!webPriceClass) {
      throw new AppError('Web price class not found', 404);
    }

    return webPriceClass;
  }

  async updateWebPriceClass(id: number, body: any, req: AuthRequest) {
    if (req.file) {
      const uploadedImageUrl = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, 'webview');
      body.image = uploadedImageUrl.url || '';
    }
    const webPriceClass = await WebPriceClass.findByPk(id);

    if (!webPriceClass) {
      throw new AppError('Web price class not found', 404);
    }

    await webPriceClass.update(body);
    return webPriceClass;
  }

  async deleteWebPriceClass(id: number) {
    const webPriceClass = await WebPriceClass.findByPk(id);

    if (!webPriceClass) {
      throw new AppError('Web price class not found', 404);
    }

    await webPriceClass.update({ isActive: false });
    return { success: true, message: 'Web price class deleted successfully' };
  }

  // WebQuickLink CRUD methods
  async createWebQuickLink(body: any) {
    console.log(body, '=----->');
    const webQuickLink = await WebQuickLink.create(body);
    return webQuickLink;
  }

  async getAllWebQuickLinks(query: PaginationOptions) {
    const { page = 1, limit = 10, search = '' } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      isActive: true
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${String(search)}%` } },
        { description: { [Op.iLike]: `%${String(search)}%` } }
      ];
    }

    const { count, rows } = await WebQuickLink.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit.toString()))
      }
    };
  }

  async getWebQuickLinkById(id: number) {
    const webQuickLink = await WebQuickLink.findOne({
      where: { id, isActive: true }
    });

    if (!webQuickLink) {
      throw new AppError('Web quick link not found', 404);
    }

    return webQuickLink;
  }

  async updateWebQuickLink(id: number, body: any, req: AuthRequest) {
    const webQuickLink = await WebQuickLink.findOne({
      where: { id, isActive: true }
    });

    if (!webQuickLink) {
      throw new AppError('Web quick link not found', 404);
    }

    if (req.file) {
      const uploadedImageUrl = await uploadFileToAzure(req.file.buffer, req.file.originalname, req.file.mimetype, 'webview');
      body.image = uploadedImageUrl.url || '';
    }

    await webQuickLink.update(body);
    return webQuickLink;
  }

  async deleteWebQuickLink(id: number) {
    const webQuickLink = await WebQuickLink.findOne({
      where: { id, isActive: true }
    });

    if (!webQuickLink) {
      throw new AppError('Web quick link not found', 404);
    }

    await webQuickLink.update({ isActive: false });
    return { message: 'Web quick link deleted successfully' };
  }

  // WebLocation CRUD methods
  async createWebLocation(body: any) {
    const webLocation = await WebLocation.create(body);
    return webLocation;
  }

  async getAllWebLocations(query: PaginationOptions) {
    const { page = 1, limit = 10, search = '' } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { latitude: { [Op.iLike]: `%${String(search)}%` } },
        { longitude: { [Op.iLike]: `%${String(search)}%` } }
      ];
    }

    const { count, rows } = await WebLocation.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit.toString()),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit.toString()))
      }
    };
  }

  async getWebLocationById(id: number) {
    const webLocation = await WebLocation.findByPk(id);

    if (!webLocation) {
      throw new AppError('Web location not found', 404);
    }

    return webLocation;
  }

  async updateWebLocation(id: number, body: any) {
    const webLocation = await WebLocation.findByPk(id);

    if (!webLocation) {
      throw new AppError('Web location not found', 404);
    }

    await webLocation.update(body);
    return webLocation;
  }

  async deleteWebLocation(id: number) {
    const webLocation = await WebLocation.findByPk(id);

    if (!webLocation) {
      throw new AppError('Web location not found', 404);
    }

    await webLocation.destroy();
    return { message: 'Web location deleted successfully' };
  }


  async setUserDiscountLimit(userId: number, setUserDiscountLimit: number) {
    return await WebUsers.update({ setUserDiscountLimit: setUserDiscountLimit }, { where: { id: userId } });
  }


  async getCustomerCalenderList(query: PaginationOptions) {
    let { routeNumber, salesRepNumber } = query;

    const customerWhere: any = {
      C_Inactive: false,
      C_OrderDay: {
        [Op.notIn]: [0, 8]
      }
    };


    if (salesRepNumber) {
      customerWhere.C_Salesman = { [Op.in]: salesRepNumber }; // ✅ IN operator
    }

    const routeWhere: any = {};
    if (routeNumber) {
      routeWhere.Route_Number = { [Op.in]: routeNumber }; // ✅ IN operator
    }

    const customers = await Customer.findAll({
      where: customerWhere,
      attributes: [
        'C_Number',
        'C_Name',
        'C_CoName',
        'C_OrderDay',
        'C_Salesman',
        // 👇 Add the computed day name
        [literal(`
          CASE 
            WHEN "C_OrderDay" = 1 THEN 'Monday'
            WHEN "C_OrderDay" = 2 THEN 'Tuesday'
            WHEN "C_OrderDay" = 3 THEN 'Wednesday'
            WHEN "C_OrderDay" = 4 THEN 'Thursday'
            WHEN "C_OrderDay" = 5 THEN 'Friday'
            WHEN "C_OrderDay" = 6 THEN 'Saturday'
            WHEN "C_OrderDay" = 7 THEN 'Sunday'
            ELSE NULL
          END
        `), 'OrderDayName']
      ],
      include: [
        {
          model: CustomerRoute,
          as: "Routes",
          attributes: ["Route_Number", "Stop_Number"],
          where: Object.keys(routeWhere).length ? routeWhere : undefined, // apply only if provided
          required: !!routeNumber, // only inner join if route filter exists
        },
      ],
    });

    return customers;
  }


  async getCustomerOrderByCalenderDate(query: PaginationOptions) {
    let { orderDate, orderDay, page = 1, limit = 10, routeNumber, salesRepNumber } = query;
    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;
    const dayNum = Number(orderDay);

    if (Number.isNaN(dayNum)) throw new AppError("Invalid orderDay", 400);

    const normalizedDate = String(orderDate).slice(0, 10); // 'YYYY-MM-DD'

    // --- Build filters ---
    const customerWhere: any = {
      C_Inactive: false,
      C_OrderDay: dayNum,
    };

    if (salesRepNumber) {
      customerWhere.C_Salesman = salesRepNumber;
    }

    const routeWhere: any = {};
    if (routeNumber) {
      routeWhere.Route_Number = routeNumber;
    }

    // 1) Customers for that day with filters + count for pagination
    const { count, rows: customers } = await Customer.findAndCountAll({
      where: customerWhere,
      attributes: [
        "C_Number",
        "C_Name",
        "C_CoName",
        "C_Email",
        "C_Phone",
        "C_PhoneMobile",
        "C_Address",
        "C_City",
        "C_State",
        "C_Zip",
        "C_Country",
        "C_Salesman",
      ],
      include: [
        {
          model: CustomerRoute,
          as: "Routes",
          attributes: ["Route_Number", "Stop_Number"],
          where: Object.keys(routeWhere).length ? routeWhere : undefined, // apply only if provided
          required: !!routeNumber, // only inner join if route filter exists
        },
      ],
      limit,
      offset,
      raw: true,
    });

    if (!customers || customers.length === 0) {
      return { total: 0, page, limit, data: [] };
    }

    const customerNumbers = customers.map((c) => c.C_Number);

    // 2) Orders for those customers on the date
    const orders = await OrderHeader.findAll({
      where: {
        C_Number: { [Op.in]: customerNumbers },
        Order_Date: normalizedDate,
      },
      attributes: ["Order_Number", "C_Number"],
      raw: true,
    });

    const customersWithOrders = new Set(orders.map((o: any) => o.C_Number));

    // 3) Build result with status
    const result = customers.map((cust) => ({
      ...cust,
      status: customersWithOrders.has(cust.C_Number) ? "done" : "pending",
    }));

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: result,
    };
  }

  async getCustomerTotalOrderByCustomer(query: PaginationOptions) {
    let { orderDate, orderDay, routeNumber, salesRepNumber } = query;
  
    const dayNum = Number(orderDay);
    if (Number.isNaN(dayNum)) throw new AppError("Invalid orderDay", 400);
  
    const normalizedDate = String(orderDate).slice(0, 10); // 'YYYY-MM-DD'
  
    // --- Build filters ---
    const customerWhere: any = {
      C_Inactive: false,
      C_OrderDay: dayNum,
    };
  
    if (salesRepNumber) {
      customerWhere.C_Salesman = salesRepNumber;
    }
  
    const routeWhere: any = {};
    if (routeNumber) {
      routeWhere.Route_Number = routeNumber;
    }
  
    // 1️⃣ Customers for that day
    const { count, rows: customers } = await Customer.findAndCountAll({
      where: customerWhere,
      attributes: [
        "C_Number",
        "C_Name",
        "C_CoName",
        "C_Email",
        "C_Phone",
        "C_PhoneMobile",
        "C_Address",
        "C_City",
        "C_State",
        "C_Zip",
        "C_Country",
        "C_Salesman",
      ],
      include: [
        {
          model: CustomerRoute,
          as: "Routes",
          attributes: ["Route_Number", "Stop_Number"],
          where: Object.keys(routeWhere).length ? routeWhere : undefined,
          required: !!routeNumber,
        },
      ],
      
      raw: true,
    });
  
    const customerNumbers = customers.map((c: any) => c.C_Number);
  
    // 2️⃣ Orders for those customers on that date
    const orders = await OrderHeader.findAll({
      where: {
        C_Number: { [Op.in]: customerNumbers },
        Order_Date: normalizedDate,
      },
      attributes: ["Order_Number", "C_Number"],
      raw: true,
    });
  
    const customersWithOrders = new Set(orders.map((o: any) => o.C_Number));
  
    // 3️⃣ Build result list + status
    const result = customers.map((cust) => ({
      ...cust,
      status: customersWithOrders.has(cust.C_Number) ? "done" : "pending",
    }));
  
    // 4️⃣ Count done vs pending
    const doneCount = result.filter((r) => r.status === "done").length;
    const pendingCount = result.filter((r) => r.status === "pending").length;
  
    // 5️⃣ Return result + summary
    return {
      total: count,
      doneCount,
      pendingCount
    };
  }
  

  async checkSalesCallTime(customerNumber: number, salesRepNumber: number, webUserId: number) {
    const checkSalesCallTime = await SalesCallTime.findOne({
      where: {
        customer_number: customerNumber,
        salesRepNumber: salesRepNumber,
        webUserId: webUserId,
      },
    });
    return checkSalesCallTime?.dataValues ? checkSalesCallTime.dataValues : null;
  }

  async getCustomerOrderOfCurrentWeek(query: PaginationOptions, id: number) {
    const { orderDate } = query;

    const base = moment(orderDate, ['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY-DD-MM'], true);
    if (!base.isValid()) {
      throw new Error(`Invalid 'orderDate': ${orderDate}`);
    }

    const startDate = base.clone().subtract(6, 'days').startOf('day').toDate();
    const endDate = base.clone().endOf('day').toDate();

    const whereClause: any = { C_Number: id, Order_Date: {} };

    if (startDate) {
      whereClause.Order_Date[Op.gte] = startDate;
    }
    if (endDate) {
      whereClause.Order_Date[Op.lte] = endDate;
    }

    const orders: any = await OrderHeader.findAll({
      where: whereClause,
      attributes: ['Order_Number', 'C_Number', 'Order_Date'],
      raw: true,
    });

    const results = [];
    for (const order of orders) {
      const orderNumber = order.Order_Number;

      const details = await OrderDetail.findAll({
        where: { Order_Number: orderNumber },
        attributes: [
          'Price',
          'OTP_Amount_State',
          'Quantity_Ordered',
          'OffInvoice_Amount',
          'DepositAmount'
        ],
        raw: true,
      });

      let totalPrice = 0;
      let totalQty = 0;
      for (const d of details) {
        const price = Number(d.Price || 0) + Number(d.OTP_Amount_State || 0);
        const qty = Number(d.Quantity_Ordered || 0);
        totalPrice += price * qty;
        totalQty += qty;
      }
      results.push({
        ...order,
        totals: {
          totalPrice: Number(totalPrice.toFixed(2)),
          totalQty: totalQty,
        },
      });

    }

    return {
      orders: results,
      totalCount: results.length,
    }
  }

  async getCustomerByIdInfoInCalender(customerId: number) {
    const data = await Customer.findByPk(customerId, {
      attributes: ['C_Number', 'C_Name', 'C_CoName', 'C_Email', 'TermsCode', 'C_Phone', 'C_Memo', 'C_PhoneMobile', 'Credit_Limit', 'LastBalance', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Country', 'C_OperationHours1', 'C_OperationHours2'],
      include: [
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number'],
        },
        {
          model: Terms,
          as: 'terms',
          attributes: ['Terms', 'DaysUntilDue'],
        },
      ],

    })


    return {
      ...data?.dataValues,
    }
  }

  // ContactUs CRUD service methods
  async createContactUs(data: IContactUs) {
    const contactUs = await ContactUs.create(data);
    return contactUs;
  }

  async getContactUsById(id: number) {
    const contactUs = await ContactUs.findByPk(id);
    if (!contactUs) {
      throw new AppError('Contact us information not found', 404);
    }
    return contactUs;
  }

  async getAllContactUs(query: PaginationOptions & { search?: string }) {
    const { page = 1, limit = 10, search = '' } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { PhoneNO: { [Op.iLike]: `%${search}%` } },
        { WhatupNo: { [Op.iLike]: `%${search}%` } },
        { EmailAdd: { [Op.iLike]: `%${search}%` } },
        { SalesRepName: { [Op.iLike]: `%${search}%` } },
        { Fax: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ContactUs.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  async updateContactUs(id: number, data: Partial<IContactUs>) {
    const contactUs = await ContactUs.findByPk(id);
    if (!contactUs) {
      throw new AppError('Contact us information not found', 404);
    }

    await contactUs.update(data);
    return contactUs;
  }

  async deleteContactUs(id: number) {
    const contactUs = await ContactUs.findByPk(id);
    if (!contactUs) {
      throw new AppError('Contact us information not found', 404);
    }

    await contactUs.destroy();
    return { message: 'Contact us information deleted successfully' };
  }

  // Email Management CRUD service methods  
  async createEmailConfig(data: any) {
    const emailConfig = await EmailConfig.create(data);
    return emailConfig;
  }

  async getEmailConfigById(id: number) {
    const emailConfig = await EmailConfig.findByPk(id);
    if (!emailConfig) {
      throw new AppError('Email configuration not found', 404);
    }
    return emailConfig;
  }

  async getAllEmailConfigs(query: PaginationOptions & { search?: string; userId?: number; isActive?: boolean }) {
    const { page = 1, limit = 10, search = '', userId, isActive } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { host: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { fromEmail: { [Op.iLike]: `%${search}%` } },
        { fromName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (userId) {
      whereClause.userId = userId;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    const { count, rows } = await EmailConfig.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  async updateEmailConfig(id: number, data: any) {
    const emailConfig = await EmailConfig.findByPk(id);
    if (!emailConfig) {
      throw new AppError('Email configuration not found', 404);
    }

    await emailConfig.update(data);
    return emailConfig;
  }

  async deleteEmailConfig(id: number) {
    const emailConfig = await EmailConfig.findByPk(id);
    if (!emailConfig) {
      throw new AppError('Email configuration not found', 404);
    }

    await emailConfig.destroy();
    return { message: 'Email configuration deleted successfully' };
  }

  async getEmailConfigsByUser(userId: number, query: PaginationOptions) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await EmailConfig.findAndCountAll({
      where: { userId },
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  async toggleEmailConfigStatus(id: number) {
    const emailConfig = await EmailConfig.findByPk(id);
    if (!emailConfig) {
      throw new AppError('Email configuration not found', 404);
    }

    await emailConfig.update({ isActive: !emailConfig.isActive });
    return emailConfig;
  }

  async testEmailConfig(data: any) {
    const { to, subject, html } = data;
    const result = await sendDistributorEmail(to, subject, html,);
    return result;
  }

  // Email Marketing CRUD service methods
  async createEmailMarketing(data: any) {
    if (data.status == 'draft') {
      const emailMarketing = await EmailMarketing.create(data);
      return emailMarketing;
    } else {

      const { to, subject, body, cc, attachments } = data;
      if (!Array.isArray(to) || to.length === 0) {
        throw new AppError('to array is required', 400);
      }
      if (!subject || !body) {
        throw new AppError('subject and html are required', 400);
      }

      const emailMarketing = await EmailMarketing.create(data);


      const jobs: any[] = to.map((u: any) => ({
        to: u.toLowerCase(),      // adapt to your structure
        subject,
        html:body,
        cc,
        attachments,
        id: emailMarketing.id
      }));
  
      // Add jobs to notification queue
      await Promise.all(
        jobs.map((job) =>
          emailNotificationQueue.add('send-notification-email', job, {
            attempts: 3,              // retry up to 3 times
            backoff: { type: 'exponential', delay: 10000 }, // 10s, 20s, 40s
            removeOnComplete: true,
            removeOnFail: false,
          })
        )
      );
  
      // RESPONSE IS FAST – server not blocked.
      return {
        message: 'Notification emails queued successfully',
        queuedCount: jobs.length,
      };

      // sendEmailToMarketing({
      //   to: emailMarketing.to,
      //   subject: emailMarketing.subject,
      //   cc: emailMarketing.cc,
      //   html: emailMarketing.body,
      //   attachments: emailMarketing.attachments,
      //   id: emailMarketing.id
      // }).catch(async err => {
      //   await EmailMarketing.update({ status: 'failed' }, { where: { id: emailMarketing.id } });
      //   console.error('Email sending failed:', err);
      // });
    }

  }

  async getEmailMarketingById(id: number) {
    const emailMarketing = await EmailMarketing.findByPk(id);
    if (!emailMarketing) {
      throw new AppError('Email marketing campaign not found', 404);
    }
    return emailMarketing;
  }

  async getAllEmailMarketing(query: PaginationOptions & { search?: string; userId?: number }) {
    const { page = 1, limit = 10, search = '', userId } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { body: { [Op.iLike]: `%${search}%` } },
        { to: { [Op.contains]: [search] } },
      ];
    }

    if (userId) {
      whereClause.userId = userId;
    }

    const { count, rows } = await EmailMarketing.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  async getEmailMarketingByUser(userId: number, query: PaginationOptions) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await EmailMarketing.findAndCountAll({
      where: { userId },
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  async uploadAttachment(req: AuthRequest) {
    const file = req.file;
    if (!file) {
      throw new AppError(AuthMessage.FILE_NOT_FOUND, 400);
    }
    const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'email-attachments');
    console.log(result, 'this is result');
    return result;
  }

  async sendEmailToCampaign(id: number) {
    const emailMarketing = await EmailMarketing.findByPk(id);
    if (!emailMarketing) {
      throw new AppError('Email marketing campaign not found', 404);
    }
    if (emailMarketing.status != 'draft') {
      throw new AppError('Email marketing campaign is not draft', 400);
    }
    sendEmailToMarketing({
      to: emailMarketing.to,
      subject: emailMarketing.subject,
      cc: emailMarketing.cc,
      html: emailMarketing.body,
      attachments: emailMarketing.attachments,
      id: emailMarketing.id
    }).catch(async err => {
      await EmailMarketing.update({ status: 'failed' }, { where: { id: emailMarketing.id } });
      console.error('Email sending failed:', err);
    });
    await EmailMarketing.update({ status: 'queued' }, { where: { id: emailMarketing.id } });
    return emailMarketing;
  }
  async getGenerateBarcodeAndUpload(text: string) {
    const res = await generateBarcodeAndUpload("order111", {
      folderName: 'barcodes/orders',
      type: 'code128',
      includeText: true,
      scale: 4,
      height: 14,
    });
    return res;
  }


  async createInventory(body: any) {
    const nextItemNumber = await getNextItemNumber();
    const defaultValues = await getDefaultInventoryValues(0);
    body.Item_Number = nextItemNumber;

    body.PriceCostModifiedDate = new Date();
    
      body.Inactive_Date = new Date();

    const finalBody = {
      ...defaultValues,
      ...body
    }
    const inventory = await Inventory.create(finalBody);

    if(body.hasAddUpc){
      console.log(body.upcData, 'this is upcData');
      const upcData = body.upcData.map((item:any) => ({
        UPC_Number: item.UPC_Number,
        Jurisdiction_State: 0,
        Jurisdiction_County: 0,
        Jurisdiction_City: 0,
        Item_Number: nextItemNumber,
        Status: item.Status,
        Priority: item.Priority,
        Qty: item.Qty,
                   
        ItemNumber: nextItemNumber 
      }));
      
      await InventoryUPC.bulkCreate(upcData).catch(async err => {
        console.error('InventoryUPC creation failed:', err);
      });

    }
    return inventory;
  }



  async createVendor(body: any ) {
    const nextVendorNumber = await getNextVendorNumber(); 
    const defaultValues = getDefaultVendorValues(0);
    
    body.Primary_Vendor = nextVendorNumber;
    body.Date_Created = new Date();
    body.Last_Modified = new Date();

    const finalBody = { ...defaultValues, ...body };
    const vendor = await Vendor.create(finalBody);

    return vendor;
  }

  async createErpUser(body: any){
    const defaultErpUserValues = getDefaultErpUserValues();
    const nextUserNumber = await getNextUserNumber();
 if (body.UserIsActive !== undefined) {
    body.UserIsActive = body.UserIsActive == 1 ? true : false;
  }
    body.UserNumber = nextUserNumber;
    const finalBody = { ...defaultErpUserValues, ...body,UserNumber: nextUserNumber };
    const erpUser = await Users.create(finalBody);

    return erpUser;
  }

  async updateErpUser(id: number, body: any){
    const userNumber = await Users.findByPk(id);
     if (body.UserIsActive !== undefined) {
        body.UserIsActive = body.UserIsActive == 1 ? true : false;
      }
    if(!userNumber){
      throw new AppError('ERP user not found', 404);
    }

    await userNumber.update(body);
    return userNumber;
  }

  async getAllErpUsers() {
    const userList = await Users.findAll({
      order: [["UserNumber", "ASC"]],
    });

    return userList;
}       

  async getAllCheckerUsers() {
    const checkerUsers = await WebUsers.findAll({
      where: {
        role: "checker",
        isActive: true,
      },
      attributes: ["email", "firstName", "lastName", "userNumber"],
      order: [["userNumber", "ASC"]],
    });

    return checkerUsers;
  }

async getErpUserById(id: number){
    const erpUser  = await Users.findByPk(id)
    if(!erpUser){
      throw new AppError('ERP User not found', 404);
    }
    return erpUser;
}

  async editInventory(id: number, body: any) {
    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      throw new AppError('Inventory not found', 404);
    }
    if(body.I_Inactive){
      body.Inactive_Date = new Date();
    }
    body.PriceCostModifiedDate = new Date();
   
    await inventory.update(body);
    return inventory;
  }

  async editUpcNumber(key: number, upcNumber: string) {
    const inventoryUPC = await InventoryUPC.findOne({
      where: { myKey: key }});
    if (!inventoryUPC) {
      throw new AppError('InventoryUPC not found', 404);
    }
    await inventoryUPC.update({ UPC_Number: upcNumber });
        return inventoryUPC;
  }

  async getInventoryByItemNumber(itemNumber: number) {
    const inventory = await Inventory.findOne({
      where: { Item_Number: itemNumber },
      include: [
        {
          model: InventoryUPC,
          as: 'UPCList',
        
        },
      ],
    });
    if (!inventory) {
      throw new AppError('Inventory not found', 404);
    }
    return inventory;
  }

  // InventoryUPC CRUD service methods
  async createInventoryUPC(body: any) {
    const inventoryUPC = await InventoryUPC.create(body);
    return inventoryUPC;
  }

  async getInventoryUPCById(id: number) {
    const inventoryUPC = await InventoryUPC.findByPk(id);
    if (!inventoryUPC) {
      throw new AppError('InventoryUPC not found', 404);
    }
    return inventoryUPC;
  }

  async getInventoryForReport(){
    const inventoryList = await Inventory.findAll({
      order: [['Item_Number', 'ASC']],
      attributes:['Item_Number','Description','I_Inactive','MinimumStockAvailability','Vendor_ItemNumberAlpha','Sequence',
          'Pack','CaseCount','UOM','Price1','Price2','Price3','Price4','Price5','Price6','Retail1','Retail2','Retail3','UnitOunces','OTP_Number','AvgCost','BaseCost','Invoice_Cost',
          'NetCost','MSA_Category_Code','Section','Location','I_Discontinued'
      ],
      include: [
        {
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['myKey','UPC_Number', 'Status','Priority'],
        },
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Sales_Category','Category_Desc'],
        },
        {
          model: Vendor,
          as: 'primaryVendor',
          attributes: ['Primary_Vendor','V_Description'],
        },
        {
          model: Vendor,
          as: 'manufacturerVendor',
          attributes: ['Primary_Vendor','V_Description'],
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Price_Class','Class_Desc'],
        },
        {
          model: PriceSubclass_Defs,
          as: 'PriceSubclass',
          attributes: ['Price_Subclass','Subclass_Def'],

        }
      ],
    });
    return inventoryList;
  }


   // EpickSetting CRUD methods
  async createEpickSetting(body: { pin: string; allowSingleScan: boolean }) {
    const epickSetting = await EpickSetting.create(body);
    return epickSetting;
  }

    async getEpickSettingById(id: number) {
    const epickSetting = await EpickSetting.findByPk(id);
    if (!epickSetting) {
      throw new AppError('Epick setting not found', 404);
    }
    return epickSetting;
  }


  

  async updateInventoryUPC(id: number, body: any) {
    const inventoryUPC = await InventoryUPC.findByPk(id);
    if (!inventoryUPC) {
      throw new AppError('InventoryUPC not found', 404);
    }
    
    await inventoryUPC.update(body);
    return inventoryUPC;
  }

  async deleteInventoryUPC(id: number) {
    const inventoryUPC = await InventoryUPC.findByPk(id);
    if (!inventoryUPC) {
      throw new AppError('InventoryUPC not found', 404);
    }
    
    await inventoryUPC.destroy();
    return { message: 'InventoryUPC deleted successfully' };
  }

  async getInventoryUPCByItemNumber(itemNumber: string) {
    const inventoryUPCs = await InventoryUPC.findAll({
      where: { Item_Number: itemNumber },
      order: [['myKey', 'DESC']]
    });
    return inventoryUPCs;
  }

  async getInventoryUPCByJurisdiction(jurisdictionState: number, jurisdictionCounty?: number, jurisdictionCity?: number) {
    const whereClause: any = { Jurisdiction_State: jurisdictionState };
    
    if (jurisdictionCounty !== undefined) {
      whereClause.Jurisdiction_County = jurisdictionCounty;
    }
    
    if (jurisdictionCity !== undefined) {
      whereClause.Jurisdiction_City = jurisdictionCity;
    }
    
    const inventoryUPCs = await InventoryUPC.findAll({
      where: whereClause,
      order: [['myKey', 'DESC']]
    });
    return inventoryUPCs;
  }

  async checkUPCExists(UPC_Number: string) {
    if (!UPC_Number) {
      throw new AppError('UPC_Number is required', 400);
    }

    const item = await InventoryUPC.findOne({
      where: {
        UPC_Number: UPC_Number, 
      },
      attributes: ["UPC_Number", "Item_Number"],
    });

    return item ? true : false;
  }
    
  async updateEpickSetting(id: number, body: { pin?: string; allowSingleScan?: boolean }) {
    const epickSetting = await EpickSetting.findByPk(id);
    if (!epickSetting) {
      throw new AppError('Epick setting not found', 404);
    }

    await epickSetting.update(body);
    return epickSetting;
  }

async getAllEpickSettings(query: PaginationOptions) {
  const { page = 1, limit = 10 } = query;

  const offset = (page - 1) * limit;

  // Fetch data with pagination
  const { rows: data, count: total } = await EpickSetting.findAndCountAll({
    offset,
    limit,
    order: [['createdAt', 'DESC']], // optional sorting
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data,
  };
}

  async deleteEpickSetting(id: number) {
    const epickSetting = await EpickSetting.findByPk(id);
    if (!epickSetting) {
      throw new AppError('Epick setting not found', 404);
    }

    await epickSetting.destroy();
    return { message: 'Epick setting deleted successfully' };
  }

  async putPassScanItem(body:any){
    const passScanItem = await PassScanItem.create(body);
    return passScanItem;

  }

  async createCustomer(data: any){
    const nextCustomerNumber = await getNextCustomerNumber();

    const finalData = {
      ...getDefaultCustomerValues(0),
      C_Number: nextCustomerNumber,
      ...data
    }
    const customer = await Customer.create(finalData);
    return customer;
  }

  async updateUserAllowDiscount(data: any,id: number){
    const user = await WebUsers.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    await user.update({ allowDiscount: data.allowDiscount });
    return user;
  }
  

  async updateCustomer(data: any,id: number){

    const finalData = {
      ...data
    }
    const customer = await Customer.update(finalData,{where:{C_Number:id}});
    return customer;
  }

  

  async updateVendor(body: any ,id: number) {
    body.Last_Modified = new Date();
    const finalBody = {  ...body };
    const vendor = await Vendor.update(finalBody,{where:{Primary_Vendor:id}});
    return vendor;
  }

  
  async getVendorById(id: number) {
    const vendor = await Vendor.findOne({where:{Primary_Vendor:id}});
    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }
    return vendor;
  }

  async getCustomerDetailsById(id: number) {
    const customer = await Customer.findOne({where:{C_Number:id}});
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    return customer;
  }

} 
