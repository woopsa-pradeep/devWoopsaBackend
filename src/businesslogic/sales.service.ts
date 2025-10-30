import { IChangePassword } from "../interfaces/request.body.interface";
import { SalesRep } from "../models/mmsql/salesrep.model"
import { WebUsers } from "../models/postgres/users.model"
import { AppError } from "../utils/AppError";
import { checkQtyDiscount, comparePassword, generatePDFFromHTML, getDiscount, getDiscountsForItemNumbers, getFirstValidPrice, getInventoryFullItemNumber, getInventoryOnHand, getJurisdiction, getProductLimit, getTaxRateV1, getTopLatestItems, hasDiscountedItem, hashPassword, isItemInActive, renderOrderTableFromERP } from "../utils/helper";
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
import { getDefaultOrderDetailValues, getDefaultOrderValues, sendEmailToOrder } from "../utils/order";
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

export class SalesService {

  async getProfile(id: number) {
    const data = await WebUsers.findByPk(id, {
      attributes: ['firstName', 'lastName', 'email', 'role', 'salesRepNumber'],
    });

    if (!data) return null;

    const user = data.toJSON(); // Convert Sequelize instance to plain object

    const salesRep = await this.getSalesRepUser(Number(user.salesRepNumber));

    return {
      ...user,
      salesRep: salesRep
        ? {
          S_Number: salesRep.S_Number,
          S_Desc: salesRep.S_Desc,
        }
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

    // Convert salesRepNumber to number since it's stored as string in database
    const salesRepId = Number(user.salesRepNumber);

    // Now find customers assigned to this sales representative
    const customerList = await Customer.findAll({
      where: {
        C_Salesman: Number(user.salesRepNumber),
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

      if (item.Qty <= 0) {
        throw new AppError(`Invalid quantity for item ${item.Item_Number}`, 400);
      }

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
      Order_Number: orderHeaderCreated.Order_Number,
      order_Source: isWeb ? 'Web' : 'App',
      isActive: true
    });

    try {
      sendEmailToOrder(orderHeaderCreated, orderDetails, customer, Delivery_Charge);
    } catch (error) {
      console.log(error, 'error-->')
    }

    return {
      orderHeader: orderHeaderCreated,
      orderDetails,
      message: "Order placed successfully"
    };
  }


  async getOrderHistory(customerNumber: number, query: PaginationOptions & { search?: string, startDate?: string, endDate?: string }) {
    const { page = 1, limit = 10, search, startDate, endDate } = query;
    const offset = (page - 1) * limit;

    // Build where clause for OrderHeader
    let whereClause: any = { C_Number: customerNumber };

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

    // Get order headers with pagination
    const { count: totalCount, rows: orderHeaders } = await OrderHeader.findAndCountAll({
      where: whereClause,
      attributes: [
        'Order_Number',
        'Order_Date',
        'User_ID',
        'Order_Source'
      ],
      order: [['Order_Number', 'DESC']],
      limit,
      offset
    });

    // Get order details with quantity sums for each order
    const orderNumbers = orderHeaders.map((header: any) => header.Order_Number);

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

    // Create a map for quick lookup
    const quantityMap = new Map(
      orderDetailsWithSums.map((detail: any) => [detail.Order_Number, detail.totalQuantity])
    );

    // Combine order headers with their total quantities
    const result = orderHeaders.map((header: any) => {
      let source = 'WEB';
      if (header.Order_Source === 13) {
        source = 'WEB';
      } else if (header.Order_Source === 12) {
        source = 'APP';
      } else {
        source = 'ERP';
      }

      return {
        Order_Number: header.Order_Number,
        Order_Date: header.Order_Date,
        User_ID: header.User_ID,
        Order_Source: source, // use the resolved source value
        totalQuantity: quantityMap.get(header.Order_Number) || 0,
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
        'Delivery_Charge'
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
      data: orderDetailsWithImages
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
    let { page = 1, limit = 10, salesCategoryId, search, priceClassId, masterSearch, shortBy } = query;

    let wareHouseSetting: any = await Setting.findOne({});
    wareHouseSetting = wareHouseSetting?.dataValues || null;

    page = Number(page);
    limit = Number(limit);

    let whereClause: any = {
      I_Inactive: false,
      ShortOrderForm: true,
    };

    let searchInUPC = false;

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
        } else {
          const searchValue = `%${search}%`;
          whereClause[Op.or] = [
            { Item_Number: { [Op.like]: searchValue } },
            { Description: { [Op.like]: `%${search}%` } },
            { ALT_Description2: { [Op.like]: `%${search}%` } }
          ];
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


    let orderClause: Order = [['Date_Created', 'DESC'] as const];

    if (search && !searchInUPC && !masterSearch) {
      // When searching, sort by description alphabetically to get alphabetical order after common part
      orderClause = [[col('Description'), 'ASC']];
    } else if (shortBy && Number(shortBy) === 1) {
      orderClause = [[col('Description'), 'ASC']];
    } else if (shortBy && Number(shortBy) === 2) {
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
        price = Math.ceil(price * 100) / 100;
      const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
      const productLimit = await getProductLimit(e.Item_Number);
      let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
        taxRate = Math.ceil(taxRate * 100) / 100;

      let allowToOrder = true;
      if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }

      const hasQtyDiscount = await checkQtyDiscount(e.Item_Number, customerId,price + taxRate);
      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);
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
        hasProductLimit: productLimit ? true : false,
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
      shortBy,
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
  
    let searchInUPC = false;
  
    if (masterSearch && typeof masterSearch === "string") {
      const masterArray = masterSearch.split(",").map((i) => i.trim());
      whereClause.Item_Number = { [Op.in]: masterArray };
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
      ],
      where: whereClause,
      include: [
        { model: SalesCategory, as: "SalesCategory", attributes: ["Category_Desc"], required: false },
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
        price = Math.ceil(price * 100) / 100;
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
        originalPrice: cartData.originalPrice || 0
      });

      return existingCartItem;
    } else {
      // Create new cart item
      const newCartItem = await CustomerCart.create({ ...cartData, placedBySalesPerson: true, salesPersonNumber: salesId,
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
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });


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
      price = Math.ceil(price * 100) / 100;
      let product: any = await Inventory.findOne({
        where: {
          Item_Number: e.Item_Number
        },
        include: [ {
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

      if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
        allowToOrder = true;
      }
      else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }

      const topLatestItems = await getTopLatestItems();
      const isNewItem =  topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

      const productLimit = await getProductLimit(e.Item_Number);
      const hasQtyDiscount = await checkQtyDiscount(product.Item_Number, customerNumber,Number(price)+Number(e.Tax_Rate));
      const isDiscounted = await hasDiscountedItem(product.Item_Number, product.Price_Subclass);


      return {

        isNewItem,
        Description: product.Description,
        isDiscounted,
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
      userLimitMinOrderAmount: findTheLimit?.minOrderAmount,
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
      where: { C_Number: customerId }, attributes: ['C_CoName', 'C_Number', 'C_Address', 'C_City', 'C_State', 'C_Phone', 'LastBalance', 'C_Salesman','C_Name', 'C_Number', 'C_OrderDaySequence', 'C_OrderDay'],
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
    console.log(user.salesRepNumber, '-->')

    const whereClause: any = {
      C_Inactive: false,
      C_Salesman: user.salesRepNumber
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
        'C_State', 'C_Zip', 'C_Country', 'C_Email', 'C_Phone', 'C_PhoneMobile','C_DateCreated'
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
    let { page = 1, limit = 10, search, filter } = query;
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

    // First, get all order numbers that match the date filter and customer
    const allMatchingOrderHeaders = await OrderHeader.findAll({
      where: {
        C_Number: customerId,
        ...dateFilter
      },
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

    if (search) {
      const matchingInventoryItems = await Inventory.findAll({

        where: {
          I_Inactive: 0,
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
      Order_Number: { [Op.in]: allOrderNumbers }
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
      let price = discountMap[detail.Item_Number] ?? await getFirstValidPrice(detail);

      const taxRate = await getTaxRateV1(detail.inventory.OTP_Number, userJurisdiction as number, detail.Item_Number, price);


      const isDiscounted = await hasDiscountedItem(detail.Item_Number, detail.inventory.Price_Subclass);
      let allowToOrder = true;
      if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }
      const productLimit = await getProductLimit(detail.Item_Number);
      let hasQtyDiscount = await checkQtyDiscount(detail.Item_Number, customerId,price + taxRate);
      // Find the corresponding order header
      const orderHeader = allMatchingOrderHeaders.find((header: any) => header.Order_Number === detail.Order_Number);

      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === detail.Item_Number);

      return {
        isNewItem,
        // Order information
        Order_Number: detail.Order_Number,
        Order_Date: (orderHeader as any)?.Order_Date,
        Invoice_Total: (orderHeader as any)?.Invoice_Total,

        price,
        priceWithTax: price + taxRate,
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

    if (hasPosValue) {
      return [
        {
          status: 'Order Packed',
          no: 2,
          time: status.POS_Time || null,
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
        where:{
          AR_Type:'C'
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
          reference:item.AR_Ref,
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
          reference:item.AR_Ref,
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
          reference:item.AR_Ref,
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
        where:{
          AR_Type:'C'
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
      taxRate = await getTaxRateV1(findItem.OTP_Number, userJurisdiction as number,findItem.Item_Number,price);
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

  async addToCartMultiScanner(body: any, userId: number) {
    const { upcNumbers, isMultiple, arrayOfUpc } = body;
  
    // Common helper to get product details by UPC
    const getProductDetailByUPC = async (UPC: string) => {
      const isUpcAvailable = await InventoryUPC.findOne({
        where: { UPC_Number: UPC }
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
          { model: SalesCategory, as: 'SalesCategory', attributes: ['Category_Desc'], required: false },
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
      if (findItem.OTP_Number) {
        const userJurisdiction = await getJurisdiction(userId);
        taxRate = await getTaxRateV1(findItem.OTP_Number,userJurisdiction as number,findItem.Item_Number,price);
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
        allowToOrder
      };
    };
  
    // If single UPC scan
    if (!isMultiple) {
      const finalItem = await getProductDetailByUPC(upcNumbers);
      if(!finalItem){
        throw new AppError(`Item not found for UPC: ${upcNumbers}`, 400);
      }
      const obj = {
        Qty: 1,
        Price: Number(finalItem.price),
        Tax_Rate: Number(finalItem.taxRate),
        TotalPrice: Number(finalItem.price),
        TotalPriceWithTax: Number(finalItem.price) + Number(finalItem.taxRate),
        Customer_Number: userId,
        originalPrice: Number(finalItem.price),
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
        if(!finalItem){
          continue;
        }
        const obj = {
          Qty: 1,
          Price: Number(finalItem.price),
          Tax_Rate: Number(finalItem.taxRate),
          TotalPrice: Number(finalItem.price),
          TotalPriceWithTax: Number(finalItem.price) + Number(finalItem.taxRate),
          Customer_Number: userId,
          originalPrice: Number(finalItem.price),
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

  
  async getCustomerByIdInfoInCalender(customerId: number,userId:number) {
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
    console.log(data?.dataValues,'=----->data');
    const salesNotes = await SalesNote.findAll({
      where:{
        CustomerNumber:customerId,
        salesId:userId
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
    const { orderNumber, hasPrice = false, orientation = 'landscape' } = query;

    console.log(orderNumber, hasPrice, 'orderNumber, hasPrice');
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
      Item_Number: detail.Item_Number || detail.inventory?.Item_Number || 'N/A',
      
      Price: detail.Price + detail.OTP_Amount_State || 0
    }));

    if (hasPrice) {
      // Generate HTML using renderOrderTableFromERP
      const html = renderOrderTableFromERP(rows, {
        showMoney: true,
        getPrice: (row: any) => row.Price || 0
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
        getPrice: (row: any) => row.Price || 0
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

    const customers = await Customer.findAll({
      where: {
        C_Salesman: webUser.salesRepNumber,
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
    console.log(id,'=----->ID');
    let { orderDate, orderDay } = query;
    const dayNum = Number(orderDay);
    if (Number.isNaN(dayNum)) throw new AppError("Invalid orderDay", 400);
  
    const webUser: any = await WebUsers.findByPk(id, {
      attributes: ['salesRepNumber'],
    });
    if (!webUser) throw new AppError("User not found", 404);
  
    const normalizedDate = String(orderDate).slice(0, 10); // 'YYYY-MM-DD'
  
    // 1) Customers for the rep on that day
    const customers: any[] = await Customer.findAll({
      where: {
        C_Salesman: Number(webUser.salesRepNumber),
        C_Inactive: false,
        C_OrderDay: dayNum,
      },
      attributes: [
        'C_Number','C_Name','C_CoName','C_Email','C_Phone','C_PhoneMobile',
        'C_Address','C_City','C_State','C_Zip','C_Country','C_Salesman'
      ],
      include: [{ model: CustomerRoute, as: 'Routes', attributes: ['Route_Number','Stop_Number'] }],
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
    const customersWithOrders = new Set(orders.map((o:any) => o.C_Number));
  
    // 3) Build result; NOTE: await Promise.all to resolve the async map
    const result = await Promise.all(
      customers.map(async (cust) => {
        const time = await this.checkSalesCallTime(
          cust.C_Number,
          webUser.salesRepNumber,
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

    const orders :any = await OrderHeader.findAll({
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
      totalPrice   += price * qty;
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
  async createSalesCallTime(body: any,webUserId:number) {
    const salesCallTime = await SalesCallTime.create({...body,webUserId:webUserId});
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

  // helper function
  async getSalesRepUser(id: number) {
    return await SalesRep.findByPk(id, {
      attributes: ['S_Number', 'S_Desc'],
    });
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
  
}
