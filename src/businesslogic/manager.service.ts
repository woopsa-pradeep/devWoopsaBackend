import { query, Request } from "express";

function parseManualSettingDate(v: string | Date | null | undefined): Date | null {
  if (v == null || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
import moment from "moment";
import { AuthMessage, EmailMessage, Manager } from "../constants";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { ICreateBanner, ICreateLink, ICreateNotificationScheduler, ICreateRetailerProductCatalog, ICreateStory, ICreateWebView, IGetLinks, IGetNotificationSchedulers, IGetProductInformation, IGetRetailerProductCatalogs, IGetStories, IGetWebViews, IWebViewGroupedResponse, IHomeSettings, IManualItemsSetting, IPopularItemsModeSetting, IUpdateBanner, IUpdateDevice, IUpdateLink, IUpdateNotificationScheduler, IUpdateRetailerProductCatalog, IUpdateStory, IUpdateWebView, IUpdateUploadProductImage, IUploadProductImage, IWarehouseSetting, IContactUs } from "../interfaces/request.body.interface";
import { Customer } from "../models/mmsql/customer.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { RetailerDevice } from "../models/postgres/device.model";
import { ProductImage } from "../models/postgres/product.model";
import { AppError } from "../utils/AppError";
import { Operations } from "../utils/operations";
import { uploadFileToAzure } from "../utils/azureUploader";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { cast, col, literal, Op, fn, Order, Sequelize, where, and, FindAttributeOptions, FindOptions } from 'sequelize';
import { PriceClass } from "../models/mmsql/priceClass.model";
import Banner from "../models/postgres/banner.model";
import { SalesCategory } from "../models/mmsql/salesCategory.model";
import { Vendor } from "../models/mmsql/vendor.model";
import { Users } from "../models/mmsql/user.model"
import { CustReceivables } from "../models/mmsql/custReceivables.model";
import { Token } from "../models/postgres/token.model";
import { Retailer } from "../models/postgres/retailer.model";
import { checkRegisterCustomer, generateRandomString, getDiscount, getDiscountsForItemNumbers, getFirstValidPrice, getInventoryOnHand, getJurisdiction, getTaxRateV1, hasDiscountedItem, hashPassword, hasPriceChange, pgArrayToJsArray, sendEmailToMarketing, toNum } from "../utils/helper";
import { generateNewCredentialsEmail, generateSupportTicketEmail, generateSupportTicketForDistributor } from "../view/emails";
import { sendDistributorEmail, sendEmail, sendEmailMarketing, sendTestEmail } from "../utils/sendMail";
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
import NewItemsSetting from "../models/postgres/newItemsSetting.model";
import PopularItemsModeSetting from "../models/postgres/popularItemsModeSetting.model";
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
import { EmailModule } from "../models/postgres/emailModules.model";
import { EmailModuleConfig, IEmailModuleConfig } from "../models/postgres/emailModuleConfig.model";
import { InvoiceTemplate, IInvoiceTemplate } from "../models/postgres/invoiceTemplate.model";
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
import InventorySpecials from "../models/mmsql/inventorySpecail.model";
import { emailNotificationQueue } from "../configuration/config";
import { markAsUntransferable } from "worker_threads";
import { PriceSubclass_Defs } from "../models/mmsql/priceSubClassDefs.model";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { PickRightAreaDefinition } from "../models/mmsql/pickRightAreaDefination.model";
import { postgresSequelize, sequelize } from "../db";
import { QueryTypes } from "sequelize";
import InventoryHistory from "../models/mmsql/inventoryHistory.model";
import { ClassOfTrade } from "../models/mmsql/classOfTrade.model";
import { TaxRates } from "../models/mmsql/taxRates.model";
import { TaxRates_City } from "../models/mmsql/taxRateCity.model";
import { TaxRates_County } from "../models/mmsql/taxRateCounty.model";
import { PurchaseOrderRequest } from "../interfaces/request.body.interface";
import { getDefaultPOHeaderValues, getNextPONumber } from "../utils/purchaseOrder";
import { PODetail } from "../models/mmsql/poDetail.model";
import { now } from "moment";
import { Driver } from "../models/postgres/driver.model";
import { Picklist } from "../models/postgres/picklist.model";
import { FuturePricing } from "../models/postgres/futurePricing.model";
import { RetailerDocuments } from "../models/postgres/retailerDocuments.model";
import { Inventory_ItemGroups } from "../models/mmsql/inventoryItemGroup.model";
import { InventoryBrands, getNextInventoryBrand } from "../models/mmsql/inventoryBrand.model";
import { RetailerLocation } from "../models/postgres/retailerLocation.model";
import Vehicle from "../models/postgres/vehicle.model";
// import { buildItemFilters,CommonReportFilters } from '../utils/commonFilter.helper';
import { formatCustomerVelocityItemBreakdown } from '../utils/formatItemOrderBreakdown.helper';
import { getDirectionsInOrder, getDistanceMatrix, getOptimizedDirections } from "../utils/map.utlis";
import { DeliveryRoute, RouteStatus } from "../models/postgres/deliveryRoute.model";
import { DeliveryRouteStop, DeliveryStopStatus } from "../models/postgres/deliveryRouteStop.model";
import DeliveryRoutePOD from "../models/postgres/deliveryRoutePOD.model";
import DeliveryRouteGroup from "../models/postgres/driverRoutesGroup.model";
import { CustBillTo } from "../models/mmsql/custBillTo.model";
// import { buildItemFilters,CommonReportFilters } from '../utils/commonFilter.helper';
import { Record_Locks } from "../models/mmsql/recordLock.model";
import { ReceivableUser } from "../models/postgres/receivableUser.model";
import { PreBook } from "../models/postgres/preBook.model";
import { TradeShow } from "../models/postgres/tradeShow.model";
import { TradeShowItem } from "../models/postgres/tradeShowItem.model";
import { TradeShowRetailer } from "../models/postgres/tradeShowRetailer.model";
import { TradeShowVendor } from "../models/postgres/tradeShowVendor";
import { TradeShowDeliveryProduct } from "../models/postgres/tradeShowDeliveryProduct.model";
import { CustomerAssignInvoiceTemplate } from "../models/postgres/customerAssingInvoiceTemplate.model";
import { CheckerActionLog } from "../models/postgres/checkerActionLog.model";
import { CustFinanceCharges } from "../models/mmsql/custFinanceCharges.model"
import { ARDeletes } from "../models/mmsql/arDeletes.mode";
import { InventorySavedDetail } from "../models/mmsql/inventorySavedDetail.model"
import { DeliveryTypes } from "../models/mmsql/deliveryType.model";
import { ProductDiscount } from "../models/postgres/productDiscount.model";
import { syncProductDiscountsToRedis } from "../cron/productDiscount.cron";
import {
  getAllProductDiscountsFromRedis,
  getProductDiscountFromRedis,
  getAllProductDiscountsForItemFromRedis,
  getProductDiscountsByDateFromRedis,
  getDiscountedPriceFromRedis
} from "../utils/productDiscount.redis";
import ApiLog from "../models/postgres/apilogs.model";
import { InventoryLogHistory } from "../models/mmsql/InventoryLogHistory.model";
import { Order_Header_Costs } from "../models/mmsql/orderHeaderCost.model"
import { DEFAULT_INVOICE_TEMPLATE } from "../seeder/invoiceTemplate.seeder"
import pLimit from "p-limit";
type DisType = "PERCENT" | "FLAT";

type BulkItemInput = {
  itemNumber: string;
  discount: string; // keeping as string since your model likely stores/accepts it; validate numeric
  minQuantity: number;
  description: string;
  salesCategory: number;
  priceClass: number;
  vendorId: number;
  maxQuantity: number;
  disType: DisType;
};

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

        //updated all device destroyed in RetailerDevice table
        updateOperations.push(
          RetailerDevice.destroy({
            where: { customerNumber: customerNumber }
          })
        )

        // Update all devices for this customer to inactive session
        // updateOperations.push(
        //   RetailerDevice.update(
        //     { sessionActive: false, isAllow: false },
        //     {
        //       where: { customerNumber },
        //       transaction
        //     }
        //   )
        // );
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


  async getCustomerList(query: PaginationOptions & { search?: string, Inactive?: string }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';


    let whereCondition: any = search
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

    if (query.Inactive == 'true') {
      whereCondition.C_Inactive = true;
    } else if (query.Inactive == 'false') {
      whereCondition.C_Inactive = false;
    }
    console.log(whereCondition, 'whereCondition')

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

    const retailerDocuments = await RetailerDocuments.findAll({
      where: { customerNumber: { [Op.in]: customerNumbers } },
      attributes: ['customerNumber', 'feinDocument', 'attachments', 'id', 'salesTaxDoc', 'CigTaxDoc', 'licenseAttachments'],
      raw: true,
    });

    const documentsMap = new Map();
    retailerDocuments.forEach((doc: any) => {
      documentsMap.set(doc.customerNumber, {
        feinDocument: doc.feinDocument,
        attachments: doc.attachments,
        id: doc.id,
        salesTaxDoc: doc.salesTaxDoc,
        CigTaxDoc: doc.CigTaxDoc,
        customerNumber: doc.customerNumber,
        licenseAttachments: doc.licenseAttachments,
      });
    });

    const customerListWithStats = customerList.map((customer: any) => {
      const cNum = customer.C_Number;

      return {
        ...customer.toJSON(),
        isRegisterCustomer: registerSet.has(cNum),
        orderStats: statsMap.get(cNum) || { ERP: 0, Mobile: 0, Web: 0 },
        customerLimit: limitMap.get(cNum) || { maxOrderLimit: null, minOrderAmount: null },
        retailerDocuments: documentsMap.get(cNum) || null,
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

  async getProductList(query: PaginationOptions & { search?: string; all?: boolean }) {
    let { page = 1, limit = 10, salesCategoryId, search, priceClassId, I_Inactive, ShortOrderForm, all, vendor } = query;

    page = Number(page);
    limit = Number(limit);

    let whereClause: any = {};

    // If all = true, skip I_Inactive and ShortOrderForm filters
    if (all !== true) {
      if (!I_Inactive) {
        I_Inactive = false;
      } else {
        I_Inactive = true;
      }
      if (!ShortOrderForm) {
        ShortOrderForm = false;
      } else {
        ShortOrderForm = true;
      }

      whereClause.I_Inactive = I_Inactive;
      whereClause.ShortOrderForm = ShortOrderForm;
    }





    let searchInUPC = false;
    let orderClause: Order = [['Date_Created', 'DESC'] as const];




    if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0 && Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Both filters exist → use OR condition
      whereClause[Op.or] = [
        { Sales_Category: { [Op.in]: salesCategoryId } },
        { Price_Class: { [Op.in]: priceClassId } },
        { Primary_Vendor: { [Op.in]: vendor } }
      ];
    } else if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0) {
      // Only Sales_Category filter
      whereClause.Sales_Category = { [Op.in]: salesCategoryId };
    } else if (Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Only Price_Class filter
      whereClause.Price_Class = { [Op.in]: priceClassId };
    }
    else if (Array.isArray(vendor) && vendor.length > 0) {
      whereClause.Primary_Vendor = { [Op.in]: vendor };
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
        'OTP_Number', 'Price_Subclass', 'UnitOunces', 'EBT'
      ],
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
        I_Inactive: e.I_Inactive,
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

  async getProductListWithTax(query: PaginationOptions & { search?: string }) {
    let { page = 1, limit = 10, salesCategoryId, search, priceClassId, I_Inactive, ShortOrderForm, customerId } = query;

    page = Number(page);
    limit = Number(limit);
    if (!I_Inactive) {
      I_Inactive = false;
    } else {
      I_Inactive = true;
    }
    if (!ShortOrderForm) {
      ShortOrderForm = false;
    } else {
      ShortOrderForm = true;
    }

    let whereClause: any = {
      I_Inactive: I_Inactive,
      ShortOrderForm: ShortOrderForm,
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
        'OTP_Number', 'Price_Subclass', 'UnitOunces', 'EBT'
      ],
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
      let userJurisdiction = null;
      if (customerId) {
        userJurisdiction = await getJurisdiction(Number(customerId));
      }
      if (userJurisdiction) {
        const taxRate = await getTaxRateV1(Number(e.OTP_Number), userJurisdiction as number, e.Item_Number, Number(e.Price1));
        e.Price1 = Number(e.Price1) + Number(taxRate);
      }


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
          attributes: ['UPC_Number', 'Status'],
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

    // Build UPCList with all 3 slots (0=Primary, 1=Case, 2=Retail) in order
    const upcMap = new Map((productData?.UPCList || []).map((u: any) => [u.Status, u.UPC_Number]));
    const UPCList = [
      { Status: 0, UPC_Number: upcMap.get(0) || null },
      { Status: 1, UPC_Number: upcMap.get(1) || null },
      { Status: 2, UPC_Number: upcMap.get(2) || null },
    ];

    let object = {
      ...product,
      UPCList,
      inventoryOnHand,
      masterImage: `${process.env.AZUREIMAGESERVER}${upcMap.get(0) || ''}.jpg`,
    }

    return object;
  }


  async uploadProductImage(body: IUploadProductImage, req: AuthRequest) {
    const file = req.file;
    const wareHouseDetail = await Distributor.findAll({
      attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID", "D_Logo"],
    });
    const wareHouseName = wareHouseDetail[0].D_Name;
    if (!file) {
      throw new AppError(AuthMessage.FILE_NOT_FOUND, 400);
    }
    const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'Woopsa');

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

    const wareHouseDetail = await Distributor.findAll({
      attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone", "PM_ID", "D_Logo"],
    });
    const wareHouseName = wareHouseDetail[0].D_Name;
    if (file) {
      const result = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, wareHouseName || 'Woopsa');
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

          // Filter out any invalid numbers and remove duplicates
          const validItemNumbers = [...new Set(itemNumbers.filter((num: number) => !isNaN(num)))];

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

    // 8) Current Due = net balance across ALL AR types for this customer
    const dueWhereCondition: any = {
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
      where: { email: body.email.toLowerCase() }
    });
    if (checkEmail) {
      throw new AppError(Manager.EMAIL_ALREADY_EXISTS, 400);
    }

    const password = generateRandomString(9);
    const hashedPassword = await hashPassword(password);

    body.password = hashedPassword;
    const companyName = await Distributor.findOne({ attributes: ["D_Name"] });
    body.email = body.email.toLowerCase()

    const user = await WebUsers.create(body);

    const htmlContent = generateNewCredentialsEmail(body.firstName + " " + body.lastName, body.email, password);
    await sendEmail({
      to: body.email,
      subject: `Welcome to ${companyName?.D_Name} – Your Account is Ready!`,
      html: htmlContent,
    });

    return user;
  }

  async createReceivableUser(body: any) {
    // Ensure role is set to receivable


    body.firstName = body.firstName.trim();
    body.lastName = body.lastName.trim();
    const existingUser = await ReceivableUser.findOne({
      where: {
        firstName: body.firstName,
        lastName: body.lastName,
        isActive: true,
      },
    });
    if (existingUser) {
      throw new AppError(Manager.USER_ALREADY_EXISTS, 400);
    }
    const checkEmail = await ReceivableUser.findOne({
      where: { email: body.email.toLowerCase() }
    });
    if (checkEmail) {
      throw new AppError(Manager.EMAIL_ALREADY_EXISTS, 400);
    }

    // Validate password is provided
    if (!body.password) {
      throw new AppError('Password is required', 400);
    }

    // Hash the user-provided password
    const hashedPassword = await hashPassword(body.password);
    body.password = hashedPassword;
    body.email = body.email.toLowerCase();

    // Set default item_sort_by if not provided
    if (!body.item_sort_by) {
      body.item_sort_by = 'line_number';
    }

    const user = await ReceivableUser.create(body);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async updateReceivableUser(id: number, body: any) {
    // Check if user exists and has receivable role
    const existingUser = await ReceivableUser.findByPk(id);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }


    // If email is being updated, check if new email already exists
    if (body.email) {
      body.email = body.email.toLowerCase();
      const checkEmail = await WebUsers.findOne({
        where: {
          email: body.email,
          id: { [Op.ne]: id } // Exclude current user
        }
      });
      if (checkEmail) {
        throw new AppError(Manager.EMAIL_ALREADY_EXISTS, 400);
      }
    }

    // If password is being updated, hash it
    if (body.password) {
      body.password = await hashPassword(body.password);
    }

    // Trim name fields if provided
    if (body.firstName) {
      body.firstName = body.firstName.trim();
    }
    if (body.lastName) {
      body.lastName = body.lastName.trim();
    }

    // Ensure role cannot be changed
    delete body.role;

    await ReceivableUser.update(body, {
      where: { id: id }
    });

    // Return updated user
    const updatedUser = await ReceivableUser.findByPk(id);
    if (!updatedUser) {
      throw new AppError('User not found after update', 404);
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser.toJSON();
    return userWithoutPassword;
  }

  /**
   * Get all assigned categories from all epick users
   * Returns a map: categoryNumber -> array of user IDs who have it
   */
  private async getAssignedCategories(excludeUserId?: number): Promise<{ [key: number]: number[] }> {
    const whereCondition: any = {
      isActive: true,
      [Op.or]: [{ assignmentType: null }, { assignmentType: 'sales_category' }]
    };
    if (excludeUserId) {
      whereCondition.id = { [Op.ne]: excludeUserId };
    }
    const allUsers = await EpickUser.findAll({
      where: whereCondition,
      attributes: ['id', 'category', 'assignmentType']
    });
    const assignedMap: { [key: number]: number[] } = {};
    allUsers.forEach((user: any) => {
      const assignmentType = user.assignmentType || 'sales_category';
      if (assignmentType !== 'sales_category') return;
      const categories = user.category || [];
      categories.forEach((cat: number) => {
        if (!assignedMap[cat]) assignedMap[cat] = [];
        assignedMap[cat].push(user.id);
      });
    });
    return assignedMap;
  }

  /**
   * Get all assigned PickRight areas from epick users (assignmentType === 'pickright_area').
   * Returns a map: areaKey -> array of user IDs who have it.
   */
  private async getAssignedPickRightAreas(excludeUserId?: number): Promise<{ [key: string]: number[] }> {
    const whereCondition: any = { isActive: true, assignmentType: 'pickright_area' };
    if (excludeUserId) {
      whereCondition.id = { [Op.ne]: excludeUserId };
    }
    const users = await EpickUser.findAll({
      where: whereCondition,
      attributes: ['id', 'pickRightAreas']
    });
    const assignedMap: { [key: string]: number[] } = {};
    users.forEach((user: any) => {
      const areas = user.pickRightAreas || [];
      areas.forEach((area: string) => {
        if (!assignedMap[area]) assignedMap[area] = [];
        assignedMap[area].push(user.id);
      });
    });
    return assignedMap;
  }

  /**
   * Validate PickRight area assignment: areas must exist in PickRight_AreaDefinition;
   * single area cannot be shared (same rule as category).
   */
  private async validatePickRightAreaAssignment(areas: string[], excludeUserId?: number): Promise<void> {
    if (!Array.isArray(areas) || areas.length === 0) {
      throw new AppError('PickRight areas must be a non-empty array', 400);
    }
    const validAreas = await PickRightAreaDefinition.findAll({
      attributes: ['PickArea'],
      raw: true
    });
    const validSet = new Set((validAreas as any[]).map((r: any) => String(r.PickArea).trim()));
    for (const area of areas) {
      const key = String(area).trim();
      if (!key) {
        throw new AppError('PickRight area cannot be empty', 400);
      }
      if (!validSet.has(key)) {
        throw new AppError(`Invalid PickRight area: "${key}". Area must exist in PickRight_AreaDefinition.`, 400);
      }
    }
    const assignedAreas = await this.getAssignedPickRightAreas(excludeUserId);
    if (areas.length === 1) {
      const area = String(areas[0]).trim();
      if (assignedAreas[area] && assignedAreas[area].length > 0) {
        throw new AppError(
          `PickRight area "${area}" is already assigned to another user. Single areas cannot be shared. You can select multiple areas to share them.`,
          400
        );
      }
    }
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

    const assignmentType = (body.assignmentType || 'sales_category') as 'sales_category' | 'pickright_area';

    if (assignmentType === 'sales_category') {
      if (!body.category || !Array.isArray(body.category) || body.category.length === 0) {
        throw new AppError('Category is required and must be a non-empty array when assignmentType is sales_category', 400);
      }
      await this.validateCategoryAssignment(body.category);
    } else {
      if (!body.pickRightAreas || !Array.isArray(body.pickRightAreas) || body.pickRightAreas.length === 0) {
        throw new AppError('pickRightAreas is required and must be a non-empty array when assignmentType is pickright_area', 400);
      }
      await this.validatePickRightAreaAssignment(body.pickRightAreas);
    }

    if (body.userNumber === undefined || body.userNumber === null) {
      throw new AppError('userNumber is required', 400);
    }

    const hashedPassword = await hashPassword(body.password);

    const epickUser = await EpickUser.create({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: hashedPassword,
      userNumber: String(body.userNumber),
      assignmentType,
      category: assignmentType === 'sales_category' ? body.category : [],
      pickRightAreas: assignmentType === 'pickright_area' ? (body.pickRightAreas || []).map((a: string) => String(a).trim()) : [],
      order_type: body.order_type || 'order_number',
      shortby: body.shortby || 'Des',
      item_sort_by: body.item_sort_by || 'line_number',
      status: body.status !== undefined ? body.status : true,
      isActive: body.isActive !== undefined ? body.isActive : true,
      role: "epick"
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = epickUser.toJSON();
    return userWithoutPassword;
  }

  async updateUser(id: number, body: any) {
    if (body.email) {
      body.email = body.email.toLowerCase()
    }
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

    // Handle assignmentType + category or pickRightAreas update
    const activeConfirmations = await EpickConfirmation.findAll({
      where: { pickerUserId: id, status: 'in_progress' }
    });
    const hasActiveOrders = activeConfirmations.length > 0;

    if (body.assignmentType !== undefined) {
      const newType = body.assignmentType as string;
      if (newType !== 'sales_category' && newType !== 'pickright_area') {
        throw new AppError('assignmentType must be sales_category or pickright_area', 400);
      }
      if (hasActiveOrders) {
        throw new AppError('Cannot change assignment type while user has active orders. Complete all active orders first.', 400);
      }
      updateData.assignmentType = newType;
      if (newType === 'sales_category') {
        if (!body.category || !Array.isArray(body.category) || body.category.length === 0) {
          throw new AppError('category is required when assignmentType is sales_category', 400);
        }
        await this.validateCategoryAssignment(body.category, id);
        updateData.category = body.category;
        updateData.pickRightAreas = [];
      } else {
        if (!body.pickRightAreas || !Array.isArray(body.pickRightAreas) || body.pickRightAreas.length === 0) {
          throw new AppError('pickRightAreas is required when assignmentType is pickright_area', 400);
        }
        await this.validatePickRightAreaAssignment(body.pickRightAreas, id);
        updateData.pickRightAreas = (body.pickRightAreas as string[]).map((a: string) => String(a).trim());
        updateData.category = [];
      }
    } else if (body.category !== undefined) {
      await this.validateCategoryAssignment(body.category, id);
      if (hasActiveOrders) {
        throw new AppError('Cannot update categories while user has active orders. Complete all active orders first.', 400);
      }
      updateData.category = body.category;
      updateData.assignmentType = 'sales_category';
      updateData.pickRightAreas = [];
    } else if (body.pickRightAreas !== undefined) {
      await this.validatePickRightAreaAssignment(body.pickRightAreas, id);
      if (hasActiveOrders) {
        throw new AppError('Cannot update PickRight areas while user has active orders. Complete all active orders first.', 400);
      }
      updateData.pickRightAreas = (body.pickRightAreas as string[]).map((a: string) => String(a).trim());
      updateData.assignmentType = 'pickright_area';
      updateData.category = [];
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
      const validSortOptions = ['sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'alphabetically_section_location', 'item_number', 'short_number', 'line_number'];
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
      const validSortOptions = ['sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'alphabetically_section_location', 'item_number', 'short_number', 'line_number'];
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
    const validSortOptions = ['section_location', 'alphabetically', 'alphabetically_section_location', 'item_number', 'short_number', 'line_number'];
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
    const user = await EpickUser.findByPk(userId);
    if (!user) {
      throw new AppError('Epick user not found', 404);
    }
    const assignmentType = (user as any).assignmentType || 'sales_category';
    if (assignmentType !== 'sales_category') {
      throw new AppError('User is assigned by PickRight areas. Use pickRightAreas update to change areas.', 400);
    }

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
      attributes: ['id', 'email', 'firstName', 'lastName', 'assignmentType', 'category', 'pickRightAreas'],
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
   * Get PickRight areas for EPICK user assignment (from MSSQL PickRight_AreaDefinition).
   */
  async getPickRightAreasForEpick() {
    const areas = await PickRightAreaDefinition.findAll({
      attributes: ['PickArea', 'PickArea_Description'],
      order: [['PickArea_Description', 'ASC']],
      raw: true
    });
    return (areas as any[]).map((r: any) => ({
      pickArea: r.PickArea,
      pickAreaDescription: r.PickArea_Description || r.PickArea
    }));
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
      attributes: ['id', 'email', 'firstName', 'lastName', 'assignmentType', 'category', 'pickRightAreas', 'order_type', 'shortby', 'item_sort_by', 'userNumber', 'isActive', 'status'],
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
      status: { [Op.in]: ['completed', 'ready_for_delivery'] }
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

    const orderNumbers = finalData.map((d: any) => d.orderNumber).filter(Boolean);
    let checkerLogMap: Record<number, {
      totalQtyDeltaByChecker: number;
      totalBundlesDeltaByChecker: number;
      photoActionsCount: number;
      lastCheckerActionAt: Date | null;
      checkerUserIds: number[];
      checkerActionLogs: Array<{
        id: number;
        checkerUserId: number | null;
        actionType: string;
        itemNumber: number | null;
        lineNumber: number | null;
        boxId: number | null;
        deltaQty: number;
        deltaBundles: number;
        meta: any;
        createdAt: Date;
      }>;
    }> = {};

    if (orderNumbers.length > 0) {
      const checkerLogs = await CheckerActionLog.findAll({
        where: {
          orderNumber: { [Op.in]: orderNumbers }
        },
        attributes: [
          "id",
          "orderNumber",
          "checkerUserId",
          "actionType",
          "itemNumber",
          "lineNumber",
          "boxId",
          "deltaQty",
          "deltaBundles",
          "meta",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        raw: true,
      });

      checkerLogMap = checkerLogs.reduce((acc: any, log: any) => {
        const orderNo = Number(log.orderNumber);
        if (!acc[orderNo]) {
          acc[orderNo] = {
            totalQtyDeltaByChecker: 0,
            totalBundlesDeltaByChecker: 0,
            photoActionsCount: 0,
            lastCheckerActionAt: null,
            checkerUserIds: [],
            checkerActionLogs: [],
          };
        }

        const qtyDelta = Number(log.deltaQty) || 0;
        const bundleDelta = Number(log.deltaBundles) || 0;
        acc[orderNo].totalQtyDeltaByChecker += qtyDelta;
        acc[orderNo].totalBundlesDeltaByChecker += bundleDelta;

        if (log.actionType === "photo_add" || log.actionType === "photo_update") {
          acc[orderNo].photoActionsCount += 1;
        }

        if (log.createdAt && (!acc[orderNo].lastCheckerActionAt || new Date(log.createdAt) > new Date(acc[orderNo].lastCheckerActionAt))) {
          acc[orderNo].lastCheckerActionAt = log.createdAt;
        }

        if (log.checkerUserId && !acc[orderNo].checkerUserIds.includes(log.checkerUserId)) {
          acc[orderNo].checkerUserIds.push(log.checkerUserId);
        }

        acc[orderNo].checkerActionLogs.push({
          id: Number(log.id),
          checkerUserId: log.checkerUserId ?? null,
          actionType: log.actionType,
          itemNumber: log.itemNumber ?? null,
          lineNumber: log.lineNumber ?? null,
          boxId: log.boxId ?? null,
          deltaQty: qtyDelta,
          deltaBundles: bundleDelta,
          meta: log.meta ?? {},
          createdAt: log.createdAt,
        });

        return acc;
      }, {});
    }

    const finalDataWithChecker = finalData.map((row: any) => {
      const checkerSummary = checkerLogMap[row.orderNumber];
      if (!checkerSummary) return row;
      return {
        ...row,
        totalQtyDeltaByChecker: checkerSummary.totalQtyDeltaByChecker,
        totalBundlesDeltaByChecker: checkerSummary.totalBundlesDeltaByChecker,
        photoActionsCount: checkerSummary.photoActionsCount,
        lastCheckerActionAt: checkerSummary.lastCheckerActionAt,
        checkerUserIds: checkerSummary.checkerUserIds,
        checkerActionLogs: checkerSummary.checkerActionLogs,
      };
    });

    return {
      data: finalDataWithChecker,
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
      firstName: { [Op.ne]: 'woopsaSales' },
      lastName: { [Op.ne]: 'woopsaSales' },
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
    const { permissions, userId } = body;

    const updates = await Promise.all(
      permissions.map(async (perm: any) => {
        console.log(perm, "perm")
        if (!perm.id) {
          const created = await RolePermission.create({ ...perm, userId });
          return created;
        } else {
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

    const currentStatus = query.currentStatus || 'all';

    console.log(query, 'query--->');



    // Handle query parameters with potential trailing spaces
    const page = Number(query.page || (query as any)['page ']) || 1;
    const limit = Number(query.limit || (query as any)['limit ']) || 10;
    const customerNumber = query.customerNumber || (query as any)['customerNumber '];
    const startDate = query.startDate || (query as any)['startDate '];
    const endDate = query.endDate || (query as any)['endDate '];

    const offset = (page - 1) * limit;

    if (currentStatus === 'recordLocks') {
      const recordLocks = await Record_Locks.findAll({
        where: {
          Lock_Type: 0
        },
        attributes: ['Lock_Number'],
        raw: true
      });
      const recordLocksOrderNumbers = recordLocks.map((lock: any) => lock.Lock_Number);
      const whereCondition: any = {
      };
      if (recordLocksOrderNumbers.length > 0) {
        whereCondition.Order_Number = {
          [Op.in]: recordLocksOrderNumbers
        };
      } else {
        return {
          totalCount: 0,
          page: page,
          limit: limit,
          totalPages: 0,
          orderList: [],
        };
      }
      if (query.isDeleted) {
        whereCondition.Order_Deleted = query.isDeleted;
      }
      if (query.updated) {
        whereCondition.Order_Updated = query.updated;
      }




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
          'Invoice_Number',
          'C_Number',
          'Order_Source',
          'Order_Date',
          'Picklist_Printed',
          'Order_Deleted'
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
        distinct: true,
        col: 'Order_Number',

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
          Invoice_Number: order.Invoice_Number,
          Order_Source: order.Order_Source,
          Order_Deleted: order.Order_Deleted,
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

    else if (currentStatus === 'orderConfirmation') {

      const whereCondition: any = {
      };
      if (query.isDeleted) {
        whereCondition.Order_Deleted = query.isDeleted;
      }
      if (query.updated) {
        whereCondition.Order_Updated = query.updated;
      }




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
          'Invoice_Number',
          'C_Number',
          'Order_Source',
          'Order_Date',
          'Picklist_Printed',
          'Order_Deleted'
        ],
        where: {
          ...whereCondition,
          [Op.and]: [
            ...(whereCondition[Op.and] ?? []),
            Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM [Order_Detail] od
                WHERE od.Order_Number = [OrderHeader].[Order_Number]
              )
              AND NOT EXISTS (
                SELECT 1
                FROM [Order_Detail] od2
                WHERE od2.Order_Number = [OrderHeader].[Order_Number]
                  AND (od2.Confirmed = 0 OR od2.Confirmed IS NULL)
              )
            `),
          ],
        },
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
        distinct: true,
        col: 'Order_Number',
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
          Invoice_Number: order.Invoice_Number,
          Order_Source: order.Order_Source,
          Order_Deleted: order.Order_Deleted,
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

    else {
      // Build where condition
      const whereCondition: any = {
      };
      if (query.isDeleted == true) {
        whereCondition.Order_Deleted = true;
      }
      if (query.updated) {
        whereCondition.Order_Updated = query.updated;
      }



      if (currentStatus === 'invoices') {
        whereCondition.Invoice_Number = {
          [Op.gt]: 0
        };
      } else if (currentStatus === 'non_invoices') {
        whereCondition.Invoice_Number = {
          [Op.eq]: 0
        };
      } else if (currentStatus === 'picklist') {
        whereCondition.Picklist_Printed = true;
      } else if (currentStatus === 'EpickStatusFromPicker') {
        whereCondition.EpickStatusFromPicker = 'completed'
      }

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
          'Invoice_Number',
          'Order_Source',
          'Order_Date',
          'Picklist_Printed',
          'Order_Deleted'
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
          },
          {
            model: OrderDetail,
            as: 'orderDetails',
            attributes: ['Order_Number', 'Quantity_Ordered'],
            required: true

          }
        ],
        distinct: true,
        col: 'Order_Number',

        order: [['Order_Number', 'DESC']],
        limit,
        offset,
      });

      // Get the order numbers to fetch quantities
      const orderNumbers = orderList.map((order: any) => order.Order_Number);

      // Get total quantities for these orders
      let quantityMap = new Map();
      let isConfirmed = new Map();
      if (orderNumbers.length > 0) {
        // Get total quantities grouped by Order_Number
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

        // Create a map for quick lookup of quantities
        quantityResults.forEach((result: any) => {
          quantityMap.set(result.Order_Number, Number(result.totalQuantity || 0));
        });

        // Get all OrderDetails to check Confirmed status
        const allOrderDetails = await OrderDetail.findAll({
          attributes: ['Order_Number', 'Confirmed'],
          where: {
            Order_Number: { [Op.in]: orderNumbers }
          },
          raw: true
        });

        // Group OrderDetails by Order_Number and check if all are confirmed
        const orderDetailsByOrder = new Map<number, any[]>();
        allOrderDetails.forEach((detail: any) => {
          const orderNum = detail.Order_Number;
          if (!orderDetailsByOrder.has(orderNum)) {
            orderDetailsByOrder.set(orderNum, []);
          }
          orderDetailsByOrder.get(orderNum)!.push(detail);
        });

        // For each order, check if ALL OrderDetails have Confirmed=true
        orderDetailsByOrder.forEach((details: any[], orderNum: number) => {
          const allConfirmed = details.every((detail: any) => detail.Confirmed === true);
          isConfirmed.set(orderNum, allConfirmed);
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
          Invoice_Number: order.Invoice_Number,
          Order_Source: order.Order_Source,
          Order_Deleted: order.Order_Deleted,
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
          totalQuantityOrdered: quantityMap.get(order.Order_Number) || 0,
          isConfirmed: isConfirmed.get(order.Order_Number) || false
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
  }


  // async getOrderForPickListConfirmation(query: PaginationOptions) {
  //   console.log('query params --->', query);

  //   const currentStatus = query.currentStatus || 'all';
  //   const { startDate, endDate } = query;
  //   if (query.updated && String(query.updated).toLowerCase() === 'true') {
  //     return [];
  //   }

  //   const whereCondition: any = {
  //   Order_Deleted: false,
  //   Confirmed: false,
  //   Invoice_Number: { [Op.lte]: 0 },
  //   Picklist_Printed: false,
  //   Order_Updated: false,
  //   Order_Type: { [Op.ne]: 6 },
  // };

  // // ✅ Add Date Filter
  // if (query.startDate && query.endDate) {
  //   whereCondition.Order_Date = {
  //     [Op.between]: [
  //       new Date(query.startDate),
  //       new Date(query.endDate)
  //     ]
  //   };
  // }

  //   // isDeleted=true
  //  if (query.isDeleted && String(query.isDeleted).toLowerCase() === 'true') {
  //   console.log('isDeleted is true, returning empty array');
  //     return [];
  //   } 

  //  if(currentStatus === 'all'){
  //     console.log('Final whereCondition --->', whereCondition);
  //     const orderNumbers = await OrderHeader.findAll({
  //       attributes: ['Order_Number'],
  //       where: whereCondition,
  //       order: [['Order_Number', 'DESC']]
  //         });

  //     return orderNumbers.map((order: any) => order.Order_Number);
  //   };


  //   if(currentStatus === 'recordLocks'){
  //     const recordLocks = await Record_Locks.findAll({
  //       where: {
  //         Lock_Type: 0
  //       },
  //       attributes: ['Lock_Number'],
  //       raw: true
  //     });
  //     const recordLocksOrderNumbers = recordLocks.map((lock: any) => lock.Lock_Number);
  //     const whereCondition: any = {
  //       Invoice_Number: { [Op.gt]: 0 }
  //     };
  //     if(recordLocksOrderNumbers.length > 0){
  //       whereCondition.Order_Number = {
  //         [Op.in]: recordLocksOrderNumbers
  //       };
  //     }else {
  //       return {
  //         totalCount: 0,

  //         totalPages: 0,
  //         orderList: [],
  //       };
  //     }

  //       whereCondition.Order_Deleted = false
  //       whereCondition.Picklist_Printed = false;
  //       whereCondition.Order_Updated = false;
  //       whereCondition.Order_Type = { [Op.ne]: 6 };
  //       whereCondition.Confirmed = false;
  //       whereCondition.Order_Date = {
  //         [Op.between]: [startDate, endDate]
  //       };

  //     // First, get the order headers with pagination
  //     const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
  //       attributes: [
  //         'Order_Number',
  //         'C_Number'
  //       ],
  //       where: whereCondition,
  //       include: [
  //         {
  //           model:OrderDetail,
  //           as: 'orderDetails',
  //           attributes: ['Order_Number', 'Quantity_Ordered'],
  //           required: true

  //         },
  //         {
  //           model: Customer,
  //           as: 'customer',
  //           attributes: ['C_Name'],
  //           required: false,
  //           include: [
  //             {
  //               model: CustomerRoute,
  //               as: 'Routes',
  //               attributes: ['Route_Number', 'Stop_Number'],
  //               required: false
  //             }
  //           ]

  //         }

  //       ],

  //       distinct: true,
  //       col: 'Order_Number',

  //       order: [['Order_Number', 'DESC']],

  //     });

  //     // Get the order numbers to fetch quantities

  //     // Get total quantities for these orders


  //     // Format the response


  //     return {
  //       totalCount,

  //       orderList: orderList,
  //     };

  //   }

  //   else if(currentStatus === 'orderConfirmation') {

  //     const whereCondition: any = {
  //       Invoice_Number: { [Op.gt]: 0 }

  //     };

  //     whereCondition.Order_Deleted = false
  //     whereCondition.Picklist_Printed = false;
  //     whereCondition.Order_Updated = false;
  //     whereCondition.Order_Type = { [Op.ne]: 6 };
  //     whereCondition.Confirmed = false;
  //     whereCondition.Order_Date = {
  //           [Op.between]: [startDate, endDate]
  //         };

  //     // First, get the order headers with pagination
  //     const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
  //       attributes: [
  //         'Order_Number',
  //         'C_Number',

  //       ],
  //       where: {
  //         ...whereCondition,

  //       },
  //       include: [

  //         {
  //           model:OrderDetail,
  //           as: 'orderDetails',
  //           attributes: ['Order_Number', 'Quantity_Ordered'],
  //           required: true

  //         },
  //         {
  //           model: Customer,
  //           as: 'customer',
  //           attributes: ['C_Name'],
  //           required: false,
  //           include: [
  //             {
  //               model: CustomerRoute,
  //               as: 'Routes',
  //               attributes: ['Route_Number', 'Stop_Number'],
  //               required: false
  //             }
  //           ]
  //         }
  //       ],
  //       distinct: true,
  //       col: 'Order_Number',
  //       order: [['Order_Number', 'DESC']],

  //     });

  //     return {
  //       totalCount,

  //       orderList: orderList,
  //     };

  //   }

  //   else {
  //   // Build where condition
  //   const whereCondition: any = {
  //     Invoice_Number: { [Op.gt]: 0 }

  //   };
  //   whereCondition.Order_Deleted = false
  //   whereCondition.Picklist_Printed = false;
  //   whereCondition.Order_Updated = false;
  //   whereCondition.Order_Type = { [Op.ne]: 6 };
  //   whereCondition.Confirmed = false;
  //   whereCondition.Order_Date = {
  //           [Op.between]: [startDate, endDate]
  //         };


  // if(currentStatus === 'non_invoices'){
  //     whereCondition.Invoice_Number = {
  //       [Op.eq]: 0
  //     };
  //   }else if(currentStatus === 'EpickStatusFromPicker'){
  //     whereCondition.EpickStatusFromPicker ='completed'
  //   }


  //   console.log('Final whereCondition for order confirmation--->', whereCondition);
  //   // First, get the order headers with pagination
  //   const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
  //     attributes: [
  //       'Order_Number',
  //       'C_Number'

  //     ],
  //     where: whereCondition,
  //     include: [
  //       {
  //         model: Customer,
  //         as: 'customer',
  //           attributes: ['C_Name'],
  //         required: false,
  //         include: [
  //           {
  //             model: CustomerRoute,
  //             as: 'Routes',
  //             attributes: ['Route_Number', 'Stop_Number'],
  //             required: false
  //           }
  //         ]
  //       },
  //       {
  //         model:OrderDetail,
  //         as: 'orderDetails',
  //         attributes: ['Order_Number', 'Quantity_Ordered'],
  //         required: true

  //       }
  //     ],
  //     distinct: true,
  //     col: 'Order_Number',

  //     order: [['Order_Number', 'DESC']],

  //   });

  //   // Get the order numbers to fetch quantities



  //   // Format the response


  //   return {
  //     totalCount,

  //     orderList: orderList,
  //   };
  // }
  // }
  async getOrderForPickListConfirmation(query: PaginationOptions) {

    console.log('query params --->', query);

    const currentStatus = query.currentStatus || 'all';
    const { startDate, endDate } = query;

    if (query.updated?.toString().toLowerCase() === 'true') {
      return [];
    }

    if (query.isDeleted?.toString().toLowerCase() === 'true') {
      return [];
    }

    const whereCondition: any = {
      Order_Deleted: false,
      Confirmed: false,
      Picklist_Printed: false,
      Order_Updated: false,
      Order_Type: { [Op.ne]: 6 },
    };

    if (startDate && endDate) {
      whereCondition.Order_Date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (currentStatus === 'all') {

      whereCondition.Invoice_Number = { [Op.lte]: 0 };

      const orderList = await OrderHeader.findAll({
        attributes: ['Order_Number', 'C_Number'],
        where: whereCondition,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['C_Name'],
            required: false,
          }
        ],
        order: [['Order_Number', 'DESC']],
      });

      return {
        totalCount: orderList.length,
        orderList: orderList
      };
    }


    if (currentStatus === 'recordLocks') {

      const recordLocks = await Record_Locks.findAll({
        where: { Lock_Type: 0 },
        attributes: ['Lock_Number'],
        raw: true
      });

      const recordLocksOrderNumbers = recordLocks.map((lock: any) => lock.Lock_Number);

      if (!recordLocksOrderNumbers.length) {
        return {
          totalCount: 0,
          orderList: [],
        };
      }

      whereCondition.Invoice_Number = { [Op.gt]: 0 };
      whereCondition.Order_Number = { [Op.in]: recordLocksOrderNumbers };

      const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
        attributes: ['Order_Number', 'C_Number'],
        where: whereCondition,
        include: [
          {
            model: OrderDetail,
            as: 'orderDetails',
            attributes: ['Order_Number', 'Quantity_Ordered'],
            required: true
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['C_Name'],
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
        distinct: true,
        col: 'Order_Number',
        order: [['Order_Number', 'DESC']],
      });

      return { totalCount, orderList };
    }

    if (currentStatus === 'orderConfirmation') {

      whereCondition.Invoice_Number = { [Op.gt]: 0 };

      const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
        attributes: ['Order_Number', 'C_Number'],
        where: whereCondition,
        include: [
          {
            model: OrderDetail,
            as: 'orderDetails',
            attributes: ['Order_Number', 'Quantity_Ordered'],
            required: true
          },
          {
            model: Customer,
            as: 'customer',
            attributes: ['C_Name'],
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
        distinct: true,
        col: 'Order_Number',
        order: [['Order_Number', 'DESC']],
      });

      return { totalCount, orderList };
    }


    if (currentStatus === 'non_invoices') {
      whereCondition.Invoice_Number = { [Op.eq]: 0 };
    } else {
      whereCondition.Invoice_Number = { [Op.gt]: 0 };
    }

    if (currentStatus === 'EpickStatusFromPicker') {
      whereCondition.EpickStatusFromPicker = 'completed';
    }

    const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
      attributes: ['Order_Number', 'C_Number'],
      where: whereCondition,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Name'],
          required: false,
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false
            }
          ]
        },
        {
          model: OrderDetail,
          as: 'orderDetails',
          attributes: ['Order_Number', 'Quantity_Ordered'],
          required: true
        }
      ],
      distinct: true,
      col: 'Order_Number',
      order: [['Order_Number', 'DESC']],
    });

    return { totalCount, orderList };
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
        'Picklist_Printed',
        'Invoice_Total',
        'Invoice_Number',
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
      const otpState = toNum(d.OTP_Amount_State);
      const prepaid = toNum(d.PrepaidTax_Amount);
      const qty = toNum(d.Quantity_Shipped); // or fallback below

      const quantity = qty > 0 ? qty : toNum(d.Quantity_Ordered);

      const unitPrice = basePrice + otpState + prepaid;

      totalPrice += unitPrice * quantity;
      totalPrepaidTax += prepaid * quantity;

      totalDiscount += toNum(d.OffInvoice_Amount);   // multiply by qty only if this is per-unit
      totalDeposit += toNum(d.DepositAmount);       // multiply by qty only if this is per-unit
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

  async getNewItemsManualSetting() {
    let row = await NewItemsSetting.findOne({ order: [['id', 'ASC']] });
    if (!row) {
      row = await NewItemsSetting.create({
        showManually: false,
        items: [],
        startDate: null,
        endDate: null,
        isActive: true,
      });
    }
    return row;
  }

  async updateNewItemsManualSetting(body: IManualItemsSetting) {
    const startDate = parseManualSettingDate(body.startDate);
    const endDate = parseManualSettingDate(body.endDate);
    let row = await NewItemsSetting.findOne({ order: [['id', 'ASC']] });
    if (!row) {
      return await NewItemsSetting.create({
        showManually: body.showManually,
        items: body.items ?? [],
        startDate,
        endDate,
        isActive: body.isActive,
      });
    }
    await row.update({
      showManually: body.showManually,
      items: body.items ?? [],
      startDate,
      endDate,
      isActive: body.isActive,
    });
    return row;
  }

  async getPopularItemsModeSetting() {
    let row = await PopularItemsModeSetting.findOne({ order: [['id', 'ASC']] });
    if (!row) {
      row = await PopularItemsModeSetting.create({
        mode: 'mostSale',
        manualItems: [],
        startDate: null,
        endDate: null,
        isActive: true,
      });
    }
    return row;
  }

  async updatePopularItemsModeSetting(body: IPopularItemsModeSetting) {
    const startDate = parseManualSettingDate(body.startDate);
    const endDate = parseManualSettingDate(body.endDate);
    let row = await PopularItemsModeSetting.findOne({ order: [['id', 'ASC']] });
    if (!row) {
      return await PopularItemsModeSetting.create({
        mode: body.mode,
        manualItems: body.manualItems ?? [],
        startDate,
        endDate,
        isActive: body.isActive,
      });
    }
    await row.update({
      mode: body.mode,
      manualItems: body.manualItems ?? [],
      startDate,
      endDate,
      isActive: body.isActive,
    });
    return row;
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
      metadata: body.metadata ?? null,
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
    console.log(body, 'tetetetetetetetetet')
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


  async getCustomerOrderByCalenderDate(body: any) {
    let { orderDate, orderDay, page = 1, limit = 10, routeNumber, salesRepNumber } = body;
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

    if (salesRepNumber && salesRepNumber.length > 0) {
      customerWhere.C_Salesman = { [Op.in]: salesRepNumber };
    }

    const routeWhere: any = {};
    if (routeNumber && routeNumber.length > 0) {
      routeWhere.Route_Number = { [Op.in]: routeNumber };
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

  async getCustomerTotalOrderByCustomer(body: any) {
    const { orderDate, orderDay, salesRepNumber, routeNumber } = body;

    const dayNum = Number(orderDay);
    if (Number.isNaN(dayNum)) throw new AppError("Invalid orderDay", 400);

    const normalizedDate = String(orderDate).slice(0, 10); // 'YYYY-MM-DD'

    // --- Build filters ---
    const customerWhere: any = {
      C_Inactive: false,
      C_OrderDay: dayNum,
    };

    if (salesRepNumber && salesRepNumber.length > 0) {
      customerWhere.C_Salesman = { [Op.in]: salesRepNumber };
    }

    const routeWhere: any = {};
    if (routeNumber && routeNumber.length > 0) {
      routeWhere.Route_Number = { [Op.in]: routeNumber };
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

    const nextDate = moment(normalizedDate).add(1, 'day').format('YYYY-MM-DD');

    // 2️⃣ Orders for those customers on that date
    const orders = await OrderHeader.findAll({
      where: {
        C_Number: { [Op.in]: customerNumbers },
        Order_Date: {
          [Op.gte]: normalizedDate,
          [Op.lt]: nextDate,
        },
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
      customerOrder: orders?.length || 0,
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

  // EmailModules CRUD service methods
  async createEmailModule(data: { name: string; isEmailSetup?: boolean }) {
    const emailModule = await EmailModule.create({
      name: data.name,
      isEmailSetup: data.isEmailSetup ?? false,
    });
    return emailModule;
  }

  async getEmailModuleById(id: number) {
    const emailModule = await EmailModule.findByPk(id, {
      include: [
        {
          model: EmailModuleConfig,
          as: 'configs',
          required: false,
          where: { isActive: true },
          order: [['createdAt', 'DESC']],
          limit: 1,
        },
      ],
    });
    if (!emailModule) {
      throw new AppError('Email module not found', 404);
    }

    // Transform the data to include configuration status and config data
    const moduleData: any = emailModule.toJSON();
    const hasConfig = moduleData.configs && moduleData.configs.length > 0;

    return {
      ...moduleData,
      configuration: hasConfig,
      emailModuleConfig: hasConfig ? moduleData.configs[0] : null,
      configs: undefined, // Remove the configs array from response
    };
  }

  async getAllEmailModules(query: PaginationOptions & { search?: string }) {
    const { page = 1, limit = 10, search = '' } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await EmailModule.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: EmailModuleConfig,
          as: 'configs',
          required: false,
          where: { isActive: true },
          order: [['createdAt', 'DESC']],
          limit: 1,
        },
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
    });

    // Transform the data to include configuration status and config data
    const transformedData = rows.map((module) => {
      const moduleData: any = module.toJSON();
      const hasConfig = moduleData.configs && moduleData.configs.length > 0;

      return {
        ...moduleData,
        configuration: hasConfig,
        emailModuleConfig: hasConfig ? moduleData.configs[0] : null,
        configs: undefined, // Remove the configs array from response
      };
    });

    return {
      data: transformedData,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  async updateEmailModule(id: number, data: { name?: string; isEmailSetup?: boolean }) {
    const emailModule = await EmailModule.findByPk(id);
    if (!emailModule) {
      throw new AppError('Email module not found', 404);
    }

    await emailModule.update(data);
    return emailModule;
  }

  async deleteEmailModule(id: number) {
    const emailModule = await EmailModule.findByPk(id);
    if (!emailModule) {
      throw new AppError('Email module not found', 404);
    }

    await emailModule.destroy();
    return { message: 'Email module deleted successfully' };
  }

  // EmailModuleConfig CRUD service methods
  async createEmailModuleConfig(data: {
    emailModuleId: number;
    host: string;
    port: number;
    username: string;
    secure?: boolean;
    password: string;
    fromEmail: string;
    fromName?: string | null;
    isActive?: boolean;
  }) {
    // Verify that the emailModuleId exists
    const emailModule = await EmailModule.findByPk(data.emailModuleId);
    if (!emailModule) {
      throw new AppError('Email module not found', 404);
    }

    const emailModuleConfig = await EmailModuleConfig.create({
      emailModuleId: data.emailModuleId,
      host: data.host,
      port: data.port,
      username: data.username,
      secure: data.secure ?? false,
      password: data.password,
      fromEmail: data.fromEmail,
      fromName: data.fromName ?? null,
      isActive: data.isActive ?? true,
    });
    emailModule.update({ isEmailSetup: true });
    return emailModuleConfig;
  }

  async getEmailModuleConfigById(id: number) {
    const emailModuleConfig = await EmailModuleConfig.findByPk(id, {
      include: [
        {
          model: EmailModule,
          as: 'emailModule',
          attributes: ['id', 'name', 'isEmailSetup'],
        },
      ],
    });
    if (!emailModuleConfig) {
      throw new AppError('Email module config not found', 404);
    }
    return emailModuleConfig;
  }

  async getAllEmailModuleConfigs(query: PaginationOptions & {
    search?: string;
    emailModuleId?: number;
    isActive?: boolean
  }) {
    const { page = 1, limit = 10, search = '', emailModuleId, isActive } = query;
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

    if (emailModuleId) {
      whereClause.emailModuleId = emailModuleId;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    const { count, rows } = await EmailModuleConfig.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: EmailModule,
          as: 'emailModule',
          attributes: ['id', 'name', 'isEmailSetup'],
        },
      ],
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

  async updateEmailModuleConfig(
    id: number,
    data: {
      emailModuleId?: number;
      host?: string;
      port?: number;
      username?: string;
      secure?: boolean;
      password?: string;
      fromEmail?: string;
      fromName?: string | null;
      isActive?: boolean;
    }
  ) {
    const emailModuleConfig = await EmailModuleConfig.findByPk(id);
    if (!emailModuleConfig) {
      throw new AppError('Email module config not found', 404);
    }

    // If emailModuleId is being updated, verify it exists
    if (data.emailModuleId) {
      const emailModule = await EmailModule.findByPk(data.emailModuleId);
      if (!emailModule) {
        throw new AppError('Email module not found', 404);
      }
    }

    await emailModuleConfig.update(data);
    return emailModuleConfig;
  }

  async deleteEmailModuleConfig(id: number) {
    const emailModuleConfig = await EmailModuleConfig.findByPk(id);
    if (!emailModuleConfig) {
      throw new AppError('Email module config not found', 404);
    }

    await emailModuleConfig.destroy();
    return { message: 'Email module config deleted successfully' };
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

  async testEmail(data: any) {
    const { to, subject, html, emailConfig, attachments, cc } = data;
    const result = await sendTestEmail(to, subject, html, attachments, cc, emailConfig);
    return result;
  }

  async testEmailMarketing(data: any) {
    const { to, subject, html, attachments, cc } = data;
    const result = await sendEmailMarketing({ to, subject, html, attachments, cc });
    return result;
  }

  // Email Marketing CRUD service methods
  async createEmailMarketing(data: any) {

    const checkEmailModule = await EmailModule.findOne({ where: { name: 'email_marketing' } });
    if (!checkEmailModule) {
      throw new AppError('Email module not found', 404);
    }
    if (!checkEmailModule.isEmailSetup) {
      throw new AppError('Email module is not setup, please setup the email module first', 400);
    }


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

      // Set status to 'queued' when emails are being queued
      const emailMarketing = await EmailMarketing.create({
        ...data,
        status: 'sent',
      });

      const jobs: any[] = to.map((u: any) => ({
        to: u.toLowerCase(),      // adapt to your structure
        subject,
        html: body,
        cc,
        attachments,
        id: emailMarketing.id
      }));

      // Add jobs to notification queue
      try {
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
        console.log(`✅ Queued ${jobs.length} email jobs for campaign ${emailMarketing.id}`);
      } catch (queueError: any) {
        console.error('❌ Failed to queue emails:', queueError);
        // Update status to failed if queueing fails
        await emailMarketing.update({ status: 'failed' });
        throw new AppError('Failed to queue emails: ' + queueError.message, 500);
      }

      // RESPONSE IS FAST – server not blocked.
      return {
        message: 'Notification emails queued successfully',
        queuedCount: jobs.length,
        campaignId: emailMarketing.id,
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
  async createEpickSetting(body: { pin: string; allowSingleScan: boolean; capOrderQtyByInventory?: boolean }) {
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

  async updateEpickSetting(id: number, body: { pin?: string; allowSingleScan?: boolean; capOrderQtyByInventory?: boolean }) {
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

    console.log(data, 'data----->');
    const { documents, address, files, ...customerData } = data;

    // Coerce string values from multipart form to proper types
    const booleanFields = [
      'NetCost_Flag', 'C_CaseDiscount', 'C_AuthorizedOnly', 'C_CashCustomer',
      'Finance_Charge', 'C_Inactive', 'Delivery_Charge', 'No_Substitutes',
      'Service_Charge', 'POS_CashC', 'POS_CheckC', 'POS_CreditC',
      'POS_DebitC', 'POS_OtherC', 'POS_HouseC'
    ];
    for (const field of booleanFields) {
      if (field in customerData) {
        const val = customerData[field];
        customerData[field] = val === true || val === 1 || val === '1' || val === 'true';
      }
    }

    const numericFields = [
      'C_OperationHours1', 'C_OperationHours2', 'C_OrderDaySequence',
      'Credit_Limit', 'Delivery_Amount', 'Delivery_Charge', 'Service_Charge',
      'Other_Amount', 'C_Salesman', 'TermsCode', 'EDI_Format',
      'C_StatusCode', 'C_InvoiceFormat', 'C_PricingAccount', 'Delivery_ID',
      'C_OrderDay', 'Address_Type', 'PriceLevel_Default',
      'Category_Allow01', 'Category_Allow02', 'Category_Allow03',
      'Category_Allow04', 'Category_Allow05', 'Category_Allow06',
      'Category_Allow07', 'Category_Allow08', 'Category_Allow09',
      'Category_Allow10', 'Category_Allow11', 'Category_Allow12',
    ];
    for (const field of numericFields) {
      if (field in customerData) {
        customerData[field] = Number(customerData[field]);
      }
    }

    const nextCustomerNumber = await getNextCustomerNumber();

    const finalData = {
      ...getDefaultCustomerValues(0),
      C_Number: nextCustomerNumber,
      ...customerData
    }
    const customer = await Customer.create(finalData);

    // Upload files to Azure and build documents object
    const documentsData: any = {};
    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const uploaded = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'retailer-documents');
        if (uploaded?.url) {
          if (file.fieldname.includes('salesTaxDoc')) {
            documentsData.salesTaxDoc = uploaded.url;
          } else if (file.fieldname.includes('CigTaxDoc')) {
            documentsData.CigTaxDoc = uploaded.url;
          } else if (file.fieldname.includes('feinDocument')) {
            documentsData.feinDocument = uploaded.url;
          } else if (file.fieldname.includes('licenseAttachments')) {
            if (!documentsData.licenseAttachments) documentsData.licenseAttachments = [];
            documentsData.licenseAttachments.push(uploaded.url);
          } else if (file.fieldname.includes('attachments')) {
            if (!documentsData.attachments) documentsData.attachments = [];
            documentsData.attachments.push(uploaded.url);
          }
        }
      }
    }

    // Merge file URLs with any document data from JSON body
    const finalDocuments = { ...documents, ...documentsData };
    if (Object.keys(finalDocuments).length > 0) {
      await RetailerDocuments.create({
        customerNumber: nextCustomerNumber,
        ...finalDocuments
      });
    }
    if (address) {
      await RetailerLocation.create({
        C_Number: nextCustomerNumber,
        ...address
      });
    }
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

    const { documents, address, files, ...customerData } = data;

    // Coerce string values from multipart form to proper types
    const booleanFields = [
      'NetCost_Flag', 'C_CaseDiscount', 'C_AuthorizedOnly', 'C_CashCustomer',
      'Finance_Charge', 'C_Inactive', 'Delivery_Charge', 'No_Substitutes',
      'Service_Charge', 'POS_CashC', 'POS_CheckC', 'POS_CreditC',
      'POS_DebitC', 'POS_OtherC', 'POS_HouseC'
    ];
    for (const field of booleanFields) {
      if (field in customerData) {
        const val = customerData[field];
        customerData[field] = val === true || val === 1 || val === '1' || val === 'true';
      }
    }

    const numericFields = [
      'C_OperationHours1', 'C_OperationHours2', 'C_OrderDaySequence',
      'Credit_Limit', 'Delivery_Amount', 'Delivery_Charge', 'Service_Charge',
      'Other_Amount', 'C_Salesman', 'TermsCode', 'EDI_Format',
      'C_StatusCode', 'C_InvoiceFormat', 'C_PricingAccount', 'Delivery_ID',
      'C_OrderDay', 'Address_Type', 'PriceLevel_Default',
      'Category_Allow01', 'Category_Allow02', 'Category_Allow03',
      'Category_Allow04', 'Category_Allow05', 'Category_Allow06',
      'Category_Allow07', 'Category_Allow08', 'Category_Allow09',
      'Category_Allow10', 'Category_Allow11', 'Category_Allow12',
    ];
    for (const field of numericFields) {
      if (field in customerData) {
        customerData[field] = Number(customerData[field]);
      }
    }

    const customer = await Customer.update(customerData, { where: { C_Number: id } });

    // Upload files to Azure and build documents object
    const documentsData: any = {};
    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const uploaded = await uploadFileToAzure(file.buffer, file.originalname, file.mimetype, 'retailer-documents');
        if (uploaded?.url) {
          if (file.fieldname.includes('salesTaxDoc')) {
            documentsData.salesTaxDoc = uploaded.url;
          } else if (file.fieldname.includes('CigTaxDoc')) {
            documentsData.CigTaxDoc = uploaded.url;
          } else if (file.fieldname.includes('feinDocument')) {
            documentsData.feinDocument = uploaded.url;
          } else if (file.fieldname.includes('licenseAttachments')) {
            if (!documentsData.licenseAttachments) documentsData.licenseAttachments = [];
            documentsData.licenseAttachments.push(uploaded.url);
          } else if (file.fieldname.includes('attachments')) {
            if (!documentsData.attachments) documentsData.attachments = [];
            documentsData.attachments.push(uploaded.url);
          }
        }
      }
    }

    const finalDocuments = { ...documents, ...documentsData };
    if (Object.keys(finalDocuments).length > 0) {
      const retailerDocuments = await RetailerDocuments.findOne({ where: { customerNumber: id } });
      if (retailerDocuments) {
        await RetailerDocuments.update(finalDocuments, { where: { customerNumber: id } });
      } else {
        await RetailerDocuments.create({
          customerNumber: id,
          ...finalDocuments
        });
      }
    }

    if (address) {
      const retailerLocation = await RetailerLocation.findOne({ where: { C_Number: id } });
      if (retailerLocation) {
        await RetailerLocation.update({
          ...address
        }, { where: { C_Number: id } });
      } else {
        await RetailerLocation.create({
          C_Number: id,
          ...address
        });
      }
    }
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
    const customer: any = await Customer.findOne({ where: { C_Number: id } });
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    const retailerDocuments = await RetailerDocuments.findOne({ where: { customerNumber: id } });
    if (retailerDocuments) {
      customer.dataValues.retailerDocuments = retailerDocuments;
    }
    const retailerLocation = await RetailerLocation.findOne({ where: { C_Number: id } });
    if (retailerLocation) {
      customer.dataValues.retailerLocation = retailerLocation;
    }
    return customer;
  }

  async bulkUpdateInventory(updateData: any, userId: number) {



    console.log(userId, 'userId');

    let userIdValue = 0;
    if (userId) {

      const user = await WebUsers.findOne({ where: { id: userId }, attributes: ['userNumber'] });
      if (user) {
        userIdValue = user.userNumber ? parseInt(user.userNumber) : 0;
      }
    }

    const { field, data, excludeItem, hasBulkUpdate, singleUpdateData } = updateData;
    console.log(hasBulkUpdate, 'hasBulkUpdate');

    if (hasBulkUpdate) {
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

      if (hasPriceChange(data)) {
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
    let { salesCategoryId, priceClassId, filter, search } = query;

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

    const hashedPassword = await hashPassword(body.password);

    body.password = hashedPassword;

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

  // Vehicle CRUD methods
  async createVehicle(body: any) {
    // Check if VIN number already exists (if provided)
    if (body.vinNumber) {
      const existingVehicle = await Vehicle.findOne({
        where: { vinNumber: body.vinNumber }
      });

      if (existingVehicle) {
        throw new AppError('Vehicle with this VIN number already exists', 400);
      }
    }

    // Check if license registration number already exists (if provided)
    if (body.licenseRegistrationNumber) {
      const existingVehicle = await Vehicle.findOne({
        where: { licenseRegistrationNumber: body.licenseRegistrationNumber }
      });

      if (existingVehicle) {
        throw new AppError('Vehicle with this license registration number already exists', 400);
      }
    }

    const vehicle = await Vehicle.create(body);
    return vehicle;
  }

  async getVehicleById(id: number) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }
    return vehicle;
  }

  async getAllVehicles(query: PaginationOptions & { search?: string; isActive?: boolean }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition: any = {};

    if (search) {
      whereCondition[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { truckType: { [Op.iLike]: `%${search}%` } },
        { licenseRegistrationNumber: { [Op.iLike]: `%${search}%` } },
        { vinNumber: { [Op.iLike]: `%${search}%` } },
        { insurancePolicyNumber: { [Op.iLike]: `%${search}%` } },
        { insuranceCarrier: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (query.isActive !== undefined) {
      whereCondition.isActive = query.isActive === true || (typeof query.isActive === 'string' && query.isActive === 'true');
    }

    const { count: totalCount, rows: vehicles } = await Vehicle.findAndCountAll({
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
      vehicles,
    };
  }


  async updateVehicle(id: number, body: any) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    // Check if VIN number is being updated and if it already exists
    if (body.vinNumber && body.vinNumber !== vehicle.vinNumber) {
      const existingVehicle = await Vehicle.findOne({
        where: { vinNumber: body.vinNumber }
      });

      if (existingVehicle) {
        throw new AppError('Vehicle with this VIN number already exists', 400);
      }
    }

    // Check if license registration number is being updated and if it already exists
    if (body.licenseRegistrationNumber && body.licenseRegistrationNumber !== vehicle.licenseRegistrationNumber) {
      const existingVehicle = await Vehicle.findOne({
        where: { licenseRegistrationNumber: body.licenseRegistrationNumber }
      });

      if (existingVehicle) {
        throw new AppError('Vehicle with this license registration number already exists', 400);
      }
    }

    await vehicle.update(body);
    return vehicle;
  }

  async deleteVehicle(id: number) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    await vehicle.destroy();
    return { message: 'Vehicle deleted successfully' };
  }







  async getAllOrderNumbers() {
    const orderNumbers = await OrderHeader.findAll({
      attributes: ['Order_Number'],
      where: { Picklist_Printed: false, Confirmed: false, Order_Deleted: false, Order_Updated: false, Order_Type: { [Op.ne]: 6 }, Invoice_Number: { [Op.lte]: 0 } },
      order: [['Order_Number', 'DESC']]
    });
    return orderNumbers;
  }

  async getAllOrderNumbersByCustomer(body: any) {
    const { customerId } = body
    let orderNumbers: any
    if (customerId.length === 0) {
      orderNumbers = await OrderHeader.findAll({
        attributes: ['Order_Number'],
        order: [['Order_Number', 'DESC']]
      });
    } else {
      orderNumbers = await OrderHeader.findAll({
        where: { C_Number: { [Op.in]: customerId } },
        attributes: ['Order_Number'],
        order: [['Order_Number', 'DESC']]
      });
    }


    return {
      totalCount: orderNumbers.length,
      orderNumbers
    };
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
    await OrderHeader.update({ Picklist_Printed: true, Picklist_Time: formatted }, { where: { Order_Number: orderNumber } });
    return { message: "Picklist printed successfully" };
  }

  async makeBulkPickListPrinted(orderNumbers: number[]) {
    const now = new Date();
    const formatted =
      now.toISOString().slice(0, 19).replace("T", " "); // 
    await OrderHeader.update({ Picklist_Printed: true, Picklist_Time: formatted }, { where: { Order_Number: { [Op.in]: orderNumbers } } });
    return { message: "Bulk picklist printed successfully" };
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
        where: { itemNumber: futurePricingData.itemNumber, isApplied: false }
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

  // RetailerLocation CRUD methods
  async createRetailerLocation(body: {
    C_Number: number;
    lat?: number | null;
    long?: number | null;
    City?: string | null;
    Country?: string | null;
    Address?: string | null;
    State?: string | null;
    Zip?: string | null;
  }) {
    const retailerLocation = await RetailerLocation.create(body);
    return retailerLocation;
  }

  async getRetailerLocationById(id: number) {
    const retailerLocation = await RetailerLocation.findByPk(id);

    if (!retailerLocation) {
      throw new AppError(Manager.RETAILER_LOCATION_NOT_FOUND, 404);
    }

    return retailerLocation;
  }

  async getAllRetailerLocations(query: PaginationOptions & {
    search?: string;
    C_Number?: number;
  }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition: any = {};

    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum)) {
        whereCondition.C_Number = searchNum;
      } else {
        whereCondition[Op.or] = [
          { City: { [Op.like]: `%${search}%` } },
          { Country: { [Op.like]: `%${search}%` } },
          { Address: { [Op.like]: `%${search}%` } },
          { State: { [Op.like]: `%${search}%` } },
        ];
      }
    }

    if (query.C_Number) {
      whereCondition.C_Number = query.C_Number;
    }

    const { count: totalCount, rows: retailerLocations } = await RetailerLocation.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    });

    return {
      totalCount,
      page,
      limit,
      retailerLocations,
    };
  }

  async updateRetailerLocation(id: number, body: Partial<{
    C_Number: number;
    lat: number | null;
    long: number | null;
    City: string | null;
    Country: string | null;
    Address: string | null;
    State: string | null;
    Zip: string | null;
  }>) {
    const retailerLocation = await RetailerLocation.findByPk(id);

    if (!retailerLocation) {
      throw new AppError(Manager.RETAILER_LOCATION_NOT_FOUND, 404);
    }

    await retailerLocation.update(body);
    return retailerLocation;
  }

  async deleteRetailerLocation(id: number) {
    const retailerLocation = await RetailerLocation.findByPk(id);

    if (!retailerLocation) {
      throw new AppError(Manager.RETAILER_LOCATION_NOT_FOUND, 404);
    }

    await retailerLocation.destroy();
    return { success: true, message: 'Retailer location deleted successfully' };
  }

  async getInventoryItemGroups() {
    const inventoryItemGroup = Inventory_ItemGroups.findAll({
      attributes: [
        'Item_GroupID', 'Item_GroupDescription'
      ]
    })

    return inventoryItemGroup
  }

  async createInventoryItemGroup(body: any) {
    // const inventoryItemGroup = await Inventory_ItemGroups.create(body);
    const exists = await Inventory_ItemGroups.findOne({
      where: {
        Item_GroupDescription: body.Item_GroupDescription
      }
    });

    if (exists) {
      throw new AppError(
        'Item_GroupDescription already exists',
        409
      );
    }
    return Inventory_ItemGroups.create(body);
  }

  async updateInventoryItemGroup(id: number, body: any) {
    const inventoryItemGroup = await Inventory_ItemGroups.findByPk(id);
    if (!inventoryItemGroup) {
      throw new AppError('Inventory Item Group not found', 404);
    }

    // Check if Item_GroupDescription is already used
    const existingGroup = await Inventory_ItemGroups.findOne({
      where: {
        Item_GroupDescription: body.Item_GroupDescription,
        Item_GroupID: { [Op.ne]: id } // Exclude the current item being updated
      }
    });
    if (existingGroup) {
      throw new AppError('Item_GroupDescription is already in use', 400);
    }

    await inventoryItemGroup.update(body);
    return inventoryItemGroup;
  }


  async getinventorybrands() {
    const inventoryBrand = InventoryBrands.findAll({
      attributes: [
        'Brand_ID', 'Brand_Family', 'Brand_ReceivedStamped', 'Brand_PM_Status'
      ]
    })

    return inventoryBrand
  }

  async createInventoryBrand(body: any) {
    const brand_Id = await getNextInventoryBrand();
    body.Brand_ID = brand_Id;
    const inventoryBrand = await InventoryBrands.create(body);
    console.log(inventoryBrand, 'inventoryBrand');
    return inventoryBrand;
  }

  async updateInventoryBrand(id: number, body: any) {
    const inventoryBrand = await InventoryBrands.findByPk(id);
    if (!inventoryBrand) {
      throw new AppError('Inventory Brand not found', 404);
    }

    await inventoryBrand.update(body);
    return inventoryBrand;
  }

  async getPriceClass() {
    const priceClass = PriceClass.findAll({
      attributes: [
        'Price_Class', 'Class_Desc', 'MSA_Default', 'Rebate_Amount', 'SelectionVisible', 'Allow_Price_Change', 'Allow_Price_Change_Remote', 'Sales_Category_Group', 'Product_ExpDays'
      ]
    })
    return priceClass
  }

  async updatePriceClass(id: number, body: any) {
    const priceClass = await PriceClass.findByPk(id);
    if (!priceClass) {
      throw new AppError('Price Class not found', 404);
    }
    await priceClass.update(body);
    return priceClass;
  }

  // async getLossQuantityReport(
  //     filters: CommonReportFilters & {
  //       groupBy: 'customer' | 'item' | 'order' | 'date';
  //     }
  //   ) {
  //     const { inventoryWhere, orderHeaderWhere, customerWhere } =
  //       buildItemFilters(filters);

  //     // Mandatory condition
  //     orderHeaderWhere.Invoice_Total = { [Op.gt]: 0 };

  //     /** BASE ATTRIBUTES (PER ORDER PER ITEM) */
  //     let attributes: any[] = [
  //       'Item_Number',
  //       'Order_Number',

  //       [col('inventory.Description'), 'Description'],
  //       [col('inventory.Pack'), 'Pack'],

  //       [fn('SUM', col('Quantity_Ordered')), 'Quantity_Ordered'],
  //       [fn('SUM', col('Quantity_Shipped')), 'Quantity_Shipped'],
  //       [
  //         fn(
  //           'SUM',
  //           literal('(OrderDetail.Quantity_Ordered - OrderDetail.Quantity_Shipped)')
  //         ),
  //         'Loss_Qty',
  //       ],

  //       [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
  //       [col('orderHeader.C_Number'), 'C_Number'],
  //       [col('orderHeader.customer.C_Name'), 'C_Name'],
  //     ];

  //     /** BASE GROUP BY */
  //     let group: string[] = [
  //       'OrderDetail.Item_Number',
  //       'OrderDetail.Order_Number',

  //       'inventory.Item_Number',
  //       'inventory.Description',
  //       'inventory.Pack',

  //       'orderHeader.Invoice_Date',
  //       'orderHeader.C_Number',
  //       'orderHeader.customer.C_Name',
  //     ];

  //     if (filters.groupBy === 'date') {
  //       attributes = [
  //         'Item_Number',
  //         'Order_Number',

  //         [col('inventory.Description'), 'Description'],

  //         [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
  //         [col('orderHeader.C_Number'), 'C_Number'],
  //         [col('orderHeader.customer.C_Name'), 'C_Name'],

  //         [fn('SUM', col('Quantity_Shipped')), 'Quantity_Shipped'],
  //         [fn('SUM', col('Quantity_Ordered')), 'Quantity_Ordered'],
  //         [
  //           fn(
  //             'SUM',
  //             literal('(OrderDetail.Quantity_Ordered - OrderDetail.Quantity_Shipped)')
  //           ),
  //           'Loss_Qty',
  //         ],

  //         // ✅ aggregate unit values
  //         [fn('AVG', col('OrderDetail.Price')), 'Price'],
  //         [fn('AVG', col('OrderDetail.OTP_Amount_State')), 'OTP_Amount_State'],
  //         [fn('AVG', col('OrderDetail.AvgCost')), 'AvgCost'],
  //         [
  //           fn('dbo.getInventoryOnHand', col('OrderDetail.Item_Number')),
  //           'On_Hand',
  //         ]
  //       ];

  //       group = [
  //         'OrderDetail.Item_Number',
  //         'OrderDetail.Order_Number',

  //         'inventory.Description',

  //         'orderHeader.Invoice_Date',
  //         'orderHeader.C_Number',
  //         'orderHeader.customer.C_Name',
  //       ];
  //     }


  //     const result = await OrderDetail.findAll({
  //       attributes,

  //       where: {
  //         Quantity_Ordered: { [Op.gt]: col('Quantity_Shipped') },
  //       },

  //       include: [
  //         {
  //           model: OrderHeader,
  //           as: 'orderHeader',
  //           attributes: [],
  //           where: orderHeaderWhere,
  //           include: [
  //             {
  //               model: Customer,
  //               as: 'customer',
  //               attributes: [],
  //               where: customerWhere,
  //               required: Object.keys(customerWhere).length > 0,
  //             },
  //           ],
  //         },
  //         {
  //           model: Inventory,
  //           as: 'inventory',
  //           attributes: [],
  //           where: inventoryWhere,
  //           required: Object.keys(inventoryWhere).length > 0,
  //         },
  //       ],

  //       group,
  //       order: [[literal('Loss_Qty'), 'DESC']],
  //       subQuery: false,
  //     });

  //     const rows = result.map(r => r.get({ plain: true }));

  //     if (filters.groupBy === 'customer') {
  //       return formatCustomerItemBreakdown(rows);
  //     }

  //     if (filters.groupBy === 'item') {
  //       return formatItemOrderBreakdown(rows);
  //     }

  //     if (filters.groupBy === 'date') {
  //       return formatDateItemBreakdown(rows)
  //     }

  //     if (filters.groupBy === 'order') {
  //       return formatItemOrderBreakdown(rows)
  //     }
  //     // order & date both return flat rows
  //     return rows;
  //   }



  // async getVelocityReportCustomerGroup(
  //     filters: CommonReportFilters ) {
  //     /**
  //      * 1️⃣ Common filters
  //      */
  //     const { inventoryWhere, orderHeaderWhere, customerWhere } =
  //       buildItemFilters(filters);

  //     /**
  //      * 2️⃣ Mandatory condition
  //      */
  //     orderHeaderWhere.Invoice_Total = { [Op.gt]: 0 };

  //     /**
  //      * 3️⃣ BASE ATTRIBUTES (detail-level fields)
  //      */
  //     const attributes: any[] = [
  //       // OrderDetail
  //       'Item_Number',
  //       'Order_Number',
  //       'Quantity_Shipped',
  //       'Price',
  //       'AvgCost',
  //       'OTP_Amount_State',

  //       // Inventory
  //       [col('inventory.Description'), 'Description'],
  //       [col('inventory.Pack'), 'Pack'],
  //       [col('inventory.UOM'), 'UOM'],

  //       // OrderHeader
  //       [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
  //       [col('orderHeader.C_Number'), 'C_Number'],

  //       // Customer
  //       [col('orderHeader.customer.C_Name'), 'C_Name'],
  //       [col('orderHeader.customer.C_Address'), 'C_Address'],
  //       [col('orderHeader.customer.C_City'), 'C_City'],
  //       [col('orderHeader.customer.C_State'), 'C_State'],
  //       [col('orderHeader.customer.C_Zip'), 'C_Zip'],
  //       [col('orderHeader.customer.C_Phone'), 'C_Phone'],

  //       /**
  //        * ✅ EXT_Price and Profit calculation
  //        */
  //       [
  //         literal('OrderDetail.Price + OrderDetail.OTP_Amount_State'),
  //         'Price',
  //       ],
  //       [
  //         literal('OrderDetail.AvgCost + OrderDetail.OTP_Amount_State'),
  //         'AvgCost',
  //       ],
  //       [
  //         literal('(OrderDetail.Price+ OrderDetail.OTP_Amount_State) * OrderDetail.Quantity_Shipped'),
  //         'Ext_Price',
  //       ],
  //       [
  //         literal('(OrderDetail.AvgCost + OrderDetail.OTP_Amount_State) * OrderDetail.Quantity_Shipped'),
  //         'Ext_Cost',
  //       ],
  //       [
  //         literal('((OrderDetail.Price+ OrderDetail.OTP_Amount_State) * OrderDetail.Quantity_Shipped) - ((OrderDetail.AvgCost + OrderDetail.OTP_Amount_State) * OrderDetail.Quantity_Shipped)'),
  //         'Profit',
  //       ],
  //       [
  //         literal(`
  //           (
  //             ( (OrderDetail.Price + OrderDetail.OTP_Amount_State) - (OrderDetail.AvgCost + OrderDetail.OTP_Amount_State) )
  //             / (OrderDetail.Price + OrderDetail.OTP_Amount_State)
  //           ) * 100
  //         `),
  //         'Profit_Percent',
  //       ],


  //     ];

  //     /**
  //      * 5️⃣ GROUP BY
  //      * (ONLY non-aggregated fields)
  //      */
  //     const group: string[] = [
  //       // OrderDetail
  //       'OrderDetail.Item_Number',
  //       'OrderDetail.Order_Number',
  //       'OrderDetail.Quantity_Shipped',
  //       'OrderDetail.Price',
  //       'OrderDetail.OTP_Amount_State',
  //       'OrderDetail.AvgCost',

  //       // Inventory
  //       'inventory.Item_Number',
  //       'inventory.Description',
  //       'inventory.Pack',
  //       'inventory.UOM',

  //       // OrderHeader
  //       'orderHeader.Invoice_Date',
  //       'orderHeader.C_Number',

  //       // Customer
  //       'orderHeader.customer.C_Name',
  //       'orderHeader.customer.C_Address',
  //       'orderHeader.customer.C_City',
  //       'orderHeader.customer.C_State',
  //       'orderHeader.customer.C_Zip',
  //       'orderHeader.customer.C_Phone',
  //     ];

  //     /**
  //      * 6️⃣ QUERY
  //      */
  //     const result = await OrderDetail.findAll({
  //       attributes,
  //       include: [
  //         {
  //           model: OrderHeader,
  //           as: 'orderHeader',
  //           attributes: [],
  //           where: orderHeaderWhere,
  //           include: [
  //             {
  //               model: Customer,
  //               as: 'customer',
  //               attributes: [],
  //               where: customerWhere,
  //               required: Object.keys(customerWhere).length > 0,
  //             },
  //           ],
  //         },
  //         {
  //           model: Inventory,
  //           as: 'inventory',
  //           attributes: [],
  //           where: inventoryWhere,
  //           required: Object.keys(inventoryWhere).length > 0,
  //         },
  //       ],
  //       group,
  //       subQuery: false,
  //     });

  //     /**
  //      * 7️⃣ FLATTEN
  //      */
  //     const rows = result.map(r => r.get({ plain: true }));

  //     return formatCustomerVelocityItemBreakdown(rows);

  //   }

  // service
  async getShortShipmentReport(
    filters: { fromDate?: string; toDate?: string }
  ) {
    const orderHeaderWhere: any = {
      Order_Updated: true,
      Order_Deleted: false,
    };

    if (filters.fromDate && filters.toDate) {
      orderHeaderWhere.Invoice_Date = {
        [Op.between]: [filters.fromDate, filters.toDate],
      };
    }

    /** BASE ATTRIBUTES */
    const attributes: any[] = [
      [
        literal(`
            IIF(
              orderHeader.Invoice_Number_Legacy <> 0,
              CONVERT(varchar(10), orderHeader.Invoice_Number_Legacy),
              IIF(
                orderHeader.Invoice_Number > 1,
                CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
                CONVERT(varchar(10), orderHeader.Order_Number)
              )
            )
          `),
        'Document_Number',
      ],

      [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
      [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
      [col('orderHeader.C_Number'), 'C_Number'],
      [col('orderHeader.S_Number'), 'S_Number'],
      [col('orderHeader.Route_Number'), 'Route_Number'],
      [col('orderHeader.Jurisdiction_County'), 'Jurisdiction_County'],


      'Order_Number',
      'Promo_Number',
      'Item_Number',
      'Quantity_Ordered',
      'Quantity_Shipped',

      // ✅ Loss Quantity
      [
        literal('(OrderDetail.Quantity_Ordered - OrderDetail.Quantity_Shipped)'),
        'Loss_Qty',
      ],

      'Unit_Code',
      'OrderDetail_Code',
      'Delivered',
      'Credit_ReturnToStock',
      'Price',
      'NetCost',
      'BaseCost',
      'AvgCost',
      'Invoice_Cost',
      'OTP_Amount_State',
      'OTP_Amount_County',
      'OTP_Amount_City',
      'Sales_Category',
      'OTP_Number',

      // ✅ Extended Price (Price + OTP)
      [
        literal('(OrderDetail.Price + OrderDetail.OTP_Amount_State)'),
        'Ext_Price',
      ],

      // ✅ Extended Loss = LossQty * (Price + OTP)
      [
        literal(`
            (OrderDetail.Quantity_Ordered - OrderDetail.Quantity_Shipped)
            * (OrderDetail.Price + OrderDetail.OTP_Amount_State)
          `),
        'Ext_Loss',
      ],

      [col('inventory.Description'), 'Description'],
      [col('inventory.UOM'), 'UOM'],
      [col('inventory.Pack'), 'Pack'],
      [col('inventory.UnitOunces'), 'UnitOunces'],
      [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
      [col('inventory.Cig_Pack'), 'Cig_Pack'],
      [col('inventory.OTP_Number'), 'OTP_Number'],
      [col('inventory.Price_Class'), 'Price_Class'],


      [
        literal(`
            ISNULL(
              (
                SELECT SUM(Inventory_OnHand)
                FROM Inventory_Status
                WHERE Inventory_Status.Code = 0
                AND Inventory_Status.Item_Number = OrderDetail.Item_Number
              ),
              0
            )
          `),
        'OnHand',
      ],

      [col('orderHeader.customer.C_Name'), 'C_Name'],
      [col('orderHeader.customer.c_address'), 'c_address'],
      [col('orderHeader.customer.c_city'), 'c_city'],
      [col('orderHeader.customer.c_state'), 'c_state'],
      [col('orderHeader.customer.C_Country'), 'C_Country'],
      [col('orderHeader.customer.c_zip'), 'c_zip'],
      [col('orderHeader.customer.c_phone'), 'c_phone'],
      [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
      [col('orderHeader.customer.C_ClassOfTrade'), 'C_ClassOfTrade'],
    ];


    const result = await OrderDetail.findAll({
      attributes,

      where: {
        Quantity_Shipped: {
          [Op.gte]: 0,
          [Op.lt]: col('Quantity_Ordered'),
        },
        [Op.and]: literal('(Quantity_Ordered - Quantity_Shipped) > 0'),
      },

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          where: orderHeaderWhere,
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
              required: true,
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: true,
        },
      ],

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC'],
      ],

      subQuery: false,
    });

    const rows = result.map(r => r.get({ plain: true }));

    const grandTotals = rows.reduce(
      (acc, row) => {
        acc.Grand_Loss_Qty += Number(row.Loss_Qty || 0);
        acc.Grand_Ext_Loss += Number(row.Ext_Loss || 0);
        return acc;
      },
      {
        Grand_Loss_Qty: 0,
        Grand_Ext_Loss: 0,
      }
    );

    return {
      rows,
      ...grandTotals,
    };
  }

  async getVelocityReportCustomer(filters: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, page = 1, limit = 10, } = filters;
    const offset = (page - 1) * limit;

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const invoiceDateWhere: any = {};

    if (start) {
      invoiceDateWhere[Op.gte] = start;
    }

    invoiceDateWhere[Op.lte] = end;

    const orderHeaderWhere: any = {
      Order_Updated: 'True',
      Order_Deleted: 'False',
      Invoice_Date: invoiceDateWhere,
    };

    /**
     * Selected Attributes
     */
    const attributes: any[] = [
      [
        literal(`
              IIF(
                orderHeader.Invoice_Number_Legacy <> 0,
                CONVERT(varchar(10), orderHeader.Invoice_Number_Legacy),
                IIF(
                  orderHeader.Invoice_Number > 1,
                  CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
                  CONVERT(varchar(10), orderHeader.Order_Number)
                )
              )
            `),
        'Document_Number',
      ],

      [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
      [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
      [col('orderHeader.C_Number'), 'C_Number'],
      [col('orderHeader.S_Number'), 'S_Number'],
      [col('orderHeader.Route_Number'), 'Route_Number'],
      [col('orderHeader.customer.C_ClassOfTrade'), 'C_ClassOfTrade'],

      'Order_Number',
      'Promo_Number',
      'Item_Number',
      'Quantity_Ordered',
      'Quantity_Shipped',
      'Unit_Code',
      'OrderDetail_Code',
      'Delivered',
      'Credit_ReturnToStock',
      'Price',
      'NetCost',
      'BaseCost',
      'AvgCost',
      'Invoice_Cost',
      'OTP_Amount_State',
      'OTP_Amount_County',
      'OTP_Amount_City',
      [
        literal('(OrderDetail.Price * OrderDetail.Quantity_Ordered ) '),
        'Price_Class_Price',
      ],
      [
        literal('(OrderDetail.Quantity_Shipped * inventory.Points ) '),
        'Ext_Points',
      ],
      [
        literal('(OrderDetail.Price + OrderDetail.OTP_Amount_State ) '),
        'EXT_Price',
      ],
      [
        literal('(OrderDetail.AvgCost + OrderDetail.OTP_Amount_State ) '),
        'Ext_AvgCost',
      ],
      [
        literal('(OrderDetail.AvgCost + OrderDetail.OTP_Amount_State ) * OrderDetail.Quantity_Shipped '),
        'Ext_Total_AvgCost',
      ],
      [
        literal('(OrderDetail.BaseCost + OrderDetail.OTP_Amount_State ) '),
        'Ext_BaseCost',
      ],
      [
        literal('(OrderDetail.BaseCost + OrderDetail.OTP_Amount_State ) * OrderDetail.Quantity_Shipped '),
        'Ext_Total_BaseCost',
      ],
      [
        literal('(OrderDetail.NetCost + OrderDetail.OTP_Amount_State ) '),
        'Ext_NetCost',
      ],
      [
        literal('(OrderDetail.NetCost + OrderDetail.OTP_Amount_State ) * OrderDetail.Quantity_Shipped '),
        'Ext_Total_NetCost',
      ],
      [
        literal('(OrderDetail.BaseCost + OrderDetail.OTP_Amount_State ) * OrderDetail.Quantity_Shipped '),
        'Ext_Total_BaseCost',
      ],
      [
        literal('(OrderDetail.Invoice_Cost + OrderDetail.OTP_Amount_State ) '),
        'Ext_Invoice_Cost',
      ],
      [
        literal('(OrderDetail.Invoice_Cost + OrderDetail.OTP_Amount_State ) * OrderDetail.Quantity_Shipped '),
        'Ext_Total_Invoice_Cost',
      ],
      [
        literal('(OrderDetail.Price + OrderDetail.OTP_Amount_State ) * OrderDetail.Quantity_Shipped'),
        'EXT_Total_Price',
      ],
      [
        literal('(OrderDetail.Price + OrderDetail.OTP_Amount_State ) * OrderDetail.Quantity_Shipped '),
        'Ext_Price',
      ],
      [
        literal('((OrderDetail.Price+ OrderDetail.OTP_Amount_State) * OrderDetail.Quantity_Shipped) - ((OrderDetail.AvgCost + OrderDetail.OTP_Amount_State) * OrderDetail.Quantity_Shipped)'),
        'Profit',
      ],
      [
        literal(`
            (
              (
                (OrderDetail.Price + OrderDetail.OTP_Amount_State)
                - (OrderDetail.AvgCost + OrderDetail.OTP_Amount_State)
              )
              / NULLIF((OrderDetail.Price + OrderDetail.OTP_Amount_State), 0)
            ) * 100
          `),
        'Profit_Percent',
      ],
      [
        literal(`
            (
              (
                (OrderDetail.Price + OrderDetail.OTP_Amount_State )- (OrderDetail.AvgCost + OrderDetail.OTP_Amount_State )
              )
              / NULLIF((OrderDetail.Price + OrderDetail.OTP_Amount_State), 0)
            ) * 100
          `),
        'AvgCost_Profit_Percent',
      ],
      [
        literal(`
            (
              (
                (OrderDetail.Price + OrderDetail.OTP_Amount_State )- (OrderDetail.BaseCost + OrderDetail.OTP_Amount_State )
              )
              / NULLIF((OrderDetail.Price + OrderDetail.OTP_Amount_State), 0)
            ) * 100
          `),
        'BaseCost_Profit_Percent',
      ],
      [
        literal(`
            (
              (
                (OrderDetail.Price + OrderDetail.OTP_Amount_State )- (OrderDetail.NetCost + OrderDetail.OTP_Amount_State )
              )
              / NULLIF((OrderDetail.Price + OrderDetail.OTP_Amount_State), 0)
            ) * 100
          `),
        'NetCost_Profit_Percent',
      ],
      [
        literal(`
            (
              (
                (OrderDetail.Price + OrderDetail.OTP_Amount_State )- (OrderDetail.Invoice_Cost + OrderDetail.OTP_Amount_State )
              )
              / NULLIF((OrderDetail.Price + OrderDetail.OTP_Amount_State), 0)
            ) * 100
          `),
        'Invoice_Cost_Profit_Percent',
      ],

      [col('inventory.Description'), 'Description'],
      [col('inventory.UOM'), 'UOM'],
      [col('inventory.Sales_Category'), 'Sales_Category'],
      [col('inventory.OTP_Number'), 'OTP_Number'],
      [col('inventory.Primary_Vendor'), 'Primary_Vendor'],
      [col('inventory.Price_Subclass'), 'Price_Subclass'],
      [col('inventory.Jurisdiction_State'), 'Jurisdiction_State'],
      [col('inventory.Jurisdiction_County'), 'Jurisdiction_County'],
      [col('inventory.Jurisdiction_City'), 'Jurisdiction_City'],
      [col('inventory.Location'), 'Location'],
      [col('inventory.Section'), 'Section'],
      [col('inventory.PickArea'), 'PickArea'],

      [col('inventory.Pack'), 'Pack'],
      [col('inventory.UnitOunces'), 'UnitOunces'],
      [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
      [col('inventory.Points'), 'Points'],
      [col('inventory.Cig_Pack'), 'Cig_Pack'],
      [col('inventory.Price_Class'), 'Price_Class_Number'],
      [col('inventory.PriceClass.Class_Desc'), 'Class_Desc'],


      [col('orderHeader.customer.C_Name'), 'C_Name'],
      [col('orderHeader.customer.c_address'), 'c_address'],
      [col('orderHeader.customer.c_city'), 'c_city'],
      [col('orderHeader.customer.c_state'), 'c_state'],
      [col('orderHeader.customer.c_zip'), 'c_zip'],
      [col('orderHeader.customer.c_phone'), 'c_phone'],
      [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
      [col('orderHeader.customer.c_memo'), 'c_memo'],

    ];

    /**
     * Query Execution
     */
    const { rows, count } = await OrderDetail.findAndCountAll({
      attributes,

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          required: true,
          where: orderHeaderWhere,
          attributes: [],
          include: [
            {
              model: Customer,
              as: 'customer',
              // required: true,
              attributes: [],
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          required: true,
          attributes: [],
          include: [
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: [],
            },
          ]
        },
      ],

      order: [
        [col('orderHeader.Invoice_Date'), 'DESC'],
        [col('orderHeader.Order_Number'), 'ASC'],
      ],

      limit,
      offset,

      raw: true,
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getVelocityReportSalesRep(data: any) {
    const { startDate, endDate } = data;

    const invoices = await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF(orderHeader.Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), orderHeader.Invoice_Number_Legacy),
            IIF(orderHeader.Invoice_Number > 1,
              CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
              CONVERT(VARCHAR(10), orderHeader.Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        [col('orderHeader.SalesRep.S_Desc'), 'S_Desc'],

        'Order_Number',
        'Promo_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'Sales_Category',

        [col('Inventory.Price1'), 'Price1'],
        'Price_Reference',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',

        [
          literal(`
          (OrderDetail.Price +
           OrderDetail.OTP_Amount_State +
           OrderDetail.OTP_Amount_County +
           OrderDetail.OTP_Amount_City)
        `),
          'TotalPrice'
        ],

        [
          literal(`
          (OrderDetail.Price_Reference +
           OrderDetail.OTP_Amount_State +
           OrderDetail.OTP_Amount_County +
           OrderDetail.OTP_Amount_City)
        `),
          'TotalPriceRef'
        ],

        [col('Inventory.Description'), 'Description'],
        [col('Inventory.UOM'), 'UOM'],
        [col('Inventory.Pack'), 'Pack'],
        [col('Inventory.UnitOunces'), 'UnitOunces'],
        [col('Inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('Inventory.Points'), 'Points'],
        [col('Inventory.Cig_Pack'), 'Cig_Pack'],
        [col('Inventory.Price_Class'), 'Price_Class'],
        [col('Inventory.PriceClass.Class_Desc'), 'Class_Desc'],
        [col('Inventory.Primary_Vendor'), 'Primary_Vendor'],
        [col('Inventory.Section'), 'Section'],
        [col('Inventory.Location'), 'Location'],
        [col('Inventory.PickArea'), 'PickArea'],
        [col('Inventory.OTP_Number'), 'OTP_Number'],



        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
        [col('orderHeader.customer.C_ClassOfTrade'), 'C_ClassOfTrade'],
        [col('orderHeader.customer.Jurisdiction_State'), 'Jurisdiction_State'],
        [col('orderHeader.customer.Jurisdiction_County'), 'Jurisdiction_County'],
        [col('orderHeader.customer.Jurisdiction_City'), 'Jurisdiction_City'],

      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate]
            }
          },
          include: [
            {
              model: SalesRep,
              as: 'salesRep',
              attributes: []
            },
            {
              model: Customer,
              as: 'customer',
              attributes: []
            }
          ]
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          include: [
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: []
            }
          ]
        }
      ],

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC']
      ],

      raw: true
    });

    return invoices;
  }

  async getCustomerVelocityReportPoints(data: any) {
    const { startDate, endDate } = data;

    const invoices = await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF(orderHeader.Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), orderHeader.Invoice_Number_Legacy),
            IIF(orderHeader.Invoice_Number > 1,
              CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
              CONVERT(VARCHAR(10), orderHeader.Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        [col('orderHeader.salesRep.S_Desc'), 'S_Desc'],

        'Order_Number',
        'Promo_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'Sales_Category',

        [col('inventory.Price1'), 'Price1'],
        'Price_Reference',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',

        [
          literal(`
          (OrderDetail.Price +
           OrderDetail.OTP_Amount_State +
           OrderDetail.OTP_Amount_County +
           OrderDetail.OTP_Amount_City)
        `),
          'TotalPrice'
        ],

        [
          literal(`
          (OrderDetail.Price_Reference +
           OrderDetail.OTP_Amount_State +
           OrderDetail.OTP_Amount_County +
           OrderDetail.OTP_Amount_City)
        `),
          'TotalPriceRef'
        ],

        [col('inventory.Description'), 'Description'],
        [col('inventory.UOM'), 'UOM'],
        [col('inventory.Pack'), 'Pack'],
        [col('inventory.UnitOunces'), 'UnitOunces'],
        [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('inventory.Points'), 'Points'],
        [col('inventory.Cig_Pack'), 'Cig_Pack'],
        [col('inventory.Price_Class'), 'Price_Class'],
        [col('inventory.PriceClass.Class_Desc'), 'Class_Desc'],
        [col('Inventory.Primary_Vendor'), 'Primary_Vendor'],
        [col('Inventory.Primary_Vendor'), 'Primary_Vendor'],
        [col('Inventory.Section'), 'Section'],
        [col('Inventory.Location'), 'Location'],
        [col('Inventory.PickArea'), 'PickArea'],
        [col('Inventory.OTP_Number'), 'OTP_Number'],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
        [col('orderHeader.customer.C_ClassOfTrade'), 'C_ClassOfTrade'],
        [col('orderHeader.customer.Jurisdiction_State'), 'Jurisdiction_State'],
        [col('orderHeader.customer.Jurisdiction_County'), 'Jurisdiction_County'],
        [col('orderHeader.customer.Jurisdiction_City'), 'Jurisdiction_City'],
        [
          literal(`( OrderDetail.Points * OrderDetail.Quantity_Shipped ) `),
          'ExtPoints'
        ],
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate]
            }
          },
          include: [
            {
              model: SalesRep,
              as: 'salesRep',
              attributes: []
            },
            {
              model: Customer,
              as: 'customer',
              attributes: []
            }
          ]
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          include: [
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: []
            }
          ]
        }
      ],

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC']
      ],

      raw: true
    });

    return invoices;
  }

  async getCustomerVelocityReportPointsItem(data: any) {
    const { startDate, endDate } = data;

    const invoices = await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF(orderHeader.Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), orderHeader.Invoice_Number_Legacy),
            IIF(orderHeader.Invoice_Number > 1,
              CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
              CONVERT(VARCHAR(10), orderHeader.Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        'Order_Number',
        'Promo_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',
        [literal('OrderDetail.Points'), 'Points'],

        [col('inventory.Description'), 'Description'],
        [col('inventory.UOM'), 'UOM'],
        [col('inventory.Pack'), 'Pack'],
        [col('inventory.UnitOunces'), 'UnitOunces'],
        [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('inventory.Cig_Pack'), 'Cig_Pack'],
        [col('Inventory.Primary_Vendor'), 'Primary_Vendor'],
        [col('Inventory.Sales_Category'), 'Sales_Category'],
        [col('Inventory.Section'), 'Section'],
        [col('Inventory.Location'), 'Location'],
        [col('Inventory.PickArea'), 'PickArea'],
        [col('Inventory.OTP_Number'), 'OTP_Number'],
        [
          literal(`( inventory.Points * Quantity_Shipped ) `),
          'ExtPoints'
        ],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
        [col('orderHeader.customer.C_ClassOfTrade'), 'C_ClassOfTrade'],
        [col('orderHeader.customer.Jurisdiction_State'), 'Jurisdiction_State'],
        [col('orderHeader.customer.Jurisdiction_County'), 'Jurisdiction_County'],
        [col('orderHeader.customer.Jurisdiction_City'), 'Jurisdiction_City'],
      ],

      where: {
        Points: {
          [Op.ne]: 0
        }
      },

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate]
            }
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: []
            }
          ]
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: []
        }
      ],

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC']
      ],

      raw: true
    });

    return invoices;
  }

  async setRetailerLocation(body: any) {
    const retailerLocation = await RetailerLocation.create(body);
    return retailerLocation;
  }

  async getAllOrderForDriver(query: PaginationOptions) {
    let { page = 1, limit = 10, routeNumber, orderType } = query;

    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    const driverStartDate = process.env.DELIVERY_START_DATE;

    const whereCondition: any = {
      Order_Date: {
        [Op.gte]: driverStartDate,

      },
      Delivery_ID: {
        [Op.not]: 99,
      },
      Invoice_Number: {
        [Op.gt]: 0,
      },
      Invoice_Total: {
        [Op.gt]: 0,
      },
      route_created: false,
      Order_Deleted: false,
      Suspend: false,
    };

    if (routeNumber) {
      whereCondition.Route_Number = routeNumber;
    }

    const { rows: orders, count: totalRecords } =
      await OrderHeader.findAndCountAll({
        where: whereCondition,
        attributes: [
          'Order_Number',
          'Order_Date',
          'Invoice_Number',
          'Invoice_Total',
          'Delivery_ID',
          'Route_Number',
          'C_Number',
          'Stop_Number',
        ],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: [
              'C_Number',
              'C_Name',
              'C_Address',
              'C_City',
              'C_State',
              'C_Zip',
              'C_Phone',
              'C_PhoneMobile',
            ],
          },
        ],
        order: [
          ['Order_Date', 'DESC'],
          ['Order_Number', 'DESC'],
        ],
        limit,
        offset,
      });

    const finalOrders = await Promise.all(orders.map(async (order: any) => {
      let orderData = order.dataValues;
      const customerLocation = await RetailerLocation.findOne({
        where: {
          C_Number: orderData.C_Number,
        },
      });
      return {
        ...orderData,
        customerLocation: customerLocation ? customerLocation.dataValues : null,
      };
    }));

    return {
      data: finalOrders,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async getRouteCreatedOrders(query: PaginationOptions) {
    let { page = 1, limit = 10, routeNumber } = query;

    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    const driverStartDate = process.env.DELIVERY_START_DATE;

    const whereCondition: any = {
      Order_Date: {
        [Op.gte]: driverStartDate,
      },
      Delivery_ID: {
        [Op.not]: 99,
      },
      Invoice_Number: {
        [Op.gt]: 0,
      },
      Invoice_Total: {
        [Op.gt]: 0,
      },
      route_created: true,
      Order_Deleted: false,
      Suspend: false,
    };

    if (routeNumber) {
      whereCondition.Route_Number = routeNumber;
    }

    const { rows: orders, count: totalRecords } =
      await OrderHeader.findAndCountAll({
        where: whereCondition,
        attributes: [
          'Order_Number',
          'Order_Date',
          'Invoice_Number',
          'Invoice_Total',
          'Delivery_ID',
          'Route_Number',
          'C_Number',
          'Stop_Number',
        ],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: [
              'C_Number',
              'C_Name',
              'C_Address',
              'C_City',
              'C_State',
              'C_Zip',
              'C_Phone',
              'C_PhoneMobile',
            ],
          },
        ],
        order: [
          ['Order_Date', 'DESC'],
          ['Order_Number', 'DESC'],
        ],
        limit,
        offset,
      });

    const finalOrders = await Promise.all(orders.map(async (order: any) => {
      let orderData = order.dataValues;
      const customerLocation = await RetailerLocation.findOne({
        where: {
          C_Number: orderData.C_Number,
        },
      });
      return {
        ...orderData,
        customerLocation: customerLocation ? customerLocation.dataValues : null,
      };
    }));

    return {
      data: finalOrders,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async getDeliverRouteByGoogleMap(body: any) {
    const { origin, destination, stops } = body;

    if (!origin || !destination || !stops || !Array.isArray(stops)) {
      throw new AppError("origin, destination, and stops array are required", 400);
    }

    const kmToMiles = (km: number) => Number((km * 0.621371).toFixed(3));
    const formatDuration = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.ceil((totalSeconds % 3600) / 60);
      if (hours <= 0) return `${minutes} min`;
      return `${hours}h ${minutes}m`;
    };

    // Get optimized directions from Google Maps API
    const { waypointOrder, polyline, legs, totalKilometers } = await getOptimizedDirections(
      origin,
      destination,
      stops.map((s: any) => ({ lat: s.lat, lng: s.lng }))
    );


    const optimizedStops = waypointOrder.map((originalIndex: number, optimizedIndex: number) => {
      const stop = stops[originalIndex];


      const leg = legs[optimizedIndex];

      if (!leg) {
        throw new AppError(`Missing leg data for stop at index ${optimizedIndex}`, 500);
      }

      // Per-stop distance (distance for this specific leg to reach this stop)
      const legDistanceMeters = Number(leg?.distance?.value ?? 0);
      const legDistanceKm = Number((legDistanceMeters / 1000).toFixed(3));
      const legDistanceMiles = kmToMiles(legDistanceKm);

      // Cumulative distance (sum of all legs from origin up to and including this stop)
      const cumulativeMeters = legs
        .slice(0, optimizedIndex + 1)
        .reduce((sum, l) => sum + Number(l?.distance?.value ?? 0), 0);
      const cumulativeKm = Number((cumulativeMeters / 1000).toFixed(3));
      const cumulativeMiles = kmToMiles(cumulativeKm);

      // Get coordinates from the leg's end location (where the stop is)
      // This is more accurate than the original coordinates as Google geocodes the exact route location
      const stopLocation = leg?.end_location || { lat: stop.lat, lng: stop.lng };

      return {
        stopSequence: optimizedIndex + 1,
        C_Number: stop.C_Number,
        orderNumbers: stop.orderNumbers,
        lat: Number(stopLocation.lat),
        lng: Number(stopLocation.lng),
        distanceKm: legDistanceKm, // Distance for this specific leg (to reach this stop)
        distanceMiles: legDistanceMiles,
        cumulativeDistanceKm: cumulativeKm, // Total distance traveled from origin to this stop
        cumulativeDistanceMiles: cumulativeMiles,
      };
    });

    // Get the distance from the last stop to the destination
    // The last leg (legs[stops.length]) is from the last stop to the destination
    const lastStopToDestinationLeg = legs[stops.length];
    const lastStopToDestinationMeters = Number(lastStopToDestinationLeg?.distance?.value ?? 0);
    const lastStopToDestinationKm = Number((lastStopToDestinationMeters / 1000).toFixed(3));
    const lastStopToDestinationMiles = kmToMiles(lastStopToDestinationKm);

    const totalMiles = kmToMiles(totalKilometers);

    // Expected travel time:
    // Prefer Google duration from all legs; fallback with truck/small-truck avg speed.
    const totalDurationSecondsFromGoogle = legs.reduce(
      (sum, leg) => sum + Number(leg?.duration?.value ?? 0),
      0
    );
    const fallbackTruckSeconds = Math.round((totalMiles / 30) * 3600); // avg 30 mph
    const expectedTimeSeconds =
      totalDurationSecondsFromGoogle > 0 ? totalDurationSecondsFromGoogle : fallbackTruckSeconds;

    return {
      route: {
        polyline, // Encoded polyline for drawing the route
        totalDistanceKm: totalKilometers, // Total distance for entire route (origin -> all stops -> destination)
        totalDistanceMiles: totalMiles,
        lastStopToDestinationKm: lastStopToDestinationKm, // Distance from last stop to destination
        lastStopToDestinationMiles: lastStopToDestinationMiles,
        expectedTimeSeconds,
        expectedTimeMinutes: Math.ceil(expectedTimeSeconds / 60),
        expectedTimeText: formatDuration(expectedTimeSeconds),
        estimatedForVehicle: "truck_or_small_truck",
      },
      optimizedStops, // Array of stops in optimized order with coordinates and distances
      waypointOrder, // Original indices in optimized order (for reference)
    };
  }

  async createDeliveryRoute(body: any) {
    return await postgresSequelize.transaction(async (t) => {
      // CASE A: normal route (no children)
      if (body.deliveryRoute && Array.isArray(body.deliveryRouteStops)) {
        const deliveryRoute = body.deliveryRoute;
        const deliveryRouteStops = body.deliveryRouteStops;

        // enforce parent fields for normal route
        deliveryRoute.hasChildren = false;
        deliveryRoute.parentRouteId = null;
        deliveryRoute.splitIndex = 0;
        deliveryRoute.routeGroupKey = deliveryRoute.routeGroupKey || deliveryRoute.routeNumber;

        const newRoute = await DeliveryRoute.create(deliveryRoute, { transaction: t });

        const lastIndex = deliveryRouteStops.length - 1;
        const orderNumbers: any[] = [];

        const stopsToInsert = deliveryRouteStops.map((stop: any, index: number) => {
          const isFirst = index === 0;
          const isLast = index === lastIndex;

          orderNumbers.push(stop.orderNumber);
          // Chain: first stop starts from route origin, others start from previous stop's lat/lng
          const startLatitude = isFirst
            ? deliveryRoute.orderStartLat
            : deliveryRouteStops[index - 1].latitude;
          const startLongitude = isFirst
            ? deliveryRoute.orderStartLong
            : deliveryRouteStops[index - 1].longitude;

          // Last stop ends at route destination
          const endLatitude = isLast
            ? deliveryRoute.orderEndLat
            : deliveryRouteStops[index + 1].latitude;
          const endLongitude = isLast
            ? deliveryRoute.orderEndLong
            : deliveryRouteStops[index + 1].longitude;

          return {
            ...stop,
            stopSequence: index + 1,
            routeId: newRoute.id,
            startLatitude,
            startLongitude,
            endLatitude,
            endLongitude,
            isLastStop: isLast,
          };
        });

        await DeliveryRouteStop.bulkCreate(stopsToInsert, { transaction: t });

        if (orderNumbers.length > 0) {
          await OrderHeader.update({ route_created: true }, { where: { Order_Number: { [Op.in]: orderNumbers as unknown as any[] } } });
        }

        return { parentRoute: newRoute, children: [] };
      }



      throw new Error("Invalid payload. Send either {deliveryRoute, deliveryRouteStops} OR {parentDeliveryRoute, children[]}");
    });
  }


  async getDeliveryRoutes(query: PaginationOptions & {
    routeId?: number;
    day?: string;
    driverId?: number;
    routeStatus?: string;
    includeStops?: boolean;
    includeChildren?: boolean;
  }) {
    const {
      page = 1,
      limit = 10,
      routeId,
      day,
      driverId,
      routeStatus,
      includeStops = true,
      includeChildren = true
    } = query;

    const offset = (Number(page) - 1) * Number(limit);

    // If routeId is provided, get single route with details
    if (routeId) {
      const route = await DeliveryRoute.findByPk(routeId, {
        include: includeStops ? [
          {
            model: DeliveryRouteStop,
            as: 'stops',
            where: { isActive: true },
            required: false,
            order: [['stopSequence', 'ASC']],
          }
        ] : [],
      });

      if (!route) {
        throw new AppError("Delivery route not found", 404);
      }

      const routeData: any = route.toJSON();

      // If route has children, fetch them
      if (includeChildren && routeData.hasChildren) {
        const children = await DeliveryRoute.findAll({
          where: {
            parentRouteId: routeId,
            isActive: true,
          },
          include: includeStops ? [
            {
              model: DeliveryRouteStop,
              as: 'stops',
              where: { isActive: true },
              required: false,
              order: [['stopSequence', 'ASC']],
            }
          ] : [],
          order: [['splitIndex', 'ASC']],
        });
        routeData.children = children.map((child: any) => child.toJSON());
      } else {
        routeData.children = [];
      }

      return {
        data: routeData,
        pagination: {
          page: 1,
          limit: 1,
          totalRecords: 1,
        },
      };
    }

    // Build where clause for filtering
    const whereClause: any = {
      isActive: true,
    };

    if (day) {
      whereClause.day = day;
    }

    if (driverId) {
      whereClause.driverId = Number(driverId);
    }

    if (routeStatus) {
      whereClause.routeStatus = routeStatus;
    }

    // Get only parent routes (not children) for list view
    whereClause.parentRouteId = null;

    // Get routes with pagination
    const { rows: routes, count: totalRecords } = await DeliveryRoute.findAndCountAll({
      where: whereClause,
      include: includeStops ? [
        {
          model: DeliveryRouteStop,
          as: 'stops',
          where: { isActive: true },
          required: false,
          order: [['stopSequence', 'ASC']],
        }
      ] : [],
      order: [['day', 'DESC'], ['routeNumber', 'ASC']],
      limit: Number(limit),
      offset,
    });

    // If includeChildren is true, fetch children for each parent route
    if (includeChildren) {
      const routeIds = routes.map((r: any) => r.id);
      const childrenRoutes = await DeliveryRoute.findAll({
        where: {
          parentRouteId: { [Op.in]: routeIds },
          isActive: true,
        },
        include: includeStops ? [
          {
            model: DeliveryRouteStop,
            as: 'stops',
            where: { isActive: true },
            required: false,
            order: [['stopSequence', 'ASC']],
          }
        ] : [],
        order: [['parentRouteId', 'ASC'], ['splitIndex', 'ASC']],
      });

      // Group children by parentRouteId
      const childrenMap = new Map();
      childrenRoutes.forEach((child: any) => {
        const parentId = child.parentRouteId;
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId).push(child.toJSON());
      });

      // Attach children to parent routes
      const routesWithChildren = routes.map((route: any) => {
        const routeData = route.toJSON();
        routeData.children = childrenMap.get(route.id) || [];
        return routeData;
      });

      return {
        data: routesWithChildren,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalRecords,
          totalPages: Math.ceil(totalRecords / Number(limit)),
        },
      };
    }



  }
  async getARreports(query: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }) {
    const {
      startDate,
      endDate,
      page = 1,
      limit,
    } = query;

    const offset = limit ? (page - 1) * limit : undefined;
    const end = new Date(endDate);
    end.setDate(end.getDate());


    const total = await ARDeposits.count({
      distinct: true,
      col: 'Deposit_ID',
      where: {
        Deposit_Date: {
          [Op.gte]: startDate,
          [Op.lte]: end,
        },
      },
    });

    const data = await ARDeposits.findAll({
      where: {
        Deposit_Date: {
          [Op.gte]: startDate,
          [Op.lte]: end,
        },
      },

      order: [['Deposit_ID', 'DESC']],
      limit,
      offset,
      subQuery: false,

      include: [
        {
          model: CustReceivables,
          as: 'custReceivables',
          required: false,
          include: [

            {
              model: Customer,
              as: 'customer',
              attributes: ['C_Name'],
              required: false,
            },
            {
              model: Users,
              required: false,
              attributes: ['UserNumber', 'UserName']
            },
            {
              model: ARDefinitions,
              as: 'arDefinition',
              attributes: ['AR_SubTypeRef'],
              required: false,

              on: and(
                where(
                  col('custReceivables.AR_Type'),
                  '=',
                  col('custReceivables->arDefinition.AR_Type')
                ),
                where(
                  col('custReceivables.AR_SubType'),
                  '=',
                  col('custReceivables->arDefinition.AR_SubType')
                )
              ),
            },
          ],
        },
      ],
    });

    return { total, page, limit, data, };
  }

  async getARUndepositeFund(startDate: string, endDate: string) {
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    const data = await CustReceivables.findAll({
      attributes: {
        include: [
          // SubType from AR_Definitions (matching both AR_Type & AR_SubType)
          [
            sequelize.literal(`(
            SELECT AR_SubTypeRef 
            FROM AR_Definitions 
            WHERE AR_Definitions.AR_Type = CustReceivables.AR_Type 
              AND AR_Definitions.AR_SubType = CustReceivables.AR_SubType
          )`),
            'SubType'
          ],
          // RepName from SalesRep
          [
            sequelize.literal(`(
            SELECT S_Desc 
            FROM SalesRep 
            WHERE SalesRep.S_Number = Customer.C_Salesman
          )`),
            'RepName'
          ],
          // DaysUntilDue from Invoice_Terms
          [
            sequelize.literal(`(
            SELECT DaysUntilDue 
            FROM Invoice_Terms 
            WHERE Invoice_Terms.TermsCode = Customer.TermsCode
          )`),
            'DaysUntilDue'
          ],
          // Terms from Invoice_Terms
          [
            sequelize.literal(`(
            SELECT Terms 
            FROM Invoice_Terms 
            WHERE Invoice_Terms.TermsCode = Customer.TermsCode
          )`),
            'Terms'
          ],
          // Sum of Finance_Charge
          [
            sequelize.literal(`ISNULL((
            SELECT SUM(Finance_Charge) 
            FROM Cust_FinanceCharges 
            WHERE Cust_FinanceCharges.C_Number = CustReceivables.C_Number
          ), 0)`),
            'fCharge'
          ],
        ]
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [
            'C_Name',
            'C_Address',
            'C_City',
            'C_State',
            'C_Zip',
            'C_Phone',
            'C_Fax',
            'C_Email',
            'TermsCode',
            'C_Salesman',
            'C_StatementAccount',
          ]
        }
      ],
      where: {
        Deposit_ID: 0,
        AR_Type: { [Op.ne]: 'I' },
        AR_CheckDate: {
          // [Op.between]: [startDate, endDate]
          [Op.gte]: startDate,
          [Op.lte]: end,
        }
      },
      order: [['AR_CheckDate', 'ASC']]
    });

    return data;
  }

  async getARDeletedPayment(filters: {
    startDate?: string;
    endDate?: string;
  }) {
    const { startDate, endDate } = filters;

    const whereCondition: any = {
      AR_Type: {
        [Op.in]: ['C', 'A'],
      },
    };

    let start: Date | undefined;
    let end: Date | undefined;

    if (filters.startDate) {
      start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
    }

    if (filters.endDate) {
      end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
    }

    if (start && end) {
      whereCondition.AR_CheckDate = {
        [Op.gte]: start,
        [Op.lte]: end,
      };
    }

    // if (startDate && endDate) {
    //   whereCondition.AR_CheckDate = {
    //     [Op.between]: [startDate, endDate],
    //   };
    // }

    const data = await ARDeletes.findAll({
      attributes: [
        'P_Number',

        // ✅ FIXED CAST
        [
          literal('CAST([ARDeletes].[C_Number] AS varchar)'),
          'C_Number',
        ],

        'Invoice_Number',
        'AR_Type',
        'AR_SubType',
        'AR_Date',

        // ✅ FIXED CAST
        [
          literal('CAST([ARDeletes].[AR_CheckDate] AS date)'),
          'AR_CheckDate',
        ],

        'AR_Ref',
        'AR_Amount',
        'User_Number',

        // ✅ FIXED CAST
        [
          literal('CAST([ARDeletes].[AR_DeleteDate] AS date)'),
          'AR_DeleteDate',
        ],

        [
          literal(`(
          SELECT AR_SubTypeRef
          FROM AR_Definitions
          WHERE AR_Definitions.AR_Type = ARDeletes.AR_Type
            AND AR_Definitions.AR_SubType = ARDeletes.AR_SubType
        )`),
          'SubTypeRef',
        ],

        [
          literal(`(
          SELECT UserName
          FROM Users
          WHERE Users.UserNumber = ARDeletes.User_Number
        )`),
          'Deleted_UserName',
        ],

        // ✅ Association column
        [col('Customer.C_Name'), 'C_Name'],
      ],

      include: [
        {
          model: Customer,
          attributes: [],
          required: false,
        },
      ],

      order: [
        [col('Customer.C_Name'), 'ASC'],
        ['AR_CheckDate', 'ASC'],
      ],

      where: whereCondition,
      raw: true,
    });

    return data;
  }

  async getAgingReport(filters: {
    startDate?: string;
    endDate?: string;
  }) {
    const { startDate, endDate } = filters;

    const whereCondition: any = {
      AR_Type: { [Op.in]: ["I", "C", "A", "R"] },
    };

    if (startDate && endDate) {
      whereCondition.AR_Date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    return await CustReceivables.findAll({
      where: whereCondition,
      subQuery: false,

      attributes: [
        "C_Number",

        [
          Sequelize.literal(`
          (SELECT TOP 1 C_Name
           FROM Customer
           WHERE Customer.C_Number = CustReceivables.C_Number)
        `),
          "C_Name",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 C_Salesman
           FROM Customer
           WHERE Customer.C_Number = CustReceivables.C_Number)
        `),
          "C_Salesman",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 Route_Number
           FROM Customer_Routes
           WHERE Customer_Routes.C_Number = CustReceivables.C_Number)
        `),
          "Route_Number",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 C_CoName
           FROM Customer
           WHERE Customer.C_Number = CustReceivables.C_Number)
        `),
          "C_CoName",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 C_Address
           FROM Customer
           WHERE Customer.C_Number = CustReceivables.C_Number)
        `),
          "C_Address",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 C_City
           FROM Customer
           WHERE Customer.C_Number = CustReceivables.C_Number)
        `),
          "C_City",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 C_State
           FROM Customer
           WHERE Customer.C_Number = CustReceivables.C_Number)
        `),
          "C_State",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 C_Zip
           FROM Customer
           WHERE Customer.C_Number = CustReceivables.C_Number)
        `),
          "C_Zip",
        ],

        /* ===================== BILL TO ===================== */
        [
          Sequelize.literal(`
          ISNULL(
            (SELECT TOP 1 C_Number
             FROM Cust_BillTo
             WHERE Cust_BillTo.C_Number = CustReceivables.C_Number),
          0)
        `),
          "BT_Number",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 C_Name
           FROM Cust_BillTo
           WHERE Cust_BillTo.C_Number = CustReceivables.C_Number)
        `),
          "BT_Name",
        ],

        /* ===================== REP & TERMS ===================== */
        [
          Sequelize.literal(`
          (SELECT TOP 1 S_Desc
           FROM SalesRep
           WHERE SalesRep.S_Number =
             (SELECT TOP 1 C_Salesman
              FROM Customer
              WHERE Customer.C_Number = CustReceivables.C_Number))
        `),
          "RepName",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 DaysUntilDue
           FROM Invoice_Terms
           WHERE Invoice_Terms.TermsCode =
             (SELECT TOP 1 TermsCode
              FROM Customer
              WHERE Customer.C_Number = CustReceivables.C_Number))
        `),
          "DaysUntilDue",
        ],
        [
          Sequelize.literal(`
          (SELECT TOP 1 Terms
           FROM Invoice_Terms
           WHERE Invoice_Terms.TermsCode =
             (SELECT TOP 1 TermsCode
              FROM Customer
              WHERE Customer.C_Number = CustReceivables.C_Number))
        `),
          "Terms",
        ],

        /* ===================== FINANCE CHARGE ===================== */
        [
          Sequelize.literal(`
          ISNULL(
            (SELECT SUM(Finance_Charge)
             FROM Cust_FinanceCharges
             WHERE Cust_FinanceCharges.C_Number = CustReceivables.C_Number),
          0)
        `),
          "fCharge",
        ],

        /* ===================== AGING TOTAL ===================== */
        [
          Sequelize.literal(`
          SUM(AR_Amount - AR_Applied)
        `),
          "netAmount",
        ],

        /* ===================== AGING BUCKETS ===================== */
        [
          Sequelize.literal(`
          SUM(CASE
            WHEN DATEDIFF(DAY, AR_Date, GETDATE()) <= 7
            THEN AR_Amount - AR_Applied ELSE 0 END)
        `),
          "current",
        ],
        [
          Sequelize.literal(`
          SUM(CASE
            WHEN DATEDIFF(DAY, AR_Date, GETDATE()) BETWEEN 8 AND 14
            THEN AR_Amount - AR_Applied ELSE 0 END)
        `),
          "over7",
        ],
        [
          Sequelize.literal(`
          SUM(CASE
            WHEN DATEDIFF(DAY, AR_Date, GETDATE()) BETWEEN 15 AND 30
            THEN AR_Amount - AR_Applied ELSE 0 END)
        `),
          "over14",
        ],
        [
          Sequelize.literal(`
          SUM(CASE
            WHEN DATEDIFF(DAY, AR_Date, GETDATE()) BETWEEN 31 AND 60
            THEN AR_Amount - AR_Applied ELSE 0 END)
        `),
          "over30",
        ],
        [
          Sequelize.literal(`
          SUM(CASE
            WHEN DATEDIFF(DAY, AR_Date, GETDATE()) > 60
            THEN AR_Amount - AR_Applied ELSE 0 END)
        `),
          "over60",
        ],
      ],

      group: ["CustReceivables.C_Number"],

      having: Sequelize.literal(`
      SUM(AR_Amount - AR_Applied) <> 0
    `),

      order: [[Sequelize.literal("C_Name"), "ASC"]],
    });
  }


  async getARreportsHistory(query: any) {
    const arReportHistort = await ARDeposits.findAll({
      attributes: ['Deposit_ID', 'Deposit_Date', 'Deposit_Reference', 'Deposit_Batch', 'QB_Transfer', 'QB_TransferDate', 'Deposit_Deleted', 'Deposit_DeleteDate', 'Deposit_DeleteUser',
        'Payment_Total', 'Adjustment_Total', 'ReturnCheck_Total'
      ],
      where: {
        Deposit_Date: {
          [Op.gte]: query.startDate,
          [Op.lte]: query.endDate
        }
      }
    })

    return arReportHistort
  }

  // PreBook CRUD methods
  async createPreBook(body: { startDate: string; endDate: string; products: number[]; showPrice: boolean; note?: string | null }) {
    // Validate date range
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);

    if (start > end) {
      throw new AppError('Start date must be before or equal to end date', 400);
    }

    // Validate products array
    if (!Array.isArray(body.products) || body.products.length === 0) {
      throw new AppError('Products array is required and must contain at least one item', 400);
    }

    const preBook = await PreBook.create({
      startDate: body.startDate,
      endDate: body.endDate,
      products: body.products,
      showPrice: body.showPrice ?? false,
      note: body.note || null,
    });

    return preBook;
  }

  async getPreBookById(id: number) {
    const preBook = await PreBook.findByPk(id);

    if (!preBook) {
      throw new AppError('PreBook not found', 404);
    }

    const products = await Inventory.findAll({
      where: {
        Item_Number: {
          [Op.in]: preBook.products
        }
      },
      attributes: ['Item_Number', 'Description', 'Price1', 'Sales_Category', 'Price_Class', 'Pack', 'UOM'],
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
        }
      ]
    });

    return {
      preBook,
      products
    };
  }

  async getAllPreBooks(query: PaginationOptions & { search?: string; startDate?: string; endDate?: string }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const offset = (page - 1) * limit;

    const whereCondition: any = {};

    // Date range filter
    if (query.startDate || query.endDate) {
      whereCondition[Op.and] = [];
      if (query.startDate) {
        whereCondition[Op.and].push({
          startDate: { [Op.gte]: query.startDate }
        });
      }
      if (query.endDate) {
        whereCondition[Op.and].push({
          endDate: { [Op.lte]: query.endDate }
        });
      }
    }

    const { count: totalCount, rows: preBooks } = await PreBook.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: preBooks,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updatePreBook(id: number, body: Partial<{ startDate: string; endDate: string; products: number[]; showPrice: boolean; note: string | null }>) {
    const preBook = await PreBook.findByPk(id);

    if (!preBook) {
      throw new AppError('PreBook not found', 404);
    }

    // Validate date range if both dates are being updated
    if (body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);

      if (start > end) {
        throw new AppError('Start date must be before or equal to end date', 400);
      }
    } else if (body.startDate) {
      const start = new Date(body.startDate);
      const end = new Date(preBook.endDate);

      if (start > end) {
        throw new AppError('Start date must be before or equal to end date', 400);
      }
    } else if (body.endDate) {
      const start = new Date(preBook.startDate);
      const end = new Date(body.endDate);

      if (start > end) {
        throw new AppError('Start date must be before or equal to end date', 400);
      }
    }

    // Validate products array if being updated
    if (body.products !== undefined) {
      if (!Array.isArray(body.products) || body.products.length === 0) {
        throw new AppError('Products array must contain at least one item', 400);
      }
    }

    await preBook.update(body);
    return preBook;
  }

  async deletePreBook(id: number) {
    const preBook = await PreBook.findByPk(id);

    if (!preBook) {
      throw new AppError('PreBook not found', 404);
    }

    await preBook.destroy();
    return { success: true, message: 'PreBook deleted successfully' };
  }

  // TradeShow CRUD methods
  async createTradeShow(body: {
    name: string;
    description?: string | null;
    tradeShowDate: string;
    deliveryStartDate: string;
    deliveryEndDate: string;
    deliveryWeeks: number;
    status?: string;
  }) {



    // Validate date ranges
    const tradeShowDate = new Date(body.tradeShowDate);
    const deliveryStartDate = new Date(body.deliveryStartDate);
    const deliveryEndDate = new Date(body.deliveryEndDate);

    if (deliveryStartDate > deliveryEndDate) {
      throw new AppError('Delivery start date must be before or equal to delivery end date', 400);
    }

    // Validate status
    const validStatuses = ['active', 'inactive'];
    const status = body.status || 'inactive';
    if (!validStatuses.includes(status)) {
      throw new AppError('Status must be either "active" or "inactive"', 400);
    }

    // Validate deliveryWeeks
    if (body.deliveryWeeks < 0) {
      throw new AppError('Delivery weeks must be a non-negative number', 400);
    }

    // Check if a trade show with the same tradeShowDate already exists
    const existingTradeShow = await TradeShow.findOne({
      where: {
        tradeShowDate: body.tradeShowDate,
        isActive: true,
      },
    });

    if (existingTradeShow) {
      throw new AppError(`A trade show with the date ${body.tradeShowDate} already exists`, 400);
    }

    const tradeShow = await TradeShow.create({
      name: body.name,
      isActive: true,
      description: body.description || null,
      tradeShowDate: body.tradeShowDate as any,
      deliveryStartDate: body.deliveryStartDate as any,
      deliveryEndDate: body.deliveryEndDate as any,
      deliveryWeeks: body.deliveryWeeks,
      status: status,
    });

    return tradeShow;
  }

  async findActiveTradeShow() {
    const tradeShow = await TradeShow.findOne({
      where: {
        status: 'active',
        isActive: true
      }
    });
    return tradeShow;
  }

  async getTradeShowById(id: number) {
    const tradeShow = await TradeShow.findByPk(id);

    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    return tradeShow;
  }

  async getAllTradeShows(query: PaginationOptions & {
    search?: string;
    status?: string;
    tradeShowDate?: string;
    deliveryStartDate?: string;
    deliveryEndDate?: string;
  }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const offset = (page - 1) * limit;

    const whereCondition: any = {
      isActive: true,
    };

    // Search filter (by name or description)
    if (query.search) {
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    // Status filter
    if (query.status) {
      whereCondition.status = query.status;
    }

    // Trade show date filter
    if (query.tradeShowDate) {
      whereCondition.tradeShowDate = query.tradeShowDate;
    }

    // Delivery date range filter
    if (query.deliveryStartDate || query.deliveryEndDate) {
      whereCondition[Op.and] = whereCondition[Op.and] || [];
      if (query.deliveryStartDate) {
        whereCondition[Op.and].push({
          deliveryStartDate: { [Op.gte]: query.deliveryStartDate }
        });
      }
      if (query.deliveryEndDate) {
        whereCondition[Op.and].push({
          deliveryEndDate: { [Op.lte]: query.deliveryEndDate }
        });
      }
    }

    const { count: totalCount, rows: tradeShows } = await TradeShow.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: tradeShows,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updateTradeShow(id: number, body: Partial<{
    name: string;
    description: string | null;
    tradeShowDate: string;
    deliveryStartDate: string;
    deliveryEndDate: string;
    deliveryWeeks: number;
    status: string;
  }>) {
    const tradeShow = await TradeShow.findByPk(id);

    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    // Validate date ranges if dates are being updated
    if (body.deliveryStartDate && body.deliveryEndDate) {
      const deliveryStartDate = new Date(body.deliveryStartDate);
      const deliveryEndDate = new Date(body.deliveryEndDate);





      if (deliveryStartDate > deliveryEndDate) {
        throw new AppError('Delivery start date must be before or equal to delivery end date', 400);
      }
    } else if (body.deliveryStartDate) {
      const deliveryStartDate = new Date(body.deliveryStartDate);
      const deliveryEndDate = new Date(tradeShow.deliveryEndDate);

      if (deliveryStartDate > deliveryEndDate) {
        throw new AppError('Delivery start date must be before or equal to delivery end date', 400);
      }
    } else if (body.deliveryEndDate) {
      const deliveryStartDate = new Date(tradeShow.deliveryStartDate);
      const deliveryEndDate = new Date(body.deliveryEndDate);

      if (deliveryStartDate > deliveryEndDate) {
        throw new AppError('Delivery start date must be before or equal to delivery end date', 400);
      }
    }

    // Validate status if being updated
    if (body.status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(body.status)) {
        throw new AppError('Status must be either "active" or "inactive"', 400);
      }
    }

    // Validate deliveryWeeks if being updated
    if (body.deliveryWeeks !== undefined && body.deliveryWeeks < 0) {
      throw new AppError('Delivery weeks must be a non-negative number', 400);
    }

    // Create update object with proper types for Sequelize
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tradeShowDate !== undefined) updateData.tradeShowDate = body.tradeShowDate;
    if (body.deliveryStartDate !== undefined) updateData.deliveryStartDate = body.deliveryStartDate;
    if (body.deliveryEndDate !== undefined) updateData.deliveryEndDate = body.deliveryEndDate;
    if (body.deliveryWeeks !== undefined) updateData.deliveryWeeks = body.deliveryWeeks;
    if (body.status !== undefined) updateData.status = body.status;


    if (body.tradeShowDate !== undefined) {
      const existingTradeShow = await TradeShow.findOne({
        where: {
          tradeShowDate: body.tradeShowDate,
          isActive: true,
        },
      });
      if (existingTradeShow) {
        throw new AppError(`A trade show with the date ${body.tradeShowDate} already exists`, 400);
      }
    }
    await tradeShow.update(updateData);
    return tradeShow;
  }

  async deActiveTradeShow(id: number) {
    const tradeShow = await TradeShow.findByPk(id);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }
    await tradeShow.update({ status: 'expire' });
    return tradeShow;
  }

  async deleteTradeShow(id: number) {
    const tradeShow = await TradeShow.findByPk(id);

    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    await tradeShow.destroy();
    return { success: true, message: 'TradeShow deleted successfully' };
  }

  // TradeShowItem CRUD methods
  async createTradeShowItem(body: {
    tradeShowId: number;
    itemNumber: string;
    discount: string;
    description: string;
    salesCategory: number;
    priceClass: number;
    minQuantity: number;
    maxQuantity: number;
    vendorId: number;
    disType: "PERCENT" | "FLAT";
  }) {
    // Validate that TradeShow exists
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    // Validate quantity range
    if (body.minQuantity < 0) {
      throw new AppError('Minimum quantity must be a non-negative number', 400);
    }
    if (body.maxQuantity < 0) {
      throw new AppError('Maximum quantity must be a non-negative number', 400);
    }
    if (body.minQuantity > body.maxQuantity) {
      throw new AppError('Minimum quantity must be less than or equal to maximum quantity', 400);
    }

    // Validate discount
    const discountValue = parseFloat(body.discount);
    if (isNaN(discountValue) || discountValue < 0) {
      throw new AppError('Discount must be a valid non-negative number', 400);
    }

    // Validate discount type
    if (body.disType !== 'PERCENT' && body.disType !== 'FLAT') {
      throw new AppError('Discount type must be either "PERCENT" or "FLAT"', 400);
    }

    // Validate PERCENT discount range
    if (body.disType === 'PERCENT' && discountValue > 100) {
      throw new AppError('Percentage discount cannot exceed 100', 400);
    }

    try {
      const tradeShowItem = await TradeShowItem.create({
        tradeShowId: body.tradeShowId,
        itemNumber: body.itemNumber,
        discount: body.discount,
        description: body.description,
        salesCategory: body.salesCategory,
        priceClass: body.priceClass,
        minQuantity: body.minQuantity,
        maxQuantity: body.maxQuantity,
        vendorId: body.vendorId,
        disType: body.disType,
      });

      return tradeShowItem;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Item number already exists for this trade show', 409);
      }
      throw error;
    }
  }

  async createBulkTradeShowItems(body: {
    tradeShowId: number;
    items: BulkItemInput[];
  }) {
    // 1) Validate TradeShow exists
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) throw new AppError("TradeShow not found", 404);

    // 2) Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new AppError("Items array must contain at least one item", 400);
    }
    if (body.items.length > 100) {
      throw new AppError("Cannot create more than 100 items at once", 400);
    }

    // 3) Validate each item + normalize itemNumbers (trim)
    const validationErrors: string[] = [];
    const seen = new Set<string>();

    const normalizedItems = body.items.map((item, index) => {
      const itemNumber = (item.itemNumber ?? "").trim();

      if (!itemNumber) {
        validationErrors.push(`Item at index ${index}: Item number is required`);
      } else {
        const key = itemNumber.toUpperCase(); // choose one normalization; adjust if item numbers are case-sensitive in DB
        if (seen.has(key)) {
          validationErrors.push(
            `Item at index ${index}: Item number "${itemNumber}" is duplicated in the request`
          );
        }
        seen.add(key);
      }



      // discount
      const discountValue = Number.parseFloat(String(item.discount));
      if (!Number.isFinite(discountValue) || discountValue < 0) {
        validationErrors.push(
          `Item at index ${index}: Discount must be a valid non-negative number`
        );
      }

      // disType
      if (item.disType !== "PERCENT" && item.disType !== "FLAT") {
        validationErrors.push(
          `Item at index ${index}: Discount type must be either "PERCENT" or "FLAT"`
        );
      }

      if (item.disType === "PERCENT" && Number.isFinite(discountValue) && discountValue > 100) {
        validationErrors.push(
          `Item at index ${index}: Percentage discount cannot exceed 100`
        );
      }

      return {
        ...item,
        itemNumber,
        // keep original discount string, but ensure it’s consistent (optional)
        discount: String(item.discount),
      };
    });

    if (validationErrors.length) {
      throw new AppError(`Validation errors: ${validationErrors.join("; ")}`, 400);
    }

    const itemNumbers = normalizedItems.map((i) => i.itemNumber);

    // 4) Transaction + duplicate check + bulk insert
    return await postgresSequelize.transaction(async (transaction) => {
      // Correct where clause: use Op.in (your previous code was wrong)
      const existingItems = await TradeShowItem.findAll({
        attributes: ["itemNumber"],
        where: {
          tradeShowId: body.tradeShowId,
          itemNumber: { [Op.in]: itemNumbers },
        },
        transaction,
        lock: transaction.LOCK.UPDATE, // optional; helps reduce race conditions on some DBs
      });

      if (existingItems.length) {
        const existingItemNumbers = existingItems.map((x: any) => x.itemNumber).join(", ");
        throw new AppError(
          `Item number(s) already exist for this trade show: ${existingItemNumbers}`,
          409
        );
      }

      const itemsToCreate = normalizedItems.map((item) => ({
        tradeShowId: body.tradeShowId,
        itemNumber: item.itemNumber,
        discount: item.discount,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity,
        disType: item.disType,
        description: item.description,
        salesCategory: item.salesCategory,
        priceClass: item.priceClass,
        vendorId: item.vendorId,
      }));

      try {
        const createdItems = await TradeShowItem.bulkCreate(itemsToCreate, {
          transaction,
          returning: true,
          validate: true,
        });

        return {
          success: true,
          count: createdItems.length,
          items: createdItems,
        };
      } catch (err: any) {
        // If DB unique constraint exists, this catches race-condition duplicates too
        if (err?.name === "SequelizeUniqueConstraintError") {
          throw new AppError("One or more item numbers already exist for this trade show", 409);
        }
        throw err;
      }
    });
  }

  async getTradeShowItemById(id: number) {
    const tradeShowItem = await TradeShowItem.findByPk(id, {
      include: [{
        model: TradeShow,
        as: 'tradeShow',
        attributes: ['id', 'name', 'tradeShowDate', 'status'],
      }],
    });

    if (!tradeShowItem) {
      throw new AppError('TradeShowItem not found', 404);
    }

    return tradeShowItem;
  }

  async getAllTradeShowItems(query: PaginationOptions & {
    tradeShowId?: number;
    itemNumber?: string;
    disType?: "PERCENT" | "FLAT";
  }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const offset = (page - 1) * limit;

    const whereCondition: any = {};

    // Filter by tradeShowId
    if (query.tradeShowId) {
      whereCondition.tradeShowId = query.tradeShowId;
    }

    // Filter by itemNumber (partial match in itemNumber or description)
    if (query.itemNumber) {
      whereCondition[Op.or] = [
        { itemNumber: { [Op.iLike]: `%${query.itemNumber}%` } },
        { description: { [Op.iLike]: `%${query.itemNumber}%` } }
      ];
    }

    // Filter by discount type
    if (query.disType) {
      whereCondition.disType = query.disType;
    }

    const { count: totalCount, rows: tradeShowItems } = await TradeShowItem.findAndCountAll({
      where: whereCondition,
      include: [{
        model: TradeShow,
        as: 'tradeShow',
        attributes: ['id', 'name', 'tradeShowDate', 'status'],
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const finalData = await Promise.all(
      tradeShowItems.map(async (item) => {
        const inventory = await Inventory.findOne({
          where: {
            Item_Number: Number(item.itemNumber),
          },
          attributes: [
            'Item_Number',
            'Description',
            'Pack',
            'UOM',
            'Retail1',
            'Retail2',
            'Retail3',
          ],
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc', 'Sales_Category'],
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
              required: false,
            },
          ],
        });

        return {
          ...item.toJSON(),
          discount: item.discount.toString(),
          inventory: inventory || null,
        };
      })
    );

    return {
      data: finalData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updateTradeShowItem(id: number, body: Partial<{
    tradeShowId: number;
    itemNumber: string;
    discount: string;
    minQuantity: number;
    maxQuantity: number;
    disType: "PERCENT" | "FLAT";
  }>) {
    const tradeShowItem = await TradeShowItem.findByPk(id);

    if (!tradeShowItem) {
      throw new AppError('TradeShowItem not found', 404);
    }

    // Validate TradeShow exists if being updated
    if (body.tradeShowId !== undefined) {
      const tradeShow = await TradeShow.findByPk(body.tradeShowId);
      if (!tradeShow) {
        throw new AppError('TradeShow not found', 404);
      }
    }

    // Validate quantity range
    const minQuantity = body.minQuantity !== undefined ? body.minQuantity : tradeShowItem.minQuantity;
    const maxQuantity = body.maxQuantity !== undefined ? body.maxQuantity : tradeShowItem.maxQuantity;

    if (minQuantity < 0) {
      throw new AppError('Minimum quantity must be a non-negative number', 400);
    }
    if (maxQuantity < 0) {
      throw new AppError('Maximum quantity must be a non-negative number', 400);
    }
    if (minQuantity > maxQuantity) {
      throw new AppError('Minimum quantity must be less than or equal to maximum quantity', 400);
    }

    // Validate discount if being updated
    if (body.discount !== undefined) {
      const discountValue = parseFloat(body.discount);
      if (isNaN(discountValue) || discountValue < 0) {
        throw new AppError('Discount must be a valid non-negative number', 400);
      }

      const disType = body.disType !== undefined ? body.disType : tradeShowItem.disType;
      if (disType === 'PERCENT' && discountValue > 100) {
        throw new AppError('Percentage discount cannot exceed 100', 400);
      }
    }

    // Validate discount type
    if (body.disType !== undefined && body.disType !== 'PERCENT' && body.disType !== 'FLAT') {
      throw new AppError('Discount type must be either "PERCENT" or "FLAT"', 400);
    }

    // Create update object with proper types
    const updateData: any = {};
    if (body.tradeShowId !== undefined) updateData.tradeShowId = body.tradeShowId;
    if (body.itemNumber !== undefined) updateData.itemNumber = body.itemNumber;
    if (body.discount !== undefined) updateData.discount = body.discount;
    if (body.minQuantity !== undefined) updateData.minQuantity = body.minQuantity;
    if (body.maxQuantity !== undefined) updateData.maxQuantity = body.maxQuantity;
    if (body.disType !== undefined) updateData.disType = body.disType;

    try {
      await tradeShowItem.update(updateData);
      return tradeShowItem;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Item number already exists for this trade show', 409);
      }
      throw error;
    }
  }

  async updateBulkTradeShowItems(body: {
    items: Array<{
      id: number;
      tradeShowId?: number;
      itemNumber?: string;
      discount?: string;
      minQuantity?: number;
      maxQuantity?: number;
      disType?: "PERCENT" | "FLAT";
      description?: string;
      salesCategory?: number;
      priceClass?: number;
      vendorId?: number;
    }>;
  }) {
    // Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new AppError('Items array must contain at least one item', 400);
    }

    if (body.items.length > 100) {
      throw new AppError('Cannot update more than 100 items at once', 400);
    }

    // Validate and normalize items
    const validationErrors: string[] = [];
    const seen = new Set<number>();
    const itemIds: number[] = [];

    body.items.forEach((item, index) => {
      // Check if id exists and is valid
      if (item.id === undefined || item.id === null) {
        validationErrors.push(`Item at index ${index}: id is required`);
        return;
      }

      const id = Number(item.id);
      if (!Number.isFinite(id) || id <= 0 || !Number.isInteger(id)) {
        validationErrors.push(`Item at index ${index}: id must be a valid positive integer`);
        return;
      }

      // Check for duplicates in the request
      if (seen.has(id)) {
        validationErrors.push(`Item at index ${index}: Item ID ${id} is duplicated in the request`);
        return;
      }

      seen.add(id);
      itemIds.push(id);

      // Only validate fields that are actually being updated
      // Validate quantity range if both are provided
      if (item.minQuantity !== undefined && item.maxQuantity !== undefined) {
        if (item.minQuantity < 0 || item.maxQuantity < 0) {
          validationErrors.push(`Item at index ${index}: Quantities must be non-negative`);
        } else if (item.minQuantity > item.maxQuantity) {
          validationErrors.push(`Item at index ${index}: Minimum quantity must be less than or equal to maximum quantity`);
        }
      }

      // Validate individual quantities if only one is provided
      if (item.minQuantity !== undefined && item.minQuantity < 0) {
        validationErrors.push(`Item at index ${index}: Minimum quantity must be non-negative`);
      }
      if (item.maxQuantity !== undefined && item.maxQuantity < 0) {
        validationErrors.push(`Item at index ${index}: Maximum quantity must be non-negative`);
      }

      // Validate discount if provided
      if (item.discount !== undefined) {
        const discountValue = parseFloat(item.discount);
        if (isNaN(discountValue) || discountValue < 0) {
          validationErrors.push(`Item at index ${index}: Discount must be a valid non-negative number`);
        }
        // Note: PERCENT validation will be done after fetching current disType
      }

      // Validate discount type
      if (item.disType !== undefined && item.disType !== 'PERCENT' && item.disType !== 'FLAT') {
        validationErrors.push(`Item at index ${index}: Discount type must be either "PERCENT" or "FLAT"`);
      }
    });

    if (validationErrors.length > 0) {
      throw new AppError(`Validation errors: ${validationErrors.join('; ')}`, 400);
    }

    // Use transaction for bulk update
    const transaction = await postgresSequelize.transaction();

    try {
      // Fetch all items to update
      const itemsToUpdate = await TradeShowItem.findAll({
        where: { id: { [Op.in]: itemIds } },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (itemsToUpdate.length !== itemIds.length) {
        const foundIds = new Set(itemsToUpdate.map(item => item.id));
        const missingIds = itemIds.filter(id => !foundIds.has(id));
        throw new AppError(`The following item IDs do not exist: ${missingIds.join(', ')}`, 404);
      }

      // Create a map for quick lookup
      const itemMap = new Map(itemsToUpdate.map(item => [item.id, item]));

      // Validate TradeShow exists if any item is updating tradeShowId
      const tradeShowIdsToCheck = new Set<number>();
      body.items.forEach(item => {
        if (item.tradeShowId !== undefined) {
          tradeShowIdsToCheck.add(item.tradeShowId);
        } else {
          const existingItem = itemMap.get(item.id!);
          if (existingItem) {
            tradeShowIdsToCheck.add(existingItem.tradeShowId);
          }
        }
      });

      if (tradeShowIdsToCheck.size > 0) {
        const tradeShows = await TradeShow.findAll({
          where: { id: { [Op.in]: Array.from(tradeShowIdsToCheck) } },
          transaction,
        });

        if (tradeShows.length !== tradeShowIdsToCheck.size) {
          const foundTradeShowIds = new Set(tradeShows.map(ts => ts.id));
          const missingTradeShowIds = Array.from(tradeShowIdsToCheck).filter(id => !foundTradeShowIds.has(id));
          throw new AppError(`The following trade show IDs do not exist: ${missingTradeShowIds.join(', ')}`, 404);
        }
      }

      // Update each item - only update fields that are provided
      const updatePromises = body.items.map(async (itemData) => {
        const item = itemMap.get(itemData.id!);
        if (!item) return null;

        // Get current values for cross-field validation
        const currentMinQuantity = item.minQuantity;
        const currentMaxQuantity = item.maxQuantity;
        const currentDisType = item.disType;

        // Validate quantity range with current values (only if both quantities are being checked)
        const minQuantity = itemData.minQuantity !== undefined ? itemData.minQuantity : currentMinQuantity;
        const maxQuantity = itemData.maxQuantity !== undefined ? itemData.maxQuantity : currentMaxQuantity;

        // Only validate if at least one quantity is being updated
        if (itemData.minQuantity !== undefined || itemData.maxQuantity !== undefined) {
          if (minQuantity < 0 || maxQuantity < 0) {
            throw new AppError(`Item ID ${itemData.id}: Quantities must be non-negative`, 400);
          }
          if (minQuantity > maxQuantity) {
            throw new AppError(`Item ID ${itemData.id}: Minimum quantity must be less than or equal to maximum quantity`, 400);
          }
        }

        // Validate discount with current disType if discount is being updated
        if (itemData.discount !== undefined) {
          const discountValue = parseFloat(itemData.discount);
          if (isNaN(discountValue) || discountValue < 0) {
            throw new AppError(`Item ID ${itemData.id}: Discount must be a valid non-negative number`, 400);
          }

          // Use provided disType or current disType for validation
          const disType = itemData.disType !== undefined ? itemData.disType : currentDisType;
          if (disType === 'PERCENT' && discountValue > 100) {
            throw new AppError(`Item ID ${itemData.id}: Percentage discount cannot exceed 100`, 400);
          }
        }

        // Build update data - only include fields that are explicitly provided (not undefined)
        const updateData: any = {};
        if (itemData.tradeShowId !== undefined && itemData.tradeShowId !== null) {
          updateData.tradeShowId = itemData.tradeShowId;
        }
        if (itemData.itemNumber !== undefined && itemData.itemNumber !== null) {
          updateData.itemNumber = itemData.itemNumber;
        }
        if (itemData.discount !== undefined && itemData.discount !== null) {
          updateData.discount = itemData.discount;
        }
        if (itemData.minQuantity !== undefined && itemData.minQuantity !== null) {
          updateData.minQuantity = itemData.minQuantity;
        }
        if (itemData.maxQuantity !== undefined && itemData.maxQuantity !== null) {
          updateData.maxQuantity = itemData.maxQuantity;
        }
        if (itemData.disType !== undefined && itemData.disType !== null) {
          updateData.disType = itemData.disType;
        }
        if (itemData.description !== undefined && itemData.description !== null) {
          updateData.description = itemData.description;
        }
        if (itemData.salesCategory !== undefined && itemData.salesCategory !== null) {
          updateData.salesCategory = itemData.salesCategory;
        }
        if (itemData.priceClass !== undefined && itemData.priceClass !== null) {
          updateData.priceClass = itemData.priceClass;
        }
        if (itemData.vendorId !== undefined && itemData.vendorId !== null) {
          updateData.vendorId = itemData.vendorId;
        }

        // Only update if there are fields to update
        if (Object.keys(updateData).length > 0) {
          await item.update(updateData, { transaction });
        }

        // Reload to get updated values
        await item.reload({ transaction });
        return item;
      });

      const updatedItems = await Promise.all(updatePromises);
      const successfulUpdates = updatedItems.filter(item => item !== null);

      await transaction.commit();

      return {
        success: true,
        count: successfulUpdates.length,
        items: successfulUpdates,
      };
    } catch (error: any) {
      await transaction.rollback();

      if (error instanceof AppError) {
        throw error;
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('One or more item numbers already exist for their respective trade shows', 409);
      }

      throw new AppError(`Failed to update trade show items: ${error.message}`, 500);
    }
  }

  async deleteTradeShowItem(id: number) {
    const tradeShowItem = await TradeShowItem.findByPk(id);

    if (!tradeShowItem) {
      throw new AppError('TradeShowItem not found', 404);
    }

    await tradeShowItem.destroy();
    return { success: true, message: 'TradeShowItem deleted successfully' };
  }

  // TradeShowRetailer CRUD methods
  async createTradeShowRetailer(body: {
    tradeShowId: number;
    retailerId: number;
  }) {
    // Validate that TradeShow exists
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    // Validate that Retailer exists and get name
    const retailer = await Customer.findOne({
      where: { C_Number: body.retailerId },
      attributes: ['C_Number', 'C_Name'],
    });

    if (!retailer) {
      throw new AppError('Retailer not found', 404);
    }

    try {
      const tradeShowRetailer = await TradeShowRetailer.create({
        tradeShowId: body.tradeShowId,
        retailerId: body.retailerId,
        retailerName: retailer.C_Name || '',
      });

      return tradeShowRetailer;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Retailer is already associated with this trade show', 409);
      }
      throw error;
    }
  }

  async createBulkTradeShowRetailers(body: {
    tradeShowId: number;
    retailerIds: Array<{ id: number; name: string }>;
  }) {
    // Validate that TradeShow exists
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    // Validate retailerIds array
    if (!Array.isArray(body.retailerIds) || body.retailerIds.length === 0) {
      throw new AppError('Retailer IDs array must contain at least one retailer', 400);
    }

    if (body.retailerIds.length > 100) {
      throw new AppError('Cannot create more than 100 associations at once', 400);
    }

    // Validate and normalize retailer data
    const validationErrors: string[] = [];
    const seen = new Set<number>();
    const normalizedRetailerIds: number[] = [];

    body.retailerIds.forEach((retailer, index) => {
      // Check if id exists and is valid
      if (retailer.id === undefined || retailer.id === null) {
        validationErrors.push(`Retailer at index ${index}: id is required`);
        return;
      }

      const id = Number(retailer.id);
      if (!Number.isFinite(id) || id <= 0 || !Number.isInteger(id)) {
        validationErrors.push(`Retailer at index ${index}: id must be a valid positive integer`);
        return;
      }

      // Check for duplicates in the request
      if (seen.has(id)) {
        validationErrors.push(`Retailer at index ${index}: Retailer ID ${id} is duplicated in the request`);
        return;
      }

      // Validate name
      if (!retailer.name || typeof retailer.name !== 'string' || retailer.name.trim() === '') {
        validationErrors.push(`Retailer at index ${index}: name is required and must be a non-empty string`);
        return;
      }

      seen.add(id);
      normalizedRetailerIds.push(id);
    });

    if (validationErrors.length > 0) {
      throw new AppError(`Validation errors: ${validationErrors.join('; ')}`, 400);
    }

    // Validate that all retailers exist in the database and get their names
    const existingRetailers = await Customer.findAll({
      where: { C_Number: { [Op.in]: normalizedRetailerIds } },
      attributes: ['C_Number', 'C_Name'],
    });

    const existingRetailerMap = new Map(existingRetailers.map(r => [r.C_Number, r.C_Name || '']));
    const missingRetailerIds = normalizedRetailerIds.filter(id => !existingRetailerMap.has(id));

    if (missingRetailerIds.length > 0) {
      throw new AppError(`The following retailer IDs do not exist: ${missingRetailerIds.join(', ')}`, 404);
    }

    // Use transaction for bulk insert
    const transaction = await postgresSequelize.transaction();

    try {
      // Prepare associations for bulk insert with retailer names
      const associationsToCreate = normalizedRetailerIds.map(retailerId => ({
        tradeShowId: body.tradeShowId,
        retailerId: retailerId,
        retailerName: existingRetailerMap.get(retailerId) || '',
      }));

      // Bulk create
      const createdAssociations = await TradeShowRetailer.bulkCreate(associationsToCreate, {
        transaction,
        returning: true,
      });

      await transaction.commit();

      return {
        success: true,
        count: createdAssociations.length,
        associations: createdAssociations,
      };
    } catch (error: any) {
      await transaction.rollback();

      if (error instanceof AppError) {
        throw error;
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('One or more retailers are already associated with this trade show', 409);
      }

      throw new AppError(`Failed to create trade show retailer associations: ${error.message}`, 500);
    }
  }

  async getTradeShowRetailerById(id: number) {
    const tradeShowRetailer = await TradeShowRetailer.findByPk(id, {
      include: [
        {
          model: TradeShow,
          as: 'tradeShow',
          attributes: ['id', 'name', 'tradeShowDate', 'status'],
        },
      ],
    });

    if (!tradeShowRetailer) {
      throw new AppError('TradeShowRetailer not found', 404);
    }

    return tradeShowRetailer;
  }

  async getAllTradeShowRetailers(
    query: PaginationOptions & { tradeShowId?: number; retailerId?: number }
  ) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const offset = (page - 1) * limit;

    const whereCondition: any = {};

    if (query.search) {
      whereCondition[Op.or] = [
        { retailerName: { [Op.iLike]: `%${query.search}%` } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col('retailerId'), 'TEXT'),
          { [Op.iLike]: `%${query.search}%` }
        ),
      ];
    }
    if (query.tradeShowId) whereCondition.tradeShowId = query.tradeShowId;
    if (query.retailerId) whereCondition.retailerId = query.retailerId;

    const { count: totalCount, rows: tradeShowRetailers } =
      await TradeShowRetailer.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: TradeShow,
            as: "tradeShow",
            attributes: ["id", "name", "tradeShowDate", "status"],
          },
        ],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

    const finalData = await Promise.all(
      tradeShowRetailers.map(async (tradeShowRetailer: any) => {
        const retailer = await Customer.findOne({
          where: { C_Number: tradeShowRetailer.retailerId },
          attributes: [
            "C_Number",
            "C_Name",
            "C_Email",
            "C_Phone",
            "C_Address",
            "C_City",
            "C_State",
            "C_Zip",
            "C_Fax",
            "C_Salesman",
            "C_StatementAccount",
            "C_Interest",
            "C_StatementCode",
            "C_ClassOfTrade",
          ],
          include: [
            {
              model: SalesRep,
              as: "salesRep",
              attributes: ["S_Desc"],
            },
          ],
        });

        return {
          ...tradeShowRetailer.toJSON(),
          retailer: retailer ? retailer.toJSON() : null,
        };
      })
    );

    return {
      data: finalData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }


  async updateTradeShowRetailer(id: number, body: Partial<{
    tradeShowId: number;
    retailerId: number;
  }>) {
    const tradeShowRetailer = await TradeShowRetailer.findByPk(id);

    if (!tradeShowRetailer) {
      throw new AppError('TradeShowRetailer not found', 404);
    }

    // Validate TradeShow exists if being updated
    if (body.tradeShowId !== undefined) {
      const tradeShow = await TradeShow.findByPk(body.tradeShowId);
      if (!tradeShow) {
        throw new AppError('TradeShow not found', 404);
      }
    }

    // Validate Retailer exists if being updated
    if (body.retailerId !== undefined) {
      const retailer = await Retailer.findByPk(body.retailerId);
      if (!retailer) {
        throw new AppError('Retailer not found', 404);
      }
    }

    // Create update object
    const updateData: any = {};
    if (body.tradeShowId !== undefined) updateData.tradeShowId = body.tradeShowId;
    if (body.retailerId !== undefined) updateData.retailerId = body.retailerId;

    try {
      await tradeShowRetailer.update(updateData);
      return tradeShowRetailer;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Retailer is already associated with this trade show', 409);
      }
      throw error;
    }
  }

  async deleteTradeShowRetailer(id: number) {
    const tradeShowRetailer = await TradeShowRetailer.findByPk(id);

    if (!tradeShowRetailer) {
      throw new AppError('TradeShowRetailer not found', 404);
    }

    await tradeShowRetailer.destroy();
    return { success: true, message: 'TradeShowRetailer deleted successfully' };
  }

  // TradeShowVendor CRUD methods
  async createTradeShowVendor(body: {
    tradeShowId: number;
    vendorId: number;
  }) {
    // Validate that TradeShow exists
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    // Validate that Vendor exists
    const vendor = await Vendor.findByPk(body.vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    try {
      const tradeShowVendor = await TradeShowVendor.create({
        tradeShowId: body.tradeShowId,
        vendorId: body.vendorId,
        vendorName: vendor.V_Description || '',
      });

      return tradeShowVendor;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Vendor is already associated with this trade show', 409);
      }
      throw error;
    }
  }

  async createBulkTradeShowVendors(body: {
    tradeShowId: number;
    vendorIds: Array<{ Primary_Vendor: number; V_Description: string }>;
  }) {
    // Validate that TradeShow exists
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    // Validate vendorIds array
    if (!Array.isArray(body.vendorIds) || body.vendorIds.length === 0) {
      throw new AppError('Vendor IDs array must contain at least one vendor', 400);
    }

    if (body.vendorIds.length > 100) {
      throw new AppError('Cannot create more than 100 associations at once', 400);
    }

    // Validate and normalize vendor data
    const validationErrors: string[] = [];
    const seen = new Set<number>();
    const normalizedVendors: Array<{ vendorId: number; vendorName: string }> = [];

    body.vendorIds.forEach((vendor, index) => {
      // Check if Primary_Vendor exists and is valid
      if (vendor.Primary_Vendor === undefined || vendor.Primary_Vendor === null) {
        validationErrors.push(`Vendor at index ${index}: Primary_Vendor is required`);
        return;
      }

      const id = Number(vendor.Primary_Vendor);
      if (!Number.isFinite(id) || id <= 0 || !Number.isInteger(id)) {
        validationErrors.push(`Vendor at index ${index}: Primary_Vendor must be a valid positive integer`);
        return;
      }

      // Check for duplicates in the request
      if (seen.has(id)) {
        validationErrors.push(`Vendor at index ${index}: Vendor ID ${id} is duplicated in the request`);
        return;
      }

      // // Validate V_Description
      // if (!vendor.V_Description || typeof vendor.V_Description !== 'string' || vendor.V_Description.trim() === '') {
      //   validationErrors.push(`Vendor at index ${index}: V_Description is required and must be a non-empty string`);
      //   return;
      // }

      seen.add(id);
      normalizedVendors.push({
        vendorId: id,
        vendorName: vendor.V_Description.trim(),
      });
    });

    if (validationErrors.length > 0) {
      throw new AppError(`Validation errors: ${validationErrors.join('; ')}`, 400);
    }

    // Validate that all vendors exist in the database
    const vendorIdsToCheck = normalizedVendors.map(v => v.vendorId);
    const existingVendors = await Vendor.findAll({
      where: { Primary_Vendor: { [Op.in]: vendorIdsToCheck } },
      attributes: ['Primary_Vendor'],
    });

    const existingVendorIds = new Set(existingVendors.map(v => v.Primary_Vendor));
    const missingVendorIds = vendorIdsToCheck.filter(id => !existingVendorIds.has(id));

    if (missingVendorIds.length > 0) {
      throw new AppError(`The following vendor IDs do not exist: ${missingVendorIds.join(', ')}`, 404);
    }

    // Use transaction for bulk insert
    const transaction = await postgresSequelize.transaction();

    try {
      // Prepare associations for bulk insert
      const associationsToCreate = normalizedVendors.map(vendor => ({
        tradeShowId: body.tradeShowId,
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
      }));

      // Bulk create
      const createdAssociations = await TradeShowVendor.bulkCreate(associationsToCreate, {
        transaction,
        returning: true,
      });

      await transaction.commit();

      return {
        success: true,
        count: createdAssociations.length,
        associations: createdAssociations,
      };
    } catch (error: any) {
      await transaction.rollback();

      if (error instanceof AppError) {
        throw error;
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('One or more vendors are already associated with this trade show', 409);
      }

      throw new AppError(`Failed to create trade show vendor associations: ${error.message}`, 500);
    }
  }

  async getTradeShowVendorById(id: number) {
    const tradeShowVendor = await TradeShowVendor.findByPk(id, {
      include: [
        {
          model: TradeShow,
          as: 'tradeShow',
          attributes: ['id', 'name', 'tradeShowDate', 'status'],
        },
      ],
    });

    if (!tradeShowVendor) {
      throw new AppError('TradeShowVendor not found', 404);
    }

    return tradeShowVendor;
  }

  async getAllTradeShowVendors(
    query: PaginationOptions & { tradeShowId?: number; vendorId?: number; search?: string }
  ) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const offset = (page - 1) * limit;
    const search = query.search || '';


    const whereCondition: any = {};
    if (search) {
      whereCondition[Op.or] = [
        { vendorName: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(
          Sequelize.cast(Sequelize.col('vendorId'), 'TEXT'),
          { [Op.iLike]: `%${search}%` }
        ),
      ];
    }

    if (query.tradeShowId) whereCondition.tradeShowId = query.tradeShowId;
    if (query.vendorId) whereCondition.vendorId = query.vendorId;

    const { count: totalCount, rows: tradeShowVendors } =
      await TradeShowVendor.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: TradeShow,
            as: "tradeShow",
            attributes: ["id", "name", "tradeShowDate", "status"],
          },
        ],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

    const finalData = await Promise.all(
      tradeShowVendors.map(async (tradeShowVendor: any) => {
        const vendor = await Vendor.findOne({
          where: { Primary_Vendor: tradeShowVendor.vendorId },
          attributes: [
            "Primary_Vendor",
            "V_Description",
            "V_Email",
            "V_Phone",
            "V_Addr1",
            "V_City",
            "V_State",
            "V_Zip",
            "V_Fax",
            "V_Status",
          ],
        });

        return {
          ...tradeShowVendor.toJSON(),
          vendor: vendor ? vendor.toJSON() : null,
        };
      })
    );

    return {
      data: finalData,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }


  async updateTradeShowVendor(id: number, body: Partial<{
    tradeShowId: number;
    vendorId: number;
  }>) {
    const tradeShowVendor = await TradeShowVendor.findByPk(id);

    if (!tradeShowVendor) {
      throw new AppError('TradeShowVendor not found', 404);
    }

    // Validate TradeShow exists if being updated
    if (body.tradeShowId !== undefined) {
      const tradeShow = await TradeShow.findByPk(body.tradeShowId);
      if (!tradeShow) {
        throw new AppError('TradeShow not found', 404);
      }
    }

    // Validate Vendor exists if being updated and get vendor name
    let vendorName: string | undefined;
    if (body.vendorId !== undefined) {
      const vendor = await Vendor.findByPk(body.vendorId);
      if (!vendor) {
        throw new AppError('Vendor not found', 404);
      }
      vendorName = vendor.V_Description || '';
    }

    // Create update object
    const updateData: any = {};
    if (body.tradeShowId !== undefined) updateData.tradeShowId = body.tradeShowId;
    if (body.vendorId !== undefined) {
      updateData.vendorId = body.vendorId;
      if (vendorName !== undefined) {
        updateData.vendorName = vendorName;
      }
    }

    try {
      await tradeShowVendor.update(updateData);
      return tradeShowVendor;
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Vendor is already associated with this trade show', 409);
      }
      throw error;
    }
  }

  async deleteTradeShowVendor(id: number) {
    const tradeShowVendor = await TradeShowVendor.findByPk(id);

    console.log(tradeShowVendor, 'the tradeSHow');

    if (!tradeShowVendor) {
      throw new AppError('TradeShowVendor not found', 404);
    }

    await tradeShowVendor.destroy();
    let vendorId = tradeShowVendor?.dataValues.vendorId;
    await TradeShowItem.destroy({
      where: {
        tradeShowId: tradeShowVendor.tradeShowId,
        vendorId: vendorId,
      },
    });

    await TradeShowDeliveryProduct.destroy({
      where: {
        tradeShowId: tradeShowVendor.tradeShowId,
        vendorId: vendorId,
      },
    })
    return { success: true, message: 'TradeShowVendor deleted successfully' };
  }

  // TradeShowDeliveryProduct CRUD methods
  async createTradeShowDeliveryProduct(body: {
    tradeShowId: number;
    itemNumber: string;
    weekNumber: number;
    vendorId: number;
    startDate: string;
    endDate: string;
    deliveryType: "pickup" | "delivery";
  }) {
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    if (!Number.isInteger(body.weekNumber) || body.weekNumber < 1) {
      throw new AppError('weekNumber must be a positive integer', 400);
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('startDate and endDate must be valid dates', 400);
    }

    if (startDate > endDate) {
      throw new AppError('startDate must be before or equal to endDate', 400);
    }

    if (body.deliveryType !== 'pickup' && body.deliveryType !== 'delivery') {
      throw new AppError('deliveryType must be either "pickup" or "delivery"', 400);
    }

    try {
      const record = await TradeShowDeliveryProduct.create({
        tradeShowId: body.tradeShowId,
        itemNumber: body.itemNumber,
        weekNumber: body.weekNumber,
        startDate: body.startDate as any,
        endDate: body.endDate as any,
        deliveryType: body.deliveryType,
        vendorId: body.vendorId,
      });

      return record;
    } catch (error: any) {
      throw error;
    }
  }

  async createBulkTradeShowDeliveryProducts(body: {
    tradeShowId: number;
    deliveries: {
      itemNumber: string;
      weekNumber: number;
      startDate: string;
      vendorId: number;
      endDate: string;
      deliveryType: "pickup" | "delivery";
    }[];
  }) {
    // Validate TradeShow exists
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError("TradeShow not found", 404);
    }

    // Validate deliveries array
    if (!Array.isArray(body.deliveries) || body.deliveries.length === 0) {
      throw new AppError("Deliveries array must contain at least one entry", 400);
    }
    if (body.deliveries.length > 100) {
      throw new AppError("Cannot create more than 100 deliveries at once", 400);
    }

    const validationErrors: string[] = [];

    const normalizedDeliveries = body.deliveries.map((delivery, index) => {
      const itemNumber = delivery.itemNumber;

      if (!itemNumber) {
        validationErrors.push(`Delivery at index ${index}: itemNumber is required`);
      }

      if (!Number.isInteger(delivery.weekNumber) || delivery.weekNumber < 1) {
        validationErrors.push(
          `Delivery at index ${index}: weekNumber must be a positive integer`
        );
      }

      const startDate = new Date(delivery.startDate);
      const endDate = new Date(delivery.endDate);

      if (isNaN(startDate.getTime())) {
        validationErrors.push(
          `Delivery at index ${index}: startDate must be a valid date`
        );
      }
      if (isNaN(endDate.getTime())) {
        validationErrors.push(
          `Delivery at index ${index}: endDate must be a valid date`
        );
      }
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate > endDate) {
        validationErrors.push(
          `Delivery at index ${index}: startDate must be before or equal to endDate`
        );
      }

      if (
        delivery.deliveryType !== "pickup" &&
        delivery.deliveryType !== "delivery"
      ) {
        validationErrors.push(
          `Delivery at index ${index}: deliveryType must be either "pickup" or "delivery"`
        );
      }

      return {
        ...delivery,
        itemNumber,
      };
    });

    if (validationErrors.length) {
      throw new AppError(`Validation errors: ${validationErrors.join("; ")}`, 400);
    }

    // Bulk insert in a transaction
    return await postgresSequelize.transaction(async (transaction) => {
      const toCreate = normalizedDeliveries.map((delivery) => ({
        tradeShowId: body.tradeShowId,
        itemNumber: delivery.itemNumber,
        weekNumber: delivery.weekNumber,
        startDate: delivery.startDate as any,
        vendorId: delivery.vendorId,
        endDate: delivery.endDate as any,
        deliveryType: delivery.deliveryType,
      }));

      const created = await TradeShowDeliveryProduct.bulkCreate(toCreate, {
        transaction,
        returning: true,
      });

      return {
        success: true,
        count: created.length,
        deliveries: created,
      };
    });
  }

  async getTradeShowDeliveryProductById(id: number) {
    const record = await TradeShowDeliveryProduct.findByPk(id, {
      include: [
        {
          model: TradeShow,
          as: 'tradeShow',
          attributes: ['id', 'name', 'tradeShowDate', 'status'],
        },
      ],
    });

    if (!record) {
      throw new AppError('TradeShowDeliveryProduct not found', 404);
    }

    return record;
  }

  async getAllTradeShowDeliveryProducts(
    query: PaginationOptions & {
      tradeShowId?: number;
      itemNumber?: string;
      weekNumber?: number;
      deliveryType?: "pickup" | "delivery";
    }
  ) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const offset = (page - 1) * limit;

    const where: any = {};


    if (query.tradeShowId) where.tradeShowId = query.tradeShowId;
    if (query.itemNumber) where.itemNumber = query.itemNumber;
    if (query.weekNumber) where.weekNumber = query.weekNumber;
    if (query.deliveryType) where.deliveryType = query.deliveryType;

    const { count: total, rows } = await TradeShowDeliveryProduct.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: TradeShow,
          as: 'tradeShow',
          attributes: ['id', 'name', 'tradeShowDate', 'status'],
        },
      ],
    });


    const finalData = await Promise.all(
      rows.map(async (row: any) => {
        const item = await Inventory.findOne({
          where: {
            Item_Number: row.itemNumber,
          },
          attributes: [
            'Item_Number',
            'Description',
            'Pack',
            'UOM',
            'Retail1',
            'Retail2',
            'Retail3',
          ],
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc', 'Sales_Category'],
              required: false,
            },
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: ['Class_Desc'],
              required: false,
            },
          ],
        });
        return {
          ...row.toJSON(),
          item: item ? item.toJSON() : null,
        };
      })
    );

    return {
      data: finalData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }





  async getRemainItemInDelivery(query: PaginationOptions) {
    let { page = 1, limit = 10, salesCategory, priceClass, tradeShowId } = query;
    tradeShowId = Number(tradeShowId);
    page = parseInt(page as any) || 1;
    limit = parseInt(limit as any) || 10;
    const offset = (page - 1) * limit;

    let whereCondition: any = {};

    if (salesCategory?.length > 0) {
      const salesCategoryNumbers = salesCategory.map((v: any) => Number(v));
      whereCondition.salesCategory = { [Op.in]: salesCategoryNumbers };
    }
    if (priceClass?.length > 0) {
      const priceClassNumbers = priceClass.map((v: any) => Number(v));
      whereCondition.priceClass = { [Op.in]: priceClassNumbers };
    }

    const tradeShow = await TradeShowDeliveryProduct.findAll({
      where: {
        tradeShowId: tradeShowId,
      },
      attributes: ['itemNumber'],
    });

    const itemInDelivery = tradeShow.map((item: any) => item.itemNumber);

    const { rows: items, count: total } = await TradeShowItem.findAndCountAll({
      where: {
        tradeShowId: tradeShowId,
        itemNumber: {
          [Op.notIn]: itemInDelivery,
        },
        ...whereCondition,
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],

    });

    const finalData = await Promise.all(
      items.map(async (item: any) => {
        const inventory = await Inventory.findOne({
          where: {
            Item_Number: item.itemNumber,
          },
          attributes: [
            'Item_Number',
            'Description',
            'Pack',
            'UOM',
            'Retail1',
            'Retail2',
            'Retail3',
          ],
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc', 'Sales_Category'],
              required: false,
            },
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: ['Class_Desc'],
              required: false,
            },
          ],
        });
        return {
          ...item.toJSON(),
          inventory: inventory ? inventory.toJSON() : null,
        };
      })
    );

    return {
      data: finalData,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateTradeShowDeliveryProduct(
    id: number,
    body: Partial<{
      tradeShowId: number;
      itemNumber: string;
      weekNumber: number;
      startDate: string;
      endDate: string;
      deliveryType: "pickup" | "delivery";
    }>
  ) {
    const record = await TradeShowDeliveryProduct.findByPk(id);

    if (!record) {
      throw new AppError('TradeShowDeliveryProduct not found', 404);
    }

    if (body.tradeShowId !== undefined) {
      const tradeShow = await TradeShow.findByPk(body.tradeShowId);
      if (!tradeShow) {
        throw new AppError('TradeShow not found', 404);
      }
    }

    if (body.weekNumber !== undefined) {
      if (!Number.isInteger(body.weekNumber) || body.weekNumber < 1) {
        throw new AppError('weekNumber must be a positive integer', 400);
      }
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (body.startDate !== undefined) {
      startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) {
        throw new AppError('startDate must be a valid date', 400);
      }
    }

    if (body.endDate !== undefined) {
      endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        throw new AppError('endDate must be a valid date', 400);
      }
    }

    if (startDate && endDate && startDate > endDate) {
      throw new AppError('startDate must be before or equal to endDate', 400);
    }

    if (body.deliveryType !== undefined) {
      if (body.deliveryType !== 'pickup' && body.deliveryType !== 'delivery') {
        throw new AppError('deliveryType must be either "pickup" or "delivery"', 400);
      }
    }

    const updateData: any = {};
    if (body.tradeShowId !== undefined) updateData.tradeShowId = body.tradeShowId;
    if (body.itemNumber !== undefined) updateData.itemNumber = body.itemNumber;
    if (body.weekNumber !== undefined) updateData.weekNumber = body.weekNumber;
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.endDate !== undefined) updateData.endDate = body.endDate;
    if (body.deliveryType !== undefined) updateData.deliveryType = body.deliveryType;

    await record.update(updateData);
    return record;
  }

  async deleteTradeShowDeliveryProduct(id: number) {
    const record = await TradeShowDeliveryProduct.findByPk(id);

    if (!record) {
      throw new AppError('TradeShowDeliveryProduct not found', 404);
    }

    await record.destroy();
    return { success: true, message: 'TradeShowDeliveryProduct deleted successfully' };
  }

  async getArStatementReport(filters: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, page = 1, limit, } = filters;
    const offset = limit ? (page - 1) * limit : undefined;

    /** Date Filter */
    // const where: any = {};
    // if (startDate && endDate) {
    //   where.AR_Date = {
    //     [Op.between]: [new Date(startDate), new Date(endDate)],
    //   };
    // }
    const where: any = {};

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    if (start || end) {
      where.AR_Date = {
        ...(start && { [Op.gte]: start }),
        ...(end && { [Op.lte]: end }),
      };
    }

    const { rows, count } = await CustReceivables.findAndCountAll({
      distinct: true,
      where,
      limit,
      offset,

      order: [
        [{ model: Customer, as: 'customer' }, 'C_Name', 'ASC'],
        ['AR_Date', 'ASC'],
        ['P_Number', 'ASC'],
      ],

      attributes: {
        include: [
          /** Child Customer Name */
          [
            Sequelize.literal(`
            ISNULL(
              (
                SELECT C_Name
                FROM Customer
                WHERE Customer.C_Number = [CustReceivables].[C_Number_Child]
              ),
              ''
            )
          `),
            'C_Name_Child',
          ],

          /** Finance Charges */
          [
            Sequelize.literal(`
            ISNULL(
              (
                SELECT SUM(Finance_Charge)
                FROM Cust_FinanceCharges
                WHERE Cust_FinanceCharges.C_Number = [CustReceivables].[C_Number]
              ),
              0
            )
          `),
            'fCharge',
          ],
        ],
      },

      include: [
        {
          model: Customer,
          as: 'customer',
          required: false,
          attributes: [
            'C_Name',
            'C_CoName',
            'C_Address',
            'C_City',
            'C_State',
            'C_Zip',
            'C_Phone',
            'C_Fax',
            'C_Email',
            'TermsCode',
            'C_Salesman',
            'C_StatementAccount',
            'C_StatusCode',
            'C_StatementCode',
            'C_Interest',

          ],

          include: [
            {
              model: SalesRep,
              as: 'salesRep',
              required: false,
              attributes: [['S_Desc', 'RepName']],
            },
            {
              model: Terms,
              as: 'invoiceTerms',
              required: false,
              attributes: ['Terms', 'DaysUntilDue'],
            },
            {
              model: CustBillTo,
              as: 'billTo',
              required: false,
              attributes: [
                ['C_Number', 'BT_Number'],
                ['C_Name', 'BT_Name'],
                ['C_CoName', 'BT_CoName'],
                ['C_Address', 'BT_Address'],
                ['C_City', 'BT_City'],
                ['C_State', 'BT_State'],
                ['C_Zip', 'BT_Zip'],
              ],
            },
            {
              model: CustomerRoute,
              as: 'routes',
              required: false,
              attributes: ['Route_Number'],
            },
          ],
        },

        {
          model: ARDefinitions,
          as: 'arDefinition',
          required: false,
          attributes: [['AR_SubTypeRef', 'SubType']],
          where: Sequelize.literal(`
          [CustReceivables].[AR_Type] = [arDefinition].[AR_Type]
        `),
        },
      ],
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalRecords: count,
      },
    };
  }

  async getOpenItemReport(query: any) {
    const { startDate, endDate, } = query;
    return await CustReceivables.findAll({

      where: {
        AR_Date: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false,
          attributes: [
            'C_Number',
            'C_Name',
            'C_CoName',
            'C_Address',
            'C_City',
            'C_State',
            'C_Zip',
            'C_Phone',
            'C_Fax',
            'C_Email',
            'TermsCode',
            'C_Salesman',
            'C_StatementAccount',
            'C_Interest',
          ],
          include: [
            {
              model: SalesRep,
              as: 'salesRep',
              attributes: [['S_Desc', 'RepName']],
              required: false
            },
            {
              model: Terms,
              as: 'terms',
              attributes: ['DaysUntilDue', 'Terms'],
              required: false
            }
          ]
        },
        {
          model: CustBillTo,
          as: 'Cust_BillTo',
          required: false,
          attributes: [
            [Sequelize.fn('ISNULL', Sequelize.col('Cust_BillTo.C_Number'), 0), 'BT_Number'],
            ['C_Name', 'BT_Name'],
            ['C_CoName', 'BT_CoName'],
            ['C_Address', 'BT_Address'],
            ['C_City', 'BT_City'],
            ['C_State', 'BT_State'],
            ['C_Zip', 'BT_Zip'],
          ]
        }
      ],
      attributes: {
        include: [
          [
            Sequelize.literal(`
            ISNULL(
              (SELECT C_Name
               FROM Customer
               WHERE Customer.C_Number = CustReceivables.C_Number_Child),
            '')
          `),
            'C_Name_Child'
          ],
          [
            Sequelize.literal(`
            (SELECT AR_SubTypeRef
             FROM AR_Definitions
             WHERE CustReceivables.AR_Type = AR_Definitions.AR_Type
               AND CustReceivables.AR_SubType = AR_Definitions.AR_SubType)
          `),
            'SubType'
          ],
          [
            Sequelize.literal(`
            ISNULL(
              (SELECT SUM(Finance_Charge)
               FROM Cust_FinanceCharges
               WHERE Cust_FinanceCharges.C_Number = CustReceivables.C_Number),
            0)
          `),
            'fCharge'
          ],
          [
            Sequelize.literal(`
            DATEDIFF(DAY, CustReceivables.AR_Date, GETDATE())
          `),
            'aging'
          ]
        ]
      },
      order: [
        [Sequelize.literal('[customer].[C_Name]'), 'ASC'],
        ['AR_Date', 'ASC']
      ]
    });
  }

  async getInventorySpotCheck() {
    const data = await Inventory.findAll({
      attributes: [
        "Item_Number",
        "Sales_Category",
        "Section",
        "Location",
        "Price_Class",
        "OTP_Number",
        "Description",
        "Pack",
        "UOM",
        "Price1",
        "Sequence",
        "Basecost",
        "NetCost",
        "AvgCost",
        "Invoice_Cost",
        "Retail1",
        "HeadingFlag",
        "Primary_Vendor",
        "PickArea",

        // UPC_Number
        [
          Sequelize.literal(`(
          SELECT TOP 1 UPC_Number
          FROM Inventory_UPC
          WHERE Inventory.Item_Number = Inventory_UPC.Item_Number
            AND Status = 0
            AND Priority = 1
        )`),
          "UPC_Number"
        ],

        // classDesc
        [
          Sequelize.literal(`(
          SELECT Class_Desc
          FROM Price_Classes
          WHERE Inventory.Price_Class = Price_Classes.Price_Class
        )`),
          "classDesc"
        ],

        // categoryDesc
        [
          Sequelize.literal(`(
          SELECT Category_Desc
          FROM Sales_Categories
          WHERE Inventory.Sales_Category = Sales_Categories.Sales_Category
        )`),
          "categoryDesc"
        ],

        // otpDesc
        [
          Sequelize.literal(`(
          SELECT OTP_Description
          FROM OtherTaxes
          WHERE Inventory.OTP_Number = OtherTaxes.OTP_Number
        )`),
          "otpDesc"
        ],

        // Inventory_OnHand
        [
          Sequelize.literal(`ISNULL((
          SELECT SUM(Inventory_OnHand)
          FROM Inventory_Status
          WHERE Inventory_Status.Code = 0
            AND Inventory_Status.Item_Number = Inventory.Item_Number
        ), 0)`),
          "Inventory_OnHand"
        ],

        // iPend
        [
          Sequelize.literal(`ISNULL((
          SELECT SUM(Quantity_Ordered)
          FROM Order_Detail
          WHERE Order_Detail.Item_Number = Inventory.Item_Number
            AND DetailUpdated = 'False'
        ), 0)`),
          "iPend"
        ],

        // Avail
        [
          Sequelize.literal(`(
          ISNULL((
            SELECT SUM(Inventory_OnHand)
            FROM Inventory_Status
            WHERE Inventory_Status.Code = 0
              AND Inventory_Status.Item_Number = Inventory.Item_Number
          ), 0)
          -
          ISNULL((
            SELECT SUM(Quantity_Ordered)
            FROM Order_Detail
            WHERE Order_Detail.Item_Number = Inventory.Item_Number
              AND DetailUpdated = 'False'
          ), 0)
        )`),
          "Avail"
        ]
      ],

      order: [
        ["Sales_Category", "ASC"],
        ["Description", "ASC"]
      ]
    });

    return data;
  }


  async getInventoryValuationSalesCategTotal() {
    return await Inventory.findAll({
      limit: 50000,
      attributes: [
        'Item_Number',
        'Sales_Category',
        'Price_Class',
        'OTP_Number',
        'Description',
        'Pack',
        'UOM',
        'Price1',
        'Sequence',
        'Cig_Sticks',
        'UnitOunces',
        'Basecost',
        'NetCost',
        'AvgCost',
        'Invoice_Cost',
        'Retail1',
        'HeadingFlag',

        // UPC_Number
        [
          Sequelize.literal(`
          (
            SELECT TOP 1 UPC_Number
            FROM Inventory_UPC
            WHERE Inventory.Item_Number = Inventory_UPC.Item_Number
           
          )
        `),
          'UPC_Number'
        ],

        // classDesc
        [
          Sequelize.literal(`
          (
            SELECT Class_Desc
            FROM Price_Classes
            WHERE Inventory.Price_Class = Price_Classes.Price_Class
          )
        `),
          'classDesc'
        ],

        // categoryDesc
        [
          Sequelize.literal(`
          (
            SELECT Category_Desc
            FROM Sales_Categories
            WHERE Inventory.Sales_Category = Sales_Categories.Sales_Category
          )
        `),
          'categoryDesc'
        ],

        // otpDesc
        [
          Sequelize.literal(`
          (
            SELECT OTP_Description
            FROM OtherTaxes
            WHERE Inventory.OTP_Number = OtherTaxes.OTP_Number
          )
        `),
          'otpDesc'
        ],

        // TaxValue function
        [
          Sequelize.literal(`
          ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0)
        `),
          'TaxValue'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.AvgCost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_AvgCost'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.BaseCost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_BaseCost'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.NetCost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_NetCost'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.Invoice_Cost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_Invoice_Cost'
        ],
      ],

      include: [
        {
          model: InventoryStatus,
          required: false,
          attributes: {
            include: [
              // State Tax
              [
                Sequelize.literal(`
                (
                  SELECT TaxDescription
                  FROM TaxRates
                  WHERE TaxRates.Jurisdiction_State = InventoryStatus.Jurisdiction_State
                )
              `),
                'tState'
              ],

              // County Tax
              [
                Sequelize.literal(`
                (
                  SELECT TaxDescription
                  FROM TaxRates_County
                  WHERE TaxRates_County.Jurisdiction_County = InventoryStatus.Jurisdiction_County
                )
              `),
                'tCounty'
              ],

              // City Tax
              [
                Sequelize.literal(`
                (
                  SELECT TaxDescription
                  FROM TaxRates_City
                  WHERE TaxRates_City.Jurisdiction_City = InventoryStatus.Jurisdiction_City
                )
              `),
                'tCity'
              ],
            ]
          }
        },

        {
          model: InventorySavedDetail,
          required: false,
          // where: { Code: 1 },
          attributes: {
            include: [
              [
                Sequelize.literal(`
                (
                  SELECT TaxDescription
                  FROM TaxRates
                  WHERE TaxRates.Jurisdiction_State = InventorySavedDetail.Jurisdiction_State
                )
              `),
                'tState'
              ],
              [
                Sequelize.literal(`
                (
                  SELECT STMP_VALUE20
                  FROM TaxRates
                  WHERE TaxRates.Jurisdiction_State = InventorySavedDetail.Jurisdiction_State
                )
              `),
                'STMP_VALUE20'
              ],
              [
                Sequelize.literal(`
                (
                  SELECT STMP_VALUE25
                  FROM TaxRates
                  WHERE TaxRates.Jurisdiction_State = InventorySavedDetail.Jurisdiction_State
                )
              `),
                'STMP_VALUE25'
              ],
            ]
          }
        }
      ],

      // where: {
      //   // Code: 0,
      //   PickArea: 'NOV1'
      // },

      order: [['Description', 'ASC']]
    })
  }

  async getVendorListForTradeShowIds(ids: number) {
    const tradeShowVendors = await TradeShowVendor.findAll({
      where: { tradeShowId: ids },
      attributes: ['vendorId'],
    })
    return { data: tradeShowVendors, total: tradeShowVendors.length };
  }

  async getInventoryAsPerVendorIds(query: any) {
    let { ids, page = 1, limit = 10, search, salesCategoryId, priceClassId } = query;

    if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0) {
      salesCategoryId = salesCategoryId.map(id => Number(id));
    }

    if (Array.isArray(priceClassId) && priceClassId.length > 0) {
      priceClassId = priceClassId.map(id => Number(id));
    }


    page = Number(page);
    limit = Number(limit);
    const offset = limit ? (page - 1) * limit : undefined;
    let whereCondition: any = {};

    if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0 && Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Both filters exist → use OR condition
      whereCondition = {
        Sales_Category: { [Op.in]: salesCategoryId },
        Price_Class: { [Op.in]: priceClassId }
      };

      console.log(salesCategoryId, 'salesCategoryId', priceClassId, 'priceClassId', 'both filters exist')
    } else if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0) {
      // Only Sales_Category filter
      whereCondition.Sales_Category = { [Op.in]: salesCategoryId };
    } else if (Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Only Price_Class filter
      whereCondition.Price_Class = { [Op.in]: priceClassId };
    }
    if (ids && ids.length > 0) {
      whereCondition.Primary_Vendor = { [Op.in]: ids };
    }

    if (search) {
      whereCondition[Op.or] = [
        { Item_Number: { [Op.like]: `%${search}%` } },
        { Description: { [Op.like]: `%${search}%` } },
        { ALT_Description2: { [Op.like]: `%${search}%` } },
        { AltDesc: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count: totalCount, rows: inventory } = await Inventory.findAndCountAll({
      where: { I_Inactive: false, ShortOrderForm: true, ...whereCondition },
      attributes: ['Item_Number', 'Description', 'Retail1', 'Retail2', 'Retail3', 'Primary_Vendor', 'Price1', 'Price2'],
      include: [
        {
          model: Vendor,
          as: 'primaryVendor',
          attributes: ['Primary_Vendor', 'V_Description', 'V_Email', 'V_Phone', 'V_Addr1', 'V_City', 'V_State', 'V_Zip', 'V_Fax', 'V_Status'],
        },

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
        }
      ],
      order: [['Item_Number', 'ASC']],
      limit,
      offset,
    })
    return { data: inventory, total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }

  async getInventoryAsPerTradeWeek(query: any) {
    let { page = 1, limit = 10, tradeId, weekNumber, search } = query;
    tradeId = Number(tradeId);
    weekNumber = Number(weekNumber);
    page = Number(page);
    limit = Number(limit);
    const offset = limit ? (page - 1) * limit : undefined;

    let whereCondition: any = {};

    const { rows: tradeShowItem, count: total } = await TradeShowDeliveryProduct.findAndCountAll({
      where: {
        tradeShowId: tradeId,
        weekNumber: weekNumber,
        ...whereCondition,
      },
      attributes: ['itemNumber', 'startDate', 'endDate'],


      limit,
      offset,
    })


    const finalData = await Promise.all(
      tradeShowItem.map(async (item: any) => {
        const inventory = await Inventory.findOne({
          where: {
            Item_Number: Number(item.itemNumber),

          },
          attributes: ['Item_Number', 'Description', 'Pack', 'UOM', 'Retail1', 'Retail2', 'Retail3'],
        });
        return {
          ...item.toJSON(),
          inventory: inventory ? inventory.toJSON() : null,
        };
      })
    );


    return { data: finalData, total: total, page, limit, totalPages: Math.ceil(total / limit) };

  }

  async getTradeShowSummary(id: number, query: any) {
    let { page = 1, limit = 10 } = query;
    page = Number(page);
    limit = Number(limit);
    const offset = limit ? (page - 1) * limit : undefined;

    const tradeShow = await TradeShow.findByPk(id, {

    });

    const { rows: deliveryProducts, count: total } = await TradeShowItem.findAndCountAll({
      where: {
        tradeShowId: id,
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const vendorsIds = await TradeShowVendor.findAndCountAll({
      where: {
        tradeShowId: id,
      },
      attributes: ['vendorId'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const mapVendors = vendorsIds.rows.map((vendor: any) => vendor.vendorId);
    const vendors = await Vendor.findAll({
      where: {
        Primary_Vendor: {
          [Op.in]: mapVendors,
        },

      },
      attributes: ['Primary_Vendor', 'V_Description', 'V_Email', 'V_Phone', 'V_Addr1', 'V_City', 'V_State', 'V_Zip', 'V_Fax', 'V_Status'],
    });

    const tradeShowItemDeliveryWeeks = await TradeShowDeliveryProduct.findAll({
      where: {
        tradeShowId: id,
      },
      attributes: [
        'weekNumber',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['weekNumber'],
      order: [['weekNumber', 'ASC']],
      raw: true,
    });

    // Format the week-wise counts
    const weekWiseCounts = tradeShowItemDeliveryWeeks.map((week: any) => ({
      weekNumber: week.weekNumber,
      count: Number(week.count) || 0
    }));

    const retails = await TradeShowRetailer.findAndCountAll({
      where: {
        tradeShowId: id,
      },
      attributes: ['retailerId', 'retailerName'],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: deliveryProducts,
      vendors: vendors,
      total: total,
      retails: retails,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      tradeShow: tradeShow,
      weekWiseCounts: weekWiseCounts
    };
  }

  async getTradeShowItemList(id: number, query: any) {
    let { page = 1, limit = 10, search } = query;
    page = Number(page);
    limit = Number(limit);
    const offset = limit ? (page - 1) * limit : undefined;
    let whereCondition: any = {};
    if (search) {
      whereCondition[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    const { rows: tradeShowItem, count: total } = await TradeShowItem.findAndCountAll({
      where: {
        tradeShowId: id,
        ...whereCondition,
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { data: tradeShowItem, total: total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTradeShowVendorsList(id: number, query: any) {
    let { page = 1, limit = 10, search } = query;
    page = Number(page);
    limit = Number(limit);
    const offset = limit ? (page - 1) * limit : undefined;
    let whereCondition: any = {};
    if (search) {
      whereCondition[Op.or] = [
        { vendorName: { [Op.like]: `%${search}%` } },
      ];
    }
    const { rows: tradeShowVendors, count: total } = await TradeShowVendor.findAndCountAll({
      where: {
        tradeShowId: id,
        ...whereCondition,
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { data: tradeShowVendors, total: total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteBulkTradeShowVendors(body: {
    tradeShowId: number;
    vendorIds: number[];
  }) {
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }
    const vendorIds = body.vendorIds;
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      throw new AppError('Vendor IDs array must contain at least one vendor', 400);
    }



    await TradeShowVendor.destroy({
      where: { tradeShowId: tradeShow.id, vendorId: { [Op.in]: vendorIds } },
    });

    await TradeShowItem.destroy({
      where: { tradeShowId: tradeShow.id, vendorId: { [Op.in]: vendorIds } },
    });

    await TradeShowDeliveryProduct.destroy({
      where: { tradeShowId: tradeShow.id, vendorId: { [Op.in]: vendorIds } },
    });

    return { success: true, message: 'TradeShowVendor deleted successfully' };
  }

  async deleteBulkTradeShowItems(body: {
    tradeShowId: number;
    itemNumbers: string[];
  }) {
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }
    const itemIds = body.itemNumbers;
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new AppError('Item IDs array must contain at least one item', 400);
    }
    await TradeShowItem.destroy({
      where: { tradeShowId: tradeShow.id, itemNumber: { [Op.in]: itemIds } },
    });

    await TradeShowDeliveryProduct.destroy({
      where: { tradeShowId: tradeShow.id, itemNumber: { [Op.in]: itemIds } },
    });
    return { success: true, message: 'TradeShowItem deleted successfully' };
  }

  async deleteBulkTradeShowDeliveryProducts(body: {
    tradeShowId: number;
    itemNumbers: string[];
  }) {
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    const itemNumbers = body.itemNumbers;
    if (!Array.isArray(itemNumbers) || itemNumbers.length === 0) {
      throw new AppError('Item numbers array must contain at least one item number', 400);
    }
    await TradeShowDeliveryProduct.destroy({
      where: { tradeShowId: tradeShow.id, itemNumber: { [Op.in]: itemNumbers } },
    });
    return { success: true, message: 'TradeShowDeliveryProduct deleted successfully' };
  }


  async deleteBulkTradeShowRetailers(body: {
    tradeShowId: number;
    retailerIds: number[];
  }) {
    const tradeShow = await TradeShow.findByPk(body.tradeShowId);
    if (!tradeShow) {
      throw new AppError('TradeShow not found', 404);
    }

    const retailerIds = body.retailerIds;
    if (!Array.isArray(retailerIds) || retailerIds.length === 0) {
      throw new AppError('Retailer IDs array must contain at least one retailer', 400);
    }
    await TradeShowRetailer.destroy({
      where: { tradeShowId: tradeShow.id, retailerId: { [Op.in]: retailerIds } },
    });
    return { success: true, message: 'TradeShowRetailer deleted successfully' };
  }

  async poReceivingHistoryReport(query: any) {
    let { startDate, endDate } = query;

    const end = new Date(endDate);
    end.setDate(end.getDate());
    const startEnd = new Date(startDate);
    startEnd.setDate(startEnd.getDate());

    const result = await PODetail.findAndCountAll({
      subQuery: false,
      distinct: true,
      col: 'PO_Number',

      attributes: {
        include: [
          [
            literal(`Quantity_Recd * PO_Detail.Pack`),
            'qtyRecd',
          ],
        ],
      },

      include: [
        {
          model: POHeader,
          as: 'POHeader',
          required: true,
          where: {
            PO_Posted: 'True',
            PO_Deleted: 'False',
            Receiving_Code: 'P',
            Date_Received: {
              [Op.between]: [startEnd, end],
            },
          },
          attributes: [
            'PO_Number',
            'Invoice_Number',
            'Date_Received',
            'Invoice_Date',
            'Primary_Vendor',
          ],
          include: [
            {
              model: Vendor,
              attributes: [
                'Primary_Vendor',
                'V_Description',
                'V_Addr1',
                'V_City',
                'V_State',
                'V_Zip',
                'V_Phone',
              ],
            },
          ],
        },
        {
          model: Inventory,
          attributes: [
            'Description',
            'Cig_Pack',
            'Cig_Sticks',
            'UnitOunces',
            'UOM',
            'Price_Class',
            'location',
            'section',
            'PickArea',
            ['Pack', 'iPack'],
            ['OTP_Number', 'iOTP'],
            [
              literal(`
              (SELECT OTP_Description
               FROM OtherTaxes
               WHERE OtherTaxes.OTP_Number = Inventory.OTP_Number)
            `),
              'otpName',
            ],
            [
              literal(`
              (SELECT Brand_Family
               FROM Inventory_Brands
               WHERE Inventory_Brands.Brand_ID = Inventory.Brand_ID)
            `),
              'Brand',
            ],
            [
              literal(`
              (SELECT V_Description
               FROM Vendor
               WHERE Vendor.Primary_Vendor = Inventory.Manufacturer)
            `),
              'Manuf',
            ],
          ],
        },
      ],

      order: [
        [{ model: POHeader, as: 'POHeader' }, 'Date_Received', 'ASC'],
        ['PO_Number', 'ASC'],
      ],
    });

    return {
      total: result.count,
      data: result.rows,
    };
  }

  async poTransferAdjustmentReport(query: any) {
    const { startDate, endDate } = query;

    const data = await PODetail.findAll({
      attributes: {
        include: [
          [
            literal(
              'ISNULL([PO_Detail].[Quantity_Recd], 0) * ISNULL([PO_Detail].[Cost], 0)'
            ),
            'Ext_Cost',
          ],
        ],
      },

      include: [
        {
          model: POHeader,
          as: 'POHeader',
          required: true,
          attributes: [
            'PO_Number',
            'PO_Date',
            'Date_Received',
            'Receiving_Code',
          ],
          where: {
            PO_Posted: true,
            PO_Deleted: false,
            Receiving_Code: 'A',
            Date_Received: {
              [Op.between]: [startDate, endDate],
            },
          },
          include: [
            {
              model: Vendor,
              required: false, // LEFT JOIN Vendor
              attributes: [
                'V_Description',
                'V_Addr1',
                'V_City',
                'V_State',
                'V_Zip',
                'V_Phone',
              ],
            },
          ],
        },
        {
          model: Inventory,
          required: false, // LEFT JOIN Inventory
          attributes: [
            'Item_Number',
            'Description',
            'UOM',
            'Price_Class',
            'location',
            'section',
            'PickArea',
            ['Pack', 'iPack'],
          ],
        },
      ],

      order: [
        [{ model: POHeader, as: 'POHeader' }, 'Date_Received', 'ASC'],
        [{ model: POHeader, as: 'POHeader' }, 'PO_Number', 'ASC'],
      ],
    });
    return data;
  }

  async poCigOtpReport(query: any) {
    const { startDate, endDate } = query;

    const end = new Date(endDate);
    const startEnd = new Date(startDate);

    return await POHeader.findAll({
      where: {
        PO_Posted: true,
        PO_Deleted: false,
        Receiving_Code: 'P',
        Date_Received: {
          [Op.between]: [startEnd, end],
        },
      },
      order: [
        ['Date_Received', 'ASC'],
        ['PO_Number', 'ASC'],
      ],
      include: [
        {
          model: PODetail,
          as: 'PO_Details',
          required: true,
          separate: true,

          attributes: {
            include: [
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [PO_Detail].[Pack]'
                ),
                'qtyRecd',
              ],
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [Inventory].[UnitOunces]'
                ),
                'qtyOz',
              ],
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [PO_Detail].[AvgCost]'
                ),
                'Ext_AvgCost',
              ],
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [PO_Detail].[BaseCost]'
                ),
                'Ext_BaseCost',
              ],
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [PO_Detail].[NetCost]'
                ),
                'Ext_NetCost',
              ],
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [PO_Detail].[Invoice_Cost]'
                ),
                'Ext_InvoiceCost',
              ],
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [PO_Detail].[Cost]'
                ),
                'Ext_POCost',
              ],
              [
                Sequelize.literal(
                  '[PO_Detail].[Quantity_Recd] * [Inventory].[Cig_Sticks]'
                ),
                'Total_Cig_Sticks',
              ],
              [
                Sequelize.literal(
                  '([PO_Detail].[Quantity_Recd] * [Inventory].[Cig_Sticks]) / NULLIF([Inventory].[Cig_Pack], 0)'
                ),
                'Total_Pack',
              ],

            ],
          },

          include: [
            {
              model: Inventory,
              required: false,
              attributes: [
                'Description',
                'Cig_Pack',
                'Cig_Sticks',
                'UnitOunces',
                'UOM',
                'Price_Class',
                ['Pack', 'iPack'],
                ['OTP_Number', 'iOTP'],


                [
                  Sequelize.literal(`(
                  SELECT OT.OTP_Description
                  FROM OtherTaxes OT
                  WHERE OT.OTP_Number = [Inventory].[OTP_Number]
                )`),
                  'otpName',
                ],

                [
                  Sequelize.literal(`(
                  SELECT IB.Brand_Family
                  FROM Inventory_Brands IB
                  WHERE IB.Brand_ID = [Inventory].[Brand_ID]
                )`),
                  'Brand',
                ],

                [
                  Sequelize.literal(`(
                  SELECT V.V_Description
                  FROM Vendor V
                  WHERE V.Primary_Vendor = [Inventory].[Manufacturer]
                )`),
                  'Manuf',
                ],
              ],
            },
          ],
        }
        ,
        {
          model: Vendor,
          required: true,
          attributes: [
            'Primary_Vendor',
            'V_Description',
            'V_Addr1',
            'V_City',
            'V_State',
            'V_Zip',
            'V_Phone',
          ],
        },
      ],

      subQuery: false,
    });
  }

  async createInvoice(orderNumber: number) {

    // 1. Order Header + Customer + SalesRep
    const orderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
      attributes: [
        'Order_Number',
        'Order_Date',
        'C_Number',
        'S_Number',
        'Delivery_Date',
        'Delivery_Charge',
        'Tracking_Number',
        'Invoice_Date',
        'Invoice_time',
        'Invoice_Total',
        'PrepaidTax_Amount',
        'Route_Number',
        'Stop_Number',
        'POS_House',
        'POS_Cash',
        'POS_Check',
        'POS_Credit',
        'HouseChargeApplied',
        ...Array.from({ length: 12 }, (_, i) => `Sales${String(i + 1).padStart(2, '0')}`),
        ...Array.from({ length: 12 }, (_, i) => `Taxes${String(i + 1).padStart(2, '0')}`)
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [
            'C_Number',
            'C_Name',
            'C_CoName',
            'C_Address',
            'C_City',
            'C_State',
            'C_Zip',
            'C_Country',
            'C_Email', 'C_Phone', 'TermsCode', 'C_Fax', 'C_SalesTaxNumber', 'C_CigtLicenseNumber', 'Credit_Limit', 'EDI_Format', 'C_FEIN', 'C_PhoneMobile',
            'LastBalance', 'LastInvoiceNumber', 'LastInvoiceAmount', 'LastPaymentAmount', 'LastPaymentDate', 'TermsCode',
          ],
          include: [
            {
              model: Terms,
              as: 'terms',
              attributes: ['TermsCode', 'Terms'],
              required: false,
            },
            {
              model: CustBillTo,
              as: 'billTo',
              attributes: ['C_Number', 'C_Name', 'C_CoName', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_AddressType', 'DriversLicense'],
              required: false,
            }
          ]
        },
        {
          model: SalesRep,
          as: "salesRep",
          attributes: ['S_Number', 'S_Desc'],
          required: false,
        },
        {
          model: DeliveryTypes,
          as: 'DeliveryType',
          attributes: ['Delivery_ID', 'Delivery_Description'],
          required: false,
        }

      ]
    });

    if (!orderHeader) {
      throw new Error('Order not found');
    }

    // 2. Order Detail + Inventory + UPC
    const orderItems = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        'Item_Number',
        'Sales_Category',
        'OTP_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Pack',
        'Price',
        ['Retail', 'Retail1'],
        'CaseCount',
        'Taxable', 'EBT', 'CasesPerPallet', 'Item_Message', 'ItemDescription', 'Special_ID', 'Tote_ID', 'OTP_Amount_State', 'OTP_Amount_County', 'OTP_Amount_City',
        'OffInvoice_Amount', 'OffInvoice_OffCost', 'OffInvoice_Special', 'Points', 'PrepaidTax_Amount', 'DepositAmount'],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Item_Number', 'Description', 'UOM', 'Price_Class', 'location', 'section', 'PickArea', 'Retail2', 'Retail3', 'UnitOunces', 'CaseLength', 'CaseWidth', 'CaseHeight', 'CasesPerPallet',
            'EBT', 'FrozenFlag', 'CoolerFlag', 'HazMatFlag', 'StandardUnitDescription', 'MSA_Promotion_Code', 'MSA_Promotion', 'Lot_ID', 'NACS_Unit', 'Brand_ID', 'NACS', 'MSA_Category_Code', 'Sequence', 'Retail1', 'Retail2', 'Retail3',
          ],
          include: [
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              where: { Status: 0 },
              required: false
            },
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Sales_Category', 'Category_Desc'],
              required: false
            },
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: ['Price_Class', 'Class_Desc'],
              required: false,
            }
          ]
        },

      ]
    });

    // 3. Previous Balance (AR)
    const customerNumber = (orderHeader as any).C_Number;
    const [balanceResult]: any = await CustReceivables.findAll({
      attributes: [
        [fn('SUM', literal('AR_Amount - AR_Applied')), 'TotalAR']
      ],
      where: { C_Number: customerNumber },
      raw: true,
    });
    const previousBalance = Number(balanceResult?.TotalAR) || 0;

    // 4. Calculate Unit_Price for each item
    const invoiceItems = orderItems.map((item: any) => {
      const plain = item.get({ plain: true });
      const pack = Number(plain.Pack) || 1;
      plain.Unit_Price = Number((plain.Price / pack).toFixed(4));
      return plain;
    });

    // 5. Final Invoice Object
    return {
      invoiceHeader: orderHeader,
      invoiceItems,
      previousBalance
    };
  }


  // async currentOrderStatusReport(query: any) {
  //   const {
  //     startDate,
  //     endDate,
  //     customerNumber,
  //     currentStatus,
  //   } = query;

  //   const whereCondition: any = {
  //     Order_Updated: false,
  //     Order_Deleted: false,
  //   };

  //   if (startDate && endDate) {
  //     whereCondition.Order_Date = {
  //       [Op.between]: [startDate, endDate],
  //     };
  //   }

  //   if (customerNumber) {
  //     whereCondition.C_Number = Number(customerNumber);
  //   }

  //   if (currentStatus === 'invoices') {
  //     whereCondition.Invoice_Number = { [Op.gt]: 0 };
  //   }

  //   if (currentStatus === 'non_invoices') {
  //     whereCondition.Invoice_Number = { [Op.eq]: 0 };
  //   }

  //   if (currentStatus === 'picklist') {
  //     whereCondition.Picklist_Printed = true;
  //   }

  //   if (currentStatus === 'EpickStatusFromPicker') {
  //     whereCondition.EpickStatusFromPicker = 'completed';
  //   }

  //   const data = await OrderHeader.findAll({
  //     where: whereCondition,
  //     order: [['Order_Number', 'DESC']],

  //     attributes: [
  //       'Order_Number',
  //       'Invoice_Number',
  //       'Invoice_Date',
  //       'Invoice_Total',
  //       'Picklist_Printed',
  //       'Order_Date',
  //       'Delivery_Date',
  //       'Order_Source',
  //       'C_Number',
  //       'S_Number',
  //       'Route_Number',
  //       'Stop_Number',

  //       [
  //         Sequelize.literal(`
  //           IIF(
  //             OrderHeader.Invoice_Number_Legacy <> 0,
  //             CONVERT(varchar(10), OrderHeader.Invoice_Number_Legacy),
  //             IIF(
  //               OrderHeader.Invoice_Number > 1,
  //               CONCAT(OrderHeader.Order_Number, '-', OrderHeader.Invoice_Number),
  //               CONVERT(varchar(10), OrderHeader.Order_Number)
  //             )
  //           )
  //         `),
  //         'Document_Number',
  //       ],

  //       [
  //         Sequelize.fn(
  //           'SUM',
  //           Sequelize.col('orderDetails.Quantity_Ordered')
  //         ),
  //         'total_item_quantity',
  //       ],

  //       [
  //         Sequelize.fn(
  //           'COUNT',
  //           Sequelize.col('orderDetails.Line_Number')
  //         ),
  //         'total_line_number',
  //       ],
  //     ],

  //     include: [
  //       {
  //         model: OrderDetail,
  //         as: 'orderDetails',
  //         required: false,
  //         attributes: [],
  //       },
  //       {
  //         model: Customer,
  //         as: 'customer',
  //         attributes: [
  //           'C_Number',
  //           'C_Name',
  //           'C_CoName',
  //           'C_Address',
  //           'C_City',
  //           'C_State',
  //           'C_Zip',
  //           'C_PhoneMobile',
  //         ],
  //       },
  //       {
  //         model: SalesRep,
  //         as: 'salesRep',
  //         attributes: ['S_Number', 'S_Desc'],
  //       },
  //     ],

  //     group: [
  //       'OrderHeader.Order_Number',
  //       'OrderHeader.Invoice_Number',
  //       'OrderHeader.Invoice_Date',
  //       'OrderHeader.Invoice_Total',
  //       'OrderHeader.Picklist_Printed',
  //       'OrderHeader.Order_Date',
  //       'OrderHeader.Delivery_Date',
  //       'OrderHeader.Order_Source',
  //       'OrderHeader.C_Number',
  //       'OrderHeader.S_Number',
  //       'OrderHeader.Route_Number',
  //       'OrderHeader.Stop_Number',
  //       'OrderHeader.Invoice_Number_Legacy',
  //       'customer.C_Number',
  //       'customer.C_Name',
  //       'customer.C_CoName',
  //       'customer.C_Address',
  //       'customer.C_City',
  //       'customer.C_State',
  //       'customer.C_Zip',
  //       'customer.C_PhoneMobile',
  //       'salesRep.S_Number',
  //       'salesRep.S_Desc',
  //     ],
  //   });

  //   return data;
  // }

  async currentOrderStatusReport(query: any) {
    const { startDate, endDate } = query;

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    const baseWhere = {
      Order_Date: {
        [Op.between]: [startDate, endDate],
      },
    };

    const recordLocks = await Record_Locks.findAll({
      where: { Lock_Type: 0 },
      attributes: ['Lock_Number'],
      raw: true,
    });

    const lockedOrderNumbers = recordLocks.map(
      (r: { Lock_Number: number }) => r.Lock_Number
    );

    const commonAttributes: FindAttributeOptions = [
      'Order_Number',
      'Invoice_Number',
      'Invoice_Date',
      'Invoice_Total',
      'Picklist_Printed',
      'Order_Date',
      'Delivery_Date',
      'Order_Source',
      'C_Number',
      'S_Number',
      'Route_Number',
      'Stop_Number',
      'Invoice_Number_Legacy',
      'Order_Deleted',
      'Order_Updated',

      [
        Sequelize.literal(`
        IIF(
          OrderHeader.Invoice_Number_Legacy <> 0,
          CONVERT(varchar(10), OrderHeader.Invoice_Number_Legacy),
          IIF(
            OrderHeader.Invoice_Number > 1,
            CONCAT(OrderHeader.Order_Number, '-', OrderHeader.Invoice_Number),
            CONVERT(varchar(10), OrderHeader.Order_Number)
          )
        )
      `),
        'Document_Number',
      ],

      [
        Sequelize.fn('SUM', Sequelize.col('orderDetails.Quantity_Ordered')),
        'total_item_quantity',
      ],

      [
        Sequelize.fn('COUNT', Sequelize.col('orderDetails.Line_Number')),
        'total_line_number',
      ],
    ];

    const commonQuery: Omit<FindOptions, 'where'> = {
      include: [
        {
          model: OrderDetail,
          as: 'orderDetails',
          attributes: [],
          required: true,
        },
        {
          model: Customer,
          as: 'customer',
          attributes: [
            'C_Number',
            'C_Name',
            'C_CoName',
            'C_Address',
            'C_City',
            'C_State',
            'C_Zip',
            'C_PhoneMobile',
          ],
        },
        {
          model: SalesRep,
          as: 'salesRep',
          attributes: ['S_Number', 'S_Desc'],
        },
      ],
      attributes: commonAttributes,
      group: [
        'OrderHeader.Order_Number',
        'OrderHeader.Invoice_Number',
        'OrderHeader.Invoice_Date',
        'OrderHeader.Invoice_Total',
        'OrderHeader.Picklist_Printed',
        'OrderHeader.Order_Date',
        'OrderHeader.Delivery_Date',
        'OrderHeader.Order_Source',
        'OrderHeader.C_Number',
        'OrderHeader.S_Number',
        'OrderHeader.Route_Number',
        'OrderHeader.Stop_Number',
        'OrderHeader.Invoice_Number_Legacy',
        'OrderHeader.Order_Deleted',
        'OrderHeader.Order_Updated',
        'customer.C_Number',
        'customer.C_Name',
        'customer.C_CoName',
        'customer.C_Address',
        'customer.C_City',
        'customer.C_State',
        'customer.C_Zip',
        'customer.C_PhoneMobile',
        'salesRep.S_Number',
        'salesRep.S_Desc',
      ],
    };

    const results = await Promise.allSettled([

      // Invoices
      OrderHeader.findAll({
        ...commonQuery,
        where: { ...baseWhere, Invoice_Number: { [Op.gt]: 0 } },
      }),

      // Non Invoices (FIXED)
      OrderHeader.findAll({
        ...commonQuery,
        where: { ...baseWhere, Invoice_Number: { [Op.eq]: 0 } },
      }),

      // Picklist Printed
      OrderHeader.findAll({
        ...commonQuery,
        where: { ...baseWhere, Picklist_Printed: true },
      }),

      // Epick Completed
      OrderHeader.findAll({
        ...commonQuery,
        where: { ...baseWhere, EpickStatusFromPicker: 'completed' },
      }),

      // Order Confirmation (NEW)
      OrderHeader.findAll({
        ...commonQuery,
        where: {
          ...baseWhere, Order_Deleted: false, Order_Updated: false,
          [Op.and]: [
            Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM [Order_Detail] od
              WHERE od.Order_Number = [OrderHeader].[Order_Number]
            )
            AND NOT EXISTS (
              SELECT 1
              FROM [Order_Detail] od2
              WHERE od2.Order_Number = [OrderHeader].[Order_Number]
                AND (od2.Confirmed = 0 OR od2.Confirmed IS NULL)
            )
          `),
          ],
        },
      }),

      // Locked Orders
      lockedOrderNumbers.length
        ? OrderHeader.findAll({
          ...commonQuery,
          where: {
            ...baseWhere,
            Order_Number: { [Op.in]: lockedOrderNumbers },
          },
        })
        : Promise.resolve([]),

    ]);

    const [
      invoices,
      non_invoices,
      picklist,
      epickCompleted,
      orderConfirmation,
      lockedOrders,
    ] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : []
    );

    return {
      invoices,
      non_invoices,
      picklist,
      epickCompleted,
      orderConfirmation,
      recordLocks: lockedOrders,
    };
  }

  async getInvoiceRegister(query: any) {
    const { startDate, endDate } = query;

    const data = await OrderHeader.findAll({
      attributes: [
        'Order_Number',
        'C_Number',
        'POS_Cash',
        'POS_Check',
        'POS_Credit',
        'POS_Debit',
        'POS_Other',
        'POS_House',
        'Invoice_Total',
        'Workstation_ID',
        'User_ID',
        'Invoice_Date',
        'Reprint_Invoice_Required',

        // Document_Number calculation
        [
          Sequelize.literal(`
          IIF(
            OrderHeader.Invoice_Number_Legacy <> 0,
            CONVERT(varchar(10), OrderHeader.Invoice_Number_Legacy),
            IIF(
              OrderHeader.Invoice_Number > 1,
              CONCAT(OrderHeader.Order_Number, '-', OrderHeader.Invoice_Number),
              CONVERT(varchar(10), OrderHeader.Order_Number)
            )
          )
        `),
          'Document_Number',
        ],

        // Subqueries
        [
          Sequelize.literal(`(
          SELECT S_Desc 
          FROM SalesRep 
          WHERE SalesRep.s_number = OrderHeader.s_number
        )`),
          'repName',
        ],
        [
          Sequelize.literal(`(
          SELECT Route_Description 
          FROM Routes 
          WHERE Routes.Route_Number = OrderHeader.Route_Number
        )`),
          'routeName',
        ],
        [
          Sequelize.literal(`(
          SELECT Source_Description 
          FROM Order_Source 
          WHERE Order_Source.Order_Source = OrderHeader.Order_Source
        )`),
          'sourceName',
        ],
        [
          Sequelize.literal(`(
          SELECT UserName 
          FROM Users 
          WHERE Users.UserNumber = OrderHeader.User_ID
        )`),
          'userName',
        ],
        [
          Sequelize.literal(`(
          SELECT Workstation_Name 
          FROM Workstation_Defs 
          WHERE Workstation_Defs.Workstation_ID = OrderHeader.Workstation_ID
        )`),
          'workstationName',
        ],
      ],

      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [
            'C_Name',
            'C_Address',
            'C_City',
            'C_State',
            'C_Zip',
          ],
          required: false, // LEFT JOIN
        },
      ],

      where: {
        Order_Deleted: 'False',
        Order_Updated: 'True',
        Invoice_Number: {
          [Op.ne]: 0,
        },
        Invoice_Date: {
          [Op.between]: [startDate, endDate],
        },
      },

      order: [['Order_Number', 'ASC']],
      raw: true,
    });

    return data;
  }

  async currentOrderDetailStatus(orderNumber: number) {
    const orderDetails = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        'Line_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Price',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',
        'PrepaidTax_Amount',
        [
          Sequelize.literal(`
          (OrderDetail.Price + OrderDetail.OTP_Amount_State + OrderDetail.OTP_Amount_County + OrderDetail.OTP_Amount_City)
        `),
          'TotalPrice',
        ],
      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          required: false,
          attributes: [
            'Item_Number',
            'Description',
            'CaseCount',
            'CaseWeight',
            'UOM',
            'Section',
            'Location',
            'Pack',
            [Sequelize.literal('0'), 'OnHand'],
          ],
        },
      ],
    });
    return orderDetails;
  }



  async getProductsByOrderNumber(body: {
    orderNumbers: number[];
    customerId?: number;
  }) {
    const { orderNumbers, customerId } = body;

    if (!Array.isArray(orderNumbers) || orderNumbers.length === 0) {
      throw new AppError('Order numbers array must contain at least one order number', 400);
    }

    const products = await OrderDetail.findAll({
      where: {
        Order_Number: { [Op.in]: orderNumbers },
      },
      attributes: ['Order_Number', 'Item_Number', 'Quantity_Ordered'],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Item_Number', 'Description', 'Pack', 'CaseCount', 'UOM', 'OTP_Number', 'Price1'],

          include: [
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              where: { Status: 0 },
              required: false,
            },
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
          ],
        },
      ],
    });

    /* ------------------------------------
       STEP 1 → Flatten order + inventory
    ------------------------------------ */

    const productList = products.map((row: any) => ({
      Order_Number: row.Order_Number,
      Quantity_Ordered: row.Quantity_Ordered,
      ...row.inventory?.dataValues,
    }));

    /* ------------------------------------
       STEP 2 → Your Promise.all mapping
    ------------------------------------ */

    const finalProductList = await Promise.all(
      productList.map(async (e: any) => {
        const itemStr = e.Item_Number.toString();
        const productImage = await ProductImage.findOne({ where: { product_number: itemStr, isAllow: true } });



        let taxRate = 0;
        if (customerId && e.OTP_Number) {
          let userJurisdiction: number | null = null;
          if (customerId) {
            userJurisdiction = await getJurisdiction(Number(customerId));
          }
          taxRate = await getTaxRateV1(
            e?.OTP_Number || 0,
            userJurisdiction || 0,
            e.Item_Number,
            e.Price1
          );
        }
        console.log(e.Price1, 'e.Price1')
        let price = (e.Price1 || 0) + taxRate;
        taxRate = Math.ceil(taxRate * 100) / 100;

        price = Math.ceil(price * 100) / 100;



        return {
          Order_Number: e.Order_Number,

          Pack: e.Pack,
          Description: e.Description,
          Item_Number: e.Item_Number,
          CaseCount: e.CaseCount,
          UOM: e.UOM,
          Price1: price,

          Tax_Rate: taxRate,

          price,
          priceWithTax: price + taxRate,



          UPCList: e.UPCList,



          SalesCategory: e.SalesCategory?.Category_Desc || null,
          PriceClass: e.PriceClass?.Class_Desc || null,

          showDistributorImage: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url || null,
          masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,

        };
      })
    );




    return finalProductList;
  }



  async getTradeShowItemForEdit(tradeShowId: number) {
    const tradeShowItem = await TradeShowItem.findAll({
      where: {
        tradeShowId: tradeShowId,
      },
    });
    return tradeShowItem;
  }


  async getTradeDeliverProductsForEdit(body: any) {

    const { tradeShowId, weekNumber } = body;
    const { rows: tradeShowDeliveryProducts, count: total } = await TradeShowDeliveryProduct.findAndCountAll({
      where: {
        tradeShowId: tradeShowId,
        weekNumber: weekNumber,
      },

    });
    return { data: tradeShowDeliveryProducts, total: total };
  }


  async getTradeDeliveryProductSummary(tradeShowId: number) {
    const result = await TradeShowDeliveryProduct.findAll({
      where: {
        tradeShowId: tradeShowId,
      },
      attributes: [
        "weekNumber",
        [fn("MIN", col("startDate")), "startDate"],
        [fn("MAX", col("endDate")), "endDate"],
        [fn("COUNT", col("id")), "totalCount"],
      ],
      group: ["weekNumber"],
      order: [["weekNumber", "ASC"]],
    });

    return result;
  }

  async getTradeShowRetailerForEdit(tradeShowId: number) {
    const { rows: tradeShowRetailers, count: total } = await TradeShowRetailer.findAndCountAll({
      where: {
        tradeShowId: tradeShowId,
      },
      attributes: ['retailerId']
    });
    return { data: tradeShowRetailers, total: total };
  }

  // CustomerAssignInvoiceTemplate CRUD service methods
  async createCustomerAssignInvoiceTemplate(data: { customerNumber: number; templateId: number }) {
    // Check if the assignment already exists
    const existing = await CustomerAssignInvoiceTemplate.findOne({
      where: {
        customerNumber: data.customerNumber,
        templateId: data.templateId,
      },
    });

    if (existing) {
      throw new AppError('This customer-template assignment already exists', 400);
    }

    const assignment = await CustomerAssignInvoiceTemplate.create({
      customerNumber: data.customerNumber,
      templateId: data.templateId,
    });
    return assignment;
  }

  async getCustomerAssignInvoiceTemplateById(id: number) {
    const assignment = await CustomerAssignInvoiceTemplate.findByPk(id);
    if (!assignment) {
      throw new AppError('Customer invoice template assignment not found', 404);
    }
    return assignment;
  }

  async getAllCustomerAssignInvoiceTemplates(query: PaginationOptions & {
    search?: string;
    customerNumber?: number;
    templateId?: number
  }) {
    const { page = 1, limit = 10, search = '', customerNumber, templateId } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (customerNumber) {
      whereClause.customerNumber = customerNumber;
    }

    if (templateId) {
      whereClause.templateId = templateId;
    }

    if (search) {
      whereClause[Op.or] = [
        { customerNumber: { [Op.eq]: isNaN(Number(search)) ? -1 : Number(search) } },
        { templateId: { [Op.eq]: isNaN(Number(search)) ? -1 : Number(search) } },
      ];
    }

    const { count, rows } = await CustomerAssignInvoiceTemplate.findAndCountAll({
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

  async updateCustomerAssignInvoiceTemplate(
    id: number,
    data: { customerNumber?: number; templateId?: number }
  ) {
    const assignment = await CustomerAssignInvoiceTemplate.findByPk(id);
    if (!assignment) {
      throw new AppError('Customer invoice template assignment not found', 404);
    }

    // If updating customerNumber or templateId, check for duplicates
    if (data.customerNumber !== undefined || data.templateId !== undefined) {
      const newCustomerNumber = data.customerNumber ?? assignment.customerNumber;
      const newTemplateId = data.templateId ?? assignment.templateId;

      const existing = await CustomerAssignInvoiceTemplate.findOne({
        where: {
          customerNumber: newCustomerNumber,
          templateId: newTemplateId,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new AppError('This customer-template assignment already exists', 400);
      }
    }

    await assignment.update(data);
    return assignment;
  }

  async deleteCustomerAssignInvoiceTemplate(id: number) {
    const assignment = await CustomerAssignInvoiceTemplate.findByPk(id);
    if (!assignment) {
      throw new AppError('Customer invoice template assignment not found', 404);
    }

    await assignment.destroy();
    return { message: 'Customer invoice template assignment deleted successfully' };
  }

  async deleteCustomerAssignInvoiceTemplateByCustomerNumber(customerNumber: number) {
    const deleted = await CustomerAssignInvoiceTemplate.destroy({
      where: {
        customerNumber: customerNumber,
      },
    });
    return { message: 'Customer invoice template assignment deleted successfully', count: deleted };
  }
  // Bulk operations
  async bulkAddCustomerAssignInvoiceTemplates(body: { assignments: { customerNumber: number; templateId: number }[] }) {
    const { assignments } = body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      throw new AppError('Assignments must be a non-empty array', 400);
    }

    // Validate all entries
    for (const item of assignments) {
      if (!item.customerNumber || !item.templateId) {
        throw new AppError('Each item must have customerNumber and templateId', 400);
      }
    }

    // Check for existing assignments
    const existingAssignments = await CustomerAssignInvoiceTemplate.findAll({
      where: {
        [Op.or]: assignments.map((item) => ({
          customerNumber: item.customerNumber,
          templateId: item.templateId,
        })),
      },
    });

    if (existingAssignments.length > 0) {
      const existingList = existingAssignments
        .map((e) => `Customer ${e.customerNumber} - Template ${e.templateId}`)
        .join(', ');
      throw new AppError(`Some assignments already exist: ${existingList}`, 400);
    }

    // Bulk create
    const created = await CustomerAssignInvoiceTemplate.bulkCreate(assignments, {
      validate: true,
      returning: true,
    });

    return {
      message: `Successfully created ${created.length} customer invoice template assignment(s)`,
      data: created,
      count: created.length,
    };
  }

  async bulkRemoveCustomerAssignInvoiceTemplates(body: { assignments: { customerNumber: number; templateId: number }[] }) {
    const { assignments } = body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      throw new AppError('Assignments must be a non-empty array', 400);
    }

    // Validate all entries
    for (const item of assignments) {
      if (!item.customerNumber || !item.templateId) {
        throw new AppError('Each item must have customerNumber and templateId', 400);
      }
    }

    // Find and delete matching assignments
    const deleted = await CustomerAssignInvoiceTemplate.destroy({
      where: {
        [Op.or]: assignments.map((item) => ({
          customerNumber: item.customerNumber,
          templateId: item.templateId,
        })),
      },
    });

    return {
      message: `Successfully removed ${deleted} customer invoice template assignment(s)`,
      count: deleted,
    };
  }

  // InvoiceTemplate CRUD service methods
  async createInvoiceTemplate(
    data: Partial<IInvoiceTemplate> & { selectedCustomerIds?: number[] }
  ) {
    const transaction = await postgresSequelize.transaction();

    const { selectedCustomerIds, ...templateData } = data;

    if (!templateData.name) {
      throw new AppError("Template name is required", 400);
    }

    const trimmedName = templateData.name.trim().toLowerCase();

    // ==========================
    // Check duplicate
    // ==========================
    const existingTemplate = await InvoiceTemplate.findOne({
      where: { name: trimmedName },
      transaction,
    });

    if (existingTemplate) {
      throw new AppError(
        `An invoice template with the name "${templateData.name}" already exists`,
        400
      );
    }

    // ==========================
    // Merge with defaults
    // ==========================
    const finalTemplateData: any = {
      ...DEFAULT_INVOICE_TEMPLATE,
      ...templateData,
      name: trimmedName,

      // Deep merge for selectedColumns
      selectedColumns: {
        ...DEFAULT_INVOICE_TEMPLATE.selectedColumns,
        ...(templateData.selectedColumns || {}),
      },

      // Ensure JSON fields are never undefined
      columnHeaderNames: templateData.columnHeaderNames || {},
      columnOrder: templateData.columnOrder || {},
      footerSummaryLabels: templateData.footerSummaryLabels || {},
    };

    // ==========================
    // Lowercase only ENUM-like fields
    // ==========================
    const enumFields = [
      "groupBy",
      "upcOption",
      "logoPosition",
      "headerOnPages",
      "footerLayout",
      "columnPlacement",
    ];

    enumFields.forEach((field) => {
      if (
        finalTemplateData[field] !== undefined &&
        finalTemplateData[field] !== null
      ) {
        finalTemplateData[field] = String(finalTemplateData[field]).toLowerCase();
      }
    });

    // ⚠️ DO NOT lowercase message fields anymore
    // headerMessageFirstPage & footerMessageLastPage
    // because those are user content

    // ==========================
    // Ensure only ONE mainTemplate
    // ==========================
    if (finalTemplateData.mainTemplate === true) {
      await InvoiceTemplate.update(
        { mainTemplate: false },
        { where: { mainTemplate: true }, transaction }
      );
    }

    // ==========================
    // Create Template
    // ==========================
    const template = await InvoiceTemplate.create(finalTemplateData, {
      transaction,
    });

    // ==========================
    // Customer Assignments
    // ==========================
    if (selectedCustomerIds?.length) {
      const assignments = selectedCustomerIds.map((customerNumber) => ({
        customerNumber,
        templateId: template.id,
      }));

      await CustomerAssignInvoiceTemplate.bulkCreate(assignments, {
        transaction,
        ignoreDuplicates: true,
        validate: true,
      });
    }

    await transaction.commit();

    return template;
  }


  async getInvoiceTemplateById(id: number) {
    const template = await InvoiceTemplate.findByPk(id);
    if (!template) {
      throw new AppError('Invoice template not found', 404);
    }
    return template;
  }

  async getAllInvoiceTemplates(query: PaginationOptions & {
    search?: string;
    mainTemplate?: boolean;
  }) {
    const { page = 1, limit = 10, search = '', mainTemplate } = query;
    const offset = (page - 1) * limit;

    const whereClause: any = {};

    if (mainTemplate !== undefined) {
      whereClause.mainTemplate = mainTemplate;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await InvoiceTemplate.findAndCountAll({
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

  async updateInvoiceTemplate(
    id: number,
    data: Partial<IInvoiceTemplate>
  ) {
    const template = await InvoiceTemplate.findByPk(id);
    if (!template) {
      throw new AppError('Invoice template not found', 404);
    }

    // Check if updating name and if a template with the same name already exists (excluding current template)
    if (data.name) {
      const existingTemplate = await InvoiceTemplate.findOne({
        where: {
          name: data.name,
          id: { [Op.ne]: id },
        },
      });

      if (existingTemplate) {
        throw new AppError(`An invoice template with the name "${data.name}" already exists`, 400);
      }
    }

    await template.update(data);
    return template;
  }

  async deleteInvoiceTemplate(id: number) {
    const template = await InvoiceTemplate.findByPk(id);
    if (!template) {
      throw new AppError('Invoice template not found', 404);
    }
    if (template.mainTemplate) {
      throw new AppError('Default template cannot be deleted', 400);
    }
    await template.destroy();
    try {
      await CustomerAssignInvoiceTemplate.destroy({
        where: {
          templateId: id,
        },
      });

    } catch (error) {
      throw new AppError('Error deleting customer assign invoice template', 500);
    }
    return { message: 'Invoice template deleted successfully' };
  }


  async getCustomerInvoiceTemplate(customerNumber: number) {
    const template = await CustomerAssignInvoiceTemplate.findOne({
      where: { customerNumber: customerNumber },
    });
    if (template) {


      const invoiceTemplate = await InvoiceTemplate.findByPk(template.templateId);
      return invoiceTemplate;
    } else {
      {
        const template = await InvoiceTemplate.findOne({
          where: { mainTemplate: true },
        });
        if (template) {
          return template;
        } else {
          throw new AppError('Default template not found', 404);
        }
      }
    }
  }


  async getCustomerByInvoiceId(invoiceId: number) {
    const customerInvoice = await CustomerAssignInvoiceTemplate.findAll({
      attributes: ['customerNumber'],
      where: {
        templateId: invoiceId,
      }
    });

    const finalCustomer = Promise.all(customerInvoice.map(async (customer) => {
      const customerData = await Customer.findOne({
        attributes: ['C_Number', 'C_Name'],
        where: {
          C_Number: customer.customerNumber,
        }
      });
      return customerData;
    }));

    return finalCustomer;

  }



  async getCustomerListForTradeShow(query: PaginationOptions & { search?: string, Inactive?: string, cot?: string[] }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';


    let whereCondition: any = search
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

    if (query?.cot && query?.cot?.length > 0) {
      whereCondition.C_ClassOfTrade = { [Op.in]: query?.cot as string[] || [] };
    }

    if (query.Inactive == 'true') {
      whereCondition.C_Inactive = true;
    } else if (query.Inactive == 'false') {
      whereCondition.C_Inactive = false;
    }
    console.log(whereCondition, 'whereCondition')

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

    return {
      data: customerList,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };

  }


  async uploadItemImage(req: Request) {
    const file = req.file;
    const { itemNumber } = req.body;

    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (!itemNumber) {
      throw new AppError('Item number is required', 400);
    }

    // Create filename with item number and original file extension
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${itemNumber}.${fileExtension}`;

    const result = await uploadFileToAzure(file.buffer, fileName, file.mimetype, 'item-images');
    if (!result.success) {
      throw new AppError(result.error || 'Failed to upload image', 500);
    }
    return result;
  }

  async bulkUploadItemImages(body: Array<{ itemNumber: string | number; img_url: string }>) {
    if (!Array.isArray(body) || body.length === 0) {
      throw new AppError('Invalid request body. Expected an array of items with itemNumber and img_url', 400);
    }

    const results = [];
    const errors = [];

    for (const item of body) {
      try {
        const { itemNumber, img_url } = item;

        if (!itemNumber || !img_url) {
          errors.push({
            itemNumber: itemNumber || 'missing',
            error: 'itemNumber and img_url are required'
          });
          continue;
        }

        // Convert itemNumber to string to match product_number field type
        const productNumber = itemNumber.toString().trim();
        const imageUrl = img_url.trim();

        // Check if product_image exists with this product_number
        const existingProductImage = await ProductImage.findOne({
          where: { product_number: productNumber }
        });

        let productImage;
        let action: 'created' | 'updated';

        if (existingProductImage) {
          // Update existing record
          await existingProductImage.update({
            img_url: imageUrl,
            isAllow: true,
            isActive: true,
          });
          productImage = existingProductImage;
          action = 'updated';
        } else {
          // Create new record
          productImage = await ProductImage.create({
            product_number: productNumber,
            img_url: imageUrl,
            isAllow: true,
            isActive: true,
          });
          action = 'created';
        }

        results.push({
          itemNumber: productNumber,
          img_url: imageUrl,
          action,
          id: productImage.id,
        });
      } catch (error: any) {
        errors.push({
          itemNumber: item.itemNumber || 'unknown',
          error: error.message || 'Failed to process item',
        });
      }
    }

    return {
      success: errors.length === 0,
      processed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async getCustomerListForEmailModules() {
    // Get all customer numbers that are already assigned to invoice templates
    const assignedCustomers = await CustomerAssignInvoiceTemplate.findAll({
      attributes: ['customerNumber'],
      raw: true,
    });

    const assignedCustomerNumbers = assignedCustomers.map((c: any) => c.customerNumber);

    // Get all active customers from MSSQL Customer table that are not in the assigned list
    const whereCondition: any = {
      C_Inactive: { [Op.or]: [false] }, // Active customers (C_Inactive is false or null)
    };

    // Exclude customers that are already assigned
    if (assignedCustomerNumbers.length > 0) {
      whereCondition.C_Number = {
        [Op.notIn]: assignedCustomerNumbers,
      };
    }

    const customers = await Customer.findAll({
      attributes: [
        'C_Number',
        'C_Name'

      ],
      where: whereCondition,
      order: [['C_Name', 'ASC']],
    });

    return customers;
  }

  // ProductDiscount CRUD methods
  async createProductDiscount(body: {
    ItemNumber: number;
    quantity: number;
    discountType: string;
    discountValue: number;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
  }) {
    const productDiscount = await ProductDiscount.create({
      ItemNumber: body.ItemNumber,
      quantity: body.quantity,
      discountType: body.discountType,
      discountValue: body.discountValue,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive ?? true,
    });

    // Sync to Redis in background (don't wait for it)
    syncProductDiscountsToRedis().catch((error) => {
      console.error('Error syncing discounts to Redis after create:', error);
    });

    return productDiscount;
  }

  async getProductDiscountById(id: number) {
    const productDiscount = await ProductDiscount.findByPk(id);
    if (!productDiscount) {
      throw new AppError(Manager.PRODUCT_DISCOUNT_NOT_FOUND, 404);
    }
    return productDiscount;
  }

  async getAllProductDiscounts(query: PaginationOptions & {
    search?: string;
    ItemNumber?: number;
    isActive?: boolean;
  }) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search || '';

    const whereCondition: any = {};

    if (search) {
      whereCondition[Op.or] = [
        { ItemNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    if (query.ItemNumber !== undefined) {
      whereCondition.ItemNumber = query.ItemNumber;
    }

    if (query.isActive !== undefined) {
      whereCondition.isActive = query.isActive;
    }

    const { count: totalCount, rows: productDiscounts } = await ProductDiscount.findAndCountAll({
      where: whereCondition,
      limit,
      offset: (page - 1) * limit,
      order: [['id', 'DESC']],
    });

    console.log(productDiscounts, 'productDiscounts')
    // Fix: await Promise.all, actually get the data before returning
    const finalProductDiscounts = await Promise.all(productDiscounts.map(async (productDiscount) => {

      let productTemp = productDiscount.dataValues;
      const productData = await Inventory.findOne({
        attributes: ['Item_Number', 'Description'],
        where: {
          Item_Number: Number(productTemp.ItemNumber),
        }
      });
      return {
        ...productTemp,
        productData: productData,
      };
    }));

    return {
      data: finalProductDiscounts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async updateProductDiscount(id: number, body: Partial<{
    ItemNumber: number;
    quantity: number;
    discountType: string;
    discountValue: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>) {
    const productDiscount = await ProductDiscount.findByPk(id);
    if (!productDiscount) {
      throw new AppError(Manager.PRODUCT_DISCOUNT_NOT_FOUND, 404);
    }

    // Validate that endDate is after startDate if both are being updated
    if (body.startDate && body.endDate) {
      if (new Date(body.endDate) <= new Date(body.startDate)) {
        throw new AppError('End date must be after start date', 400);
      }
    } else if (body.endDate && !body.startDate) {
      // If only endDate is being updated, compare with existing startDate
      if (new Date(body.endDate) <= new Date(productDiscount.startDate)) {
        throw new AppError('End date must be after start date', 400);
      }
    } else if (body.startDate && !body.endDate) {
      // If only startDate is being updated, compare with existing endDate
      if (new Date(productDiscount.endDate) <= new Date(body.startDate)) {
        throw new AppError('End date must be after start date', 400);
      }
    }

    await productDiscount.update(body);

    // Sync to Redis in background (don't wait for it)
    syncProductDiscountsToRedis().catch((error) => {
      console.error('Error syncing discounts to Redis after update:', error);
    });

    return productDiscount;
  }

  async deleteProductDiscount(id: number) {
    const productDiscount = await ProductDiscount.findByPk(id);
    if (!productDiscount) {
      throw new AppError(Manager.PRODUCT_DISCOUNT_NOT_FOUND, 404);
    }
    await productDiscount.destroy();

    // Sync to Redis in background (don't wait for it)
    syncProductDiscountsToRedis().catch((error) => {
      console.error('Error syncing discounts to Redis after delete:', error);
    });

    return { success: true, message: 'Product discount deleted successfully' };
  }

  // Sync product discounts to Redis (can be called manually or via cron)
  async syncProductDiscountsToRedisManual() {
    const result = await syncProductDiscountsToRedis();
    return result;
  }

  // Get product discounts from Redis
  async getProductDiscountsFromRedis(query: {
    itemNumber?: number;
    date?: string;
    getAll?: boolean;
  }) {
    try {


      // // If itemNumber is provided, get discount for that specific item
      // if (query.itemNumber) {
      //   const discount = await getProductDiscountFromRedis(query.itemNumber);
      //   const allDiscounts = await getAllProductDiscountsForItemFromRedis(query.itemNumber);

      //   return {
      //     itemNumber: query.itemNumber,
      //     bestDiscount: discount,
      //     allDiscounts: allDiscounts,
      //     totalDiscounts: allDiscounts.length
      //   };
      // }

      // // If date is provided, get discounts for that date
      // if (query.date) {
      //   const discounts = await getProductDiscountsByDateFromRedis(query.date);
      //   return {
      //     date: query.date,
      //     discounts: discounts,
      //     totalDiscounts: discounts.length
      //   };
      // }

      // If getAll is true or no specific query, return all discounts
      const allDiscounts = await getAllProductDiscountsFromRedis();
      return {
        discounts: allDiscounts,
        totalDiscounts: allDiscounts.length,
        date: new Date().toISOString().split('T')[0]
      };
    } catch (error: any) {
      console.error('Error fetching discounts from Redis:', error);
      throw new AppError('Failed to fetch discounts from Redis', 500);
    }
  }

  // Get discounted price for an item from Redis
  async getDiscountedPriceFromRedisService(
    itemNumber: number,
    quantity: number,
    originalPrice: number
  ) {
    try {
      const discountInfo = await getDiscountedPriceFromRedis(itemNumber, quantity, originalPrice);

      if (!discountInfo) {
        return {
          hasDiscount: false,
          itemNumber,
          quantity,
          originalPrice,
          finalPrice: originalPrice,
          message: 'No discount available for this item'
        };
      }

      return discountInfo;
    } catch (error: any) {
      console.error('Error calculating discounted price from Redis:', error);
      throw new AppError('Failed to calculate discounted price from Redis', 500);
    }
  }
  async getTodayCount(query: any) {
    const { startDate, endDate } = query;

    let dateFilter: any;

    if (startDate && endDate) {
      dateFilter = {
        [Op.between]: [startDate, endDate],
      };
    }

    else if (startDate) {
      dateFilter = startDate;
    }

    else {
      const today = new Date().toISOString().slice(0, 10);
      dateFilter = today;
    }

    const count = await ApiLog.count({
      where: where(
        fn('DATE', col('createdAt')),
        dateFilter
      ),
    });

    return count;
  }

  async getActiveMobileDevice() {

    const devices = await RetailerDevice.findAll({
      where: {
        isAllow: true,
        sessionActive: true,
        isActive: true,
      },
      attributes: ['customerNumber', 'updatedAt', 'deviceName']
    });

    const result: any[] = [];

    for (const device of devices) {

      const allowDate = device.updatedAt;

      const endDate = new Date(allowDate);
      endDate.setDate(endDate.getDate() + 21);

      const mobileOrder = await OrderHeader.findOne({
        where: {
          C_Number: device.customerNumber,
          Order_Source: 12,
          Order_Date: {
            [Op.between]: [allowDate, endDate],
          },
        },
        attributes: ['Order_Number', 'Order_Date'],
        include: [
          {
            model: Customer,
            attributes: ['C_Number', 'C_Name'],
            as: 'customer',
            required: false,
          }
        ]
      });

      result.push({
        customerNumber: device.customerNumber,
        customerDevice: device.deviceName,
        customerName: (mobileOrder as any)?.customer?.C_Name || null,

        allowDate,
        orderWithin3Weeks: mobileOrder ? true : false,
        orderNumber: mobileOrder?.Order_Number || null,
        orderDate: mobileOrder?.Order_Date || null,
      });
    }

    return result;
  }

  async getCustomerLastSaleReport(req: any) {
    // const { startDate, endDate } = req.query;

    const startDate = req.startDate;
    const endDate = req.endDate;

    const customers = await Customer.findAll({
      attributes: [
        'C_Number',
        'C_Name',
        'C_Address',
        'C_City',
        'C_State',
        'C_Zip',
        'C_Phone',
        'Jurisdiction_State',
        'Jurisdiction_County',
        'Jurisdiction_City',
        'C_ClassOfTrade',
        'C_Inactive',
      ],
      include: [
        {
          model: OrderHeader,
          as: 'orderHeaders',
          required: true,
          attributes: [
            'Order_Number',
            'Invoice_Number',
            'Invoice_Date',
            'Invoice_Total',
            'S_Number',
            'Route_Number',
            [fn('ISNULL', col('orderHeaders.Order_Number'), -1), 'Document_Number'],
          ],
          where: {
            Order_Updated: true,
            Order_Deleted: false,
            Invoice_Date: {
              [Op.between]: [new Date(startDate), new Date(endDate)],
              [Op.not]: null,
            },
          },
        },
      ],
      order: [
        [{ model: OrderHeader, as: 'orderHeaders' }, 'Invoice_Date', 'ASC'],
        [{ model: OrderHeader, as: 'orderHeaders' }, 'Order_Number', 'ASC'],
      ],
      raw: true,
    });

    return customers;


  }

  async getCustomerNoSalesReport(query: any) {

    const startDate = query?.startDate;
    const endDate = query?.endDate;

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }

    const customers = await Customer.findAll({

      attributes: [
        'C_Number',
        'C_Name',
        'C_Address',
        'C_City',
        'C_State',
        'C_Zip',
        'C_Phone',
        'Jurisdiction_State',
        'Jurisdiction_County',
        'Jurisdiction_City',
        'C_ClassOfTrade',
        'C_Inactive',


        // Invoice_Date from join
        [col('orderHeaders.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeaders.Invoice_Total'), 'Invoice_Total'],
        [col('orderHeaders.Order_Number'), 'Order_Number'],
        [col('orderHeaders.S_Number'), 'S_Number'],
        [col('orderHeaders.Route_Number'), 'Route_Number'],

        // Subquery Count
        [
          literal(`
            ISNULL(
              (SELECT COUNT(Order_Number)
               FROM Order_Header
               WHERE Customer.C_Number = Order_Header.C_Number
               AND Invoice_Date >= '${startDate}'
               AND Invoice_Date <= '${endDate}'
              ), 0
            )
          `),
          'iCount'
        ]
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeaders',
          required: false, // LEFT JOIN
          attributes: [],
          where: {
            Order_Updated: true,
            Order_Deleted: false,
          },
        },
      ],

      where: literal(`
        ISNULL(
          (SELECT COUNT(Order_Number)
           FROM Order_Header
           WHERE Customer.C_Number = Order_Header.C_Number
           AND Invoice_Date >= '${startDate}'
           AND Invoice_Date <= '${endDate}'
          ), 0
        ) = 0
      `),

      order: [
        [col('orderHeaders.Invoice_Date'), 'ASC'],
        [col('orderHeaders.Order_Number'), 'ASC'],
      ],

      raw: true,
    });

    return customers;
  }

  async getInventoryLogHistory(query: any) {
    const { Item_Number, modifyValue } = query;

    if (!Item_Number || !modifyValue) {
      throw new Error("itemNumber and modifyValue are required");
    }

    const allowedColumns = [
      "BaseCost",
      "NetCost",
      "Invoice_Cost",
      "AvgCost",
      "Price1",
      "Price2",
      "Price3",
      "Price4",
      "Price5",
      "Price6",
      "Price7",
      "Price10",
      "Price11",
      "Price12",
      "Price13",
      "Price14",
      "Price15",
      "Price16",
      "Price17",
      "Price18",
      "Price19"
    ];

    if (!allowedColumns.includes(modifyValue)) {
      throw new Error("Invalid price column selected");
    }

    const ItemHistory = await InventoryLogHistory.findAll({
      attributes: ['Item_Number', 'Description', 'Primary_Vendor', modifyValue
        //  'BaseCost', 'NetCost', 'Invoice_Cost', 'AvgCost', 'Price1', 'Price2', 'Price3', 'Price4', 'Price5', 'Price6'
        // , 'Price7', 'Price10', 'Price11', 'Price12', 'Price13', 'Price14', 'Price15', 'Price16', 'Price17', 'Price18', 'Price19',
      ],
      where: {
        Item_Number: Item_Number,
      }
    })
    return ItemHistory
  }

  async getCustomerWithProfit(query: any) {
    const { startDate, endDate, Value_Code } = query

    const data = await OrderHeader.findAll({

      where: {
        Order_Updated: 'True',
        Order_Deleted: 'False',
        Invoice_Date: {
          [Op.between]: [startDate, endDate]
        }
      },

      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Name', 'C_CoName', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Country', 'C_Phone', 'Jurisdiction_State',
            'Jurisdiction_County',
            'Jurisdiction_City',
            'C_ClassOfTrade',
            'C_Inactive',],
          required: false
        },
        {
          model: Order_Header_Costs,
          attributes: [],
          required: false,
          as: 'Order_Header_Costs',
          where: {
            Value_Code: Value_Code,
          },
        }
      ],

      attributes: {
        include: [

          // Document Number Logic
          [
            literal(`
              IIF(OrderHeader.Invoice_Number_Legacy <> 0,
                CONVERT(VARCHAR(10), OrderHeader.Invoice_Number_Legacy),
                IIF(OrderHeader.Invoice_Number > 1,
                  CONCAT(OrderHeader.Order_Number, '-', OrderHeader.Invoice_Number),
                  CONVERT(VARCHAR(10), OrderHeader.Order_Number)
                )
              )
            `),
            'Document_Number'
          ],

          // Total Sales 01-12
          [literal('Sales01 + Taxes01'), 'totalSales01'],
          [literal('Sales02 + Taxes02'), 'totalSales02'],
          [literal('Sales03 + Taxes03'), 'totalSales03'],
          [literal('Sales04 + Taxes04'), 'totalSales04'],
          [literal('Sales05 + Taxes05'), 'totalSales05'],
          [literal('Sales06 + Taxes06'), 'totalSales06'],
          [literal('Sales07 + Taxes07'), 'totalSales07'],
          [literal('Sales08 + Taxes08'), 'totalSales08'],
          [literal('Sales09 + Taxes09'), 'totalSales09'],
          [literal('Sales10 + Taxes10'), 'totalSales10'],
          [literal('Sales11 + Taxes11'), 'totalSales11'],
          [literal('Sales12 + Taxes12'), 'totalSales12'],

          // Total Cost 01-12
          [literal('Order_Header_Costs.Value01 + Taxes01'), 'totalCost01'],
          [literal('Order_Header_Costs.Value02 + Taxes02'), 'totalCost02'],
          [literal('Order_Header_Costs.Value03 + Taxes03'), 'totalCost03'],
          [literal('Order_Header_Costs.Value04 + Taxes04'), 'totalCost04'],
          [literal('Order_Header_Costs.Value05 + Taxes05'), 'totalCost05'],
          [literal('Order_Header_Costs.Value06 + Taxes06'), 'totalCost06'],
          [literal('Order_Header_Costs.Value07 + Taxes07'), 'totalCost07'],
          [literal('Order_Header_Costs.Value08 + Taxes08'), 'totalCost08'],
          [literal('Order_Header_Costs.Value09 + Taxes09'), 'totalCost09'],
          [literal('Order_Header_Costs.Value10 + Taxes10'), 'totalCost10'],
          [literal('Order_Header_Costs.Value11 + Taxes11'), 'totalCost11'],
          [literal('Order_Header_Costs.Value12 + Taxes12'), 'totalCost12'],

          // Total Sales Tax
          [literal('stax_State + stax_County + stax_City'), 'totalSalesTax'],

          // Rep Name Subquery
          [
            literal(`
              (SELECT S_Desc 
               FROM SalesRep 
               WHERE SalesRep.S_Number = customer.C_Salesman)
            `),
            'RepName'
          ],

          // Profit 
          [literal(`(ISNULL(OrderHeader.Sales01, 0) - ISNULL(Order_Header_Costs.Value01, 0) )`), 'profit01'],
          [literal(`(ISNULL(OrderHeader.Sales02, 0) - ISNULL(Order_Header_Costs.Value02, 0) )`), 'profit02'],
          [literal(`(ISNULL(OrderHeader.Sales03, 0) - ISNULL(Order_Header_Costs.Value03, 0) )`), 'profit03'],
          [literal(`(ISNULL(OrderHeader.Sales04, 0) - ISNULL(Order_Header_Costs.Value04, 0) )`), 'profit04'],
          [literal(`(ISNULL(OrderHeader.Sales05, 0) - ISNULL(Order_Header_Costs.Value05, 0))`), 'profit05'],
          [literal(`(ISNULL(OrderHeader.Sales06, 0) - ISNULL(Order_Header_Costs.Value06, 0) )`), 'profit06'],
          [literal(`(ISNULL(OrderHeader.Sales07, 0) - ISNULL(Order_Header_Costs.Value07, 0) )`), 'profit07'],
          [literal(`(ISNULL(OrderHeader.Sales08, 0) - ISNULL(Order_Header_Costs.Value08, 0) )`), 'profit08'],
          [literal(`(ISNULL(OrderHeader.Sales09, 0) - ISNULL(Order_Header_Costs.Value09, 0))`), 'profit09'],
          [literal(`(ISNULL(OrderHeader.Sales10, 0) - ISNULL(Order_Header_Costs.Value10, 0) )`), 'profit10'],
          [literal(`(ISNULL(OrderHeader.Sales11, 0) - ISNULL(Order_Header_Costs.Value11, 0) )`), 'profit11'],
          [literal(`(ISNULL(OrderHeader.Sales12, 0) - ISNULL(Order_Header_Costs.Value12, 0) )`), 'profit12'],


          // Profiy in %
          [literal(`((ISNULL(OrderHeader.Sales01,0) - ISNULL(Order_Header_Costs.Value01,0)) / NULLIF(ISNULL(OrderHeader.Sales01,0) + ISNULL(OrderHeader.Taxes01,0),0)) * 100`), 'profitPercent01'],
          [literal(`((ISNULL(OrderHeader.Sales02,0) - ISNULL(Order_Header_Costs.Value02,0)) / NULLIF(ISNULL(OrderHeader.Sales02,0) + ISNULL(OrderHeader.Taxes02,0),0)) * 100`), 'profitPercent02'],
          [literal(`((ISNULL(OrderHeader.Sales03,0) - ISNULL(Order_Header_Costs.Value03,0)) / NULLIF(ISNULL(OrderHeader.Sales03,0) + ISNULL(OrderHeader.Taxes03,0),0)) * 100`), 'profitPercent03'],
          [literal(`((ISNULL(OrderHeader.Sales04,0) - ISNULL(Order_Header_Costs.Value04,0)) / NULLIF(ISNULL(OrderHeader.Sales04,0) + ISNULL(OrderHeader.Taxes04,0),0)) * 100`), 'profitPercent04'],
          [literal(`((ISNULL(OrderHeader.Sales05,0) - ISNULL(Order_Header_Costs.Value05,0)) / NULLIF(ISNULL(OrderHeader.Sales05,0) + ISNULL(OrderHeader.Taxes05,0),0)) * 100`), 'profitPercent05'],
          [literal(`((ISNULL(OrderHeader.Sales06,0) - ISNULL(Order_Header_Costs.Value06,0)) / NULLIF(ISNULL(OrderHeader.Sales06,0) + ISNULL(OrderHeader.Taxes06,0),0)) * 100`), 'profitPercent06'],
          [literal(`((ISNULL(OrderHeader.Sales07,0) - ISNULL(Order_Header_Costs.Value07,0)) / NULLIF(ISNULL(OrderHeader.Sales07,0) + ISNULL(OrderHeader.Taxes07,0),0)) * 100`), 'profitPercent07'],
          [literal(`((ISNULL(OrderHeader.Sales08,0) - ISNULL(Order_Header_Costs.Value08,0)) / NULLIF(ISNULL(OrderHeader.Sales08,0) + ISNULL(OrderHeader.Taxes08,0),0)) * 100`), 'profitPercent08'],
          [literal(`((ISNULL(OrderHeader.Sales09,0) - ISNULL(Order_Header_Costs.Value09,0)) / NULLIF(ISNULL(OrderHeader.Sales09,0) + ISNULL(OrderHeader.Taxes09,0),0)) * 100`), 'profitPercent09'],
          [literal(`((ISNULL(OrderHeader.Sales10,0) - ISNULL(Order_Header_Costs.Value10,0)) / NULLIF(ISNULL(OrderHeader.Sales10,0) + ISNULL(OrderHeader.Taxes10,0),0)) * 100`), 'profitPercent10'],
          [literal(`((ISNULL(OrderHeader.Sales11,0) - ISNULL(Order_Header_Costs.Value11,0)) / NULLIF(ISNULL(OrderHeader.Sales11,0) + ISNULL(OrderHeader.Taxes11,0),0)) * 100`), 'profitPercent11'],
          [literal(`((ISNULL(OrderHeader.Sales12,0) - ISNULL(Order_Header_Costs.Value12,0)) / NULLIF(ISNULL(OrderHeader.Sales12,0) + ISNULL(OrderHeader.Taxes12,0),0)) * 100`), 'profitPercent12'],
        ]
      },

      order: [
        ['Invoice_Date', 'ASC'],
        ['Order_Number', 'ASC']
      ],

      raw: true,


    });
    return data
  }

  async getCustomerRankingSales(data: any) {
    const { startDate, endDate, Value_Code } = data;

    const result = await OrderHeader.findAll({
      where: {
        Order_Updated: 'True',
        Order_Deleted: 'False',
        Invoice_Date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      attributes: [
        'C_Number',
        'Route_Number',
        'S_Number',

        // Sales Monthly
        [Sequelize.literal('SUM(Sales01+Taxes01)'), 'tSales01'],
        [Sequelize.literal('SUM(Sales02+Taxes02)'), 'tSales02'],
        [Sequelize.literal('SUM(Sales03+Taxes03)'), 'tSales03'],
        [Sequelize.literal('SUM(Sales04+Taxes04)'), 'tSales04'],
        [Sequelize.literal('SUM(Sales05+Taxes05)'), 'tSales05'],
        [Sequelize.literal('SUM(Sales06+Taxes06)'), 'tSales06'],
        [Sequelize.literal('SUM(Sales07+Taxes07)'), 'tSales07'],
        [Sequelize.literal('SUM(Sales08+Taxes08)'), 'tSales08'],
        [Sequelize.literal('SUM(Sales09+Taxes09)'), 'tSales09'],
        [Sequelize.literal('SUM(Sales10+Taxes10)'), 'tSales10'],
        [Sequelize.literal('SUM(Sales11+Taxes11)'), 'tSales11'],
        [Sequelize.literal('SUM(Sales12+Taxes12)'), 'tSales12'],

        [
          Sequelize.literal(`
          SUM(
            Sales01+Taxes01+Sales02+Taxes02+Sales03+Taxes03+
            Sales04+Taxes04+Sales05+Taxes05+Sales06+Taxes06+
            Sales07+Taxes07+Sales08+Taxes08+Sales09+Taxes09+
            Sales10+Taxes10+Sales11+Taxes11+Sales12+Taxes12
          )
        `),
          'totalSales'
        ],

        // Cost Monthly
        [Sequelize.literal('SUM(Value01+Taxes01)'), 'tCost01'],
        [Sequelize.literal('SUM(Value02+Taxes02)'), 'tCost02'],
        [Sequelize.literal('SUM(Value03+Taxes03)'), 'tCost03'],
        [Sequelize.literal('SUM(Value04+Taxes04)'), 'tCost04'],
        [Sequelize.literal('SUM(Value05+Taxes05)'), 'tCost05'],
        [Sequelize.literal('SUM(Value06+Taxes06)'), 'tCost06'],
        [Sequelize.literal('SUM(Value07+Taxes07)'), 'tCost07'],
        [Sequelize.literal('SUM(Value08+Taxes08)'), 'tCost08'],
        [Sequelize.literal('SUM(Value09+Taxes09)'), 'tCost09'],
        [Sequelize.literal('SUM(Value10+Taxes10)'), 'tCost10'],
        [Sequelize.literal('SUM(Value11+Taxes11)'), 'tCost11'],
        [Sequelize.literal('SUM(Value12+Taxes12)'), 'tCost12'],

        [
          Sequelize.literal(`
          SUM(
            Value01+Taxes01+Value02+Taxes02+Value03+Taxes03+
            Value04+Taxes04+Value05+Taxes05+Value06+Taxes06+
            Value07+Taxes07+Value08+Taxes08+Value09+Taxes09+
            Value10+Taxes10+Value11+Taxes11+Value12+Taxes12
          )
        `),
          'totalCost'
        ],
        // Profit Monthly
        [Sequelize.literal('SUM((Sales01+Taxes01) - (Value01+Taxes01))'), 'profit01'],
        [Sequelize.literal('SUM((Sales02+Taxes02) - (Value02+Taxes02))'), 'profit02'],
        [Sequelize.literal('SUM((Sales03+Taxes03) - (Value03+Taxes03))'), 'profit03'],
        [Sequelize.literal('SUM((Sales04+Taxes04) - (Value04+Taxes04))'), 'profit04'],
        [Sequelize.literal('SUM((Sales05+Taxes05) - (Value05+Taxes05))'), 'profit05'],
        [Sequelize.literal('SUM((Sales06+Taxes06) - (Value06+Taxes06))'), 'profit06'],
        [Sequelize.literal('SUM((Sales07+Taxes07) - (Value07+Taxes07))'), 'profit07'],
        [Sequelize.literal('SUM((Sales08+Taxes08) - (Value08+Taxes08))'), 'profit08'],
        [Sequelize.literal('SUM((Sales09+Taxes09) - (Value09+Taxes09))'), 'profit09'],
        [Sequelize.literal('SUM((Sales10+Taxes10) - (Value10+Taxes10))'), 'profit10'],
        [Sequelize.literal('SUM((Sales11+Taxes11) - (Value11+Taxes11))'), 'profit11'],
        [Sequelize.literal('SUM((Sales12+Taxes12) - (Value12+Taxes12))'), 'profit12'],

        // Profit in % 
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales01,0)) - SUM(ISNULL(Order_Header_Costs.Value01,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales01,0) + ISNULL(OrderHeader.Taxes01,0)),0)) * 100`), 'profitPercent01'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales02,0)) - SUM(ISNULL(Order_Header_Costs.Value02,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales02,0) + ISNULL(OrderHeader.Taxes02,0)),0)) * 100`), 'profitPercent02'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales03,0)) - SUM(ISNULL(Order_Header_Costs.Value03,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales03,0) + ISNULL(OrderHeader.Taxes03,0)),0)) * 100`), 'profitPercent03'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales04,0)) - SUM(ISNULL(Order_Header_Costs.Value04,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales04,0) + ISNULL(OrderHeader.Taxes04,0)),0)) * 100`), 'profitPercent04'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales05,0)) - SUM(ISNULL(Order_Header_Costs.Value05,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales05,0) + ISNULL(OrderHeader.Taxes05,0)),0)) * 100`), 'profitPercent05'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales06,0)) - SUM(ISNULL(Order_Header_Costs.Value06,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales06,0) + ISNULL(OrderHeader.Taxes06,0)),0)) * 100`), 'profitPercent06'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales07,0)) - SUM(ISNULL(Order_Header_Costs.Value07,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales07,0) + ISNULL(OrderHeader.Taxes07,0)),0)) * 100`), 'profitPercent07'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales08,0)) - SUM(ISNULL(Order_Header_Costs.Value08,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales08,0) + ISNULL(OrderHeader.Taxes08,0)),0)) * 100`), 'profitPercent08'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales09,0)) - SUM(ISNULL(Order_Header_Costs.Value09,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales09,0) + ISNULL(OrderHeader.Taxes09,0)),0)) * 100`), 'profitPercent09'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales10,0)) - SUM(ISNULL(Order_Header_Costs.Value10,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales10,0) + ISNULL(OrderHeader.Taxes10,0)),0)) * 100`), 'profitPercent10'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales11,0)) - SUM(ISNULL(Order_Header_Costs.Value11,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales11,0) + ISNULL(OrderHeader.Taxes11,0)),0)) * 100`), 'profitPercent11'],
        [Sequelize.literal(`((SUM(ISNULL(OrderHeader.Sales12,0)) - SUM(ISNULL(Order_Header_Costs.Value12,0))) / NULLIF(SUM(ISNULL(OrderHeader.Sales12,0) + ISNULL(OrderHeader.Taxes12,0)),0)) * 100`), 'profitPercent12'],

      ],

      include: [
        {
          model: Customer,
          attributes: [
            'C_Number',
            'C_Name',
            'C_Address',
            'C_City',
            'C_State',
            'C_Zip',
            'C_Phone',
            'Jurisdiction_State',
            'Jurisdiction_County',
            'Jurisdiction_City',
            'C_ClassOfTrade',
            'C_Inactive',
          ],
          as: 'customer',
          required: false,
        },
        {
          model: Order_Header_Costs,
          attributes: [],
          as: 'Order_Header_Costs',
          required: false,
          where: {
            Value_Code: Value_Code,
          },
        },
      ],

      group: [
        'OrderHeader.C_Number',
        'OrderHeader.Route_Number',
        'OrderHeader.S_Number',
        'customer.C_Number',
        'customer.C_Name',
        'customer.C_Address',
        'customer.C_City',
        'customer.C_State',
        'customer.C_Zip',
        'customer.C_Phone',
        'customer.Jurisdiction_State',
        'customer.Jurisdiction_County',
        'customer.Jurisdiction_City',
        'customer.C_ClassOfTrade',
        'customer.C_Inactive'
      ],

      raw: true,
    });

    return result;
  }

  async getDailySalesReport(data: any) {
    const { startDate, endDate } = data;

    const orders = await OrderHeader.findAll({
      attributes: [
        'Invoice_Deposit',
        'Delivery_Charge',
        'Other_Charge',
        'S_Number',
        'Route_Number',
        'PrepaidTax_Amount',

        // Document_Number
        [
          sequelize.literal(`
            IIF(OrderHeader.Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), OrderHeader.Invoice_Number_Legacy),
              IIF(OrderHeader.Invoice_Number > 1,
                CONCAT(OrderHeader.Order_Number, '-', OrderHeader.Invoice_Number),
                CONVERT(VARCHAR(10), OrderHeader.Order_Number)
              )
            )
          `),
          'Document_Number'
        ],

        // Total Sales 01–12
        [sequelize.literal(`Sales01 + Taxes01`), 'totalSales01'],
        [sequelize.literal(`Sales02 + Taxes02`), 'totalSales02'],
        [sequelize.literal(`Sales03 + Taxes03`), 'totalSales03'],
        [sequelize.literal(`Sales04 + Taxes04`), 'totalSales04'],
        [sequelize.literal(`Sales05 + Taxes05`), 'totalSales05'],
        [sequelize.literal(`Sales06 + Taxes06`), 'totalSales06'],
        [sequelize.literal(`Sales07 + Taxes07`), 'totalSales07'],
        [sequelize.literal(`Sales08 + Taxes08`), 'totalSales08'],
        [sequelize.literal(`Sales09 + Taxes09`), 'totalSales09'],
        [sequelize.literal(`Sales10 + Taxes10`), 'totalSales10'],
        [sequelize.literal(`Sales11 + Taxes11`), 'totalSales11'],
        [sequelize.literal(`Sales12 + Taxes12`), 'totalSales12'],

        // Total Tax
        [sequelize.literal(`stax_State + stax_County + stax_City`), 'totalSalesTax'],

        [
          sequelize.literal(`
                              OrderHeader.Sales01 + OrderHeader.Taxes01 +
                              OrderHeader.Sales02 + OrderHeader.Taxes02 +
                              OrderHeader.Sales03 + OrderHeader.Taxes03 +
                              OrderHeader.Sales04 + OrderHeader.Taxes04 +
                              OrderHeader.Sales05 + OrderHeader.Taxes05 +
                              OrderHeader.Sales06 + OrderHeader.Taxes06 +
                              OrderHeader.Sales07 + OrderHeader.Taxes07 +
                              OrderHeader.Sales08 + OrderHeader.Taxes08 +
                              OrderHeader.Sales09 + OrderHeader.Taxes09 +
                              OrderHeader.Sales10 + OrderHeader.Taxes10 +
                              OrderHeader.Sales11 + OrderHeader.Taxes11 +
                              OrderHeader.Sales12 + OrderHeader.Taxes12
                            `),
          'totalCost'
        ]

      ],

      include: [
        {
          model: Customer,
          attributes: [
            'c_name',
            'c_address',
            'c_city',
            'c_state',
            'c_zip',
            'c_phone',
            'c_Salesman',
            'C_ClassOfTrade',
            'Jurisdiction_State',
            'Jurisdiction_County',
            'Jurisdiction_City',
            'C_Inactive',
          ],
          as: 'customer',
          required: false // LEFT JOIN
        }
      ],

      where: {
        Order_Updated: true,
        Order_Deleted: false,
        Invoice_Date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },

      order: [
        ['Invoice_Date', 'ASC'],
        ['Order_Number', 'ASC']
      ]
    });

    return orders;
  };

  async getCustomerPrepaidSalesTax(data: any) {
    const { startDate, endDate } = data;

    const orders = await OrderHeader.findAll({
      attributes: [
        // Document Number
        [
          sequelize.literal(`
            IIF(OrderHeader.Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), OrderHeader.Invoice_Number_Legacy),
              IIF(OrderHeader.Invoice_Number > 1,
                CONCAT(OrderHeader.Order_Number, '-', OrderHeader.Invoice_Number),
                CONVERT(VARCHAR(10), OrderHeader.Order_Number)
              )
            )
          `),
          'Document_Number'
        ],

        // Sales 01–12
        [sequelize.literal(`OrderHeader.Sales01 + OrderHeader.Taxes01`), 'totalSales01'],
        [sequelize.literal(`OrderHeader.Sales02 + OrderHeader.Taxes02`), 'totalSales02'],
        [sequelize.literal(`OrderHeader.Sales03 + OrderHeader.Taxes03`), 'totalSales03'],
        [sequelize.literal(`OrderHeader.Sales04 + OrderHeader.Taxes04`), 'totalSales04'],
        [sequelize.literal(`OrderHeader.Sales05 + OrderHeader.Taxes05`), 'totalSales05'],
        [sequelize.literal(`OrderHeader.Sales06 + OrderHeader.Taxes06`), 'totalSales06'],
        [sequelize.literal(`OrderHeader.Sales07 + OrderHeader.Taxes07`), 'totalSales07'],
        [sequelize.literal(`OrderHeader.Sales08 + OrderHeader.Taxes08`), 'totalSales08'],
        [sequelize.literal(`OrderHeader.Sales09 + OrderHeader.Taxes09`), 'totalSales09'],
        [sequelize.literal(`OrderHeader.Sales10 + OrderHeader.Taxes10`), 'totalSales10'],
        [sequelize.literal(`OrderHeader.Sales11 + OrderHeader.Taxes11`), 'totalSales11'],
        [sequelize.literal(`OrderHeader.Sales12 + OrderHeader.Taxes12`), 'totalSales12'],

        // Total Tax
        [
          sequelize.literal(`
            OrderHeader.stax_State + 
            OrderHeader.stax_County + 
            OrderHeader.stax_City
          `),
          'totalSalesTax'
        ],

        // State Name
        [
          sequelize.literal(`
            (SELECT TaxDescription 
             FROM TaxRates 
             WHERE TaxRates.Jurisdiction_State = OrderHeader.Jurisdiction_State)
          `),
          'StateName'
        ],

        // County Name
        [
          sequelize.literal(`
            (SELECT TaxDescription 
             FROM TaxRates_County 
             WHERE TaxRates_County.Jurisdiction_County = OrderHeader.Jurisdiction_County)
          `),
          'CountyName'
        ],

        // City Name
        [
          sequelize.literal(`
            (SELECT TaxDescription 
             FROM TaxRates_City 
             WHERE TaxRates_City.Jurisdiction_City = OrderHeader.Jurisdiction_City)
          `),
          'CityName'
        ]
      ],

      include: [
        {
          model: Customer,
          attributes: [
            'c_name',
            'c_address',
            'c_city',
            'c_state',
            'c_zip',
            'c_phone',
            'c_Salesman',
            'C_ClassOfTrade'
          ],
          as: 'customer',
          required: false
        }
      ],

      where: {
        Order_Updated: true,
        Order_Deleted: false,
        PrepaidTax_Amount: {
          [Op.ne]: 0
        },
        Invoice_Date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },

      order: [
        ['C_Number', 'ASC']
      ]
    });

    return orders;
  };

  async getDeletedOrders(data: any) {
    const { startDate, endDate } = data

    const orders = await OrderHeader.findAll({
      attributes: [
        'Order_Number',
        'Order_Deleted',
        'Order_Date', 'Picklist_Printed', 'Labels_Printed', 'Order_Source', 'Order_Type', 'Order_Deleted', 'S_Number'
      ],
      include: [
        {
          model: Customer,
          attributes: ['C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip'],
          required: false,
          as: 'customer'
        },
      ],
      where: {
        Order_Deleted: true,
        Order_Date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      order: [['Order_Number', 'ASC']],
      raw: false,
    });


    return orders;
  }

  async getSalesInvoiceReport(data: any) {

    const { startDate, endDate, limit = 2000, offset = 0 } = data;

    const result = await OrderDetail.findAll({
      attributes: [

        [
          literal(`
          IIF(orderHeader.Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), orderHeader.Invoice_Number_Legacy),
            IIF(orderHeader.Invoice_Number > 1,
              CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
              CONVERT(VARCHAR(10), orderHeader.Order_Number)
            )
          )
        `),
          "Document_Number"
        ],

        [col("orderHeader.Invoice_Date"), "Invoice_Date"],
        [col("orderHeader.Invoice_Number"), "Invoice_Number"],
        [col("orderHeader.C_Number"), "C_Number"],
        [col("orderHeader.S_Number"), "S_Number"],
        [col("orderHeader.Route_Number"), "Route_Number"],

        [
          literal(`(
          SELECT S_Desc
          FROM SalesRep
          WHERE SalesRep.S_Number = orderHeader.S_Number
        )`),
          "S_Desc"
        ],

        "Order_Number",
        "Promo_Number",
        "Item_Number",
        "Quantity_Ordered",
        "Quantity_Shipped",
        "Unit_Code",
        "OrderDetail_Code",
        "Delivered",
        "Credit_ReturnToStock",
        "Price",

        [col("inventory.Price1"), "Price1"],

        "Price_Reference",
        "NetCost",
        "BaseCost",
        "AvgCost",
        "Invoice_Cost",
        "OTP_Amount_State",
        "OTP_Amount_County",
        "OTP_Amount_City",

        [
          literal(`
          OrderDetail.Price +
          OrderDetail.OTP_Amount_State +
          OrderDetail.OTP_Amount_County +
          OrderDetail.OTP_Amount_City
        `),
          "TotalPrice"
        ],

        [
          literal(`
          OrderDetail.Price_Reference +
          OrderDetail.OTP_Amount_State +
          OrderDetail.OTP_Amount_County +
          OrderDetail.OTP_Amount_City
        `),
          "TotalPriceRef"
        ],

        [col("inventory.Description"), "Description"],
        [col("inventory.UOM"), "UOM"],
        [col("inventory.Pack"), "Pack"],
        [col("inventory.UnitOunces"), "UnitOunces"],
        [col("inventory.Cig_Sticks"), "Cig_Sticks"],
        [col("inventory.Points"), "Points"],
        [col("inventory.Cig_Pack"), "Cig_Pack"],
        [col("inventory.Price_Class"), "Price_Class"],

        [
          literal(`
          (
            SELECT Class_Desc
            FROM Price_Classes
            WHERE Price_Classes.Price_Class = inventory.Price_Class
          )
        `),
          "Class_Desc"
        ],

        [col("orderHeader.customer.C_Name"), "C_Name"],
        [col("orderHeader.customer.c_address"), "c_address"],
        [col("orderHeader.customer.c_city"), "c_city"],
        [col("orderHeader.customer.c_state"), "c_state"],
        [col("orderHeader.customer.c_zip"), "c_zip"],
        [col("orderHeader.customer.c_phone"), "c_phone"],
        [col("orderHeader.customer.c_Salesman"), "c_Salesman"]

      ],

      include: [
        {
          model: OrderHeader,
          as: "orderHeader",
          attributes: [],
          required: true,

          where: {
            Order_Updated: true,
            Order_Deleted: false,
            Invoice_Number: { [Op.ne]: null },
            Invoice_Date: {
              [Op.gte]: startDate,
              [Op.lte]: endDate
            }
          },

          include: [
            {
              model: Customer,
              as: "customer",
              attributes: [],
              required: false
            }
          ]
        },

        {
          model: Inventory,
          as: "inventory",
          attributes: [],
          required: false
        }
      ],

      order: [
        [{ model: OrderHeader, as: "orderHeader" }, "Invoice_Date", "ASC"],
        [{ model: OrderHeader, as: "orderHeader" }, "Order_Number", "ASC"]
      ],

      limit: Number(limit),
      offset: Number(offset),
      subQuery: false,
      raw: true
    });

    return result;
  }

  async getLostSaleCurrentOrders() {
    const result = await OrderDetail.findAll({
      attributes: [
        [
          literal(`
            IIF(orderHeader.Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), orderHeader.Invoice_Number_Legacy),
              IIF(orderHeader.Invoice_Number > 1,
                CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
                CONVERT(VARCHAR(10), orderHeader.Order_Number)
              )
            )
          `),
          'Document_Number'
        ],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        'Order_Number',
        'Promo_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',

        [col('Inventory.Description'), 'Description'],
        [col('Inventory.UOM'), 'UOM'],
        [col('Inventory.Pack'), 'Pack'],
        [col('Inventory.UnitOunces'), 'UnitOunces'],
        [col('Inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('Inventory.Cig_Pack'), 'Cig_Pack'],

        [
          literal(`
            ISNULL(
              (SELECT SUM(Inventory_OnHand)
               FROM Inventory_Status
               WHERE Inventory_Status.Code = 0
               AND Inventory_Status.Item_Number = OrderDetail.Item_Number
              ), 0
            )
          `),
          'OnHand'
        ],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        // [col('orderHeader.customer.S_Number'), 'c_Salesman']
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: false,
          where: {
            Order_Updated: false,
            Order_Deleted: false
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
              required: false
            }
          ]
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: false
        },

      ],

      where: {
        Quantity_Shipped: {
          [Op.lt]: col('Quantity_Ordered'),
          [Op.gte]: 0
        }
      },

      raw: true,
      limit: 1000,
    });

    return result;



  }

  async getPriceClassRebatesReport(data: any) {
    const { startDate, endDate } = data;

    const result = await OrderDetail.findAll({
      attributes: [
        'Order_Number',
        'Line_Number',
        'Quantity_Shipped',
        'Unit_Code',

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],

        [
          literal(`
            IIF(orderHeader.Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), orderHeader.Invoice_Number_Legacy),
              IIF(orderHeader.Invoice_Number > 1,
                CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
                CONVERT(VARCHAR(10), orderHeader.Order_Number)
              )
            )
          `),
          'Document_Number'
        ],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.C_address'), 'C_address'],
        [col('orderHeader.customer.C_City'), 'C_City'],
        [col('orderHeader.customer.C_State'), 'C_State'],
        [col('orderHeader.customer.C_Zip'), 'C_Zip'],

        [col('inventory.Price_Class'), 'Price_Class'],
        [col('inventory.Description'), 'Description'],

        [
          literal(`
            ISNULL((
              SELECT TOP 1 Rebate_Amount
              FROM Cust_PriceClassRebates
              WHERE Cust_PriceClassRebates.Price_Class = [inventory].[Price_Class]
                AND Cust_PriceClassRebates.C_Number = [orderHeader].[C_Number]
            ), 0)
          `),
          'RebateAmount'
        ],

        [
          literal(`
            (SELECT Class_Desc FROM Price_Classes WHERE Price_Classes.Price_Class = [inventory].[Price_Class])
          `),
          'ClassDesc'
        ],
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate]
            }
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
            }
          ]
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
        }
      ],

      where: literal(`
        EXISTS (
          SELECT 1 FROM Cust_PriceClassRebates
          WHERE Cust_PriceClassRebates.Price_Class = [inventory].[Price_Class]
            AND Cust_PriceClassRebates.C_Number = [orderHeader].[C_Number]
        )
      `),

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC'],
      ],

      raw: true,
    });

    return result;
  }

  async getPriceClassGroupRebatesReport(data: any) {
    const { startDate, endDate } = data;

    const result = await OrderDetail.findAll({
      attributes: [
        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        [
          literal(`
            IIF(orderHeader.Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), orderHeader.Invoice_Number_Legacy),
              IIF(orderHeader.Invoice_Number > 1,
                CONCAT(orderHeader.Order_Number, '-', orderHeader.Invoice_Number),
                CONVERT(VARCHAR(10), orderHeader.Order_Number)
              )
            )
          `),
          'Document_Number'
        ],

        'Order_Number',
        'Promo_Number',
        [literal('OrderDetail.OTP_Number'), 'OTP_NumberDetail'],
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',
        'Inventory_QtyDeductRegular',
        'Inventory_QtyDeductPrepaid',

        [col('inventory.I_PrepaidStatus'), 'I_PrepaidStatus'],
        [col('inventory.Description'), 'Description'],
        [col('inventory.UOM'), 'UOM'],
        [col('inventory.Pack'), 'Pack'],
        [col('inventory.Price_Class'), 'Price_Class'],
        [col('inventory.OTP_Number'), 'OTP_Number'],
        [col('inventory.UnitOunces'), 'UnitOunces'],
        [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('inventory.Cig_Pack'), 'Cig_Pack'],
        [col('inventory.Sales_Category'), 'Sales_Category'],

        [col('inventory.PriceClass.Class_Desc'), 'Class_Desc'],
        [col('inventory.SalesCategory.Category_Desc'), 'Cat_Desc'],

        [
          literal(`
            (SELECT OTP_Description FROM OtherTaxes WHERE OtherTaxes.OTP_Number = [inventory].[OTP_Number])
          `),
          'OTP_Desc'
        ],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
        [col('orderHeader.customer.C_ClassOfTrade'), 'C_ClassOfTrade'],
        [col('orderHeader.customer.Jurisdiction_State'), 'Jurisdiction_State'],
        [col('orderHeader.customer.Jurisdiction_County'), 'Jurisdiction_County'],
        [col('orderHeader.customer.Jurisdiction_City'), 'Jurisdiction_City'],
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate]
            }
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
            }
          ]
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          include: [
            {
              model: PriceClass,
              as: 'PriceClass',
              attributes: [],
            },
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: [],
            }
          ]
        }
      ],

      where: {
        Quantity_Shipped: {
          [Op.ne]: 0
        }
      },

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC'],
      ],

      raw: true,
    });

    return result;
  }


  async updateDeliveryRoute(id: number, body: any) {
    const deliveryRoute = await DeliveryRoute.findByPk(id);
    if (!deliveryRoute) {
      throw new AppError('Delivery route not found', 404);
    }
    await deliveryRoute.update(body);
    return deliveryRoute;
  }
  async getInventoryWithStatusAndTax(data: any) {
    const { costCode, limit = 50000 } = data
    return await Inventory.findAll({
      attributes: [
        'Item_Number',
        'Sales_Category',
        'Price_Class',
        'OTP_Number',
        'Description',
        'Pack',
        'UOM',
        'Price1',
        'Sequence',
        'Cig_Sticks',
        'UnitOunces',
        'Cig_Pack',

        // UPC_Number subquery (Status=0, Priority=1)
        [
          Sequelize.literal(`
          (
            SELECT UPC_Number
            FROM Inventory_UPC
            WHERE Inventory.Item_Number = Inventory_UPC.Item_Number
              AND Status = 0
              AND Priority = 1
          )
        `),
          'UPC_Number'
        ],

        'Basecost',
        'NetCost',
        'AvgCost',
        'Invoice_Cost',
        'Retail1',
        'HeadingFlag',

        // classDesc
        [
          Sequelize.literal(`
          (
            SELECT Class_Desc
            FROM Price_Classes
            WHERE Inventory.Price_Class = Price_Classes.Price_Class
          )
        `),
          'classDesc'
        ],

        // categoryDesc
        [
          Sequelize.literal(`
          (
            SELECT Category_Desc
            FROM Sales_Categories
            WHERE Inventory.Sales_Category = Sales_Categories.Sales_Category
          )
        `),
          'categoryDesc'
        ],

        // otpDesc
        [
          Sequelize.literal(`
          (
            SELECT OTP_Description
            FROM OtherTaxes
            WHERE Inventory.OTP_Number = OtherTaxes.OTP_Number
          )
        `),
          'otpDesc'
        ],

        // TaxValue
        [
          Sequelize.literal(`
          ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0)
        `),
          'TaxValue'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.AvgCost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_AvgCost'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.BaseCost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_BaseCost'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.NetCost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_NetCost'
        ],
        [
          Sequelize.literal(`
          ( ISNULL(Inventory.Invoice_Cost, 0) + ISNULL(dbo.fn_InventoryTaxValue(Inventory.Item_Number), 0) )
        `),
          'ext_Invoice_Cost'
        ],

      ],

      include: [
        {
          model: InventoryStatus,
          required: false,
          where: { Code: costCode },
          attributes: {
            include: [
              // State Tax
              [
                Sequelize.literal(`
                (
                  SELECT TaxDescription
                  FROM TaxRates
                  WHERE TaxRates.Jurisdiction_State = [inventoryStatus].Jurisdiction_State
                )
              `),
                'tState'
              ],

              // County Tax
              [
                Sequelize.literal(`
                (
                  SELECT TaxDescription
                  FROM TaxRates_County
                  WHERE TaxRates_County.Jurisdiction_County = [inventoryStatus].Jurisdiction_County
                )
              `),
                'tCounty'
              ],

              // City Tax
              [
                Sequelize.literal(`
                (
                  SELECT TaxDescription
                  FROM TaxRates_City
                  WHERE TaxRates_City.Jurisdiction_City = [inventoryStatus].Jurisdiction_City
                )
              `),
                'tCity'
              ],
              [
                Sequelize.literal(`
                (
                  SELECT STMP_VALUE20
                  FROM TaxRates
                  WHERE TaxRates.Jurisdiction_State = [inventoryStatus].Jurisdiction_State
                )
              `),
                'STMP_VALUE20'
              ],
              [
                Sequelize.literal(`
                (
                  SELECT STMP_VALUE25
                  FROM TaxRates
                  WHERE TaxRates.Jurisdiction_State = [inventoryStatus].Jurisdiction_State
                )
              `),
                'STMP_VALUE25'
              ],

            ],


          }
        },
      ],

      order: [['Description', 'ASC']],
      limit: Number(limit),
    });
  }

  async getExpirationDateReport(data: any) {
    const { startDate, endDate } = data;
    return await InventoryStatus.findAll({
      attributes: [
        'Item_Number',
        'LocationID',
        'Inventory_OnHand',
        'Inventory_UnitsOnHand',
        'InventoryGroupID',

        // InventoryLocation from LocationDefs
        [
          Sequelize.literal(`
          (
            SELECT InventoryLocation
            FROM LocationDefs
            WHERE LocationDefs.LocationID = [InventoryStatus].LocationID
          )
        `),
          'InventoryLocation'
        ],

        'Date_Received',

        // Inventory_ExpDate from PO_Detail
        [
          Sequelize.literal(`
          ISNULL(
            (SELECT Inventory_ExpDate FROM PO_Detail WHERE PO_Detail.InventoryGroupID = [InventoryStatus].InventoryGroupID),
            CONVERT(DateTime, '1/1/2000', 102)
          )
        `),
          'Inventory_ExpDate'
        ],

        // PO_Number from PO_Detail
        [
          Sequelize.literal(`
          ISNULL(
            (SELECT PO_Number FROM PO_Detail WHERE PO_Detail.InventoryGroupID = [InventoryStatus].InventoryGroupID),
            0
          )
        `),
          'PO_Number'
        ],
      ],

      include: [
        {
          model: Inventory,
          as: 'inventory',
          required: true,
          attributes: ['Description', 'Sales_Category', 'Price_Class', 'OTP_Number', 'Primary_Vendor', 'Location', 'Section', 'PickArea'],
          where: {
            Track_ExpirationDate: true,
          },
        },
      ],

      where: {
        InventoryGroupID: { [Op.ne]: 0 },
        [Op.or]: [
          { Inventory_OnHand: { [Op.gt]: 0 } },
          { Inventory_UnitsOnHand: { [Op.gt]: 0 } },
        ],
        [Op.and]: [
          Sequelize.literal(`
            ISNULL(
              (SELECT TOP 1 Inventory_ExpDate FROM PO_Detail WHERE PO_Detail.InventoryGroupID = [InventoryStatus].InventoryGroupID),
              CONVERT(DateTime, '1/1/2000', 102)
            ) >= '${startDate}'
          `),
          Sequelize.literal(`
            ISNULL(
              (SELECT TOP 1 Inventory_ExpDate FROM PO_Detail WHERE PO_Detail.InventoryGroupID = [InventoryStatus].InventoryGroupID),
              CONVERT(DateTime, '1/1/2000', 102)
            ) <= '${endDate}'
          `),
        ],
      },

      order: [[Sequelize.col('Inventory.Description'), 'ASC']],
    });
  }

  async buyerGuideInventoryHistory(query: any) {
    const { startDate, endDate } = query
    return await Inventory.findAll({
      where: {
        Date_LastChange: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: {
        include: [
          // classDesc
          [
            Sequelize.literal(`
            (
              SELECT Class_Desc
              FROM Price_Classes
              WHERE [Inventory].Price_Class = Price_Classes.Price_Class
            )
          `),
            'classDesc'
          ],
          // categoryDesc
          [
            Sequelize.literal(`
            (
              SELECT Category_Desc
              FROM Sales_Categories
              WHERE [Inventory].Sales_Category = Sales_Categories.Sales_Category
            )
          `),
            'categoryDesc'
          ],
          // vendDesc
          [
            Sequelize.literal(`
            (
              SELECT V_Description
              FROM Vendor
              WHERE [Inventory].Primary_Vendor = Vendor.Primary_Vendor
            )
          `),
            'vendDesc'
          ],
          // iOnHand
          [
            Sequelize.literal(`
            ISNULL(
              (SELECT Sum(Inventory_OnHand)
               FROM Inventory_Status
               WHERE Inventory_Status.Code = 0
                 AND Inventory_Status.Item_Number = [Inventory].Item_Number),
              0
            )
          `),
            'iOnHand'
          ],
          // iPend
          [
            Sequelize.literal(`
            ISNULL(
              (SELECT Sum(Order_Detail.Quantity_Ordered)
               FROM Order_Detail
               WHERE Order_Detail.Item_Number = [Inventory].Item_Number
                 AND DetailUpdated = 'False'),
              0
            )
          `),
            'iPend'
          ],
          // iOnOrder
          [
            Sequelize.literal(`
            ISNULL(
              (SELECT Sum(PO_Detail.Quantity_Ordered * PO_Detail.Pack)
               FROM PO_Detail
               WHERE PO_Detail.Item_Number = [Inventory].Item_Number
                 AND DetailPosted = 'False'),
              0
            )
          `),
            'iOnOrder'
          ],
          // upcNumber
          [
            Sequelize.literal(`
            (
              SELECT UPC_Number
              FROM Inventory_UPC
              WHERE [Inventory].Item_Number = Inventory_UPC.Item_Number
                AND Status = 0
                AND Priority = 1
            )
          `),
            'upcNumber'
          ],
          // availableQty = iOnHand - iPend
          [
            Sequelize.literal(`
            ISNULL(
              (SELECT Sum(Inventory_OnHand)
               FROM Inventory_Status
               WHERE Inventory_Status.Code = 0
                 AND Inventory_Status.Item_Number = [Inventory].Item_Number),
              0
            )
            -
            ISNULL(
              (SELECT Sum(Order_Detail.Quantity_Ordered)
               FROM Order_Detail
               WHERE Order_Detail.Item_Number = [Inventory].Item_Number
                 AND DetailUpdated = 'False'),
              0
            )
          `),
            'availableQty'
          ],
        ],
      },

      include: [
        {
          model: InventoryHistory,
          as: 'InventoryHistory',
          required: true,
          attributes: {
            include: [
              [
                Sequelize.literal(`
                (ISNULL([InventoryHistory].Week02, 0) + ISNULL([InventoryHistory].Week03, 0) + ISNULL([InventoryHistory].Week04, 0) + ISNULL([InventoryHistory].Week05, 0)) / 4.0
              `),
                'AvgWeeklySales'
              ],
            ],
          },
        },
      ],

      order: [
        ['Sales_Category', 'ASC'],
        ['Description', 'ASC'],
      ],
      // limit: 100
    });
  }

  async getVelocityReportVendorGroup(data: any) {
    const { startDate, endDate } = data;

    return await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF([orderHeader].Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), [orderHeader].Invoice_Number_Legacy),
            IIF([orderHeader].Invoice_Number > 1,
              CONCAT([orderHeader].Order_Number, '-', [orderHeader].Invoice_Number),
              CONVERT(VARCHAR(10), [orderHeader].Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        'Order_Number',
        'Promo_Number',
        [col('OrderDetail.OTP_Number'), 'OTP_NumberDetail'],
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',
        'Inventory_QtyDeductRegular',
        'Inventory_QtyDeductPrepaid',

        [literal(`(ISNULL([OrderDetail].AvgCost, 0) + ISNULL([OrderDetail].OTP_Amount_State, 0)) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_AvgCost'],
        [literal(`(ISNULL([OrderDetail].NetCost, 0) + ISNULL([OrderDetail].OTP_Amount_State, 0)) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_NetCost'],
        [literal(`(ISNULL([OrderDetail].Invoice_Cost, 0) + ISNULL([OrderDetail].OTP_Amount_State, 0)) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_InvoiceCost'],
        [literal(`(ISNULL([OrderDetail].BaseCost, 0) + ISNULL([OrderDetail].OTP_Amount_State, 0)) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_BaseCost'],

        [literal(`(ISNULL([OrderDetail].Price, 0) + ISNULL([OrderDetail].OTP_Amount_State, 0)) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_Price'],

        [col('inventory.I_PrepaidStatus'), 'I_PrepaidStatus'],
        [col('inventory.Description'), 'Description'],
        [col('inventory.UOM'), 'UOM'],
        [col('inventory.Pack'), 'Pack'],
        [col('inventory.OTP_Number'), 'OTP_Number'],
        [col('inventory.Primary_Vendor'), 'Primary_Vendor'],
        [col('inventory.Manufacturer'), 'Manufacturer'],

        [
          literal(`
          (SELECT V_Description FROM Vendor WHERE [inventory].Primary_Vendor = Vendor.Primary_Vendor)
        `),
          'V_Description'
        ],
        [
          literal(`
          (SELECT V_Description FROM Vendor WHERE [inventory].Manufacturer = Vendor.Primary_Vendor)
        `),
          'Manuf_Description'
        ],

        [col('inventory.UnitOunces'), 'UnitOunces'],
        [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('inventory.Cig_Pack'), 'Cig_Pack'],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate],
            },
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: false,
        },
      ],

      where: {
        Quantity_Shipped: { [Op.ne]: 0 },
      },

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC'],
      ],

      raw: true,
    });
  }

  async getVelocityReportOtpPrice(data: any) {
    const { startDate, endDate } = data;

    return await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF([orderHeader].Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), [orderHeader].Invoice_Number_Legacy),
            IIF([orderHeader].Invoice_Number > 1,
              CONCAT([orderHeader].Order_Number, '-', [orderHeader].Invoice_Number),
              CONVERT(VARCHAR(10), [orderHeader].Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],
        [col('orderHeader.Jurisdiction_State'), 'Jurisdiction_State'],
        [col('orderHeader.Jurisdiction_County'), 'Jurisdiction_County'],
        [col('orderHeader.Jurisdiction_City'), 'Jurisdiction_City'],

        'Order_Number',
        'Promo_Number',
        [col('OrderDetail.OTP_Number'), 'OTP_NumberDetail'],
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',
        'Inventory_QtyDeductRegular',
        'Inventory_QtyDeductPrepaid',

        [col('inventory.I_PrepaidStatus'), 'I_PrepaidStatus'],
        [col('inventory.Description'), 'Description'],
        [col('inventory.UOM'), 'UOM'],
        [col('inventory.Pack'), 'Pack'],
        [col('inventory.Price_Class'), 'Price_Class'],
        [col('inventory.OTP_Number'), 'OTP_Number'],

        [literal(`ISNULL([OrderDetail].Price, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_Price'],
        [literal(`ISNULL([OrderDetail].Price, 0) + ISNULL([OrderDetail].OTP_Amount_State, 0)`), 'Ext_InvoicePrice'],
        [literal(`ISNULL([OrderDetail].OTP_Amount_State, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_StateTax'],
        [literal(`ISNULL([OrderDetail].OTP_Amount_County, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_CountyTax'],
        [literal(`ISNULL([OrderDetail].OTP_Amount_City, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_CityTax'],
        [literal(`ISNULL([OrderDetail].AvgCost, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_AvgCost'],
        [literal(`ISNULL([OrderDetail].NetCost, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_NetCost'],
        [literal(`ISNULL([OrderDetail].Invoice_Cost, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_InvoiceCost'],
        [literal(`ISNULL([OrderDetail].BaseCost, 0)  * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_BaseCost'],
        [literal(`ISNULL([inventory].Cig_Sticks, 0) * ISNULL([OrderDetail].Quantity_Shipped, 0)`), 'Ext_Sticks'],


        [
          literal(`
          (SELECT OTP_Description FROM OtherTaxes WHERE [inventory].OTP_Number = OtherTaxes.OTP_Number)
        `),
          'OTP_Desc'
        ],
        [
          literal(`
          (SELECT Class_Desc FROM Price_Classes WHERE [inventory].Price_Class = Price_Classes.Price_Class)
        `),
          'Class_Desc'
        ],
        [
          literal(`
          (SELECT Category_Desc FROM Sales_Categories WHERE [inventory].Sales_Category = Sales_Categories.Sales_Category)
        `),
          'Cat_Desc'
        ],

        [col('inventory.UnitOunces'), 'UnitOunces'],
        [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('inventory.Cig_Pack'), 'Cig_Pack'],
        [col('inventory.Sales_Category'), 'Sales_Category'],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate],
            },
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: false,
        },
      ],

      where: {
        Quantity_Shipped: { [Op.ne]: 0 },
      },

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC'],
      ],
      limit: 50,

      raw: true,
    });
  }

  async getVelocityReportOtpCigSticks(data: any) {
    const { startDate, endDate } = data;

    return await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF([orderHeader].Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), [orderHeader].Invoice_Number_Legacy),
            IIF([orderHeader].Invoice_Number > 1,
              CONCAT([orderHeader].Order_Number, '-', [orderHeader].Invoice_Number),
              CONVERT(VARCHAR(10), [orderHeader].Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        'Order_Number',
        'Promo_Number',
        [col('OrderDetail.OTP_Number'), 'OTP_NumberDetail'],
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',
        'Inventory_QtyDeductRegular',
        'Inventory_QtyDeductPrepaid',

        [col('inventory.I_PrepaidStatus'), 'I_PrepaidStatus'],
        [col('inventory.Description'), 'Description'],
        [col('inventory.UOM'), 'UOM'],
        [col('inventory.Pack'), 'Pack'],
        [col('inventory.Price_Class'), 'Price_Class'],
        [col('inventory.OTP_Number'), 'OTP_Number'],

        [
          literal(`
          (SELECT OTP_Description FROM OtherTaxes WHERE [inventory].OTP_Number = OtherTaxes.OTP_Number)
        `),
          'OTP_Desc'
        ],
        [
          literal(`
          (SELECT Class_Desc FROM Price_Classes WHERE [inventory].Price_Class = Price_Classes.Price_Class)
        `),
          'Class_Desc'
        ],

        [col('inventory.UnitOunces'), 'UnitOunces'],
        [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('inventory.Cig_Pack'), 'Cig_Pack'],

        [col('orderHeader.customer.C_Name'), 'C_Name'],
        [col('orderHeader.customer.c_address'), 'c_address'],
        [col('orderHeader.customer.c_city'), 'c_city'],
        [col('orderHeader.customer.c_state'), 'c_state'],
        [col('orderHeader.customer.c_zip'), 'c_zip'],
        [col('orderHeader.customer.c_phone'), 'c_phone'],
        [col('orderHeader.customer.c_Salesman'), 'c_Salesman'],
        [col('orderHeader.customer.Jurisdiction_State'), 'Jurisdiction_State'],
        [col('orderHeader.customer.Jurisdiction_County'), 'Jurisdiction_County'],
        [col('orderHeader.customer.Jurisdiction_City'), 'Jurisdiction_City'],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        [
          literal(`
          (SELECT TaxDescription FROM TaxRates WHERE [orderHeader->customer].Jurisdiction_State = TaxRates.Jurisdiction_State)
        `),
          'TaxDesc_State'
        ],
        [
          literal(`
          (SELECT TaxDescription FROM TaxRates_County WHERE [orderHeader->customer].Jurisdiction_County = TaxRates_County.Jurisdiction_County)
        `),
          'TaxDesc_County'
        ],
        [
          literal(`
          (SELECT TaxDescription FROM TaxRates_City WHERE [orderHeader->customer].Jurisdiction_City = TaxRates_City.Jurisdiction_City)
        `),
          'TaxDesc_City'
        ],
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'True',
            Order_Deleted: 'False',
            Invoice_Date: {
              [Op.between]: [startDate, endDate],
            },
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: false,
        },
      ],

      order: [
        [col('orderHeader.Invoice_Date'), 'ASC'],
        [col('orderHeader.Order_Number'), 'ASC'],
      ],
      limit: 50,

      raw: true,
    });
  }

  async getSalesTaxOtpTaxReports(data: any) {
    const { startDate, endDate } = data;

    return await OrderHeader.findAll({
      attributes: {
        include: [
          [
            literal(`
            IIF([OrderHeader].Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), [OrderHeader].Invoice_Number_Legacy),
              IIF([OrderHeader].Invoice_Number > 1,
                CONCAT([OrderHeader].Order_Number, '-', [OrderHeader].Invoice_Number),
                CONVERT(VARCHAR(10), [OrderHeader].Order_Number)
              )
            )
          `),
            'Document_Number'
          ],
          [
            literal(`(SELECT TaxDescription FROM TaxRates WHERE TaxRates.Jurisdiction_State = [OrderHeader].Jurisdiction_State)`),
            'jStateDesc'
          ],
          [
            literal(`(SELECT TaxDescription FROM TaxRates_County WHERE TaxRates_County.Jurisdiction_County = [OrderHeader].Jurisdiction_County)`),
            'jCountyDesc'
          ],
          [
            literal(`(SELECT TaxDescription FROM TaxRates_City WHERE TaxRates_City.Jurisdiction_City = [OrderHeader].Jurisdiction_City)`),
            'jCityDesc'
          ],
          [col('customer.C_Name'), 'C_Name'],
          [col('customer.c_address'), 'c_address'],
          [col('customer.c_city'), 'c_city'],
          [col('customer.c_state'), 'c_state'],
          [col('customer.c_zip'), 'c_zip'],
          [col('customer.c_phone'), 'c_phone'],
          [col('customer.c_Salesman'), 'c_Salesman'],
          [col('customer.C_Email'), 'C_Email'],
        ],
      },

      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
          required: false,
        },
      ],

      where: {
        Order_Updated: 'True',
        Order_Deleted: 'False',
        Invoice_Date: {
          [Op.between]: [startDate, endDate],
        },
      },

      order: [
        ['Invoice_Date', 'ASC'],
        ['Order_Number', 'ASC'],
      ],

      raw: true,
    });
  }

  async getPOAdjustItemGroupReport(data: any) {
    const { startDate, endDate } = data;

    return await PODetail.findAll({
      attributes: {
        include: [
          [
            literal(`(SELECT State_Abbrev FROM TaxRates WHERE TaxRates.Jurisdiction_State = [POHeader].TransferTo_Jurisdiction_State)`),
            'jState'
          ],
        ],
      },

      include: [
        {
          model: POHeader,
          as: 'POHeader',
          required: true,
          where: {
            PO_Posted: 'True',
            PO_Deleted: 'False',
            Receiving_Code: 'T',
            Date_Received: {
              [Op.between]: [startDate, endDate],
            },
          },
          include: [
            {
              model: Vendor,
              required: false,
              attributes: [
                'V_Description',
                'V_Addr1',
                'V_City',
                'V_State',
                'V_Zip',
                'V_Phone',
              ],
            },
          ],
        },
        {
          model: Inventory,
          required: false,
          attributes: [
            'Description',
            'UOM',
            ['Pack', 'iPack'],
          ],
        },
      ],

      order: [
        [{ model: POHeader, as: 'POHeader' }, 'Date_Received', 'ASC'],
        ['PO_Number', 'ASC'],
      ],

      raw: true,
    });
  }

  async getPOOpenOrdersReport() {
    return await PODetail.findAll({
      attributes: {
        include: [
          [col('POHeader.PO_Number'), 'PO_Number'],
          [col('POHeader.Primary_Vendor'), 'Primary_Vendor'],
          [col('POHeader.PO_Posted'), 'PO_Posted'],
          [col('POHeader.PO_Deleted'), 'PO_Deleted'],
          [col('POHeader.Receiving_Code'), 'Receiving_Code'],
          [col('POHeader.Date_Received'), 'Date_Received'],
          [col('POHeader.Invoice_Number'), 'PO_Invoice_Number'],
          [col('POHeader.Invoice_Date'), 'PO_Invoice_Date'],

          [col('POHeader->Vendor.V_Description'), 'V_Description'],
          [col('POHeader->Vendor.V_Addr1'), 'V_Addr1'],
          [col('POHeader->Vendor.V_Addr2'), 'V_Addr2'],
          [col('POHeader->Vendor.V_City'), 'V_City'],
          [col('POHeader->Vendor.V_State'), 'V_State'],
          [col('POHeader->Vendor.V_Zip'), 'V_Zip'],
          [col('POHeader->Vendor.V_Phone'), 'V_Phone'],
          [col('POHeader->Vendor.V_Fax'), 'V_Fax'],

          [col('inventory.Sales_Category'), 'Sales_Category'],
          [col('inventory.Description'), 'Description'],
          [col('inventory.CaseWeight'), 'CaseWeight'],
          [col('inventory.UOM'), 'UOM'],
          [col('inventory.Section'), 'Section'],
          [col('inventory.Location'), 'Location'],
          [col('inventory.Pack'), 'iPack'],
          [col('inventory.CaseCount'), 'CaseCount'],

          [
            literal(`(SELECT UPC_Number FROM Inventory_UPC WHERE [inventory].Item_Number = Inventory_UPC.Item_Number AND Status = 0 AND Priority = 1)`),
            'UPC_Number'
          ],
          [
            literal(`IIF([POHeader].Primary_Vendor = [inventory].Primary_Vendor, [inventory].Vendor_ItemNumberAlpha, '')`),
            'VIN'
          ],
          [
            literal(`ISNULL((SELECT Vendor_Item FROM Inventory_Xref WHERE Inventory_Xref.Item_Number = [PO_Detail].Item_Number AND Vendor = [POHeader].Primary_Vendor), '')`),
            'VINA'
          ],
          [
            literal(`ISNULL([PO_Detail].Cost, 0) * ISNULL([PO_Detail].Quantity_Ordered, 0)`),
            'ExtOrderQtyCost'
          ],
        ],
      },

      include: [
        {
          model: POHeader,
          as: 'POHeader',
          required: true,
          attributes: [],
          where: {
            PO_Posted: 'False',
            PO_Deleted: 'False',
            Receiving_Code: 'P',
          },
          include: [
            {
              model: Vendor,
              required: false,
              attributes: [],
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          required: false,
          attributes: [],
        },
      ],

      order: [
        [col('POHeader.PO_Number'), 'ASC'],
      ],

      raw: true,
    });
  }

  async getCurrentOrderStatusReport(data: any) {
    const { startDate, endDate } = data
    return await OrderDetail.findAll({
      attributes: {
        include: [
          [col('orderHeader.Order_Number'), 'OH_Order_Number'],
          [col('orderHeader.C_Number'), 'C_Number'],
          [col('orderHeader.S_Number'), 'S_Number'],
          [col('orderHeader.Route_Number'), 'Route_Number'],
          [col('orderHeader.Order_Updated'), 'Order_Updated'],
          [col('orderHeader.Order_Deleted'), 'Order_Deleted'],
          [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
          [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
          [col('orderHeader.Order_Date'), 'Order_Date'],
          [col('orderHeader.Picklist_Printed'), 'Picklist_Printed'],
          [col('orderHeader.Order_Source'), 'Order_Source'],
          [col('orderHeader.Order_Type'), 'Order_Type'],
          [col('orderHeader.Labels_Printed'), 'Labels_Printed'],
          [literal(`FORMAT([orderHeader].Order_Date, 'MM/dd/yyyy')`), 'Order_Date_Text'],
          [literal(`FORMAT([orderHeader].Invoice_Date, 'MM/dd/yyyy')`), 'Invoice_Date_Text'],

          [col('orderHeader->customer.C_Name'), 'C_Name'],

          [col('inventory.Sales_Category'), 'Sales_Category'],
          [col('inventory.Description'), 'Description'],

          [
            literal(`(SELECT Order_OptionValue FROM Order_Header_Ext WHERE Order_Header_Ext.Order_Number = [orderHeader].Order_Number)`),
            'Order_OptionValue'
          ],
        ],
      },

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'False',
            Order_Deleted: 'False',
            Order_Date: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
              required: false,
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: false,
        },
      ],

      order: [
        [col('orderHeader.Order_Number'), 'ASC'],
      ],

      raw: true,
    });
  }

  async getInvoiceRegisterCostReport(data: any) {
    const { startDate, endDate } = data
    const ohc = (field: string) =>
      `(SELECT ${field} FROM Order_Header_Costs WHERE Order_Header_Costs.Order_Number = [OrderHeader].Order_Number AND Value_Code = 0)`;

    return await OrderHeader.findAll({
      attributes: {
        include: [
          // Document_Number
          [
            literal(`
            IIF([OrderHeader].Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), [OrderHeader].Invoice_Number_Legacy),
              IIF([OrderHeader].Invoice_Number > 1,
                CONCAT([OrderHeader].Order_Number, '-', [OrderHeader].Invoice_Number),
                CONVERT(VARCHAR(10), [OrderHeader].Order_Number)
              )
            )
          `),
            'Document_Number'
          ],

          // Order_Header_Costs fields via subqueries to avoid column ambiguity
          ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => {
            const pad = String(i).padStart(2, '0');
            return [
              [literal(`ISNULL(${ohc(`Sales${pad}`)},0) + ISNULL(${ohc(`Taxes${pad}`)},0)`), `totalSales${pad}`],
              [literal(`ISNULL(${ohc(`Value${pad}`)},0) + ISNULL(${ohc(`Taxes${pad}`)},0)`), `totalCost${pad}`],
              [literal(`(ISNULL(${ohc(`Sales${pad}`)},0) + ISNULL(${ohc(`Taxes${pad}`)},0)) - (ISNULL(${ohc(`Value${pad}`)},0) + ISNULL(${ohc(`Taxes${pad}`)},0))`), `ProfitCategSales${pad}`],
              [literal(`CASE WHEN ISNULL([OrderHeader].[Sales_NonTaxable],0) = 0 THEN 0 ELSE ((ISNULL(${ohc(`Sales${pad}`)},0) + ISNULL(${ohc(`Taxes${pad}`)},0)) - (ISNULL(${ohc(`Value${pad}`)},0) + ISNULL(${ohc(`Taxes${pad}`)},0))) * 100.0 / ISNULL([OrderHeader].[Sales_NonTaxable],0) END`), `ProfitPercent${pad}`],
              [literal(`(SELECT ISNULL(SUM(Quantity_Shipped),0) FROM Order_Detail WHERE Sales_Category = ${i} AND Order_Detail.Order_Number = [OrderHeader].Order_Number)`), `totalQuantity_Shipped${pad}`],
            ];
          }).flat() as any,

          // totalSalesTax
          [literal(`ISNULL([OrderHeader].[stax_State],0) + ISNULL([OrderHeader].[stax_County],0) + ISNULL([OrderHeader].[stax_City],0)`), 'totalSalesTax'],

          // Customer fields
          [col('customer.C_Name'), 'C_Name'],
          [col('customer.c_address'), 'c_address'],
          [col('customer.c_city'), 'c_city'],
          [col('customer.c_state'), 'c_state'],
          [col('customer.c_zip'), 'c_zip'],
          [col('customer.c_phone'), 'c_phone'],
          [col('customer.c_Salesman'), 'c_Salesman'],

          // S_Desc
          [literal(`(SELECT S_Desc FROM SalesRep WHERE [OrderHeader].S_Number = SalesRep.S_Number)`), 'S_Desc'],
        ],
      },

      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
          required: false,
        },
      ],

      where: {
        Order_Deleted: 'False',
        Invoice_Number: { [Op.ne]: 0 },
        Order_Updated: 'False',
        [Op.and]: [
          literal(`EXISTS (SELECT 1 FROM Order_Header_Costs WHERE Order_Header_Costs.Order_Number = [OrderHeader].Order_Number AND Value_Code = 0)`),
        ],
        Order_Date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },

      order: [['Order_Number', 'ASC']],

      raw: true,
    });
  }

  async getPicklistOrderDetail(data: any) {
    const { startDate, endDate } = data
    return await OrderDetail.findAll({
      attributes: {
        include: [
          [col('orderHeader.Order_Number'), 'OH_Order_Number'],
          [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
          [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
          [col('orderHeader.Picklist_Printed'), 'Picklist_Printed'],
          [col('orderHeader.Order_Date'), 'Order_Date'],
          [col('orderHeader.Delivery_Date'), 'Delivery_Date'],
          [col('orderHeader.Order_Source'), 'Order_Source'],
          [col('orderHeader.C_Number'), 'C_Number'],
          [col('orderHeader.S_Number'), 'S_Number'],
          [col('orderHeader.Route_Number'), 'Route_Number'],
          [col('orderHeader.Stop_Number'), 'Stop_Number'],

          [
            literal(`
            IIF([orderHeader].Invoice_Number_Legacy <> 0,
              CONVERT(VARCHAR(10), [orderHeader].Invoice_Number_Legacy),
              IIF([orderHeader].Invoice_Number > 1,
                CONCAT([orderHeader].Order_Number, '-', [orderHeader].Invoice_Number),
                CONVERT(VARCHAR(10), [orderHeader].Order_Number)
              )
            )
          `),
            'Document_Number'
          ],

          [literal(`(SELECT S_Desc FROM SalesRep WHERE SalesRep.S_Number = [orderHeader].S_Number)`), 'repName'],
          [literal(`(SELECT Route_Description FROM Routes WHERE Routes.Route_Number = [orderHeader].Route_Number)`), 'routeName'],
          [literal(`(SELECT Source_Description FROM Order_Source WHERE Order_Source.Order_Source = [orderHeader].Order_Source)`), 'sourceName'],

          [literal(`ISNULL([OrderDetail].Price,0) + ISNULL([OrderDetail].OTP_Amount_State,0) + ISNULL([OrderDetail].OTP_Amount_County,0) + ISNULL([OrderDetail].OTP_Amount_City,0)`), 'TotalPrice'],
          [literal(`(ISNULL([OrderDetail].Price,0) + ISNULL([OrderDetail].OTP_Amount_State,0)) * ISNULL([OrderDetail].Quantity_Shipped,0)`), 'ExtPrice'],

          [col('inventory.Description'), 'Description'],
          [col('inventory.CaseCount'), 'CaseCount'],
          [col('inventory.CaseWeight'), 'CaseWeight'],
          [col('inventory.UOM'), 'UOM'],
          [col('inventory.Section'), 'Section'],
          [col('inventory.Location'), 'Location'],

          [literal(`(SELECT UPC_Number FROM Inventory_UPC WHERE [OrderDetail].Item_Number = Inventory_UPC.Item_Number AND Status = 0 AND Priority = 1)`), 'upcNumber'],
          [literal(`0`), 'OnHand'],

          [col('orderHeader->customer.C_Name'), 'C_Name'],
          [col('orderHeader->customer.C_CoName'), 'C_CoName'],
          [col('orderHeader->customer.C_Address'), 'C_Address'],
          [col('orderHeader->customer.C_City'), 'C_City'],
          [col('orderHeader->customer.C_State'), 'C_State'],
          [col('orderHeader->customer.C_PhoneMobile'), 'C_PhoneMobile'],
          [col('orderHeader->customer.C_Zip'), 'C_Zip'],
        ],
      },

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'False',
            Order_Deleted: 'False',
            Order_Date: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
              required: false,
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: false,
        },
      ],

      order: [
        [col('orderHeader.Order_Number'), 'ASC'],
      ],

      raw: true,
    });
  }

  async getDeletedOrdersHistory(data: any) {
    const { startDate, endDate } = data
    return await OrderHeader.findAll({
      attributes: {
        include: [
          [col('customer.C_Name'), 'C_Name'],
          [col('customer.C_Address'), 'C_Address'],
          [col('customer.C_City'), 'C_City'],
          [col('customer.C_State'), 'C_State'],
          [col('customer.C_Zip'), 'C_Zip'],
        ],
      },

      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
          required: false,
        },
      ],

      where: {
        Order_Deleted: 'True',
        Order_Date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },

      order: [['Order_Number', 'ASC']],

      raw: true,
    });
  }

  async getShortShippedOrders() {
    return await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF([orderHeader].Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), [orderHeader].Invoice_Number_Legacy),
            IIF([orderHeader].Invoice_Number > 1,
              CONCAT([orderHeader].Order_Number, '-', [orderHeader].Invoice_Number),
              CONVERT(VARCHAR(10), [orderHeader].Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader.S_Number'), 'S_Number'],
        [col('orderHeader.Route_Number'), 'Route_Number'],

        'Order_Number',
        'Promo_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'OrderDetail_Code',
        'Delivered',
        'Credit_ReturnToStock',
        'Price',
        'NetCost',
        'BaseCost',
        'AvgCost',
        'Invoice_Cost',
        'OTP_Amount_State',
        'OTP_Amount_County',
        'OTP_Amount_City',

        [col('inventory.Description'), 'Description'],
        [col('inventory.UOM'), 'UOM'],
        [col('inventory.Pack'), 'Pack'],
        [col('inventory.UnitOunces'), 'UnitOunces'],
        [col('inventory.Cig_Sticks'), 'Cig_Sticks'],
        [col('inventory.Cig_Pack'), 'Cig_Pack'],

        [literal(`ISNULL((SELECT SUM(Inventory_OnHand) FROM Inventory_Status WHERE Inventory_Status.Code = 0 AND Inventory_Status.Item_Number = [OrderDetail].Item_Number), 0)`), 'OnHand'],

        [col('orderHeader->customer.C_Name'), 'C_Name'],
        [col('orderHeader->customer.c_address'), 'c_address'],
        [col('orderHeader->customer.c_city'), 'c_city'],
        [col('orderHeader->customer.c_state'), 'c_state'],
        [col('orderHeader->customer.c_zip'), 'c_zip'],
        [col('orderHeader->customer.c_phone'), 'c_phone'],
        [col('orderHeader->customer.c_Salesman'), 'c_Salesman'],
      ],

      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: {
            Order_Updated: 'False',
            Order_Deleted: 'False',
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
              required: false,
            },
          ],
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [],
          required: false,
        },
      ],

      where: {
        Quantity_Shipped: { [Op.gte]: 0 },
        [Op.and]: [
          literal(`[OrderDetail].[Quantity_Shipped] < [OrderDetail].[Quantity_Ordered]`),
        ],
      },

      raw: true,
    });
  }

  async getCustomerPricing(data: any) {
    const { C_Number, Sales_Category, Price_Class, Description, otpType, Vendor } = data;

    const where: any = {};
    if (Sales_Category) where.Sales_Category = Number(Sales_Category);
    if (Price_Class) where.Price_Class = Number(Price_Class);
    if (Description) where.Description = { [Op.like]: `%${Description}%` };
    if (otpType) where.OTP_Number = Number(otpType);
    if (Vendor) where.Primary_Vendor = Number(Vendor);

    const items: any[] = await Inventory.findAll({
      where,
      attributes: {
        include: [
          [literal(`(SELECT Category_Desc FROM Sales_Categories WHERE [Inventory].Sales_Category = Sales_Categories.Sales_Category)`), 'Category_Desc'],
          [literal(`(SELECT Class_Desc FROM Price_Classes WHERE [Inventory].Price_Class = Price_Classes.Price_Class)`), 'Class_Desc'],
          [literal(`(SELECT UPC_Number FROM Inventory_UPC WHERE [Inventory].Item_Number = Inventory_UPC.Item_Number AND Status = 0 AND Priority = 1)`), 'UPC_Number'],
          [literal(`(SELECT UPC_Number FROM Inventory_UPC WHERE [Inventory].Item_Number = Inventory_UPC.Item_Number AND Status = 1 AND Priority = 1)`), 'CaseUPC'],
          [literal(`(SELECT UPC_Number FROM Inventory_UPC WHERE [Inventory].Item_Number = Inventory_UPC.Item_Number AND Status = 2 AND Priority = 1)`), 'RetailUPC'],
          [literal(`(SELECT UPC_Number FROM Inventory_UPC WHERE [Inventory].Item_Number = Inventory_UPC.Item_Number AND Status = 4 AND Priority = 1)`), 'AltItem'],
          [literal(`0.00`), 'Price'],
          [literal(`0.00`), 'otpState'],
          [literal(`0.00`), 'otpCounty'],
          [literal(`0.00`), 'otpCity'],
          [literal(`0.00`), 'TotalPrice'],
          [literal(`0.00`), 'Retail'],
          [literal(`0.00`), 'UnitPrice'],
          [literal(`0.00`), 'subclassAmount'],
          [literal(`(SELECT ISNULL(SUM(ISNULL(Inventory_OnHand, 0)), 0) FROM Inventory_Status WHERE Inventory_Status.Item_Number = [Inventory].Item_Number AND Code = 0)`), 'Inventory_OnHand'],
        ],
      },
      raw: true,
    });

    if (C_Number) {
      const customerNumber = Number(C_Number);
      const itemNumbers = items.map((item: any) => item.Item_Number);
      const discountMap = await getDiscountsForItemNumbers(itemNumbers, customerNumber);

      for (const item of items) {
        const discountedPrice = discountMap[item.Item_Number];
        if (discountedPrice != null) {
          item.Price = discountedPrice;
        }
      }
    }

    return items;
  }

  async getInvoiceReprint(data: any) {
    const { startDate, endDate, C_Number, Document_Number } = data

    const orderHeaderWhere: any = {
      Order_Deleted: 'False',
    };

    if (C_Number) orderHeaderWhere.C_Number = C_Number;
    if (startDate && endDate) {
      orderHeaderWhere.Invoice_Date = { [Op.between]: [startDate, endDate] };
    }
    if (Document_Number) orderHeaderWhere.Invoice_Number = Document_Number;

    const invoices = await OrderDetail.findAll({
      attributes: [
        [
          literal(`
          IIF([orderHeader].Invoice_Number_Legacy <> 0,
            CONVERT(VARCHAR(10), [orderHeader].Invoice_Number_Legacy),
            IIF([orderHeader].Invoice_Number > 1,
              CONCAT([orderHeader].Order_Number, '-', [orderHeader].Invoice_Number),
              CONVERT(VARCHAR(10), [orderHeader].Order_Number)
            )
          )
        `),
          'Document_Number'
        ],

        'Order_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Unit_Code',
        'Price',
        'Sales_Category',

        [col('orderHeader.Invoice_Date'), 'Invoice_Date'],
        [col('orderHeader.Invoice_Number'), 'Invoice_Number'],
        [col('orderHeader.Invoice_Total'), 'Invoice_Total'],
        [col('orderHeader.C_Number'), 'C_Number'],
        [col('orderHeader->customer.C_Name'), 'C_Name'],
        [col('orderHeader->customer.C_Address'), 'C_Address'],
        [col('orderHeader->customer.C_City'), 'C_City'],
        [col('orderHeader->customer.C_State'), 'C_State'],
        [col('orderHeader->customer.C_Zip'), 'C_Zip'],
        [col('orderHeader->customer.C_Country'), 'C_Country'],
      ],
      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          attributes: [],
          required: true,
          where: orderHeaderWhere,
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [],
              required: false,
            },
          ],
        },
      ],
      raw: true,
    })
    return invoices

  }

  async getItemGroupPromotionMaintenanceReport(data: any) {
    const { Sales_Category, Price_Class, Description, Brand_ID, Item_GroupID, Vendor } = data;

    const where: any = {};
    if (Sales_Category) where.Sales_Category = Number(Sales_Category);
    if (Price_Class) where.Price_Class = Number(Price_Class);
    if (Brand_ID) where.Brand_ID = Number(Brand_ID);
    if (Item_GroupID) where.Item_GroupID = Number(Item_GroupID);

    const items: any[] = await InventorySpecials.findAll({
      where,
      attributes: {
        include: [
          [literal(`(SELECT Description FROM Inventory WHERE Inventory.Item_Number = [InventorySpecials].Item_Number)`), 'Description'],
          [literal(`IIF([InventorySpecials].Sales_Category = 0, 'N/A', (SELECT Category_Desc FROM Sales_Categories WHERE [InventorySpecials].Sales_Category = Sales_Categories.Sales_Category))`), 'scat'],
          [literal(`IIF([InventorySpecials].Price_Class = 0, 'N/A', (SELECT Class_Desc FROM Price_Classes WHERE [InventorySpecials].Price_Class = Price_Classes.Price_Class))`), 'pcat'],
          [literal(`IIF([InventorySpecials].Brand_ID = 0, 'N/A', (SELECT Brand_Family FROM Inventory_Brands WHERE Inventory_Brands.Brand_ID = [InventorySpecials].Brand_ID))`), 'brand'],
          [literal(`IIF([InventorySpecials].Item_GroupID = 0, 'N/A', (SELECT Item_GroupDescription FROM Inventory_ItemGroups WHERE Inventory_ItemGroups.Item_GroupID = [InventorySpecials].Item_GroupID))`), 'igroup'],
        ],
      },
      raw: true,
    });

    if (Description) {
      const search = Description.toLowerCase();
      return items.filter((item: any) => item.Description && item.Description.toLowerCase().includes(search));
    }

    return items;
  }

  async updateSetting(data: any) {
    return await Setting.update(data, { where: {} })
  }

  async getSettingDeliveryAddress() {
    return await Setting.findOne({
      attributes: [
        'deliveryStartAddress',
        'deliveryEndAddress',
        'deliveryStartLat',
        'deliveryStartLong',
        'deliveryEndLat',
        'deliveryEndLong',
      ],
    })
  }


  async getCreatedRoutes(query: PaginationOptions) {
    const { fromDate } = query;
    const groups = await DeliveryRouteGroup.findAll({
      where: {
        day: { [Op.eq]: fromDate },
        isActive: true,
      },
      include: [
        {
          model: DeliveryRoute,
          as: 'childRoutes',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Driver,
              as: 'driver',
              attributes: ['id', 'firstName', 'lastName', 'phoneNumber'],
            },
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'description', 'vinNumber'],
            },
          ],
          order: [['id', 'ASC']],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return groups;
  }

  async getRouteFullStops(id: number) {
    const group = await DeliveryRouteGroup.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: DeliveryRoute,
          as: 'childRoutes',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: DeliveryRouteStop,
              as: 'stops',
              where: { isActive: true },
              required: false,
            },
            {
              model: Driver,
              as: 'driver',
              attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'currentLatitude', 'currentLongitude'],
            },
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'description', 'vinNumber'],
            },
          ],
          order: [['id', 'ASC']],
        },
      ],
      order: [
        [{ model: DeliveryRoute, as: 'childRoutes' }, 'id', 'ASC'],
        [{ model: DeliveryRoute, as: 'childRoutes' }, { model: DeliveryRouteStop, as: 'stops' }, 'stopSequence', 'ASC'],
      ],
    });

    if (!group) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }

    const plainGroup: any = group.get({ plain: true });
    const allStops = (plainGroup.childRoutes || []).flatMap((r: any) => r.stops || []);
    const cNumbers = [...new Set(allStops.map((s: any) => s.C_Number))];

    if (cNumbers.length === 0) return plainGroup;

    const customers = await Customer.findAll({
      where: { C_Number: { [Op.in]: cNumbers as number[] } },
      attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Phone'],
      raw: true,
    });

    const customerMap = new Map(
      customers.map((c: any) => [c.C_Number, c])
    );

    plainGroup.childRoutes = (plainGroup.childRoutes || []).map((route: any) => ({
      ...route,
      stops: (route.stops || []).map((stop: any) => {
        const customer = customerMap.get(stop.C_Number);
        return {
          ...stop,
          C_Name: customer?.C_Name || null,
          C_Address: customer?.C_Address || null,
          C_City: customer?.C_City || null,
          C_State: customer?.C_State || null,
          C_Zip: customer?.C_Zip || null,
          C_Phone: customer?.C_Phone || null,
        };
      }),
    }));

    return plainGroup;
  }


  // services/deliveryRoute.service.ts
  async createManualRoute(body: any) {
    const { day, origin, destination, driverId, truckId, orders } = body;

    // ── Validations ──────────────────────────────────────────────
    if (!day) throw new AppError('day is required', 400);
    if (!origin) throw new AppError('origin is required', 400);
    if (!destination) throw new AppError('destination is required', 400);
    if (!driverId) throw new AppError('driverId is required', 400);
    if (!truckId) throw new AppError('truckId is required', 400);
    if (!orders?.length) throw new AppError('At least 1 order is required', 400);

    // ── Validate each order has stopSequence ─────────────────────
    for (const order of orders) {
      if (!order.stopSequence) {
        throw new AppError(
          `stopSequence is required for orderNumber ${order.orderNumber}`,
          400
        );
      }
    }

    // ── Check duplicate orderNumbers ─────────────────────────────
    const orderNumbers = orders.map((o: any) => o.orderNumber);
    if (new Set(orderNumbers).size !== orderNumbers.length) {
      throw new AppError('Duplicate orderNumbers found in payload', 400);
    }

    // ── Check duplicate stopSequences ────────────────────────────
    const sequences = orders.map((o: any) => o.stopSequence);
    if (new Set(sequences).size !== sequences.length) {
      throw new AppError('Duplicate stopSequence found in payload', 400);
    }

    // ── Sort by stopSequence ─────────────────────────────────────
    const sortedOrders = [...orders].sort(
      (a: any, b: any) => a.stopSequence - b.stopSequence
    );

    // ── Check driver not already assigned on this day ────────────
    const alreadyAssignedDriver = await DeliveryRoute.findOne({
      where: {
        day,
        driverId,
        routeStatus: { [Op.in]: [RouteStatus.NOT_STARTED, RouteStatus.IN_PROGRESS] },
        isActive: true,
      },
    });
    if (alreadyAssignedDriver) {
      throw new AppError(`Driver ${driverId} already has a route on ${day}`, 400);
    }

    // ── Check truck not already assigned on this day ─────────────
    const alreadyAssignedTruck = await DeliveryRoute.findOne({
      where: {
        day,
        truckId,
        routeStatus: { [Op.in]: [RouteStatus.NOT_STARTED, RouteStatus.IN_PROGRESS] },
        isActive: true,
      },
    });
    if (alreadyAssignedTruck) {
      throw new AppError(`Truck ${truckId} already has a route on ${day}`, 400);
    }

    // ── Calculate distance + ETA per leg (no reorder) ────────────
    const { legs, polyline, totalKilometers, totalMiles, totalDurationInMinutes } =
      await getDirectionsInOrder(
        origin,
        destination,
        sortedOrders.map((o: any) => ({ lat: o.lat, lng: o.lng }))
      );

    // ── Build stops with distance + ETA ──────────────────────────
    const stopsWithDistance = sortedOrders.map((order: any, index: number) => {
      const leg = legs[index];

      const legKm = Number((leg.distanceMeters / 1000).toFixed(3));

      const cumulativeKm = Number(
        (
          legs
            .slice(0, index + 1)
            .reduce((sum: number, l: any) => sum + l.distanceMeters, 0) / 1000
        ).toFixed(3)
      );

      const etaSeconds = legs
        .slice(0, index + 1)
        .reduce((sum: number, l: any) => sum + l.durationSeconds, 0);

      const etaMinutes = Math.ceil(etaSeconds / 60);
      const startLat = index === 0 ? origin.lat : sortedOrders[index - 1].lat;
      const startLng = index === 0 ? origin.lng : sortedOrders[index - 1].lng;

      return {
        orderNumber: order.orderNumber,
        C_Number: order.C_Number,
        stopSequence: order.stopSequence,
        latitude: order.lat,
        longitude: order.lng,
        startLatitude: startLat,
        startLongitude: startLng,
        endLatitude: order.lat,
        endLongitude: order.lng,
        totalKilometers: legKm,
        cumulativeKm,
        etaMinutes,
        isLastStop: index === sortedOrders.length - 1,
        invoiceUrl: order.invoiceUrl ?? null,
        invoiceAmount: order.invoiceAmount ?? null,
      };
    });

    // ── Update OrderHeader BEFORE transaction (MSSQL — separate connection) ──
    const orderNumbersToUpdate = stopsWithDistance.map((s: any) => s.orderNumber);
    if (orderNumbersToUpdate.length > 0) {
      await OrderHeader.update(
        { route_created: true },
        { where: { Order_Number: { [Op.in]: orderNumbersToUpdate } } }
        // ✅ No transaction — MSSQL has its own connection
      );
    }

    // ── Save in one PostgreSQL transaction ────────────────────────
    let finalResult: any = {};

    await postgresSequelize.transaction(async (t) => {

      // ── Create Route Group ──────────────────────────────────
      const groupNumber = `GRP-MANUAL-${day}-${Date.now()}`;

      const routeGroup = await DeliveryRouteGroup.create(
        {
          groupNumber,
          routeType: 'manual',
          day,
          totalOrders: sortedOrders.length,
          totalRoutes: 1,
          totalStops: sortedOrders.length,
          totalKilometers,
          totalMiles,
          originLat: origin.lat,
          originLng: origin.lng,
          destinationLat: destination.lat,
          destinationLng: destination.lng,
          status: 'not_started',
          isActive: true,
        },
        { transaction: t }
      );

      const routeNumber = `R-MANUAL-${day}-D${driverId}`;

      // ── Create DeliveryRoute ────────────────────────────────
      const route = await DeliveryRoute.create(
        {
          polyline,
          routeGroupId: routeGroup.id,
          routeNumber,
          routeGroupKey: routeNumber,
          day,
          driverId,
          truckId,
          orderStartLat: origin.lat,
          orderStartLong: origin.lng,
          orderEndLat: destination.lat,
          orderEndLong: destination.lng,
          routeStatus: 'not_started',
          totalStops: sortedOrders.length,
          completedStops: 0,
          totalKilometers,
          totalMiles,
          totalDurationInMinutes,
          hasChildren: false,
          parentRouteId: 0,
          splitIndex: 0,
          isActive: true,
        },
        { transaction: t }
      );

      // ── Create Stops ────────────────────────────────────────
      const stopsToInsert = stopsWithDistance.map((s: any) => ({
        routeId: route.id,
        routeName: routeNumber,
        day,
        orderNumber: s.orderNumber,
        C_Number: s.C_Number,
        stopSequence: s.stopSequence,
        latitude: s.latitude,
        longitude: s.longitude,
        startLatitude: s.startLatitude,
        startLongitude: s.startLongitude,
        endLatitude: s.endLatitude,
        endLongitude: s.endLongitude,
        totalKilometers: s.totalKilometers,
        status: 'not_delivered',
        isLastStop: s.isLastStop,
        invoiceUrl: s.invoiceUrl ?? null,
        invoiceAmount: s.invoiceAmount ?? null,
        reSchedule: false,
        reScheduleDate: null,
        reScheduleTime: null,
        reScheduleReason: null,
        reScheduleNotes: null,
        reScheduleCreatedAt: null,
        reScheduleUpdatedAt: null,
        routeStarted: false,
        isActive: true,
      }));

      await DeliveryRouteStop.bulkCreate(stopsToInsert, { transaction: t });

      finalResult = {
        message: 'Manual route created successfully',
        routeGroup: {
          id: routeGroup.id,
          groupNumber: routeGroup.groupNumber,
          day,
          totalOrders: sortedOrders.length,
          totalRoutes: 1,
          totalStops: sortedOrders.length,
          totalKilometers,
          totalMiles,
        },
        route: {
          routeId: route.id,
          routeNumber,
          driverId,
          truckId,
          totalStops: sortedOrders.length,
          totalKilometers,
          totalMiles,
          totalDurationInMinutes,
          day,
        },
        stops: stopsWithDistance,
      };
    });

    return finalResult;
  }



  async updateDeliveryRouteDriverVehicle(routeId: number, body: { driverId: number; truckId: number }) {
    const { driverId, truckId } = body;

    const route = await DeliveryRoute.findOne({
      where: { id: routeId, isActive: true },
    });

    if (!route) {
      throw new AppError(Manager.RECORD_NOT_FOUND, 404);
    }

    const [driver, vehicle] = await Promise.all([
      Driver.findOne({ where: { id: driverId, isActive: true } }),
      Vehicle.findOne({ where: { id: truckId, isActive: true } }),
    ]);

    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    const day =
      typeof route.day === 'string'
        ? route.day
        : moment(route.day).format('YYYY-MM-DD');

    if (Number(route.driverId) !== Number(driverId)) {
      const driverConflict = await DeliveryRoute.findOne({
        where: {
          day,
          driverId,
          isActive: true,
          id: { [Op.ne]: routeId },
        },
      });
      if (driverConflict) {
        throw new AppError(
          `Driver ${driverId} already has a route on ${day}`,
          400
        );
      }
    }

    if (Number(route.truckId) !== Number(truckId)) {
      const truckConflict = await DeliveryRoute.findOne({
        where: {
          day,
          truckId,
          isActive: true,
          id: { [Op.ne]: routeId },
        },
      });
      if (truckConflict) {
        throw new AppError(
          `Truck ${truckId} already has a route on ${day}`,
          400
        );
      }
    }

    await route.update({ driverId, truckId });

    const updated = await DeliveryRoute.findByPk(routeId, {
      include: [
        {
          model: Driver,
          as: 'driver',
          attributes: ['id', 'firstName', 'lastName', 'phoneNumber'],
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'description', 'vinNumber'],
        },
      ],
    });

    return {
      message: 'Driver and vehicle updated successfully',
      route: updated?.get({ plain: true }),
    };
  }


  async uploadBulkImages(req: any) {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400);
    }

    const fileMap = new Map<string, Express.Multer.File>();

    for (const file of files) {
      const productNumber = file.originalname.split(".")[0];
      if (!/^\d+$/.test(productNumber)) continue;
      if (!fileMap.has(productNumber)) {
        fileMap.set(productNumber, file);
      }
    }

    const uniqueFiles = Array.from(fileMap.entries());

    const existingImages = await ProductImage.findAll({
      where: { product_number: { [Op.in]: uniqueFiles.map(([pn]) => pn) } },
      attributes: ['id', 'product_number'],
      raw: true,
    });

    const existingMap = new Map(
      existingImages.map((img: any) => [img.product_number, img.id])
    );

    const limit = pLimit(5);

    const uploadResults = await Promise.allSettled(
      uniqueFiles.map(([productNumber, file]) =>
        limit(async () => {
          const uploadResult = await uploadFileToAzure(
            file.buffer,
            file.originalname,
            file.mimetype,
            "product-images"
          );

          if (!uploadResult.success) {
            throw new Error(uploadResult.error);
          }

          return {
            product_number: productNumber,
            img_url: uploadResult.url,
            existingId: existingMap.get(productNumber) || null,
          };
        })
      )
    );

    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    const failed: any[] = [];

    uploadResults.forEach((res, index) => {
      const fileName = uniqueFiles[index][1].originalname;

      if (res.status === "fulfilled") {
        const { product_number, img_url, existingId } = res.value;
        if (existingId) {
          toUpdate.push({ id: existingId, img_url });
        } else {
          toCreate.push({ product_number, img_url, isActive: true, isAllow: true });
        }
      } else {
        failed.push({ file: fileName, error: res.reason.message });
      }
    });

    const transaction = await postgresSequelize.transaction();

    try {
      if (toCreate.length > 0) {
        await ProductImage.bulkCreate(toCreate, { transaction });
      }

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((item: any) =>
            ProductImage.update(
              { img_url: item.img_url },
              { where: { id: item.id }, transaction }
            )
          )
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new AppError("Database operation failed", 500);
    }

    return {
      totalFiles: files.length,
      processed: uniqueFiles.length,
      created: toCreate.length,
      updated: toUpdate.length,
      failedCount: failed.length,
      failed,
    };
  }

  async getCancelledStops(query: PaginationOptions) {
    const { page = 1, limit = 10 } = query;
    const where: any = {
      isActive: true,
      status: DeliveryStopStatus.CANCELLED,
    };
    const offset = (page - 1) * limit;
    const { count: totalCount, rows: stops } = await DeliveryRouteStop.findAndCountAll({
      where,
      limit,
      offset,
      order: [['cancelledAt', 'DESC']],
      include: [
        {
          model: DeliveryRoute,
          as: 'route',
          required: true,
          attributes: [
            'id',
            'routeNumber',
            'day',
            'driverId',
            'truckId',
            'routeStatus',
            'routeGroupKey',
          ],
          include: [
            {
              model: Vehicle,
              as: 'vehicle',
              required: false,
              attributes: [
                'id',
                'description',
                'truckType',
                'licenseRegistrationNumber',
                'vinNumber',
              ],
            },
            {
              model: Driver,
              as: 'driver',
              required: false,
              attributes: { exclude: ['password'] },
            },
          ],
        },
      ],
    });

    const stopsWithCustomer = await Promise.all(stops.map(async (stop: any) => {
      const customer = await Customer.findByPk(stop.C_Number, { attributes: ['C_Name', 'C_Number', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Phone'] });
      return {
        ...stop.toJSON(),
        customer,
      };
    }));
    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stops: stopsWithCustomer,
    };
  }

  async cancelStop(stopId: number, body: any) {
    const { allowReDeliver, orderNumber } = body;
    if (allowReDeliver) {

      const stop = await DeliveryRouteStop.findOne({
        where: { id: stopId, isActive: true },
      });
      if (!stop) throw new AppError('Stop not found', 404);
      await stop.update({ isActive: false });
      await OrderHeader.update({
        route_created: false,
      }, { where: { Order_Number: orderNumber } });
      return stop;
    } else {

      const stop = await DeliveryRouteStop.findOne({
        where: { id: stopId, isActive: true },
      });
      if (!stop) throw new AppError('Stop not found', 404);
      await stop.update({ isActive: false });
      return stop;
    }

  }

  async getStopFullDetails(stopId: number) {
    const stop = await DeliveryRouteStop.findOne({
      where: { id: stopId },
    });
    if (!stop) throw new AppError('Stop not found', 404);

    const customerRow = await Customer.findByPk(stop.C_Number, {
      attributes: ['C_Name', 'C_Email', 'C_PhoneMobile', 'C_Phone', 'C_Address', 'C_Zip'],
    });

    const customer = customerRow
      ? {
        C_Name: customerRow.C_Name ?? null,
        email: customerRow.C_Email ?? null,
        phone: (customerRow.C_PhoneMobile || customerRow.C_Phone) ?? null,
        address: customerRow.C_Address ?? null,
        zip: customerRow.C_Zip ?? null,
      }
      : null;

    const deliveryPODs = await DeliveryRoutePOD.findAll({
      where: { routeStopId: stopId },
      order: [['id', 'DESC']],
    });

    return {
      stop: stop.toJSON(),
      customer,
      deliveryPODs: deliveryPODs.map((p) => p.toJSON()),
    };
  }


  async getRouteFullReport(routeId: number) {
    const anchor = await DeliveryRoute.findByPk(routeId, {
      attributes: ['id', 'hasChildren'],
    });
    if (!anchor) throw new AppError(Manager.RECORD_NOT_FOUND, 404);

    let segmentIds: number[] = [routeId];
    if (anchor.hasChildren) {
      const children = await DeliveryRoute.findAll({
        where: { parentRouteId: routeId },
        attributes: ['id'],
        raw: true,
      });
      segmentIds = [routeId, ...children.map((c: { id: number }) => c.id)];
    }

    const routes = await DeliveryRoute.findAll({
      where: { id: { [Op.in]: segmentIds } },
      include: [
        {
          model: Driver,
          as: 'driver',
          attributes: { exclude: ['password'] },
        },
        { model: Vehicle, as: 'vehicle' },
        { model: DeliveryRouteGroup, as: 'routeGroup', required: false },
        {
          model: DeliveryRouteStop,
          as: 'stops',
          separate: true,
          order: [['stopSequence', 'ASC']],
        },
      ],
      order: [['id', 'ASC']],
    });

    const allStops = routes.flatMap((r) => (r as any).stops || []);
    const stopIds = allStops.map((s: DeliveryRouteStop) => s.id);
    const cNumbers = [...new Set(allStops.map((s: DeliveryRouteStop) => s.C_Number))];

    const customers = cNumbers.length
      ? await Customer.findAll({
        where: { C_Number: { [Op.in]: cNumbers } },
        attributes: [
          'C_Number',
          'C_Name',
          'C_Email',
          'C_PhoneMobile',
          'C_Phone',
          'C_Address',
          'C_City',
          'C_State',
          'C_Zip',
        ],
        raw: true,
      })
      : [];

    const customerMap = new Map<number, any>(
      customers.map((c: any) => [c.C_Number, c])
    );

    const pods = stopIds.length
      ? await DeliveryRoutePOD.findAll({
        where: { routeStopId: { [Op.in]: stopIds } },
        order: [['id', 'DESC']],
      })
      : [];

    const podsByStopId = new Map<number, any[]>();
    for (const p of pods) {
      const sid = p.routeStopId;
      const row = p.toJSON();
      if (!podsByStopId.has(sid)) podsByStopId.set(sid, []);
      podsByStopId.get(sid)!.push(row);
    }

    const enrichStop = (stop: any) => {
      const c = customerMap.get(stop.C_Number);
      return {
        ...stop,
        customer: c
          ? {
            C_Name: c.C_Name ?? null,
            email: c.C_Email ?? null,
            phone: (c.C_PhoneMobile || c.C_Phone) ?? null,
            address: c.C_Address ?? null,
            city: c.C_City ?? null,
            state: c.C_State ?? null,
            zip: c.C_Zip ?? null,
          }
          : null,
        deliveryPODs: podsByStopId.get(stop.id) ?? [],
      };
    };

    const routesOut = routes.map((r) => {
      const plain: any = r.get({ plain: true });
      return {
        ...plain,
        stops: (plain.stops || []).map((s: any) => enrichStop(s)),
      };
    });

    return {
      requestedRouteId: routeId,
      routes: routesOut,
    };
  }

}

