import { IChangePassword } from "../interfaces/request.body.interface";
import { SalesRep } from "../models/mmsql/salesrep.model"
import { WebUsers } from "../models/postgres/users.model"
import { AppError } from "../utils/AppError";
import { checkQtyDiscount, comparePassword, excludeItemByUser, generatePDFFromHTML, getAllowedSalesCategories, getAllowedSalesCategoriesAndPriceClasses, getCustomerExcludeItem, getDiscount, getDiscountsForItemNumbers, getFirstValidPrice, getInventoryFullItemNumber, getInventoryOnHand, getJurisdiction, getPrepaidTaxRate, getProductLimit, getTaxRateV1, getTopLatestItems, hasDiscountedItem, hashPassword, isItemInActive, pgArrayToJsArray, renderOrderTableFromERP, toNum } from "../utils/helper";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { col, literal, Op, Order, Sequelize } from "sequelize";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { ProductImage } from "../models/postgres/product.model";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { PriceClass } from "../models/mmsql/priceClass.model";
import CustomerCart from "../models/postgres/retailerCart.model";
import { AddToCartRequest, CartResponse, PlaceOrder, UpdateCartItemRequest } from "../interfaces/cart.interface";
import { Customer } from "../models/mmsql/customer.model";
import SalesSession from "../models/postgres/salesSession.model";
import { getDefaultOrderDetailValues, getDefaultOrderValues, getNextOrderNumber, sendEmailToOrder, sendEmailToReturnOrder } from "../utils/order";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { OptionDefsValues } from "../models/mmsql/optionDefsValue.model";
import { WarehouseSetting } from "../models/postgres/wareHouseSetting.model";
import { Retailer } from "../models/postgres/retailer.model";
import Banner from "../models/postgres/banner.model";
import { CustReceivables } from "../models/mmsql/custReceivables.model";
import { ARDetails } from "../models/mmsql/arDetails.model";
import { ARDefinitions } from "../models/mmsql/arDefinitions.model";
import Setting from "../models/postgres/setting.model";
import InventoryStatus from "../models/mmsql/inventoryStatus.model";
import { OrderHistory } from "../models/postgres/orderHistory.model";
import OrderHeaderExt from "../models/mmsql/orderHeaderExt.model";
import { uploadFileToAzure } from "../utils/azureUploader";
import { Distributor } from "../models/mmsql/distributor.model";
import { Terms } from "../models/mmsql/invoiceTerm.model";
import { DeliveryCharge } from "../models/mmsql/deliveryCharges.model";
import { Console } from "console";
import Policies from "../models/postgres/policies.model";
import moment from "moment";
import SalesCallTime from "../models/postgres/salesCallTime.model";
import SalesNote from "../models/postgres/salesNotes";
import OrderDiscount from "../models/postgres/orderDiscount.model";
import { OrderConfirmation } from "../models/postgres/orderConfirmation.model";
import { sequelize, postgresSequelize } from "../db";
import { Users } from "../models/mmsql/user.model";
import { RecordLock } from "../models/mmsql/recordLocks.model";
import { QueryTypes } from "sequelize";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { generateRandomBarCode } from "../utils/barCodeGenerate";
import { DriverPickupOrder } from "../models/postgres/driverPickerOrder.model";
import { ContactUs } from "../models/postgres/contactUs.model";

export class SalesService {

  async getProfile(id: number) {
    const data = await WebUsers.findByPk(id, {
      attributes: ['firstName', 'lastName', 'email', 'role', 'salesRepNumber', 'id'],
    });

    if (!data) return null;

    const user = data.toJSON(); // Convert Sequelize instance to plain object
    const salesRepList: string[] = pgArrayToJsArray(user.salesRepNumber);

    const newUser = salesRepList.map(Number);
    const salesRep = await Promise.all(newUser.map(async (id: number) => {
      const salesRep = await this.getSalesRepUser(id);
      return {
        S_Number: salesRep?.S_Number,
        S_Desc: salesRep?.S_Desc,
      }
    }));

    return {
      ...user,
      salesRep: salesRep
        ? salesRep
        : null,
    };
  }

  async getCustomerList(userId: number) {
    // First, get the user details from WebUsers table to find their salesRepNumber
    const user = await WebUsers.findByPk(userId, {
      attributes: ['salesRepNumber']
    });

    if (!user || !user.salesRepNumber) {
      throw new AppError("Sales representative not found for this user", 404);
    }

    const salesRepList: string[] = pgArrayToJsArray(user.salesRepNumber);

    console.log("PG RAW:", user.dataValues.salesRepNumber);
    console.log("Parsed:", salesRepList);

    // Convert salesRepNumber to number since it's stored as string in database

    console.log(user, 'the user-->')
    const newSalesRepArray = salesRepList.map(Number);
    // Now find customers assigned to this sales representative
    const customerList = await Customer.findAll({
      where: {
        C_Salesman: { [Op.in]: newSalesRepArray },
        C_Inactive: false,
      },
      attributes: [
        'C_Number',
        'C_Name',
        'C_CoName',
        'C_Salesman'
      ]
    })

    return customerList;
  }


  async changePassword(body: IChangePassword, id: number) {
    const user = await WebUsers.findByPk(id);

    const isPassMatch = await comparePassword(body.old_password, user?.password || '');
    if (!isPassMatch) {
      throw new AppError("Current password is incorrect", 200);
    }
    const hashedPassword = await hashPassword(body.new_password);
    const updatedUser = await WebUsers.update({ password: hashedPassword }, {
      where: { id: id }
    });
    return updatedUser;
  }

  async placeOrder(orderData: PlaceOrder, req: any, customerId: any) {
    const { shippingDetails, hasDiscount, discountAmount, order_type } = orderData;
    const totalPrice = orderData.orderPlayload.reduce((sum: any, item: any) => sum + Number(item.TotalPriceWithTax), 0);
    const isWebOrder = req.headers['is-web-order'];
    const isWeb = isWebOrder === 'true' ? true : false;

    const { orderPlayload, Delivery_Charge } = orderData;

    const { method } = shippingDetails;
    let deliveryId = 0;
    if (method === 'delivery') {
      deliveryId = 0;
    }
    if (method === 'pickup') {
      deliveryId = 99
    }

    // Get customer and route info

    let customer = await Customer.findOne({ where: { C_Number: customerId } });


    console.log(customer?.dataValues, 'customer-->---->')
    customer = customer?.dataValues as any;
    const customerRoutes = await CustomerRoute.findOne({ where: { C_Number: customerId } });



    if (!customer) {
      throw new AppError("Customer not found", 404);
    }
    const orderNumber = await getNextOrderNumber();
    let Order_Type = 0;

    if (order_type == 'regular') {
      Order_Type = 0;
    }
    if (order_type == 'prebook') {
      Order_Type = 1;
    }
    if (order_type == 'backorder') {
      Order_Type = 2;
    }
    if (order_type == 'price_quote') {
      Order_Type = 4;
    }
    if (order_type == 'return_sales') {
      Order_Type = 5;
    }
    if (order_type == 'return_order') {
      Order_Type = 6;
    }
    if (order_type == 'trade_show') {
      Order_Type = 7;
    }
    if (order_type == 'pos') {
      Order_Type = 8;
    }


    // Prepare dynamic header data
    const orderHeaderObject = {
      Order_Number: orderNumber,

      C_Number: customerId,
      S_Number: customer.C_Salesman || 0,
      Order_Source: isWeb ? 13 : 12,
      AR_C_Number: customer.C_StatementAccount || customerId,
      Jurisdiction_State: customer.Jurisdiction_State || '',
      Jurisdiction_County: customer.Jurisdiction_County || '',
      Jurisdiction_City: customer.Jurisdiction_City || '',
      Route_Number: customerRoutes?.Route_Number || 0,
      Stop_Number: customerRoutes?.Stop_Number || 0,
      Delivery_ID: deliveryId,
      User_ID: Number(req.user.userNumber),
      Reference: `USER-${req.user.userNumber}`,
      Invoice_Type: customer.C_InvoiceFormat || 0,
      Invoice_Deposit: 0,
      Delivery_Charge: Delivery_Charge || 0,
      Other_Charge: customer.Other_Amount || 0,
      Invoice_Total: 0,
      Sales_Taxable: 0,
      Sales_NonTaxable: 0,
      Cig20: 0,
      Cig10tax: 0,
      Cig20tax: 0,
      Cig25tax: 0,
      POS_ChangeDue: 0,
      Order_Pricing_Account: customer.C_PricingAccount || customerId,
      Order_Type: Order_Type || 0,
      Points: 0,
      Total_Weight: 0,
      Delivery_Charge_Select: !!customer.Delivery_Charge,
      Other_Charge_Select: !!customer.Other_Amount,
    };



    // Combine with defaults (exclude Order_Number since it's auto-increment)
    const { Order_Number, ...defaultValues } = getDefaultOrderValues();
    const finalOrderHeader: any = {
      ...defaultValues,
      ...orderHeaderObject,
    };



    // Ensure no null values in required fields
    Object.keys(finalOrderHeader).forEach(key => {
      if (finalOrderHeader[key] === null || finalOrderHeader[key] === undefined) {
        if (typeof finalOrderHeader[key] === 'number') {
          finalOrderHeader[key] = 0;
        } else if (typeof finalOrderHeader[key] === 'boolean') {
          finalOrderHeader[key] = false;
        } else if (typeof finalOrderHeader[key] === 'string') {
          finalOrderHeader[key] = '';
        }
      }
    });



    console.log(finalOrderHeader, 'finalOrderHeader-->---->------------------------>')


    let orderHeaderCreated: any;
    try {
      orderHeaderCreated = await OrderHeader.create(finalOrderHeader) as any;
    } catch (error) {
      throw new AppError('Failed to create order header', 500);
    }

    // Fetch products and options
    const itemNumbers = orderPlayload.map(item => item.Item_Number);
    const [products] = await Promise.all([
      Inventory.findAll({ where: { Item_Number: itemNumbers }, raw: true }),
    ]);



    const productMap = new Map(products.map(product => [product.Item_Number, product]));

    const orderDetails = orderPlayload.map(async (item: any, index) => {
      const product = productMap.get(item.Item_Number);

      if (!product) {
        throw new AppError(`Product with Item_Number ${item.Item_Number} not found`, 404);
      }

      if (item.Qty <= 0) {
        throw new AppError(`Invalid quantity for item ${item.Item_Number}`, 400);
      }

      console.log(item.Price, 'item.Price-->', 'item.Sales_Category', product.Sales_Category, 'item.OTP_Number', product.OTP_Number)

      console.log(hasDiscount == true, 'hasDiscount == true')
      let optionDefsValues: any = await OptionDefsValues.findOne({ where: { ID_Number: 4003, Option_Value: product.Sales_Category }, raw: true })

      if (!optionDefsValues) {
        optionDefsValues = await OptionDefsValues.findOne({ where: { ID_Number: 4003, Option_Value: product.OTP_Number }, raw: true })
      }

      console.log(optionDefsValues, 'optionDefsValues-->')
      if (!optionDefsValues) {
        optionDefsValues = 0
      } else {
        optionDefsValues = Number(item.Qty)
      }

      let PPD_PackType = 0
      let PPD_Packs = 0

      if (product.OTP_Number == 255) {
        if (product.Cig_Pack == 20) {
          PPD_PackType = 20
          PPD_Packs = 10
        }
        else if (product.Cig_Pack == 10) {
          PPD_PackType = 10
          PPD_Packs = 20
        }

      }

      let adjprice = hasDiscount == true ? Number(item.discountPrice || 0) : Number(item.Price);
      const orderDetail = {
        PrepaidTax_Amount: item.prepaidTaxRate ? Number(item.prepaidTaxRate) : 0,
        Order_Number: orderHeaderCreated.Order_Number,
        Item_Number: item.Item_Number,
        Line_Number: index + 1,
        Sales_Category: product.Sales_Category,
        OTP_Number: product.OTP_Number,
        Quantity_Ordered: Number(item.Qty),
        Quantity_Shipped: item.Qty,
        Pack: product.Pack,
        UOM: product.UOM,
        Price: Number(adjprice),
        Price_Reference: Number(adjprice),
        Retail: product.Retail1,
        NetCost: product.NetCost,
        BaseCost: product.BaseCost,
        Invoice_Cost: product.Invoice_Cost,
        AvgCost: product.AvgCost,
        OTP_Amount_State: Number(item.Tax_Rate ?? 0),

        OTP_Amount_County: 0,
        OTP_Amount_City: 0,
        Item_Message: product.Item_Message ? product.Item_Message : ' ',

        DepositAmount: product.DepositAmount,
        Price_Subclass: product.Price_Subclass,
        OffInvoice_Amount: 0,
        OffInvoice_OffCost: 0,
        OffInvoice_Special: false,
        EBT: product.EBT,
        Points: product.Points,
        Stamp_Qty: optionDefsValues || 0,
        ItemDescription: product.Description,
        CaseWeight: product.CaseWeight,
        CaseCount: product.CaseCount,
        PPD_PackType: PPD_PackType,
        PPD_Packs: PPD_Packs,
        // CasesPerPallet: product.CasesPerPallet,
      };

      return {
        ...getDefaultOrderDetailValues(),
        ...orderDetail
      };
    });


    try {
      const resolvedOrderDetails = await Promise.all(orderDetails);

      await OrderDetail.bulkCreate(resolvedOrderDetails);

      try {
        sendEmailToOrder(orderHeaderCreated, resolvedOrderDetails, customer, Delivery_Charge);
      } catch (error) {
        console.log(error, 'error-->')
      }

      console.log('Order details created successfully');
    } catch (error) {
      console.log(error, 'error-->')
      throw new AppError('Failed to create order details', 500);
    }



    console.log(customer, 'customer-->---->------------------------>')


    await CustomerCart.update({ isActive: false }, { where: { Customer_Number: customerId } });

    let orderOptionValue = shippingDetails.method + '--' + shippingDetails.selectedTimeSlot + '--' + shippingDetails.instructions
    if (shippingDetails.method === 'delivery') {
      orderOptionValue = shippingDetails.method + '--' + shippingDetails.instructions
    }
    await OrderHeaderExt.create({
      Order_Number: orderHeaderCreated.Order_Number,
      Order_Option: 0,
      Order_OptionValue: orderOptionValue
    })

    await OrderHistory.create({
      C_Number: customerId,
      type: 'order',
      orderPrice: totalPrice,
      Order_Number: orderHeaderCreated.Order_Number,
      order_Source: isWeb ? 'Web' : 'App',
      orderPlaceBy: 'sales',
      discount: Number(discountAmount || 0),
      salesId: req.user.id, // postgress user id
      isActive: true
    });



    try {

      if (hasDiscount == true) {

        await OrderDiscount.create({
          orderNumber: orderHeaderCreated.Order_Number,
          discount: Number(discountAmount || 0),
          discountType: 'flat',
          salesId: customer.C_Salesman || 0,
          CustomerNumber: customerId
        })

      }
    } catch (error) {
      console.log(error, 'error--> in sales discount')
    }


    return {
      orderHeader: orderHeaderCreated,
      orderDetails,
      message: "Order placed successfully"
    };
  }


  async getOrderHistory(customerNumber: number, query: PaginationOptions & { search?: string, startDate?: string, endDate?: string }) {
    let { page = 1, limit = 10, search, startDate, endDate } = query;
    page = Number(query.page || (query as any)['page ']) || 1;
    limit = Number(query.limit || (query as any)['limit ']) || 10;
    const offset = (page - 1) * limit;

    // Build where clause for OrderHeader
    let whereClause: any = { C_Number: customerNumber, Order_Deleted: false };

    // Add search functionality if provided
    if (search) {
      whereClause[Op.or] = [
        { Order_Number: { [Op.like]: `%${search}%` } },
        { Reference: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      whereClause.Order_Date = {};

      if (startDate) {
        whereClause.Order_Date[Op.gte] = startDate;
      }

      if (endDate) {
        whereClause.Order_Date[Op.lte] = endDate;
      }
    }

    // 🔥 EXCLUDE ORDERS WHERE TOTAL QUANTITY = 0
    whereClause.Order_Number = {
      [Op.in]: Sequelize.literal(`(
      SELECT od."Order_Number"
      FROM "Order_Detail" od
      GROUP BY od."Order_Number"
      HAVING SUM(od."Quantity_Ordered") > 0
    )`)
    };

    // Get order headers with pagination
    const orderHeaders = await OrderHeader.findAll({
      where: whereClause,
      attributes: [
        'Order_Number',
        'Order_Date',
        'User_ID',
        'Order_Source',
        'Picklist_Printed'
      ],
      include: [
        {
          model: OrderDetail,
          as: 'orderDetails',
          required: true,
          attributes: []
        }
      ],

      order: [['Order_Number', 'DESC']],
      limit,
      offset
    });

    // Count total records
    const totalCount = await OrderHeader.count({
      where: { ...whereClause, Order_Deleted: false },
      include: [
        {
          model: OrderDetail,
          as: 'orderDetails',
          required: true,
          attributes: []
        }
      ],
      distinct: true
    });

    // Get total quantity per order
    const orderNumbers = orderHeaders.map((h: any) => h.Order_Number);

    const orderDetailsWithSums = await OrderDetail.findAll({
      where: {
        Order_Number: { [Op.in]: orderNumbers }
      },
      attributes: [
        'Order_Number',
        [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantity']
      ],
      group: ['Order_Number'],
      raw: true
    });

    const quantityMap = new Map(
      orderDetailsWithSums.map((d: any) => [d.Order_Number, d.totalQuantity])
    );

    // Build final output
    const result = orderHeaders.map((header: any) => {
      let source = 'WEB';
      if (header.Order_Source === 13) source = 'WEB';
      else if (header.Order_Source === 12) source = 'APP';
      else source = 'ERP';

      return {
        Order_Number: header.Order_Number,
        Order_Date: header.Order_Date,
        User_ID: header.User_ID,
        Order_Source: source,
        Picklist_Printed: header.Picklist_Printed,
        totalQuantity: quantityMap.get(header.Order_Number) || 0
      };
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: result
    };
  }


  async getOrderHistoryByOrderNumber(orderNumber: number, query: PaginationOptions) {
    let { page = 1, limit = 10 } = query;
    page = Number(query.page || (query as any)['page ']) || 1;
    limit = Number(query.limit || (query as any)['limit ']) || 10;
    const offset = (page - 1) * limit;

    // Fetch order header
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

    // Get total count of order lines
    const totalCount = await OrderDetail.count({
      where: { Order_Number: orderNumber }
    });

    // Fetch full order details (no pagination) to calculate totals
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

    // Totals calculation
    let totalPrice = 0;
    let totalDiscount = 0;
    let totalDeposit = 0;
    let totalPrepaidTax = 0;
    for (const details of allOrderDetails) {
      const d = details.dataValues;

      const basePrice = toNum(d.Price);
      const otpState = toNum(d.OTP_Amount_State);
      const prepaid = toNum(d.PrepaidTax_Amount);
      const qty = toNum(d.Quantity_Shipped); // or fallback below

      const quantity = qty > 0 ? qty : toNum(d.Quantity_Ordered);
      totalPrepaidTax += prepaid * quantity;
      const unitPrice = basePrice + otpState + prepaid;

      totalPrice += unitPrice * quantity;

      totalDiscount += toNum(d.OffInvoice_Amount);   // multiply by qty only if this is per-unit
      totalDeposit += toNum(d.DepositAmount);       // multiply by qty only if this is per-unit
    }

    // Fetch paginated order details with inventory and UPC
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
        'PrepaidTax_Amount'
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

    const orderDiscount = await OrderDiscount.findOne({
      where: { orderNumber: orderNumber }
    });
    if (orderDiscount) {
      totalDiscount = orderDiscount.discount;
    }
    const orderDetailsWithImages = await Promise.all(orderDetails.map(async (detail: any) => {
      const productImage = await ProductImage.findOne({
        where: {
          product_number: detail.Item_Number.toString(),
          isAllow: true
        },
      });
      let Price = Number(detail.Price || 0) + Number(detail.OTP_Amount_State || 0) + Number(detail.PrepaidTax_Amount || 0)
      return {
        ...detail.toJSON(),
        Price,
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
  // async getInventoryItems(query: PaginationOptions & { search?: string, masterSearch?: string }, customerId: number) {
  //   let { page = 1, limit = 10, salesCategoryId, search, priceClassId, masterSearch } = query;
  //   page = Number(page);
  //   limit = Number(limit);
  //   let wareHouseSetting: any = await Setting.findOne({});
  //   wareHouseSetting = wareHouseSetting?.dataValues || null;

  //   let whereClause: any = {
  //     I_Inactive: false,
  //   };

  //   let searchInUPC = false;

  //   if (masterSearch && typeof masterSearch === 'string') {
  //     const masterArray = masterSearch.split(',').map(i => i.trim());
  //     whereClause.Item_Number = { [Op.in]: masterArray };
  //   } else {

  //     if (salesCategoryId) {
  //       whereClause.Sales_Category = salesCategoryId;
  //     }

  //     if (priceClassId) {
  //       whereClause.Price_Class = priceClassId;
  //     }

  //     if (search) {
  //       const searchValue = `%${search}%`;

  //       // Check if it's likely a UPC number (digits only, 8+)
  //       if (/^\d{8,}$/.test(search)) {
  //         searchInUPC = true;
  //       } else {
  //         whereClause[Op.or] = [
  //           { Item_Number: { [Op.like]: searchValue } },
  //           { Description: { [Op.like]: searchValue } },
  //           { ALT_Description2: { [Op.like]: searchValue } },
  //         ];
  //       }
  //     }
  //   }

  //   const { count: totalCount, rows: productList } = await Inventory.findAndCountAll({
  //     attributes: [
  //       'Pack',
  //       'Description',
  //       'Item_Number',
  //       'CaseCount',
  //       'UOM',
  //       'Price1',
  //       'Price2',
  //       'BaseCost',
  //       'Invoice_Cost',
  //       'AvgCost',
  //       'NetCost',
  //       'eCommerce',
  //       'I_Inactive',
  //       'Date_Created',
  //       'OTP_Number',
  //       'UnitOunces',
  //       'Price_Subclass'
  //     ],
  //     where: whereClause,
  //     include: [
  //       {
  //         model: SalesCategory,
  //         as: 'SalesCategory',
  //         attributes: ['Category_Desc'],
  //         required: false
  //       },
  //       {
  //         model: PriceClass,
  //         as: 'PriceClass',
  //         attributes: ['Class_Desc'],
  //         required: false
  //       },
  //       {
  //         model: InventoryUPC,
  //         as: 'UPCList',
  //         attributes: ['UPC_Number'],
  //         where: {
  //           Status: 0,
  //           ...(searchInUPC ? { UPC_Number: { [Op.like]: `%${search}%` } } : {}),
  //         },
  //         required: searchInUPC
  //       },
  //     ],
  //     order: [['Date_Created', 'DESC']],
  //     limit,
  //     offset: (page - 1) * limit,
  //     logging: console.log
  //   });

  //   const finalProductList = await Promise.all(productList.map(async (e: any) => {
  //     const productImage = await ProductImage.findOne({
  //       where: {
  //         product_number: e.Item_Number.toString(),
  //         isAllow: true
  //       },
  //     });

  //     let price = await getDiscount(Number(e.Item_Number), Number(customerId));
  //     if (!price) {
  //       price = await getFirstValidPrice(e);
  //     }

  //     let taxRate = await getTaxRateV1(e.OTP_Number);
  //     const inventoryOnHand = await getInventoryOnHand(e.Item_Number);
  //     const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass)


  //     let allowToOrder = true;
  //     if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
  //       allowToOrder = false;
  //     }

  //     return {
  //       Pack: e.Pack,
  //       Description: e.Description,
  //       Item_Number: e.Item_Number,
  //       CaseCount: e.CaseCount,
  //       UOM: e.UOM,
  //       isDiscounted,
  //       Price1: e.Price1,
  //       Tax_Rate: taxRate,
  //       OTP_Number: e.OTP_Number,
  //       price: price,
  //       priceWithTax: price + taxRate,
  //       BaseCost: e.BaseCost,
  //       Inventory_OnHand: inventoryOnHand || 0,
  //       allowToOrder,
  //       showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
  //       showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
  //       showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
  //       Invoice_Cost: e.Invoice_Cost,
  //       AvgCost: e.AvgCost,
  //       NetCost: e.NetCost,
  //       UnitOunces: e.UnitOunces,
  //       UPCList: e.UPCList,
  //       SalesCategory: e.SalesCategory?.Category_Desc || null,
  //       PriceClass: e.PriceClass?.Class_Desc || null,
  //       showDistributorImage: productImage?.isAllow ?? false,
  //       distributorImage: productImage?.img_url || null,
  //       masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
  //     };
  //   }));

  //   return {
  //     totalCount,
  //     page,
  //     limit,
  //     finalProductList,
  //   };
  // }

  async getInventoryItems(query: PaginationOptions & { search?: string, masterSearch?: string }, customerId: number) {
    let { page = 1, limit = 10, salesCategoryId, search, priceClassId, masterSearch, shortBy, state = '', zip = '', jurisdiction = '', salesCategory = [] } = query;


    if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0) {
      salesCategoryId = salesCategoryId.map(id => Number(id));
    }

    if (Array.isArray(priceClassId) && priceClassId.length > 0) {
      priceClassId = priceClassId.map(id => Number(id));
    }

    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    page = Number(page);
    limit = Number(limit);

    let whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
    };

    const excludeItem = await excludeItemByUser(customerId);
    if (excludeItem.length > 0) {
      whereClause.Item_Number = { [Op.notIn]: excludeItem };
    }

    if (state || zip || jurisdiction) {
      const excludeItem = await getCustomerExcludeItem(state as string, zip as string, jurisdiction as number);
      whereClause.Item_Number = { [Op.notIn]: excludeItem };
    }

    let searchInUPC = false;
    let orderClause: any = [['Date_Created', 'DESC'] as const];


    if (masterSearch && typeof masterSearch === 'string') {
      const masterArray = masterSearch.split(',').map(i => i.trim());
      whereClause.Item_Number = { [Op.in]: masterArray };
      if (salesCategory.length > 0) {
        whereClause.Sales_Category = { [Op.in]: salesCategory };
      }

    } else {
      if (Array.isArray(salesCategoryId) && salesCategoryId.length > 0 && Array.isArray(priceClassId) && priceClassId.length > 0) {
        // Both filters exist → use OR condition
        whereClause = {
          Sales_Category: { [Op.in]: salesCategoryId },
          Price_Class: { [Op.in]: priceClassId }
        };
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
        } else {
          let globalSearch: any = await Setting.findOne({});
          globalSearch = globalSearch?.dataValues || null;
      
          const term = search.toLowerCase().trim();
          const anywhere = `%${term}%`;
          const starts = `${term}%`;
      
          if (salesCategory.length > 0) {
            whereClause.Sales_Category = { [Op.in]: salesCategory };
          }
      
          // WHERE stays same (your "global" WHERE is already global across these fields)
          whereClause[Op.or] = [
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("Item_Number")), { [Op.like]: anywhere }),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("Description")), { [Op.like]: anywhere }),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("AltDesc")), { [Op.like]: anywhere }),
            Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("ALT_Description2")), { [Op.like]: anywhere }),
          ];
      
          // IMPORTANT: escape single quotes for literal (prevents breaking SQL)
          const esc = (s: string) => s.replace(/'/g, "''");
const startsEsc = esc(starts);
const anywhereEsc = esc(anywhere);
      console.log(globalSearch?.splitSearchOption, 'globalSearch?.globalSearchOption')
          // If globalSearchOption = true => rank matches across all fields
          if ( globalSearch?.splitSearchOption === true) {
            const term = search.toLowerCase().trim();
            const tokens = term.split(/\s+/).filter(Boolean);
          
            // remove the "full-term" OR, otherwise it kills split search results
            delete whereClause[Op.or];
          
            // Each token must match the start of ANY word in ANY of these fields
            whereClause[Op.and] = tokens.map((tok) => {
              const startsWord = `${tok}%`;
              const insideWord = `% ${tok}%`;
          
              return {
                [Op.or]: [
                  // Description
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("Description")), { [Op.like]: startsWord }),
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("Description")), { [Op.like]: insideWord }),
          
                  // AltDesc
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("AltDesc")), { [Op.like]: startsWord }),
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("AltDesc")), { [Op.like]: insideWord }),
          
                  // ALT_Description2
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("ALT_Description2")), { [Op.like]: startsWord }),
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("ALT_Description2")), { [Op.like]: insideWord }),
          
                  // Item_Number (no spaces usually, but keep it)
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("Item_Number")), { [Op.like]: startsWord }),
                  Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("Item_Number")), { [Op.like]: insideWord }),
                ],
              };
            });

       

// build rank across ALL tokens (sum). lower total = better match.
const rankSql = tokens
  .map((tok) => {
    const startsWord = `%${tok}%`;     // 'mar%'
    const insideWord = `% ${tok}%`;   // '% mar%'
    const anywhere   = `%${tok}%`;    // '%mar%'

    // Put your searchable fields here (same as whereClause)
    const fields = ["Description", "AltDesc", "ALT_Description2", "Item_Number"];

    const startsAny = fields
      .map((f) => `LOWER([${f}]) LIKE ${startsWord}`)
      .join(" OR ");

    const wordStartAny = fields
      .map((f) => `LOWER([${f}]) LIKE ${insideWord}`)
      .join(" OR ");

    const containsAny = fields
      .map((f) => `LOWER([${f}]) LIKE ${anywhere}`)
      .join(" OR ");

    return `(CASE
      WHEN (${startsAny}) THEN 0
      WHEN (${wordStartAny}) THEN 1
      WHEN (${containsAny}) THEN 2
      ELSE 3
    END)`;
  })
  .join(" + ");

// order: best rank first, then Description
orderClause = [
  [literal(rankSql), "ASC"],
  [col("Description"), "ASC"],
] as Order;
          
            // optional: order by Description
          }
          
          
          {
            // Your existing rule (Description-first)
            orderClause = [
              [
                Sequelize.literal(`
                  CASE 
                    WHEN LOWER("Description") LIKE '${startsEsc}' THEN 0
                    WHEN LOWER("Description") LIKE '${anywhereEsc}' THEN 1
                    ELSE 2
                  END
                `),
                "ASC",
              ],
              ["Description", "ASC"],
            ];
          }
        }
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
    if (searchInUPC) {
      if (salesCategory.length > 0) {
        whereClause.Sales_Category = { [Op.in]: salesCategory };
      }

    }
    // orderClause = [['Date_Created', 'DESC']] as Order;

    // if (search && !searchInUPC && !masterSearch) {
    //   orderClause = [[col('Description'), 'ASC']] as Order;
    // } else
    // 
    if(!search){
      if (Number(shortBy) === 1) {
        orderClause = [[col('Description'), 'ASC']] as Order;
      } else if (Number(shortBy) === 2) {
        orderClause = [[col('Description'), 'DESC']] as Order;
      }
    }
    


    //  orderClause = [['Date_Created', 'DESC']] as Order;

    // if (search && !searchInUPC && !masterSearch) {
    //   // When searching, sort by description alphabetically to get alphabetical order after common part
    //   orderClause = [[col('Description'), 'DESC']] as Order;
    // } else if (shortBy && Number(shortBy) === 1) {
    //   orderClause = [[col('Description'), 'ASC']] as Order;
    // } else if (shortBy && Number(shortBy) === 2) {
    //   orderClause = [[col('Description'), 'DESC']] as Order;
    // }
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

    console.log(orderClause, 'orderClause')

    const productList = await Inventory.findAll({
      attributes: [
        'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
        'Retail1', 'Retail2', 'Retail3',
        'CasesPerPallet',
        'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost', 'Unit_Price',
        'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
        'OTP_Number', 'Price_Subclass', 'UnitOunces', 'Sales_Category', 'EBT'
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

    // const discountMap = await getDiscountsForItemNumbers(itemNumbers, customerId);

    const userJurisdiction = await getJurisdiction(customerId);

    const topLatestItems = await getTopLatestItems();
    // === Final mapping ===
    const finalProductList = await Promise.all(productList.map(async (e: any) => {
      const itemStr = e.Item_Number.toString();
      const productImage = imageMap.get(itemStr) || null;
      const inventoryOnHand = await getInventoryOnHand(e.Item_Number) || 0;

      let price = await getDiscount(e.Item_Number, customerId);
      if (!price) {
        price = await getFirstValidPrice(e);
      }
      // price = Math.ceil(price * 100) / 100;
      const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
      const productLimit = await getProductLimit(e.Item_Number);
      let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
      taxRate = Math.ceil(taxRate * 100) / 100;

      let allowToOrder = true;
      if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }

      const hasQtyDiscount = await checkQtyDiscount(e.Item_Number, customerId, price + taxRate);
      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

      console.log(e.SalesCategory?.Sales_Category, 'e.Sales_Category', userJurisdiction, 'userJurisdiction')
      let prepaidTaxRate = 0
      if (userJurisdiction != null && e.SalesCategory?.Sales_Category) {
        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e.SalesCategory?.Sales_Category as number);
      }


      return {
        Pack: e.Pack,
        Description: e.Description,
        Item_Number: e.Item_Number,
        CaseCount: e.CaseCount,
        UOM: e.UOM,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
        prepaidTaxRate: prepaidTaxRate,
        Retail1: e.Retail1,
        Retail2: e.Retail2,
        Retail3: e.Retail3,
        CasesPerPallet: e.CasesPerPallet,
        isDiscounted,
        Price1: e.Price1,
        Tax_Rate: taxRate,
        OTP_Number: e.OTP_Number,
        price,
        Unit_Price: e.Unit_Price,
        hasProductLimit: productLimit ? true : false,
        productLimit,
        EBT: e.EBT,
        priceWithTax: price + taxRate,
        BaseCost: e.BaseCost,
        Invoice_Cost: e.Invoice_Cost,
        UnitOunces: e.UnitOunces,
        AvgCost: e.AvgCost,
        NetCost: e.NetCost,
        UPCList: e.UPCList,
        Inventory_OnHand: inventoryOnHand,
        allowToOrder,
        hasQtyDiscount: hasQtyDiscount.allowToDiscount,
        qtyDiscount: hasQtyDiscount,
        showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
        showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
        SalesCategory: e.SalesCategory?.Category_Desc || null,
        PriceClass: e.PriceClass?.Class_Desc || null,
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
        isNewItem,
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

  async getInventoryShowPrepaidTax(user: any) {
    const setting = await Setting.findOne({
      where: { showWithPerpaidTax: true },
    });

    return {
      showWithPerpaidTax: setting ? setting.showWithPerpaidTax : false,
    };
  }

  async getInventoryItemsBySalesMan(
    query: PaginationOptions & { search?: string; masterSearch?: string },
    customerId: number
  ) {
    let {
      page = 1,
      limit = 10,
      salesCategoryId,
      search,
      priceClassId,
      masterSearch,
      salesCategory = [],
      shortBy,
      state,
      zip,
      jurisdiction,
    } = query;

    if (!search)
      return {
        totalCount: 0,
        finalProductList: [],
      };

    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    page = Number(page);
    limit = Number(limit);

    let whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
    };

    if (salesCategory.length > 0) {
      whereClause.Sales_Category = { [Op.in]: salesCategory };
    }

    let searchInUPC = false;

    if (masterSearch && typeof masterSearch === "string") {
      const masterArray = masterSearch.split(",").map((i) => i.trim());
      whereClause.Item_Number = { [Op.in]: masterArray };
    }
    let allExcludedItems: any[] = [];

    if (state || zip || jurisdiction) {
      const customerExcluded = await getCustomerExcludeItem(state as string, zip as string, jurisdiction as number);
      if (customerExcluded && customerExcluded.length > 0) {
        allExcludedItems = allExcludedItems.concat(customerExcluded);
      }
    }
    const userExcluded = await excludeItemByUser(Number(customerId));
    if (userExcluded && userExcluded.length > 0) {
      allExcludedItems = allExcludedItems.concat(userExcluded);
    }

    if (allExcludedItems.length > 0) {
      const uniqueExcluded = [...new Set(allExcludedItems)];
      whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
    }
    if (search) {
      const searchValue = `%${search}%`;

      if (/^\d{8,}$/.test(search)) {
        searchInUPC = true;
      } else {
        whereClause[Op.or] = [
          { Item_Number: { [Op.like]: searchValue } },
          { Description: { [Op.like]: `${search}%` } },
          { ALT_Description2: { [Op.like]: `${search}%` } },
          { AltDesc: { [Op.like]: `${search}%` } },
        ];
      }
    }

    // === UPC JOIN logic ===
    const includeUPC = {
      model: InventoryUPC,
      as: "UPCList",
      attributes: ["UPC_Number"],
      where: {
        Status: 0,
        ...(searchInUPC ? { UPC_Number: { [Op.like]: `%${search}%` } } : {}),
      },
      required: searchInUPC,
    };

    let orderClause: Order = [["Date_Created", "DESC"] as const];
    if (search && !searchInUPC && !masterSearch) {
      // When searching, sort by description alphabetically to get alphabetical order after common part
      orderClause = [[col('Description'), 'ASC']];
    } else if (shortBy && Number(shortBy) === 1) {
      orderClause = [[col('Description'), 'ASC']];
    } else if (shortBy && Number(shortBy) === 2) {
      orderClause = [[col('Description'), 'DESC']];
    }

    // === Count Query ===
    let totalCount = 0;
    if (searchInUPC) {
      const counted = await Inventory.findAll({
        attributes: ["Item_Number"],
        where: whereClause,
        include: [{ ...includeUPC, attributes: [] }],
        group: ["Inventory.Item_Number"],
        raw: true,
        logging: false,
      });
      totalCount = counted.length;
    } else {
      totalCount = await Inventory.count({
        where: whereClause,
        logging: false,
      });
    }



    // === Product List Query ===
    const productList = await Inventory.findAll({
      attributes: [
        "Pack",
        "Description",
        "Item_Number",
        "CaseCount",
        "UOM",
        "Price1",
        "Price2",
        "BaseCost",
        "Invoice_Cost",
        "AvgCost",
        "NetCost",
        "eCommerce",
        "I_Inactive",
        "Date_Created",
        "OTP_Number",
        "Price_Subclass",
        "UnitOunces",
        "EBT",
      ],
      where: whereClause,
      include: [
        { model: SalesCategory, as: "SalesCategory", attributes: ["Category_Desc", "Sales_Category"], required: false },
        { model: PriceClass, as: "PriceClass", attributes: ["Class_Desc"], required: false },
        { model: InventoryStatus, as: "inventoryStatus", attributes: ["Inventory_OnHand"], required: false },
        includeUPC,
      ],
      order: orderClause,
      limit,
      offset: (page - 1) * limit,
      logging: false,
    });

    const itemNumbers = productList.map((e) => e.Item_Number);
    const otpNumbers = productList.map((e) => e.OTP_Number);

    // === Run in parallel instead of sequential ===
    const [productImages, discountMap, userJurisdiction, topLatestItems] =
      await Promise.all([
        ProductImage.findAll({
          where: { product_number: { [Op.in]: itemNumbers.map(String) }, isAllow: true },
        }),
        getDiscountsForItemNumbers(itemNumbers, customerId),
        getJurisdiction(customerId),
        getTopLatestItems(),
      ]);


    // === Pre-map images ===
    const imageMap = new Map(productImages.map((img) => [img.product_number, img]));

    // === Final mapping (parallel-friendly but sequential for price logic) ===
    const finalProductList = await Promise.all(
      productList.map(async (e: any) => {
        const itemStr = e.Item_Number.toString();
        const productImage = imageMap.get(itemStr) || null;
        const inventoryOnHand = await getInventoryOnHand(e.Item_Number);

        // Price & discount checks
        let price = discountMap[e.Item_Number] ?? (await getFirstValidPrice(e));
        // price = Math.ceil(price * 100) / 100;
        let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
        taxRate = Math.ceil(taxRate * 100) / 100;

        const [isDiscounted, productLimit, hasQtyDiscount] = await Promise.all([
          hasDiscountedItem(e.Item_Number, e.Price_Subclass),
          getProductLimit(e.Item_Number),
          checkQtyDiscount(e.Item_Number, customerId, price + taxRate),
        ]);

        let allowToOrder = true;
        if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
          allowToOrder = false;
        }

        const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

        let prepaidTaxRate = 0
        console.log(e.SalesCategory?.Sales_Category, 'e.SalesCategory?.Sales_Category----->SALES', userJurisdiction, 'userJurisdiction')
        if (userJurisdiction != null && e.SalesCategory) {
          prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e.SalesCategory?.Sales_Category as number);
        }

        return {
          Pack: e.Pack,
          Description: e.Description,
          Item_Number: e.Item_Number,
          CaseCount: e.CaseCount,
          UOM: e.UOM,
          EBT: e.EBT,
          isDiscounted,
          Price1: e.Price1,
          hasPrepaidTaxRate: prepaidTaxRate ? true : false,
          prepaidTaxRate: prepaidTaxRate,
          Tax_Rate: taxRate,
          OTP_Number: e.OTP_Number,
          price,
          hasProductLimit: !!productLimit,
          productLimit,
          priceWithTax: price + taxRate,
          BaseCost: e.BaseCost,
          Invoice_Cost: e.Invoice_Cost,
          UnitOunces: e.UnitOunces,
          AvgCost: e.AvgCost,
          NetCost: e.NetCost,
          UPCList: e.UPCList,
          Inventory_OnHand: inventoryOnHand,
          allowToOrder,
          hasQtyDiscount: hasQtyDiscount.allowToDiscount,
          qtyDiscount: hasQtyDiscount,
          showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
          showLowStock:
            wareHouseSetting?.salesRep?.showStock
              ? false
              : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
          showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
          SalesCategory: e.SalesCategory?.Category_Desc || null,
          PriceClass: e.PriceClass?.Class_Desc || null,
          showDistributorImage: productImage?.isAllow ?? false,
          distributorImage: productImage?.img_url || null,
          masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
          isNewItem,
        };
      })
    );

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      finalProductList,
    };
  }


  async addToCart(cartData: AddToCartRequest & { Customer_Number: number }, salesId: number) {
    // Check if item already exists in cart for this customer
    cartData.TotalPrice = Number(cartData.TotalPrice);
    cartData.TotalPriceWithTax = Number(cartData.TotalPriceWithTax);
    cartData.discount = Number(cartData.discount);
    cartData.originalPrice = Number(cartData.originalPrice);
    cartData.Qty = Number(cartData.Qty);
    const existingCartItem = await CustomerCart.findOne({
      where: {
        Customer_Number: cartData.Customer_Number,
        Item_Number: cartData.Item_Number,
        isActive: true
      }
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQty = existingCartItem.Qty + cartData.Qty;
      const newTotalPrice = Number(existingCartItem.TotalPrice) + Number(cartData.TotalPrice);
      const newTotalPriceWithTax = Number(existingCartItem.TotalPriceWithTax) + Number(cartData.TotalPriceWithTax);
      await existingCartItem.update({
        Qty: newQty,
        TotalPrice: newTotalPrice,
        TotalPriceWithTax: newTotalPriceWithTax,
        discount: cartData.discount || 0,
        originalPrice: cartData.originalPrice || 0,
        TotalprepaidTaxRate: cartData.TotalprepaidTaxRate || 0,
        prepaidTaxRate: cartData.prepaidTaxRate || 0,
      });

      return existingCartItem;
    } else {
      // Create new cart item
      const newCartItem = await CustomerCart.create({
        ...cartData, placedBySalesPerson: true, salesPersonNumber: salesId,
        discount: cartData.discount || 0,
        originalPrice: cartData.originalPrice || 0
      });
      return newCartItem;
    }
  }


  async getCartItems(customerNumber: number) {
    const cartItems: any = await CustomerCart.findAll({
      where: {
        Customer_Number: customerNumber,
        isActive: true,
        type: 'order'
      },
      order: [['createdAt', 'DESC']]
    });

    let todayTotalAmount = 0;

    const start = moment().startOf("week").toDate(); // start of this week
    const end = moment().endOf("week").toDate();     // end of this week

    const weekUserOrders: any[] = await OrderHistory.findAll({
      where: {
        C_Number: customerNumber,
        isActive: true,
        type: "order",
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      order: [["createdAt", "DESC"]],
    });

    if (weekUserOrders && weekUserOrders?.length > 0) {
      todayTotalAmount = weekUserOrders.reduce(
        (sum: any, item: any) => sum + Number(item.orderPrice),
        0
      );
    }

    const finalCartItems = await Promise.all(cartItems.map(async (es: any) => {
      const e: any = es.dataValues
      const productImage = await ProductImage.findOne({
        where: {
          product_number: e.Item_Number.toString(),
          isAllow: true
        },
      });

      let price = await getDiscount(Number(e.Item_Number), Number(e.Customer_Number))
      if (!price) {
        const data = await Inventory.findByPk(e.Item_Number)
        price = await getFirstValidPrice(data?.dataValues)
      }
      // price = Math.ceil(price * 100) / 100;
      let product: any = await Inventory.findOne({
        where: {
          Item_Number: e.Item_Number
        },

        include: [{
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          where: {
            Status: 0,
          },
          required: false,

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


        ]
      })
      product = product?.dataValues || null;


      let itemInActive = await isItemInActive(e.Item_Number)
      const inventoryOnHand = await getInventoryOnHand(e.Item_Number)
      let wareHouseSetting: any = await Setting.findOne({});
      wareHouseSetting = wareHouseSetting?.dataValues || null;
      let allowToOrder = true;
      console.log(wareHouseSetting?.salesRep)

      if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
        allowToOrder = true;
      }
      else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }

      const topLatestItems = await getTopLatestItems();
      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

      const productLimit = await getProductLimit(e.Item_Number);
      const hasQtyDiscount = await checkQtyDiscount(product.Item_Number, customerNumber, Number(price) + Number(e.Tax_Rate));
      const isDiscounted = await hasDiscountedItem(product.Item_Number, product.Price_Subclass);

      let prepaidTaxRate = 0
      const userJurisdiction = await getJurisdiction(customerNumber);


      console.log(product, 'product.salesCategory')
      if (userJurisdiction != null && product.Sales_Category) {
        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, product?.Sales_Category);
      }

      return {

        isNewItem,
        Description: product.Description,
        isDiscounted,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
        prepaidTaxRate: prepaidTaxRate,
        // Description: product.Description,
        Item_Number: e.Item_Number,
        CaseCount: product.CaseCount,
        UOM: product.UOM,
        pack: product.Pack,
        size: product.Size,
        Price1: product.Price1,
        upc: product?.UPCList,
        price: price,
        Unit_Price: product.Unit_Price,
        salesCategory: product.SalesCategory?.Category_Desc,
        priceClass: product.PriceClass?.Class_Desc,
        unitOunces: product.UnitOunces,
        BaseCost: product.BaseCost,
        Invoice_Cost: product.Invoice_Cost,
        hasProductLimit: productLimit ? true : false,
        productLimit,
        Inventory_OnHand: inventoryOnHand || 0,
        allowToOrder,
        showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
        showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
        itemInActive,
        AvgCost: product.AvgCost,
        NetCost: product.NetCost,
        isPriceChanged: price != e?.originalPrice,
        UPCList: product.UPCList,
        oldPrice: Number(e?.originalPrice),
        newPrice: price,
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${product.UPCList?.[0]?.UPC_Number}.jpg`,
        Product: e,
        size1: product.Size,
        hasQtyDiscount: hasQtyDiscount.allowToDiscount,
        qtyDiscount: hasQtyDiscount,
      }
    }))
    
    let findTheLimit: any = await Retailer.findOne({
      where: {
        Customer_Number: customerNumber,
        isActive: true
      }
    })



    console.log(findTheLimit, 'findTheLimit-->')

    let globalMinOrderAmount: any = {};

    if (!findTheLimit) {
      globalMinOrderAmount = await Setting.findOne({

        attributes: ['itemGlobal']
      })

      if(globalMinOrderAmount){
        globalMinOrderAmount = globalMinOrderAmount?.dataValues || null;
      }
    }
    if (findTheLimit) {
      findTheLimit = findTheLimit?.dataValues || null;
      
      if (!findTheLimit?.minOrderAmount || findTheLimit?.minOrderAmount == 0) {

        globalMinOrderAmount  = await Setting.findOne({

          attributes: ['itemGlobal']
        })
        console.log(globalMinOrderAmount, 'globalMinOrderAmount-->')
        globalMinOrderAmount = globalMinOrderAmount?.dataValues || null;
        findTheLimit = {
          maxOrderLimit: globalMinOrderAmount?.itemGlobal?.maxOrderLimit || 0,
          minOrderAmount: globalMinOrderAmount?.itemGlobal?.MiniMumOrderAmount || 0,
        };
      }


    }
    else {
      findTheLimit = {
        maxOrderLimit: globalMinOrderAmount?.itemGlobal?.maxOrderLimit || 0,
        minOrderAmount: globalMinOrderAmount?.itemGlobal?.MiniMumOrderAmount || 0,
      };
    }


console.log(findTheLimit, 'findTheLimit-->22')

    const totalItems = cartItems.reduce((sum: any, item: any) => sum + item.Qty, 0);
    const totalAmount = cartItems.reduce((sum: any, item: any) => sum + Number(item.TotalPrice), 0);
    const totalAmountWithTax = cartItems.reduce((sum: any, item: any) => sum + Number(item.TotalPriceWithTax), 0);
    return {
      finalCartItems,
      totalItems,
      totalAmountWithTax,
      userItemLimitQty: findTheLimit?.maxOrderLimit,
      userLimitMinOrderAmount: (findTheLimit?.minOrderAmount || 0) - todayTotalAmount,
      totalAmount
    };
  }

  async updateCartItem(cartItemId: number, updateData: UpdateCartItemRequest) {
    const cartItem = await CustomerCart.findByPk(cartItemId);

    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    if (!cartItem.isActive) {
      throw new AppError("Cart item is inactive", 400);
    }

    await cartItem.update(updateData);
    return cartItem;
  }

  async removeFromCart(cartItemId: number): Promise<CartResponse> {
    const cartItem = await CustomerCart.findByPk(cartItemId);

    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    // Soft delete by setting isActive to false
    await cartItem.update({ isActive: false });
    return { message: "Item removed from cart successfully" };
  }

  async clearCart(customerNumber: number): Promise<CartResponse> {
    const result = await CustomerCart.update(
      { isActive: false },
      {
        where: {
          Customer_Number: customerNumber,
          isActive: true
        }
      }
    );

    return { message: "Cart cleared successfully", affectedRows: result[0] };
  }

  async getCartItemById(cartItemId: number) {
    const cartItem = await CustomerCart.findByPk(cartItemId);

    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    return cartItem;
  }

  async setSalesSession(userId: number, customerId: number) {
    const isSessionActive = await SalesSession.findOne({ where: { userId: userId } });
    let storeDetail: any = null;
    if (isSessionActive) {
      storeDetail = await SalesSession.update({ currentCustomerId: customerId }, { where: { userId: userId } });
    }
    else {
      storeDetail = await SalesSession.create({ userId: userId, currentCustomerId: customerId });
    }
    const store = await Customer.findOne({
      where: { C_Number: customerId }, attributes: ['C_CoName', 'C_Number', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'Jurisdiction_State', 'C_Phone', 'LastBalance', 'C_Salesman', 'C_Name', 'C_Number', 'C_OrderDaySequence', 'C_OrderDay'],
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
    console.log(store, 'strore -->')
    return store
  }


  async getOrderHistoryByProductNumber(productNumber: number, retailerId: number) {
    // Find order details for the specific product with order header information
    const orderDetails = await OrderDetail.findAll({
      where: {
        Item_Number: productNumber,
      },
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
        'ItemDescription',
        'CaseWeight',
        'CaseCount',

      ],
      include: [
        {
          model: OrderHeader,
          as: 'orderHeader',
          where: { C_Number: retailerId },
          attributes: ['Order_Number', 'Order_Date', 'C_Number'],
          required: true
        },
        {
          model: Inventory,
          as: 'inventory',
          attributes: [
            'Item_Number',
            'Description',
          ],
          include: [
            {
              model: InventoryUPC,
              as: 'UPCList',
              attributes: ['UPC_Number'],
              where: {
                Status: 0,
              },
              required: false
            }
          ]
        }
      ],
      order: [['Order_Number', 'DESC']],
      limit: 30
    });

    // Add product image to each order detail
    const result = await Promise.all(orderDetails.map(async (detail: any) => {
      // Get product image
      const productImage = await ProductImage.findOne({
        where: {
          product_number: detail.Item_Number.toString(),
          isAllow: true
        },
      });

      return {
        ...detail.toJSON(),
        isDistributorImageShow: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${detail.inventory.UPCList?.[0]?.UPC_Number}.jpg`,
      };
    }));

    return result;
  }



  async getCustomerListAsPerSalesRep(userId: number, query: PaginationOptions & { routes?: number[], stopNumber?: number[] }) {
    const { routes, stopNumber } = query;

    const user = await WebUsers.findByPk(userId, {
      attributes: ['salesRepNumber']
    });

    if (!user || !user.salesRepNumber) {
      throw new AppError("Sales representative not found for this user", 404);
    }

    const salesRepList: string[] = pgArrayToJsArray(user.salesRepNumber);
    console.log(salesRepList, '-->')
    const newSalesRepArray = salesRepList.map(Number);
    const whereClause: any = {
      C_Inactive: false,
      C_Salesman: { [Op.in]: newSalesRepArray }
    };

    if (query.search || query.searchString) {
      const searchTerm = query.search || query.searchString;
      whereClause[Op.or] = [
        { C_Number: { [Op.like]: `%${searchTerm}%` } },
        { C_Name: { [Op.like]: `%${searchTerm}%` } },
        { C_CoName: { [Op.like]: `%${searchTerm}%` } },
        { C_City: { [Op.like]: `%${searchTerm}%` } },
        { C_State: { [Op.like]: `%${searchTerm}%` } },
        { C_Email: { [Op.like]: `%${searchTerm}%` } },
        { C_Address: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || Number(query.limit) || 10;
    const offset = (page - 1) * pageSize;

    // === Route Filter using IN operator ===
    const routeWhere: any = {};
    if (Array.isArray(routes) && routes.length > 0) {
      routeWhere.Route_Number = { [Op.in]: routes };
    }
    if (Array.isArray(stopNumber) && stopNumber.length > 0) {
      routeWhere.Stop_Number = { [Op.in]: stopNumber };
    }

    const customerList = await Customer.findAll({
      where: whereClause,
      attributes: [
        'C_Number', 'C_Name', 'C_CoName', 'C_Address', 'C_City',
        'C_State', 'C_Zip', 'C_Country', 'C_Email', 'C_Phone', 'C_PhoneMobile', 'C_DateCreated'
      ],
      include: [
        {
          model: CustomerRoute,
          as: 'Routes',
          attributes: ['Route_Number', 'Stop_Number'],
          ...(Object.keys(routeWhere).length > 0 ? { where: routeWhere } : {})
        }
      ],
      limit: pageSize,
      offset,
      order: query.order || [['C_Name', 'ASC']],
    });

    const totalCount = await Customer.count({
      where: whereClause,
      include: Object.keys(routeWhere).length > 0 ? [{
        model: CustomerRoute,
        as: 'Routes',
        where: routeWhere
      }] : undefined,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      customers: customerList,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }


  // async getCustomerOrderedProducts(customerId: number, query: PaginationOptions) {

  //   let { page = 1, limit = 10, search, filter } = query;
  //   page = Number(page);
  //   limit = Number(limit);

  //   // Calculate date range based on filter
  //   let dateFilter: any = {};
  //   if (filter) {
  //     const currentDate = new Date();
  //     let startDate: Date | undefined;

  //     switch (filter) {
  //       case '1week':
  //         startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '2week':
  //         startDate = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '3week':
  //         startDate = new Date(currentDate.getTime() - 21 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '4week':
  //         startDate = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '5week':
  //         startDate = new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '6week':
  //         startDate = new Date(currentDate.getTime() - 42 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '7week':
  //         startDate = new Date(currentDate.getTime() - 49 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '8week':
  //         startDate = new Date(currentDate.getTime() - 56 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '9week':
  //         startDate = new Date(currentDate.getTime() - 63 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '10week':
  //         startDate = new Date(currentDate.getTime() - 70 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '11week':
  //         startDate = new Date(currentDate.getTime() - 77 * 24 * 60 * 60 * 1000);
  //         break;
  //       case '12week':
  //         startDate = new Date(currentDate.getTime() - 84 * 24 * 60 * 60 * 1000);
  //         break;
  //       default:
  //         // No filter applied
  //         break;
  //     }

  //     if (startDate) {
  //       dateFilter = {
  //         Order_Date: {
  //           [Op.gte]: startDate
  //         }
  //       };
  //     }
  //   }

  //   // Build where clause for OrderHeader
  //   const orderHeaderWhereClause: any = {
  //     C_Number: customerId,
  //     ...dateFilter
  //   };

  //   // Get order headers with pagination
  //   const { count: totalCount, rows: orderHeaders } = await OrderHeader.findAndCountAll({
  //     where: orderHeaderWhereClause,
  //     attributes: [
  //       'Order_Number',
  //       'Order_Date',
  //       'Invoice_Total',
  //       'Order_Source'
  //     ],
  //     order: [['Order_Date', 'DESC']],
  //     limit,
  //     offset: (page - 1) * limit
  //   });

  //   // Get order numbers to fetch details
  //   const orderNumbers = orderHeaders.map((header: any) => header.Order_Number);

  //   if (orderNumbers.length === 0) {
  //     return {
  //       totalCount: 0,
  //       page,
  //       limit,
  //       totalPages: 0,
  //       data: []
  //     };
  //   }

  //   // Build where clause for OrderDetail
  //   let orderDetailWhereClause: any = {
  //     Order_Number: { [Op.in]: orderNumbers }
  //   };

  //   // Add search functionality for OrderDetail
  //   if (search) {
  //     orderDetailWhereClause[Op.or] = [
  //       { Item_Number: { [Op.like]: `%${search}%` } },
  //       { ItemDescription: { [Op.like]: `%${search}%` } }
  //     ];
  //   }

  //   // Get order details with inventory information
  //   const orderDetails = await OrderDetail.findAll({
  //     where: orderDetailWhereClause,
  //     attributes: [
  //       'Order_Number',
  //       'Line_Number',
  //       'Item_Number',
  //       'Quantity_Ordered',
  //       'Quantity_Shipped',
  //       'Price',
  //       'ItemDescription',
  //       'CaseCount',
  //       'Pack'
  //     ],
  //     include: [
  //       {
  //         model: Inventory,
  //         as: 'inventory',
  //         attributes: [
  //           'Item_Number',
  //           'Description',
  //           'ALT_Description2',
  //           'Pack',
  //           'CaseCount',
  //           'UOM',
  //           'Price1',
  //           'Price2',
  //           'BaseCost',
  //           'Invoice_Cost',
  //           'AvgCost',
  //           'NetCost',
  //           'eCommerce',
  //           'I_Inactive',
  //           'Date_Created',
  //           'OTP_Number',
  //           'Sales_Category',
  //           'Price_Class'
  //         ],
  //         required: true,
  //         where: search ? {
  //           [Op.or]: [
  //             { Item_Number: { [Op.like]: `%${search}%` } },
  //             { Description: { [Op.like]: `%${search}%` } },
  //             { ALT_Description2: { [Op.like]: `%${search}%` } }
  //           ]
  //         } : {},
  //         include: [
  //           {
  //             model: SalesCategory,
  //             as: 'SalesCategory',
  //             attributes: ['Category_Desc'],
  //             required: false
  //           },
  //           {
  //             model: PriceClass,
  //             as: 'PriceClass',
  //             attributes: ['Class_Desc'],
  //             required: false
  //           },
  //           {
  //             model: InventoryUPC,
  //             as: 'UPCList',
  //             attributes: ['UPC_Number'],
  //             where: {
  //               Status: 0
  //             },
  //             required: false
  //           }
  //         ]
  //       }
  //     ],
  //     order: [['Order_Number', 'DESC'], ['Line_Number', 'ASC']]
  //   });

  //   // Process the results to include product images and format the data
  //   const finalOrderDetails = await Promise.all(orderDetails.map(async (detail: any) => {

  //     const itemNumbers = [detail.Item_Number];
  //     const otpNumbers = [detail.inventory.OTP_Number];

  //     const productImages = await ProductImage.findAll({
  //       where: {
  //         product_number: { [Op.in]: itemNumbers.map(String) },
  //         isAllow: true
  //       }
  //     });
  //     const imageMap = new Map(productImages.map(img => [img.product_number, img]));

  //     const discountMap = await getDiscountsForItemNumbers([detail.Item_Number], customerId);
  //   const inventoryMap = await getInventoryMap([detail.Item_Number]);
  //   const taxMap = await getTaxRateMap([detail.inventory.OTP_Number] as number[]);


  //     // Find the corresponding order header
  //     const orderHeader = orderHeaders.find((header: any) => header.Order_Number === detail.Order_Number);

  //     return {
  //       // Order information
  //       Order_Number: detail.Order_Number,
  //       Order_Date: (orderHeader as any)?.Order_Date,
  //       Invoice_Total: (orderHeader as any)?.Invoice_Total,
  //       Order_Source: (orderHeader as any)?.Order_Source == 12 ? 'App ' : (orderHeader as any).Order_Source == 13 ? 'Web' : 'ERP',

  //       // Order detail information
  //       Line_Number: detail.Line_Number,
  //       Item_Number: detail.Item_Number,
  //       Quantity_Ordered: detail.Quantity_Ordered,
  //       Quantity_Shipped: detail.Quantity_Shipped,
  //       Price: detail.Price,
  //       ItemDescription: detail.ItemDescription,
  //       CaseCount: detail.CaseCount,
  //       Pack: detail.Pack,

  //       // Inventory information
  //       Description: detail.inventory.Description,
  //       ALT_Description2: detail.inventory.ALT_Description2,
  //       UOM: detail.inventory.UOM,
  //       Price1: detail.inventory.Price1,
  //       Price2: detail.inventory.Price2,
  //       BaseCost: detail.inventory.BaseCost,
  //       Invoice_Cost: detail.inventory.Invoice_Cost,
  //       AvgCost: detail.inventory.AvgCost,
  //       NetCost: detail.inventory.NetCost,
  //       eCommerce: detail.inventory.eCommerce,
  //       I_Inactive: detail.inventory.I_Inactive,
  //       Date_Created: detail.inventory.Date_Created,
  //       OTP_Number: detail.inventory.OTP_Number,

  //       // Calculated fields


  //       // Category information
  //       SalesCategory: detail.inventory.SalesCategory?.Category_Desc || null,
  //       PriceClass: detail.inventory.PriceClass?.Class_Desc || null,

  //       // UPC information
  //       UPCList: detail.inventory.UPCList,

  //       // Image information
  //       showDistributorImage: productImage?.isAllow ?? false,
  //       distributorImage: productImage?.img_url || null,
  //       masterImage: `${process.env.AZUREIMAGESERVER}${detail.inventory.UPCList?.[0]?.UPC_Number}.jpg`
  //     };
  //   }));

  //   return {
  //     totalCount: finalOrderDetails.length,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(finalOrderDetails.length / limit),
  //     data: finalOrderDetails,
  //     filter: filter || 'all',
  //     search: search || ''
  //   };

  // }

  async getCustomerOrderedProducts(
    customerId: number,
    query: PaginationOptions & {
      search?: string,
      filter?: '1week' | '2week' | '3week' | '4week' | '5week' | '6week' | '7week' | '8week' | '9week' | '10week' | '11week' | '12week'
    }
  ) {
    let { page = 1, limit = 10, search, filter, state = '', zip = '', jurisdiction = '', salesCategoryId = [], priceClassId = [] } = query;
    page = Number(page);
    limit = Number(limit);

    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    if (Array.isArray(salesCategoryId)) {
      salesCategoryId = salesCategoryId.map(Number);
    }
    if (Array.isArray(priceClassId)) {
      priceClassId = priceClassId.map(Number);
    }

    // Calculate date range based on filter
    let dateFilter: any = {};
    if (filter) {
      const currentDate = new Date();
      let startDate: Date | undefined;

      switch (filter) {
        case '1week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '2week':
          startDate = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case '3week':
          startDate = new Date(currentDate.getTime() - 21 * 24 * 60 * 60 * 1000);
          break;
        case '4week':
          startDate = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000);
          break;
        case '5week':
          startDate = new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000);
          break;
        case '6week':
          startDate = new Date(currentDate.getTime() - 42 * 24 * 60 * 60 * 1000);
          break;
        case '7week':
          startDate = new Date(currentDate.getTime() - 49 * 24 * 60 * 60 * 1000);
          break;
        case '8week':
          startDate = new Date(currentDate.getTime() - 56 * 24 * 60 * 60 * 1000);
          break;
        case '9week':
          startDate = new Date(currentDate.getTime() - 63 * 24 * 60 * 60 * 1000);
          break;
        case '10week':
          startDate = new Date(currentDate.getTime() - 70 * 24 * 60 * 60 * 1000);
          break;
        case '11week':
          startDate = new Date(currentDate.getTime() - 77 * 24 * 60 * 60 * 1000);
          break;
        case '12week':
          startDate = new Date(currentDate.getTime() - 84 * 24 * 60 * 60 * 1000);
          break;
        default:
          // No filter applied
          break;
      }

      if (startDate) {
        dateFilter = {
          Order_Date: {
            [Op.gte]: startDate
          }
        };
      }
    }

    // First, get all order numbers that match the date filter and customer
    const allMatchingOrderHeaders = await OrderHeader.findAll({
      where: {
        C_Number: customerId,
        ...dateFilter
      },
      include: [
        {
          model: OrderDetail,
          as: 'orderDetails',
          required: true,
          attributes: [],
          where: {
            ...(salesCategoryId && salesCategoryId.length > 0
              ? { Sales_Category: { [Op.in]: salesCategoryId } }
              : {})
          },
          include: [{
            model: Inventory,
            as: 'inventory',
            where: {
              ...(priceClassId && priceClassId.length > 0
                ? { Price_Class: { [Op.in]: priceClassId } }
                : {})
            }
          }]
        }
      ],
      attributes: ['Order_Number', 'Order_Date', 'Invoice_Total', 'Order_Source'],
      order: [['Order_Date', 'DESC']],
      raw: true
    });

    const allOrderNumbers = allMatchingOrderHeaders.map((header: any) => header.Order_Number);

    if (allOrderNumbers.length === 0) {
      return {
        totalCount: 0,
        page,
        limit,
        totalPages: 0,
        data: [],
        filter: filter || 'all',
        search: search || ''
      };
    }

    // Build where clause for OrderDetail

    let matchingInventoryItems: any = [];
    // Add search functionality for OrderDetail
    let matchingItemNumbers: number[] | undefined = undefined;

    let allExcludedItems: any[] = [];
    let whereClause: any = {};
    if (state || zip || jurisdiction) {
      const customerExcluded = await getCustomerExcludeItem(state as string, zip as string, jurisdiction as number);
      if (customerExcluded && customerExcluded.length > 0) {
        allExcludedItems = allExcludedItems.concat(customerExcluded);
      }
    }
    const userExcluded = await excludeItemByUser(Number(customerId));
    if (userExcluded && userExcluded.length > 0) {
      allExcludedItems = allExcludedItems.concat(userExcluded);
    }

    if (allExcludedItems.length > 0) {
      const uniqueExcluded = [...new Set(allExcludedItems)];
      whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
    }
    if (search) {
      const matchingInventoryItems = await Inventory.findAll({

        where: {
          I_Inactive: 0,
          ...whereClause,
          [Op.or]: [
            { Item_Number: { [Op.like]: `%${search}%` } },

          ],
        },
        attributes: ['Item_Number'],
        raw: true,
      });

      matchingItemNumbers = matchingInventoryItems.map(item => item.Item_Number);
    }


    let orderDetailWhereClause: any = {
      Order_Number: { [Op.in]: allOrderNumbers },
      ...whereClause,
    };

    if (matchingItemNumbers && matchingItemNumbers.length > 0) {
      orderDetailWhereClause.Item_Number = { [Op.in]: matchingItemNumbers };
    }
    // Get total count of order details
    const totalCount = await OrderDetail.count({
      where: orderDetailWhereClause,
      distinct: true,
      col: 'Item_Number'
    });


    const orderDetails: any = await OrderDetail.findAll({
      where: orderDetailWhereClause,
      attributes: [
        ['Item_Number', 'Item_Number'],
        [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'total_Ordered'],
      ],
      group: ['OrderDetail.Item_Number'],
      order: [['total_Ordered', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      raw: true,
    });


    await Promise.all(
      orderDetails.map(async (detail: any) => {
        const inventoryData = await getInventoryFullItemNumber(detail.Item_Number);
        detail.inventory = inventoryData;
      })
    );





    const itemNumbers = orderDetails.map((e: any) => e.Item_Number);
    const otpNumbers = orderDetails.map((e: any) => e.inventory.OTP_Number);

    console.log(otpNumbers, 'otpNumbers')

    const productImages = await ProductImage.findAll({
      where: {
        product_number: { [Op.in]: itemNumbers.map(String) },
        isAllow: true
      }
    });
    const imageMap = new Map(productImages.map(img => [img.product_number, img]));
    const discountMap = await getDiscountsForItemNumbers(itemNumbers, customerId);
    const userJurisdiction = await getJurisdiction(customerId);
    const topLatestItems = await getTopLatestItems();

    // Process the results to include product images and format the data
    const finalOrderDetails = await Promise.all(orderDetails.map(async (detail: any) => {
      console.log(detail, 'detail--->')
      const itemStr = detail.Item_Number.toString();
      const productImage = imageMap.get(itemStr) || null;
      const inventoryOnHand = await getInventoryOnHand(detail.Item_Number) || 0;
      let price = await getDiscount(detail.Item_Number, customerId) ?? await getFirstValidPrice(detail);

      if (!price) {
        let tempDetail: any = await Inventory.findOne({
          where: {
            Item_Number: detail.Item_Number
          },
        });
        price = await getFirstValidPrice(tempDetail);
      }






      const taxRate = await getTaxRateV1(detail.inventory.OTP_Number, userJurisdiction as number, detail.Item_Number, price);


      const isDiscounted = await hasDiscountedItem(detail.Item_Number, detail.inventory.Price_Subclass);
      let allowToOrder = true;
      if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }
      const productLimit = await getProductLimit(detail.Item_Number);
      let hasQtyDiscount = await checkQtyDiscount(detail.Item_Number, customerId, price + taxRate);
      // Find the corresponding order header
      const orderHeader = allMatchingOrderHeaders.find((header: any) => header.Order_Number === detail.Order_Number);

      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === detail.Item_Number);

      let prepaidTaxRate = 0
      if (userJurisdiction != null && detail.inventory.Sales_Category) {
        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, detail.inventory?.Sales_Category);
      }



      return {
        isNewItem,
        // Order information
        Order_Number: detail.Order_Number,
        Order_Date: (orderHeader as any)?.Order_Date,
        Invoice_Total: (orderHeader as any)?.Invoice_Total,

        price,
        priceWithTax: price + taxRate,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
        prepaidTaxRate: prepaidTaxRate,
        isDiscounted,
        Tax_Rate: taxRate,
        ProductInActive: detail.inventory.I_Inactive,
        showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
        showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
        Pack: detail.inventory.Pack,
        Inventory_OnHand: inventoryOnHand,

        // Order detail information
        Line_Number: detail.Line_Number,
        Item_Number: detail.Item_Number,
        Quantity_Ordered: detail.Quantity_Ordered,
        Quantity_Shipped: detail.Quantity_Shipped,
        Price: detail.Price,
        ItemDescription: detail.ItemDescription,
        CaseCount: detail.inventory.CaseCount,
        allowToOrder,
        // Inventory information
        Description: detail.inventory.Description,
        ALT_Description2: detail.inventory.ALT_Description2,
        UOM: detail.inventory.UOM,
        Price1: detail.inventory.Price1,
        Price2: detail.inventory.Price2,
        BaseCost: detail.inventory.BaseCost,
        Invoice_Cost: detail.inventory.Invoice_Cost,
        AvgCost: detail.inventory.AvgCost,
        NetCost: detail.inventory.NetCost,
        eCommerce: detail.inventory.eCommerce,
        I_Inactive: detail.inventory.I_Inactive,
        Date_Created: detail.inventory.Date_Created,
        OTP_Number: detail.inventory.OTP_Number,

        // Calculated fields        hasProductLimit: productLimit ? true : false,
        hasProductLimit: productLimit ? true : false,
        productLimit: productLimit,
        totalOrder: detail.total_Ordered,
        // Category information
        SalesCategory: detail.inventory.SalesCategory?.Category_Desc || null,
        PriceClass: detail.inventory.PriceClass?.Class_Desc || null,
        hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
        qtyDiscount: hasQtyDiscount,
        // UPC information
        UPCList: detail.inventory.UPCList,
        UnitOunces: detail.inventory.UnitOunces,
        // Image information
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${detail.inventory.UPCList?.[0]?.UPC_Number}.jpg`
      };
    }));

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: finalOrderDetails,
      filter: filter || 'all',
      search: search || ''
    };
  }

  async getCustomerOrderedProductsV1(
    customerId: number,
    query: PaginationOptions & {
      search?: string,
      filter?: '1week' | '2week' | '3week' | '4week' | '5week' | '6week' | '7week' | '8week' | '9week' | '10week' | '11week' | '12week'
    }
  ) {
    let { page = 1, limit = 10, search, filter, state = '', zip = '', jurisdiction = '', salesCategoryId = [], priceClassId = [] } = query;
    page = Number(page);
    limit = Number(limit);

    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    // Calculate date range based on filter
    let dateFilter: any = {};
    if (filter) {
      const currentDate = new Date();
      let startDate: Date | undefined;

      switch (filter) {
        case '1week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '2week':
          startDate = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case '3week':
          startDate = new Date(currentDate.getTime() - 21 * 24 * 60 * 60 * 1000);
          break;
        case '4week':
          startDate = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000);
          break;
        case '5week':
          startDate = new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000);
          break;
        case '6week':
          startDate = new Date(currentDate.getTime() - 42 * 24 * 60 * 60 * 1000);
          break;
        case '7week':
          startDate = new Date(currentDate.getTime() - 49 * 24 * 60 * 60 * 1000);
          break;
        case '8week':
          startDate = new Date(currentDate.getTime() - 56 * 24 * 60 * 60 * 1000);
          break;
        case '9week':
          startDate = new Date(currentDate.getTime() - 63 * 24 * 60 * 60 * 1000);
          break;
        case '10week':
          startDate = new Date(currentDate.getTime() - 70 * 24 * 60 * 60 * 1000);
          break;
        case '11week':
          startDate = new Date(currentDate.getTime() - 77 * 24 * 60 * 60 * 1000);
          break;
        case '12week':
          startDate = new Date(currentDate.getTime() - 84 * 24 * 60 * 60 * 1000);
          break;
        default:
          // No filter applied
          break;
      }

      if (startDate) {
        dateFilter = {
          Order_Date: {
            [Op.gte]: startDate
          }
        };
      }
    }

    if (Array.isArray(salesCategoryId)) {
      salesCategoryId = salesCategoryId.map(Number);
    }
    if (Array.isArray(priceClassId)) {
      priceClassId = priceClassId.map(Number);
    }

    // First, get all order numbers that match the date filter and customer
    const allMatchingOrderHeaders = await OrderHeader.findAll({
      where: {
        C_Number: customerId,
        ...dateFilter
      },
      include: [
        {
          model: OrderDetail,
          as: 'orderDetails',
          required: true,
          attributes: [],
          where: {
            ...(salesCategoryId && salesCategoryId.length > 0
              ? { Sales_Category: { [Op.in]: salesCategoryId } }
              : {})
          },
          include: [{
            model: Inventory,
            as: 'inventory',
            where: {
              ...(priceClassId && priceClassId.length > 0
                ? { Price_Class: { [Op.in]: priceClassId } }
                : {})
            }
          }]
        }
      ],
      attributes: ['Order_Number', 'Order_Date', 'Invoice_Total', 'Order_Source'],
      order: [['Order_Date', 'DESC']],
      raw: true
    });

    const allOrderNumbers = allMatchingOrderHeaders.map((header: any) => header.Order_Number);

    if (allOrderNumbers.length === 0) {
      return {
        totalCount: 0,
        page,
        limit,
        totalPages: 0,
        data: [],
        filter: filter || 'all',
        search: search || ''
      };
    }

    // Build where clause for OrderDetail

    let matchingInventoryItems: any = [];
    // Add search functionality for OrderDetail
    let matchingItemNumbers: number[] | undefined = undefined;

    let allExcludedItems: any[] = [];
    let whereClause: any = {};
    if (state || zip || jurisdiction) {
      const customerExcluded = await getCustomerExcludeItem(state as string, zip as string, jurisdiction as number);
      if (customerExcluded && customerExcluded.length > 0) {
        allExcludedItems = allExcludedItems.concat(customerExcluded);
      }
    }
    const userExcluded = await excludeItemByUser(Number(customerId));
    if (userExcluded && userExcluded.length > 0) {
      allExcludedItems = allExcludedItems.concat(userExcluded);
    }

    if (allExcludedItems.length > 0) {
      const uniqueExcluded = [...new Set(allExcludedItems)];
      whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
    }
    if (search) {
      const matchingInventoryItems = await Inventory.findAll({

        where: {
          I_Inactive: 0,
          ...whereClause,
          [Op.or]: [
            { Item_Number: { [Op.like]: `%${search}%` } },

          ],
        },
        attributes: ['Item_Number'],
        raw: true,
      });

      matchingItemNumbers = matchingInventoryItems.map(item => item.Item_Number);
    }


    let orderDetailWhereClause: any = {
      Order_Number: { [Op.in]: allOrderNumbers },
      ...whereClause,
    };

    if (matchingItemNumbers && matchingItemNumbers.length > 0) {
      orderDetailWhereClause.Item_Number = { [Op.in]: matchingItemNumbers };
    }
    // Get total count of order details
    const totalCount = await OrderDetail.count({
      where: orderDetailWhereClause,
      distinct: true,
      col: 'Item_Number'
    });


    const orderDetails: any = await OrderDetail.findAll({
      where: orderDetailWhereClause,
      attributes: [
        ['Item_Number', 'Item_Number'],
        [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'total_Ordered'],
      ],
      group: ['OrderDetail.Item_Number'],
      order: [['total_Ordered', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      raw: true,
    });


    await Promise.all(
      orderDetails.map(async (detail: any) => {
        const inventoryData = await getInventoryFullItemNumber(detail.Item_Number);
        detail.inventory = inventoryData;
      })
    );





    const itemNumbers = orderDetails.map((e: any) => e.Item_Number);
    const otpNumbers = orderDetails.map((e: any) => e.inventory.OTP_Number);

    console.log(otpNumbers, 'otpNumbers')

    const productImages = await ProductImage.findAll({
      where: {
        product_number: { [Op.in]: itemNumbers.map(String) },
        isAllow: true
      }
    });
    const imageMap = new Map(productImages.map(img => [img.product_number, img]));
    const discountMap = await getDiscountsForItemNumbers(itemNumbers, customerId);
    const userJurisdiction = await getJurisdiction(customerId);
    const topLatestItems = await getTopLatestItems();

    // Process the results to include product images and format the data
    const finalOrderDetails = await Promise.all(orderDetails.map(async (detail: any) => {
      console.log(detail, 'detail--->')
      const itemStr = detail.Item_Number.toString();
      const productImage = imageMap.get(itemStr) || null;
      const inventoryOnHand = await getInventoryOnHand(detail.Item_Number) || 0;
      let price = await getDiscount(detail.Item_Number, customerId) ?? await getFirstValidPrice(detail);

      if (!price) {
        let tempDetail: any = await Inventory.findOne({
          where: {
            Item_Number: detail.Item_Number
          },
        });
        price = await getFirstValidPrice(tempDetail);
      }






      const taxRate = await getTaxRateV1(detail.inventory.OTP_Number, userJurisdiction as number, detail.Item_Number, price);


      const isDiscounted = await hasDiscountedItem(detail.Item_Number, detail.inventory.Price_Subclass);
      let allowToOrder = true;
      if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }
      const productLimit = await getProductLimit(detail.Item_Number);
      let hasQtyDiscount = await checkQtyDiscount(detail.Item_Number, customerId, price + taxRate);
      // Find the corresponding order header
      const orderHeader = allMatchingOrderHeaders.find((header: any) => header.Order_Number === detail.Order_Number);

      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === detail.Item_Number);

      let prepaidTaxRate = 0
      if (userJurisdiction != null && detail.inventory.Sales_Category) {
        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, detail.inventory?.Sales_Category);
      }



      return {
        isNewItem,
        // Order information
        Order_Number: detail.Order_Number,
        Order_Date: (orderHeader as any)?.Order_Date,
        Invoice_Total: (orderHeader as any)?.Invoice_Total,

        price,
        priceWithTax: price + taxRate,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
        prepaidTaxRate: prepaidTaxRate,
        isDiscounted,
        Tax_Rate: taxRate,
        ProductInActive: detail.inventory.I_Inactive,
        showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
        showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
        Pack: detail.inventory.Pack,
        Inventory_OnHand: inventoryOnHand,

        // Order detail information
        Line_Number: detail.Line_Number,
        Item_Number: detail.Item_Number,
        Quantity_Ordered: detail.Quantity_Ordered,
        Quantity_Shipped: detail.Quantity_Shipped,
        Price: detail.Price,
        ItemDescription: detail.ItemDescription,
        CaseCount: detail.inventory.CaseCount,
        allowToOrder,
        // Inventory information
        Description: detail.inventory.Description,
        ALT_Description2: detail.inventory.ALT_Description2,
        UOM: detail.inventory.UOM,
        Price1: detail.inventory.Price1,
        Price2: detail.inventory.Price2,
        BaseCost: detail.inventory.BaseCost,
        Invoice_Cost: detail.inventory.Invoice_Cost,
        AvgCost: detail.inventory.AvgCost,
        NetCost: detail.inventory.NetCost,
        eCommerce: detail.inventory.eCommerce,
        I_Inactive: detail.inventory.I_Inactive,
        Date_Created: detail.inventory.Date_Created,
        OTP_Number: detail.inventory.OTP_Number,

        // Calculated fields        hasProductLimit: productLimit ? true : false,
        hasProductLimit: productLimit ? true : false,
        productLimit: productLimit,
        totalOrder: detail.total_Ordered,
        // Category information
        SalesCategory: detail.inventory.SalesCategory?.Category_Desc || null,
        PriceClass: detail.inventory.PriceClass?.Class_Desc || null,
        hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
        qtyDiscount: hasQtyDiscount,
        // UPC information
        UPCList: detail.inventory.UPCList,
        UnitOunces: detail.inventory.UnitOunces,
        // Image information
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${detail.inventory.UPCList?.[0]?.UPC_Number}.jpg`
      };
    }));

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: finalOrderDetails,
      filter: filter || 'all',
      search: search || ''
    };
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

    const allowPrepaidTax = await Setting.findOne({
      attributes: ['showWithPerpaidTax']
    });
    if (hasPosValue) {
      return [
        {
          status: 'Order Packed',
          no: 2,
          time: status.POS_Time || null,
          active: true,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        },
        {
          status: 'Picklist Print',
          no: 1,
          time: status.Picklist_Time || null,
          active: false,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        },
        {
          status: 'Order Placed',
          no: 0,
          time: status.Order_Date || null,
          active: false,
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
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        },
        {
          status: 'Picklist Print',
          no: 1,
          time: status.Picklist_Time || null,
          active: true,
          allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
        },
        {
          status: 'Order Placed',
          no: 0,
          time: status.Order_Date || null,
          active: false,
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
        allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
      },
      {
        status: 'Picklist Print',
        no: 1,
        time: null,
        active: false,
        allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
      },
      {
        status: 'Order Placed',
        no: 0,
        time: status.Order_Date || null,
        active: true,
        allowPrepaidTax: allowPrepaidTax?.showWithPerpaidTax || false
      }
    ];
  }

  async getDeliveryCharge(customerId: number) {
    const findInCustomer = await Customer.findOne({
      where: {
        C_Number: customerId
      },
    })
    if (findInCustomer?.Delivery_Charge) {
      if (findInCustomer.Delivery_Amount) {
        return findInCustomer.Delivery_Amount
      }
      const findInDeliveryCharge = await DeliveryCharge.findOne({
        where: {
          Del_ID: findInCustomer.Delivery_ID
        },
        attributes: ["Del_Amount"]
      })
      return findInDeliveryCharge?.Del_Amount
    } else {
      const findInDeliveryCharge = await DeliveryCharge.findOne({
        attributes: ["Del_Amount"]
      })
      return findInDeliveryCharge?.Del_Amount
    }
    return 0
  }

  async getBannerList() {

    const { count: totalCount, rows: bannerList } = await Banner.findAndCountAll({
      where: {
        isActive: true,
        status: true,
        hasForWeb: false,
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

            bannerData.inventoryItems = inventoryData.map(item => item.Description);
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
    };
  }

  async getAccountReceivablesList(
    query: PaginationOptions & { tab?: string; search?: string },
    customerId: any
  ) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search?.trim() || '';
    const tab = (query.tab || 'charges').trim().toLowerCase();
    const offset = (page - 1) * limit;

    const cNumber = customerId; // ✅ Get C_Number from session

    if (!cNumber) {
      throw new AppError('Unauthorized: Retailer ID missing', 401);
    }

    const whereCondition: any = {
      C_Number: cNumber, // ✅ Enforce logged-in retailer's scope
    };

    // Filter by AR_Type based on tab

    if (tab === 'payments') {
      whereCondition.AR_Type = 'C';
    } else if (tab === 'charges') {
      whereCondition.AR_Type = { [Op.in]: ['I', 'A', 'R'] };
      whereCondition.AR_Amount = { [Op.gt]: 0 };
    } else if (tab === 'refunds') {
      whereCondition.AR_Type = 'I';
      whereCondition.AR_Amount = { [Op.lt]: 0 };
    }

    // Search logic
    const searchConditions: any[] = [];
    if (search) {
      if (!isNaN(Number(search))) {
        const searchNumber = Number(search);
        searchConditions.push({ Invoice_Number: searchNumber });
      }

      searchConditions.push({ AR_Ref: { [Op.like]: `%${search}%` } });

      if (tab === 'payments') {
        searchConditions.push(
          Sequelize.where(Sequelize.col('arDefinition.AR_SubTypeRef'), {
            [Op.like]: `%${search}%`,
          })
        );
      }

      if (searchConditions.length > 0) {
        whereCondition[Op.or] = searchConditions;
      }
    }

    // Includes
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
      include.push({
        model: ARDetails,
        as: 'details',
        required: false,

      });
    }

    const { count: totalCount, rows } = await CustReceivables.findAndCountAll({
      where: whereCondition,

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
      limit,
      offset,
      distinct: true,
      order: [['AR_CheckDate', 'DESC']],
    });

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
    })

    // Total current due calculation (same filter: AR_Type + C_Number)
    const allDueRecords = await CustReceivables.findAll({
      where: {
        C_Number: cNumber,
        AR_Type: whereCondition.AR_Type,
      },
      attributes: ['AR_Amount', 'AR_Applied'],
    });

    const totalDue = allDueRecords.reduce((sum: number, rec: any) => {
      const amt = Number(rec.AR_Amount || 0);
      const app = Number(rec.AR_Applied || 0);
      return sum + (amt - app);
    }, 0);

    const currentDue = Number(totalDue.toFixed(2));

    return {
      totalCount,
      page,
      limit,
      currentDue,
      accountReceivablesList,
    };
  }

  async getAccountReceivablesListV1(
    query: PaginationOptions & { tab?: string; search?: string },
    customerId: any
  ) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search?.trim() || '';
    const tab = (query.tab || 'charges').trim().toLowerCase();
    const offset = (page - 1) * limit;

    const cNumber = customerId; // ✅ Get C_Number from session

    if (!cNumber) {
      throw new AppError('Unauthorized: Retailer ID missing', 401);
    }

    const whereCondition: any = {
      C_Number: cNumber, // ✅ Enforce logged-in retailer's scope
    };

    // Filter by AR_Type based on tab

    if (tab === 'payments') {
      whereCondition.AR_Type = 'C';
    } else if (tab === 'charges') {
      whereCondition.AR_Type = { [Op.in]: ['I', 'A', 'R'] };
      whereCondition.AR_Amount = { [Op.gt]: 0 };
    } else if (tab === 'refunds') {
      whereCondition.AR_Type = 'I';
      whereCondition.AR_Amount = { [Op.lt]: 0 };
    }

    // Search logic
    const searchConditions: any[] = [];
    if (search) {
      if (!isNaN(Number(search))) {
        const searchNumber = Number(search);
        searchConditions.push({ Invoice_Number: searchNumber });
      }
    }
    if (searchConditions.length > 0) {
      whereCondition[Op.or] = searchConditions;
    }

    // Includes
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
        where: {
          AR_Type: 'C'
        },
        as: 'arDefinition',
        required: false,
        attributes: ['AR_SubTypeRef'],
      });
    }

    if (tab === 'refunds') {
      include.push({
        model: ARDetails,
        as: 'details',
        required: false,
      });
    }

    const { count: totalCount, rows } = await CustReceivables.findAndCountAll({
      where: whereCondition,

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
      distinct: true,
      limit,
      offset,
      order: [['AR_CheckDate', 'DESC']],
    });



    // Total current due calculation (same filter: AR_Type + C_Number)
    const allDueRecords = await CustReceivables.findAll({
      where: {
        C_Number: cNumber,
        AR_Type: whereCondition.AR_Type,
      },
      attributes: ['AR_Amount', 'AR_Applied'],
    });

    const totalDue = allDueRecords.reduce((sum: number, rec: any) => {
      const amt = Number(rec.AR_Amount || 0);
      const app = Number(rec.AR_Applied || 0);
      return sum + (amt - app);
    }, 0);

    const currentDue = Number(totalDue.toFixed(2));

    return {
      totalCount,
      page,
      limit,
      currentDue,
      rows,
    };
  }

  async addToCartByScanner(upcNumber: string, userId: number) {
    const isUpcAvailable = await InventoryUPC.findOne({
      where: { UPC_Number: upcNumber }
    });

    if (!isUpcAvailable) {
      throw new AppError("Item not found", 400);
    }

    const findItem = await Inventory.findOne({
      where: {
        Item_Number: isUpcAvailable.Item_Number
      },
      attributes: [
        'Pack',
        'Description',
        'Item_Number',
        'CaseCount',
        'UOM',
        'Price1',
        'Price2',
        'BaseCost',
        'Invoice_Cost',
        'AvgCost',
        'NetCost',
        'eCommerce',
        'I_Inactive',
        'Date_Created',
        'OTP_Number'
      ],
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
        {
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          required: false
        },

      ]
    });

    if (!findItem) {
      throw new AppError("Item details not found in Inventory", 404);
    }

    // Fetch supporting data
    const productImage = await ProductImage.findOne({
      where: {
        product_number: findItem.Item_Number.toString(),
        isAllow: true
      },
    });

    let price = await getDiscount(Number(findItem.Item_Number), userId);
    if (!price) {
      price = await getFirstValidPrice(findItem);
    }

    const inventoryOnHand = await getInventoryOnHand(findItem.Item_Number);
    let taxRate = 0
    const userJurisdiction = await getJurisdiction(userId);
    if (findItem.OTP_Number) {
      taxRate = await getTaxRateV1(findItem.OTP_Number, userJurisdiction as number, findItem.Item_Number, price);
    }


    let wareHouseSetting: any = await Setting.findOne({}); (userId); // You may have this from context/session

    let allowToOrder = true;
    if (wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
      allowToOrder = true;
    } else if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
      allowToOrder = false;
    }

    // Final enriched item structure
    const finalItem = {
      ...findItem.toJSON(),
      price,
      productImage,
      inventoryOnHand,
      taxRate,
      allowToOrder
    };

    const obj = {
      Qty: 1,
      Price: finalItem.price, // ✅ required
      Tax_Rate: finalItem.taxRate, // ✅ required
      TotalPrice: finalItem.price,
      originalPrice: finalItem.price,
      TotalPriceWithTax: finalItem.price + finalItem.taxRate,
      Customer_Number: userId,
      Item_Number: finalItem.Item_Number,
      Price_With_Tax: finalItem.price + finalItem.taxRate
    };

    const existingCartItem = await CustomerCart.findOne({
      where: {
        Customer_Number: obj.Customer_Number,
        Item_Number: obj.Item_Number,
        isActive: true
      }
    });

    if (existingCartItem) {
      await existingCartItem.update({
        Qty: existingCartItem.Qty + obj.Qty,
        TotalPrice: Number(existingCartItem.TotalPrice) + Number(obj.TotalPrice),
        TotalPriceWithTax: Number(existingCartItem.TotalPriceWithTax) + Number(obj.TotalPriceWithTax),
        originalPrice: Number(existingCartItem.originalPrice)
      });
    } else {
      await CustomerCart.create(obj);
    }
    return finalItem

  }

  async scanItemByBarcode(barcode: string, userId: number) {

    let upcRecord;

    // Step 1: Check if UPC exists
    // const upcRecord = await InventoryUPC.findOne({
    //   where: {
    //     UPC_Number: {
    //       [Op.like]: `%${barcode}%`,
    //     },
    //   },
    // })

    barcode = barcode.trim();
    if (barcode.length > 9) {
      // If barcode is long → use LIKE search
      upcRecord = await InventoryUPC.findOne({
        where: {
          UPC_Number: {
            [Op.like]: `%${barcode}%`,
          },
        },
      });
    } else {
      // If barcode length <= 9 → exact match
      upcRecord = await InventoryUPC.findOne({
        where: {
          UPC_Number: barcode
        },
      });
    }


    if (!upcRecord) {
      throw new AppError(`Item not found for UPC: ${barcode}`, 404);
    }

    let whereCondition: any = {
      Item_Number: upcRecord.Item_Number, I_Inactive: false,
      ShortOrderForm: true
    }

    if (userId != null) {
      const salesCategoryArray = await getAllowedSalesCategories(userId);
      if (Array.isArray(salesCategoryArray) && salesCategoryArray.length > 0) {
        whereCondition.Sales_Category = { [Op.in]: salesCategoryArray };
      }

    }

    // Step 2: Fetch item details from Inventory
    const item = await Inventory.findOne({
      where: whereCondition,
      attributes: [
        "Pack", "Description", "Item_Number", "CaseCount", "UOM",
        "Price1", "Price2", "BaseCost", "Invoice_Cost", "AvgCost",
        "NetCost", "OTP_Number", "Price_Subclass"
      ],
      include: [
        { model: SalesCategory, as: "SalesCategory", attributes: ["Category_Desc", "Sales_Category"], required: false },
        { model: PriceClass, as: "PriceClass", attributes: ["Class_Desc"], required: false },
        // { model: InventoryStatus, as: "inventoryStatus", attributes: ["Inventory_OnHand"], required: false },
        { model: InventoryUPC, as: "UPCList", attributes: ["UPC_Number"], required: false }
      ]
    });

    if (!item) {
      throw new AppError("Item details not found in Inventory", 404);
    }

    // Step 3: Pricing & Tax
    let price = (await getDiscount(Number(item.Item_Number), userId)) || (await getFirstValidPrice(item));
    const userJurisdiction = await getJurisdiction(userId);
    const isDiscounted = await hasDiscountedItem(item.Item_Number || 0, item.Price_Subclass || 0);
    // price = Math.ceil(price * 100) / 100;

    let taxRate = await getTaxRateV1(item.OTP_Number as number, userJurisdiction as number, item.Item_Number, price);
    taxRate = Math.ceil(taxRate * 100) / 100;

    // Step 4: Build response object (same format as your example)
    const productImage = await ProductImage.findOne({
      where: { product_number: item.Item_Number.toString(), isAllow: true }
    });

    const inventoryOnHand = await getInventoryOnHand(item.Item_Number);
    const wareHouseSetting: any = await Setting.findOne({});
    const allowToOrder = wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible || inventoryOnHand > 0;
    let prepaidTaxRate = 0
    if (userJurisdiction != null && item.SalesCategory) {
      prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, item?.SalesCategory?.Sales_Category);
    }
    const formattedItem = {
      Pack: item.Pack,
      Description: item.Description,
      Item_Number: item.Item_Number,
      CaseCount: item.CaseCount,
      UOM: item.UOM,
      isDiscounted,
      Price1: item.Price1,
      Tax_Rate: taxRate,
      OTP_Number: item.OTP_Number,
      price,
      isNewItem: true,
      hasPrepaidTaxRate: prepaidTaxRate ? true : false,
      prepaidTaxRate: prepaidTaxRate,
      priceWithTax: price + taxRate,
      BaseCost: item.BaseCost,
      Invoice_Cost: item.Invoice_Cost,
      AvgCost: item.AvgCost,
      NetCost: item.NetCost,
      hasProductLimit: false,
      productLimit: null,
      UPCList: item.UPCList || [{ UPC_Number: barcode }],
      Inventory_OnHand: inventoryOnHand,
      UnitOunces: 0,
      allowToOrder,
      hasQtyDiscount: false,
      qtyDiscount: {
        allowToDiscount: false,
        hasCaseDiscount: false,
        hasQtyDiscount: false,
        isCaseDiscount: false,
        isQtyDiscount: false,
        percentageCaseDiscount: 0,
        minimumQtyForCaseDiscount: 0,
        qtyDiscount: [],
        price,
      },
      showTheInventoryStock: true,
      showLowStock: false,
      showWithOutPrice: false,
      SalesCategory: item.SalesCategory?.Category_Desc || null,
      PriceClass: item.PriceClass?.Class_Desc || null,
      showDistributorImage: productImage?.isAllow ?? false,
      distributorImage: productImage?.img_url || null,
      masterImage: `${process.env.AZUREIMAGESERVER}${barcode}.jpg`,
      quantity: 1, // Default 1 when scanned
    };

    console.log('Scanned Item:', formattedItem);
    return formattedItem;
  }

  async addMultipleItems(customerNumber: number, body: any) {
    let { formattedItems } = body;
    if (typeof formattedItems === "string") {
      try {
        formattedItems = JSON.parse(formattedItems);
      } catch (error) {
        throw new AppError("Invalid formattedItems format", 400);
      }
    }

    const cartItemsData = [];

    for (const item of formattedItems) {
      const Item_Number = Number(item.Item_Number);
      const quantity = Number(item.Qty ?? item.quantity ?? 1);
      const price = Number(item.Price ?? item.price ?? 0);
      const Tax_Rate = item.Tax_Rate ?? 0;
      const Price_With_Tax =
        Number(item.Price_With_Tax ?? item.priceWithTax ?? price + (price * Tax_Rate) / 100);


      const existingCartItem = await CustomerCart.findOne({
        where: {
          Customer_Number: customerNumber,
          Item_Number: Item_Number,
          isActive: true,
        },
      });

      if (existingCartItem) {
        const newQty = existingCartItem.Qty + quantity;

        const updatedPrice = price * newQty;
        const updatedPriceWithTax = Price_With_Tax * newQty;


        await existingCartItem.update({
          Qty: newQty,
          TotalPrice: updatedPrice,
          TotalPriceWithTax: updatedPriceWithTax,
          TotalprepaidTaxRate: item.TotalprepaidTaxRate || 0,
          prepaidTaxRate: item.prepaidTaxRate || 0,
        });

        cartItemsData.push(existingCartItem);
      } else {
        // ✅ Create new cart entry if not exist
        const totalPrice = price * quantity;
        const totalPriceWithTax = Price_With_Tax * quantity;

        const cartData = {
          Customer_Number: customerNumber,
          Item_Number,
          Description: item.Description,
          Qty: quantity,
          Tax_Rate,
          Price: price,
          Price_With_Tax,
          TotalPrice: totalPrice,
          TotalPriceWithTax: totalPriceWithTax,
          discount: 0,
          originalPrice: price,
          isActive: true,
          TotalprepaidTaxRate: item.TotalprepaidTaxRate || 0,
          prepaidTaxRate: item.prepaidTaxRate || 0,
        };
        console.log(price, 'price>>>>>>>>>>>>>>>>')

        const addedCartItem = await CustomerCart.create(cartData);
        cartItemsData.push(addedCartItem);
      }
    }

    // ✅ Return updated cart summary
    return await this.getCartItems(customerNumber);
  }



  async addToCartMultiScanner(body: any, userId: number) {
    const { upcNumbers, isMultiple, arrayOfUpc, state = '', zip = '', jurisdiction = '' } = body;
    let excludeItem: any = []
    if (state || zip || jurisdiction) {
      excludeItem = await getCustomerExcludeItem(state as string, zip as string, jurisdiction as number);
    }

    const excludeItemForCustomer = await excludeItemByUser(userId);
    if (excludeItemForCustomer.length > 0) {
      excludeItem = [...excludeItem, ...excludeItemForCustomer];
    }
    // Common helper to get product details by UPC
    const getProductDetailByUPC = async (UPC: string) => {
      const isUpcAvailable = await InventoryUPC.findOne({
        where: {
          UPC_Number: UPC,

          Item_Number: { [Op.notIn]: excludeItem }
        }
      });

      if (!isUpcAvailable) {
        return null;
      }

      const findItem = await Inventory.findOne({
        where: { Item_Number: isUpcAvailable.Item_Number },
        attributes: [
          'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
          'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
          'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created', 'OTP_Number'
        ],
        include: [
          { model: SalesCategory, as: 'SalesCategory', attributes: ['Category_Desc', 'Sales_Category'], required: false },
          { model: PriceClass, as: 'PriceClass', attributes: ['Class_Desc'], required: false },
          { model: InventoryStatus, as: 'inventoryStatus', attributes: ['Inventory_OnHand'], required: false },
          { model: InventoryUPC, as: 'UPCList', attributes: ['UPC_Number'], required: false }
        ]
      });

      if (!findItem) {
        throw new AppError(`Item details not found in Inventory for UPC: ${UPC}`, 404);
      }

      const productImage = await ProductImage.findOne({
        where: {
          product_number: findItem.Item_Number.toString(),
          isAllow: true
        }
      });

      let price = await getDiscount(Number(findItem.Item_Number), userId);
      if (!price) {
        price = await getFirstValidPrice(findItem);
      }

      const inventoryOnHand = await getInventoryOnHand(findItem.Item_Number);
      let taxRate = 0;
      let prepaidTaxRate = 0
      if (findItem.OTP_Number) {
        const userJurisdiction = await getJurisdiction(userId);
        taxRate = await getTaxRateV1(findItem.OTP_Number, userJurisdiction as number, findItem.Item_Number, price);
        if (userJurisdiction != null && findItem?.SalesCategory) {
          prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, findItem?.SalesCategory?.Sales_Category);
        }
      }



      const wareHouseSetting: any = await Setting.findOne({});
      let allowToOrder = true;
      if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }

      return {
        ...findItem.toJSON(),
        price,
        productImage,
        inventoryOnHand,
        taxRate,
        allowToOrder,
        prepaidTaxRate: prepaidTaxRate,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
      };
    };

    // If single UPC scan
    if (!isMultiple) {
      const finalItem = await getProductDetailByUPC(upcNumbers);
      if (!finalItem) {
        throw new AppError(`Item not found for UPC: ${upcNumbers}`, 400);
      }
      const obj = {
        Qty: 1,
        Price: Number(finalItem.price),
        Tax_Rate: Number(finalItem.taxRate),
        TotalPrice: Number(finalItem.price),
        originalPrice: Number(finalItem.price),
        TotalPriceWithTax: Number(finalItem.price) + Number(finalItem.taxRate),
        Customer_Number: userId,
        Item_Number: finalItem.Item_Number,
        Price_With_Tax: Number(finalItem.price) + Number(finalItem.taxRate),
        isActive: true,
        TotalprepaidTaxRate: finalItem.prepaidTaxRate || 0,
        prepaidTaxRate: finalItem.prepaidTaxRate || 0,
      };


      const existingCartItem = await CustomerCart.findOne({
        where: {
          Customer_Number: obj.Customer_Number,
          Item_Number: obj.Item_Number,
          isActive: true
        }
      });

      if (existingCartItem) {
        await existingCartItem.update({
          Qty: existingCartItem.Qty + obj.Qty,
          TotalPrice: Number(existingCartItem.TotalPrice) + Number(obj.TotalPrice),
          TotalPriceWithTax: Number(existingCartItem.TotalPriceWithTax) + Number(obj.TotalPriceWithTax)
        });

        return existingCartItem;
      } else {
        return await CustomerCart.create(obj);
      }
    }

    // If multiple UPCs scan
    else {
      const results = [];

      for (const upc of arrayOfUpc) {
        const finalItem = await getProductDetailByUPC(upc);
        if (!finalItem) {
          continue;
        }
        const obj = {
          Qty: 1,
          Price: Number(finalItem.price),
          Tax_Rate: Number(finalItem.taxRate),
          TotalPrice: Number(finalItem.price),
          TotalPriceWithTax: Number(finalItem.price) + Number(finalItem.taxRate),
          Customer_Number: userId,
          Item_Number: finalItem.Item_Number,
          Price_With_Tax: Number(finalItem.price) + Number(finalItem.taxRate),
          isActive: true
        };


        const existingCartItem = await CustomerCart.findOne({
          where: {
            Customer_Number: obj.Customer_Number,
            Item_Number: obj.Item_Number,
            isActive: true
          }
        });

        if (existingCartItem) {


          await existingCartItem.update({
            Qty: existingCartItem.Qty + obj.Qty,
            TotalPrice: Number(existingCartItem.TotalPrice) + Number(obj.TotalPrice),
            TotalPriceWithTax: Number(existingCartItem.TotalPriceWithTax) + Number(obj.TotalPriceWithTax)
          });

          results.push(existingCartItem);
        } else {
          const newCartItem = await CustomerCart.create(obj);
          results.push(newCartItem);
        }
      }

      return results; // All items processed
    }
  }

  async getCustomerByIdInfoInCalender(customerId: number, userId: number) {
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
    console.log(data?.dataValues, '=----->data');
    const salesNotes = await SalesNote.findAll({
      where: {
        CustomerNumber: customerId,
        salesId: userId
      }
    })

    return {
      ...data?.dataValues,
      salesNotes
    }
  }

  async getWareHouseProfileDetails() {
    const data = await Setting.findOne({
      attributes: ['warehouseProfile']
    })

    return data?.dataValues
  }


  async getPdfOfOrderDetails(query: PaginationOptions & { orientation?: 'portrait' | 'landscape' }, userId: number) {
    const { orderNumber, hasPrice = false, orientation = 'landscape', invoiceGenerated = false } = query;

    // First, get the order header to find customer number
    const orderHeader = await OrderHeader.findByPk(orderNumber);
    if (!orderHeader) {
      throw new Error('Order header not found');
    }

    // Get customer information using the customer number from order header
    const customerInfo = await Customer.findByPk(userId, {
      attributes: [
        'C_Number',
        'C_Name',
        'C_CoName',
        'C_Address',
        'C_City',
        'C_State',
        'C_Zip',
        'C_Phone'
      ]
    });

    // Get warehouse/distributor information
    const warehouseInfo = await Distributor.findOne({
      attributes: [
        'D_Name',
        'D_Addr1',
        'D_City',
        'D_State',
        'D_Zip',
        'D_Phone',
        'D_Email'
      ]
    });

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
        'PrepaidTax_Amount',
        'ItemDescription',
        'CaseWeight',
        'CaseCount'
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
    });

    if (!orderDetails || orderDetails.length === 0) {
      throw new Error('Order details not found');
    }
    const rows = orderDetails.map((detail: any) => ({
      Description: detail.inventory?.Description || detail.ItemDescription || 'N/A',
      Pack: detail.Pack || detail.inventory?.Pack || 1,
      CaseCount: detail.CaseCount || detail.inventory?.CaseCount || 1,
      Quantity_Ordered: detail.Quantity_Ordered || 0,
      Quantity_Shipped: detail.Quantity_Shipped || 0,
      Item_Number: detail.Item_Number || detail.inventory?.Item_Number || 'N/A',
      Price: detail.Price + detail.OTP_Amount_State + detail.PrepaidTax_Amount || 0,
      Size: detail.inventory?.UOM || 'N/A'
    }));

    if (hasPrice) {
      // Generate HTML using renderOrderTableFromERP
      const html = renderOrderTableFromERP(rows, {
        showMoney: true,
        getPrice: (row: any) => row.Price || 0,
        showOrderedQuantity: invoiceGenerated
      }, orderNumber, customerInfo, warehouseInfo);


      // Generate PDF from HTML with specified orientation
      const pdfBuffer = await generatePDFFromHTML(html, orientation);

      // Upload PDF to Azure
      const fileName = `order-${orderNumber}-${Date.now()}.pdf`;
      const uploadResult = await uploadFileToAzure(
        pdfBuffer,
        fileName,
        'application/pdf',
        'order-pdfs'
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to upload PDF to Azure: ${uploadResult.error}`);
      }

      return {
        success: true,
        data: {
          pdfUrl: uploadResult.url,
          fileName: uploadResult.fileName,
          orderNumber,
        }
      };
    } else {

      const html = renderOrderTableFromERP(rows, {
        showMoney: hasPrice,
        getPrice: (row: any) => row.Price || 0,
        showOrderedQuantity: invoiceGenerated
      }, orderNumber, customerInfo, warehouseInfo);

      const pdfBuffer = await generatePDFFromHTML(html, orientation);

      const fileName = `order-${orderNumber}-${Date.now()}.pdf`;
      const uploadResult = await uploadFileToAzure(
        pdfBuffer,
        fileName,
        'application/pdf',
        'order-pdfs'
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to upload PDF to Azure: ${uploadResult.error}`);
      }

      return {
        success: true,
        data: {
          pdfUrl: uploadResult.url,
          fileName: uploadResult.fileName,
          orderNumber,
        }
      };
    }
  }

  async getCustomerCalenderList(id: number) {
    const webUser = await WebUsers.findByPk(id, {
      attributes: ['salesRepNumber']
    });

    if (!webUser) {
      throw new AppError("User not found", 404);
    }
    const salesRepList: string[] = pgArrayToJsArray(webUser.salesRepNumber);
    const newSalesRepArray = salesRepList.map(Number);
    const customers = await Customer.findAll({
      where: {
        C_Salesman: { [Op.in]: newSalesRepArray },
        C_Inactive: false,
        C_OrderDay: {
          [Op.notIn]: [0, 8]
        }
      },
      attributes: [
        'C_Number',
        'C_Name',
        'C_CoName',
        'C_OrderDay',
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
      ]
    });

    return customers;
  }


  async getCustomerOrderByCalenderDate(query: PaginationOptions, id: number) {
    console.log(id, '=----->ID');
    let { orderDate, orderDay } = query;
    const dayNum = Number(orderDay);
    if (Number.isNaN(dayNum)) throw new AppError("Invalid orderDay", 400);

    const webUser: any = await WebUsers.findByPk(id, {
      attributes: ['salesRepNumber'],
    });
    if (!webUser) throw new AppError("User not found", 404);

    const normalizedDate = String(orderDate).slice(0, 10); // 'YYYY-MM-DD'

    const salesRepList: string[] = pgArrayToJsArray(webUser.salesRepNumber);
    const newSalesRepArray = salesRepList.map(Number);
    // 1) Customers for the rep on that day
    const customers: any[] = await Customer.findAll({
      where: {
        C_Salesman: { [Op.in]: newSalesRepArray },
        C_Inactive: false,
        C_OrderDay: dayNum,
      },
      attributes: [
        'C_Number', 'C_Name', 'C_CoName', 'C_Email', 'C_Phone', 'C_PhoneMobile',
        'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Country', 'C_Salesman'
      ],
      include: [{ model: CustomerRoute, as: 'Routes', attributes: ['Route_Number', 'Stop_Number'] }],
      raw: true,
    });

    if (customers.length === 0) return [];

    const customerNumbers = customers.map(c => c.C_Number);

    // 2) Orders for those customers on the date
    const orders = await OrderHeader.findAll({
      where: {
        C_Number: { [Op.in]: customerNumbers },
        Order_Date: normalizedDate,
      },
      attributes: ['Order_Number', 'C_Number'],
      raw: true,
    });
    const customersWithOrders = new Set(orders.map((o: any) => o.C_Number));

    // 3) Build result; NOTE: await Promise.all to resolve the async map
    const result = await Promise.all(
      customers.map(async (cust) => {
        const time = await this.checkSalesCallTime(
          cust.C_Number,
          customerNumbers,
          id
          // optionally pass normalizedDate if your check filters by date
        );

        return {
          ...cust,
          time, // whatever your checkSalesCallTime returns (null/Date/object)
          status: customersWithOrders.has(cust.C_Number) ? "done" : "pending",
        };
      })
    );

    return result;
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

  async removeMultipleItemsFromCart(cartItemIds: number[]) {
    await CustomerCart.destroy({
      where: {
        id: { [Op.in]: cartItemIds }
      }
    });
  }


  async getPolicies() {
    const policies = await Policies.findOne({});
    return policies;
  }

  // SalesCallTime methods
  async createSalesCallTime(body: any, webUserId: number) {
    const salesCallTime = await SalesCallTime.create({ ...body, webUserId: webUserId });
    return salesCallTime;
  }

  async updateSalesCallTime(id: number, body: any) {
    const salesCallTime = await SalesCallTime.findByPk(id);
    if (!salesCallTime) {
      throw new AppError("Sales call time not found", 404);
    }

    await salesCallTime.update(body);
    return salesCallTime;
  }

  // SalesNote CRUD methods
  async createSalesNote(noteData: any) {
    const salesNote = await SalesNote.create(noteData);
    return salesNote;
  }

  async getAllSalesNotes(customerNumber: number, query: PaginationOptions & { search?: string }) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;

    let whereClause: any = {
      CustomerNumber: customerNumber,
      isActive: true
    };

    if (search) {
      whereClause.note = { [Op.like]: `%${search}%` };
    }

    const { count: totalCount, rows: salesNotes } = await SalesNote.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: salesNotes
    };
  }

  async getSalesNoteById(salesId: number) {
    const salesNote = await SalesNote.findByPk(salesId);
    if (!salesNote) {
      throw new AppError("Sales note not found", 404);
    }
    return salesNote;
  }

  async updateSalesNote(salesId: number, updateData: { note?: string }) {
    const salesNote = await SalesNote.findByPk(salesId);
    if (!salesNote) {
      throw new AppError("Sales note not found", 404);
    }

    await salesNote.update(updateData);
    return salesNote;
  }

  async deleteSalesNote(salesId: number) {
    const salesNote = await SalesNote.findByPk(salesId);
    if (!salesNote) {
      throw new AppError("Sales note not found", 404);
    }

    // Soft delete by setting isActive to false
    await salesNote.destroy();
    return { message: "Sales note deleted successfully" };
  }

  async getSalesNotesByCustomer(customerNumber: number) {
    const salesNotes = await SalesNote.findAll({
      where: {
        CustomerNumber: customerNumber,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
    return salesNotes;
  }

  async addUpc(body: any) {
    const result = await InventoryUPC.create(body);
    return result;
  }

  async getItemForUpc(body: any) {
    const {
      salesCategoryIds = [],   // array of category IDs from payload
      search = '',
      priceClassId = [],       // array of price class IDs
    } = body;

    const whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
    };

    // 1) PRIMARY FILTER: Sales_Category wins
    if (Array.isArray(salesCategoryIds) && salesCategoryIds.length > 0) {
      // Only these categories
      whereClause.Sales_Category = { [Op.in]: salesCategoryIds };
    } else if (Array.isArray(priceClassId) && priceClassId.length > 0) {
      // Only if category filter is NOT provided
      whereClause.Price_Class = { [Op.in]: priceClassId };
    }

    // 2) SEARCH: must be AND-ed with above filters
    const trimmed = search.trim();
    if (trimmed !== '') {
      const likeAnywhere = `%${trimmed}%`;
      const likePrefix = `${trimmed}%`;

      if (!whereClause[Op.and]) {
        whereClause[Op.and] = [];
      }

      whereClause[Op.and].push({
        [Op.or]: [
          { Item_Number: { [Op.like]: likePrefix } },   // starts with "se"
          { Description: { [Op.like]: likeAnywhere } }, // contains "se"
          { ALT_Description2: { [Op.like]: likeAnywhere } },
          // uncomment if you want UPC search too:
          // { '$UPCList.UPC_Number$': { [Op.like]: likePrefix } },
        ],
      });
    }

    console.log('WHERE:', JSON.stringify(whereClause, null, 2));

    const product = await Inventory.findAll({
      attributes: [
        'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
        'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
        'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
        'OTP_Number', 'Price_Subclass', 'UnitOunces',
      ],
      where: whereClause,
      include: [
        {
          model: SalesCategory,
          as: 'SalesCategory',
          attributes: ['Category_Desc'],
          required: false,
        },
        {
          model: PriceClass,
          as: 'PriceClass',
          attributes: ['Class_Desc'],
          required: false,
        },
        {
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number', 'myKey', 'Status'],
          required: false,
        },
      ],
    });

    return { product: product || [] };
  }


  async updateUpc(id: number, body: any) {
    const result = await InventoryUPC.update(body, { where: { myKey: id } });
    return result;
  }

  // helper function
  async getSalesRepUser(id: number) {
    return await SalesRep.findByPk(id, {
      attributes: ['S_Number', 'S_Desc'],
    });
  }

  async checkSalesCallTime(customerNumber: number, salesRepNumber: number[], webUserId: number) {
    const checkSalesCallTime = await SalesCallTime.findAll({
      where: {
        customer_number: customerNumber,
        salesRepNumber: { [Op.in]: salesRepNumber.map(Number) },
        webUserId: webUserId,
      },
    });
    return checkSalesCallTime ? checkSalesCallTime : [];
  }

  // return order

  async returnPlaceOrder(orderData: PlaceOrder, req: any, customerId: any) {
    const { shippingDetails } = orderData;

    const isWebOrder = req.headers['is-web-order'];
    const isWeb = isWebOrder === 'true' ? true : false;

    const { orderPlayload, Delivery_Charge } = orderData;


    // Get customer and route info

    const customer = await Customer.findOne({ where: { C_Number: customerId } });
    const customerRoutes = await CustomerRoute.findOne({ where: { C_Number: customerId } });



    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    // Prepare dynamic header data
    const orderHeaderObject = {
      C_Number: customerId,
      S_Number: customer.C_Salesman || 0,
      Order_Source: isWeb ? 13 : 12,
      AR_C_Number: customer.C_StatementAccount || 0,
      Jurisdiction_State: customer.Jurisdiction_State || '',
      Jurisdiction_County: customer.Jurisdiction_County || '',
      Jurisdiction_City: customer.Jurisdiction_City || '',
      Route_Number: customerRoutes?.Route_Number || 101,
      Stop_Number: customerRoutes?.Stop_Number || 65,
      Delivery_ID: customer.Delivery_ID || 0,
      User_ID: Number(req.user.userNumber),
      Reference: `USER-${req.user.userNumber}`,
      Invoice_Type: customer.C_InvoiceFormat || 0,
      Invoice_Deposit: 0,
      Delivery_Charge: Delivery_Charge || 0,
      Other_Charge: customer.Other_Amount || 0,
      Invoice_Total: 0,
      Sales_Taxable: 0,
      Sales_NonTaxable: 0,
      Cig20: 0,
      Cig10tax: 0,
      Cig20tax: 0,
      Cig25tax: 0,
      POS_ChangeDue: 0,
      Points: 0,
      Total_Weight: 0,
      Order_Type:6, // return order
      Delivery_Charge_Select: !!customer.Delivery_Charge,
      Other_Charge_Select: !!customer.Other_Amount,
    };

    // Combine with defaults (exclude Order_Number since it's auto-increment)
    const { Order_Number, ...defaultValues } = getDefaultOrderValues();
    const finalOrderHeader: any = {
      ...defaultValues,
      ...orderHeaderObject,
    };



    // Ensure no null values in required fields
    Object.keys(finalOrderHeader).forEach(key => {
      if (finalOrderHeader[key] === null || finalOrderHeader[key] === undefined) {
        if (typeof finalOrderHeader[key] === 'number') {
          finalOrderHeader[key] = 0;
        } else if (typeof finalOrderHeader[key] === 'boolean') {
          finalOrderHeader[key] = false;
        } else if (typeof finalOrderHeader[key] === 'string') {
          finalOrderHeader[key] = '';
        }
      }
    });




    let orderHeaderCreated: any;
    try {
      orderHeaderCreated = await OrderHeader.create(finalOrderHeader) as any;
    } catch (error) {
      throw new AppError('Failed to create order header', 500);
    }

    // Fetch products and options
    const itemNumbers = orderPlayload.map(item => item.Item_Number);
    const [products, optionDefsValues] = await Promise.all([
      Inventory.findAll({ where: { Item_Number: itemNumbers }, raw: true }),
      OptionDefsValues.findOne({ where: { ID_Number: 4003 }, raw: true })
    ]);

    const productMap = new Map(products.map(product => [product.Item_Number, product]));

    const orderDetails = orderPlayload.map((item, index) => {
      const product = productMap.get(item.Item_Number);

      if (!product) {
        throw new AppError(`Product with Item_Number ${item.Item_Number} not found`, 404);
      }

      // if (item.Qty <= 0) {
      //   throw new AppError(`Invalid quantity for item ${item.Item_Number}`, 400);
      // }

      console.log(item.Price, 'item.Price-->')

      const orderDetail = {
        Order_Number: orderHeaderCreated.Order_Number,
        Item_Number: item.Item_Number,
        Line_Number: index + 1,
        Sales_Category: product.Sales_Category,
        OTP_Number: product.OTP_Number,
        Quantity_Ordered: Number(item.Qty),
        Quantity_Shipped: item.Qty,
        Pack: product.Pack,
        Price: Number(item.Price),
        Price_Reference: Number(item.Price),
        Retail: product.Retail1,
        NetCost: product.NetCost,
        BaseCost: product.BaseCost,
        Invoice_Cost: product.Invoice_Cost,
        AvgCost: product.AvgCost,
        OTP_Amount_State: Number(item.Tax_Rate ?? 0),
        OTP_Amount_County: 0,
        OTP_Amount_City: 0,
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

      return {
        ...getDefaultOrderDetailValues(),
        ...orderDetail
      };
    });


    try {
      await OrderDetail.bulkCreate(orderDetails);
      console.log('Order details created successfully');
    } catch (error) {
      console.log(error, 'error-->')
      throw new AppError('Failed to create order details', 500);
    }



    await CustomerCart.update({ isActive: false }, { where: { Customer_Number: customerId } });

    let orderOptionValue = shippingDetails.method + '--' + shippingDetails.selectedTimeSlot + '--' + shippingDetails.instructions
    if (shippingDetails.method === 'delivery') {
      orderOptionValue = shippingDetails.method + '--' + shippingDetails.instructions
    }
    await OrderHeaderExt.create({
      Order_Number: orderHeaderCreated.Order_Number,
      Order_Option: 0,
      Order_OptionValue: orderOptionValue
    })

    await OrderHistory.create({
      C_Number: customerId,
      type: 'return',
      orderPlaceBy: 'sales',
      discount: 0,
      salesId: req.user.id, // postgress user id
      Order_Number: orderHeaderCreated.Order_Number,
      order_Source: isWeb ? 'Web' : 'App',
      isActive: true
    });

    try {
      sendEmailToReturnOrder(orderHeaderCreated, orderDetails, customer, Delivery_Charge);
    } catch (error) {
      console.log(error, 'error-->')
    }

    return {
      orderHeader: orderHeaderCreated,
      orderDetails,
      message: "Order placed successfully"
    };
  }

  async getReturnCartItems(customerNumber: number) {
    const cartItems: any = await CustomerCart.findAll({
      where: {
        Customer_Number: customerNumber,
        isActive: true,
        type: 'return'
      },
      order: [['createdAt', 'DESC']]
    });

    let todayTotalAmount = 0;
    const start = moment().startOf("week").toDate(); // start of this week
    const end = moment().endOf("week").toDate();     // end of this week

    const weekUserOrders: any[] = await OrderHistory.findAll({
      where: {
        C_Number: customerNumber,
        isActive: true,
        type: "order",
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      order: [["createdAt", "DESC"]],
    });
    if (weekUserOrders && weekUserOrders?.length > 0) {
      todayTotalAmount = weekUserOrders.reduce(
        (sum: any, item: any) => sum + Number(item.orderPrice),
        0
      );
    }

    console.log(todayTotalAmount, 'todayTotalAmount---->')
    const finalCartItems = await Promise.all(cartItems.map(async (es: any) => {
      const e: any = es.dataValues
      const productImage = await ProductImage.findOne({
        where: {
          product_number: e.Item_Number.toString(),
          isAllow: true
        },
      });

      let price = await getDiscount(Number(e.Item_Number), Number(e.Customer_Number))
      if (!price) {
        const data = await Inventory.findByPk(e.Item_Number)
        price = await getFirstValidPrice(data?.dataValues)
      }
      // price = Math.ceil(price * 100) / 100;
      let product: any = await Inventory.findOne({
        where: {
          Item_Number: e.Item_Number
        },
        include: [{
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          where: {
            Status: 0,
          },
          required: false,

        }]
      })
      product = product?.dataValues || null;


      let itemInActive = await isItemInActive(e.Item_Number)
      const inventoryOnHand = await getInventoryOnHand(e.Item_Number)
      let wareHouseSetting: any = await Setting.findOne({});
      wareHouseSetting = wareHouseSetting?.dataValues || null;
      let allowToOrder = true;
      console.log(wareHouseSetting?.salesRep)

      let userJurisdiction = await getJurisdiction(customerNumber);
      if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
        allowToOrder = true;
      }
      else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }

      const topLatestItems = await getTopLatestItems();
      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

      const productLimit = await getProductLimit(e.Item_Number);
      const hasQtyDiscount = await checkQtyDiscount(product.Item_Number, customerNumber, Number(price) + Number(e.Tax_Rate));
      const isDiscounted = await hasDiscountedItem(product.Item_Number, product.Price_Subclass);

      let prepaidTaxRate = 0
      console.log(product.Sales_Category, 'product.Sales_Category')
      if (userJurisdiction != null && product.Sales_Category) {
        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, product?.Sales_Category);
      }

      return {

        isNewItem,
        Description: product.Description,
        isDiscounted,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
        prepaidTaxRate: prepaidTaxRate,
        // Description: product.Description,
        Item_Number: e.Item_Number,
        CaseCount: product.CaseCount,
        UOM: product.UOM,
        Price1: product.Price1,
        price: price,
        BaseCost: product.BaseCost,
        Invoice_Cost: product.Invoice_Cost,
        hasProductLimit: productLimit ? true : false,
        productLimit,
        Inventory_OnHand: inventoryOnHand || 0,
        allowToOrder,
        showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
        showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
        itemInActive,
        AvgCost: product.AvgCost,
        NetCost: product.NetCost,
        isPriceChanged: price != e?.originalPrice,
        UPCList: product.UPCList,
        oldPrice: Number(e?.originalPrice),
        newPrice: price,
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${product.UPCList?.[0]?.UPC_Number}.jpg`,
        Product: e,
        hasQtyDiscount: hasQtyDiscount.allowToDiscount,
        qtyDiscount: hasQtyDiscount,
      }
    }))
    const findTheLimit = await Retailer.findOne({
      where: {
        Customer_Number: customerNumber,
        isActive: true
      }
    })
    const totalItems = cartItems.reduce((sum: any, item: any) => sum + item.Qty, 0);
    const totalAmount = cartItems.reduce((sum: any, item: any) => sum + Number(item.TotalPrice), 0);
    const totalAmountWithTax = cartItems.reduce((sum: any, item: any) => sum + Number(item.TotalPriceWithTax), 0);
    return {
      finalCartItems,
      totalItems,
      totalAmountWithTax,
      userItemLimitQty: findTheLimit?.maxOrderLimit,
      userLimitMinOrderAmount: (findTheLimit?.minOrderAmount || 0) - todayTotalAmount,
      totalAmount
    };
  }


  async addToReturnCart(cartData: AddToCartRequest & { Customer_Number: number }, salesId: number) {
    // Check if item already exists in cart for this customer
    cartData.TotalPrice = Number(cartData.TotalPrice);
    cartData.TotalPriceWithTax = Number(cartData.TotalPriceWithTax);
    cartData.discount = Number(cartData.discount);
    cartData.originalPrice = Number(cartData.originalPrice);
    cartData.Qty = Number(cartData.Qty);
    const existingCartItem = await CustomerCart.findOne({
      where: {
        Customer_Number: cartData.Customer_Number,
        Item_Number: cartData.Item_Number,
        isActive: true,
        type: 'return'
      }
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQty = existingCartItem.Qty + cartData.Qty;
      const newTotalPrice = Number(existingCartItem.TotalPrice) + Number(cartData.TotalPrice);
      const newTotalPriceWithTax = Number(existingCartItem.TotalPriceWithTax) + Number(cartData.TotalPriceWithTax);
      await existingCartItem.update({
        Qty: newQty,
        TotalPrice: newTotalPrice,
        TotalPriceWithTax: newTotalPriceWithTax,
        discount: cartData.discount || 0,
        originalPrice: cartData.originalPrice || 0,
        TotalprepaidTaxRate: cartData.TotalprepaidTaxRate || 0,
        prepaidTaxRate: cartData.prepaidTaxRate || 0,
      });

      return existingCartItem;
    } else {
      // Create new cart item
      const newCartItem = await CustomerCart.create({
        ...cartData, type: 'return', placedBySalesPerson: true, salesPersonNumber: salesId,
        discount: cartData.discount || 0,
        originalPrice: cartData.originalPrice || 0
      });
      return newCartItem;
    }
  }


  async getReturnCartItemsByType(customerNumber: number, type: string) {
    const cartItems: any = await CustomerCart.findAll({
      where: {
        Customer_Number: customerNumber,
        isActive: true,
        type: type
      },
      order: [['createdAt', 'DESC']]
    });

    let todayTotalAmount = 0;
    const start = moment().startOf("week").toDate(); // start of this week
    const end = moment().endOf("week").toDate();     // end of this week

    const weekUserOrders: any[] = await OrderHistory.findAll({
      where: {
        C_Number: customerNumber,
        isActive: true,
        type: type,
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      order: [["createdAt", "DESC"]],
    });
    if (weekUserOrders && weekUserOrders?.length > 0) {
      todayTotalAmount = weekUserOrders.reduce(
        (sum: any, item: any) => sum + Number(item.orderPrice),
        0
      );
    }

    console.log(todayTotalAmount, 'todayTotalAmount---->')
    const finalCartItems = await Promise.all(cartItems.map(async (es: any) => {
      const e: any = es.dataValues
      const productImage = await ProductImage.findOne({
        where: {
          product_number: e.Item_Number.toString(),
          isAllow: true
        },
      });

      let price = await getDiscount(Number(e.Item_Number), Number(e.Customer_Number))
      if (!price) {
        const data = await Inventory.findByPk(e.Item_Number)
        price = await getFirstValidPrice(data?.dataValues)
      }
      // price = Math.ceil(price * 100) / 100;
      let product: any = await Inventory.findOne({
        where: {
          Item_Number: e.Item_Number
        },
        include: [{
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          where: {
            Status: 0,
          },
          required: false,

        }]
      })
      product = product?.dataValues || null;


      let itemInActive = await isItemInActive(e.Item_Number)
      const inventoryOnHand = await getInventoryOnHand(e.Item_Number)
      let wareHouseSetting: any = await Setting.findOne({});
      wareHouseSetting = wareHouseSetting?.dataValues || null;
      let allowToOrder = true;
      console.log(wareHouseSetting?.salesRep)

      let userJurisdiction = await getJurisdiction(customerNumber);
      if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
        allowToOrder = true;
      }
      else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }

      const topLatestItems = await getTopLatestItems();
      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

      const productLimit = await getProductLimit(e.Item_Number);
      const hasQtyDiscount = await checkQtyDiscount(product.Item_Number, customerNumber, Number(price) + Number(e.Tax_Rate));
      const isDiscounted = await hasDiscountedItem(product.Item_Number, product.Price_Subclass);

      let prepaidTaxRate = 0
      console.log(product.Sales_Category, 'product.Sales_Category')
      if (userJurisdiction != null && product.Sales_Category) {
        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, product?.Sales_Category);
      }

      return {

        isNewItem,
        Description: product.Description,
        isDiscounted,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
        prepaidTaxRate: prepaidTaxRate,
        // Description: product.Description,
        Item_Number: e.Item_Number,
        CaseCount: product.CaseCount,
        UOM: product.UOM,
        Price1: product.Price1,
        price: price,
        BaseCost: product.BaseCost,
        Invoice_Cost: product.Invoice_Cost,
        hasProductLimit: productLimit ? true : false,
        productLimit,
        Inventory_OnHand: inventoryOnHand || 0,
        allowToOrder,
        showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
        showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
        itemInActive,
        AvgCost: product.AvgCost,
        NetCost: product.NetCost,
        isPriceChanged: price != e?.originalPrice,
        UPCList: product.UPCList,
        oldPrice: Number(e?.originalPrice),
        newPrice: price,
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${product.UPCList?.[0]?.UPC_Number}.jpg`,
        Product: e,
        hasQtyDiscount: hasQtyDiscount.allowToDiscount,
        qtyDiscount: hasQtyDiscount,
      }
    }))
    const findTheLimit = await Retailer.findOne({
      where: {
        Customer_Number: customerNumber,
        isActive: true
      }
    })
    const totalItems = cartItems.reduce((sum: any, item: any) => sum + item.Qty, 0);
    const totalAmount = cartItems.reduce((sum: any, item: any) => sum + Number(item.TotalPrice), 0);
    const totalAmountWithTax = cartItems.reduce((sum: any, item: any) => sum + Number(item.TotalPriceWithTax), 0);
    return {
      finalCartItems,
      totalItems,
      totalAmountWithTax,
      userItemLimitQty: findTheLimit?.maxOrderLimit,
      userLimitMinOrderAmount: (findTheLimit?.minOrderAmount || 0) - todayTotalAmount,
      totalAmount
    };
  }

  async addToCartByType(cartData: AddToCartRequest & { Customer_Number: number }, salesId: number) {
    // Check if item already exists in cart for this customer
    cartData.TotalPrice = Number(cartData.TotalPrice);
    cartData.TotalPriceWithTax = Number(cartData.TotalPriceWithTax);
    cartData.discount = Number(cartData.discount);
    cartData.originalPrice = Number(cartData.originalPrice);
    cartData.Qty = Number(cartData.Qty);
    const existingCartItem = await CustomerCart.findOne({
      where: {
        Customer_Number: cartData.Customer_Number,
        Item_Number: cartData.Item_Number,
        isActive: true,
        type: cartData.type
      }
    });

    if (existingCartItem) {
      // Update existing cart item
      const newQty = existingCartItem.Qty + cartData.Qty;
      const newTotalPrice = Number(existingCartItem.TotalPrice) + Number(cartData.TotalPrice);
      const newTotalPriceWithTax = Number(existingCartItem.TotalPriceWithTax) + Number(cartData.TotalPriceWithTax);
      await existingCartItem.update({
        Qty: newQty,
        TotalPrice: newTotalPrice,
        TotalPriceWithTax: newTotalPriceWithTax,
        discount: cartData.discount || 0,
        originalPrice: cartData.originalPrice || 0,
        TotalprepaidTaxRate: cartData.TotalprepaidTaxRate || 0,
        prepaidTaxRate: cartData.prepaidTaxRate || 0,
      });

      return existingCartItem;
    } else {
      // Create new cart item
      const newCartItem = await CustomerCart.create({
        ...cartData, type: cartData.type, placedBySalesPerson: true, salesPersonNumber: salesId,
        discount: cartData.discount || 0,
        originalPrice: cartData.originalPrice || 0
      });
      return newCartItem;
    }
  }
  

  // OrderConfirmation CRUD methods
  async createOrderConfirmation(orderData: {
    order_Number: string;

    current_orderline?: number;
    sales_id: number
  }) {
    const createData: any = {
      order_Number: orderData.order_Number,
      sales_id: orderData.sales_id,
    };


    if (orderData.current_orderline !== undefined) {
      createData.current_orderline = orderData.current_orderline;
    }


    await OrderDetail.update(
      { Quantity_Shipped: 0 },
      {
        where: {
          Order_Number: orderData.order_Number,
          Confirmed: false
        }
      }
    );

    createData.startTime = new Date();

    const orderConfirmation = await OrderConfirmation.create(createData);

    const userInfo = await WebUsers.findByPk(orderData.sales_id);
    await RecordLock.create({
      Lock_Type: 0,
      Lock_Number: Number(orderData.order_Number),
      Lock_User: Number(userInfo?.userNumber ?? 0),
      Lock_Workstation: 0
    });
    return orderConfirmation;
  }


  async restartOrderConfirmation(orderData: {
    order_Number: string;
    sales_id: number;
    current_orderline?: number;
  }) {
    const { order_Number, sales_id, current_orderline } = orderData;

    // Step 1: Find existing confirmation
    const existing = await OrderConfirmation.findOne({
      where: { order_Number }
    });

    if (!existing) {
      throw new AppError("Order confirmation not found", 404);
    }

    // Step 2: Mark old confirmation as ended
    await OrderConfirmation.destroy({ where: { order_Number } });


    // Step 3: Reset order detail shipped quantity
    await OrderDetail.update(
      { Quantity_Shipped: 0, Confirmed: false },
      { where: { Order_Number: order_Number } }
    );

    // Step 4: Prepare new confirmation
    const createData: any = {
      order_Number,
      sales_id,
      startTime: new Date(),
      isActive: true
    };

    if (current_orderline !== undefined) {
      createData.current_orderline = current_orderline;
    }

    // Step 5: Create new order confirmation
    const newOrder = await OrderConfirmation.create(createData);

    const userInfo = await WebUsers.findByPk(sales_id);
    await RecordLock.create({
      Lock_Type: 0,
      Lock_Number: Number(order_Number),
      Lock_User: Number(userInfo?.userNumber ?? 0),
      Lock_Workstation: 0
    });

    await DriverPickupOrder.destroy({ where: { order_number: Number(order_Number) } });
    return newOrder;
  }



  async getAllOrderConfirmations(query: PaginationOptions & { search?: string; sales_id?: number; status?: string }) {
    const { page = 1, limit = 10, search, sales_id, status } = query;
    const offset = (page - 1) * limit;

    let whereClause: any = {};

    if (search) {
      whereClause.order_Number = { [Op.like]: `%${search}%` };
    }

    if (sales_id) {
      whereClause.sales_id = sales_id;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count: totalCount, rows: orderConfirmations } = await OrderConfirmation.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: orderConfirmations,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getOrderConfirmationById(id: number) {
    const orderConfirmation = await OrderConfirmation.findByPk(id);
    if (!orderConfirmation) {
      throw new AppError("Order confirmation not found", 404);
    }
    return orderConfirmation;
  }

  async getOrderConfirmationByOrderNumber(orderNumber: string) {
    const orderConfirmation = await OrderConfirmation.findOne({
      where: { order_Number: orderNumber },
      order: [['createdAt', 'DESC']],
    });
    if (!orderConfirmation) {
      throw new AppError("Order confirmation not found", 404);
    }
    return orderConfirmation;
  }

  async updateOrderConfirmation(
    id: number,
    updateData: {
      status?: string;
      current_orderline?: number;
      Bundles?: number;
      endTime?: Date | null;
      orderDetail: Array<{
        Order_Number: number;
        Line_Number: number;
        Confirmed?: boolean;
        Quantity_Ordered: number;
        Quantity_Shipped: number;
      }>;
    }
  ) {


    try {
      // 1) Load order confirmation inside the transaction
      let randomBarCode: any = [];
      const orderConfirmation = await OrderConfirmation.findOne({ where: { order_Number: id } });

      if (!orderConfirmation) {
        throw new AppError("Order confirmation not found", 404);
      }

      // 2) Handle endTime based on status
      if (updateData.status === "completed") {
        updateData.endTime = new Date();



      } else {
        updateData.endTime = null;
      }

      // 3) Extract orderDetail array and remove it from updateData
      const { orderDetail } = updateData;
      delete (updateData as any).orderDetail;

      // 4) Update OrderConfirmation row
      await orderConfirmation.update(updateData, {
        where: { order_Number: id }
      });


      // 5) Update related OrderDetail rows (if provided)
      if (Array.isArray(orderDetail) && orderDetail.length > 0) {
        for (const item of orderDetail) {
          await OrderDetail.update(
            {
              Quantity_Ordered: item.Quantity_Ordered,
              Quantity_Shipped: item.Quantity_Shipped,
              Confirmed: item.Confirmed,
            },
            {
              where: {
                Order_Number: item.Order_Number,
                Line_Number: item.Line_Number,
              },

            }
          );
        }
      }

      if (updateData.status === "completed") {

        await OrderHeader.update({
          Bundles: updateData.Bundles,
        }, {
          where: { Order_Number: id }
        });

        await OrderDetail.update({
          Confirmed: true,
        }, {
          where: { Order_Number: id }
        });


        randomBarCode = await generateRandomBarCode(Number(updateData.Bundles));

        await DriverPickupOrder.create({
          order_number: Number(id),
          barcodes: randomBarCode,
        });


      }

      // 6) Commit transaction

      await RecordLock.destroy({ where: { Lock_Number: Number(id), Lock_Type: 0 } });


      // Optionally re-fetch if you want latest from DB
      return {
        ...orderConfirmation.toJSON(),
        barcodes: randomBarCode,
      };
    } catch (err) {
      throw err;
    }
  }

  async lockOrderConfirmation(orderNumber: number, salesId: number) {

    const fetchOrderLock = await RecordLock.findOne({
      where: { Lock_Number: orderNumber, Lock_Type: 0 }
    });
    if (fetchOrderLock) {
      throw new AppError("Order is already locked", 400);
    }
    const userInfo = await WebUsers.findByPk(salesId);


    await RecordLock.create({
      Lock_Type: 0,
      Lock_Number: Number(orderNumber),
      Lock_User: Number(userInfo?.userNumber ?? 0),
      Lock_Workstation: 0
    });

    return true;
  }

  async deleteOrderConfirmation(id: number) {
    const orderConfirmation = await OrderConfirmation.findByPk(id);
    if (!orderConfirmation) {
      throw new AppError("Order confirmation not found", 404);
    }
    await DriverPickupOrder.destroy({ where: { order_number: Number(id) } });
    await orderConfirmation.destroy();
    return { message: "Order confirmation deleted successfully" };
  }



  async getOrderConfirmationsBySalesId(salesId: number, query?: PaginationOptions) {
    const { page = 1, limit = 10 } = query || {};
    const offset = (page - 1) * limit;

    const { count: totalCount, rows: orderConfirmations } = await OrderConfirmation.findAndCountAll({
      where: { sales_id: salesId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: orderConfirmations,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }


  async getOrderConfirmationList(query: PaginationOptions) {
    const { status, search } = query;

    // Normalize query params (handle trailing-space keys)
    const page = Number(query.page || (query as any)['page ']) || 1;
    const limit = Number(query.limit || (query as any)['limit ']) || 10;
    const customerNumber =
      query.customerNumber || (query as any)['customerNumber '];
    const startDate = query.startDate || (query as any)['startDate '];
    const endDate = query.endDate || (query as any)['endDate '];

    const offset = (page - 1) * limit;

    const fetchOrderLock = await RecordLock.findAll({
      where: { Lock_Type: 0 },
      attributes: ['Lock_Number'],

    });
    const lockOrderNumbers = fetchOrderLock.map((lock: any) => lock.Lock_Number);
    console.log(lockOrderNumbers, 'lockOrderNumbers-->')

    // Build base where condition for MSSQL
    const whereCondition: any = {
      Order_Updated: false
    };

    if (customerNumber) {
      whereCondition.C_Number = Number(customerNumber);
    }

    if (startDate && endDate) {
      whereCondition.Order_Date = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Small helper to normalize status strings
    const normalize = (val?: string | null) =>
      val ? val.toString().trim().toLowerCase() : null;

    const normalizedStatus = normalize(status);
    const isNotConfirmedFilter =
      normalizedStatus === 'not_confirmed' ||
      normalizedStatus === 'not_confirmd' ||
      normalizedStatus === 'not confirmed' ||
      normalizedStatus === 'notconfirmed';



    const normalizedSearch = search ? search.toString().trim() : null;


    if (status) {

      if (normalizedSearch) {
        whereCondition.order_Number = {
          [Op.like]: `%${normalizedSearch}%`,
        };
      }

      // 1A) Status is NOT "not_confirmed" → paginate in OrderConfirmation
      if (!isNotConfirmedFilter) {
        const {
          count: totalCount,
          rows: confirmations,
        } = await OrderConfirmation.findAndCountAll({
          where: {
            isActive: true,
            status: normalizedStatus as string, // pending | inprogress | completed | notcompleted
          },
          attributes: ['order_Number', 'status', 'id', 'current_orderline'],
          order: [['order_Number', 'DESC']],
          limit,
          offset,
          raw: true,
        });

        const orderNumbers = confirmations.map((c: any) => c.order_Number);

        if (!orderNumbers.length) {
          return {
            totalCount,
            page,
            limit,
            totalPages: Math.ceil(Number(totalCount) / Number(limit)),
            orderList: [],
          };
        }

        // Restrict MSSQL query to these orderNumbers
        const headerWhere = {
          ...whereCondition,
          Order_Number: { [Op.in]: orderNumbers },
        };

        const orderList = await OrderHeader.findAll({
          attributes: [
            'Order_Number',
            'C_Number',
            'Order_Source',
            'Order_Date',
            'Invoice_Number',
            'Bundles'
          ],
          where: headerWhere,
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
                'C_Country',
              ],
              required: false,
              include: [
                {
                  model: CustomerRoute,
                  as: 'Routes',
                  attributes: ['Route_Number', 'Stop_Number'],
                  required: false,
                },
                {
                  model: SalesRep,
                  as: 'salesRep',
                  attributes: ['S_Number', 'S_Desc'],
                  required: false,
                },
              ],
            },
          ],
          order: [['Order_Number', 'DESC']],
        });

        const headerOrderNumbers = orderList.map(
          (order: any) => order.Order_Number,
        );

        // Quantity map from MSSQL
        const quantityMap = new Map<number, number>();
        if (headerOrderNumbers.length > 0) {
          const quantityResults = await OrderDetail.findAll({
            attributes: [
              'Order_Number',
              [
                Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')),
                'totalQuantity',
              ],
            ],
            where: {
              Order_Number: { [Op.in]: headerOrderNumbers },
            },
            group: ['Order_Number'],
            raw: true,
          });

          quantityResults.forEach((result: any) => {
            quantityMap.set(
              result.Order_Number,
              Number(result.totalQuantity || 0),
            );
          });
        }

        // Build a map from order_Number → confirmation row for quick lookup
        const confirmationMap = new Map<number, any>();
        confirmations.forEach((c: any) => {
          confirmationMap.set(c.order_Number, c);
        });

        // Format response
        const formattedOrderList = await Promise.all(
          orderList.map(async (order: any) => {
            // Map Order_Source to readable names
            let orderSourceName = 'ERP';
            if (order.Order_Source === 13) {
              orderSourceName = 'Web';
            } else if (order.Order_Source === 12) {
              orderSourceName = 'App';
            }

            const route = order.customer?.Routes?.[0];

            const isOrderConfirmed = await OrderConfirmation.findOne({
              where: { order_Number: order.Order_Number, isActive: true },
              include: [
                {
                  model: WebUsers,
                  as: 'sales',
                  attributes: ['id', 'firstName', 'lastName'],
                }
              ],
              attributes: ['status', 'id', 'current_orderline', 'startTime', 'endTime', 'sales_id'],
              raw: true,
            });

            const orderConfirmedByEpick = await OrderPick.findOne({
              where: {
                orderNumber: order.Order_Number,
                status: 'completed'
              },
              raw: true,
            });

            return {
              Order_Number: order.Order_Number,
              C_Number: order.C_Number,
              orderConfirmedByEpick: orderConfirmedByEpick ? true : false,
              isLocked: lockOrderNumbers.includes(order.Order_Number) ? true : false,
              status: isOrderConfirmed ? isOrderConfirmed.status : 'Not Confirmed',
              Order_Source: order.Order_Source,
              isOrderConfirmed: isOrderConfirmed ? isOrderConfirmed : null,
              Order_Source_Name: orderSourceName,
              Order_Date: order.Order_Date,
              Invoice_Generated: order.Invoice_Number > 0 ? true : false,
              customerName: order.customer?.C_Name || 'N/A',
              address: order.customer?.C_Address || 'N/A',
              city: order.customer?.C_City || 'N/A',
              state: order.customer?.C_State || 'N/A',
              zip: order.customer?.C_Zip || 'N/A',
              country: order.customer?.C_Country || 'N/A',
              route: route?.Route_Number ?? null,
              stop: route?.Stop_Number ?? null,
              Bundles: order.Bundles,
              salesRep: order.customer?.salesRep?.S_Desc ?? null,
              totalQuantityOrdered: quantityMap.get(order.Order_Number) || 0,
            };
          })
        );
        return {
          totalCount,
          page,
          limit,
          totalPages: Math.ceil(Number(totalCount) / Number(limit)),
          orderList: formattedOrderList,
        };
      }
    }

    else {

      const whereCondition: any = {
        Order_Updated: false,

      };


      if (normalizedSearch) {
        whereCondition.Order_Number = {
          [Op.like]: `%${normalizedSearch}%`,
        };
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
      // Use distinct: true to count unique orders when there are joins
      const { count: totalCount, rows: orderList } = await OrderHeader.findAndCountAll({
        attributes: [
          'Order_Number',
          'C_Number',
          'Order_Source',
          'Order_Date',
          'Invoice_Number',
          'Bundles'
        ],
        where: whereCondition,
        distinct: true, // Important: count distinct orders, not joined rows
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
              'C_Country',
            ],
            required: false,
            include: [
              {
                model: CustomerRoute,
                as: 'Routes',
                attributes: ['Route_Number', 'Stop_Number'],
                required: false,
              },
              {
                model: SalesRep,
                as: 'salesRep',
                attributes: ['S_Number', 'S_Desc'],
                required: false,
              },
            ],
          },
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


      const qtyAgg = await OrderDetail.findAll({
        attributes: [
          'Order_Number',

          // Total ordered
          [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalOrdered'],

          // Total shipped (treat NULL as 0)
          [
            Sequelize.fn(
              'SUM',
              Sequelize.literal('ISNULL(Quantity_Shipped, 0)')
            ),
            'totalShipped',
          ],

          // Any unconfirmed lines?
          [
            Sequelize.fn(
              'SUM',
              Sequelize.literal(`
                CASE 
                  WHEN ISNULL(Confirmed, 0) = 0 THEN 1 
                  ELSE 0 
                END
              `)
            ),
            'unconfirmedCount',
          ],
        ],
        where: { Order_Number: { [Op.in]: orderNumbers } },
        group: ['Order_Number'],
        raw: true,
      });


      const totalOrderedMap = new Map<number, number>();
      const totalShippedMap = new Map<number, number>();
      const confirmFromErpMap = new Map<number, boolean>();

      qtyAgg.forEach((r: any) => {
        const orderNo = Number(r.Order_Number);

        const totalOrdered = Number(r.totalOrdered || 0);
        const totalShipped = Number(r.totalShipped || 0);
        const unconfirmedCount = Number(r.unconfirmedCount || 0);

        totalOrderedMap.set(orderNo, totalOrdered);
        totalShippedMap.set(orderNo, totalShipped);

        // Rule: if any Confirmed=0 => false
        // else compare totals
        const confirmFromErp =
          unconfirmedCount === 0 && totalOrdered === totalShipped;

        confirmFromErpMap.set(orderNo, confirmFromErp);
      });
      // Format the response
      const formattedOrderList = await Promise.all(
        orderList.map(async (order: any) => {
          // Map Order_Source to readable names
          let orderSourceName = 'ERP';
          if (order.Order_Source === 13) {
            orderSourceName = 'Web';
          } else if (order.Order_Source === 12) {
            orderSourceName = 'App';
          }

          const route = order.customer?.Routes?.[0];

          const isOrderConfirmed = await OrderConfirmation.findOne({
            where: { order_Number: order.Order_Number, isActive: true },
            include: [
              {
                model: WebUsers,
                as: 'sales',
                attributes: ['id', 'firstName', 'lastName'],
              }
            ],
            attributes: ['status', 'id', 'current_orderline', 'startTime', 'endTime', 'sales_id'],
            raw: true,
          });

          const confirmFromErp = confirmFromErpMap.get(order.Order_Number) ?? false;

          const orderConfirmedByEpick = await OrderPick.findOne({
            where: {
              orderNumber: order.Order_Number,
              status: 'completed'
            },
            raw: true,
          });

          return {
            Order_Number: order.Order_Number,
            C_Number: order.C_Number,
            orderConfirmedByEpick: orderConfirmedByEpick ? true : false,
            isLocked: lockOrderNumbers.includes(order.Order_Number) ? true : false,
            status: isOrderConfirmed ? isOrderConfirmed.status : 'Not Confirmed',
            Order_Source: order.Order_Source,
            isOrderConfirmed: isOrderConfirmed ? isOrderConfirmed : null,
            Order_Source_Name: orderSourceName,
            Order_Date: order.Order_Date,
            Invoice_Generated: order.Invoice_Number > 0 ? true : false,
            customerName: order.customer?.C_Name || 'N/A',
            address: order.customer?.C_Address || 'N/A',
            city: order.customer?.C_City || 'N/A',
            state: order.customer?.C_State || 'N/A',
            zip: order.customer?.C_Zip || 'N/A',
            country: order.customer?.C_Country || 'N/A',
            route: route?.Route_Number ?? null,
            Bundles: order.Bundles,
            stop: route?.Stop_Number ?? null,
            erpConfirmStatus: confirmFromErp ? 'Confirmed from ERP' : 'Not Confirmed from ERP',
            totalOrdered: totalOrderedMap.get(order.Order_Number) || 0,
            totalShipped: totalShippedMap.get(order.Order_Number) || 0,
            salesRep: order.customer?.salesRep?.S_Desc ?? null,
            totalQuantityOrdered: quantityMap.get(order.Order_Number) || 0,
          };
        })
      );


      return {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(Number(totalCount) / Number(limit)),
        orderList: formattedOrderList,
      };

    }
    // Build where condition

  }

  async getOrderConfirmationDetailsHistory(orderNumber: number, query: PaginationOptions) {
    let { page = 1, limit = 10 } = query;


    // Fetch order header
    const orderHeader = await OrderHeader.findByPk(orderNumber, {
      attributes: [
        'Order_Number',
        'Order_Date',
        'User_ID',
        'Order_Source',
        'Delivery_Charge',
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [
            'C_Name',
            'C_Number',
            'C_Address',
            'C_City',
            'C_State',
            'C_Phone'
          ],
          include: [
            {
              model: CustomerRoute,
              as: 'customerRoute',
              attributes: [
                'Route_Number',
                'Stop_Number'
              ]
            }
          ]
        }
      ]
    });

    // Get total count of order lines
    const totalCount = await OrderDetail.count({
      where: { Order_Number: orderNumber }
    });

    // Fetch full order details (no pagination) to calculate totals
    const allOrderDetails = await OrderDetail.findAll({
      where: { Order_Number: orderNumber },
      attributes: [
        'Price',
        'OTP_Amount_State',
        'Quantity_Ordered',
        'OffInvoice_Amount',
        'DepositAmount'
      ]
    });

    // Totals calculation
    let totalPrice = 0;
    let totalDiscount = 0;
    let totalDeposit = 0;

    for (const detail of allOrderDetails) {
      const price = Number(detail.Price || 0) + Number(detail.OTP_Amount_State || 0);
      const quantity = Number(detail.Quantity_Ordered || 0);

      totalPrice += (price) * quantity;
      totalDiscount += Number(detail.OffInvoice_Amount || 0);
      totalDeposit += Number(detail.DepositAmount || 0);
    }

    // Fetch paginated order details with inventory and UPC
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
              required: false,
            }
          ]
        }
      ],
      order: [['Line_Number', 'ASC']]
    });

    const orderDiscount = await OrderDiscount.findOne({
      where: { orderNumber: orderNumber }
    });
    if (orderDiscount) {
      totalDiscount = orderDiscount.discount;
    }
    const orderDetailsWithImages = await Promise.all(orderDetails.map(async (detail: any) => {
      const productImage = await ProductImage.findOne({
        where: {
          product_number: detail.Item_Number.toString(),
          isAllow: true
        },
      });

      let Price = Number(detail.Price || 0) + Number(detail.OTP_Amount_State || 0);
      return {
        ...detail.toJSON(),
        Price,
        isDistributorImageShow: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${detail.inventory?.UPCList?.[0]?.UPC_Number}.jpg`,
      };
    }));

    let barcodes = await DriverPickupOrder.findOne({
      where: {
        order_number: orderNumber
      }
    })

    return {
      orderHeader: {
        ...orderHeader?.toJSON(),
        Total_Price: totalPrice,
        Total_Discount: totalDiscount,
        Total_Deposit: totalDeposit
      },
      barcodes: barcodes?.barcodes || [],
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: orderDetailsWithImages
    };
  }


  async getSalesCategoryPriceClassByCustomer(customerNumber: number) {
    const data = await getAllowedSalesCategoriesAndPriceClasses(customerNumber);
    return data;
  }


  async getSalesCategoryByCustomer(customerNumber: number) {
    console.log(customerNumber, 'customerNumber')
    const data = await getAllowedSalesCategories(customerNumber);
    return data;
  }

  async getInventoryItemsForOrderConfirmation(query: PaginationOptions & { search?: string, masterSearch?: string }, customerNumber: number) {
    let { page = 1, limit = 10, salesCategoryId, search, priceClassId, masterSearch, shortBy, state = '', zip = '', jurisdiction = '', salesCategory = [] } = query;

    const userJurisdiction = await getJurisdiction(customerNumber);

    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    page = Number(page);
    limit = Number(limit);

    let whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
    };

    const excludeItem = await excludeItemByUser(customerNumber);
    if (excludeItem.length > 0) {
      whereClause.Item_Number = { [Op.notIn]: excludeItem };
    }
    if (state || zip || jurisdiction) {
      const excludeItem = await getCustomerExcludeItem(state as string, zip as string, jurisdiction as number);
      whereClause.Item_Number = { [Op.notIn]: excludeItem };
    }



    let searchInUPC = false;
    let orderClause: Order = [['Date_Created', 'DESC'] as const];

    if (masterSearch && typeof masterSearch === 'string') {
      const masterArray = masterSearch.split(',').map(i => i.trim());
      whereClause.Item_Number = { [Op.in]: masterArray };
    } else {

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
              Sequelize.fn("LOWER", Sequelize.col("AltDesc")),
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

    }

    if (salesCategory.length > 0) {
      whereClause.Sales_Category = { [Op.in]: salesCategory };
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

    if (shortBy && Number(shortBy) === 1) {
      orderClause = [[col('Description'), 'ASC']];
    }

    if (shortBy && Number(shortBy) === 2) {
      orderClause = [[col('Description'), 'DESC']];
    }

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
    const topLatestItems = await getTopLatestItems();
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
        // {
        //   model: InventoryStatus,
        //   as: 'inventoryStatus',
        //   attributes: ['Inventory_OnHand'],
        //   required: false
        // },
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
    const discountMap = await getDiscountsForItemNumbers(itemNumbers, customerNumber);

    // === Final mapping ===
    const finalProductList = await Promise.all(productList.map(async (e: any) => {
      const itemStr = e.Item_Number.toString();
      const productImage = imageMap.get(itemStr) || null;
      const inventoryOnHand = await getInventoryOnHand(e.Item_Number) || 0;

      let price = discountMap[e.Item_Number] ?? await getFirstValidPrice(e);
      const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
      // price = Math.ceil(price * 100) / 100;
      const productLimit = await getProductLimit(e.Item_Number);
      let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
      taxRate = Math.ceil(taxRate * 100) / 100;

      const hasQtyDiscount = await checkQtyDiscount(e.Item_Number, customerNumber, price + taxRate);

      let allowToOrder = true;
      if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }
      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

      let prepaidTaxRate = 0
      if (userJurisdiction != null && e.SalesCategory) {

        console.log(e?.SalesCategory, 'e.Sales_Category')
        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.SalesCategory?.Sales_Category);
      }



      return {
        Pack: e.Pack,
        Description: e.Description,
        Item_Number: e.Item_Number,
        CaseCount: e.CaseCount,
        UOM: e.UOM,
        isDiscounted,
        Price1: e.Price1,
        Tax_Rate: taxRate,
        OTP_Number: e.OTP_Number,
        price,
        isNewItem,
        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
        prepaidTaxRate: prepaidTaxRate,
        priceWithTax: price + taxRate,
        BaseCost: e.BaseCost,
        Invoice_Cost: e.Invoice_Cost,
        AvgCost: e.AvgCost,
        NetCost: e.NetCost,
        hasProductLimit: productLimit ? true : false,
        productLimit,
        EBT: e.EBT,
        UPCList: e.UPCList,
        Inventory_OnHand: inventoryOnHand,
        UnitOunces: e.UnitOunces,
        allowToOrder,
        salesCategory: e.SalesCategory || null,
        hasQtyDiscount: hasQtyDiscount.allowToDiscount,
        qtyDiscount: hasQtyDiscount,
        showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
        showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
        // SalesCategory: e.SalesCategory?.Category_Desc || null,
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


  async placeOrderForCustomer(orderData: any, customerId: number) {

    const { orderPlayload, orderNumber } = orderData;

    // Get customer and route info

    let customer = await Customer.findOne({ where: { C_Number: customerId } });


    console.log(customer?.dataValues, 'customer-->---->')
    customer = customer?.dataValues as any;



    if (!customer) {
      throw new AppError("Customer not found", 404);
    }



    // Fetch products and options
    const itemNumbers = orderPlayload.map((item: any) => item.Item_Number);
    const [products] = await Promise.all([
      Inventory.findAll({ where: { Item_Number: itemNumbers }, raw: true }),
    ]);



    const productMap = new Map(products.map(product => [product.Item_Number, product]));

    const orderDetails = orderPlayload.map(async (item: any, index: number) => {
      const product = productMap.get(item.Item_Number);

      if (!product) {
        throw new AppError(`Product with Item_Number ${item.Item_Number} not found`, 404);
      }

      if (item.Qty <= 0) {
        throw new AppError(`Invalid quantity for item ${item.Item_Number}`, 400);
      }

      console.log(item.Price, 'item.Price-->', 'item.Sales_Category', product.Sales_Category, 'item.OTP_Number', product.OTP_Number)

      let optionDefsValues: any = await OptionDefsValues.findOne({ where: { ID_Number: 4003, Option_Value: product.Sales_Category }, raw: true })

      if (!optionDefsValues) {
        optionDefsValues = await OptionDefsValues.findOne({ where: { ID_Number: 4003, Option_Value: product.OTP_Number }, raw: true })
      }

      console.log(optionDefsValues, 'optionDefsValues-->')
      if (!optionDefsValues) {
        optionDefsValues = 0
      } else {
        optionDefsValues = Number(item.Qty)
      }

      let PPD_PackType = 0
      let PPD_Packs = 0

      if (product.OTP_Number == 255) {
        if (product.Cig_Pack == 20) {
          PPD_PackType = 20
          PPD_Packs = 10
        }
        else if (product.Cig_Pack == 10) {
          PPD_PackType = 10
          PPD_Packs = 20
        }

      }

      let adjprice = Number(item.Price);
      const orderDetail = {
        PrepaidTax_Amount: item.prepaidTaxRate ? Number(item.prepaidTaxRate) : 0,
        Order_Number: orderNumber,
        Item_Number: item.Item_Number,
        Line_Number: item.Line_Number,
        Sales_Category: product.Sales_Category,
        OTP_Number: product.OTP_Number,
        Quantity_Ordered: Number(item.Qty),
        Quantity_Shipped: item.Qty,
        Pack: product.Pack,
        UOM: product.UOM,
        Price: Number(adjprice),
        Price_Reference: Number(adjprice),
        Retail: product.Retail1,
        NetCost: product.NetCost,
        BaseCost: product.BaseCost,
        Confirmed: true,
        Invoice_Cost: product.Invoice_Cost,
        AvgCost: product.AvgCost,
        OTP_Amount_State: Number(item.Tax_Rate ?? 0),

        OTP_Amount_County: 0,
        OTP_Amount_City: 0,
        Item_Message: product.Item_Message ? product.Item_Message : ' ',

        DepositAmount: product.DepositAmount,
        Price_Subclass: product.Price_Subclass,
        OffInvoice_Amount: 0,
        OffInvoice_OffCost: 0,
        OffInvoice_Special: false,
        EBT: product.EBT,
        Points: product.Points,
        Stamp_Qty: optionDefsValues || 0,
        ItemDescription: product.Description,
        CaseWeight: product.CaseWeight,
        CaseCount: product.CaseCount,
        PPD_PackType: PPD_PackType,
        PPD_Packs: PPD_Packs,
        // CasesPerPallet: product.CasesPerPallet,
      };

      return {
        ...getDefaultOrderDetailValues(),
        ...orderDetail
      };
    });


    try {
      const resolvedOrderDetails = await Promise.all(orderDetails);

      await OrderDetail.bulkCreate(resolvedOrderDetails);



      console.log('Order details created successfully');
    } catch (error) {
      console.log(error, 'error-->')
      throw new AppError('Failed to create order details', 500);
    }



    console.log(customer, 'customer-->---->------------------------>')


    return {
      orderDetails,
      message: "Order placed successfully"
    };

  }



  async updateSalesCategory(id: number, body: any) {
    const salesCategory = await SalesCategory.findByPk(id);
    if (!salesCategory) {
      throw new AppError('Sales category not found', 404);
    }
    if (salesCategory.Sales_Category === 1) {
      throw new AppError('Cigarette sales category cannot be modified', 403);
    }
    await salesCategory.update(body);

    return salesCategory;
  }


  async getDistributorContactDetails(userId: number) {
    const salesRep = await Customer.findOne({
      where: {
        C_Number: userId
      },
      attributes: ['C_Salesman'],
      include: [
        {
          model: SalesRep,
          as: 'salesRep',
          attributes: ['S_Desc']
        }
      ]
    });
    const contact = await ContactUs.findOne({})
    return {
      salesRep: salesRep?.dataValues,
      contact: contact?.dataValues
    }
  }
}
