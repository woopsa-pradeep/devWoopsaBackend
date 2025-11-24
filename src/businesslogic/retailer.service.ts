import { PaginationOptions } from "../interfaces/pagination.interface";
import { Customer } from "../models/mmsql/customer.model";
import { DeliveryCharge } from "../models/mmsql/deliveryCharges.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { PriceClass } from "../models/mmsql/priceClass.model";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { SalesRep } from "../models/mmsql/salesrep.model";
import Banner from "../models/postgres/banner.model";
import { ProductImage } from "../models/postgres/product.model";
import CustomerCart from "../models/postgres/retailerCart.model";
import { AppError } from "../utils/AppError";
import { checkQtyDiscount, checkTimeOut, generatePDFFromHTML, generateToken, getDiscount, getDiscountsForItemNumbers, getFirstValidPrice, getInventoryFullItemNumber, getInventoryOnHand, getJurisdiction, getProductLimit, getTaxRateV1, getTopLatestItems, hasDiscountedItem, isItemInActive, renderOrderTableFromERP } from "../utils/helper";
import { uploadFileToAzure } from "../utils/azureUploader";
import { Operations } from "../utils/operations";
import { generateOrderConfirmationEmail, generateDistributorOrderNotificationEmail, generateSupportTicketEmail, generateSupportTicketForDistributor } from "../view/emails";
import { sendEmail } from "../utils/sendMail";
import { PuppeteerPDFGenerator } from "../utils/puppeteerPdfGenerator";
import { Distributor } from "../models/mmsql/distributor.model";
import { col, Op, Order, Sequelize, where } from "sequelize";
import { AddToCartRequest, UpdateCartItemRequest, CartSummary, CartResponse, PlaceOrder } from "../interfaces/cart.interface";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { getDefaultOrderDetailValues, getDefaultOrderValues, getNextOrderNumber, sendEmailToOrder } from "../utils/order";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { OptionDefsValues } from "../models/mmsql/optionDefsValue.model";
import { CustReceivables } from "../models/mmsql/custReceivables.model";
import { ARDefinitions } from "../models/mmsql/arDefinitions.model";
import { ARDetails } from "../models/mmsql/arDetails.model";
import { Retailer } from "../models/postgres/retailer.model";
import InventoryStatus from "../models/mmsql/inventoryStatus.model";
import Setting from "../models/postgres/setting.model";
import { Notifications } from "../models/postgres/notification.model";
import { OrderHistory } from "../models/postgres/orderHistory.model";
import { RetailerDevice } from "../models/postgres/device.model";
import OrderHeaderExt from "../models/mmsql/orderHeaderExt.model";
import { SupportTicket } from "../models/postgres/supportTicket.model";
import { RetailerProductCatalog } from "../models/postgres/retailerProductCatalog.model";
import { ICreateRetailerProductCatalog, IUpdateRetailerProductCatalog, IGetRetailerProductCatalogs, IGetStories } from "../interfaces/request.body.interface";
import { AuthRequest } from "../middlewares/verifyToken.middleware";
import { AuthMessage, Manager } from "../constants";
import { Link } from "../models/postgres/links.model";
import { Story } from "../models/postgres/Story.model";
import moment from "moment";
import { StoryView } from "../models/postgres/storyView.model";
import { NotificationScheduler } from "../models/postgres/notificationSchedular.model";
import { sendMultiFCMNotification } from "../utils/sentNotification";
import Policies from "../models/postgres/policies.model";
import { WebUsers } from "../models/postgres/users.model";
import { ContactUs } from "../models/postgres/contactUs.model";
import OrderDiscount from "../models/postgres/orderDiscount.model";
import { Users } from "../models/mmsql/user.model";
import { sendResponse } from "../utils/sendResponse";
import { Request, Response } from "express"
import { Token } from "../models/postgres/token.model";





export class RetailerService {

  async getProfile(id: string) {
    const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });
    const data = await Customer.findByPk(id, {
      attributes: [
        "C_CoName",
        "C_Number",
        "C_Name",
        "C_Address",
        "C_City",
        "C_Country",
        "C_Zip",
        "C_State",
        "C_Phone",
        "C_Email",
        "C_PhoneMobile",
        "C_SalesTaxNumber",
        "C_CigtLicenseNumber",
        "C_OperationHours1",
        "C_OperationHours2",
        "ExpDate_CigtTax",
        "C_OtherLicenseNumber",
        "ExpDate_OtherTax",
      ],
      include: [
        {
          model: SalesRep,
          as: "salesRep",
          attributes: ["S_Desc"],
        },
      ],
    });
    let finalData = data?.dataValues || null;
    return {
      ...finalData,
      logo: logo?.warehouseImage || null
    }
  }


  // async getInventoryItems(query: PaginationOptions & { search?: string, masterSearch?: string }, user: any) {
  //   let { page = 1, limit = 10, salesCategoryIds, search, priceClassIds, masterSearch } = query;
  //   let wareHouseSetting: any = await Setting.findOne({});
  //   wareHouseSetting = wareHouseSetting?.dataValues || null;

  //   page = Number(page);
  //   limit = Number(limit);

  //   let whereClause: any = {
  //     I_Inactive: false,
  //   };

  //   let searchInUPC = false;

  //   if (masterSearch && typeof masterSearch === 'string') {
  //     const masterArray = masterSearch.split(',').map(i => i.trim());
  //     whereClause.Item_Number = { [Op.in]: masterArray };
  //   } else {
  //     if (Array.isArray(salesCategoryIds) && salesCategoryIds.length > 0) {
  //       whereClause.Sales_Category = salesCategoryIds;
  //     }

  //     if (Array.isArray(priceClassIds) && priceClassIds.length > 0) {
  //       whereClause.Price_Class = priceClassIds;
  //     }

  //     if (search) {
  //       const searchValue = `%${search}%`;

  //       // Check if the search term is numeric and likely a UPC
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
  //         model: InventoryStatus,
  //         as: 'inventoryStatus',
  //         attributes: ['Inventory_OnHand'],
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

  //     let price = await getDiscount(Number(e.Item_Number), Number(user.id));
  //     if (!price) {
  //       price = await getFirstValidPrice(e);
  //     }
  //     const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass)
  //     const inventoryOnHand = await getInventoryOnHand(e.Item_Number)
  //     const taxRate = await getTaxRateV1(e.OTP_Number)

  //     let allowToOrder = true;
  //     if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
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
  //       Invoice_Cost: e.Invoice_Cost,
  //       AvgCost: e.AvgCost,
  //       NetCost: e.NetCost,
  //       UPCList: e.UPCList,

  //       Inventory_OnHand: inventoryOnHand || 0,
  //       allowToOrder,
  //       showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
  //       showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
  //       showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,

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

  async getInventoryItems(query: PaginationOptions & { search?: string, masterSearch?: string }, user: any) {
    let { page = 1, limit = 10, salesCategoryId, search, priceClassId, masterSearch, shortBy } = query;

    const userJurisdiction = await getJurisdiction(user.id);


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
    const discountMap = await getDiscountsForItemNumbers(itemNumbers, user.id);

    // === Final mapping ===
    const finalProductList = await Promise.all(productList.map(async (e: any) => {
      const itemStr = e.Item_Number.toString();
      const productImage = imageMap.get(itemStr) || null;
      const inventoryOnHand = await getInventoryOnHand(e.Item_Number) || 0;

      let price = discountMap[e.Item_Number] ?? await getFirstValidPrice(e);
      const isDiscounted = await hasDiscountedItem(e.Item_Number, e.Price_Subclass);
      price = Math.ceil(price * 100) / 100;
      const productLimit = await getProductLimit(e.Item_Number);
      let taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
      taxRate = Math.ceil(taxRate * 100) / 100;

      const hasQtyDiscount = await checkQtyDiscount(e.Item_Number, user.id, price + taxRate);

      let allowToOrder = true;
      if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
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
        isNewItem,
        priceWithTax: price + taxRate,
        BaseCost: e.BaseCost,
        Invoice_Cost: e.Invoice_Cost,
        AvgCost: e.AvgCost,
        NetCost: e.NetCost,
        hasProductLimit: productLimit ? true : false,
        productLimit,
        UPCList: e.UPCList,
        Inventory_OnHand: inventoryOnHand,
        UnitOunces: e.UnitOunces,
        allowToOrder,
        hasQtyDiscount: hasQtyDiscount.allowToDiscount,
        qtyDiscount: hasQtyDiscount,
        showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
        showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,
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


  async getInventoryItemByItemNumber(itemNumber: string) {
    const data = await Inventory.findOne({
      where: { Item_Number: itemNumber },
    });
    if (!data) throw new AppError("Item not found", 404);
    return data;
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

  async getBannerData() {
    const data = await Banner.findAll({
      where: {
        isActive: true,
        status: true,
        endDate: { [Op.gt]: new Date() }
      }
    });
    return data;
  }

  async getProductData(ids: number[]) {
    const data = await Inventory.findAll({
      where: {
        id: ids
      }
    });
    return data;
  }

  async getAllInventoryData() {
    const inventory = await Inventory.findAll();
    return inventory;
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
            // console.log(validItemNumbers, 'validItemNumbers')
            // Fetch inventory data for these item numbers
            const inventoryData = await Inventory.findAll({
              where: {
                Item_Number: { [Op.in]: validItemNumbers }
              },
              attributes: ['Item_Number', 'Description'],
              raw: true
            });

            bannerData.inventoryItems = inventoryData.map((item) => item.Description);
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


  // Cart CRUD Operations
  async addToCart(cartData: AddToCartRequest & { Customer_Number: number }) {
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
      },

    });

    if (existingCartItem) {
      // Update existing cart item
      const newQty = existingCartItem.Qty + cartData.Qty;


      const newTotalPrice = Number(existingCartItem.TotalPrice) + Number(cartData.TotalPrice);
      const newTotalPriceWithTax = Number(existingCartItem.TotalPriceWithTax) + Number(cartData.TotalPriceWithTax)
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
      const newCartItem = await CustomerCart.create({
        ...cartData,
        discount: cartData.discount || 0,
        originalPrice: cartData.originalPrice || 0
      });
      return newCartItem;
    }
  }

  // ✅ Add all scanned items to Cart
  async addMultipleItems(userId: number, body: any) {
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
          Customer_Number: userId,
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
        });

        cartItemsData.push(existingCartItem);
      } else {
        // ✅ Create new cart entry if not exist
        const totalPrice = price * quantity;
        const totalPriceWithTax = Price_With_Tax * quantity;

        const cartData = {
          Customer_Number: userId,
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
        };
        console.log(price, 'price>>>>>>>>>>>>>>>>')

        const addedCartItem = await CustomerCart.create(cartData);
        cartItemsData.push(addedCartItem);
      }
    }

    // ✅ Return updated cart summary
    return await this.getCartItems(userId);
  }
  async getCartItems(customerNumber: number) {
    const cartItems: any = await CustomerCart.findAll({
      where: {
        Customer_Number: customerNumber,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
    const findTheLimit = await Retailer.findOne({
      where: {
        Customer_Number: customerNumber,
        isActive: true
      }
    })

    const finalCartItems = await Promise.all(cartItems.map(async (es: any) => {
      const e: any = es.dataValues
      const productImage = await ProductImage.findOne({
        where: {
          product_number: e.Item_Number.toString(),
          isAllow: true
        },
      });

      let price = await getDiscount(Number(e.Item_Number), Number(e.Customer_Number))
      let itemInActive = await isItemInActive(e.Item_Number)
      if (!price) {
        const data = await Inventory.findByPk(e.Item_Number)
        price = await getFirstValidPrice(data?.dataValues)
      }
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
          required: false

        }]
      })
      product = product?.dataValues || null;
      const inventoryOnHand = await getInventoryOnHand(e.Item_Number)
      let wareHouseSetting: any = await Setting.findOne({});
      wareHouseSetting = wareHouseSetting?.dataValues || null;


      let allowToOrder = true;

      if (wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
        allowToOrder = true;
      }
      else if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }
      price = Math.ceil(price * 100) / 100;
      const hasQtyDiscount = await checkQtyDiscount(e.Item_Number, customerNumber, Number(price) + Number(e.Tax_Rate));
      const topLatestItems = await getTopLatestItems();
      const isNewItem = topLatestItems.some((item: any) => item.Item_Number === e.Item_Number);

      const productLimit = await getProductLimit(e.Item_Number);
      const isDiscounted = await hasDiscountedItem(e.Item_Number, product.Price_Subclass);


      return {
        isDiscounted,
        isNewItem,
        Description: product.Description,
        // Description: product.Description,
        Item_Number: e.Item_Number,
        CaseCount: product.CaseCount,
        UOM: product.UOM,
        Price1: product.Price1,
        price: price,
        itemInActive,

        hasProductLimit: productLimit ? true : false,
        productLimit,


        Inventory_OnHand: inventoryOnHand || 0,
        allowToOrder,
        showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
        showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,

        BaseCost: product.BaseCost,
        Invoice_Cost: product.Invoice_Cost,
        AvgCost: product.AvgCost,
        NetCost: product.NetCost,
        placedBySalesPerson: e.placedBySalesPerson,
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

    await cartItem.update({
      ...updateData,
      discount: updateData.discount || 0
    });
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

  async getWareHouseProfileDetails() {
    const data = await Setting.findOne({
      attributes: ['warehouseProfile']
    })
    return data?.dataValues
  }

  async getCartSummary(customerNumber: number): Promise<CartSummary> {
    const cartItems = await CustomerCart.findAll({
      where: {
        Customer_Number: customerNumber,
        isActive: true
      },
      attributes: [
        'Qty',
        'TotalPrice'
      ]
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.Qty, 0);
    const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.TotalPrice), 0);

    return {
      totalItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      itemCount: cartItems.length
    };
  }

  async placeOrder(orderData: PlaceOrder, req: any) {
    const { shippingDetails } = orderData;
    const isWebOrder = req.headers['is-web-order'];
    const isWeb = isWebOrder === 'true' ? true : false;


    let findPersonLimit: any = await Retailer.findOne({ where: { Customer_Number: req.user.id } });
    findPersonLimit = findPersonLimit?.dataValues || null;

    console.log(findPersonLimit, 'findPersonLimit')
    let userItemLimitQty = findPersonLimit?.maxOrderLimit || 0;

    if (userItemLimitQty <= findPersonLimit?.todayOrderCount) {
      throw new AppError("Limitation exceeded: Daily order limit reached.", 400);
    }

    let settings: any = await Setting.findOne({});
    settings = settings?.dataValues || null;
    const isTimeOut = settings?.warehouseProfile?.cutOffTime || 0;

    console.log(isTimeOut, 'isTimeOut-->')
    const checkTime = checkTimeOut(isTimeOut);

    if (!checkTime) {
      throw new AppError("Time out: Order time out.", 400);
    }


    const { orderPlayload, Delivery_Charge } = orderData;


    // Get customer and route info

    const customer: any = await Customer.findOne({ where: { C_Number: req.user.id } });
    const customerRoutes = await CustomerRoute.findOne({ where: { C_Number: req.user.id } });



    if (!customer) {
      throw new AppError("Customer not found", 404);
    }
    const orderNumber = await getNextOrderNumber();

    // Prepare dynamic header data
    const orderHeaderObject = {
      Order_Number: orderNumber,
      C_Number: req.user.id,
      S_Number: customer.C_Salesman || 0,
      Order_Source: isWeb ? 13 : 12,
      AR_C_Number: customer.C_StatementAccount || req.user.id,
      Jurisdiction_State: customer.Jurisdiction_State || '',
      Jurisdiction_County: customer.Jurisdiction_County || '',
      Jurisdiction_City: customer.Jurisdiction_City || '',
      Route_Number: customerRoutes?.Route_Number || 0,
      Stop_Number: customerRoutes?.Stop_Number || 0,
      Delivery_ID: customer.Delivery_ID || 0,
      User_ID: 0,
      Reference: `CUS-${customer.C_Number}`,
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
      Order_Pricing_Account: customer.C_PricingAccount || req.user.id,
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

      const orderDetail = {
        Order_Number: orderHeaderCreated.Order_Number,
        Item_Number: item.Item_Number,
        Line_Number: index + 1,
        Sales_Category: product.Sales_Category,
        OTP_Number: product.OTP_Number,
        Quantity_Ordered: Number(item.Qty),
        Quantity_Shipped: item.Qty,
        Pack: product.Pack,
        UOM: product.UOM,
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
        Item_Message: product.Item_Message ? product.Item_Message :  ' ',
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
    } catch (e: any) {
      console.log(e, 'error-->')

      if (e?.original?.errors?.length) {
        for (const err of e.original.errors) {
          console.error('[MSSQL RequestError]', err?.message, 'code:', err?.code, 'number:', err?.number);
        }
      }

      // 2) Sequelize sometimes puts the real text here too
      if (e?.parent?.message) console.error('[parent.message]', e.parent.message);
      if (e?.sql) console.error('[Sequelize SQL]', e.sql);
      throw new AppError('Failed to create order details', 500);
    }

    await CustomerCart.update({ isActive: false }, { where: { Customer_Number: req.user.id } });




    await Retailer.update({ todayOrderCount: findPersonLimit?.todayOrderCount + 1 }, { where: { Customer_Number: req.user.id } });

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
      C_Number: req.user.id,
      orderPlaceBy: 'retailer',
      type: 'order',
      Order_Number: orderHeaderCreated.Order_Number,
      order_Source: isWeb ? 'Web' : 'App',
      isActive: true
    });

    // Send order confirmation email to customer
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

  async getAccountReceivablesList(
    query: PaginationOptions & { tab?: string; search?: string },
    req: any
  ) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const search = query.search?.trim() || '';
    const tab = (query.tab || 'charges').trim().toLowerCase();
    const offset = (page - 1) * limit;

    const cNumber = req.user?.id;
    if (!cNumber) {
      throw new AppError('Unauthorized: Retailer ID missing', 401);
    }

    const whereCondition: any = {
      C_Number: cNumber,
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


    // Search conditions
    const searchConditions: any[] = [];

    if (search) {
      const searchLower = search.toLowerCase();
      const isNumeric = !isNaN(Number(search));
      const searchNumber = isNumeric ? Number(search) : null;

      const mappedTypes = {
        invoice: 'I',
        adjustments: 'A',
        return: 'R',
        credit: 'C',
      };

      const matchType = Object.entries(mappedTypes).find(([key]) =>
        key.startsWith(searchLower)
      );

      if (tab === 'charges') {
        if (matchType && ['I', 'A', 'R'].includes(matchType[1])) {
          searchConditions.push({ AR_Type: matchType[1] });
        }
        if (isNumeric) {
          searchConditions.push({ Invoice_Number: { [Op.like]: `%${search}%` } });
        }
      }

      if (tab === 'payments') {
        searchConditions.push({ AR_Ref: { [Op.like]: `%${search}%` } });
        searchConditions.push(
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('arDefinition.AR_SubTypeRef')), {
            [Op.like]: `%${searchLower}%`,
          })
        );
      }

      if (tab === 'refunds') {
        searchConditions.push({ AR_Ref: { [Op.like]: `%${search}%` } });


        if (isNumeric) {
          searchConditions.push({ Invoice_Number: { [Op.like]: `%${search}%` } });
          searchConditions.push({ C_Number: { [Op.like]: `%${search}%` } });
        }
      }

      if (tab !== 'refunds' && searchConditions.length > 0) {
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
        required: false,
        where: {
          AR_Type: 'C'
        },
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
      limit,
      offset,
      distinct: true,
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
    });

    // Post-filtering for refunds (nested detail search)
    let filteredRows = rows;
    // if (tab === 'refunds' && search) {
    //   const searchLower = search.toLowerCase();
    //   const searchNumber = !isNaN(Number(search)) ? Number(search) : null;
    //   const mappedTypes: Record<string, string> = {
    //     credit: 'C',
    //     return: 'R',
    //   };
    //   const matchType = Object.entries(mappedTypes).find(([label]) =>
    //     label.startsWith(searchLower)
    //   );

    //   filteredRows = rows.filter((row: any) => {
    //     const mainMatch =
    //       (searchNumber !== null && row.Invoice_Number?.toString().includes(search)) ||
    //       (searchNumber !== null && row.C_Number?.toString().includes(search)) ||
    //       (row.AR_Ref && row.AR_Ref.toLowerCase().includes(searchLower)) ||
    //       (matchType && row.AR_Type === matchType[1]);

    //     const detailsMatch = row.details?.some((detail: any) =>
    //       (searchNumber !== null && detail.P_Number_AppliedTo?.toString().includes(search)) ||
    //       (searchNumber !== null &&
    //         detail.invoiceTransaction?.Invoice_Number?.toString().includes(search))
    //     );

    //     return mainMatch || detailsMatch;
    //   });
    // }

    const accountReceivablesList = filteredRows.map((item: any) => {
      const amount = Number(item.AR_Amount || 0);
      const applied = Number(item.AR_Applied || 0);
      const balance = amount - applied;

      if (tab === 'payments') {
        const subType = item.arDefinition?.AR_SubTypeRef?.trim() || 'N/A';
        const reference =
          (item.AR_Ref && item.AR_Ref !== '0' ? item.AR_Ref : '') ||
          (item.Invoice_Number && item.Invoice_Number !== 0
            ? item.Invoice_Number.toString()
            : '0');

        return {
          subType,
          reference,
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
          invoiceNumber: item.Invoice_Number || 0,
          reference: item.AR_Ref,
          invoiceAmount: amount.toFixed(2),
          invoiceDue: balance.toFixed(2),
          invoiceDate: item.AR_Date,
        };
      }

      return {};
    });

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
      totalCount: tab === 'refunds' && search ? filteredRows.length : totalCount,
      page,
      limit,
      currentDue,
      accountReceivablesList,
    };
  }




  // async getAccountReceivablesList(
  //   query: PaginationOptions & { tab?: string; search?: string },
  //   req: any
  // ) {
  //   const page = parseInt(query.page as any) || 1;
  //   const limit = parseInt(query.limit as any) || 10;
  //   const search = query.search?.trim() || '';
  //   const tab = (query.tab || 'charges').trim().toLowerCase();
  //   const offset = (page - 1) * limit;

  //   const cNumber = req.user?.id;
  //   if (!cNumber) {
  //     throw new AppError('Unauthorized: Retailer ID missing', 401);
  //   }

  //   const whereCondition: any = {
  //     C_Number: cNumber,
  //   };

  //   if (tab === 'payments') {
  //     whereCondition.AR_Type = 'C';
  //     whereCondition.AR_Amount = { [Op.gt]: 0 };
  //   } else if (tab === 'charges') {
  //     whereCondition.AR_Type = { [Op.in]: ['I', 'A', 'R'] };
  //   } else if (tab === 'refunds') {
  //     whereCondition.AR_Type = 'C';
  //     whereCondition.AR_Amount = { [Op.lt]: 0 };
  //   }


  //   // Search conditions
  //   const searchConditions: any[] = [];

  //   if (search) {
  //     const searchLower = search.toLowerCase();
  //     const isNumeric = !isNaN(Number(search));
  //     const searchNumber = isNumeric ? Number(search) : null;

  //     const mappedTypes = {
  //       invoice: 'I',
  //       adjustments: 'A',
  //       return: 'R',
  //       credit: 'C',
  //     };

  //     const matchType = Object.entries(mappedTypes).find(([key]) =>
  //       key.startsWith(searchLower)
  //     );

  //     if (tab === 'charges') {
  //       if (matchType && ['I', 'A', 'R'].includes(matchType[1])) {
  //         searchConditions.push({ AR_Type: matchType[1] });
  //       }
  //       if (isNumeric) {
  //         searchConditions.push({ Invoice_Number: { [Op.like]: `%${search}%` } });
  //       }
  //     }

  //     if (tab === 'payments') {
  //       searchConditions.push({ AR_Ref: { [Op.like]: `%${search}%` } });
  //       searchConditions.push(
  //         Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('arDefinition.AR_SubTypeRef')), {
  //           [Op.like]: `%${searchLower}%`,
  //         })
  //       );
  //     }

  //     if (tab === 'refunds') {
  //       searchConditions.push({ AR_Ref: { [Op.like]: `%${search}%` } });

  //       if (matchType && ['C', 'R'].includes(matchType[1])) {
  //         searchConditions.push({ AR_Type: matchType[1] });
  //       }

  //       if (isNumeric) {
  //         searchConditions.push({ Invoice_Number: { [Op.like]: `%${search}%` } });
  //         searchConditions.push({ C_Number: { [Op.like]: `%${search}%` } });
  //       }
  //     }

  //     if (tab !== 'refunds' && searchConditions.length > 0) {
  //       whereCondition[Op.or] = searchConditions;
  //     }
  //   }
  //   const { count: totalCount, rows } = await CustReceivables.findAndCountAll({
  //     where: whereCondition,
  //     limit,
  //     offset,
  //     order: [['AR_Date', 'DESC']],
  //   });
  //   return {
  //     totalCount,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(totalCount / limit),
  //     data: rows
  //   };


  // }


  async getOrderHistory(customerNumber: number, query: PaginationOptions & { search?: string, startDate?: string, endDate?: string }) {
    let { page = 1, limit = 10, search, startDate, endDate } = query;
    page = parseInt(page as any) || 1;
    limit = parseInt(limit as any) || 10;
    const offset = (page - 1) * limit;

    // Build where clause for OrderHeader
    let whereClause: any = { C_Number: customerNumber, Order_Deleted: false };

    // Add search functionality if provided
    if (search) {
      const searchLower = search.toLowerCase();

      // Check if search is for order source names
      let orderSourceCondition = null;
      if (searchLower === 'web' || searchLower === 'app' || searchLower === 'erp') {
        if (searchLower === 'web') {
          orderSourceCondition = 13;
        } else if (searchLower === 'app') {
          orderSourceCondition = 12;
        } else if (searchLower === 'erp') {
          // ERP is everything else (not 12 or 13)
          whereClause[Op.and] = [
            { Order_Source: { [Op.notIn]: [12, 13] } }
          ];
        }
      }

      if (orderSourceCondition) {
        whereClause[Op.or] = [
          { Order_Number: { [Op.like]: `%${search}%` } },
          { Order_Source: orderSourceCondition }
        ];
      } else {
        whereClause[Op.or] = [
          { Order_Number: { [Op.like]: `%${search}%` } },
          { Order_Source: { [Op.like]: `%${search}%` } }
        ];
      }
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
      // Map Order_Source to readable names
      let orderSourceName = 'ERP';
      if (header.Order_Source === 13) {
        orderSourceName = 'Web';
      } else if (header.Order_Source === 12) {
        orderSourceName = 'App';
      }

      return {
        Order_Number: header.Order_Number,
        Order_Date: header.Order_Date,
        User_ID: header.User_ID,
        Order_Source: header.Order_Source,
        Order_Source_Name: orderSourceName,
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

    const orderDiscount = await OrderDiscount.findOne({
      where: { orderNumber: orderNumber }
    });
    if (orderDiscount) {
      totalDiscount = orderDiscount.discount;
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

  async getNewItems(user: any) {

    let whereClause: any = {
      I_Inactive: false,
    };
    const { count: totalCount, rows: productList } = await Inventory.findAndCountAll({
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
        'UnitOunces'
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
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          where: {
            Status: 0,

          },
          required: false
        }
      ],
      order: [['Date_Created', 'DESC']],
      limit: 10,

    });

    const finalProductList = await Promise.all(productList.map(async (e: any) => {
      const productImage = await ProductImage.findOne({
        where: {
          product_number: e.Item_Number.toString(),
          isAllow: true
        },
      });

      let price = await getDiscount(Number(e.Item_Number), Number(user.id));
      if (!price) {
        price = await getFirstValidPrice(e);
      }

      return {
        Pack: e.Pack,
        Description: e.Description,
        Item_Number: e.Item_Number,
        CaseCount: e.CaseCount,
        UOM: e.UOM,
        Price1: e.Price1,
        price: price,
        UnitOunces: e.UnitOunces,
        BaseCost: e.BaseCost,
        Invoice_Cost: e.Invoice_Cost,
        AvgCost: e.AvgCost,
        NetCost: e.NetCost,
        UPCList: e.UPCList,
        SalesCategory: e.SalesCategory?.Category_Desc || null,
        PriceClass: e.PriceClass?.Class_Desc || null,
        showDistributorImage: productImage?.isAllow ?? false,
        distributorImage: productImage?.img_url || null,
        masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
      };
    }));

    return {
      finalProductList,
    };
  }


  async getOrderedProducts(
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
    // console.log(orderDetails,'orderDetails')
    // const otpNumbers = orderDetails.map((e: any) => e.inventory.OTP_Number);
    const otpNumbers = orderDetails
      .map((e: any) => e.inventory?.OTP_Number)
      .filter((num: any) => num != undefined);





    const productImages = await ProductImage.findAll({
      where: {
        product_number: { [Op.in]: itemNumbers.map(String) },
        isAllow: true
      }
    });
    const imageMap = new Map(productImages.map(img => [img.product_number, img]));
    const discountMap = await getDiscountsForItemNumbers(itemNumbers, customerId);

    const userJurisdiction = await getJurisdiction(customerId);
    let taxMap: any = {};



    const topLatestItems = await getTopLatestItems();

    // Process the results to include product images and format the data
    const finalOrderDetails = await Promise.all(orderDetails.map(async (detail: any) => {
      const inventoryOnHand = await getInventoryOnHand(detail.Item_Number) || 0;
      const itemStr = detail.Item_Number.toString();
      const productImage = imageMap.get(itemStr) || null;
      let price = discountMap[detail?.Item_Number] ?? await getFirstValidPrice(detail);
      const taxRate = await getTaxRateV1(detail?.inventory?.OTP_Number, userJurisdiction as number, detail?.Item_Number, price);

      const isDiscounted = detail?.inventory?.Price_Subclass ? await hasDiscountedItem(detail?.Item_Number, detail?.inventory?.Price_Subclass) : false;
      let allowToOrder = true;
      if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
        allowToOrder = false;
      }
      const productLimit = await getProductLimit(detail.Item_Number) || 0;
      let hasQtyDiscount = await checkQtyDiscount(detail.Item_Number, customerId, price + taxRate) || false;
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
        hasProductLimit: productLimit ? true : false,
        productLimit: productLimit,
        showTheInventoryStock: wareHouseSetting?.salesRep?.showStock || false,
        showLowStock: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
        showWithOutPrice: wareHouseSetting?.salesRep?.showWithOutPrice || false,
        hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
        qtyDiscount: hasQtyDiscount,
        Inventory_OnHand: inventoryOnHand,

        // Order detail information
        Line_Number: detail.Line_Number,
        Item_Number: detail.Item_Number,
        Quantity_Ordered: detail.Quantity_Ordered,
        Quantity_Shipped: detail.Quantity_Shipped,
        Price: detail.Price,
        ItemDescription: detail.ItemDescription,
        CaseCount: detail.inventory.CaseCount,
        Pack: detail.inventory.Pack,
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

        // Calculated fields

        totalOrder: detail.total_Ordered,
        // Category information
        SalesCategory: detail.inventory.SalesCategory?.Category_Desc || null,
        PriceClass: detail.inventory.PriceClass?.Class_Desc || null,

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
          time: status.Picklist_Time,
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
          model: InventoryUPC,
          as: 'UPCList',
          attributes: ['UPC_Number'],
          required: false
        }
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

    const inventoryOnHand = await getInventoryOnHand(findItem.Item_Number) || 0;
    let taxRate = 0
    const userJurisdiction = await getJurisdiction(userId);
    if (findItem.OTP_Number) taxRate = await getTaxRateV1(findItem.OTP_Number, userJurisdiction as number, findItem.Item_Number, price);


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
      TotalPriceWithTax: finalItem.price + finalItem.taxRate,
      originalPrice: finalItem.price,
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
        TotalPriceWithTax: Number(existingCartItem.TotalPriceWithTax) + Number(obj.TotalPriceWithTax)
      });

      return existingCartItem;
    } else {
      return await CustomerCart.create(obj);
    }
  }

  async scanItemByBarcode(barcode: string, userId: number) {
    // Step 1: Check if UPC exists

    let upcRecord;

      // Step 1: Check if UPC exists
      // const upcRecord = await InventoryUPC.findOne({
      //   where: {
      //     UPC_Number: {
      //       [Op.like]: `%${barcode}%`,
      //     },
      //   },
      // })

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

    // Step 2: Fetch item details from Inventory
    const item = await Inventory.findOne({
      where: { Item_Number: upcRecord.Item_Number },
      attributes: [
        "Pack", "Description", "Item_Number", "CaseCount", "UOM",
        "Price1", "Price2", "BaseCost", "Invoice_Cost", "AvgCost",
        "NetCost", "OTP_Number", "Price_Subclass"
      ],
      include: [
        { model: SalesCategory, as: "SalesCategory", attributes: ["Category_Desc"], required: false },
        { model: PriceClass, as: "PriceClass", attributes: ["Class_Desc"], required: false },
        // { model: InventoryStatus, as: "inventoryStatus", attributes: ["Inventory_OnHand"], required: false },
        { model: InventoryUPC, as: "UPCList", attributes: ["UPC_Number"], required: false }
      ]
    });

    if (!item) {
      throw new AppError("Item details not found in Inventory", 404);
    }
    const userJurisdiction = await getJurisdiction(userId);

    // Step 3: Pricing & Tax
    let price = (await getDiscount(Number(item.Item_Number), userId)) || (await getFirstValidPrice(item));
    const isDiscounted = await hasDiscountedItem(item.Item_Number || 0, item.Price_Subclass || 0);
    price = Math.ceil(price * 100) / 100;

    let taxRate = await getTaxRateV1(item.OTP_Number as number, userJurisdiction as number, item.Item_Number, price);
    taxRate = Math.ceil(taxRate * 100) / 100;

    // Step 4: Build response object (same format as your example)
    const productImage = await ProductImage.findOne({
      where: { product_number: item.Item_Number.toString(), isAllow: true }
    });

    const inventoryOnHand = await getInventoryOnHand(item.Item_Number);
    const wareHouseSetting: any = await Setting.findOne({});
    const allowToOrder = wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible || inventoryOnHand > 0;

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

    // // Step 5: Add to scannedItems memory (per user)
    // if (!this.scannedItems[userId]) this.scannedItems[userId] = [];

    // const existingItem = this.scannedItems[userId].find((i) => i.Item_Number === formattedItem.Item_Number);
    // if (existingItem) {
    //   existingItem.quantity += 1;
    // } else {
    //   this.scannedItems[userId].push(formattedItem);
    // }
    console.log('Scanned Item:', formattedItem);
    return formattedItem;
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
        taxRate = await getTaxRateV1(findItem.OTP_Number, userJurisdiction as number, findItem.Item_Number, price);
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


  async getNotificationList(userId: string) {
    const notificationList = await Notifications.findAll({
      where: {
        userNumber: userId,
        isActive: true
      },
      order: [['createdAt', 'DESC']]
    });
    return notificationList;
  }

  async readAllNotification(userId: string) {
    await Notifications.update({
      isRead: true
    }, {
      where: { userNumber: userId }
    });
  }

  async readNotification(notificationId: number) {
    await Notifications.update({
      isRead: true
    }, {
      where: { id: notificationId }
    });
  }

  async deleteNotification(notificationId: number) {
    await Notifications.update({
      isActive: false
    }, {
      where: { id: notificationId }
    });
  }

  async deleteAllNotification(userId: string) {
    await Notifications.update({
      isActive: false
    }, {
      where: { userNumber: userId }
    });
  }


  async putFcmToken(deviceId: number, fcmToken: string) {
    await RetailerDevice.update({
      deviceToken: fcmToken
    }, {
      where: { id: deviceId }
    });
  }

  async getPdfOfOrderDetails(query: PaginationOptions & { orientation?: 'portrait' | 'landscape' }, userId: number) {
    const { orderNumber, hasPrice = false, orientation = 'landscape' } = query;

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

  async createSupportTicket(ticket: any, userId: number, file: any) {
    try {
      const [customer, distributor] = await Promise.all([
        Customer.findByPk(userId, {
          attributes: ['C_Email', 'C_Name', 'C_Number']
        }),
        Distributor.findOne()
      ]);

      if (file) {
        const uploaded = await uploadFileToAzure(
          file.buffer,
          file.originalname,
          file.mimetype,
          'support-tickets'
        );
        if (uploaded?.url) {
          ticket.attachment = uploaded.url;
        }
      }

      const supportTicket = await SupportTicket.create({
        ...ticket,
        C_Number: userId
      });

      this.notificationScheduler({
        title: `New support request`,
        description: `Your ticket is created successfully. We’ll keep you posted`,
        userNumber: userId.toString()
      })
      // Fire-and-forget email sending
      this.sendSupportTicketEmails(supportTicket, customer, distributor);


      return supportTicket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket.');
    }
  }



  async getSupportTicket(
    userId: number,
    query: PaginationOptions
  ) {
    let { page = 1, limit = 10 } = query;

    // Ensure values are numbers and positive
    page = Math.max(1, Number(page));
    limit = Math.max(1, Number(limit));

    const offset = (page - 1) * limit;

    const { count, rows } = await SupportTicket.findAndCountAll({
      where: { C_Number: userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows
    };
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
  // RetailerProductCatalog CRUD methods
  async createRetailerProductCatalog(body: ICreateRetailerProductCatalog, req: AuthRequest) {
    const file = req.file;
    const { id } = req.user;
    if (!file) {
      throw new AppError(Manager.RETAILER_PRODUCT_CATALOG_ATTACHMENT_REQUIRED, 400);
    }
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

  async getRetailerProductCatalogById(id: number) {
    const catalog = await RetailerProductCatalog.findByPk(id);
    if (!catalog) {
      throw new AppError(Manager.RETAILER_PRODUCT_CATALOG_NOT_FOUND, 404);
    }
    return catalog;
  }

  async getAllRetailerProductCatalogs(query: PaginationOptions & IGetRetailerProductCatalogs) {
    let { page = 1, limit = 10, search, isActive, status } = query;
    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    let whereClause: any = {
      isActive: true,
      status: true
    };

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

    await catalog.update(body);
    return catalog;
  }

  async deleteRetailerProductCatalog(id: number) {
    const catalog = await RetailerProductCatalog.findByPk(id);
    if (!catalog) {
      throw new AppError(Manager.RETAILER_PRODUCT_CATALOG_NOT_FOUND, 404);
    }

    await catalog.destroy();
    return { message: "Retailer product catalog deleted successfully" };
  }

  async toggleRetailerProductCatalogStatus(id: number) {
    const catalog = await RetailerProductCatalog.findByPk(id);
    if (!catalog) {
      throw new AppError(Manager.RETAILER_PRODUCT_CATALOG_NOT_FOUND, 404);
    }

    await catalog.update({ isActive: !catalog.isActive });
    return catalog;
  }

  async getLinks() {
    const links = await Link.findAll({
      where: {
        status: true,
        isActive: true
      }
    });
    return links;
  }


  // story
  async getAllStory(query: PaginationOptions & IGetStories, req: AuthRequest) {


    const whereCondition: any = {
      isActive: true,
      expiresAt: { [Op.gt]: moment().toDate() }
    };

    const stories = await Story.findAll({
      where: whereCondition,
      attributes: ['id', 'mediaUrl', 'mediaType', 'caption', 'expiresAt', 'isActive'],


      // include: [
      //   {
      //     model: StoryView,
      //     as: 'views',
      //     where: { viewerId: req.user.id },
      //     required: false,
      //     attributes: []
      //   }
      // ],
      order: [
        // [Sequelize.literal(`CASE WHEN "views"."id" IS NOT NULL THEN 1 ELSE 0 END`), 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    return {

      stories
    };
  }


  async viewStory(storyId: number, req: AuthRequest) {
    const { id } = req.user;
    const story = await Story.findByPk(Number(storyId));
    if (!story) {
      throw new AppError(Manager.STORY_NOT_FOUND, 404);
    }

    const isProductView = await StoryView.findOne({ where: { storyId: Number(storyId), viewerId: Number(id) } });
    if (!isProductView) {
      await StoryView.create({ storyId: Number(storyId), viewerId: Number(id), viewedAt: moment().toDate() });
    }
    return story;
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

  async hasmultipleStore(email: string) {
    let customer: any = await Customer.findAll({
      where: {
        C_Email: email
      }
    })

    //  customer = customer?.dataValues
    console.log(customer, 'the customer');
    if (customer.length > 1) {
      const findCustomerId = customer.map((e: any) => e.C_Number)
      const findRetailer = await Retailer.findAll({
        where: {
          Customer_Number: {
            [Op.in]: findCustomerId
          }
        }
      })
      if (findRetailer.length > 1) {
        const storeId = findRetailer.map((e: any) => e.Customer_Number)

        const stores = await Customer.findAll({
          where: {
            C_Number: {
              [Op.in]: storeId
            }
          },
          attributes: ['C_Number', 'C_CoName', 'C_Number']
        })

        return {
          hasMultipleStore: true,
          stores: stores
        }
      } else {
        return {
          hasMultipleStore: false,
          stores: []
        }
      }
    } else {
      return {
        hasMultipleStore: false,
        stores: []
      }
    }


  }



  async switchStore(storeId: number, req: Request) {
    const logo: any = await Setting.findOne({ attributes: ["warehouseImage"] });

    const deviceId = req.headers['x-device-id'] as string;
    const deviceName = req.headers['x-device-name'] as string;
    const deviceType = req.headers['x-device-type'] as 'web' | 'mobile';

    const wareHouseDetail = await Distributor.findAll({
      attributes: ["D_Name", "D_Addr1", "D_City", "D_State", "D_Phone"],
    });
    const storeDetail = await Customer.findOne({
      where: { C_Number: Number(storeId) },
      attributes: [
        "C_CoName",
        "C_Number",
        "C_Address",
        "C_City",
        "C_State",
        "C_Phone",
        "C_Email",
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


    let device = await RetailerDevice.findOne({ where: { deviceId: deviceId, customerNumber: storeDetail?.C_Number } });

    if (!device) {
      device=   await RetailerDevice.create({
        deviceId: deviceId,
        deviceName: deviceName,
        deviceType: deviceType,
        isAllow: true,
        customerNumber: storeDetail?.C_Number || 0,
        deviceToken:  "",
      });
    }

    const token = generateToken({
      id: storeId,
      deviceId: device?.id.toString() || "",
      role: "retailer",
    })
    await Token.create({
      token: token,
      deviceId: device?.id || 0,
      retailerId: storeId,

    })

    return {
      wareHouseDetail,
      storeDetail,
      role: "retailer",
      token,
      logo: logo?.warehouseImage || null
    };

  }

}