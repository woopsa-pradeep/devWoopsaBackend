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
import { Operations } from "../utils/operations";
import { uploadFileToAzure } from "../utils/azureUploader";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { cast, col, literal, Op, Order, Sequelize, where } from 'sequelize';
import { PriceClass } from "../models/mmsql/priceClass.model";
import Banner from "../models/postgres/banner.model";
import { SalesCategory } from "../models/mmsql/salesCategory.model";
import { Vendor } from "../models/mmsql/vendor.model";
import { Users } from "../models/mmsql/user.model"
import { CustReceivables } from "../models/mmsql/custReceivables.model";
import { Token } from "../models/postgres/token.model";
import { Retailer } from "../models/postgres/retailer.model";
import { checkRegisterCustomer, generateRandomString, getDiscount, getFirstValidPrice, getInventoryOnHand, getTaxRateV1, hashPassword, hasPriceChange, pgArrayToJsArray, sendEmailToMarketing, toNum } from "../utils/helper";
import { generateNewCredentialsEmail, generateSupportTicketEmail, generateSupportTicketForDistributor } from "../view/emails";
import { sendDistributorEmail, sendEmail } from "../utils/sendMail";
import { WebUsers } from "../models/postgres/users.model";
import { EpickUser } from "../models/postgres/epickUser.model";
import { EpickConfirmation } from "../models/postgres/epickConfirmation.model";
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
import { POHeader } from "../models/mmsql/poHeader.model";
import { EmailConfig } from "../models/postgres/emailManagement.model";
import { EmailMarketing } from "../models/postgres/emailMarketing.model";
import { generateBarcodeAndUpload } from "../utils/barCodeGenerate";
import { getDefaultInventoryValues, getNextItemNumber } from "../utils/inventory";
import EpickSetting from "../models/postgres/epickSetting.model";
import InvoiceSetting from "../models/postgres/invoiceSetting.model";
import { PassScanItem } from "../models/postgres/passScanItem.model";
import { getDefaultCustomerValues, getNextCustomerNumber } from "../utils/customer";
import OrderDiscount from "../models/postgres/orderDiscount.model";
import { getDefaultVendorValues, getNextVendorNumber } from "../utils/vendor";
import { getDefaultErpUserValues, getNextUserNumber } from "../utils/erpUsers";
import settings from "../models/postgres/setting.model"
import { emailNotificationQueue } from "../configuration/config";
import { markAsUntransferable } from "worker_threads";
import { PriceSubclass_Defs } from "../models/mmsql/priceSubClassDefs.model";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { postgresSequelize } from "../db";
import { QueryTypes } from "sequelize";
import InventoryHistory from "../models/mmsql/inventoryHistory.model";
import { ClassOfTrade } from "../models/mmsql/classOfTrade.model";
import { TaxRates } from "../models/mmsql/taxRates.model";
import { TaxRates_City } from "../models/mmsql/taxRateCity.model";
import { TaxRates_County } from "../models/mmsql/taxRateCounty.model";
import { PurchaseOrderRequest } from "../interfaces/request.body.interface";
import { getDefaultPOHeaderValues, getNextPONumber } from "../utils/purchaseOrder";
import {  PODetail } from "../models/mmsql/poDetail.model";
import { now } from "moment";
import { Driver } from "../models/postgres/driver.model";
import { DriverRouteAssignment } from "../models/postgres/driverRouteAssignment.model";
import { Picklist } from "../models/postgres/picklist.model";
import { FuturePricing } from "../models/postgres/futurePricing.model";
import { RetailerDocuments } from "../models/postgres/retailerDocuments.model";

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
    let orderClause: Order = [['Date_Created', 'DESC'] as const];

   
 

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
        if (/^\d{8,}$/.test(search)) {
          searchInUPC = true;
        } 
        else {
        
          const term = search.toLowerCase();
          const anywhere = `%${term}%`;
          const starts = `${term}%`

          
  whereClause[Op.or] = [
    Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("Item_Number")),
      { [Op.like]: anywhere }
    ),
    Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("Description")),
      { [Op.like]: anywhere }
    ),
    Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("ALT_Description2")),
      { [Op.like]: anywhere }
    )
  ];

  // ORDER RULE:
  // 1. Items starting with search term first
  // 2. Then items containing it anywhere
  // 3. Finally alphabetical
  orderClause = [
    [
      Sequelize.literal(`
        CASE 
          WHEN LOWER("Description") LIKE '${starts}' THEN 0
          WHEN LOWER("Description") LIKE '${anywhere}' THEN 1
          ELSE 2
        END
      `),
      'ASC'
    ],
    ['Description', 'ASC']
  ];
}


        
      }

    

    // === UPC JOIN logic ===
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


    // let orderClause: Order = [['Date_Created', 'DESC'] as const];

    

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
        'OTP_Number', 'Price_Subclass', 'UnitOunces','EBT'
      ],
      where: whereClause,
      include: [
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Category_Desc','Sales_Category'],
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
      order: orderClause,
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

    // === Final mapping ===
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
        markAsBundle: getProductList?.markAsBundle || false,
        Price1: e.Price1,
        Price2: e.Price2,
        EBT: e.EBT,
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
    // Don't allow creating epick users through this endpoint
    if (body.role === 'epick') {
      throw new AppError('Use createEpickUser endpoint to create epick users', 400);
    }

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

  /**
   * Get all assigned categories from all epick users
   * Returns a map: categoryNumber -> array of user IDs who have it
   */
  private async getAssignedCategories(excludeUserId?: number): Promise<{ [key: number]: number[] }> {
    const allUsers = await EpickUser.findAll({
      where: excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {},
      attributes: ['id', 'category']
    });

    const assignedMap: { [key: number]: number[] } = {};
    
    allUsers.forEach((user: any) => {
      const categories = user.category || [];
      categories.forEach((cat: number) => {
        if (!assignedMap[cat]) {
          assignedMap[cat] = [];
        }
        assignedMap[cat].push(user.id);
      });
    });

    return assignedMap;
  }

  /**
   * Get the lowest unassigned category number
   */
  private getLowestUnassignedCategory(assignedCategories: { [key: number]: number[] }, maxCategory: number = 12): number {
    for (let i = 1; i <= maxCategory; i++) {
      if (!assignedCategories[i] || assignedCategories[i].length === 0) {
        return i;
      }
    }
    return maxCategory + 1; // All categories assigned
  }

  /**
   * Validate category assignment based on rules
   * Rules:
   * 1. Single category (already assigned) → NOT allowed (cannot share single categories)
   * 2. Multiple categories → allowed (can share multiple categories)
   * 3. Multiple categories must be consecutive
   */
  private async validateCategoryAssignment(categories: number[], excludeUserId?: number): Promise<void> {
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new AppError('Categories must be a non-empty array', 400);
    }

    // Validate all categories are numbers
    if (!categories.every((cat: any) => typeof cat === 'number' && Number.isInteger(cat) && cat > 0)) {
      throw new AppError('All categories must be positive integers', 400);
    }

    // Get assigned categories (excluding current user if updating)
    const assignedCategories = await this.getAssignedCategories(excludeUserId);

    // If single category
    if (categories.length === 1) {
      const cat = categories[0];
      // Check if this single category is already assigned to another user
      if (assignedCategories[cat] && assignedCategories[cat].length > 0) {
        throw new AppError(
          `Category ${cat} is already assigned to another user. Single categories cannot be shared. You can select multiple categories to share them.`,
          400
        );
      }
      // Single category is allowed only if it's not assigned
      return;
    }

    // If multiple categories - allow sharing (no restriction on already assigned)
    const sortedCategories = [...categories].sort((a, b) => a - b);

    // Check if categories are consecutive
    for (let i = 0; i < sortedCategories.length - 1; i++) {
      if (sortedCategories[i + 1] !== sortedCategories[i] + 1) {
        throw new AppError(
          'Multiple categories must be consecutive. You cannot skip categories.',
          400
        );
      }
    }
  }

  async createEpickUser(body: any) {
    body.firstName = body.firstName.trim();
    body.lastName = body.lastName.trim();

    // Check if email already exists in epick_user or users table
    const checkEmailEpick = await EpickUser.findOne({
      where: { email: body.email }
    });
    const checkEmailUsers = await WebUsers.findOne({
      where: { email: body.email }
    });
    if (checkEmailEpick || checkEmailUsers) {
      throw new AppError(Manager.EMAIL_ALREADY_EXISTS, 400);
    }

    // Validate password is provided
    if (!body.password) {
      throw new AppError('Password is required', 400);
    }

    // Validate category is provided and is an array
    if (!body.category || !Array.isArray(body.category) || body.category.length === 0) {
      throw new AppError('Category is required and must be a non-empty array', 400);
    }

    // Validate category assignment rules
    await this.validateCategoryAssignment(body.category);

    // Validate userNumber is provided (required like normal createUser)
    // Allow 0 as valid userNumber, only reject undefined/null
    if (body.userNumber === undefined || body.userNumber === null) {
      throw new AppError('userNumber is required', 400);
    }

    // Hash the password (user chosen password)
    const hashedPassword = await hashPassword(body.password);

    // Create epick user
    const epickUser = await EpickUser.create({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: hashedPassword,
      userNumber: String(body.userNumber), // Convert to string to match table type
      category: body.category,
      order_type: body.order_type || 'order_number',
      shortby: body.shortby || 'Des',
      item_sort_by: body.item_sort_by || 'line_number',
      status: body.status !== undefined ? body.status : true,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = epickUser.toJSON();
    return userWithoutPassword;
  }

  async updateUser(id: number, body: any) {
    const updateUser = await WebUsers.update(body, {
      where: { id: id }
    });
    return updateUser;
  }

  async updateEpickUser(id: number, body: any) {
    // Check if epick user exists
    const epickUser = await EpickUser.findByPk(id);
    if (!epickUser) {
      throw new AppError('Epick user not found', 404);
    }

    // Prepare update data (only allow specific fields)
    const updateData: any = {};
    
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName.trim();
    }
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName.trim();
    }
    if (body.email !== undefined) {
      // Check if email already exists (excluding current user)
      const checkEmail = await EpickUser.findOne({
        where: {
          email: body.email,
          id: { [Op.ne]: id }
        }
      });
      if (checkEmail) {
        throw new AppError(Manager.EMAIL_ALREADY_EXISTS, 400);
      }
      updateData.email = body.email;
    }
    if (body.userNumber !== undefined) {
      updateData.userNumber = body.userNumber;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }
    
    // Handle password update
    if (body.password !== undefined) {
      if (!body.password || body.password.trim().length < 3) {
        throw new AppError('Password must be at least 3 characters long', 400);
      }
      // Hash the new password
      const hashedPassword = await hashPassword(body.password);
      updateData.password = hashedPassword;
    }
    
    // Handle category update
    if (body.category !== undefined) {
      // Validate category assignment rules (exclude current user)
      await this.validateCategoryAssignment(body.category, id);
      
      // Check if user has any active orders (in_progress)
      const activeConfirmations = await EpickConfirmation.findAll({
        where: {
          pickerUserId: id,
          status: 'in_progress'
        }
      });
      
      if (activeConfirmations.length > 0) {
        throw new AppError(
          'Cannot update categories while user has active orders. Please complete all active orders first.',
          400
        );
      }
      
      updateData.category = body.category;
    }
    
    // Handle order_type update
    if (body.order_type !== undefined) {
      const validOrderTypes = ['order_number', 'qty_number'];
      if (!validOrderTypes.includes(body.order_type)) {
        throw new AppError(`Invalid order_type. Must be one of: ${validOrderTypes.join(', ')}`, 400);
      }
      updateData.order_type = body.order_type;
    }
    
    // Handle shortby update
    if (body.shortby !== undefined) {
      const normalizedShortby = body.shortby.toLowerCase();
      if (normalizedShortby !== 'asc' && normalizedShortby !== 'des') {
        throw new AppError("Invalid shortby. Must be 'asc' or 'des' (case insensitive)", 400);
      }
      // Normalize to 'Asc' or 'Des' for consistency
      updateData.shortby = normalizedShortby === 'asc' ? 'Asc' : 'Des';
    }
    
    // Handle item_sort_by update
    if (body.item_sort_by !== undefined) {
      const validSortOptions = ['section_location', 'alphabetically', 'item_number', 'short_number', 'line_number'];
      if (!validSortOptions.includes(body.item_sort_by)) {
        throw new AppError(`Invalid item_sort_by. Must be one of: ${validSortOptions.join(', ')}`, 400);
      }
      updateData.item_sort_by = body.item_sort_by;
    }

    await EpickUser.update(updateData, {
      where: { id: id }
    });

    const updatedUser = await EpickUser.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    return updatedUser;
  }

  async updateEpickUserPreferences(userId: number, preferences: { order_type?: string; shortby?: string; item_sort_by?: string }) {
    // Validate user exists
    const user = await EpickUser.findByPk(userId);
    if (!user) {
      throw new AppError('Epick user not found', 404);
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

    // Validate item_sort_by if provided
    if (preferences.item_sort_by !== undefined) {
      const validSortOptions = ['section_location', 'alphabetically', 'item_number', 'short_number', 'line_number'];
      if (!validSortOptions.includes(preferences.item_sort_by)) {
        throw new AppError(`Invalid item_sort_by. Must be one of: ${validSortOptions.join(', ')}`, 400);
      }
    }

    // Update user preferences
    const updateData: any = {};
    if (preferences.order_type !== undefined) {
      updateData.order_type = preferences.order_type;
    }
    if (preferences.shortby !== undefined) {
      updateData.shortby = preferences.shortby;
    }
    if (preferences.item_sort_by !== undefined) {
      updateData.item_sort_by = preferences.item_sort_by;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No preferences provided to update', 400);
    }

    await EpickUser.update(updateData, {
      where: { id: userId }
    });

    // Return updated user
    const updatedUser = await EpickUser.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'order_type', 'shortby', 'item_sort_by'],
    });

    return {
      message: 'Epick user order preferences updated successfully',
      user: updatedUser,
    };
  }

  async updateEpickUserItemSort(userId: number, itemSortBy: string) {
    // Validate user exists
    const user = await EpickUser.findByPk(userId);
    if (!user) {
      throw new AppError('Epick user not found', 404);
    }

    // Validate item_sort_by
    const validSortOptions = ['section_location', 'alphabetically', 'item_number', 'short_number', 'line_number'];
    if (!validSortOptions.includes(itemSortBy)) {
      throw new AppError(`Invalid item_sort_by. Must be one of: ${validSortOptions.join(', ')}`, 400);
    }

    // Update item_sort_by
    await EpickUser.update(
      { item_sort_by: itemSortBy },
      { where: { id: userId } }
    );

    const updatedUser = await EpickUser.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    return {
      message: 'Epick user item sort preference updated successfully',
      user: updatedUser,
    };
  }

  async updateEpickUserCategories(userId: number, categories: number[]) {
    // Validate user exists
    const user = await EpickUser.findByPk(userId);
    if (!user) {
      throw new AppError('Epick user not found', 404);
    }

    // Validate category assignment rules (exclude current user)
    await this.validateCategoryAssignment(categories, userId);

    // Check if user has any active orders (in_progress)
    const activeConfirmations = await EpickConfirmation.findAll({
      where: {
        pickerUserId: userId,
        status: 'in_progress'
      }
    });

    if (activeConfirmations.length > 0) {
      throw new AppError(
        'Cannot update categories while user has active orders. Please complete all active orders first.',
        400
      );
    }

    // Update categories
    await EpickUser.update(
      { category: categories },
      {
        where: { id: userId }
      }
    );

    // Return updated user
    const updatedUser = await EpickUser.findByPk(userId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'category'],
    });

    return {
      message: 'Epick user categories updated successfully',
      user: updatedUser,
    };
  }

  async deleteUser(id: number) {
    const deleteUser = await WebUsers.destroy({
      where: { id }
    });
    return deleteUser;
  }


  /**
   * Get all epick users with order preferences
   * Returns list of all epick users including order_type and shortby
   */
  async getEpickUserDetails() {
    const users = await EpickUser.findAll({
      where: {
        isActive: true, // Only return active users
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'category', 'order_type', 'shortby', 'item_sort_by', 'userNumber', 'isActive', 'status'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    return {
      users: users,
    };
  }

  /**
   * Get epick reports for manager
   * - If userId is provided, returns reports for that specific user
   * - If userId is not provided, returns reports for all users
   */
  async getEpickReports(userId: number | null, query: PaginationOptions) {
    let { page, limit } = query;
    page = Number(query.page || (query as any)['page ']) || 1;
    limit = Number(query.limit || (query as any)['limit ']) || 10;
    const offset = (page - 1) * limit;

    // Build where condition
    const whereCondition: any = {
      status: 'completed'
    };

    // If userId is provided, filter by that user
    if (userId) {
      whereCondition.pickerUserNumber = userId;
    }

    const { rows: data, count: totalCount } = await OrderPick.findAndCountAll({
      where: whereCondition,
      attributes: ['orderNumber', 'customerNumber', 'pickerUserNumber', 'startedAt', 'completedAt'],
      limit,
      offset,
      order: [['completedAt', 'DESC']]
    });

    // Get unique picker user IDs and customer numbers
    const pickerUserIds = Array.from(new Set(data.map((e: any) => e.pickerUserNumber).filter((id: any) => id !== null && id !== undefined)));
    const customerNumbers = Array.from(new Set(data.map((e: any) => e.customerNumber).filter((num: any) => num !== null && num !== undefined)));

    // Fetch picker user information
    const pickers = await WebUsers.findAll({
      where: {
        id: { [Op.in]: pickerUserIds }
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
      raw: true
    });

    const pickerMap: any = {};
    pickers.forEach((picker: any) => {
      pickerMap[picker.id] = picker;
    });

    // Fetch customer information
    const customers = await Customer.findAll({
      where: {
        C_Number: { [Op.in]: customerNumbers }
      },
      attributes: ['C_Number', 'C_Name'],
      include: [
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number'],
          required: false
        }
      ]
    });

    const customerMap: any = {};
    customers.forEach((customer: any) => {
      customerMap[customer.C_Number] = customer;
    });

    const finalData = data.map((e: any) => {
      const picker = pickerMap[e.pickerUserNumber] || null;
      const customer = customerMap[e.customerNumber] || null;

      return {
        orderNumber: e.orderNumber,
        customerNumber: e.customerNumber,
        pickerUserNumber: e.pickerUserNumber,
        picker: picker ? {
          id: picker.id,
          userNumber: picker.userNumber,
          name: `${picker.firstName} ${picker.lastName}`,
          email: picker.email
        } : null,
        customer: customer ? {
          customerNumber: customer.C_Number,
          customerName: customer.C_Name,
          route: customer.Routes?.[0]?.Route_Number || null,
          stop: customer.Routes?.[0]?.Stop_Number || null
        } : null,
        startedAt: e.startedAt,
        completedAt: e.completedAt
      };
    });

    return {
      data: finalData,
      totalCount: totalCount,
      page: page,
      limit: limit
    };
  }


  async deleteEpickUser(userId: number) {
    await EpickUser.update({
      isActive: false,
    }, {
      where: { id: userId }
    });
    return true;
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
    const { permissions,userId } = body;

    const updates = await Promise.all(
      permissions.map(async (perm: any) => {
        console.log(perm, "perm")
        if(!perm.id){
          const created = await RolePermission.create({...perm, userId});
          return created;
        }else {
          const updated = await RolePermission.update(perm, {
            where: {
              id: Number(perm.id),
            },
          });
          return updated;
        }
       
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
        'Order_Date',
        'Picklist_Printed'
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
        Picklist_Printed: order.Picklist_Printed,
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
        'Picklist_Printed'
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
        'Quantity_Shipped',
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
    if (orderDiscount) {
      totalDiscount = orderDiscount.discount;
    }

    for (const details of allOrderDetails) {
      const d = details.dataValues;
    
      const basePrice = toNum(d.Price);
      const otpState  = toNum(d.OTP_Amount_State);
      const prepaid   = toNum(d.PrepaidTax_Amount);
      const qty       = toNum(d.Quantity_Shipped); // or fallback below
    
      const quantity = qty > 0 ? qty : toNum(d.Quantity_Ordered);
    
      const unitPrice = basePrice + otpState + prepaid;
    
      totalPrice += unitPrice * quantity;
      totalPrepaidTax += prepaid * quantity;
    
      totalDiscount += toNum(d.OffInvoice_Amount);   // multiply by qty only if this is per-unit
      totalDeposit  += toNum(d.DepositAmount);       // multiply by qty only if this is per-unit
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
        Price: Number(detail.Price || 0) + Number(detail.OTP_Amount_State || 0) + Number(detail.PrepaidTax_Amount || 0),
        isDistributorImageShow: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${detail.inventory?.UPCList?.[0]?.UPC_Number}.jpg`,
      };
    }));

    // Get checker images from OrderPick
    const orderPick = await OrderPick.findOne({
      where: { orderNumber },
      attributes: ['images']
    });

    // Extract image URLs from OrderPick.images
    const checkerImages: string[] = [];
    if (orderPick && orderPick.images) {
      orderPick.images.forEach((img: any) => {
        if (typeof img === 'string') {
          checkerImages.push(img);
        } else if (img && img.url && typeof img.url === 'string') {
          checkerImages.push(img.url);
        }
      });
    }

    return {
      orderHeader: {
        ...orderHeader?.toJSON(),
        Total_Price: totalPrice,
        Total_Discount: totalDiscount,
        Total_Deposit: totalDeposit,
        Total_PrepaidTax: totalPrepaidTax
      },
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: orderDetailsWithImages,
      checkerImages: checkerImages
    };
  }

  async getOrderDetailByOrderNumberForInvoice(orderNumber: number) {


    const orderHeader = await OrderHeader.findByPk(orderNumber, {
      attributes: [
        'Order_Number',
        'Order_Date',
        'User_ID',
        'Order_Source',
        'Delivery_Charge',
        'C_Number'
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Name', 'C_CoName', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Country', 'C_Phone', 'C_Email'],
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
            },
            {
              model: SalesRep,
              as: 'salesRep',
              attributes: ['S_Number', 'S_Desc'],
            },
            {
              model: Terms,
              as: 'terms',
              attributes: ['TermsCode', 'Terms'],
            }

          ]
        }
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
            'UOM',
            'BaseCost',
            'NetCost',
            'Section',
            'Location',
            'Section2',
            'Location2',
            'Sequence',
            'Vendor_ItemNumberAlpha'
            
          ],
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
            },
            {
              model:InventoryUPC,
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
    });

    const allOrderDetails = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        'Price',
        'OTP_Amount_State',
        'Quantity_Shipped',
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
    if (orderDiscount) {
      totalDiscount = orderDiscount.discount;
    }
    for (const detail of allOrderDetails) {

      let price = Number(detail.Price || 0) + Number(detail.OTP_Amount_State || 0);
      price += Number(detail.PrepaidTax_Amount || 0);
      const otpAmount = Number(detail.OTP_Amount_State || 0);
      const quantity = Number(detail.Quantity_Shipped || 0);

      totalPrice += (price + otpAmount) * quantity;
      totalPrice += Number(detail.PrepaidTax_Amount || 0);
      totalDiscount += Number(detail.OffInvoice_Amount || 0);
      totalDeposit += Number(detail.DepositAmount || 0);
    }
    let distributor = await Distributor.findOne({
      attributes: ['D_Name', 'D_Addr1', 'D_Addr2', 'D_City', 'D_State', 'D_Zip', 'D_Phone', 'D_Email'],
    });

    const getProfileImage: any = await Setting.findOne({})

    return {
      orderHeader: {
        ...orderHeader?.toJSON(),
        orderDetails,
        distributor,
        logo: getProfileImage?.dataValues ? getProfileImage.dataValues.warehouseImage : null,
        Total_Price: totalPrice,
        Total_Discount: totalDiscount,
        Total_Deposit: totalDeposit
      },

    }
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
    let status: any = await OrderHeader.findOne({
      where: {
        Order_Number: orderNumber
      },
      attributes: ['Picklist_Printed', 'Order_Date', 'Picklist_Time', 'Confirmed', 'POS_Cash', 'POS_Check', 'POS_Credit', 'POS_Debit', 'POS_Other', 'POS_House', 'POS_Time', 'Invoice_Total', 'Invoice_Number']
    });

    status = status.dataValues;
    console.log(status, 'status');
    status.PrintInvoice = status.Confirmed === true && Number(status.Invoice_Number) > 0;

    if (!status) {
      return {
        status: 'Order Not Found',
        time: null
      };
    }

    // Check if any POS field has a value (Order Packed)
    const posFields = ['POS_Cash', 'POS_Check', 'POS_Credit', 'POS_Debit', 'POS_Other', 'POS_House'];
    const hasPosValue = posFields.some(field => status[field] && status[field] > 0);

    const allowPrepaidTax = await Setting.findOne({
      attributes: ['showWithPerpaidTax']
    });

    if (hasPosValue) {
      return [
        {
          status: 'Order Packed',
          no: 2,
          time: status.POS_Time,
          active: true,
          PrintInvoice: status.PrintInvoice,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        },
        {
          status: 'Picklist Print',
          no: 1,
          time: status.Picklist_Time || null,
          active: false,
          PrintInvoice: status.PrintInvoice,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        },
        {
          status: 'Order Placed',
          no: 0,
          time: status.Order_Date || null,
          active: false,
          PrintInvoice: status.PrintInvoice,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
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
          active: false,
          PrintInvoice: status.PrintInvoice,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false

        },
        {
          status: 'Picklist Print',
          no: 1,
          time: status.Picklist_Time || null,
          active: true,
          PrintInvoice: status.PrintInvoice,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        },
        {
          status: 'Order Placed',
          no: 0,
          time: status.Order_Date || null,
          active: false,
          PrintInvoice: status.PrintInvoice,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        }
      ];
    }

    // Default case - Order Placed
    return [
      {
        status: 'Order Packed',
        no: 2,
        time: null,
        active: false,
        PrintInvoice: status.PrintInvoice,
        allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
      },
      {
        status: 'Picklist Print',
        no: 1,
        time: null,
        active: false,
        PrintInvoice: status.PrintInvoice,
        allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
      },
      {
        status: 'Order Placed',
        no: 0,
        time: status.Order_Date || null,
        active: true,
        PrintInvoice: status.PrintInvoice,
        allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
      }
    ];
  }

  // async updateEmailNotification( body: any){
  //   const updatedEmail = await settings.update(body);
  //   return updatedEmail;
  // }

  async updateEmailNotification(body: any) {
    const updatedEmail = await settings.update(body, {
      where: {}
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

  async updateRetailer(body: any, id: number) {
    const retailer = await Retailer.findOne({ where: { Customer_Number: id } });
    if (!retailer) {
      throw new AppError('Retailer not found', 404);
    }
    const updateRetailer = await Retailer.update(body, { where: { Customer_Number: id } });
    return updateRetailer;
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

  // PO Header
  async createPurchaseOrder(poData: any, req: any) {
      const { poHeaderPayload, poItems } = poData;

      const nextPONumber = await getNextPONumber();
      function formatDateForSQL(date: string | Date | null) {
        if (!date) return null;
        if (date instanceof Date) return date;
        return new Date(date); // converts 'YYYY-MM-DD' to Date object
      }

      const poHeaderObj = {
        PO_Number: nextPONumber,
        PO_Date: formatDateForSQL(poHeaderPayload.PO_Date) || new Date(),
        PO_Source: 1,
        PO_Posted: 0,
        PO_Type: poHeaderPayload.PO_Type || 0,
        Confirmed: 0,
        Date_Received: formatDateForSQL(poHeaderPayload.Date_Received) || new Date(),
        Receiving_Code: poHeaderPayload.Receiving_Code || 'P',
        Orig_PO_Number: 0,
        Primary_Vendor: poHeaderPayload.Primary_Vendor,
        Invoice_Number: poHeaderPayload.Invoice_Number || '',
        Invoice_Date: formatDateForSQL(poHeaderPayload.Invoice_Date) || new Date(),
        PO_Message: poHeaderPayload.PO_Message || '',
        PO_Status: 0,
        Ship_Date: formatDateForSQL(poHeaderPayload.Ship_Date) || new Date(),
        BillTo_Vendor: poHeaderPayload.Primary_Vendor,
        Promo_Code: '',
        Terms: poHeaderPayload.Terms || 0,
        FTP_Sent: 0,
        FTP_Date: formatDateForSQL(poHeaderPayload.FTP_Date) || new Date(),
        FTP_REQ_Date: formatDateForSQL(poHeaderPayload.FTP_REQ_Date) || new Date(),
        ReceivingMode: 0,
        Delivery_ID: 0,
        Tracking_Number: '',
        PO_DeliveryCharge: Number(poHeaderPayload.PO_DeliveryCharge || 0),
        PO_MiscCharge: Number(poHeaderPayload.PO_MiscCharge || 0),
        PO_MiscCharge2: 0,
        PO_Discounts: 0,
        PO_Total: 0,
        Jurisdiction_State: '',
        Jurisdiction_County: '',
        Jurisdiction_City: '',
        Inventory_CIG: 0,
        Inventory_OTP: 0,
        PrepaidTax_Calculation_Select: 0,
        epoCreated: poHeaderPayload.epoCreated || 0,
        epoApplied: 0,
        epoUser: '',
        Control_Date: new Date(),
        // Control_Time: new Date(),
        Date_Received_Control: null,
        Invoice_Deposit: 0,
        Total_Weight: 0,
        Requested_Delivery_Date: poHeaderPayload.Requested_Delivery_Date || new Date(),
        Delete_Date: formatDateForSQL(poHeaderPayload.Delete_Date) || new Date(),
        Delete_User_Number: 0
      };

      const { ...defaultValues } = getDefaultPOHeaderValues();
      const finalPoHeaderObj: any = {
      ...defaultValues,
      ...poHeaderObj,
    };


     Object.keys(finalPoHeaderObj).forEach(key => {
      if (finalPoHeaderObj[key] === null || finalPoHeaderObj[key] === undefined) {
        if (typeof finalPoHeaderObj[key] === 'number') {
          finalPoHeaderObj[key] = 0;
        } else if (typeof finalPoHeaderObj[key] === 'boolean') {
          finalPoHeaderObj[key] = false;
        } else if (typeof finalPoHeaderObj[key] === 'string') {
          finalPoHeaderObj[key] = '';
        }
      }
    });

      let createdHeader;
      try {
        createdHeader = await POHeader.create(poHeaderObj);
      } catch (error) {
        console.log(error);
        throw new AppError("Failed to create PO Header", 500);
      }

      const itemNumbers = poItems.map((i: { Item_Number: number }) => i.Item_Number);

      const inventoryItems = await Inventory.findAll({
        where: { Item_Number: itemNumbers },
        raw: true
      });

      const invMap = new Map<number, Inventory>(
        inventoryItems.map((p: Inventory) => [p.Item_Number, p])
      );

      const poDetailRows = poItems.map((item: any, index: number) => {
  const product = invMap.get(item.Item_Number);

  if (!product) throw new AppError(`Item ${item.Item_Number} not found`, 404);

  return {
        PO_Number: createdHeader.PO_Number,
        Line_Number: index + 1,
        Item_Number: item.Item_Number,
        Sales_Category: product.Sales_Category,
        OTP_Number: product.OTP_Number,
        Quantity_Ordered: Number(item.Qty),
        Quantity_Recd: 0,
        Quantity_RecdDamaged: 0,
        Unit_Code: 0,
        Pack: Number(product.Pack || product.Pack), 
        Cost: Number(product.AvgCost) || 0, 
        BaseCost: Number(product.BaseCost) || 0,
        NetCost: Number(product.NetCost) || 0,
        Invoice_Cost: Number(product.Invoice_Cost) || 0,
        AvgCost: Number(product.AvgCost) || 0,

        PrepaidTax_State: 0,
        PrepaidTax_County: 0,
        PrepaidTax_City: 0,
        PendingTax_State: 0,
        PendingTax_County: 0,
        PendingTax_City: 0,

        GL_Special: 0,
        Unit_Allowance: 0,
        Credit_ReturnType: 0,
        Confirmed: 1,
        DetailPosted: 0,

        AdjFromInventoryID: 0,
        PO_Number_Legacy: 0,
        PO_LocationID: 0,

        InventoryGroupID: 0,
        Inventory_ExpDate: null,       // DATE or NULL
        Inventory_LotRef: "",

        Unit_Allowance2: 0,
        CaseCount: Number(product.CaseCount) || 0,

        Unit_Allowance_ID: 0,
        Unit_Allowance2_ID: 0,

        STAMP_Requied: 0,              // spelling EXACT match
        STAMP_Qty: 0,

        AddOnDeposit_Item_Number: 0,
        DepositAmount: Number(product.DepositAmount) || 0,
        IsIncludeDeposit_QB: 0,

        CaseWeight: Number(product.CaseWeight) || 0,
        CaseOrd: 0,
        CaseRecd: 0,
        CasesPerPallet: Number(product.CasesPerPallet) || 0,

        PO_Detail_Code: ""
      };
    });


      // ===============================
      // INSERT INTO PO_DETAIL
      // ===============================
      try {
        await PODetail.bulkCreate(poDetailRows);
      } catch (error) {
        console.log(error);
        throw new AppError("Failed to insert PO Details", 500);
      }

      return {
        success: true,
        message: "Purchase Order Created Successfully",
        header: createdHeader,
        items: poDetailRows
      };
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
        html: body,
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

    if (body.hasAddUpc) {
      console.log(body.upcData, 'this is upcData');
      const upcData = body.upcData.map((item: any) => ({
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



  async createVendor(body: any) {
    const nextVendorNumber = await getNextVendorNumber();
    const defaultValues = getDefaultVendorValues(0);

    body.Primary_Vendor = nextVendorNumber;
    body.Date_Created = new Date();
    body.Last_Modified = new Date();

    const finalBody = { ...defaultValues, ...body };
    const vendor = await Vendor.create(finalBody);

    return vendor;
  }

  async createErpUser(body: any) {
    const defaultErpUserValues = getDefaultErpUserValues();
    const nextUserNumber = await getNextUserNumber();
    if (body.UserIsActive !== undefined) {
      body.UserIsActive = body.UserIsActive == 1 ? true : false;
    }
    body.UserNumber = nextUserNumber;
    const finalBody = { ...defaultErpUserValues, ...body, UserNumber: nextUserNumber };
    const erpUser = await Users.create(finalBody);

    return erpUser;
  }

  async updateErpUser(id: number, body: any) {
    const userNumber = await Users.findByPk(id);
    if (body.UserIsActive !== undefined) {
      body.UserIsActive = body.UserIsActive == 1 ? true : false;
    }
    if (!userNumber) {
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

  async getErpUserById(id: number) {
    const erpUser = await Users.findByPk(id)
    if (!erpUser) {
      throw new AppError('ERP User not found', 404);
    }
    return erpUser;
  }

  async editInventory(id: number, body: any) {
    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      throw new AppError('Inventory not found', 404);
    }
    if (body.I_Inactive) {
      body.Inactive_Date = new Date();
    }
    body.PriceCostModifiedDate = new Date();

    await inventory.update(body);
    return inventory;
  }

  async editUpcNumber(key: number, upcNumber: string) {
    const inventoryUPC = await InventoryUPC.findOne({
      where: { myKey: key }
    });
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

  async getInventoryForReport() {
    const inventoryList = await Inventory.findAll({
      order: [['Item_Number', 'ASC']],
      attributes: ['Item_Number', 'Description', 'I_Inactive', 'MinimumStockAvailability', 'Vendor_ItemNumberAlpha', 'Sequence',
        'Pack', 'CaseCount', 'UOM', 'Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6', 'Retail1', 'Retail2', 'Retail3', 'UnitOunces', 'OTP_Number', 'AvgCost', 'BaseCost', 'Invoice_Cost',
        'NetCost', 'MSA_Category_Code', 'Section', 'Location', 'I_Discontinued'
      ],
      include: [
        {
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['myKey', 'UPC_Number', 'Status', 'Priority'],
        },
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Sales_Category', 'Category_Desc'],
        },
        {
          model: Vendor,
          as: 'primaryVendor',
          attributes: ['Primary_Vendor', 'V_Description'],
        },
        {
          model: Vendor,
          as: 'manufacturerVendor',
          attributes: ['Primary_Vendor', 'V_Description'],
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Price_Class', 'Class_Desc'],
        },
        {
          model: PriceSubclass_Defs,
          as: 'PriceSubclass',
          attributes: ['Price_Subclass', 'Subclass_Def'],

        },
        {
          model: InventoryHistory,
          as: 'InventoryHistory',
          attributes: ['Item_Number', 'Week01', 'Week02', 'Week03', 'Week04', 'Week05', 'Week06', 'Week07', 'Week08', 'Week09', 'Week10', 'Week11', 'Week12',
            'Units_Week01', 'Units_Week02', 'Units_Week03', 'Units_Week04', 'Units_Week05', 'Units_Week06', 'Units_Week07', 'Units_Week08', 'Units_Week09', 'Units_Week10', 'Units_Week11', 'Units_Week12',
            'Lost01', 'Lost02', 'Lost03', 'Lost04', 'Lost05', 'Lost06', 'Lost07', 'Lost08', 'Lost09', 'Lost10', 'Lost11', 'Lost12',
            'Units_Lost01', 'Units_Lost02', 'Units_Lost03', 'Units_Lost04', 'Units_Lost05', 'Units_Lost06', 'Units_Lost07', 'Units_Lost08', 'Units_Lost09', 'Units_Lost10', 'Units_Lost11', 'Units_Lost12',
            'Date_LastRecd', 'Date_LastSold', 'LastPurchaseVendor', 'LastPurchaseCost'],
        }
      ],
    });
    return inventoryList;
  }

  async getCustomerForReport() {
    const customerList = await Customer.findAll({
      order: [['C_Number', 'ASC']],
      attributes: [
        'C_Number', 'C_Name', 'C_CoName', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Country',
        // 'Jurisdiction_State','Jurisdiction_City','Jurisdiction_County',
        'C_Phone', 'C_Email', 'C_Fax',
        'C_SalesTaxNumber', 'C_CigtLicenseNumber', 'C_Memo', 'C_PricingAccount', 'Credit_Limit',
        'ExpDate_SalesTax', 'ExpDate_CigtTax', 'C_Inactive', 'Delivery_Amount', 'C_OtherLicenseNumber',
        'ExpDate_OtherTax', 'C_OrderDay', 'C_RetailRounding', 'C_FEIN',
        'C_OperationHours1', 'C_OperationHours2', 'C_PhoneMobile', 'Delivery_ID',
        'C_OrderDaySequence', 'LastBalance', 'LastInvoiceNumber', 'LastInvoiceAmount', 'LastInvoiceDate',
        'LastPaymentDate', 'LastPaymentAmount', 'C_OtherLicenseNumber2', 'ExpDate_OtherTax2',
        'C_OtherLicenseNumber3', 'ExpDate_OtherTax3'
      ],
      include: [
        {
          model: SalesRep,
          as: 'salesRep',
          attributes: ['S_Number', 'S_Desc'],
        },
        {
          model: Terms,
          as: 'terms',
          attributes: ['TermsCode', 'Terms'],
        },
        {
          model: ClassOfTrade,
          as: 'classOfTrade',
          attributes: ['Trade_Code', 'Trade_Desc'],
        },
        {
          model: TaxRates,
          as: 'taxRate',
          attributes: ['Jurisdiction_State', 'TaxDescription'],
          required: false,
        },
        {
          model: TaxRates_City,
          as: 'taxRateCity',
          attributes: ['Jurisdiction_City', 'TaxDescription'],
          required: false,
        },
        {
          model: TaxRates_County,
          as: 'taxRateCounty',
          attributes: ['Jurisdiction_County', 'TaxDescription'],
          required: false,
        },
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number'],
        }
      ],
    });
    return customerList;
  }

  // EpickSetting CRUD methods
  async createEpickSetting(body: { pin: string; allowSingleScan: boolean }) {
    const epickSetting = await EpickSetting.create(body);
    return epickSetting;
  }

  // InvoiceSetting CRUD methods
  async createInvoiceSetting(body: any) {
    const invoiceSetting = await InvoiceSetting.create(body);
    return invoiceSetting;
  }

  async updateInvoiceSetting(id: number, body: any) {
    const invoiceSetting = await InvoiceSetting.findByPk(id);
    if (!invoiceSetting) {
      throw new AppError('Invoice setting not found', 404);
    }
    await invoiceSetting.update(body);
    return invoiceSetting;
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

  async putPassScanItem(body: any) {
    const passScanItem = await PassScanItem.create(body);
    return passScanItem;

  }

  async createCustomer(data: any) {
    const nextCustomerNumber = await getNextCustomerNumber();

    const finalData = {
      ...getDefaultCustomerValues(0),
      C_Number: nextCustomerNumber,
      ...data
    }
    const customer = await Customer.create(finalData);
    return customer;
  }

  async updateUserAllowDiscount(data: any, id: number) {
    const user = await WebUsers.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    await user.update({ allowDiscount: data.allowDiscount });
    return user;
  }


  async updateCustomer(data: any, id: number) {

    const finalData = {
      ...data
    }
    const customer = await Customer.update(finalData, { where: { C_Number: id } });
    return customer;
  }



  async updateVendor(body: any, id: number) {
    body.Last_Modified = new Date();
    const finalBody = { ...body };
    const vendor = await Vendor.update(finalBody, { where: { Primary_Vendor: id } });
    return vendor;
  }


  async getVendorById(id: number) {
    const vendor = await Vendor.findOne({ where: { Primary_Vendor: id } });
    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }
    return vendor;
  }

  async getCustomerDetailsById(id: number) {
    const customer = await Customer.findOne({ where: { C_Number: id } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    return customer;
  }

  async bulkUpdateInventory(updateData: any, userId: number) {



    console.log(userId, 'userId');

    let userIdValue = 0;
    if(userId){

      const user = await WebUsers.findOne({where: {id: userId},attributes: ['userNumber']});
      if(user){
        userIdValue = user.userNumber ? parseInt(user.userNumber) : 0;
      }
    }

    const { field, data, excludeItem, hasBulkUpdate, singleUpdateData } = updateData;
    console.log(hasBulkUpdate, 'hasBulkUpdate');
  
    if (hasBulkUpdate ) {
      // -------- BULK UPDATE BRANCH (one big UPDATE with common where) ---------
      
      console.log(field, data, 'field and data bulk update');
      if (!field || !data) {
        throw new AppError("field (conditions) and data are required", 400);
      }
  
      if (Object.keys(field).length === 0) {
        throw new AppError("field object cannot be empty", 400);
      }
  
      if (Object.keys(data).length === 0) {
        throw new AppError("data object cannot be empty", 400);
      }
  
      const whereClause: any = { ...field };

      whereClause.Date_LastChangeUser = userIdValue;
      whereClause.Date_LastChange = new Date();

      if(hasPriceChange(data)){
        whereClause.PriceCostModifiedUser = userIdValue;
        whereClause.PriceCostModifiedDate = new Date();
      }

      if (Array.isArray(excludeItem) && excludeItem.length > 0) {
        whereClause.Item_Number = { [Op.notIn]: excludeItem };
      }
  
      const [affectedRows] = await Inventory.update(data, { where: whereClause });
  
      return {
        updatedCount: affectedRows,
      };
    }
     else {
      // -------- PER-ITEM UPDATE BRANCH (loop over singleUpdateData) ---------
  
      console.log(singleUpdateData, 'singleUpdateData');
      if (!Array.isArray(singleUpdateData) || singleUpdateData.length === 0) {
        throw new AppError("singleUpdateData must be a non-empty array when hasBulkUpdate is false", 400);
      }
  
      let updatedCount = 0;
  
      for (const item of singleUpdateData) {
        if (!item || typeof item !== "object") {
          throw new AppError("Each entry in singleUpdateData must be an object", 400);
        }
  
        const { Item_Number, ...updateFields } = item;
  
        if (!Item_Number) {
          throw new AppError("Item_Number is required for individual update", 400);
        }
  
        if (Object.keys(updateFields).length === 0) {
          throw new AppError(`No fields to update for Item_Number ${Item_Number}`, 400);
        }
  
        const [count] = await Inventory.update(
          updateFields,                // data to set
          { where: { Item_Number } }   // condition
        );
  
        // Count each item as 1 if it was successfully updated (count > 0)
        // This ensures we return the number of unique items updated, not total rows affected
        if (count > 0) {
          updatedCount += 1;
        }
      }
  
      return {
        updatedCount,
      };
    }
  }

  async getInventoryItemsForUpdate(query: any) {
    let { salesCategoryId, priceClassId, filter,search } = query;

    let whereClause: any = {
    };
    if (search) {
      const term = search.toLowerCase();
      const startsWith = `${term}%`;
      
      whereClause[Op.or] = [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Description")),
          { [Op.like]: startsWith }
        ),
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("AltDesc")),
          { [Op.like]: startsWith }
        ),
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("ALT_Description2")),
          { [Op.like]: startsWith }
        )
      ];
   
   

}

    if (filter == 'ShortOrderForm') {
      whereClause.ShortOrderForm = true;
    }
    if (filter == 'I_Inactive') {
      whereClause.I_Inactive = true;
    }


    if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0 && Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Both filters exist → use OR condition
      whereClause[Op.and] = [
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


    let totalCount = 0;

    totalCount = await Inventory.count({
      where: whereClause,
      logging: false
    });


    const productList = await Inventory.findAll({
      
      where: whereClause,
      include: [
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Category_Desc', 'Sales_Category'],
          required: false
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Class_Desc'],
          required: false
        },

      ],

      logging: false
    });

    // const finalProductList = await Promise.all(productList.map(async (e: any) => {

    //   return {
    //    e
    //   };
    // }));

    return {
      totalCount,
      productList
    };
  }

  // Driver CRUD methods
  async createDriver(body: any) {
    // Check if email already exists
    const existingDriver = await Driver.findOne({
      where: { email: body.email }
    });

    if (existingDriver) {
      throw new AppError('Driver with this email already exists', 400);
    }
    const password = generateRandomString(9);
    const hashedPassword = await hashPassword(password);

    body.password = hashedPassword;

 const htmlContent = generateNewCredentialsEmail(body.firstName + " " + body.lastName, body.email, password);
    await sendEmail({
      to: body.email,
      subject: `Welcome to Driver Portal – Your Account is Ready!`,
      html: htmlContent,
    });






    const driver = await Driver.create(body);
    return driver;
  }

  async getDriverById(id: number) {
    const driver = await Driver.findByPk(id);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    return driver;
  }

  async getAllDrivers(query: PaginationOptions & { search?: string }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition: any = {};

    if (search) {
      whereCondition[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count: totalCount, rows: drivers } = await Driver.findAndCountAll({
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
      drivers,
    };
  }

  async updateDriver(id: number, body: any) {
    const driver = await Driver.findByPk(id);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    // Check if email is being updated and if it already exists
    if (body.email && body.email !== driver.email) {
      const existingDriver = await Driver.findOne({
        where: { email: body.email }
      });

      if (existingDriver) {
        throw new AppError('Driver with this email already exists', 400);
      }
    }

    await driver.update(body);
    return driver;
  }

  async deleteDriver(id: number) {
    const driver = await Driver.findByPk(id);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    await driver.destroy();
    return { message: 'Driver deleted successfully' };
  }

  async updateDriverLocation(id: number, body: { currentLatitude: number; currentLongitude: number }) {
    const driver = await Driver.findByPk(id);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    await driver.update({
      currentLatitude: body.currentLatitude,
      currentLongitude: body.currentLongitude
    });

    return driver;
  }

  // DriverRouteAssignment CRUD methods
  async createDriverRouteAssignment(body: any) {
    // Verify driver (user) exists
    const driver = await Driver.findByPk(body.driverId);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    const routeAssignment = await DriverRouteAssignment.create(body);
    return routeAssignment;
  }

  async getDriverRouteAssignmentById(id: number) {
    const routeAssignment = await DriverRouteAssignment.findByPk(id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    if (!routeAssignment) {
      throw new AppError('Driver route assignment not found', 404);
    }
    return routeAssignment;
  }

  async getAllDriverRouteAssignments(query: PaginationOptions & { search?: string; driverId?: number; deliveryDay?: string }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';
    const driverId = query.driverId ? Number(query.driverId) : undefined;
    const deliveryDay = query.deliveryDay || '';

    const whereCondition: any = {};

    if (driverId) {
      whereCondition.driverId = driverId;
    }

    if (deliveryDay) {
      whereCondition.deliveryDay = { [Op.iLike]: `%${deliveryDay}%` };
    }

    if (search) {
      whereCondition[Op.or] = [
        { deliveryDay: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col('routes'), 'TEXT'),
          { [Op.iLike]: `%${search}%` }
        )
      ];
    }

    const { count: totalCount, rows: routeAssignments } = await DriverRouteAssignment.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Driver,
          as: 'driver',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['deliveryDayNumber', 'ASC'], ['createdAt', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      routeAssignments,
    };
  }

  async updateDriverRouteAssignment(id: number, body: any) {
    const routeAssignment = await DriverRouteAssignment.findByPk(id);
    if (!routeAssignment) {
      throw new AppError('Driver route assignment not found', 404);
    }

    // If driverId is being updated, verify the driver exists
    if (body.driverId && body.driverId !== routeAssignment.driverId) {
      const driver = await WebUsers.findByPk(body.driverId);
      if (!driver) {
        throw new AppError('Driver not found', 404);
      }
    }

    await routeAssignment.update(body);
    return routeAssignment;
  }

  async deleteDriverRouteAssignment(id: number) {
    const routeAssignment = await DriverRouteAssignment.findByPk(id);
    if (!routeAssignment) {
      throw new AppError('Driver route assignment not found', 404);
    }

    await routeAssignment.destroy();
    return { message: 'Driver route assignment deleted successfully' };
  }

  async getDriverRouteAssignmentsByDriver(driverId: number, query: PaginationOptions) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;

    // Verify driver (user) exists
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    const { count: totalCount, rows: routeAssignments } = await DriverRouteAssignment.findAndCountAll({
      where: { driverId },
      limit,
      offset: (page - 1) * limit,
      order: [['deliveryDayNumber', 'ASC'], ['createdAt', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      routeAssignments,
    };
  }

  async getAllOrderNumbers (){
    const orderNumbers = await OrderHeader.findAll({
      attributes: ['Order_Number'],
      order: [['Order_Number', 'DESC']]
    });
    return orderNumbers;
  }

  async distributorUpdate(id: number, body: any) {
    const updateDistributor = await Distributor.update(body, {
      where: { PM_ID: id }
    });
    return updateDistributor;

  }
  // Picklist CRUD methods
  async createPicklist(data: any) {
    // Ensure boolean fields default to true if not provided
    const picklistData = {
      name: data.name,
      selectedFields: data.selectedFields,
      groupBy: data.groupBy,
      newCategoryOnNewPage: data.newCategoryOnNewPage ?? true,
      headerPosition: data.headerPosition ?? null,
      footerPosition: data.footerPosition ?? null,
      pickedByPosition: data.pickedByPosition ?? null,
      checkedByPosition: data.checkedByPosition ?? null,
      showTotalCartons: data.showTotalCartons ?? true,
      showTotalPieces: data.showTotalPieces ?? true,
      showTotalLines: data.showTotalLines ?? true,
      showPickedBy: data.showPickedBy ?? true,
      showCheckedBy: data.showCheckedBy ?? true,
      showBundles: data.showBundles ?? true,
    };

    return await Picklist.create(picklistData);
  }

  async getAllPicklists(query: PaginationOptions) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search as string;

    const where: any = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const { count: totalCount, rows: picklists } = await Picklist.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      picklists,
    };
  }

  async getPicklistById(id: number) {
    const picklist = await Operations.findById(Picklist, id);
    if (!picklist) {
      throw new AppError("Picklist not found", 404);
    }
    return picklist;
  }

  async updatePicklist(id: number, data: any) {
    // If selectedFields is being updated, ensure orderedQty and scannedQty are present
    if (data.selectedFields) {
      if (data.selectedFields.orderedQty === undefined || data.selectedFields.scannedQty === undefined) {
        // Get existing picklist to merge with existing selectedFields
        const existingPicklist = await Picklist.findByPk(id);
        if (existingPicklist) {
          data.selectedFields = {
            ...existingPicklist.selectedFields,
            ...data.selectedFields,
            orderedQty: data.selectedFields.orderedQty ?? existingPicklist.selectedFields.orderedQty,
            scannedQty: data.selectedFields.scannedQty ?? existingPicklist.selectedFields.scannedQty,
          };
        }
      }
    }

    // If groupBy is being updated and is empty string, throw error
    if (data.groupBy !== undefined && data.groupBy === '') {
      throw new AppError("groupBy cannot be an empty string", 400);
    }

    return await Picklist.update(data, { where: { id } });
  }

  async deletePicklist(id: number) {
    await Picklist.destroy({ where: { id } });
    return { message: "Picklist deleted successfully" };
  }

  async makePickListPrinted(orderNumber: number) {
    const now = new Date();

    const formatted =
    now.toISOString().slice(0, 19).replace("T", " "); // 
    await OrderHeader.update({ Picklist_Printed: true, Picklist_Time: formatted}, { where: { Order_Number: orderNumber } });
    return { message: "Picklist printed successfully" };
  }

  // FuturePricing CRUD methods
  async createFuturePricing(body: {
    futurePricings: Array<{
      itemNumber: number;
      effectiveAt: Date;
      changedFields: Array<Record<string, any>>;
      isApplied?: boolean;
      changedBy: 'admin' | 'user';
      changedUserId?: number | null;
    }>;
  }) {
    const results = [];
    
    for (const futurePricingData of body.futurePricings) {
      // Check if a future pricing already exists for this itemNumber
      const existingFuturePricing = await FuturePricing.findOne({
        where: { itemNumber: futurePricingData.itemNumber,isApplied:false }
      });

      if (existingFuturePricing) {
        // Update the existing record
        await existingFuturePricing.update({
          effectiveAt: futurePricingData.effectiveAt,
          changedFields: futurePricingData.changedFields,
          isApplied: futurePricingData.isApplied ?? existingFuturePricing.isApplied,
          changedBy: futurePricingData.changedBy,
          changedUserId: futurePricingData.changedUserId ?? existingFuturePricing.changedUserId,
        });
        results.push(existingFuturePricing);
      } else {
        // Create a new record
        const newFuturePricing = await FuturePricing.create(futurePricingData);
        results.push(newFuturePricing);
      }
    }

    return {
      count: results.length,
      futurePricings: results,
    };
  }

  async getFuturePricingById(id: number) {
    const futurePricing = await FuturePricing.findByPk(id);

    if (!futurePricing) {
      throw new AppError(Manager.FUTURE_PRICING_NOT_FOUND, 404);
    }

    return futurePricing;
  }

  async getAllFuturePricings(query: PaginationOptions & {
    search?: string;
    itemNumber?: number;
    isApplied?: boolean;
    changedBy?: 'admin' | 'user';
  }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition: any = {};

    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        whereCondition.itemNumber = searchNum;
      }
    }

    if (query.itemNumber) {
      whereCondition.itemNumber = query.itemNumber;
    }

    if (query.isApplied !== undefined) {
      whereCondition.isApplied = query.isApplied;
    }

    if (query.changedBy) {
      whereCondition.changedBy = query.changedBy;
    }

    const { count: totalCount, rows: futurePricings } = await FuturePricing.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      futurePricings,
    };
  }

  async updateFuturePricing(id: number, body: Partial<{
    itemNumber: number;
    effectiveAt: Date;
    changedFields: Array<Record<string, any>>;
    isApplied: boolean;
    changedBy: 'admin' | 'user';
    changedUserId: number | null;
  }>) {
    const futurePricing = await FuturePricing.findByPk(id);

    if (!futurePricing) {
      throw new AppError(Manager.FUTURE_PRICING_NOT_FOUND, 404);
    }

    await futurePricing.update(body);
    return futurePricing;
  }

  async deleteFuturePricing(id: number) {
    const futurePricing = await FuturePricing.findByPk(id);

    if (!futurePricing) {
      throw new AppError(Manager.FUTURE_PRICING_NOT_FOUND, 404);
    }

    await futurePricing.destroy();
    return { success: true, message: 'Future pricing deleted successfully' };
  }

  async uploadImages(req: Request) {
    const file = req.file;
    if (!file) {
      throw new AppError('File not found', 404);
    }
    const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'retailer-attachments');
    if (!result.success) {
      throw new AppError(result.error || 'Failed to upload image', 500);
    }
    return result;
  }

  // RetailerDocuments CRUD methods
  

  async getRetailerDocumentsById(id: number) {
    const retailerDocuments = await RetailerDocuments.findByPk(id);

    if (!retailerDocuments) {
      throw new AppError(Manager.RETAILER_DOCUMENTS_NOT_FOUND, 404);
    }

    return retailerDocuments;
  }

  async getAllRetailerDocuments(query: PaginationOptions & {
    search?: string;
    customerNumber?: number;
  }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition: any = {};

    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        whereCondition.customerNumber = searchNum;
      }
    }

    if (query.customerNumber) {
      whereCondition.customerNumber = query.customerNumber;
    }

    const { count: totalCount, rows: retailerDocuments } = await RetailerDocuments.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      retailerDocuments,
    };
  }

  async updateRetailerDocuments(id: number, body: Partial<{
    customerNumber: number;
    attachments: string[] | null;
    salesTaxDoc: string | null;
    CigTaxDoc: string | null;
    licenseAttachments: string[] | null;
  }>) {
    const retailerDocuments = await RetailerDocuments.findByPk(id);

    if (!retailerDocuments) {
      throw new AppError(Manager.RETAILER_DOCUMENTS_NOT_FOUND, 404);
    }

    await retailerDocuments.update(body);
    return retailerDocuments;
  }

  async deleteRetailerDocuments(id: number) {
    const retailerDocuments = await RetailerDocuments.findByPk(id);

    if (!retailerDocuments) {
      throw new AppError(Manager.RETAILER_DOCUMENTS_NOT_FOUND, 404);
    }

    await retailerDocuments.destroy();
    return { success: true, message: 'Retailer documents deleted successfully' };
  }

  async createRetailerDocuments(body: {
    customerNumber: number;
    attachments?: string[] | null;
    salesTaxDoc?: string | null;
    CigTaxDoc?: string | null;
    licenseAttachments?: string[] | null;
  }) {
    const retailerDocuments = await RetailerDocuments.create(body);
    return retailerDocuments;
  }
} 
