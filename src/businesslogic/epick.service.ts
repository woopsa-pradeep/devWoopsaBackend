import { col, fn, literal, Op, QueryTypes, Transaction, where } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import moment from "moment";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { Customer } from "../models/mmsql/customer.model";
import { IOrderPick, IOrderPickBox } from "../interfaces/request.body.interface";
import { OrderPickBox } from "../models/postgres/epickOrderBox.model";
import { generateBarcodeAndUpload } from "../utils/barCodeGenerate";
import { checkQtyDiscount, generateBarcode, getDiscount, getFirstValidPrice, getInventoryOnHand, getJurisdiction, getPrepaidTaxRate, getProductLimit, getTaxRateV1, hasDiscountedItem } from "../utils/helper";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { AppError } from "../utils/AppError";
import { OrderPickScan } from "../models/postgres/epickOrderScan.model";

import { uploadFileToAzure } from "../utils/azureUploader";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { ProductImage } from "../models/postgres/product.model";
import e, { Request } from "express";
import { postgresSequelize, sequelize } from "../db";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { InventorySubstitutes } from "../models/mmsql/inventorySubsitute.model";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { PriceClass } from "../models/mmsql/priceClass.model";
import InventoryStatus from "../models/mmsql/inventoryStatus.model";
import Setting from "../models/postgres/setting.model";
import { Distributor } from "../models/mmsql/distributor.model";
import { OptionDefsValues } from "../models/mmsql/optionDefsValue.model";
import { getDefaultOrderDetailValues } from "../utils/order";
import { PassScanItem } from "../models/postgres/passScanItem.model";
import EpickSetting from "../models/postgres/epickSetting.model";
import { WebUsers } from "../models/postgres/users.model";
import { OverrideRequest } from "../models/postgres/overrideRequest.model";
import { sendMultiFCMNotification } from "../utils/sentNotification";
import { RetailerDevice } from "../models/postgres/device.model";
import { Notifications } from "../models/postgres/notification.model";
import { RecordLock } from "../models/mmsql/recordLocks.model";


export class EpickService {

  // async  getOrder() {
  //     const start = moment().startOf('day').toDate();
  //     const end   = moment().endOf('day').toDate();

  //     const todayOrder = await OrderHeader.findAll({
  //      where: {
  //        Order_Date: { [Op.gte]: start, [Op.lte]: end },
  //      },
  //      attributes: ['Order_Number', 'Order_Date'],
  //      include: [
  //        {
  //          model: Customer,
  //          as: 'customer',
  //          attributes: ['C_Number', 'C_Name'],
  //          include: [
  //            {
  //              model: CustomerRoute,
  //              as: 'Routes',
  //              attributes: ['Route_Number', 'Stop_Number'],
  //              required: false,
  //            },
  //          ],
  //          required: false,
  //        },
  //        {
  //          model: OrderDetail,
  //          as: 'orderDetails',
  //          attributes: ['Order_Number', 'Line_Number', 'Quantity_Ordered', 'Pack', 'CaseCount'],
  //          required: false,
  //          include: [
  //            {
  //              model: Inventory,
  //              as: 'inventory',
  //              attributes: ['Item_Number', 'Description'],
  //              required: false,
  //            },
  //          ],
  //        },
  //      ],
  //      order: [
  //        ['Order_Number', 'ASC'], // Order orders themselves
  //        [{ model: OrderDetail, as: 'orderDetails' }, 'Line_Number', 'ASC'], // Order orderDetails by Line_Number
  //      ],
  //    });


  //    console.log(todayOrder,'todayOrder');
  //      const acceptedOrders = await OrderPick.findAll({
  //        where: {
  //          createdAt: { [Op.gte]: start, [Op.lte]: end },
  //          status: {
  //             [Op.or]: ['in_progress', 'completed']
  //           }


  //        },
  //        attributes: ['orderNumber'],
  //      });

  //      const acceptedOrderNumbers = acceptedOrders.map((o: any) => String(o.orderNumber));

  //      const notAcceptedOrders = todayOrder.filter(
  //        (order: any) => !acceptedOrderNumbers.includes(String(order.Order_Number))
  //      );

  //      return notAcceptedOrders;
  //    }
       
       async getOrder(userId: number) {
        // Step 0: Fetch user preferences (order_type and shortby)
        const user = await WebUsers.findOne({
          where: { id: userId },
          attributes: ['order_type', 'shortby'],
          raw: true,
        });
        
        const orderType = (user as any)?.order_type || 'order_number';
        const shortBy = (user as any)?.shortby || 'Des';
        
        console.log(`User ${userId} preferences: order_type=${orderType}, shortby=${shortBy}`);
        console.log('User object:', user);
        
        // Step 1: Get completed order numbers from PostgreSQL first (single query)
        const completedOrders = await OrderPick.findAll({
          where: {
            status: 'completed'
          },
          attributes: ['orderNumber'],
          raw: true,
        });
        
        const completedOrderNumbers = completedOrders
          .map((o: any) => o?.orderNumber)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => Number(v));
        
        console.log(completedOrderNumbers.length, 'completed orders to exclude');
        
        // Step 2: Query Order_Header (MSSQL) with all filters in SQL
        // Filter: Order_Updated = 0 AND Invoice_Number = 0
        // Exclude locked orders from Record_Locks
        // Include only orders that HAVE Order_Detail items
        // Exclude completed orders from PostgreSQL
        const headerWhere: any = {
          [Op.and]: [
            { Order_Updated: false },
            { Invoice_Number: 0 },
            // Exclude orders that are locked in Record_Locks table
            literal(`Order_Number NOT IN (SELECT Lock_Number FROM Record_Locks WHERE Lock_Number IS NOT NULL)`),
            // Ensure order has Order_Detail items (has at least one detail)
            literal(`Order_Number IN (SELECT DISTINCT Order_Number FROM Order_Detail)`)
          ]
        };
        
        // Exclude completed orders if any exist
        if (completedOrderNumbers.length > 0) {
          headerWhere[Op.and].push({ Order_Number: { [Op.notIn]: completedOrderNumbers } });
        }
        
        console.log(headerWhere, 'headerWhere');
        
        // Step 2a: Get order numbers that have ANY item with Confirmed != 0 (using SQL subquery - fast)
        const ordersWithConfirmedNotZero = await sequelize.query(
          `SELECT DISTINCT Order_Number 
           FROM Order_Detail 
           WHERE Confirmed = 1`,
          {
            type: QueryTypes.SELECT,
            raw: true,
          }
        ) as any[];
        
        const orderNumbersWithConfirmedNotZero = new Set(
          ordersWithConfirmedNotZero
            .map((row: any) => row.Order_Number)
            .filter((v: any) => v !== null && v !== undefined)
            .map((v: any) => Number(v))
        );
        
        console.log(orderNumbersWithConfirmedNotZero.size, 'orders with Confirmed != 0');
        
        // Step 2b: Determine sorting order based on user preferences
        let orderBy: any[] = [];
        if (orderType === 'order_number') {
          // Sort by Order_Number DESC (latest first) - ignore shortby
          orderBy = [['Order_Number', 'DESC']];
          console.log('Will sort by Order_Number DESC in SQL query');
        } else {
          // For qty_number, we'll sort after fetching and calculating totalQty
          // Don't sort in SQL - we'll sort in JavaScript after calculating totalQty
          orderBy = []; // No SQL sorting - will sort by qty in JavaScript
          console.log('Will sort by totalQty in JavaScript after calculation');
        }
        
        // Step 2c: Fetch orders (NO Order_Detail include - much faster!)
        const orders = await OrderHeader.findAll({
          where: headerWhere,
          attributes: ['Order_Number', 'Order_Date'],
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip'],
              include: [
                {
                  model: CustomerRoute,
                  as: 'Routes',
                  attributes: ['Route_Number', 'Stop_Number'],
                  required: false,
                },
              ],
              required: false,
            },
          ],
          order: orderBy,
        });
      
        console.log(orders.length, 'final orders fetched');
        
        // Step 2d: Calculate totalQty for each order (always calculate for response)
        const orderNumbers = orders.map((order: any) => order.Order_Number);
        let totalQtyMap: any = {};
        
        if (orderNumbers.length > 0) {
          // Always calculate totalQty for response
          const totalQtyResults = await sequelize.query(
            `SELECT Order_Number, SUM(CAST(Quantity_Ordered AS FLOAT)) as totalQty
             FROM Order_Detail
             WHERE Order_Number IN (:orderNumbers)
             GROUP BY Order_Number`,
            {
              replacements: { orderNumbers: orderNumbers },
              type: QueryTypes.SELECT,
              raw: true,
            }
          ) as any[];
          
          totalQtyResults.forEach((row: any) => {
            totalQtyMap[row.Order_Number] = parseFloat(row.totalQty) || 0;
          });
          
          console.log(`Calculated totalQty for ${totalQtyResults.length} orders`);
          console.log('Sample totalQty values:', Object.entries(totalQtyMap).slice(0, 5));
        }
      
        // Step 3: Format response - add note only if order has Confirmed != 0 items
        let result = orders.map((order: any) => {
          const orderData: any = {
            Order_Number: order.Order_Number,
            Order_Date: order.Order_Date,
            totalQty: totalQtyMap[order.Order_Number] || 0,
            customer: order.customer ? {
              C_Number: order.customer.C_Number,
              C_Name: order.customer.C_Name,
              C_Address: order.customer.C_Address || null,
              C_City: order.customer.C_City || null,
              C_State: order.customer.C_State || null,
              C_Zip: order.customer.C_Zip || null,
              Routes: order.customer.Routes || []
            } : null
          };
          
          // Add note only if order has ANY item with Confirmed != 0 (check from Set - O(1) lookup)
          if (orderNumbersWithConfirmedNotZero.has(order.Order_Number)) {
            orderData.note = 'pending from erp';
          }
          
          return orderData;
        });
        
        // Step 4: Sort by totalQty if order_type is 'qty_number'
        if (orderType === 'qty_number') {
          console.log(`Sorting by totalQty with shortby=${shortBy}`);
          
          // Normalize shortby to handle case variations
          const normalizedShortBy = shortBy?.toLowerCase();
          
          if (normalizedShortBy === 'des') {
            // Sort DESC: highest totalQty first
            result.sort((a: any, b: any) => {
              const qtyA = a.totalQty || 0;
              const qtyB = b.totalQty || 0;
              return qtyB - qtyA; // DESC: b - a
            });
            console.log('Sorted by totalQty DESC (highest quantity first)');
          } else if (normalizedShortBy === 'asc') {
            // Sort ASC: lowest totalQty first
            result.sort((a: any, b: any) => {
              const qtyA = a.totalQty || 0;
              const qtyB = b.totalQty || 0;
              return qtyA - qtyB; // ASC: a - b
            });
            console.log('Sorted by totalQty ASC (lowest quantity first)');
          } else {
            // Default to DESC if shortby is invalid
            console.log(`Unknown shortby value: ${shortBy}, defaulting to DESC`);
            result.sort((a: any, b: any) => {
              const qtyA = a.totalQty || 0;
              const qtyB = b.totalQty || 0;
              return qtyB - qtyA;
            });
          }
          
          // Log first few orders after sorting for debugging
          console.log('First 5 orders after sorting by qty:', result.slice(0, 5).map((o: any) => ({
            Order_Number: o.Order_Number,
            totalQty: o.totalQty
          })));
        } else {
          console.log(`order_type is '${orderType}', keeping SQL sort order (Order_Number DESC)`);
        }
      
        console.log(result.length, 'final orders to return');
        return result;
      }

  async getOrderHistory(id: number) {
    const data = await OrderPick.findAll({
      where: {
        pickerUserNumber: id
      }
    })
    return data;
  }

  async acceptOrder(body: IOrderPick, id: number) {

    const isUserExist = await WebUsers.findOne({
      where: { id: id, status: true, role: { [Op.in]: ['epick', 'sales'] }, isActive: true, },
      attributes: { exclude: ['password'] } // Exclude password for security
    })
    if (!isUserExist) {
      throw new AppError('User not found', 404);
    }

    // Check if order is already locked in RecordLock (already started in ERP)
    const existingLock = await RecordLock.findOne({
      where: {
        Lock_Number: body.orderNumber,
        Lock_Type: 0
      }
    });

    if (existingLock) {
      throw new AppError('order is already started in other device please refresh the app', 400);
    }

    let outOfStock = 0

    const orderItem = await OrderDetail.findAll({
      where: {
        Order_Number: body.orderNumber
      },
      attributes: ['Item_Number']
    })
    for (const item of orderItem) {
      const inventoryOnHand = await getInventoryOnHand(item.Item_Number)
      if (inventoryOnHand <= 0) {
        console.log(item.Item_Number, 'item.Item_Number')
        outOfStock++
      }
    }
    console.log(outOfStock, 'outOfStock');


    const data = await OrderPick.create({
      orderNumber: body.orderNumber,
      customerNumber: body.customerNumber,
      notes: body.notes,
      totalLines: body.totalLines,
      startedAt: moment().toDate(),
      totalQty: body.totalQty,
      scannedLines: body.scannedLines,
      OutOfStockItem: outOfStock,
      scannedQty: body.scannedQty,
      pickerUserNumber: id,
    })
    
    // Create lock record when order is started
    // myKey is auto-generated, so we only insert other fields
    await RecordLock.create({
      Lock_Type: 0,
      Lock_Number: Number(body.orderNumber),
      Lock_User: Number(isUserExist.userNumber ?? 0),
      Lock_Workstation: 0
    });
    
    await OrderDetail.update(
      { Quantity_Shipped: 0 },
      {
        where: {
          Order_Number: body.orderNumber,
          Confirmed:0
        },
        }
);

        // Get pin and allowSingleScan from EpickSetting
        const epickSetting :any = await EpickSetting.findOne({
          order: [['createdAt', 'DESC']] // Get the latest setting
        });

        // Get allowSingleScan value - default to true if not found or null
        const allowSingleScanValue = epickSetting?.allowSingleScan ?? epickSetting?.dataValues?.allowSingleScan ?? true;

        return {
          data: data,
          isUserExist: isUserExist,
          pin: (epickSetting as any)?.pin || null,
          allowSingleScan: allowSingleScanValue
        };
    }

  async addOrderBox(body: IOrderPickBox) {
    const barcode = await generateBarcode(body.orderNumber);
    const res = await generateBarcodeAndUpload(barcode, {
      folderName: 'barcodes/orders',
      type: 'code128',
      includeText: true,
      scale: 4,
      height: 14,
    });

    if (res.success) {
      const data = await OrderPickBox.create({
        orderNumber: body.orderNumber,
        type: body.type,
        value: barcode,
        barcode: res.url || '',
      })
      return data;
    }
    else {
      throw new AppError("Failed to generate barcode", 400);
    }


  }

  async getOrderBox(orderNumber: number) {
    const data = await OrderPickBox.findAll({
      where: {
        orderNumber: orderNumber,
      },
    });
    return data;
  }

    async getOrderItem(orderNumber: number) {

      // Get customer number from order header
      const orderHeader = await OrderHeader.findOne({
        where: {
          Order_Number: orderNumber
        },
        attributes: ['C_Number']
      });

      const customerNumber = (orderHeader as any)?.C_Number || null;

      const data = await OrderDetail.findAll({
        where: {
          Order_Number: orderNumber,
          [Op.and]: [
            // Ensure Quantity_Ordered is greater than Quantity_Shipped
            { Quantity_Ordered: { [Op.gt]: sequelize.col("Quantity_Shipped") } },
            // Only show items where Confirmed = 0 (pending from ERP)
            {
              [Op.or]: [
                { Confirmed: false },
                { Confirmed: 0 },
                { Confirmed: null }
              ]
            }
          ],
        },
        attributes: [
          "Order_Number",
          "Line_Number",
          "Quantity_Ordered",
          "Pack",
          "CaseCount",
          "Quantity_Shipped",
          "Item_Number",
          "Confirmed",
        ],
        include: [
          {
            model: Inventory,
            as: "inventory",
            attributes: ["Item_Number", "Description", "Section", "Location"],
            include: [
              {
                model: InventoryUPC,
                as: "UPCList",
                attributes: ["UPC_Number"],
                required: false, // optional relation, it will work even if there are no matching records
              },
              {
                model: SalesCategory,
                as: "SalesCategory",
                attributes: ["Category_Desc"],
                required: false,
              },
            ],
          },
        ],
        order: [["Line_Number", "ASC"]],
      });
      

      
        

        const finalData = await Promise.all(data.map(async (e: any) => {
            let item = e.dataValues || null;

            const productImage = await ProductImage.findOne({
                where: {
                    product_number: item.Item_Number.toString(),
                    isAllow: true
                },
            });

            const inventoryOnHand = await getInventoryOnHand(item.Item_Number)

            // Check if item has a substitute product
            let substituteProduct = null;
            const substitute = await InventorySubstitutes.findOne({
              where: { Item_Number: item.Item_Number },
              attributes: ['Item_Number_Substitute', 'Item_Number', 'Substitute_Rule', 'Substitute_Text'],
              logging: false,
            });

            if (substitute && customerNumber) {
              try {
                const subItemNumber = substitute.get('Item_Number_Substitute') as number;
                
                // Get user jurisdiction
                const userJurisdiction = await getJurisdiction(customerNumber);
                
                // Get warehouse settings
                let wareHouseSetting: any = await Setting.findOne({});
                wareHouseSetting = wareHouseSetting?.dataValues || null;
                
                // Get substitute product details
                const subProduct = await Inventory.findOne({
                  attributes: [
                    'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
                    'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
                    'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
                    'OTP_Number', 'Price_Subclass', 'UnitOunces'
                  ],
                  where: {
                    I_Inactive: false,
                    ShortOrderForm: true,
                    Item_Number: subItemNumber,
                  },
                  include: [
                    {
                      model: SalesCategory,
                      as: 'SalesCategory',
                      attributes: ['Category_Desc','Sales_Category'],
                      required: false,
                    },
                    {
                      model: PriceClass,
                      as: 'PriceClass',
                      attributes: ['Class_Desc'],
                      required: false,
                    },
                    {
                      model: InventoryStatus,
                      as: 'inventoryStatus',
                      attributes: ['Inventory_OnHand'],
                      required: false,
                    },
                    {
                      model: InventoryUPC,
                      as: 'UPCList',
                      attributes: ['UPC_Number'],
                      where: { Status: 0 },
                      required: false,
                    },
                  ],
                  logging: false,
                });

                if (subProduct) {
                  const e = subProduct as any;
                  
                  // Get pricing
                  let price = await getDiscount(subItemNumber, customerNumber);
                  if (!price) {
                    price = await getFirstValidPrice(e);
                  }
                  
                  const subInventoryOnHand = (await getInventoryOnHand(subItemNumber)) || 0;
                  
                  let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                  taxRate = Math.ceil(taxRate * 100) / 100;
                  
                  const productImages = await ProductImage.findAll({
                    where: {
                      product_number: e.Item_Number.toString(),
                      isAllow: true,
                    },
                    logging: false,
                  });
                  
                  const productImage = productImages?.[0] ?? null;
                  
                  const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
                  const productLimit = await getProductLimit(e.Item_Number);
                  
                  let allowToOrder = true;
                  if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && subInventoryOnHand <= 0) {
                    allowToOrder = false;
                  }
                  let prepaidTaxRate = 0
                  if(userJurisdiction !=null && e.salesCategory){
                    prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.salesCategory?.Sales_Category);
                  }
                  substituteProduct = {
                    Pack: e.Pack,
                    Description: e.Description,
                    Item_Number: e.Item_Number,
                    CaseCount: e.CaseCount,
                    UOM: e.UOM,
                    isDiscounted,
                    Price1: e.Price1,
                    Tax_Rate: taxRate,
                    OTP_Number: e.OTP_Number,
                    price: Math.ceil(price * 100) / 100,
                    priceWithTax: Math.ceil((price + taxRate) * 100) / 100,
                    BaseCost: e.BaseCost,
                    Invoice_Cost: e.Invoice_Cost,
                    AvgCost: e.AvgCost,
                    NetCost: e.NetCost,
                    hasProductLimit: !!productLimit,
                    productLimit,
                    UPCList: e.UPCList,
                    hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                    prepaidTaxRate: prepaidTaxRate,
                    Inventory_OnHand: subInventoryOnHand,
                    UnitOunces: e.UnitOunces,
                    allowToOrder,
                    showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                    showLowStock: wareHouseSetting?.retailer?.showStock
                      ? false
                      : subInventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                    showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
                    SalesCategory: e.SalesCategory?.Category_Desc || null,
                    PriceClass: e.PriceClass?.Class_Desc || null,
                    showDistributorImage: productImage?.isAllow ?? false,
                    distributorImage: productImage?.img_url || null,
                    masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number ?? ''}.jpg`,
                    SubstituteFrom: substitute.get('Item_Number'),
                    SubstituteTo: subItemNumber,
                    Substitute_Rule: substitute.get('Substitute_Rule') ?? null,
                    Substitute_Text: substitute.get('Substitute_Text') ?? null,
                  };
                }
              } catch (error) {
                // If substitute product fetch fails, just continue without it
                console.error('Error fetching substitute product:', error);
              }
            }

            return {
                ...item,
                inventoryOnHand: inventoryOnHand,
                masterImage: `${process.env.AZUREIMAGESERVER}${item?.inventory?.UPCList?.[0]?.UPC_Number || ''}.jpg`,
                isDistributorImageShow: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                substituteProduct: substituteProduct,
                SalesCategory: item?.inventory?.SalesCategory?.Category_Desc || null
            }

        }))
        return finalData;
    }

    async getOrderItemFirst(orderNumber: number) {
      // Get customer number from order header
      const orderHeader = await OrderHeader.findOne({
        where: {
          Order_Number: orderNumber
        },
        attributes: ['C_Number']
      });

      const customerNumber = (orderHeader as any)?.C_Number || null;

      // Get only the first item (lowest Line_Number)
      const data = await OrderDetail.findAll({
        where: {
          Order_Number: orderNumber,
        },
        attributes: [
          "Order_Number",
          "Line_Number",
          "Quantity_Ordered",
          "Pack",
          "CaseCount",
          "Quantity_Shipped",
          "Item_Number",
          "Confirmed",
        ],
        include: [
          {
            model: Inventory,
            as: "inventory",
            attributes: ["Item_Number", "Description", "Section", "Location"],
            include: [
              {
                model: InventoryUPC,
                as: "UPCList",
                attributes: ["UPC_Number"],
                required: false,
              },
              {
                model: SalesCategory,
                as: "SalesCategory",
                attributes: ["Category_Desc"],
                required: false,
              },
            ],
          },
        ],
        order: [["Line_Number", "ASC"]],
        limit: 1, // Only get the first item
      });

      if (!data || data.length === 0) {
        return [];
      }

      const finalData = await Promise.all(data.map(async (e: any) => {
        let item = e.dataValues || null;

        const productImage = await ProductImage.findOne({
          where: {
            product_number: item.Item_Number.toString(),
            isAllow: true
          },
        });

        const inventoryOnHand = await getInventoryOnHand(item.Item_Number);

        // Check if item has a substitute product
        let substituteProduct = null;
        const substitute = await InventorySubstitutes.findOne({
          where: { Item_Number: item.Item_Number },
          attributes: ['Item_Number_Substitute', 'Item_Number', 'Substitute_Rule', 'Substitute_Text'],
          logging: false,
        });

        if (substitute && customerNumber) {
          try {
            const subItemNumber = substitute.get('Item_Number_Substitute') as number;
            
            // Get user jurisdiction
            const userJurisdiction = await getJurisdiction(customerNumber);
            
            // Get warehouse settings
            let wareHouseSetting: any = await Setting.findOne({});
            wareHouseSetting = wareHouseSetting?.dataValues || null;
            
            // Get substitute product details
            const subProduct = await Inventory.findOne({
              attributes: [
                'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
                'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
                'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
                'OTP_Number', 'Price_Subclass', 'UnitOunces'
              ],
              where: {
                I_Inactive: false,
                ShortOrderForm: true,
                Item_Number: subItemNumber,
              },
              include: [
                {
                  model: SalesCategory,
                  as: 'SalesCategory',
                  attributes: ['Category_Desc','Sales_Category'],
                  required: false,
                },
                {
                  model: PriceClass,
                  as: 'PriceClass',
                  attributes: ['Class_Desc'],
                  required: false,
                },
                {
                  model: InventoryStatus,
                  as: 'inventoryStatus',
                  attributes: ['Inventory_OnHand'],
                  required: false,
                },
                {
                  model: InventoryUPC,
                  as: 'UPCList',
                  attributes: ['UPC_Number'],
                  where: { Status: 0 },
                  required: false,
                },
              ],
              logging: false,
            });

            if (subProduct) {
              const e = subProduct as any;
              
              // Get pricing
              let price = await getDiscount(subItemNumber, customerNumber);
              if (!price) {
                price = await getFirstValidPrice(e);
              }
              
              const subInventoryOnHand = (await getInventoryOnHand(subItemNumber)) || 0;
              
              let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
              taxRate = Math.ceil(taxRate * 100) / 100;
              
              const productImages = await ProductImage.findAll({
                where: {
                  product_number: e.Item_Number.toString(),
                  isAllow: true,
                },
                logging: false,
              });
              
              const productImage = productImages?.[0] ?? null;
              
              const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
              const productLimit = await getProductLimit(e.Item_Number);
              
              let allowToOrder = true;
              if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && subInventoryOnHand <= 0) {
                allowToOrder = false;
              }
              let prepaidTaxRate = 0
              if(userJurisdiction !=null && e.salesCategory){
                prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.salesCategory?.Sales_Category);
              }
              substituteProduct = {
                Pack: e.Pack,
                Description: e.Description,
                Item_Number: e.Item_Number,
                CaseCount: e.CaseCount,
                UOM: e.UOM,
                isDiscounted,
                Price1: e.Price1,
                Tax_Rate: taxRate,
                OTP_Number: e.OTP_Number,
                price: Math.ceil(price * 100) / 100,
                priceWithTax: Math.ceil((price + taxRate) * 100) / 100,
                BaseCost: e.BaseCost,
                Invoice_Cost: e.Invoice_Cost,
                AvgCost: e.AvgCost,
                NetCost: e.NetCost,
                hasProductLimit: !!productLimit,
                productLimit,
                UPCList: e.UPCList,
                hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                prepaidTaxRate: prepaidTaxRate,
                Inventory_OnHand: subInventoryOnHand,
                UnitOunces: e.UnitOunces,
                allowToOrder,
                showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                showLowStock: wareHouseSetting?.retailer?.showStock
                  ? false
                  : subInventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
                SalesCategory: e.SalesCategory?.Category_Desc || null,
                PriceClass: e.PriceClass?.Class_Desc || null,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number ?? ''}.jpg`,
                SubstituteFrom: substitute.get('Item_Number'),
                SubstituteTo: subItemNumber,
                Substitute_Rule: substitute.get('Substitute_Rule') ?? null,
                Substitute_Text: substitute.get('Substitute_Text') ?? null,
              };
            }
          } catch (error) {
            // If substitute product fetch fails, just continue without it
            console.error('Error fetching substitute product:', error);
          }
        }

        return {
          ...item,
          inventoryOnHand: inventoryOnHand,
          masterImage: `${process.env.AZUREIMAGESERVER}${item?.inventory?.UPCList?.[0]?.UPC_Number || ''}.jpg`,
          isDistributorImageShow: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url || null,
          substituteProduct: substituteProduct,
          SalesCategory: item?.inventory?.SalesCategory?.Category_Desc || null
        };
      }));

      return finalData;
    }

  async addProductInBox(data: any) {

    const product = await InventoryUPC.findOne({
      where: {
        UPC_Number: data.UPC_Number
      }
    })
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const isProductInOrder = await OrderDetail.findOne({
      where: {
        Order_Number: data.orderNumber,
        Item_Number: product.Item_Number
      }
    })
    if (!isProductInOrder) {
      throw new AppError("Product not found in order", 404);
    }
    const findProductInBox = await OrderPickScan.findOne({
      where: {
        orderNumber: data.orderNumber,
        itemNumber: product.Item_Number,
        boxId: data.boxId
      }
    })

    console.log(findProductInBox, 'findProductInBox');

    if (findProductInBox) {
      await findProductInBox.update({
        qty: Number(findProductInBox.qty) + Number(data.qty)
      })

      await OrderPick.update(
        {
          scannedQty: literal(`"scannedQty" + ${Number(data.qty)}`)
        },
        {
          where: {
            orderNumber: data.orderNumber
          }
        }
      );

      await OrderDetail.update(
        {
          Quantity_Shipped: literal(`"Quantity_Shipped" + ${Number(data.qty)}`)
        },
        {
          where: {
            Order_Number: data.orderNumber,
            Item_Number: product.Item_Number
          }
        }
      );

    } else {

      console.log(data, 'data--->');
      await OrderPickScan.create({
        orderNumber: Number(data.orderNumber),
        itemNumber: Number(product.Item_Number),
        qty: Number(data.qty),
        boxId: data.boxId,
        isSubsitute: data.isSubsitute || false
      })

      await OrderDetail.update(
        {
          Quantity_Shipped: literal(`"Quantity_Shipped" + ${Number(data.qty)}`)
        },
        {
          where: {
            Order_Number: data.orderNumber,
            Item_Number: product.Item_Number
          }
        }
      );
      await OrderPick.update(
        {
          scannedLines: literal(`"scannedLines" + 1`),
          scannedQty: literal(`"scannedQty" + ${Number(data.qty)}`)
        },
        {
          where: {
            orderNumber: data.orderNumber
          }
        }
      );
    }







    return true;
  }

    async addProductsInBoxBatch(data: { 
        products: Array<{ UPC_Number: string; qty: number; boxId: number; isSubsitute?: boolean }>, 
        orderNumber: number,
        passItems?: Array<{ itemNumber: number; note?: string }> // Items to pass (skip) with optional manager note
    }, userId: number) {
        const { products = [], orderNumber, passItems = [] } = data;

        // Allow empty products if there are passItems (user wants to mark items as passed without scanning)
        if ((!products || products.length === 0) && (!passItems || passItems.length === 0)) {
            throw new AppError("No products or passItems provided", 400);
        }

        // Validate order exists
        const orderPick = await OrderPick.findOne({
            where: { orderNumber }
        });
        if (!orderPick) {
            throw new AppError("Order not found", 404);
        }

        // Step 1: Get all UPCs and map to Item_Numbers (only if products are provided)
        const upcNumbers = products && products.length > 0 ? products.map(p => p.UPC_Number) : [];
        const upcToItemMap = new Map<string, number>(); // Map<UPC_Number, Item_Number>
        
        if (upcNumbers.length > 0) {
            const inventoryUPCs = await InventoryUPC.findAll({
                where: {
                    UPC_Number: { [Op.in]: upcNumbers }
                }
            });

            for (const upc of inventoryUPCs) {
                upcToItemMap.set(upc.UPC_Number, upc.Item_Number);
            }

            // Validate all UPCs exist
            const foundUPCs = new Set(inventoryUPCs.map(u => u.UPC_Number));
            const missingUPCs = upcNumbers.filter(upc => !foundUPCs.has(upc));
            if (missingUPCs.length > 0) {
                throw new AppError(`Products not found for UPCs: ${missingUPCs.join(', ')}`, 404);
            }
        }

        // Step 2: Separate substitute and regular items, validate items are in the order (only if products exist)
        const itemNumbers = products && products.length > 0 ? Array.from(upcToItemMap.values()) : [];
        const originalItemNumbers = new Set<number>(); // Items scanned with isSubsitute=true (these are the ORIGINAL items)
        const originalToSubstituteMap = new Map<number, number>(); // Map<originalItemNumber, substituteItemNumber>
        
        // Check which products are marked as substitutes
        // When isSubsitute = true, the scanned item is the ORIGINAL, and we need to find its SUBSTITUTE from the database
        if (products && products.length > 0) {
            for (const product of products) {
                if (product.isSubsitute) {
                    const originalItemNumber = upcToItemMap.get(product.UPC_Number);
                    if (originalItemNumber) {
                        originalItemNumbers.add(originalItemNumber);
                    }
                }
            }
        }

        // Find all substitute items for the scanned original items
        // Query: WHERE Item_Number IN (scanned original items) to get their substitutes
        if (originalItemNumbers.size > 0) {
            const substitutes = await InventorySubstitutes.findAll({
                where: {
                    Item_Number: { [Op.in]: Array.from(originalItemNumbers) }
                }
            });

            // Map original items to their substitute items
            for (const substitute of substitutes) {
                const originalItem = Number(substitute.Item_Number);
                const substituteItem = Number(substitute.Item_Number_Substitute);
                originalToSubstituteMap.set(originalItem, substituteItem);
            }

            // Validate all scanned original items have substitute mappings
            const missingMappings = Array.from(originalItemNumbers).filter(
                origItem => !originalToSubstituteMap.has(origItem)
            );
            if (missingMappings.length > 0) {
                // Log the query that was attempted for debugging
                console.log(`[DEBUG] Attempted to find substitutes for items: ${Array.from(originalItemNumbers).join(', ')}`);
                console.log(`[DEBUG] Found substitutes for: ${Array.from(originalToSubstituteMap.keys()).join(', ')}`);
                console.log(`[DEBUG] Missing mappings for: ${missingMappings.join(', ')}`);
                throw new AppError(`Original items ${missingMappings.join(', ')} do not have valid substitute mappings in Inventory_Substitutes table. Please check that records exist where Item_Number = ${missingMappings.join(' OR Item_Number = ')}`, 404);
            }
        }

        // Get order items - include both regular items and original items (for substitutes, we validate the original is in the order)
        // Only validate if we have products to check
        if (itemNumbers.length > 0) {
            const itemsToCheck = itemNumbers.filter(itemNum => !originalItemNumbers.has(itemNum));
            if (itemsToCheck.length > 0) {
                const orderItems = await OrderDetail.findAll({
                    where: {
                        Order_Number: orderNumber,
                        Item_Number: { [Op.in]: itemsToCheck }
                    }
                });

                const orderItemNumbers = new Set(orderItems.map(oi => oi.Item_Number));
                const missingItems = itemsToCheck.filter(itemNum => !orderItemNumbers.has(itemNum));
                if (missingItems.length > 0) {
                    throw new AppError(`Products not found in order: Item Numbers ${missingItems.join(', ')}`, 404);
                }
            }
        }

        // Validate that all original items (that have substitutes) are in the order
        if (originalItemNumbers.size > 0) {
            for (const originalItem of originalItemNumbers) {
                const originalInOrder = await OrderDetail.findOne({
                    where: {
                        Order_Number: orderNumber,
                        Item_Number: originalItem
                    }
                });
                if (!originalInOrder) {
                    const substituteItem = originalToSubstituteMap.get(originalItem);
                    throw new AppError(`Original item ${originalItem} (substitute: ${substituteItem}) not found in order`, 404);
                }
            }
        }

        // Step 3: Group products by (orderNumber, itemNumber, boxId) to handle duplicates
        // For substitutes: use the substitute item number (not the original scanned item)
        const scanMap = new Map<string, { itemNumber: number; qty: number; isSubsitute: boolean }>();
        // Key format: `${itemNumber}_${boxId}`

        if (products && products.length > 0) {
            for (const product of products) {
            const scannedItemNumber = upcToItemMap.get(product.UPC_Number);
            if (!scannedItemNumber) continue;
            
            // If this is a substitute, use the substitute item number from the map
            // Otherwise, use the scanned item number
            let itemNumberToUse = scannedItemNumber;
            if (product.isSubsitute) {
                const substituteItem = originalToSubstituteMap.get(scannedItemNumber);
                if (substituteItem) {
                    itemNumberToUse = substituteItem;
                } else {
                    // This shouldn't happen if validation passed, but handle it gracefully
                    throw new AppError(`No substitute found for original item ${scannedItemNumber}`, 404);
                }
            }
            
            const key = `${itemNumberToUse}_${product.boxId}`;
            
            if (scanMap.has(key)) {
                const existing = scanMap.get(key)!;
                existing.qty += Number(product.qty);
            } else {
                scanMap.set(key, {
                    itemNumber: itemNumberToUse,
                    qty: Number(product.qty),
                    isSubsitute: product.isSubsitute || false
                });
            }
        }

        // Step 4: Process all scans - check existing and create/update (only if we have products)
        const existingScans = scanMap.size > 0 ? await OrderPickScan.findAll({
            where: {
                orderNumber,
                [Op.or]: Array.from(scanMap.entries()).map(([key, value]) => ({
                    itemNumber: value.itemNumber,
                    boxId: Number(key.split('_')[1])
                }))
            }
        }) : [];

        const existingScanMap = new Map<string, OrderPickScan>();
        for (const scan of existingScans) {
            const key = `${scan.itemNumber}_${scan.boxId}`;
            existingScanMap.set(key, scan);
        }

        const scansToCreate: Array<{ orderNumber: number; itemNumber: number; qty: number; boxId: number; isSubsitute: boolean }> = [];
        const scansToUpdate: Array<{ scan: OrderPickScan; qty: number }> = [];
        const itemQtyMap = new Map<number, number>(); // Track total qty per item for OrderDetail update

        for (const [key, scanData] of scanMap.entries()) {
            const boxId = Number(key.split('_')[1]);
            const existingScan = existingScanMap.get(key);

            if (existingScan) {
                // Update existing scan
                scansToUpdate.push({
                    scan: existingScan,
                    qty: scanData.qty
                });
            } else {
                // Create new scan
                scansToCreate.push({
                    orderNumber: Number(orderNumber),
                    itemNumber: scanData.itemNumber,
                    qty: scanData.qty,
                    boxId: boxId,
                    isSubsitute: scanData.isSubsitute
                });
            }

            // Accumulate qty per item
            const currentQty = itemQtyMap.get(scanData.itemNumber) || 0;
            itemQtyMap.set(scanData.itemNumber, currentQty + scanData.qty);
        }

        // Step 5: Handle PassScanItem for substitute items and passed items (before processing scans)
        const passScanItemsToCreate: Array<{ orderNumber: number; itemNumber: number; userId: number; note?: string | null }> = [];
        const originalItemsToReset = new Set<number>();
        const passedItemsToReset = new Set<number>();

        // Create reverse map: substitute -> original (for looking up original from substitute)
        const substituteToOriginalMap = new Map<number, number>();
        for (const [original, substitute] of originalToSubstituteMap.entries()) {
            substituteToOriginalMap.set(substitute, original);
        }

        // Collect all original item numbers that need PassScanItem (from substitutes)
        // scanData.itemNumber is now the substitute item, so we need to find the original
        for (const [key, scanData] of scanMap.entries()) {
            if (scanData.isSubsitute) {
                const originalItemNumber = substituteToOriginalMap.get(scanData.itemNumber);
                if (originalItemNumber) {
                    originalItemsToReset.add(originalItemNumber);
                }
            }
        }

        // Collect items to be passed (skipped) with their notes
        const passItemsMap = new Map<number, string | null>(); // Map<itemNumber, note>
        for (const passItem of passItems) {
            passedItemsToReset.add(passItem.itemNumber);
            passItemsMap.set(passItem.itemNumber, passItem.note || null);
        }

        // Combine all items that need PassScanItem (substitutes + passed items)
        const allItemsForPassScan = new Set([...originalItemsToReset, ...passedItemsToReset]);

        // Fetch existing PassScanItems in one query
        const existingPassScanItems = allItemsForPassScan.size > 0 
            ? await PassScanItem.findAll({
                where: {
                    orderNumber,
                    itemNumber: { [Op.in]: Array.from(allItemsForPassScan) },
                    userId
                }
            })
            : [];

        const existingPassScanMap = new Map(existingPassScanItems.map(psi => [psi.itemNumber, psi]));

        // Create PassScanItem entries for original items (substitutes) that don't have one yet
        for (const originalItemNumber of originalItemsToReset) {
            if (!existingPassScanMap.has(originalItemNumber)) {
                passScanItemsToCreate.push({
                    orderNumber: Number(orderNumber),
                    itemNumber: originalItemNumber,
                    userId: Number(userId),
                    note: null // No note for substitute items (auto-created)
                });
            }
        }

        // Validate passed items exist in the order
        if (passedItemsToReset.size > 0) {
            const passedItemsInOrder = await OrderDetail.findAll({
                where: {
                    Order_Number: orderNumber,
                    Item_Number: { [Op.in]: Array.from(passedItemsToReset) }
                }
            });
            const passedItemsInOrderSet = new Set(passedItemsInOrder.map(oi => oi.Item_Number));
            const invalidPassedItems = Array.from(passedItemsToReset).filter(
                itemNum => !passedItemsInOrderSet.has(itemNum)
            );
            if (invalidPassedItems.length > 0) {
                throw new AppError(`Passed items not found in order: Item Numbers ${invalidPassedItems.join(', ')}`, 404);
            }
        }

        // Create PassScanItem entries for passed items (with manager notes if provided)
        const passScanItemsToUpdate: Array<{ passScanItem: PassScanItem; note: string }> = [];
        for (const passedItemNumber of passedItemsToReset) {
            const existingPassScan = existingPassScanMap.get(passedItemNumber);
            const note = passItemsMap.get(passedItemNumber) || null;
            
            if (existingPassScan) {
                // Update existing PassScanItem with manager note if provided
                if (note && !existingPassScan.note) {
                    passScanItemsToUpdate.push({ passScanItem: existingPassScan, note });
                }
            } else {
                // Create new PassScanItem with note
                passScanItemsToCreate.push({
                    orderNumber: Number(orderNumber),
                    itemNumber: passedItemNumber,
                    userId: Number(userId),
                    note: note
                });
            }
        }

        // Step 6: Create OrderDetail records for substitute items (like addSubsituteProduct does)
        const substituteOrderDetailsToCreate: any[] = [];
        const substituteOrderDetailsToUpdate: Array<{ orderDetail: OrderDetail; data: any }> = [];
        const substituteItemQtyMap = new Map<number, number>(); // Map<substituteItemNumber, totalQty>
        
        // Collect substitute items and their quantities
        for (const [key, scanData] of scanMap.entries()) {
            if (scanData.isSubsitute) {
                const currentQty = substituteItemQtyMap.get(scanData.itemNumber) || 0;
                substituteItemQtyMap.set(scanData.itemNumber, currentQty + scanData.qty);
            }
        }
        
        // Get Inventory details for all substitute items
        if (substituteItemQtyMap.size > 0) {
            const substituteItemNumbers = Array.from(substituteItemQtyMap.keys());
            const substituteProducts = await Inventory.findAll({
                where: {
                    Item_Number: { [Op.in]: substituteItemNumbers }
                }
            });
            
            const productMap = new Map(substituteProducts.map(p => [p.Item_Number, p]));
            
            // Get OptionDefsValues for STAMP_Qty
            const optionDefsValues = await OptionDefsValues.findOne({
                where: { ID_Number: 4003 }
            });
            
            // Get original order details to get line numbers and pricing
            const originalOrderDetails = await OrderDetail.findAll({
                where: {
                    Order_Number: orderNumber,
                    Item_Number: { [Op.in]: Array.from(originalItemsToReset) }
                }
            });
            
            const originalDetailMap = new Map(originalOrderDetails.map(od => [od.Item_Number, od]));
            
            // Check if substitute items already have OrderDetail records
            const existingSubstituteOrderDetails = await OrderDetail.findAll({
                where: {
                    Order_Number: orderNumber,
                    Item_Number: { [Op.in]: substituteItemNumbers }
                }
            });
            
            const existingSubstituteDetailMap = new Map(existingSubstituteOrderDetails.map(od => [od.Item_Number, od]));
            
            // Get max Line_Number for this order to assign new line numbers if needed
            // Use raw SQL query to avoid GROUP BY issues with aggregate functions
            const [maxLineNumberResult] = await sequelize.query(
                `SELECT MAX(Line_Number) AS maxLine FROM Order_Detail WHERE Order_Number = :orderNumber`,
                {
                    replacements: { orderNumber },
                    type: QueryTypes.SELECT
                }
            ) as any[];
            const maxLineNumber = maxLineNumberResult?.maxLine || 0;
            let nextLineNumber = maxLineNumber + 1;
            
            // Create or update OrderDetail records for each substitute item
            for (const [substituteItemNumber, totalQty] of substituteItemQtyMap.entries()) {
                const product = productMap.get(substituteItemNumber);
                if (!product) {
                    throw new AppError(`Substitute product ${substituteItemNumber} not found in Inventory`, 404);
                }
                
                // Find the original item this substitute replaces
                const originalItemNumber = substituteToOriginalMap.get(substituteItemNumber);
                if (!originalItemNumber) {
                    throw new AppError(`Original item not found for substitute ${substituteItemNumber}`, 404);
                }
                
                // Get original order detail for pricing reference
                const originalDetail = originalDetailMap.get(originalItemNumber);
                if (!originalDetail) {
                    throw new AppError(`Original item ${originalItemNumber} not found in order details`, 404);
                }
                
                // Get pricing - use original price or calculate from product
                const price = originalDetail.Price || product.Price1 || 0;
                const taxRate = originalDetail.OTP_Amount_State || 0;
                
                // Check if OrderDetail already exists for this substitute item
                const existingSubstituteDetail = existingSubstituteDetailMap.get(substituteItemNumber);
                
                const orderDetailData = {
                    Sales_Category: product.Sales_Category,
                    OTP_Number: product.OTP_Number,
                    Quantity_Ordered: Number(totalQty),
                    Quantity_Shipped: Number(totalQty),
                    Pack: product.Pack,
                    UOM: product.UOM,
                    Price: Number(price),
                    Price_Reference: Number(price),
                    Retail: product.Retail1,
                    NetCost: product.NetCost,
                    BaseCost: product.BaseCost,
                    Invoice_Cost: product.Invoice_Cost,
                    AvgCost: product.AvgCost,
                    OTP_Amount_State: Number(taxRate ?? 0),
                    OTP_Amount_County: 0,
                    OTP_Amount_City: 0,
                    Item_Message: null,
                    DepositAmount: product.DepositAmount,
                    Price_Subclass: product.Price_Subclass,
                    OffInvoice_Amount: 0,
                    OffInvoice_OffCost: 0,
                    OffInvoice_Special: false,
                    EBT: product.EBT,
                    Points: product.Points,
                    STAMP_Qty: optionDefsValues?.Option_Value || 0,
                    ItemDescription: product.Description,
                    CaseWeight: product.CaseWeight,
                    CaseCount: product.CaseCount,
                };
                
                if (existingSubstituteDetail) {
                    // Update existing OrderDetail record
                    substituteOrderDetailsToUpdate.push({
                        orderDetail: existingSubstituteDetail,
                        data: orderDetailData
                    });
                } else {
                    // Create new OrderDetail record with next available Line_Number
                    const orderDetail = {
                        Order_Number: orderNumber,
                        Item_Number: substituteItemNumber,
                        Line_Number: nextLineNumber++,
                        ...orderDetailData
                    };
                    
                    const finalObject = {
                        ...getDefaultOrderDetailValues(),
                        ...orderDetail
                    };
                    
                    substituteOrderDetailsToCreate.push(finalObject);
                }
            }
        }
        
        // Step 7: Execute all updates in parallel
        const substituteItemNumbersSet = new Set(Array.from(substituteToOriginalMap.keys()));
        
        // Disable triggers before creating OrderDetail records for substitutes
        if (substituteOrderDetailsToCreate.length > 0) {
            await sequelize.query('DISABLE TRIGGER ALL ON Order_Detail');
        }
        
        try {
            await Promise.all([
            // Create PassScanItem entries for substitute original items and passed items
            passScanItemsToCreate.length > 0 ? PassScanItem.bulkCreate(passScanItemsToCreate) : Promise.resolve(),
            // Update existing PassScanItem entries with manager notes
            ...passScanItemsToUpdate.map(({ passScanItem, note }) =>
                passScanItem.update({ note })
            ),
            // Reset Quantity_Shipped to 0 for original items that have substitutes
            ...Array.from(originalItemsToReset).map(originalItemNumber =>
                OrderDetail.update(
                    {
                        Quantity_Shipped: 0
                    },
                    {
                        where: {
                            Order_Number: orderNumber,
                            Item_Number: originalItemNumber
                        }
                    }
                )
            ),
            // Reset Quantity_Shipped to 0 for passed items (manager override)
            ...Array.from(passedItemsToReset).map(passedItemNumber =>
                OrderDetail.update(
                    {
                        Quantity_Shipped: 0
                    },
                    {
                        where: {
                            Order_Number: orderNumber,
                            Item_Number: passedItemNumber
                        }
                    }
                )
            ),
            // Create new scans
            scansToCreate.length > 0 ? OrderPickScan.bulkCreate(scansToCreate) : Promise.resolve(),
            // Update existing scans
            ...scansToUpdate.map(({ scan, qty }) => 
                scan.update({ qty: literal(`"qty" + ${qty}`) })
            ),
            // Create OrderDetail records for substitute items
            substituteOrderDetailsToCreate.length > 0 
                ? OrderDetail.bulkCreate(substituteOrderDetailsToCreate, { returning: false })
                : Promise.resolve(),
            // Update existing OrderDetail records for substitute items
            ...substituteOrderDetailsToUpdate.map(({ orderDetail, data }) =>
                orderDetail.update(data)
            ),
            // Update OrderDetail for each item (skip substitute items - they already have OrderDetail records created above)
            ...Array.from(itemQtyMap.entries())
                .filter(([itemNumber]) => !substituteItemNumbersSet.has(itemNumber))
                .map(([itemNumber, qty]) =>
                    OrderDetail.update(
                        {
                            Quantity_Shipped: literal(`"Quantity_Shipped" + ${qty}`)
                        },
                        {
                            where: {
                                Order_Number: orderNumber,
                                Item_Number: itemNumber
                            }
                        }
                    )
                ),
            // Update OrderPick
            OrderPick.update(
                {
                    scannedLines: literal(`"scannedLines" + ${scansToCreate.length + substituteOrderDetailsToCreate.length}`),
                    scannedQty: literal(`"scannedQty" + ${Array.from(itemQtyMap.values()).reduce((sum, qty) => sum + qty, 0)}`)
                },
                {
                    where: {
                        orderNumber: orderNumber
                    }
                }
            )
        ]);
        } finally {
            // Re-enable triggers after creating OrderDetail records for substitutes
            if (substituteOrderDetailsToCreate.length > 0) {
                await sequelize.query('ENABLE TRIGGER ALL ON Order_Detail');
            }
        }

        // Step 8: Check if order is complete
        const remainingItems = await OrderDetail.findAll({
            where: {
                Order_Number: orderNumber,
                [Op.and]: [
                    { Quantity_Ordered: { [Op.gt]: sequelize.col("Quantity_Shipped") } }
                ]
            },
            attributes: ['Item_Number']
        });

        const isComplete = remainingItems.length === 0;

        return {
            success: true,
            processedCount: products.length,
            isComplete
        };
    }
  }
  async addImagesNotes(req: Request, id: number) {
    let pushImage: string[] = [];

    if (req.files && (req.files as any).length > 0) {
      // Upload all files in parallel
      const uploadResults = await Promise.all(
        (req.files as any).map((file: any) =>
          uploadFileToAzure(file.buffer, file.originalname, file.mimetype, "epick")
        )
      );


      // Collect only successful uploads
      pushImage = uploadResults
        .filter(result => result.success)
        .map(result => result.url || "");
    }


    // ✅ Now update after uploads are done
    await OrderPickBox.update(
      {
        images: pushImage,
        notes: req.body.notes || " ",
      },
      {
        where: { id },
      }
    );
  }


  async OrderCompleted(id: number) {
    const data = await OrderPick.findOne({
      where: {
        orderNumber: id
      }
    })
    if (!data) {
      throw new AppError("Order not found", 404);
    }
    
    // Get picker user ID from OrderPick
    const pickerUserId = data.pickerUserNumber;
    
    // Find the user in WebUsers table to get userNumber
    const pickerUser = await WebUsers.findOne({
      where: {
        id: pickerUserId
      },
      attributes: ['userNumber']
    });

    if (!pickerUser) {
      throw new AppError("Picker user not found", 404);
    }

    // Get userNumber from WebUsers (convert string to number for Picker_ID)
    const pickerUserNumber = pickerUser.userNumber 
    
    if (!pickerUserNumber) {
      throw new AppError("Picker user number not found", 404);
    }
    
    // Count bundles (box + drink) and totes from OrderPickBox
    const orderBoxes = await OrderPickBox.findAll({
      where: {
        orderNumber: id
      },
      attributes: ['type']
    });

    // Count bundles = number of (box + drink)
    const bundlesCount = orderBoxes.filter(
      (box: any) => box.type === 'box' || box.type === 'drink'
    ).length;

    // Count totes = number of (tote)
    const totesCount = orderBoxes.filter(
      (box: any) => box.type === 'tote'
    ).length;

    // Update OrderPick status
    await data.update({
      status: 'completed',
      completedAt: moment().toDate()
    })

    // Update Order_Header with Picker_ID, Bundles, and Totes
    await OrderHeader.update(
      {
        Picker_ID: pickerUserNumber,
        Bundles: bundlesCount,
        Totes: totesCount
      },
      {
        where: {
          Order_Number: id
        }
      }
    );

    // Update all Order_Detail.Confirmed to 1 (true)
    await OrderDetail.update(
      {
        Confirmed: true
      },
      {
        where: {
          Order_Number: id
        }
      }
    );

    // Destroy lock record when order is completed
    await RecordLock.destroy({
      where: {
        Lock_Number: id
      }
    });

    console.log(data, 'data--->');
    console.log(`Bundles: ${bundlesCount}, Totes: ${totesCount}`);

    return data;
  }

  async getUserHistory(id: number) {
    const data = await OrderPick.findAll({
      where: {
        pickerUserNumber: id,
        status: 'completed'
      },
      include: [
        {
          model: OrderPickBox,
          as: 'boxes'
        },
        {
          model: OrderPickScan,
          as: 'scans'
        }

      ]
    })
    return data;
  }

  async getOrderDetailByOrderNumber(orderNumber: number) {

    const orderSummarny = await OrderPick.findOne({
      where: {
        orderNumber: orderNumber,

      },
      attributes: ['orderNumber', 'totalLines', 'scannedLines', 'OutOfStockItem', 'status']
    })
    return orderSummarny;

  }



  async getUserCurrentOrder(id: number) {
    const data = await OrderPick.findOne({
      where: {
        pickerUserNumber: id,
        status: 'in_progress'
      }
    })
    
    // If order exists but not in Record_Locks, return null (order was deleted from locks)
    if (data) {
      const lockExists = await RecordLock.findOne({
        where: {
          Lock_Number: data.orderNumber
        }
      });
      
      // If order exists in PG but not in Record_Locks, return null
      if (!lockExists) {
        return null;
      }
    }
    
    return data;
  }

  async getItemAsPerBox(boxId: number) {
    const data = await OrderPickScan.findAll({
      where: { boxId },
      attributes: ['orderNumber', 'itemNumber', 'qty', 'isSubsitute']
    });

    if (!data || data.length === 0) {
      return [];
    }

    const finalData = await Promise.all(
      data.map(async (e: any) => {
        const scanItem = e.dataValues;

        // Distributor image
        const productImage = await ProductImage.findOne({
          where: {
            product_number: scanItem.itemNumber.toString(),
            isAllow: true
          },
          attributes: ['img_url', 'isAllow']
        });

        // Inventory on hand
        const inventoryOnHand = await getInventoryOnHand(scanItem.itemNumber);

        // Inventory details
        const inventory = await Inventory.findOne({
          where: { Item_Number: scanItem.itemNumber },
          attributes: [
            'Item_Number',
            'Description',
            'Location',
            'Section',
            'Pack',
            'CaseCount',
            'UOM'
          ],
          include: [
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              required: false
            }
          ]
        });

        // Convert Sequelize instance → plain object
        const inventoryPlain = inventory ? inventory.get({ plain: true }) : null;

        // Build master image if UPC exists
        const masterImage = inventoryPlain?.UPCList?.[0]?.UPC_Number
          ? `${process.env.AZUREIMAGESERVER}${inventoryPlain.UPCList[0].UPC_Number}.jpg`
          : null;

        return {
          ...scanItem,
          ...inventoryPlain,
          inventoryOnHand,
          masterImage,
          isDistributorImageShow: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url ?? null
        };
      })
    );

    return finalData;
  }

  async getOrderSummary(orderNumber: number) {
    const data = await OrderPick.findOne({
      where: { orderNumber },
      include: [
        {
          model: OrderPickBox,
          as: "boxes",
          attributes: {
            include: [
              [fn("COUNT", col("boxes->scans.id")), "scanCount"]
            ]
          },
          include: [
            {
              model: OrderPickScan,
              as: "scans",
              attributes: [] // don’t return scan details, just count
            }
          ]
        }
      ],
      group: ["OrderPick.id", "boxes.id"] // required for aggregate
    });

    return data;
  }


  async getReportDate(id: number, query: PaginationOptions) {

    let { page, limit } = query;
    page = Number(query.page || (query as any)['page ']) || 1;
    limit = Number(query.limit || (query as any)['limit ']) || 10;
    const offset = (page - 1) * limit;


    const { rows: data, count: totalCount } = await OrderPick.findAndCountAll({
      where: {
        pickerUserNumber: id,
        status: 'completed'
      },
      attributes: ['orderNumber', 'customerNumber'],
      limit,
      offset
    })

    const finalData = await Promise.all(data.map(async (e: any) => {
      const customer = await Customer.findOne({
        where: { C_Number: e.customerNumber },
        attributes: ['C_Number', 'C_Name'],
        include: [
          {
            model: CustomerRoute,
            as: 'Routes',
            attributes: ['Route_Number', 'Stop_Number']
          }
        ]
      })
      return {
        ...e.dataValues,
        customer: customer
      }
    }))
    return {
      data: finalData,
      totalCount: totalCount,
      page: page,
      limit: limit
    };

  }


  async getReportById(id: number) {
    const data = await OrderPick.findAll({
      where: {
        orderNumber: id
      }
    })

    const finalData = await Promise.all(data?.map(async (e: any) => {

      const product = await OrderDetail.findAll({
        where: {
          Order_Number: e.orderNumber
        },
        include: [
          {
            model: Inventory,
            as: 'inventory',
            attributes: ['Item_Number', 'Description', 'Item_Number'],
            include: [
              {
                model: InventoryUPC,
                as: 'UPCList',
                attributes: ['UPC_Number'],
                required: false
              }
            ]
          },

        ]
      })

      // Calculate total quantity shipped from OrderDetail
      const totalQtyShipped = product.reduce((sum: number, item: any) => {
        return sum + (Number(item.Quantity_Shipped) || 0);
      }, 0);

      return {
        ...e.dataValues,
        totalQtyShipped: totalQtyShipped, // Add total quantity shipped
        ...product
      }
    })) as any
    return finalData;
  }

  /**
   * Get epick user report with date range filter
   * Returns all completed orders for a user within date range with override request details, order items, and picking times
   * 
   * @param userId - User ID to filter by (optional, if not provided returns all users)
   * @param fromDate - Start date (ISO string or Date)
   * @param toDate - End date (ISO string or Date)
   */
  async getUserReportWithDateRange(
    userId: number | null,
    fromDate: string | Date | null,
    toDate: string | Date | null
  ) {
    // Build where condition
    const whereCondition: any = {
      status: 'completed'
    };

    // Filter by user if provided
    if (userId) {
      whereCondition.pickerUserNumber = userId;
    }

    // Filter by date range if provided
    if (fromDate || toDate) {
      whereCondition.completedAt = {};
      if (fromDate) {
        const startDate = moment(fromDate).startOf('day').toDate();
        whereCondition.completedAt[Op.gte] = startDate;
      }
      if (toDate) {
        const endDate = moment(toDate).endOf('day').toDate();
        whereCondition.completedAt[Op.lte] = endDate;
      }
    }

    // Get all completed orders (no pagination)
    const orders = await OrderPick.findAll({
      where: whereCondition,
      attributes: [
        'id',
        'orderNumber',
        'customerNumber',
        'pickerUserNumber',
        'status',
        'startedAt',
        'completedAt',
        'totalLines',
        'totalQty',
        'scannedLines',
        'scannedQty',
        'OutOfStockItem',
        'notes'
      ],
      order: [['completedAt', 'DESC']]
    });

    // Get all order numbers
    const orderNumbers = orders.map((o: any) => o.orderNumber);

    // Get all override requests with full details
    const overrideRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers }
      },
      attributes: [
        'id',
        'orderNumber',
        'itemNumber',
        'pickerUserNumber',
        'status',
        'note',
        'requestType',
        'qty',
        'rejectionReason',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group override requests by order number
    const overrideRequestsMap: { [key: number]: any[] } = {};
    const overrideCountMap: { [key: number]: number } = {};
    overrideRequests.forEach((req: any) => {
      const orderNum = req.orderNumber;
      if (!overrideRequestsMap[orderNum]) {
        overrideRequestsMap[orderNum] = [];
        overrideCountMap[orderNum] = 0;
      }
      overrideRequestsMap[orderNum].push(req.get({ plain: true }));
      overrideCountMap[orderNum]++;
    });

    // Get all order items for all orders
    const allOrderItems = await OrderDetail.findAll({
      where: {
        Order_Number: { [Op.in]: orderNumbers }
      },
      attributes: [
        'Order_Number',
        'Line_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Pack',
        'CaseCount',
        'Confirmed'
      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Item_Number', 'Description', 'Section', 'Location'],
          required: false,
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc', 'Sales_Category'],
              required: false
            }
          ]
        }
      ],
      order: [['Order_Number', 'ASC'], ['Line_Number', 'ASC']]
    });

    // Group order items by order number
    const orderItemsMap: { [key: number]: any[] } = {};
    allOrderItems.forEach((item: any) => {
      const orderNum = item.Order_Number;
      if (!orderItemsMap[orderNum]) {
        orderItemsMap[orderNum] = [];
      }
      orderItemsMap[orderNum].push(item.get({ plain: true }));
    });

    // Get unique user IDs and customer numbers
    const userIds = Array.from(new Set(orders.map((o: any) => o.pickerUserNumber).filter((id: any) => id)));
    const customerNumbers = Array.from(new Set(orders.map((o: any) => o.customerNumber).filter((num: any) => num)));

    // Fetch user information
    const users = await WebUsers.findAll({
      where: {
        id: { [Op.in]: userIds }
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
      raw: true
    });

    const userMap: any = {};
    users.forEach((user: any) => {
      userMap[user.id] = user;
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
      customerMap[customer.C_Number] = customer.get({ plain: true });
    });

    // Get distributor information
    const distributor = await Distributor.findOne({
      attributes: ['D_Name', 'D_Addr1', 'D_Addr2', 'D_City', 'D_State', 'D_Zip', 'D_Phone', 'D_Email'],
    });

    // Get warehouse logo
    const getProfileImage: any = await Setting.findOne({});

    // Calculate picking times and totals
    let totalPickingTimeSeconds = 0;
    const orderPickingTimes: { [key: number]: number } = {};

    // Build final response with picking time calculations, override requests, and order items
    const finalData = orders.map((order: any) => {
      const orderData = order.get({ plain: true });
      
      // Calculate picking time for this order in seconds
      let pickingTimeSeconds = 0;
      if (orderData.startedAt && orderData.completedAt) {
        const startTime = moment(orderData.startedAt);
        const endTime = moment(orderData.completedAt);
        pickingTimeSeconds = endTime.diff(startTime, 'seconds');
        orderPickingTimes[orderData.orderNumber] = pickingTimeSeconds;
        totalPickingTimeSeconds += pickingTimeSeconds;
      }

      // Format picking time as HH:MM:SS
      const hours = Math.floor(pickingTimeSeconds / 3600);
      const minutes = Math.floor((pickingTimeSeconds % 3600) / 60);
      const seconds = pickingTimeSeconds % 60;
      const pickingTimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      return {
        ...orderData,
        picker: userMap[orderData.pickerUserNumber] || null,
        customer: customerMap[orderData.customerNumber] || null,
        overrideRequestCount: overrideCountMap[orderData.orderNumber] || 0,
        overrideRequests: overrideRequestsMap[orderData.orderNumber] || [],
        orderItems: orderItemsMap[orderData.orderNumber] || [],
        pickingTimeSeconds: pickingTimeSeconds,
        pickingTimeFormatted: pickingTimeFormatted
      };
    });

    // Format total picking time
    const totalHours = Math.floor(totalPickingTimeSeconds / 3600);
    const totalMinutes = Math.floor((totalPickingTimeSeconds % 3600) / 60);
    const totalSeconds = totalPickingTimeSeconds % 60;
    const totalPickingTimeFormatted = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`;

    return {
      data: finalData,
      totalCount: finalData.length,
      summary: {
        totalOrders: finalData.length,
        totalPickingTimeSeconds: totalPickingTimeSeconds,
        totalPickingTimeFormatted: totalPickingTimeFormatted,
        averagePickingTimeSeconds: finalData.length > 0 ? Math.round(totalPickingTimeSeconds / finalData.length) : 0
      },
      distributor: distributor ? distributor.get({ plain: true }) : null,
      logo: getProfileImage?.dataValues ? getProfileImage.dataValues.warehouseImage : null
    };
  }

  /**
   * Get order details by order number
   * Returns complete order details with override requests, order items, and picking time
   * 
   * @param orderNumber - Order number to get details for
   */
  async getOrderDetailsByOrderNumber(orderNumber: number) {
    // Validate order exists and is completed
    const order = await OrderPick.findOne({
      where: {
        orderNumber: orderNumber,
        status: 'completed'
      },
      attributes: [
        'id',
        'orderNumber',
        'customerNumber',
        'pickerUserNumber',
        'status',
        'startedAt',
        'completedAt',
        'totalLines',
        'totalQty',
        'scannedLines',
        'scannedQty',
        'OutOfStockItem',
        'notes'
      ]
    });

    if (!order) {
      throw new AppError('Order not found or not completed', 404);
    }

    const orderData = order.get({ plain: true });

    // Get all override requests for this order
    const overrideRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: orderNumber
      },
      attributes: [
        'id',
        'orderNumber',
        'itemNumber',
        'pickerUserNumber',
        'status',
        'note',
        'rejectionReason',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get all order items for this order
    const allOrderItems = await OrderDetail.findAll({
      where: {
        Order_Number: orderNumber
      },
      attributes: [
        'Order_Number',
        'Line_Number',
        'Item_Number',
        'Quantity_Ordered',
        'Quantity_Shipped',
        'Pack',
        'CaseCount',
        'Confirmed'
      ],
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['Item_Number', 'Description', 'Section', 'Location'],
          required: false,
          include: [
            {
              model: SalesCategory,
              as: 'SalesCategory',
              attributes: ['Category_Desc', 'Sales_Category'],
              required: false
            }
          ]
        }
      ],
      order: [['Line_Number', 'ASC']]
    });

    // Get picker user information
    const picker = await WebUsers.findOne({
      where: {
        id: orderData.pickerUserNumber
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
      raw: true
    });

    // Get customer information
    const customer = await Customer.findOne({
      where: {
        C_Number: orderData.customerNumber
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

    // Calculate picking time for this order in seconds
    let pickingTimeSeconds = 0;
    if (orderData.startedAt && orderData.completedAt) {
      const startTime = moment(orderData.startedAt);
      const endTime = moment(orderData.completedAt);
      pickingTimeSeconds = endTime.diff(startTime, 'seconds');
    }

    // Format picking time as HH:MM:SS
    const hours = Math.floor(pickingTimeSeconds / 3600);
    const minutes = Math.floor((pickingTimeSeconds % 3600) / 60);
    const seconds = pickingTimeSeconds % 60;
    const pickingTimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Format order items
    const orderItems = allOrderItems.map((item: any) => item.get({ plain: true }));

    // Format override requests
    const formattedOverrideRequests = overrideRequests.map((req: any) => req.get({ plain: true }));

    // Get distributor information
    const distributor = await Distributor.findOne({
      attributes: ['D_Name', 'D_Addr1', 'D_Addr2', 'D_City', 'D_State', 'D_Zip', 'D_Phone', 'D_Email'],
    });

    // Get warehouse logo
    const getProfileImage: any = await Setting.findOne({});

    return {
      ...orderData,
      picker: picker || null,
      customer: customer ? customer.get({ plain: true }) : null,
      overrideRequestCount: overrideRequests.length,
      overrideRequests: formattedOverrideRequests,
      orderItems: orderItems,
      pickingTimeSeconds: pickingTimeSeconds,
      pickingTimeFormatted: pickingTimeFormatted,
      distributor: distributor ? distributor.get({ plain: true }) : null,
      logo: getProfileImage?.dataValues ? getProfileImage.dataValues.warehouseImage : null
    };
  }

  async getSubsituteProduct(data: any) {
    const { itemNumber, customerNumber } = data;

    // 1) User jurisdiction
    const userJurisdiction = await getJurisdiction(customerNumber);

    // 2) Warehouse / retailer settings (for allowToOrder & flags)
    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    // 3) Find substitute row
    const sub = await InventorySubstitutes.findOne({
      where: { Item_Number: itemNumber },
      attributes: ['Item_Number_Substitute', 'Item_Number', 'Substitute_Rule', 'Substitute_Text'],
      logging: false,
    });

    if (!sub) {
      throw new AppError('No substitute product found', 404);
    }

    const subItemNumber = sub.get('Item_Number_Substitute') as number;

    // 4) Build where for the final product
    const whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
      Item_Number: subItemNumber,
    };

    // 5) UPC include (for masterImage)
    const includeUPC = {
      model: InventoryUPC,
      as: 'UPCList',
      attributes: ['UPC_Number'],
      where: { Status: 0 },
      required: false,
    };

    // 6) Pull the product with joins
    const product = await Inventory.findOne({
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
          attributes: ['Category_Desc','Sales_Category'],
          required: false,
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Class_Desc'],
          required: false,
        },
        {
          model: InventoryStatus,
          as: 'inventoryStatus',
          attributes: ['Inventory_OnHand'],
          required: false,
        },
        includeUPC,
      ],
      logging: false,
    });

    if (!product) {
      throw new AppError('Substitute product is inactive or not orderable', 404);
    }

    // 7) Pricing, inventory, tax, images
    const e = product as any; // ease of access to dataValues-like props

    let price = await getDiscount(subItemNumber, customerNumber);
    if (!price) {
      price = await getFirstValidPrice(e);
    }

    const inventoryOnHand = (await getInventoryOnHand(subItemNumber)) || 0;

    let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
    taxRate = Math.ceil(taxRate * 100) / 100;

    const productImages = await ProductImage.findAll({
      where: {
        product_number: e.Item_Number.toString(),
        isAllow: true,
      },
      logging: false,
    });

    // choose the first allowed image if any
    const productImage = productImages?.[0] ?? null;

    // discount flags, product limit, qty discount
    const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
    const productLimit = await getProductLimit(e.Item_Number);

    // allowToOrder gate based on settings & stock
    let allowToOrder = true;
    if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
      allowToOrder = false;
    }

    let prepaidTaxRate = 0
    if(userJurisdiction !=null && e.salesCategory){
      prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.salesCategory?.Sales_Category);
    }

    // Optional: mark new items if you have a similar helper as in list API
    // const topLatestItems = await getTopLatestItems();
    // const isNewItem = topLatestItems.some((it: any) => it.Item_Number === e.Item_Number);
    const isNewItem = false;

    // 8) Build response mirroring list API fields
    const resp = {
      Pack: e.Pack,
      Description: e.Description,
      Item_Number: e.Item_Number,
      CaseCount: e.CaseCount,
      UOM: e.UOM,
      isDiscounted,
      Price1: e.Price1,
      Tax_Rate: taxRate,
      OTP_Number: e.OTP_Number,
      price: Math.ceil(price * 100) / 100,
      isNewItem,
      priceWithTax: Math.ceil((price + taxRate) * 100) / 100,
      BaseCost: e.BaseCost,
      Invoice_Cost: e.Invoice_Cost,
      AvgCost: e.AvgCost,
      NetCost: e.NetCost,
      hasPrepaidTaxRate: prepaidTaxRate ? true : false,
      prepaidTaxRate: prepaidTaxRate,
      hasProductLimit: !!productLimit,
      productLimit,
      UPCList: e.UPCList, // comes from includeUPC
      Inventory_OnHand: inventoryOnHand,
      UnitOunces: e.UnitOunces,
      allowToOrder,
      showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
      showLowStock: wareHouseSetting?.retailer?.showStock
        ? false
        : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
      showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
      SalesCategory: e.SalesCategory?.Category_Desc || null,
      PriceClass: e.PriceClass?.Class_Desc || null,
      showDistributorImage: productImage?.isAllow ?? false,
      distributorImage: productImage?.img_url || null,
      masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number ?? ''}.jpg`,

      // extra context about the substitution (optional to expose)
      SubstituteFrom: sub.get('Item_Number'),
      SubstituteTo: subItemNumber,
      Substitute_Rule: sub.get('Substitute_Rule') ?? null,
      Substitute_Text: sub.get('Substitute_Text') ?? null,
    };

    return resp;
  }

  async addSubsituteProduct(data: any, userId: number) {
    const { itemNumber, qty, orderNumber, lineNumber, price, taxRate, oldItemNumber } = data


    const product = await Inventory.findOne({
      where: { Item_Number: itemNumber },
    })

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const optionDefsValues = await OptionDefsValues.findOne({
      where: { ID_Number: 4003 },
    })

    const orderDetail = {
      Order_Number: orderNumber,
      Item_Number: itemNumber,
      Line_Number: lineNumber,
      Sales_Category: product.Sales_Category,
      OTP_Number: product.OTP_Number,
      Quantity_Ordered: Number(qty),
      Quantity_Shipped: Number(qty),
      Pack: product.Pack,
      UOM: product.UOM,
      Price: Number(price),
      Price_Reference: Number(price),
      Retail: product.Retail1,
      NetCost: product.NetCost,
      BaseCost: product.BaseCost,
      Invoice_Cost: product.Invoice_Cost,
      AvgCost: product.AvgCost,
      OTP_Amount_State: Number(taxRate ?? 0),
      OTP_Amount_County: 0,
      OTP_Amount_City: 0,
      Item_Message: null,
      DepositAmount: product.DepositAmount,
      Price_Subclass: product.Price_Subclass,
      OffInvoice_Amount: 0,
      OffInvoice_OffCost: 0,
      OffInvoice_Special: false,
      EBT: product.EBT,
      Points: product.Points,
      STAMP_Qty: optionDefsValues?.Option_Value || 0,
      ItemDescription: product.Description,
      CaseWeight: product.CaseWeight,
      CaseCount: product.CaseCount,
      // CasesPerPallet: product.CasesPerPallet,
    };

    let finalObject = {
      ...getDefaultOrderDetailValues(),
      ...orderDetail
    }

    try {

      await sequelize.query('DISABLE TRIGGER ALL ON Order_Detail');


      await OrderDetail.bulkCreate([finalObject], { returning: false });

      const updatedData = await OrderPick.update(
        {
          scannedQty: literal(`"scannedQty" + ${Number(qty)}`),
          scannedLines: literal(`"scannedLines" + 1`),
          totalLines: lineNumber
        },
        {
          where: {
            orderNumber: orderNumber
          }
        }
      );

      await PassScanItem.create({
        itemNumber: oldItemNumber,
        orderNumber: orderNumber,
        userId: Number(userId)
      })
      await OrderDetail.update(
        {
          Quantity_Shipped: 0,
        },
        {
          where: {
            Order_Number: orderNumber,
            Item_Number: oldItemNumber
          }
        }
      );

      return updatedData
    } catch (e: any) {



      console.error('🔥 Sequelize Error:', e?.errors || e);
      console.error('Stack Trace:', e?.stack);
      throw new AppError(`Failed to create order detail: ${e?.message}`, 500);
    } finally {
      // 🟠 Always re-enable triggers even if error occurs
      await sequelize.query('ENABLE TRIGGER ALL ON Order_Detail');
    }


  }

  async putPassScanItem(body: any) {
    const { orderNumber, itemNumber } = body

    await OrderDetail.update(
      {
        Quantity_Shipped: 0,
      },
      {
        where: {
          Order_Number: orderNumber,
          Item_Number: itemNumber
        }
      }
    );
    const passScanItem = await PassScanItem.create(body);
    return passScanItem;

  }

  async checkPin(pin: string) {

    const epickSetting = await EpickSetting.findOne({
      where: {
        pin: pin
      }
    });

    if (!epickSetting) {
      throw new AppError('Pin is incorrect', 404);
    }
    return epickSetting;

  }

  /**
   * Create a new override request
   */
  async createOverrideRequest(data: {
    orderNumber: number;
    itemNumber: number;
    qty?: number;
    note?: string;
  }, userId: number) {
    const { orderNumber, itemNumber, qty, note } = data;

    // Validate order exists and item is in order
    const orderDetail = await OrderDetail.findOne({
      where: {
        Order_Number: orderNumber,
        Item_Number: itemNumber,
      },
    });

    if (!orderDetail) {
      throw new AppError(`Item ${itemNumber} not found in order ${orderNumber}`, 404);
    }

    // Check if there's already a pending 'pass' type request for this item
    const existingRequest = await OverrideRequest.findOne({
      where: {
        orderNumber,
        itemNumber,
        pickerUserNumber: userId,
        status: 'pending',
        requestType: 'pass', // Only check for 'pass' type
      },
    });

    if (existingRequest) {
      throw new AppError('A pending pass override request already exists for this item', 400);
    }

    // Create the request (default to 'pass' type)
    // qty defaults to 0 if not provided (for backward compatibility)
    const overrideRequest = await OverrideRequest.create({
      orderNumber,
      itemNumber,
      pickerUserNumber: userId,
      status: 'pending',
      requestType: 'pass',
      qty: qty !== undefined && qty !== null ? qty : 0,
      note: note || null, 
    });

    // Send notification to all distributors
    await this.sendNotificationToDistributors(overrideRequest);

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      note: overrideRequest.note,
      createdAt: overrideRequest.createdAt,
    };
  }

  /**
   * Create a new scan override request (with quantity)
   */
  async createScanOverrideRequest(data: {
    orderNumber: number;
    itemNumber: number;
    qty: number;
    note?: string;
  }, userId: number) {
    const { orderNumber, itemNumber, qty, note } = data;

    // Validate qty is positive
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    // Validate order exists and item is in order
    const orderDetail = await OrderDetail.findOne({
      where: {
        Order_Number: orderNumber,
        Item_Number: itemNumber,
      },
    });

    if (!orderDetail) {
      throw new AppError(`Item ${itemNumber} not found in order ${orderNumber}`, 404);
    }

    // Check if there's already a pending 'scan' type request for this item
    const existingRequest = await OverrideRequest.findOne({
      where: {
        orderNumber,
        itemNumber,
        pickerUserNumber: userId,
        status: 'pending',
        requestType: 'scan', // Only check for 'scan' type
      },
    });

    if (existingRequest) {
      throw new AppError('A pending scan override request already exists for this item', 400);
    }

    // Create the scan request
    const overrideRequest = await OverrideRequest.create({
      orderNumber,
      itemNumber,
      pickerUserNumber: userId,
      status: 'pending',
      requestType: 'scan',
      qty: qty,
      note: note || null, 
    });

    // Send notification to all distributors
    await this.sendNotificationToDistributors(overrideRequest);

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      note: overrideRequest.note,
      createdAt: overrideRequest.createdAt,
    };
  }

  /**
   * Check override request status (for polling)
   */
  async checkOverrideRequest(requestId: number, userId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        pickerUserNumber: userId, // Ensure user can only check their own requests
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Override request not found', 404);
    }

    // Get item description
    const inventory = await Inventory.findOne({
      where: { Item_Number: overrideRequest.itemNumber },
      attributes: ['Description'],
    });

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      itemDescription: inventory?.Description || null,
      note: overrideRequest.note,
      rejectionReason: overrideRequest.rejectionReason,
      createdAt: overrideRequest.createdAt,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Check scan override request status (for polling) - Specific endpoint for scan type
   */
  async checkScanOverrideRequest(requestId: number, userId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        pickerUserNumber: userId, // Ensure user can only check their own requests
        requestType: 'scan', // Only check scan type requests
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Scan override request not found', 404);
    }

    // Get item description
    const inventory = await Inventory.findOne({
      where: { Item_Number: overrideRequest.itemNumber },
      attributes: ['Description'],
    });

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      itemDescription: inventory?.Description || null,
      note: overrideRequest.note,
      rejectionReason: overrideRequest.rejectionReason,
      createdAt: overrideRequest.createdAt,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Cancel override request (Epick user)
   */
  async cancelOverrideRequest(requestId: number, userId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        pickerUserNumber: userId, // Ensure user can only cancel their own requests
      },
    });

    if (!overrideRequest) {
      throw new AppError('Override request not found', 404);
    }

    // Only allow cancellation if status is pending
    if (overrideRequest.status !== 'pending') {
      throw new AppError(`Cannot cancel request with status: ${overrideRequest.status}. Only pending requests can be cancelled.`, 400);
    }

    // Update status to cancelled
    overrideRequest.status = 'cancelled';
    await overrideRequest.save();

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Get all pending override requests (for distributor)
   */
  async getPendingOverrideRequests() {
    const pendingRequests = await OverrideRequest.findAll({
      where: {
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get item descriptions for all requests
    const itemNumbers = pendingRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    return pendingRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        requestType: req.requestType, // 'pass' or 'scan'
        qty: req.qty,                 // 0 for pass, actual qty for scan
        note: req.note,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
  }

  /**
   * Get list of all complete orders ready for checker
   * - Only returns orders that are completed by epick but NOT completed by checker
   * - Returns order information (no details)
   * - Includes override request counts
   */
  async getCompleteOrder() {
    // Get all completed orders from OrderPick (epick completed)
    const completedOrders = await OrderPick.findAll({
      where: {
        status: 'completed' // Only get completed orders (already picked by epick)
      },
      attributes: ['orderNumber', 'startedAt', 'completedAt'],
      raw: false,
    });

    // Get unique order numbers
    const completedOrderNumbers = Array.from(
      new Set(
        completedOrders
          .map((o: any) => o?.orderNumber)
          .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '')
          .map((v: any) => Number(v))
      )
    );

    if (completedOrderNumbers.length === 0) {
      return [];
    }

    // Query OrderHeader for completed orders with same conditions as checker
    const headerWhere: any = {
      // Exclude orders where Order_Updated = 1
      Order_Updated: { [Op.ne]: true },
      // Only get orders that are completed (already picked)
      Order_Number: { [Op.in]: completedOrderNumbers },
      // Only orders not invoiced (checker not completed)
      Invoice_Number: 0
    };

    const orderHeaders = await OrderHeader.findAll({
      where: headerWhere,
      attributes: [
        'Order_Number',
        'Order_Date',
        'C_Number',
        'Route_Number',
        'Stop_Number',
        'Invoice_Number',
        'Bundles',
        'Totes',
        'Picker_ID',
        'Confirmed',
        'Invoice_Total'
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip'],
          required: false,
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false,
            }
          ]
        }
      ],
      order: [['Order_Number', 'ASC']],
    });

    if (orderHeaders.length === 0) {
      return [];
    }

    // Get all order numbers from the completed orders list
    const orderNumbers = orderHeaders.map((order: any) => order.Order_Number);

    // Validation: Check that ALL products in OrderDetail have Confirmed = 1
    // Only include orders where every item is confirmed (same as checker)
    let validatedOrderNumbers = orderNumbers;
    if (orderNumbers.length > 0) {
      // Query to find orders where ALL items have Confirmed = 1
      // This query returns orders where total items = confirmed items
      // Only orders where every single item has Confirmed = 1 will pass this validation
      const confirmedOrdersQuery = await sequelize.query(
        `SELECT Order_Number
         FROM Order_Detail
         WHERE Order_Number IN (:orderNumbers)
         GROUP BY Order_Number
         HAVING COUNT(*) = SUM(CASE WHEN Confirmed = 1 THEN 1 ELSE 0 END)`,
        {
          replacements: { orderNumbers: orderNumbers },
          type: QueryTypes.SELECT,
          raw: true,
        }
      ) as any[];

      const validatedOrderNumbersSet = new Set(
        confirmedOrdersQuery
          .map((row: any) => row.Order_Number)
          .filter((v: any) => v !== null && v !== undefined)
          .map((v: any) => Number(v))
      );

      // Filter orderHeaders to only include orders where all items are confirmed
      validatedOrderNumbers = Array.from(validatedOrderNumbersSet);

      // If no orders pass validation, return empty array
      if (validatedOrderNumbers.length === 0) {
        return [];
      }

      // Filter orderHeaders to only include validated orders
      const filteredOrders = orderHeaders.filter((order: any) =>
        validatedOrderNumbers.includes(order.Order_Number)
      );

      // Update orderHeaders to only include validated orders
      orderHeaders.length = 0;
      orderHeaders.push(...filteredOrders);

      // Update orderNumbers to only include validated orders
      orderNumbers.length = 0;
      orderNumbers.push(...validatedOrderNumbers);
    }

    // Get override request counts for each order
    const overrideRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: { [Op.in]: orderNumbers }
      },
      attributes: ['orderNumber', 'status'],
      raw: true,
    });

    // Count override requests by order and status
    const overrideCounts: any = {};
    overrideRequests.forEach((req: any) => {
      const orderNum = req.orderNumber;
      if (!overrideCounts[orderNum]) {
        overrideCounts[orderNum] = {
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          total: 0
        };
      }
      overrideCounts[orderNum][req.status] = (overrideCounts[orderNum][req.status] || 0) + 1;
      overrideCounts[orderNum].total += 1;
    });

    // Create map of orderNumber to OrderPick data
    const orderPickMap: any = {};
    completedOrders.forEach((order: any) => {
      if (order.orderNumber) {
        orderPickMap[order.orderNumber] = {
          startedAt: order.startedAt,
          completedAt: order.completedAt
        };
      }
    });

    // Format response
    return orderHeaders.map((order: any) => {
      const orderNum = order.Order_Number;
      const customer = order.customer;
      const customerRoute = customer?.Routes?.[0];
      const orderPickData = orderPickMap[orderNum] || { startedAt: null, completedAt: null };
      const overrideCount = overrideCounts[orderNum] || {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0
      };

      return {
        orderNumber: orderNum,
        orderDate: order.Order_Date,
        invoiceNumber: order.Invoice_Number || 0,
        bundles: order.Bundles || 0,
        totes: order.Totes || 0,
        pickerId: order.Picker_ID || null,
        confirmed: order.Confirmed || false,
        invoiceTotal: order.Invoice_Total || null,
        customer: customer ? {
          customerNumber: customer.C_Number,
          customerName: customer.C_Name,
          address: customer.C_Address,
          city: customer.C_City,
          state: customer.C_State,
          zip: customer.C_Zip,
          route: customerRoute?.Route_Number || order.Route_Number || null,
          stop: customerRoute?.Stop_Number || order.Stop_Number || null
        } : null,
        overrideRequests: overrideCount,
        checkerStatus: {
          isReadyForChecker: true,
          status: 'completed',
          startedAt: orderPickData.startedAt,
          completedAt: orderPickData.completedAt
        }
      };
    });
  }

  /**
   * Get complete order information (order info only, no details)
   * - Only returns orders that are completed by epick but NOT completed by checker
   * - Order header information
   * - All override requests for this order (all statuses)
   * - Checker status (should be ready for checker but not completed)
   */
  async getCompleteOrderDetails(orderNumber: number) {
    // Validate order number
    if (!orderNumber || isNaN(orderNumber)) {
      throw new AppError('Invalid order number', 400);
    }

    // Check if order is completed by epick but NOT completed by checker
    const orderPick = await OrderPick.findOne({
      where: { 
        orderNumber: orderNumber,
        status: 'completed' // Epick must be completed
      },
      attributes: ['orderNumber', 'status', 'startedAt', 'completedAt']
    });

    if (!orderPick) {
      throw new AppError('Order not found or epick is not completed yet.', 404);
    }

    // Check if checker has already completed (invoice created or status is ready_for_delivery)
    const orderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
      attributes: ['Invoice_Number']
    });

    if (!orderHeader) {
      throw new AppError('Order header not found', 404);
    }

    // If invoice is created (Invoice_Number > 0), checker has completed - don't show
    const invoiceNumber = (orderHeader as any).Invoice_Number || 0;
    if (invoiceNumber > 0) {
      throw new AppError('Order has already been completed by checker (invoiced).', 404);
    }

    // Get order header with customer information
    const fullOrderHeader = await OrderHeader.findOne({
      where: { Order_Number: orderNumber },
      attributes: [
        'Order_Number',
        'Order_Date',
        'C_Number',
        'Route_Number',
        'Stop_Number',
        'Invoice_Number',
        'Bundles',
        'Totes',
        'Picker_ID',
        'Confirmed',
        'Invoice_Total'
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['C_Number', 'C_Name', 'C_Address', 'C_City', 'C_State', 'C_Zip'],
          required: false,
          include: [
            {
              model: CustomerRoute,
              as: 'Routes',
              attributes: ['Route_Number', 'Stop_Number'],
              required: false,
            }
          ]
        }
      ]
    });

    if (!fullOrderHeader) {
      throw new AppError('Order not found', 404);
    }

    // Get all override requests for this order (all statuses)
    const overrideRequests = await OverrideRequest.findAll({
      where: { orderNumber: orderNumber },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get item descriptions for override requests
    const itemNumbers = overrideRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    // Format override requests
    const formattedOverrideRequests = overrideRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        status: req.status,
        note: req.note,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });

    // Format customer information
    const orderHeaderData = fullOrderHeader as any;
    const customer = orderHeaderData.customer;
    const customerRoute = customer?.Routes?.[0];

    return {
      orderInfo: {
        orderNumber: orderHeaderData.Order_Number,
        orderDate: orderHeaderData.Order_Date,
        invoiceNumber: orderHeaderData.Invoice_Number || null,
        bundles: orderHeaderData.Bundles || 0,
        totes: orderHeaderData.Totes || 0,
        pickerId: orderHeaderData.Picker_ID || null,
        confirmed: orderHeaderData.Confirmed || false,
        invoiceTotal: orderHeaderData.Invoice_Total || null,
        customer: customer ? {
          customerNumber: customer.C_Number,
          customerName: customer.C_Name,
          address: customer.C_Address,
          city: customer.C_City,
          state: customer.C_State,
          zip: customer.C_Zip,
          route: customerRoute?.Route_Number || orderHeaderData.Route_Number || null,
          stop: customerRoute?.Stop_Number || orderHeaderData.Stop_Number || null
        } : null
      },
      overrideRequests: formattedOverrideRequests,
      checkerStatus: {
        isReadyForChecker: true,
        status: 'completed',
        startedAt: orderPick?.startedAt || null,
        completedAt: orderPick?.completedAt || null
      }
    };
  }

  /**
   * Get pending override requests by order number (for distributor)
   */
  async getPendingOverrideRequestsByOrder(orderNumber: number) {
    // Validate order number
    if (!orderNumber || isNaN(orderNumber)) {
      throw new AppError('Invalid order number', 400);
    }

    const pendingRequests = await OverrideRequest.findAll({
      where: {
        status: 'pending',
        orderNumber: orderNumber,
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get item descriptions for all requests
    const itemNumbers = pendingRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    return pendingRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        requestType: req.requestType, // 'pass' or 'scan'
        qty: req.qty,                 // 0 for pass, actual qty for scan
        note: req.note,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
  }

  /**
   * Get all override requests for an order (for Epick user)
   * Returns all override requests grouped by type (pass and scan)
   */
  async getAllOverrideRequests(orderNumber: number) {
    // Validate order number
    if (!orderNumber || isNaN(orderNumber)) {
      throw new AppError('Invalid order number', 400);
    }

    // Get all override requests for this order (all statuses)
    const allRequests = await OverrideRequest.findAll({
      where: {
        orderNumber: orderNumber,
      },
      order: [['createdAt', 'DESC']],
    });

    // Separate requests by type
    const passOverrides = allRequests
      .filter(req => req.requestType === 'pass')
      .map(req => ({
        requestId: req.id,
        itemNumber: req.itemNumber,
        status: req.status,
        qty: req.qty,
        note: req.note || null,
        rejectionReason: (req.status === 'rejected' || req.status === 'cancelled') 
          ? (req.rejectionReason || null) 
          : null,
      }));

    const scanOverrides = allRequests
      .filter(req => req.requestType === 'scan')
      .map(req => ({
        requestId: req.id,
        itemNumber: req.itemNumber,
        status: req.status,
        qty: req.qty,
        note: req.note || null,
        rejectionReason: (req.status === 'rejected' || req.status === 'cancelled') 
          ? (req.rejectionReason || null) 
          : null,
      }));

    return {
      passOverrides,
      scanOverrides,
    };
  }

  /**
   * Get all approved override requests (for distributor)
   */
  async getApprovedOverrideRequests() {
    const approvedRequests = await OverrideRequest.findAll({
      where: {
        status: 'approved',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Get item descriptions for all requests
    const itemNumbers = approvedRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    return approvedRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        requestType: req.requestType, // 'pass' or 'scan'
        qty: req.qty,                 // 0 for pass, actual qty for scan
        note: req.note,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
  }

  /**
   * Get all cancelled override requests (for distributor)
   */
  async getCancelledOverrideRequests() {
    const cancelledRequests = await OverrideRequest.findAll({
      where: {
        status: 'cancelled',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Get item descriptions for all requests
    const itemNumbers = cancelledRequests.map(req => req.itemNumber);
    const inventories = await Inventory.findAll({
      where: {
        Item_Number: { [Op.in]: itemNumbers },
      },
      attributes: ['Item_Number', 'Description'],
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.Item_Number, inv.Description]));

    return cancelledRequests.map((req: any) => {
      const user = req.user as WebUsers | undefined;
      return {
        requestId: req.id,
        orderNumber: req.orderNumber,
        itemNumber: req.itemNumber,
        itemDescription: inventoryMap.get(req.itemNumber) || null,
        pickerUserNumber: req.pickerUserNumber,
        userName: user ? `${user.firstName} ${user.lastName}` : null,
        userEmail: user?.email || null,
        requestType: req.requestType, // 'pass' or 'scan'
        qty: req.qty,                 // 0 for pass, actual qty for scan
        note: req.note,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
  }

  /**
   * Approve override request
   */
  async approveOverrideRequest(requestId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Pending override request not found', 404);
    }

    // Update status
    overrideRequest.status = 'approved';
    await overrideRequest.save();

    // If request type is 'scan', update qty_shipped like normal scan
    if (overrideRequest.requestType === 'scan' && overrideRequest.qty > 0) {
      // Get the order pick to find boxId (use first box or create logic)
      const orderPick = await OrderPick.findOne({
        where: {
          orderNumber: overrideRequest.orderNumber
        }
      });

      if (orderPick) {
        // Get or create a box for this order (use first box or default)
        const orderBox = await OrderPickBox.findOne({
          where: {
            orderNumber: overrideRequest.orderNumber
          },
          order: [['id', 'ASC']]
        });

        const boxId = orderBox?.id || null;

        // Create OrderPickScan record (like normal scan)
        if (boxId) {
          await OrderPickScan.create({
            orderNumber: overrideRequest.orderNumber,
            itemNumber: overrideRequest.itemNumber,
            qty: overrideRequest.qty,
            boxId: boxId,
            isSubsitute: false
          });
        }

        // Update Quantity_Shipped in OrderDetail (like normal scan)
        await OrderDetail.update(
          {
            Quantity_Shipped: literal(`"Quantity_Shipped" + ${overrideRequest.qty}`)
          },
          {
            where: {
              Order_Number: overrideRequest.orderNumber,
              Item_Number: overrideRequest.itemNumber
            }
          }
        );

        // Update OrderPick scannedLines and scannedQty
        await OrderPick.update(
          {
            scannedLines: literal(`"scannedLines" + 1`),
            scannedQty: literal(`"scannedQty" + ${overrideRequest.qty}`)
          },
          {
            where: {
              orderNumber: overrideRequest.orderNumber
            }
          }
        );
      }
    }

    // Note: Epick user will check status via polling API (checkOverrideRequest) every 5 seconds
    // No push notification needed

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      requestType: overrideRequest.requestType,
      qty: overrideRequest.qty,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Cancel override request (Distributor)
   */
  async cancelOverrideRequestByDistributor(requestId: number) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Pending override request not found', 404);
    }

    // Update status to cancelled
    overrideRequest.status = 'cancelled';
    await overrideRequest.save();

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Reject override request
   */
  async rejectOverrideRequest(requestId: number, rejectionReason: string) {
    const overrideRequest = await OverrideRequest.findOne({
      where: {
        id: requestId,
        status: 'pending',
      },
      include: [
        {
          model: WebUsers,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!overrideRequest) {
      throw new AppError('Pending override request not found', 404);
    }

    // Update status
    overrideRequest.status = 'rejected';
    overrideRequest.rejectionReason = rejectionReason;
    await overrideRequest.save();

    // Note: Epick user will check status via polling API (checkOverrideRequest) every 5 seconds
    // No push notification needed

    return {
      requestId: overrideRequest.id,
      status: overrideRequest.status,
      orderNumber: overrideRequest.orderNumber,
      itemNumber: overrideRequest.itemNumber,
      rejectionReason: overrideRequest.rejectionReason,
      updatedAt: overrideRequest.updatedAt,
    };
  }

  /**
   * Send notification to all distributors (same way as web notifications)
   */
  private async sendNotificationToDistributors(overrideRequest: OverrideRequest) {
    try {
      // Get all active distributor users
      const distributors = await WebUsers.findAll({
        where: {
          role: 'distributor',
          isActive: true,
        },
        attributes: ['id'],
      });

      if (distributors.length === 0) {
        console.log('⚠️ No active distributors found for notification');
        return;
      }

      // Get item description
      const inventory = await Inventory.findOne({
        where: { Item_Number: overrideRequest.itemNumber },
        attributes: ['Description'],
      });

      const itemDescription = inventory?.Description || `Item ${overrideRequest.itemNumber}`;
      const title = 'Override Request';
      const description = `Order #${overrideRequest.orderNumber} - ${itemDescription} pass request`;

      // Send notification to each distributor (same pattern as web notifications)
      for (const distributor of distributors) {
        // Step 1: Create notification in database (same as web)
        await Notifications.create({
          userNumber: distributor.id.toString(),
          title: title,
          description: description,
          isActive: true,
        });

        // Step 2: Get device tokens (same as web)
        const findDeviceToken = await RetailerDevice.findAll({
          where: {
            customerNumber: distributor.id,
            isActive: true,
            sessionActive: true,
            isAllow: true,
          },
          attributes: ['deviceToken'],
        });

        const deviceTokens = findDeviceToken
          .map((e: any) => e.deviceToken)
          .filter((token: string) => token && token.trim() !== '');

        // Step 3: Send Firebase notification (same as web)
        if (deviceTokens.length > 0) {
          await sendMultiFCMNotification({
            tokens: deviceTokens,
            title: title,
            body: description,
            data: {
              type: 'override_request',
              requestId: overrideRequest.id.toString(),
              orderNumber: overrideRequest.orderNumber.toString(),
              itemNumber: overrideRequest.itemNumber.toString(),
              pickerUserNumber: overrideRequest.pickerUserNumber.toString(),
            },
          });
          console.log(`✅ Notification sent to distributor ${distributor.id} (${deviceTokens.length} devices)`);
        } else {
          console.log(`⚠️ No device tokens found for distributor ${distributor.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Error sending notification to distributors:', error);
      // Don't throw - notification failure shouldn't break the request creation
    }
  }

  /**
   * Get all ongoing orders (for distributor/admin)
   * Returns orders with status 'in_progress' with user and order details
   */
  async getOngoingOrders() {
    const ongoingOrders = await OrderPick.findAll({
      where: {
        status: 'in_progress',
      },
      order: [['startedAt', 'DESC']],
      raw: true,
    });

    if (ongoingOrders.length === 0) {
      return {
        total: 0,
        orders: [],
      };
    }

    // Get unique picker user IDs and order numbers
    const pickerUserIds = Array.from(
      new Set(
        ongoingOrders
          .map((order: any) => order.pickerUserNumber)
          .filter((id: any) => id !== null && id !== undefined)
      )
    );
    const orderNumbers = ongoingOrders.map((order: any) => order.orderNumber);

    // Fetch picker user information
    const pickers = await WebUsers.findAll({
      where: {
        id: { [Op.in]: pickerUserIds },
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'userNumber'],
      raw: true,
    });

    // Create picker map
    const pickerMap: any = {};
    pickers.forEach((picker: any) => {
      pickerMap[picker.id] = picker;
    });

    // Fetch order headers and customer details
    let orderHeaderMap: any = {};

    if (orderNumbers.length > 0) {
      const orderHeaders = await OrderHeader.findAll({
        where: {
          Order_Number: { [Op.in]: orderNumbers },
        },
        attributes: ['Order_Number', 'Order_Date'],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['C_Number', 'C_Name'],
            include: [
              {
                model: CustomerRoute,
                as: 'Routes',
                attributes: ['Route_Number', 'Stop_Number'],
                required: false,
              },
            ],
            required: false,
          },
        ],
      });

      // Create maps for quick lookup
      orderHeaders.forEach((header: any) => {
        orderHeaderMap[header.Order_Number] = {
          orderDate: header.Order_Date,
          customer: header.customer ? {
            customerNumber: header.customer.C_Number,
            customerName: header.customer.C_Name,
            routes: header.customer.Routes || [],
          } : null,
        };
      });
    }

    // Format response
    const result = ongoingOrders.map((order: any) => {
      const picker = pickerMap[order.pickerUserNumber];
      const orderInfo = orderHeaderMap[order.orderNumber] || {};
      
      return {
        orderNumber: order.orderNumber,
        customerNumber: order.customerNumber,
        customerName: orderInfo.customer?.customerName || null,
        routes: orderInfo.customer?.routes || [],
        orderDate: orderInfo.orderDate || null,
        pickerId: picker?.id || null,
        pickerName: picker ? `${picker.firstName || ''} ${picker.lastName || ''}`.trim() : null,
        pickerEmail: picker?.email || null,
        pickerUserNumber: picker?.userNumber || null,
        startedAt: order.startedAt,
        totalLines: order.totalLines,
        totalQty: parseFloat(order.totalQty) || 0,
        scannedLines: order.scannedLines,
        scannedQty: parseFloat(order.scannedQty) || 0,
        outOfStockItems: order.OutOfStockItem,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    return {
      total: result.length,
      orders: result,
    };
  }

  /**
   * Remove/delete an ongoing order (for distributor/admin)
   * This will:
   * 1. Delete from Order_Pick (PostgreSQL) - also removes from getUserCurrentOrder
   * 2. Delete from Order_Pick_Box (PostgreSQL)
   * 3. Delete from Order_Pick_Scan (PostgreSQL)
   * 4. Delete from passScanItems (PostgreSQL)
   * 5. Delete from Record_Locks (MSSQL)
   * This makes the order available again in getOrder API and removes it from current order
   */
  async removeOngoingOrder(orderNumber: number) {
    // Check if order exists and is in progress
    const orderPick = await OrderPick.findOne({
      where: {
        orderNumber: orderNumber,
        status: 'in_progress',
      },
    });

    if (!orderPick) {
      throw new AppError('Ongoing order not found', 404);
    }

    // Delete all related data in PostgreSQL (cascade delete should handle this, but being explicit)
    
    // 1. Delete all scans for this order
    await OrderPickScan.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 2. Delete all boxes for this order
    await OrderPickBox.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 3. Delete all pass scan items for this order
    await PassScanItem.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 4. Delete all override requests for this order
    await OverrideRequest.destroy({
      where: {
        orderNumber: orderNumber,
      },
    });

    // 5. Delete the order pick record
    // This also removes it from getUserCurrentOrder API (which queries Order_Pick with status='in_progress')
    await orderPick.destroy();

    // 6. Delete from Record_Locks (MSSQL) - this is what makes the order visible again in getOrder
    await RecordLock.destroy({
      where: {
        Lock_Type: 0,
        Lock_Number: orderNumber,
      },
    });

    // 7. Optionally reset Quantity_Shipped in Order_Detail (reset to 0)
    // This ensures clean state if order is accepted again
    await OrderDetail.update(
      { Quantity_Shipped: 0 },
      {
        where: {
          Order_Number: orderNumber,
        },
      }
    );

    return {
      message: 'Ongoing order removed successfully',
      orderNumber: orderNumber,
    };
  }
}



