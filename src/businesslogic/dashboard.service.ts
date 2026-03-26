import HomeSettings from "../models/postgres/homeSetting.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Customer } from "../models/mmsql/customer.model";
import { SalesRep } from "../models/mmsql/salesrep.model";
import { Sequelize, Op, col, cast, where, QueryTypes, literal, fn } from "sequelize";
import { checkQtyDiscount, excludeItemByUser, getAllowedSalesCategories, getCustomerExcludeItem, getFirstValidPrice, getInventoryOnHand, getJurisdiction, getPrepaidTaxRate, getProductLimit, getTaxRateV1 } from "../utils/helper";
import { ProductImage } from "../models/postgres/product.model";
import { getDiscount } from "../utils/helper";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { PriceClass } from "../models/mmsql/priceClass.model";
import { PaginationOptions } from "../interfaces/pagination.interface";
import InventorySpecials from "../models/mmsql/inventorySpecail.model";
import { WarehouseSetting } from "../models/postgres/wareHouseSetting.model";
import Setting from "../models/postgres/setting.model";
import { OrderHistory } from "../models/postgres/orderHistory.model";
import { OrderPick } from "../models/postgres/epickOrder.model";
import { WebUsers } from "../models/postgres/users.model";
import { EpickUser } from "../models/postgres/epickUser.model";
import { EpickConfirmation } from "../models/postgres/epickConfirmation.model";
import { OverrideRequest } from "../models/postgres/overrideRequest.model";
import { OrderPickScan } from "../models/postgres/epickOrderScan.model";
import { sequelize } from "../db";
import { Order_Header_Costs } from "../models/mmsql/orderHeaderCost.model";
import { Users } from "../models/mmsql/user.model";
import { CustomerSpecialGroup } from "../models/mmsql/customerSpecialGroup.model";
import { getProductDiscountFromRedis } from "../utils/productDiscount.redis";


export class DashboardService {

    async getPopularItems(userId: number, query: any) {
        let { state = '', zip = '', jurisdiction = '', salesCategory = [] } = query;
        console.log(userId, 'userId')
        if (userId) {
            salesCategory = await getAllowedSalesCategories(userId);
        }
        const homeSetting = await HomeSettings.findOne();
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59); // December 31st of current year
        let mostSaleData = null;
        let customerHistoryData = null;
        let asPerCustomerData = null;
        let wareHouseSetting: any = await Setting.findOne({});
        wareHouseSetting = wareHouseSetting?.dataValues || null;

        let allExcludedItems: any[] = [];


        let whereClause: any = {};
        if (state || zip || jurisdiction) {
            const customerExcluded = await getCustomerExcludeItem(
                state as string,
                zip as string,
                jurisdiction as number
            );

            if (customerExcluded && customerExcluded.length > 0) {
                allExcludedItems = allExcludedItems.concat(customerExcluded);
            }
        }
        const userExcluded = await excludeItemByUser(userId);
        if (userExcluded && userExcluded.length > 0) {
            allExcludedItems = allExcludedItems.concat(userExcluded);
        }

        if (allExcludedItems.length > 0) {
            const uniqueExcluded = [...new Set(allExcludedItems)];
            whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
        }

        if (salesCategory.length > 0) {
            whereClause.Sales_Category = { [Op.in]: salesCategory };
        }

        if (homeSetting?.showMostSale) {
            // Get most sold inventory items in the current year
            const allMostSaleData = await OrderDetail.findAll({
                where: {
                    ...whereClause,
                    Quantity_Shipped: {
                        [Op.gt]: 0 // Only include items that were actually shipped
                    }
                },
                attributes: [
                    'Item_Number',
                    [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantitySold'],
                    [Sequelize.fn('COUNT', Sequelize.col('OrderDetail.Order_Number')), 'totalOrders']
                ],
                include: [
                    {
                        model: OrderHeader,
                        as: 'orderHeader',
                        attributes: [],
                        where: {
                            Order_Date: {
                                [Op.between]: [startOfYear, endOfYear]
                            }
                        },
                        required: true
                    }
                ],

                group: ['OrderDetail.Item_Number'],
                order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'DESC']],
                raw: true
            });

            // Get the top 10 item numbers
            const topItemNumbers = allMostSaleData.slice(0, 10).map((item: any) => item.Item_Number);

            if (topItemNumbers.length > 0) {
                // Fetch complete inventory data for top items
                const productList = await Inventory.findAll({
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
                        'ShortOrderForm',
                        'Date_Created',
                        'OTP_Number',
                        'UnitOunces',
                        'Cig_Pack',
                        'Cig_Sticks'
                    ],
                    where: {
                        Item_Number: { [Op.in]: topItemNumbers },
                        ShortOrderForm: true,
                        I_Inactive: false,
                    },
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
                            model: InventoryUPC,
                            as: 'UPCList',
                            attributes: ['UPC_Number'],
                            where: {
                                Status: 0
                            },
                            required: false
                        }
                    ],
                    order: [['Description', 'ASC']]
                });

                const finalProductList = await Promise.all(productList.map(async (e: any) => {
                    const productImage = await ProductImage.findOne({
                        where: {
                            product_number: e.Item_Number.toString(),
                            isAllow: true
                        }
                    });
                    let taxRate = 0;
                    const userJurisdiction = await getJurisdiction(userId);


                    let price = await getDiscount(e.Item_Number, userId)
                    if (!price) {
                        price = await getFirstValidPrice(e);
                    }
                    // price = Math.ceil(price * 100) / 100;

                    if (userJurisdiction) {
                        taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                        taxRate = Math.ceil(taxRate * 100) / 100;
                    }
                    const inventoryOnHand = await getInventoryOnHand(e.Item_Number)

                    let allowToOrder = true;
                    let allowToOrderSalesRep = true;


                    if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                        allowToOrder = false;
                    }

                    if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                        allowToOrderSalesRep = false;
                    }

                    const productLimit = await getProductLimit(e.Item_Number);

                    let hasQtyDiscount = await checkQtyDiscount(e.Item_Number, userId, price + taxRate);

                    let prepaidTaxRate = 0
                    console.log(e, 'e.Sales_Category_______DASHBOARD')
                    if (userJurisdiction != null && e.SalesCategory) {

                        console.log(e, 'e.Sales_Category')
                        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.SalesCategory?.Sales_Category, e, price + taxRate);
                    }

                    const discount = await getProductDiscountFromRedis(Number(e.Item_Number));

                    return {
                        Pack: e.Pack,
                        Description: e.Description,
                        Item_Number: e.Item_Number,
                        CaseCount: e.CaseCount,
                        UOM: e.UOM,
                        Price1: e.Price1,
                        Price2: e.Price2,
                        Tax_Rate: taxRate,
                        OTP_Number: e.OTP_Number,
                        price: price,
                        priceWithTax: price + taxRate,
                        UnitOunces: e.UnitOunces,
                        BaseCost: e.BaseCost,
                        Invoice_Cost: e.Invoice_Cost,
                        AvgCost: e.AvgCost,
                        NetCost: e.NetCost,
                        hasProductLimit: productLimit ? true : false,
                        productLimit,
                        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                        prepaidTaxRate: prepaidTaxRate,
                        productDiscount: discount ?? null,

                        showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                        showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                        showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                        allowToOrderSalesRep: allowToOrderSalesRep || null,
                        showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,

                        hasQtyDiscount: discount ? false : hasQtyDiscount?.allowToDiscount || false,
                        qtyDiscount: hasQtyDiscount,



                        Inventory_OnHand: inventoryOnHand || 0,
                        allowToOrder,
                        showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                        showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                        showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,




                        UPCList: e.UPCList,
                        imageId: productImage?.id || null,
                        SalesCategory: e.SalesCategory?.Category_Desc || null,
                        PriceClass: e.PriceClass?.Class_Desc || null,
                        showDistributorImage: productImage?.isAllow ?? false,
                        distributorImage: productImage?.img_url || null,
                        masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
                    };
                }));

                mostSaleData = {
                    totalCount: finalProductList.length,
                    finalProductList
                };
            }
        }

        if (homeSetting?.showAsPerCustomer) {
            // Get current customer's city
            const currentCustomer = await Customer.findByPk(userId);
            console.log(currentCustomer, 'currentCustomer')
            if (currentCustomer?.C_City) {
                // Find other customers in the same city (excluding current customer)
                const sameCityCustomers = await Customer.findAll({
                    where: {
                        C_City: 'GREENVILLE',
                        C_Number: {
                            [Op.ne]: userId // Exclude current customer
                        },
                        C_Inactive: false // Only active customers
                    },
                    attributes: ['C_Number'],
                    raw: true
                });

                if (sameCityCustomers.length > 0) {
                    const customerIds = sameCityCustomers.map(customer => customer.C_Number);

                    let whereClause: any = {};
                    if (state || zip || jurisdiction) {
                        const customerExcluded = await getCustomerExcludeItem(
                            state as string,
                            zip as string,
                            jurisdiction as number
                        );
                    }

                    const userExcluded = await excludeItemByUser(Number(userId));
                    if (userExcluded && userExcluded.length > 0) {
                        allExcludedItems = allExcludedItems.concat(userExcluded);
                    }
                    if (allExcludedItems.length > 0) {
                        const uniqueExcluded = [...new Set(allExcludedItems)];
                        whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
                    }

                    if (salesCategory.length > 0) {
                        whereClause.Sales_Category = { [Op.in]: salesCategory };
                    }
                    // Get products that other customers in the same city buy
                    const allAsPerCustomerData = await OrderDetail.findAll({
                        attributes: [
                            'Item_Number',
                            'Sales_Category',
                            [Sequelize.fn('SUM', Sequelize.col('Quantity_Shipped')), 'totalQuantitySold'],
                            [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('orderHeader.C_Number'))), 'uniqueCustomers'],
                            [Sequelize.fn('COUNT', Sequelize.col('OrderDetail.Order_Number')), 'totalOrders']
                        ],
                        include: [
                            {
                                model: OrderHeader,
                                as: 'orderHeader',
                                attributes: [],
                                where: {
                                    C_Number: {
                                        [Op.in]: customerIds
                                    },
                                    Order_Date: {
                                        [Op.between]: [startOfYear, endOfYear]
                                    }
                                },
                                required: true
                            }
                        ],
                        where: {
                            ...whereClause,
                            Quantity_Shipped: {
                                [Op.gt]: 0 // Only include items that were actually shipped
                            }
                        },
                        group: ['OrderDetail.Item_Number'],
                        order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Shipped')), 'DESC']],
                        raw: true
                    });

                    // Get the top 10 item numbers
                    const topItemNumbers = allAsPerCustomerData.slice(0, 10).map((item: any) => item.Item_Number);

                    if (topItemNumbers.length > 0) {
                        // Fetch complete inventory data for top items
                        const productList = await Inventory.findAll({
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
                                'ShortOrderForm',
                                'I_Inactive',
                                'Date_Created',
                                'OTP_Number',
                                'UnitOunces',
                                'Cig_Pack',
                                'Cig_Sticks'
                            ],
                            where: {
                                Item_Number: { [Op.in]: topItemNumbers },
                                ShortOrderForm: true,
                                I_Inactive: false,
                            },
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
                                    model: InventoryUPC,
                                    as: 'UPCList',
                                    attributes: ['UPC_Number'],
                                    where: {
                                        Status: 0
                                    },
                                    required: false
                                }
                            ],
                            order: [['Date_Created', 'DESC']]
                        });

                        const finalProductList = await Promise.all(productList.map(async (e: any) => {
                            const productImage = await ProductImage.findOne({
                                where: {
                                    product_number: e.Item_Number.toString(),
                                    isAllow: true
                                }
                            });
                            let taxRate = 0;
                            const userJurisdiction = await getJurisdiction(Number(userId));

                            let price = await getDiscount(Number(e.Item_Number), Number(userId));
                            if (!price) {
                                price = await getFirstValidPrice(e);
                            }
                            // price = Math.ceil(price * 100) / 100;
                            if (userJurisdiction) {
                                taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                                taxRate = Math.ceil(taxRate * 100) / 100;
                            }
                            const inventoryOnHand = await getInventoryOnHand(e.Item_Number)


                            let allowToOrderSalesRep = true;
                            let allowToOrder = true;
                            let wareHouseSetting: any = await Setting.findOne({});
                            wareHouseSetting = wareHouseSetting?.dataValues || null;

                            if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
                                allowToOrderSalesRep = true;
                            }
                            else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                                allowToOrderSalesRep = false;
                            }

                            if (wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
                                allowToOrder = true;
                            }
                            else if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                                allowToOrder = false;
                            }
                            const productLimit = await getProductLimit(e.Item_Number);

                            let hasQtyDiscount = await checkQtyDiscount(e.Item_Number, userId, price + taxRate);

                            let prepaidTaxRate = 0
                            console.log(e, 'e.Sales_Category')
                            if (userJurisdiction != null && e.SalesCategory) {

                                console.log(e, 'e.Sales_Category')
                                prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.SalesCategory?.Sales_Category, e, price + taxRate);
                            }

                            const discount = await getProductDiscountFromRedis(Number(e.Item_Number));
                            return {
                                Pack: e.Pack,
                                Description: e.Description,
                                Item_Number: e.Item_Number,
                                CaseCount: e.CaseCount,
                                UOM: e.UOM,
                                Tax_Rate: taxRate,
                                OTP_Number: e.OTP_Number,
                                price: price,
                                priceWithTax: price + taxRate,
                                Price1: e.Price1,
                                Price2: e.Price2,
                                UnitOunces: e.UnitOunces,
                                BaseCost: e.BaseCost,
                                Invoice_Cost: e.Invoice_Cost,
                                AvgCost: e.AvgCost,
                                NetCost: e.NetCost,



                                hasPrepaidTaxRate: prepaidTaxRate ? true : false,

                                prepaidTaxRate: prepaidTaxRate,

                                hasProductLimit: productLimit ? true : false,
                                productLimit,

                                hasQtyDiscount: discount ? false : hasQtyDiscount?.allowToDiscount || false,
                                productDiscount: discount ?? null,
                                qtyDiscount: hasQtyDiscount,
                                showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                                showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                                showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                                allowToOrderSalesRep: allowToOrderSalesRep || null,
                                showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,



                                Inventory_OnHand: inventoryOnHand || 0,
                                allowToOrder,
                                showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                                showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                                showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,


                                UPCList: e.UPCList,
                                imageId: productImage?.id || null,
                                SalesCategory: e.SalesCategory?.Category_Desc || null,
                                PriceClass: e.PriceClass?.Class_Desc || null,
                                showDistributorImage: productImage?.isAllow ?? false,
                                distributorImage: productImage?.img_url || null,
                                masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
                            };
                        }));

                        asPerCustomerData = {
                            totalCount: finalProductList.length,
                            finalProductList
                        };
                    }
                }
            }
        }

        if (homeSetting?.showCustomerHistory) {

            let whereClause: any = {};
            if (state || zip || jurisdiction) {
                const customerExcluded = await getCustomerExcludeItem(
                    state as string,
                    zip as string,
                    jurisdiction as number
                );
            }

            const userExcluded = await excludeItemByUser(Number(userId));
            if (userExcluded && userExcluded.length > 0) {
                allExcludedItems = allExcludedItems.concat(userExcluded);
            }

            if (allExcludedItems.length > 0) {
                const uniqueExcluded = [...new Set(allExcludedItems)];
                whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
            }

            if (salesCategory.length > 0) {
                whereClause.Sales_Category = { [Op.in]: salesCategory };
            }

            // Get customer's most bought products for the current year
            const customerOrderHistory = await OrderDetail.findAll({
                attributes: [
                    'Item_Number',
                    [Sequelize.fn('SUM', Sequelize.col('Quantity_Shipped')), 'totalQuantityBought'],
                    [Sequelize.fn('COUNT', Sequelize.col('OrderDetail.Order_Number')), 'totalOrders']
                ],
                include: [
                    {
                        model: OrderHeader,
                        as: 'orderHeader',
                        attributes: [],
                        where: {
                            C_Number: userId,
                            Order_Date: {
                                [Op.between]: [startOfYear, endOfYear]
                            }
                        },
                        required: true
                    }
                ],
                where: {
                    ...whereClause,
                    Quantity_Shipped: {
                        [Op.gt]: 0 // Only include items that were actually shipped
                    }
                },
                group: ['OrderDetail.Item_Number'],
                order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Shipped')), 'DESC']],
                raw: true
            });

            // Get the top 10 item numbers manually since we can't use LIMIT with GROUP BY in this case
            const top10CustomerOrderHistory = customerOrderHistory.slice(0, 10);

            // Get the top 10 item numbers
            const topItemNumbers = top10CustomerOrderHistory.map((item: any) => item.Item_Number);

            if (topItemNumbers.length > 0) {
                // Fetch complete inventory data for top items
                const productList = await Inventory.findAll({
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
                        'ShortOrderForm',
                        'Date_Created',
                        'OTP_Number',
                        'UnitOunces',
                        'Cig_Pack',
                        'Cig_Sticks'
                    ],
                    where: {
                        Item_Number: { [Op.in]: topItemNumbers },
                        ShortOrderForm: true,
                        I_Inactive: false,
                    },
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
                            model: InventoryUPC,
                            as: 'UPCList',
                            attributes: ['UPC_Number'],
                            where: {
                                Status: 0
                            },
                            required: false
                        }
                    ],
                    order: [['Date_Created', 'DESC']]
                });

                const finalProductList = await Promise.all(productList.map(async (e: any) => {
                    const productImage = await ProductImage.findOne({
                        where: {
                            product_number: e.Item_Number.toString(),
                            isAllow: true
                        }
                    });
                    let taxRate = 0;
                    let price = await getDiscount(e.Item_Number, userId)
                    if (!price) {
                        price = await getFirstValidPrice(e);
                    }
                    // price = Math.ceil(price * 100) / 100;
                    const userJurisdiction = await getJurisdiction(Number(userId));
                    if (userJurisdiction) {
                        taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                        taxRate = Math.ceil(taxRate * 100) / 100;
                    }
                    const productLimit = await getProductLimit(e.Item_Number);
                    const inventoryOnHand = await getInventoryOnHand(e.Item_Number)

                    let allowToOrder = true;
                    let allowToOrderSalesRep = true;

                    if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
                        allowToOrderSalesRep = true;
                    }
                    else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                        allowToOrderSalesRep = false;
                    }

                    if (wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
                        allowToOrder = true;
                    }
                    else if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                        allowToOrder = false;
                    }

                    let hasQtyDiscount = await checkQtyDiscount(e.Item_Number, userId, price + taxRate);

                    // Find the corresponding order history data for this item
                    const orderHistoryItem: any = top10CustomerOrderHistory.find((item: any) => item.Item_Number === e.Item_Number);

                    let prepaidTaxRate = 0
                    console.log(e, 'e.Sales_Category--->')
                    if (userJurisdiction != null && e.SalesCategory) {

                        console.log(e, 'e.Sales_Category')
                        prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.SalesCategory?.Sales_Category, e, price + taxRate);
                    }
                    const discount = await getProductDiscountFromRedis(Number(e.Item_Number));



                    return {
                        Pack: e.Pack,
                        Description: e.Description,
                        Item_Number: e.Item_Number,
                        CaseCount: e.CaseCount,
                        UOM: e.UOM,
                        Price1: e.Price1,
                        Price2: e.Price2,
                        Tax_Rate: taxRate,
                        OTP_Number: e.OTP_Number,
                        UnitOunces: e.UnitOunces,
                        price: price,
                        hasProductLimit: productLimit ? true : false,
                        productLimit,
                        hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                        prepaidTaxRate: prepaidTaxRate,
                        showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                        showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                        showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                        allowToOrderSalesRep: allowToOrderSalesRep || null,
                        showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,

                        hasQtyDiscount: discount ? false : hasQtyDiscount?.allowToDiscount || false,
                        productDiscount: discount ?? null,
                        qtyDiscount: hasQtyDiscount,

                        Inventory_OnHand: inventoryOnHand || 0,
                        allowToOrder,
                        showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                        showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                        showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,

                        priceWithTax: price + taxRate,
                        BaseCost: e.BaseCost,
                        Invoice_Cost: e.Invoice_Cost,
                        AvgCost: e.AvgCost,
                        NetCost: e.NetCost,
                        UPCList: e.UPCList,
                        imageId: productImage?.id || null,
                        SalesCategory: e.SalesCategory?.Category_Desc || null,
                        PriceClass: e.PriceClass?.Class_Desc || null,
                        showDistributorImage: productImage?.isAllow ?? false,
                        distributorImage: productImage?.img_url || null,
                        masterImage: `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`,
                        // Customer history specific data
                        totalQuantityBought: orderHistoryItem?.totalQuantityBought || 0,
                        totalOrders: orderHistoryItem?.totalOrders || 0
                    };
                }));

                customerHistoryData = {
                    totalCount: finalProductList.length,
                    finalProductList
                };
            } else {
                customerHistoryData = {
                    totalCount: 0,
                    finalProductList: []
                };
            }
        }

        let response: any;

        if (mostSaleData !== null) {
            response = mostSaleData;
        }

        if (customerHistoryData !== null) {
            response = customerHistoryData;
        }

        if (asPerCustomerData !== null) {
            response = asPerCustomerData;
        }

        return response;
    }

    async getPromotedItems(query: PaginationOptions) {
        let { customerNumber, state = '', zip = '', jurisdiction = '', salesCategory = [] } = query
        const homeSetting: any = await HomeSettings.findOne({});
        const promotedItems = homeSetting?.promotedItems || [];

        let allExcludedItems: any[] = [];
        let whereClause: any = {};
        if (state || zip || jurisdiction) {
            const customerExcluded = await getCustomerExcludeItem(
                state as string,
                zip as string,
                jurisdiction as number
            );

            if (customerExcluded && customerExcluded.length > 0) {
                allExcludedItems = allExcludedItems.concat(customerExcluded);
            }
        }

        const userExcluded = await excludeItemByUser(Number(customerNumber));
        if (userExcluded && userExcluded.length > 0) {
            allExcludedItems = allExcludedItems.concat(userExcluded);
        }

        if (allExcludedItems.length > 0) {
            const uniqueExcluded = [...new Set(allExcludedItems)];
            whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
        }

        if (salesCategory.length > 0) {
            whereClause.Sales_Category = { [Op.in]: salesCategory };
        }


        const { count: totalCount, rows: productList } = await Inventory.findAndCountAll({
            where: {
                ...whereClause,
                Item_Number: { [Op.in]: promotedItems },
                ShortOrderForm: true,
                I_Inactive: false,
            },
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
                    model: InventoryUPC,
                    as: 'UPCList',
                    attributes: ['UPC_Number'],
                    where: {
                        Status: 0
                    },
                    required: false
                }
            ],
            order: [['Description', 'ASC']]
        });

        const finalPromotedItemsList = await Promise.all(productList.map(async (item: any) => {
            const productImage = await ProductImage.findOne({
                where: {
                    product_number: item.Item_Number.toString(),
                    isAllow: true
                },
            });

            let taxRate = 0;
            let price = await getFirstValidPrice(item);
            let prepaidTaxRate = 0
            if (customerNumber) {
                price = await getDiscount(item.Item_Number, customerNumber) || price;
                const userJurisdiction = await getJurisdiction(customerNumber);
                if (userJurisdiction) {
                    taxRate = await getTaxRateV1(item.OTP_Number, userJurisdiction as number, item.Item_Number, price);
                    taxRate = Math.ceil(taxRate * 100) / 100;
                    prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, item?.SalesCategory?.Sales_Category, item, price + taxRate);

                }
            }
            // price = Math.ceil(price * 100) / 100;
            let wareHouseSetting: any = await Setting.findOne({});
            wareHouseSetting = wareHouseSetting?.dataValues || null;
            console.log(wareHouseSetting, 'wareHouseSetting')

            const productLimit = await getProductLimit(item.Item_Number);

            const inventoryOnHand = await getInventoryOnHand(item.Item_Number)

            console.log(wareHouseSetting?.allowOrderWithoutStockSalesRep, 'wareHouseSetting?.allowOrderWithoutStockSalesRep')
            let allowToOrder = true;
            let allowToOrderSalesRep = true;
            if (!inventoryOnHand && !wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
                allowToOrder = false;
            }
            if (!inventoryOnHand && wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
                allowToOrder = true;
            }
            if (!inventoryOnHand && !wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
                allowToOrderSalesRep = false;
            }
            if (!inventoryOnHand && wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
                console.log('allowToOrderSalesRep', !inventoryOnHand && wareHouseSetting?.allowOrderInventoryUnAvaible)
                allowToOrderSalesRep = true;
            }

            let hasQtyDiscount
            if (customerNumber) {
                hasQtyDiscount = await checkQtyDiscount(item.Item_Number, customerNumber, price + taxRate);
            }



            const discount = await getProductDiscountFromRedis(Number(item.Item_Number));

            return {
                Pack: item.Pack,
                Description: item.Description,
                Item_Number: item.Item_Number,
                productDiscount: discount ?? null,
                CaseCount: item.CaseCount,
                UOM: item.UOM,
                Price1: item.Price1,
                Price2: item.Price2,
                Tax_Rate: taxRate,
                OTP_Number: item.OTP_Number,
                price: price,
                UnitOunces: item.UnitOunces,
                hasProductLimit: productLimit ? true : false,
                productLimit,
                hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                prepaidTaxRate: prepaidTaxRate,
                showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                allowToOrderSalesRep: allowToOrderSalesRep || null,
                showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,



                Inventory_OnHand: inventoryOnHand || 0,
                allowToOrder,
                showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,



                hasQtyDiscount: discount ? false : hasQtyDiscount?.allowToDiscount || false,
                qtyDiscount: hasQtyDiscount,
                


                priceWithTax: price + taxRate,
                BaseCost: item.BaseCost,
                Invoice_Cost: item.Invoice_Cost,
                AvgCost: item.AvgCost,
                NetCost: item.NetCost,
                UPCList: item.UPCList || [],
                imageId: productImage?.id || null,
                SalesCategory: item.SalesCategory?.Category_Desc || null,
                PriceClass: item.PriceClass?.Class_Desc || null,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage: `${process.env.AZUREIMAGESERVER}${item.UPCList?.[0]?.UPC_Number || ''}.jpg`,

                // Promoted item specific fields
                isPromoted: true,
                promotedPosition: promotedItems.indexOf(item.Item_Number) + 1,
                promotedMessage: homeSetting?.promotedMessage || 'Featured Product',
            };
        }));

        return {
            totalCount,
            promotedItemsList: finalPromotedItemsList
        };
    }

    async getNewItem(query: PaginationOptions, customerId: number) {
        let { page = 1, limit = 30, search, role, customerNumber, state = ' ', zip = '', jurisdiction = '', salesCategory = [] } = query;

        if (customerNumber) {
            salesCategory = await getAllowedSalesCategories(customerNumber);
            console.log(salesCategory, 'salesCategory')
        }
        page = Number(page);
        limit = Number(limit);

        let whereClause: any = {
            I_Inactive: false,
            ShortOrderForm: true,
        };

        if (salesCategory.length > 0) {
            whereClause.Sales_Category = { [Op.in]: salesCategory };
        }

        let allExcludedItems: any[] = [];



        if (state || zip || jurisdiction) {
            const customerExcluded = await getCustomerExcludeItem(
                state as string,
                zip as string,
                jurisdiction as number
            );

            if (customerExcluded && customerExcluded.length > 0) {
                allExcludedItems = allExcludedItems.concat(customerExcluded);
            }
        }


        const userExcluded = await excludeItemByUser(customerId);
        if (userExcluded && userExcluded.length > 0) {
            allExcludedItems = allExcludedItems.concat(userExcluded);
        }


        if (allExcludedItems.length > 0) {
            const uniqueExcluded = [...new Set(allExcludedItems)];
            whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
        }

        if (search) {
            const searchValue = `%${search}%`;
            whereClause[Op.or] = [
                { Item_Number: { [Op.like]: searchValue } },
                { Description: { [Op.like]: searchValue } },
                { ALT_Description2: { [Op.like]: searchValue } },
            ];
        }


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
                'OTP_Number',
                'UnitOunces',
                'Cig_Pack',
                'Cig_Sticks'
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
                    model: InventoryUPC,
                    as: 'UPCList',
                    attributes: ['UPC_Number'],
                    where: {
                        Status: 0,
                        ...(search && {
                            UPC_Number: { [Op.like]: `%${search}%` },
                        }),
                    },
                    required: false
                }
            ],
            order: [
                 ['Item_Number', 'DESC'],
                // ['Description', 'ASC']
            ],
            limit,
            offset: (page - 1) * limit,
        });

        const finalProductList = await Promise.all(productList.map(async (e: any) => {
            const productImage = await ProductImage.findOne({
                where: {
                    product_number: e.Item_Number.toString(),
                    isAllow: true
                },
                order: [['id', 'DESC']],
            });

            let taxRate = 0;
            let price = await getFirstValidPrice(e);
            // price = Math.ceil(price * 100) / 100;

            let prepaidTaxRate = 0

            if (role === 'retailer') {
                const userJurisdiction = await getJurisdiction(customerId);

                price = await getDiscount(e.Item_Number, customerId) || price;
                if (userJurisdiction) {
                    taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                    taxRate = Math.ceil(taxRate * 100) / 100;
                }



                if (userJurisdiction != null && e.SalesCategory) {

                    console.log(e, 'the e', e?.SalesCategory?.Sales_Category, 'e?.SalesCategory?.Sales_Category')
                    prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.SalesCategory?.Sales_Category, e, price + taxRate);
                }
            } else if (role === 'sales' && customerNumber) {
                const userJurisdiction = await getJurisdiction(customerNumber);

                price = await getDiscount(e.Item_Number, customerNumber) || price;
                if (userJurisdiction) {
                    taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                    taxRate = Math.ceil(taxRate * 100) / 100;
                }

                if (userJurisdiction != null && e.SalesCategory) {
                    prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, e?.SalesCategory?.Sales_Category, e, price + taxRate);
                }
            }
            const productLimit = await getProductLimit(e.Item_Number);


            const inventoryOnHand = await getInventoryOnHand(e.Item_Number)


            let allowToOrderSalesRep = true;
            let allowToOrder = true;
            let wareHouseSetting: any = await Setting.findOne({});
            wareHouseSetting = wareHouseSetting?.dataValues || null;

            if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
                allowToOrderSalesRep = true;
            }
            else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                allowToOrderSalesRep = false;
            }

            if (wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
                allowToOrder = true;
            }
            else if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                allowToOrder = false;
            }

            let hasQtyDiscount = await checkQtyDiscount(e.Item_Number, customerNumber || 0, price + taxRate);

            const discount = await getProductDiscountFromRedis(Number(e.Item_Number));

            return {
                Pack: e.Pack,
                Description: e.Description,
                Item_Number: e.Item_Number,
                CaseCount: e.CaseCount,
                UOM: e.UOM,
                Price1: e.Price1,
                price: price,
                Tax_Rate: taxRate,
                priceWithTax: price + taxRate,
                BaseCost: e.BaseCost,
                Invoice_Cost: e.Invoice_Cost,
                AvgCost: e.AvgCost,
                NetCost: e.NetCost,
                productDiscount: discount ?? null,
                UPCList: e.UPCList,
                hasProductLimit: productLimit ? true : false,
                productLimit,
                UnitOunces: e.UnitOunces,
                hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                prepaidTaxRate: prepaidTaxRate,
                showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                allowToOrderSalesRep: allowToOrderSalesRep || null,
                showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,

                hasQtyDiscount:discount ? false : hasQtyDiscount.allowToDiscount,
                qtyDiscount: hasQtyDiscount,

                Inventory_OnHand: inventoryOnHand || 0,
                allowToOrder,
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

            totalCount: limit,
            finalProductList,
        };
    }

    async getDistributorDashboard(query: PaginationOptions & { fromDate?: string; toDate?: string; type?: string }) {
        const { fromDate, toDate } = query;

        // Parse dates and create date range - using proper date parsing
        let startDate, endDate;

        if (fromDate) {
            // Parse date string like "2023-12-17" to Date object
            const [year, month, day] = fromDate.split('-').map(Number);
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
        } else {
            startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
        }

        if (toDate) {
            // Parse date string like "2024-12-17" to Date object
            const [year, month, day] = toDate.split('-').map(Number);
            endDate = new Date(year, month - 1, day, 23, 59, 59, 999); // month is 0-indexed
        } else {
            endDate = new Date();
        }

        console.log('Date range:', { startDate, endDate, fromDate, toDate });

        // Date filter condition
        const dateFilter = {
            Order_Date: {
                [Op.between]: [startDate, endDate]
            }
        };

        // 1. Order Platform Breakdown
        const orderPlatformData = await OrderHeader.findAll({
            attributes: [
                'Order_Source',
                [Sequelize.fn('COUNT', Sequelize.col('Order_Number')), 'orderCount']
            ],
            where: {
                ...dateFilter,
                Order_Deleted: false
            },
            group: ['Order_Source'],
            raw: true
        });


        // Format order platform data
        const orderPlatform = {
            Mobile: 0,
            Web: 0,
            ERP: 0
        };

        orderPlatformData.forEach((item: any) => {
            console.log('Processing item:', item);
            if (item.Order_Source === 12) {
                orderPlatform.Mobile = parseInt(item.orderCount);
            } else if (item.Order_Source === 13) {
                orderPlatform.Web = parseInt(item.orderCount);
            } else {
                orderPlatform.ERP += parseInt(item.orderCount);
            }
        });


        // 2. High Demand Products (most ordered items) - Using a simpler approach
        const highDemandProducts = await OrderDetail.findAll({
            attributes: [
                'Item_Number',
                [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantityOrdered'],
                [Sequelize.fn('COUNT', Sequelize.col('OrderDetail.Order_Number')), 'orderCount']
            ],
            include: [
                {
                    model: OrderHeader,
                    as: 'orderHeader',
                    attributes: [],
                    where: {
                        ...dateFilter,
                        Order_Deleted: false
                    },
                    required: true
                }
            ],
            group: ['Item_Number'],
            order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'DESC']],
            raw: true
        });

        // Get inventory details for the top 10 items
        const top10ItemNumbers = highDemandProducts.slice(0, 10).map((item: any) => item.Item_Number);

        const inventoryDetails = await Inventory.findAll({
            where: {
                Item_Number: { [Op.in]: top10ItemNumbers },
                ShortOrderForm: true,
                I_Inactive: false,
            },
            attributes: [
                'Item_Number',
                'Description',
                'Pack',
                'CaseCount',
                'UOM'
            ],
            raw: true
        });

        // Combine the data
        const top10HighDemandProducts = highDemandProducts.slice(0, 10).map((item: any) => {
            const inventory = inventoryDetails.find((inv: any) => inv.Item_Number === item.Item_Number);
            return {
                ...item,
                inventory: inventory || {
                    Item_Number: item.Item_Number,
                    Description: 'Unknown',
                    Pack: 0,
                    CaseCount: 0,
                    UOM: ''
                }
            };
        });

        // 3. Sales Person Performance
        const salesPersonData = await OrderDetail.findAll({
            attributes: [
                'orderHeader.S_Number',
                [Sequelize.fn('SUM', Sequelize.col('Price')), 'totalSales'],
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('orderHeader.Order_Number'))), 'orderCount'],
                [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantity']
            ],
            include: [
                {
                    model: OrderHeader,
                    as: 'orderHeader',
                    attributes: ['S_Number'],
                    where: {
                        ...dateFilter,
                        Order_Deleted: false
                    },
                    required: true
                }
            ],
            group: ['orderHeader.S_Number'],
            order: [[Sequelize.fn('SUM', Sequelize.col('Price')), 'DESC']],
            raw: true
        });

        // Get sales rep details for each sales person
        const salesPersonWithDetails = await Promise.all(
            salesPersonData.map(async (salesPerson: any) => {
                const salesRep = await SalesRep.findByPk(salesPerson['orderHeader.S_Number'], {
                    attributes: ['S_Number', 'S_Desc']
                });

                return {
                    salesRepNumber: salesPerson['orderHeader.S_Number'],
                    salesRepName: salesRep?.S_Desc || 'Unknown',
                    totalSales: Number(salesPerson.totalSales || 0),
                    orderCount: parseInt(salesPerson.orderCount || 0),
                    totalQuantity: Number(salesPerson.totalQuantity || 0)
                };
            })
        );

        // Summary statistics
        const totalActiveCustomer = await Customer.count({ where: { C_Inactive: false } });
        const totalCustomer = await Customer.count();
        const totalInactiveCustomer = await Customer.count({ where: { C_Inactive: true } });
        const totalOrder = await OrderHeader.count({
            where: {
                ...dateFilter,
                Order_Deleted: false
            }
        });


        return {
            summary: {
                totalActiveCustomer,
                totalCustomer,
                totalInactiveCustomer,
                totalOrder
            },
            orderPlatform,
            highDemandProducts: top10HighDemandProducts,
            salesPersonPerformance: salesPersonWithDetails,
            dateRange: {
                fromDate: startDate.toISOString().split('T')[0],
                toDate: endDate.toISOString().split('T')[0]
            }
        };
    }

    async getDistributorDashboardV1(query: PaginationOptions & { fromDate?: string; toDate?: string; type?: string }) {
        const { fromDate, toDate, costType, salesReportType } = query;

        // Parse dates and create date range - using proper date parsing
        let startDate, endDate;

        if (fromDate) {
            // Parse date string like "2023-12-17" to Date object
            const [year, month, day] = fromDate.split('-').map(Number);
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
        } else {
            startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
        }

        if (toDate) {
            // Parse date string like "2024-12-17" to Date object
            const [year, month, day] = toDate.split('-').map(Number);
            endDate = new Date(year, month - 1, day, 23, 59, 59, 999); // month is 0-indexed
        } else {
            endDate = new Date();
        }

        console.log('Date range:', { startDate, endDate, fromDate, toDate });

        // Date filter condition
        const dateFilter = {
            Order_Date: {
                [Op.between]: [startDate, endDate]
            }
        };

        // 1. Order Platform Breakdown
        const orderPlatformData = await OrderHeader.findAll({
            attributes: [
                'Order_Source',
                [Sequelize.fn('COUNT', Sequelize.col('Order_Number')), 'orderCount']
            ],
            where: {
                ...dateFilter,
                Order_Deleted: false
            },
            group: ['Order_Source'],
            raw: true
        });


        // Format order platform data
        const orderPlatform = {
            Mobile: 0,
            Web: 0,
            ERP: 0
        };

        orderPlatformData.forEach((item: any) => {
            console.log('Processing item:', item);
            if (item.Order_Source === 12) {
                orderPlatform.Mobile = parseInt(item.orderCount);
            } else if (item.Order_Source === 13) {
                orderPlatform.Web = parseInt(item.orderCount);
            } else {
                orderPlatform.ERP += parseInt(item.orderCount);
            }
        });


        // 2. High Demand Products (most ordered items) - Using a simpler approach
        const highDemandProducts = await OrderDetail.findAll({
            attributes: [
                'Item_Number',
                [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantityOrdered'],
                [Sequelize.fn('COUNT', Sequelize.col('OrderDetail.Order_Number')), 'orderCount']
            ],
            include: [
                {
                    model: OrderHeader,
                    as: 'orderHeader',
                    attributes: [],
                    where: {
                        ...dateFilter,
                        Order_Deleted: false
                    },
                    required: true
                }
            ],
            group: ['Item_Number'],
            order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'DESC']],
            raw: true
        });

        // Get inventory details for the top 10 items
        const top10ItemNumbers = highDemandProducts.slice(0, 10).map((item: any) => item.Item_Number);

        const inventoryDetails = await Inventory.findAll({
            where: {
                Item_Number: { [Op.in]: top10ItemNumbers },
                ShortOrderForm: true,
                I_Inactive: false,
            },
            attributes: [
                'Item_Number',
                'Description',
                'Pack',
                'CaseCount',
                'UOM',
                'UnitOunces'
            ],
            raw: true
        });

        // Combine the data
        const top10HighDemandProducts = highDemandProducts.slice(0, 10).map((item: any) => {
            const inventory = inventoryDetails.find((inv: any) => inv.Item_Number === item.Item_Number);
            return {
                ...item,
                inventory: inventory || {
                    Item_Number: item.Item_Number,
                    Description: 'Unknown',
                    Pack: 0,
                    CaseCount: 0,
                    UOM: ''
                }
            };
        });

        // 3. Sales Person Performance
        const salesPersonData = await OrderDetail.findAll({
            attributes: [
                'orderHeader.S_Number',
                [
                    Sequelize.literal('SUM([OrderDetail].[Price] + ISNULL([OrderDetail].[OTP_Amount_State], 0))'),
                    'totalSales'
                ],
                [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('orderHeader.Order_Number'))), 'orderCount'],
                [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantity']
            ],
            include: [
                {
                    model: OrderHeader,
                    as: 'orderHeader',
                    attributes: ['S_Number'],
                    where: {
                        ...dateFilter,
                        Order_Deleted: false
                    },
                    required: true
                }
            ],
            group: ['orderHeader.S_Number'],
            order: [[Sequelize.fn('SUM', Sequelize.col('Price')), 'DESC']],
            raw: true
        });











        const results = await OrderHeader.findAll({
            attributes: [
                [col("user.UserName"), "userName"],
                [fn("COUNT", col("OrderHeader.Order_Number")), "order_Count"],
                [fn("SUM", col("OrderHeader.Invoice_Total")), "totalInvoiceTotal"],
            ],
            include: [
                { model: Users, as: "user", attributes: [], required: false },
            ],
            where: {
                Order_Deleted: false,
                Invoice_Number: { [Op.ne]: 0 },
                Invoice_Date: { [Op.between]: [startDate, endDate] },
                Order_Updated: true,
            },
            group: [col("user.UserName")],
            order: [[col("user.UserName"), "ASC"]],
            raw: true,
        });




        // Summary statistics
        const totalActiveCustomer = await Customer.count({ where: { C_Inactive: false } });
        const totalCustomer = await Customer.count();
        const totalInactiveCustomer = await Customer.count({ where: { C_Inactive: true } });
        const totalOrder = await OrderHeader.count({
            where: {
                ...dateFilter,
                Order_Deleted: false
            }
        });


        // get order by user
        let dateFilterForOrderHistory = {
            createdAt: {
                [Op.between]: [startDate, endDate]
            }
        };
        const orderBySales = await OrderHistory.count({
            where: {
                ...dateFilterForOrderHistory,
                orderPlaceBy: 'sales'
            }
        });

        const orderByRetailer = await OrderHistory.count({
            where: {
                ...dateFilterForOrderHistory,
                orderPlaceBy: 'retailer'
            }
        });
        let valueCode = 0
        if (costType === 'base') {
            valueCode = 1
        } else if (costType === 'avg') {
            valueCode = 0
        } else if (costType === 'net') {
            valueCode = 2
        }

        let salesReportValue = 1
        if (salesReportType === 'invoice') {
            salesReportValue = 0
        } else if (salesReportType === 'current') {
            salesReportValue = 1
        }

        const rows = await OrderHeader.findAll({
            subQuery: false,
            attributes: [
                [col("salesRep.S_Number"), "S_Number"],
                [col("salesRep.S_Desc"), "S_Desc"],

                // Example aggregates (add what you need)
                [fn("COUNT", col("OrderHeader.Order_Number")), "totalOrders"],
                [fn("SUM", col("OrderHeader.Invoice_Total")), "totalInvoiceTotal"],

                [fn("SUM", literal("[OrderHeader].[Sales01] + [OrderHeader].[Taxes01]")), "sumTotalSales01"],
                [fn("SUM", literal("[OrderHeader].[Sales02] + [OrderHeader].[Taxes02]")), "sumTotalSales02"],
                [fn("SUM", literal("[OrderHeader].[Sales03] + [OrderHeader].[Taxes03]")), "sumTotalSales03"],
                [fn("SUM", literal("[OrderHeader].[Sales04] + [OrderHeader].[Taxes04]")), "sumTotalSales04"],
                [fn("SUM", literal("[OrderHeader].[Sales05] + [OrderHeader].[Taxes05]")), "sumTotalSales05"],
                [fn("SUM", literal("[OrderHeader].[Sales06] + [OrderHeader].[Taxes06]")), "sumTotalSales06"],
                [fn("SUM", literal("[OrderHeader].[Sales07] + [OrderHeader].[Taxes07]")), "sumTotalSales07"],
                [fn("SUM", literal("[OrderHeader].[Sales08] + [OrderHeader].[Taxes08]")), "sumTotalSales08"],
                [fn("SUM", literal("[OrderHeader].[Sales09] + [OrderHeader].[Taxes09]")), "sumTotalSales09"],
                [fn("SUM", literal("[OrderHeader].[Sales10] + [OrderHeader].[Taxes10]")), "sumTotalSales10"],
                [fn("SUM", literal("[OrderHeader].[Sales11] + [OrderHeader].[Taxes11]")), "sumTotalSales11"],
                [fn("SUM", literal("[OrderHeader].[Sales12] + [OrderHeader].[Taxes12]")), "sumTotalSales12"],

                [fn("SUM", literal("[OrderHeader].[stax_State] + [OrderHeader].[stax_County] + [OrderHeader].[stax_City]")), "sumTotalSalesTax"],
            ],

            include: [
                {
                    model: SalesRep,
                    as: "salesRep",
                    attributes: [],
                    required: false,
                },
                {
                    model: Order_Header_Costs,
                    as: "Order_Header_Costs",
                    attributes: [],
                    required: false,
                    where: { Value_Code: valueCode },
                },
            ],

            where: {
                Order_Deleted: false,
                Invoice_Number: { [Op.ne]: 0 },
                Invoice_Date: { [Op.between]: [startDate, endDate] },
                Order_Updated: salesReportValue,
            },

            group: [col("salesRep.S_Number"), col("salesRep.S_Desc")],
            order: [[col("salesRep.S_Number"), "ASC"], [col("salesRep.S_Desc"), "ASC"]],
            raw: true,
        });

        const returnOrder = await OrderHistory.count({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                },
                type: 'return'
            }
        });


        return {
            summary: {
                totalActiveCustomer,
                totalCustomer,
                totalInactiveCustomer,
                totalOrder
            },
            returnOrder: returnOrder,
            result: rows,
            orderPlatform,
            orderByUser: {
                sales: orderBySales,
                retailer: orderByRetailer
            },
            highDemandProducts: top10HighDemandProducts,
            salesPersonPerformance: [],
            userPerformance: results,
            dateRange: {
                fromDate: startDate.toISOString().split('T')[0],
                toDate: endDate.toISOString().split('T')[0]
            }
        };
    }

    async getHighDemandItems(query: PaginationOptions & { fromDate?: string; toDate?: string; type?: string }) {

        const { fromDate, toDate } = query;

        // Parse dates and create date range - using proper date parsing
        let startDate, endDate;

        if (fromDate) {
            // Parse date string like "2023-12-17" to Date object
            const [year, month, day] = fromDate.split('-').map(Number);
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
        } else {
            startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
        }

        if (toDate) {
            // Parse date string like "2024-12-17" to Date object
            const [year, month, day] = toDate.split('-').map(Number);
            endDate = new Date(year, month - 1, day, 23, 59, 59, 999); // month is 0-indexed
        } else {
            endDate = new Date();
        }

        console.log('Date range:', { startDate, endDate, fromDate, toDate });

        // Date filter condition
        const dateFilter = {
            Order_Date: {
                [Op.between]: [fromDate, toDate]
            }
        };

        const highDemandProducts = await OrderDetail.findAll({
            attributes: [
                'Item_Number',
                [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantityOrdered'],
                [Sequelize.fn('COUNT', Sequelize.col('OrderDetail.Order_Number')), 'orderCount']
            ],
            include: [
                {
                    model: OrderHeader,
                    as: 'orderHeader',
                    attributes: [],
                    where: {
                        ...dateFilter,
                        Order_Deleted: false
                    },
                    required: true
                }
            ],
            group: ['Item_Number'],
            order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'DESC']],
            raw: true
        });

        // ✅ Get ALL item numbers (no top 10)
        const itemNumbers = highDemandProducts.map((item: any) => item.Item_Number);

        const inventoryDetails = await Inventory.findAll({
            where: {
                Item_Number: { [Op.in]: itemNumbers },
                ShortOrderForm: true,
                I_Inactive: false,
            },
            attributes: [
                'Item_Number',
                'Description',
                'Pack',
                'CaseCount',
                'UOM',
                'UnitOunces'
            ],
            raw: true
        });

        // ✅ Combine ALL data
        const highDemandProductsWithInventory = highDemandProducts.map((item: any) => {
            const inventory = inventoryDetails.find(
                (inv: any) => inv.Item_Number === item.Item_Number
            );

            return {
                ...item,
                inventory: inventory || {
                    Item_Number: item.Item_Number,
                    Description: 'Unknown',
                    Pack: 0,
                    CaseCount: 0,
                    UOM: ''
                }
            };
        });

        return highDemandProductsWithInventory

    }

    async getDiscountedItems(query: PaginationOptions & { search?: string, masterSearch?: string }, customerId: number) {
        let { search, masterSearch, role, customerNumber, state = '', zip = '', jurisdiction = '', salesCategory = [] } = query;
        let wareHouseSetting: any = await Setting.findOne({});
        wareHouseSetting = wareHouseSetting?.dataValues || null;
        let customerGroup: any = null;

        customerId =customerNumber || 0;
        console.log(customerNumber, 'customerNumber')
        // Get current date
        const today = new Date();
        if (customerNumber) {
            console.log('find the customer group')
            customerGroup = await CustomerSpecialGroup.findOne({
                where: {
                    C_Number: Number(customerNumber)
                }
            });

        }
        // if(customerNumber){
        //     salesCategory = await getAllowedSalesCategories(customerNumber);
        //     console.log(salesCategory, 'salesCategory')
        // }

        const currentDate = today.toISOString().split("T")[0];  // "2025-08-25"
        console.log(currentDate, 'currentDate---->')


        const whereClause: any = {
            [Op.and]: [
                {
                    [Op.or]: [
                        {
                            Promo_Active: true,
                            [Op.and]: [
                                where(cast(col("Start_Date"), "DATE"), { [Op.lte]: currentDate }),
                                where(cast(col("End_Date"), "DATE"), { [Op.gte]: currentDate }),
                            ],
                        },
                        { Perpetual: true },
                    ],
                },
            ]
        };


        whereClause.Order_Source = { [Op.in]: [0, 1, 12, 13] };
        if (salesCategory.length > 0) {
            whereClause.Sales_Category = { [Op.in]: salesCategory };
        }

        let allExcludedItems: any[] = [];

        if (state || zip || jurisdiction) {
            const customerExcluded = await getCustomerExcludeItem(
                state as string,
                zip as string,
                jurisdiction as number
            );

            if (customerExcluded && customerExcluded.length > 0) {
                allExcludedItems = allExcludedItems.concat(customerExcluded);
            }
        }

        let userExcluded: any[] = [];



        if (customerId && role != 'sales') {
            console.log(customerId, 'customerId----->')
            userExcluded = await excludeItemByUser(customerId);
        } else if (customerNumber) {
            console.log(customerNumber, 'customerNumber----->')
            userExcluded = await excludeItemByUser(Number(customerNumber));
        }


        if (userExcluded && userExcluded.length > 0) {
            allExcludedItems = allExcludedItems.concat(userExcluded);
        }

        if (allExcludedItems.length > 0) {
            const uniqueExcluded = [...new Set(allExcludedItems)];
            whereClause.Item_Number = { [Op.notIn]: uniqueExcluded };
        }


        console.log(allExcludedItems, 'allExcludedItems')
        // Add search functionality if needed
        if (search) {
            whereClause[Op.or] = [
                { Item_Number: { [Op.like]: `%${search}%` } },
                { Special_Message: { [Op.like]: `%${search}%` } }
            ];
        }

        if (masterSearch && typeof masterSearch === 'string') {
            const masterArray = masterSearch.split(',').map(i => i.trim());
            whereClause.Item_Number = { [Op.in]: masterArray };
        }


        whereClause.Special_GroupID = { [Op.in]: [0, customerGroup?.dataValues?.Special_GroupID || 0] };

        console.log(whereClause.Special_GroupID, 'whereClause.Special_GroupID ')

        // First get the specials with basic inventory info
        const { count: totalCount, rows: specialsList } = await InventorySpecials.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Inventory,
                    as: 'inventory',
                    attributes: [
                        'Item_Number',
                        'Description',
                        'ALT_Description2',
                        'Pack',
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
                        'ShortOrderForm',
                        'Date_Created',
                        'Sales_Category',
                        'Price_Class',
                        'OTP_Number',
                        'UnitOunces',
                        'Cig_Pack',
                        'Cig_Sticks'

                    ],
                    required: true
                }
            ],
            order: [['Start_Date', 'DESC']],
            // order: [['Description', 'ASC']]

        });





        console.log(specialsList, 'specialsList----->')
        // Get the item numbers to fetch additional data
        const itemNumbers = specialsList.map((special: any) => special.Item_Number);

        // Get additional data separately
        const [salesCategories, priceClasses, upcList] = await Promise.all([
            SalesCategory.findAll({
                where: {
                    Sales_Category: { [Op.in]: specialsList.map((s: any) => s.inventory.Sales_Category).filter(Boolean) }
                },
                attributes: ['Sales_Category', 'Category_Desc'],
                raw: true
            }),
            PriceClass.findAll({
                where: {
                    Price_Class: { [Op.in]: specialsList.map((s: any) => s.inventory.Price_Class).filter(Boolean) }
                },
                attributes: ['Price_Class', 'Class_Desc'],
                raw: true
            }),
            InventoryUPC.findAll({
                where: {
                    Item_Number: { [Op.in]: itemNumbers },
                    Status: 0
                },
                attributes: ['Item_Number', 'UPC_Number'],
                raw: true
            })
        ]);

        // Create lookup maps
        const salesCategoryMap = new Map(salesCategories.map((sc: any) => [sc.Sales_Category, sc.Category_Desc]));
        const priceClassMap = new Map(priceClasses.map((pc: any) => [pc.Price_Class, pc.Class_Desc]));
        const upcMap = new Map();
        upcList.forEach((upc: any) => {
            if (!upcMap.has(upc.Item_Number)) {
                upcMap.set(upc.Item_Number, []);
            }
            upcMap.get(upc.Item_Number).push(upc.UPC_Number);
        });

        // Process the results to include product images and format the data
        const finalDiscountedList = await Promise.all(specialsList.map(async (special: any) => {
            const productImage = await ProductImage.findOne({
                where: {
                    product_number: special.inventory.Item_Number.toString(),
                    isAllow: true
                },
            });

            console.log(special.inventory, 'special.inventory.Sales_Category')

            const upcNumbers = upcMap.get(special.Item_Number) || [];
            const salesCategoryDesc = salesCategoryMap.get(special.inventory.Sales_Category) || null;

            console.log(salesCategoryDesc, 'salesCategoryDesc')
            const salesCategory = special.inventory.Sales_Category || null;

            console.log(salesCategory, 'salesCategory----->')
            const priceClassDesc = priceClassMap.get(special.inventory.Price_Class) || null;
            let taxRate = 0;
            let price = await getFirstValidPrice(special.inventory);
            let prepaidTaxRate = 0
            let hasQtyDiscount = null;
            if (role === 'retailer') {
                const userJurisdiction = await getJurisdiction(customerId as number);
                price = await getDiscount(special.inventory.Item_Number, customerId) || price;


                if (userJurisdiction != null && salesCategory) {
                    prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, salesCategory, special.inventory, price + taxRate);
                }
                // price = Math.ceil(price * 100) / 100;
                taxRate = await getTaxRateV1(special.inventory.OTP_Number, userJurisdiction as number, special.inventory.Item_Number, price);
                taxRate = Math.ceil(taxRate * 100) / 100;
                hasQtyDiscount = await checkQtyDiscount(special.inventory.Item_Number, customerId, price + taxRate);

            } else if (role === 'sales' && customerNumber) {
                const userJurisdiction = await getJurisdiction(customerNumber);
                price = await getDiscount(special.inventory.Item_Number, customerNumber) || price;
                // price = Math.ceil(price * 100) / 100;
                taxRate = await getTaxRateV1(special.inventory.OTP_Number, userJurisdiction as number, special.inventory.Item_Number, price);
                taxRate = Math.ceil(taxRate * 100) / 100;
                hasQtyDiscount = await checkQtyDiscount(special.inventory.Item_Number, customerNumber, price + taxRate);
                if (userJurisdiction != null && salesCategory) {
                    prepaidTaxRate = await getPrepaidTaxRate(userJurisdiction as number, salesCategory, special.inventory, price + taxRate);
                }

            }

            const inventoryOnHand = await getInventoryOnHand(special.inventory.Item_Number)


            let allowToOrderSalesRep = true;
            let allowToOrder = true;
            let wareHouseSetting: any = await Setting.findOne({});
            wareHouseSetting = wareHouseSetting?.dataValues || null;

            if (wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible) {
                allowToOrderSalesRep = true;
            }
            else if (!wareHouseSetting?.salesRep?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                allowToOrderSalesRep = false;
            }

            if (wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible) {
                allowToOrder = true;
            }
            else if (!wareHouseSetting?.retailer?.allowOrderInventoryUnAvaible && inventoryOnHand <= 0) {
                allowToOrder = false;
            }
            const productLimit = await getProductLimit(special.inventory.Item_Number);

            const discount = await getProductDiscountFromRedis(Number(special.inventory.Item_Number));
            return {
                Pack: special.inventory.Pack,
                Description: special.inventory.Description,
                Item_Number: special.inventory.Item_Number,
                CaseCount: special.inventory.CaseCount,
                UOM: special.inventory.UOM,
                Price1: special.inventory.Price1,
                Price2: special.inventory.Price2,
                Tax_Rate: taxRate,
                OTP_Number: special.inventory.OTP_Number,
                price: price,
                UnitOunces: special.inventory.UnitOunces,
                Order_Source: special.inventory.Order_Source,
                hasPrepaidTaxRate: prepaidTaxRate ? true : false,
                prepaidTaxRate: prepaidTaxRate,
                hasProductLimit: productLimit ? true : false,
                productLimit,

                showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                allowToOrderSalesRep: allowToOrderSalesRep || null,
                showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,

                hasQtyDiscount: discount ? false : hasQtyDiscount?.allowToDiscount || false,
                qtyDiscount: hasQtyDiscount,
                productDiscount: discount ?? null,

                Inventory_OnHand: inventoryOnHand || 0,
                allowToOrder,
                showTheInventoryStock: wareHouseSetting?.retailer?.showStock || false,
                showLowStock: wareHouseSetting?.retailer?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showWithOutPrice: wareHouseSetting?.retailer?.showWithOutPrice || false,

                priceWithTax: price + taxRate,
                BaseCost: special.inventory.BaseCost,
                Invoice_Cost: special.inventory.Invoice_Cost,
                AvgCost: special.inventory.AvgCost,
                NetCost: special.inventory.NetCost,
                UPCList: upcNumbers.map((upc: string) => ({ UPC_Number: upc })),
                imageId: productImage?.id || null,
                SalesCategory: salesCategoryDesc,
                PriceClass: priceClassDesc,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage: `${process.env.AZUREIMAGESERVER}${upcNumbers[0] || ''}.jpg`,

                // Special details (additional fields for discounted items)
                Start_Date: special.Start_Date,
                End_Date: special.End_Date,
                Special_Price: special.Price,
                Allowance: special.Allowance,
                AllowanceType: special.AllowanceType,
                Units_Limit: special.Units_Limit,
                Special_Message: special.Special_Message,
                Promo_Number: special.Promo_Number,
                Points: special.Points,
            };
        }));

        return {
            totalCount,
            finalProductList: finalDiscountedList,
        };
    }

    async getTopProductForSales(query: PaginationOptions & { fromDate?: string; toDate?: string; type?: string }) {

        let startDate, endDate;


        startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year


        endDate = new Date();


        console.log('Date range:', { startDate, endDate });

        // Date filter condition
        const dateFilter = {
            Order_Date: {
                [Op.between]: [startDate, endDate]
            }
        };

        const highDemandProducts = await OrderDetail.findAll({
            attributes: [
                'Item_Number',
                [Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'totalQuantityOrdered'],
                [Sequelize.fn('COUNT', Sequelize.col('OrderDetail.Order_Number')), 'orderCount']
            ],
            include: [
                {
                    model: OrderHeader,
                    as: 'orderHeader',
                    attributes: [],
                    where: {
                        ...dateFilter,
                        Order_Deleted: false
                    },
                    required: true
                }
            ],
            group: ['Item_Number'],
            order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'DESC']],
            raw: true
        });

        // Get inventory details for the top 10 items
        const top10ItemNumbers = highDemandProducts.slice(0, 10).map((item: any) => item.Item_Number);

        const inventoryDetails = await Inventory.findAll({
            where: {
                Item_Number: { [Op.in]: top10ItemNumbers },
                ShortOrderForm: true,
                I_Inactive: false,
            },
            attributes: [
                'Item_Number',
                'Description',
                'Pack',
                'CaseCount',
                'UOM'
            ],
            raw: true
        });

        // Combine the data
        const top10HighDemandProducts = highDemandProducts.slice(0, 10).map((item: any) => {
            const inventory = inventoryDetails.find((inv: any) => inv.Item_Number === item.Item_Number);
            return {
                ...item,
                inventory: inventory || {
                    Item_Number: item.Item_Number,
                    Description: 'Unknown',
                    Pack: 0,
                    CaseCount: 0,
                    UOM: ''
                }
            };
        });
        return top10HighDemandProducts;
    }

    async getEpickDashboard(query: PaginationOptions & { fromDate?: string; toDate?: string }) {
        const { fromDate, toDate } = query;

        // Parse dates and create date range - using proper date parsing
        let startDate, endDate;

        if (fromDate) {
            // Parse date string like "2023-12-17" to Date object
            const [year, month, day] = fromDate.split('-').map(Number);
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
        } else {
            startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of current year
        }

        if (toDate) {
            // Parse date string like "2024-12-17" to Date object
            const [year, month, day] = toDate.split('-').map(Number);
            endDate = new Date(year, month - 1, day, 23, 59, 59, 999); // month is 0-indexed
        } else {
            endDate = new Date();
        }

        console.log('Epick Dashboard Date range:', { startDate, endDate, fromDate, toDate });

        // Date filter condition for OrderHeader
        const dateFilter = {
            Order_Date: {
                [Op.between]: [startDate, endDate]
            },
            Order_Deleted: false
        };

        // Get total orders from Order_Header with date range filter and Order_Deleted = false
        const totalOrdersFromHeader = await OrderHeader.count({
            where: {
                ...dateFilter,
                Order_Deleted: false
            }
        });

        // Get total completed orders from Order_Header
        // Step 1: First filter Order_Header by Invoice_Number > 0, Order_Updated = false, Order_Deleted = false
        const completedOrderHeaders = await OrderHeader.findAll({
            where: {
                ...dateFilter,
                Invoice_Number: 0,
                // Invoice_Number: { [Op.gt]: 0 }, // Invoice_Number > 0
                Order_Updated: false, // Order_Updated = 0 (false)
                Order_Deleted: false
            },
            attributes: ['Order_Number'],
            raw: true
        });

        const completedOrderNumbers = completedOrderHeaders
            .map((order: any) => order.Order_Number)
            .filter((v: any) => v !== null && v !== undefined)
            .map((v: any) => Number(v));

        console.log(`Found ${completedOrderNumbers.length} orders with Invoice_Number > 0 and Order_Updated = false`);

        // Step 2: Check Order_Detail to ensure ALL items have Confirmed = 1 for these orders
        let totalCompletedOrders = 0;
        if (completedOrderNumbers.length > 0) {
            // First, get detailed info about each order's confirmation status
            const orderDetailStatus = await sequelize.query(
                `SELECT 
                    Order_Number,
                    COUNT(*) as totalItems,
                    SUM(CASE WHEN Confirmed = 1 THEN 1 ELSE 0 END) as confirmedItems,
                    SUM(CASE WHEN Confirmed = 0 OR Confirmed IS NULL THEN 1 ELSE 0 END) as unconfirmedItems
                 FROM Order_Detail
                 WHERE Order_Number IN (:orderNumbers)
                 GROUP BY Order_Number`,
                {
                    replacements: { orderNumbers: completedOrderNumbers },
                    type: QueryTypes.SELECT,
                    raw: true,
                }
            ) as any[];

            // Log details for each order
            orderDetailStatus.forEach((order: any) => {
                console.log(`Order ${order.Order_Number}: Total items: ${order.totalItems}, Confirmed: ${order.confirmedItems}, Unconfirmed: ${order.unconfirmedItems}`);
            });

            // Query to find orders where ALL items have Confirmed = 1
            // This query returns orders where total items = confirmed items
            const confirmedOrdersQuery = await sequelize.query(
                `SELECT Order_Number
                 FROM Order_Detail
                 WHERE Order_Number IN (:orderNumbers)
                 GROUP BY Order_Number
                 HAVING COUNT(*) = SUM(CASE WHEN Confirmed = 1 THEN 1 ELSE 0 END)`,
                {
                    replacements: { orderNumbers: completedOrderNumbers },
                    type: QueryTypes.SELECT,
                    raw: true,
                }
            ) as any[];

            // Count orders where all items are confirmed
            totalCompletedOrders = confirmedOrdersQuery.length;
            console.log(`Found ${totalCompletedOrders} orders where all items have Confirmed = 1 out of ${completedOrderNumbers.length} orders`);
        } else {
            console.log('No orders found with Invoice_Number > 0 and Order_Updated = false');
        }

        // Get all OrderPick records and join with OrderHeader to filter by date
        // First, get all order numbers within date range
        const ordersInDateRange = await OrderHeader.findAll({
            where: dateFilter,
            attributes: ['Order_Number'],
            raw: true
        });

        const orderNumbers = ordersInDateRange.map((order: any) => order.Order_Number);

        if (orderNumbers.length === 0) {
            return {
                orderStatistics: {
                    totalOrders: 0,
                    totalOrdersFromHeader: totalOrdersFromHeader,
                    totalCompletedOrders: totalCompletedOrders,
                    completedByEpick: 0,
                    pendingFromEpick: 0,
                    totalCheckerOrders: 0, // NEW: Orders ready for checker
                    ordersCompletedByChecker: 0 // NEW: Orders completed by checker
                },
                scanningStatistics: {
                    totalScannedItems: 0,
                    totalScannedLines: 0,
                    totalTimeSeconds: 0,
                    totalTimeFormatted: '00:00:00'
                },
                overrideRequestStatistics: {
                    totalRequests: 0,
                    totalAcceptedRequests: 0,
                    totalRejectedRequests: 0
                },
                pickerWiseOrders: [],
                averageOrderTime: {
                    averageTimeSeconds: 0,
                    averageTimeFormatted: '00:00:00'
                },
                dateRange: {
                    fromDate: startDate.toISOString().split('T')[0],
                    toDate: endDate.toISOString().split('T')[0]
                }
            };
        }

        // Get all OrderPick records (orders assigned to epick) - filtered by date range
        const allOrderPicks = await OrderPick.findAll({
            where: {
                orderNumber: { [Op.in]: orderNumbers }
            },
            attributes: ['orderNumber', 'status', 'pickerUserNumber', 'startedAt', 'completedAt', 'checkerCompletedAt'],
            raw: true
        });

        // 1. Order Statistics: Total orders assigned to epick, Completed by epick, Pending from epick
        // Filter by status and date range (using completedAt)
        const completedByEpickOrderPicks = allOrderPicks.filter((pick: any) => {
            // Check status
            if (pick.status !== 'completed' && pick.status !== 'ready_for_delivery') {
                return false;
            }

            // Check completedAt is within date range
            if (!pick.completedAt) {
                return false;
            }

            const completedDate = new Date(pick.completedAt);
            return completedDate >= startDate && completedDate <= endDate;
        });

        const completedByEpickOrderNumbers = completedByEpickOrderPicks
            .map((pick: any) => pick.orderNumber)
            .filter((v: any) => v !== null && v !== undefined)
            .map((v: any) => Number(v));

        let completedByEpick = 0;

        if (completedByEpickOrderNumbers.length > 0) {
            // Validate in MSSQL OrderHeader that Order_Deleted = false
            const validatedOrderHeaders = await OrderHeader.findAll({
                where: {
                    Order_Number: { [Op.in]: completedByEpickOrderNumbers },
                    Order_Deleted: false
                },
                attributes: ['Order_Number'],
                raw: true
            });

            // Count orders that exist in OrderHeader with Order_Deleted = false
            completedByEpick = validatedOrderHeaders.length;
        }
        // Total orders: count from OrderHeader with date range filter and Order_Deleted = false
        const totalOrders = totalOrdersFromHeader;
        const pendingFromEpick = allOrderPicks.filter((pick: any) =>
            pick.status === 'pending' || pick.status === 'in_progress'
        ).length;

        // Calculate total checker orders (same logic as checker getOrder API)
        // Step 1: Get all completed orders from OrderPick (PostgreSQL)
        const completedOrdersForChecker = allOrderPicks.filter((pick: any) => pick.status === 'completed');
        const completedOrderNumbersForChecker = Array.from(
            new Set(
                completedOrdersForChecker
                    .map((o: any) => o?.orderNumber)
                    .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '')
                    .map((v: any) => Number(v))
            )
        );

        let totalCheckerOrders = 0;

        if (completedOrderNumbersForChecker.length > 0) {
            // Step 2: Validate in MSSQL OrderHeader (same as checker getOrder)
            const checkerOrderHeaders = await OrderHeader.findAll({
                where: {
                    ...dateFilter,
                    Order_Number: { [Op.in]: completedOrderNumbersForChecker },
                    Order_Updated: { [Op.ne]: true }, // Order_Updated != true (or Order_Updated = 0)
                    Order_Deleted: false
                },
                attributes: ['Order_Number'],
                raw: true
            });

            const validatedOrderNumbers = checkerOrderHeaders
                .map((order: any) => order.Order_Number)
                .filter((v: any) => v !== null && v !== undefined)
                .map((v: any) => Number(v));

            if (validatedOrderNumbers.length > 0) {
                // Step 3: Validate in MSSQL OrderDetail (all items must have Confirmed = 1)
                const confirmedOrdersQuery = await sequelize.query(
                    `SELECT Order_Number
                     FROM Order_Detail
                     WHERE Order_Number IN (:orderNumbers)
                     GROUP BY Order_Number
                     HAVING COUNT(*) = SUM(CASE WHEN Confirmed = 1 THEN 1 ELSE 0 END)`,
                    {
                        replacements: { orderNumbers: validatedOrderNumbers },
                        type: QueryTypes.SELECT,
                        raw: true,
                    }
                ) as any[];

                // Count orders where all items are confirmed
                totalCheckerOrders = confirmedOrdersQuery.length;
            }
        }

        // Calculate orders completed by checker
        // Step 1: Filter PostgreSQL OrderPick for orders with status = 'ready_for_delivery' and checkerCompletedAt within date range
        const readyForDeliveryOrders = allOrderPicks
            .filter((pick: any) => {
                // Check status
                if (pick.status !== 'ready_for_delivery') {
                    return false;
                }

                // Check checkerCompletedAt is within date range
                if (!pick.checkerCompletedAt) {
                    return false;
                }

                const checkerDate = new Date(pick.checkerCompletedAt);
                return checkerDate >= startDate && checkerDate <= endDate;
            })
            .map((pick: any) => pick.orderNumber)
            .filter((v: any) => v !== null && v !== undefined)
            .map((v: any) => Number(v));

        let ordersCompletedByChecker = 0;

        if (readyForDeliveryOrders.length > 0) {
            // Step 2: Check those orders in MSSQL OrderHeader with Order_Deleted = false (no date filter - already filtered by checkerCompletedAt)
            const checkerCompletedOrderHeaders = await OrderHeader.findAll({
                where: {
                    Order_Number: { [Op.in]: readyForDeliveryOrders },
                    Order_Deleted: false
                },
                attributes: ['Order_Number'],
                raw: true
            });

            // Count orders that exist in OrderHeader
            ordersCompletedByChecker = checkerCompletedOrderHeaders.length;
        }

        // 2. Picker-wise total orders and average time (completed orders only)
        // Use EpickConfirmation instead of OrderPick to get accurate picker-wise data
        const completedOrderPicks = allOrderPicks.filter((pick: any) => pick.status === 'completed' || pick.status === 'ready_for_delivery');
        const completedOrderNumbersForQty = completedOrderPicks.map((pick: any) => pick.orderNumber);

        // Get all completed EpickConfirmations for orders in date range
        const completedConfirmations = await EpickConfirmation.findAll({
            where: {
                orderNumber: { [Op.in]: orderNumbers },
                status: 'completed'
            },
            attributes: ['orderNumber', 'pickerUserId', 'category', 'pickRightAreas', 'startedAt', 'completedAt'],
            raw: true
        });

        // Get all order details to calculate quantity per picker (by category or PickRight area)
        let orderDetailsMap: { [key: number]: any[] } = {};
        if (completedOrderNumbersForQty.length > 0) {
            const allOrderDetails = await OrderDetail.findAll({
                where: {
                    Order_Number: { [Op.in]: completedOrderNumbersForQty }
                },
                include: [
                    {
                        model: Inventory,
                        as: 'inventory',
                        attributes: ['Sales_Category', 'PickArea'],
                        required: false
                    }
                ],
                raw: true,
                nest: true
            });

            // Group order details by order number
            allOrderDetails.forEach((detail: any) => {
                const orderNum = detail.Order_Number;
                if (!orderDetailsMap[orderNum]) {
                    orderDetailsMap[orderNum] = [];
                }
                orderDetailsMap[orderNum].push(detail);
            });
        }

        // Group by pickerUserId - count orders and calculate time using EpickConfirmation
        const pickerOrderCount: { [key: number]: number } = {};
        const pickerTimeData: { [key: number]: { totalTime: number; orderCount: number; totalQuantity: number } } = {};
        const pickerOrderSet: { [key: number]: Set<number> } = {}; // Track unique orders per picker

        completedConfirmations.forEach((confirmation: any) => {
            const pickerId = confirmation.pickerUserId;
            if (!pickerId) return;

            // Initialize sets and data structures
            if (!pickerOrderSet[pickerId]) {
                pickerOrderSet[pickerId] = new Set();
            }
            if (!pickerTimeData[pickerId]) {
                pickerTimeData[pickerId] = { totalTime: 0, orderCount: 0, totalQuantity: 0 };
            }

            // Count unique orders per picker
            pickerOrderSet[pickerId].add(confirmation.orderNumber);

            // Calculate quantity for this picker (categories or PickRight areas)
            let pickerQuantity = 0;
            const orderDetails = orderDetailsMap[confirmation.orderNumber] || [];
            const pickerCategories = confirmation.category || [];
            const pickerAreas = (confirmation.pickRightAreas || []).map((a: string) => String(a).trim());

            orderDetails.forEach((detail: any) => {
                const itemCategory = detail.inventory?.Sales_Category;
                const itemArea = detail.inventory?.PickArea ? String(detail.inventory.PickArea).trim() : null;
                if (itemCategory && pickerCategories.includes(itemCategory)) {
                    pickerQuantity += parseFloat(detail.Quantity_Ordered) || 0;
                } else if (itemArea && pickerAreas.includes(itemArea)) {
                    pickerQuantity += parseFloat(detail.Quantity_Ordered) || 0;
                }
            });

            // Calculate time for this confirmation
            console.log(`\n=== Order ${confirmation.orderNumber} - Picker ${pickerId} ===`);
            console.log('startedAt:', confirmation.startedAt);
            console.log('completedAt:', confirmation.completedAt);
            console.log('categories:', pickerCategories);
            console.log('quantity (category-specific):', pickerQuantity);

            if (confirmation.startedAt && confirmation.completedAt) {
                const startTime = new Date(confirmation.startedAt).getTime();
                const endTime = new Date(confirmation.completedAt).getTime();
                const timeDiff = (endTime - startTime) / 1000; // Convert to seconds

                console.log('timeDiff (seconds):', timeDiff);
                console.log('timeDiff (minutes):', (timeDiff / 60).toFixed(2));
                if (pickerQuantity > 0) {
                    console.log('time per quantity (seconds/qty):', (timeDiff / pickerQuantity).toFixed(2));
                }

                if (timeDiff > 0) {
                    pickerTimeData[pickerId].totalTime += timeDiff;
                    pickerTimeData[pickerId].totalQuantity += pickerQuantity;
                    console.log(`Added to picker ${pickerId}: totalTime = ${pickerTimeData[pickerId].totalTime}s, totalQuantity = ${pickerTimeData[pickerId].totalQuantity}`);
                } else {
                    console.log('WARNING: timeDiff <= 0, skipping this confirmation');
                }
            } else {
                console.log('WARNING: Missing startedAt or completedAt');
            }
        });

        // Set order count from unique orders per picker
        Object.keys(pickerOrderSet).forEach((pickerIdStr: string) => {
            const pickerId = Number(pickerIdStr);
            pickerOrderCount[pickerId] = pickerOrderSet[pickerId].size;
            pickerTimeData[pickerId].orderCount = pickerOrderSet[pickerId].size;
        });

        // Get user details for all pickers from EpickUser table
        const pickerUserIds = Object.keys(pickerOrderCount).map(Number);
        const pickerUsers = await EpickUser.findAll({
            where: {
                id: { [Op.in]: pickerUserIds }
            },
            attributes: ['id', 'firstName', 'lastName', 'userNumber'],
            raw: true
        });

        // Calculate total scanned quantity and scanned lines for each picker (category-based)
        // Get all scans for completed orders and sum by picker based on item categories
        const pickerScannedQty: { [key: number]: number } = {};
        const pickerScannedLines: { [key: number]: Set<string> } = {}; // Track unique item scans per picker
        if (completedOrderNumbersForQty.length > 0) {
            const orderToPickersMap: { [key: number]: Array<{ pickerUserId: number; categories: number[]; pickRightAreas: string[] }> } = {};
            completedConfirmations.forEach((conf: any) => {
                if (!orderToPickersMap[conf.orderNumber]) {
                    orderToPickersMap[conf.orderNumber] = [];
                }
                if (conf.pickerUserId) {
                    const existingPicker = orderToPickersMap[conf.orderNumber].find(
                        (p: any) => p.pickerUserId === conf.pickerUserId
                    );
                    const areas = (conf.pickRightAreas || []).map((a: string) => String(a).trim());
                    if (!existingPicker) {
                        orderToPickersMap[conf.orderNumber].push({
                            pickerUserId: conf.pickerUserId,
                            categories: conf.category || [],
                            pickRightAreas: areas
                        });
                    } else {
                        existingPicker.categories = [...new Set([...(existingPicker.categories || []), ...(conf.category || [])])];
                        existingPicker.pickRightAreas = [...new Set([...(existingPicker.pickRightAreas || []), ...areas])];
                    }
                }
            });

            // Get all scans for these orders with itemNumber
            const allScans = await OrderPickScan.findAll({
                where: {
                    orderNumber: { [Op.in]: completedOrderNumbersForQty }
                },
                attributes: ['orderNumber', 'itemNumber', 'qty'],
                raw: true
            });

            allScans.forEach((scan: any) => {
                const orderNum = scan.orderNumber;
                const itemNum = scan.itemNumber;
                const scanQty = parseFloat(scan.qty) || 0;
                const orderDetails = orderDetailsMap[orderNum] || [];
                const itemDetail = orderDetails.find((detail: any) => detail.Item_Number === itemNum);

                if (itemDetail) {
                    const itemCategory = itemDetail.inventory?.Sales_Category;
                    const itemArea = itemDetail.inventory?.PickArea ? String(itemDetail.inventory.PickArea).trim() : null;
                    const pickersForOrder = orderToPickersMap[orderNum] || [];

                    pickersForOrder.forEach((pickerInfo: any) => {
                        const matchByCategory = itemCategory && (pickerInfo.categories || []).includes(itemCategory);
                        const matchByArea = itemArea && (pickerInfo.pickRightAreas || []).includes(itemArea);
                        if (matchByCategory || matchByArea) {
                            const pickerId = pickerInfo.pickerUserId;
                            pickerScannedQty[pickerId] = (pickerScannedQty[pickerId] || 0) + scanQty;
                            if (!pickerScannedLines[pickerId]) pickerScannedLines[pickerId] = new Set();
                            pickerScannedLines[pickerId].add(`${orderNum}_${itemNum}`);
                        }
                    });
                }
            });

            console.log('Picker scanned quantities (category-based):', pickerScannedQty);
            console.log('Picker scanned lines:', Object.keys(pickerScannedLines).map(id => ({
                pickerId: id,
                lines: pickerScannedLines[Number(id)].size
            })));
        }

        // Calculate total override requests for each picker (with status breakdown)
        const pickerOverrideCount: { [key: number]: number } = {};
        const pickerAcceptedRequests: { [key: number]: number } = {};
        const pickerRejectedRequests: { [key: number]: number } = {};
        if (pickerUserIds.length > 0 && completedOrderNumbersForQty.length > 0) {
            // Get all override requests for orders in date range with status
            const overrideRequests = await OverrideRequest.findAll({
                where: {
                    orderNumber: { [Op.in]: completedOrderNumbersForQty },
                    pickerUserId: { [Op.in]: pickerUserIds }
                },
                attributes: ['pickerUserId', 'status'],
                raw: true
            });

            // Count override requests by picker and status (using pickerUserId which matches user.id)
            overrideRequests.forEach((req: any) => {
                const pickerId = req.pickerUserId;
                if (pickerId) {
                    // Total requests
                    pickerOverrideCount[pickerId] = (pickerOverrideCount[pickerId] || 0) + 1;

                    // Accepted requests
                    if (req.status === 'approved') {
                        pickerAcceptedRequests[pickerId] = (pickerAcceptedRequests[pickerId] || 0) + 1;
                    }

                    // Rejected requests
                    if (req.status === 'rejected') {
                        pickerRejectedRequests[pickerId] = (pickerRejectedRequests[pickerId] || 0) + 1;
                    }
                }
            });

            console.log('Picker override request counts:', pickerOverrideCount);
            console.log('Picker accepted requests:', pickerAcceptedRequests);
            console.log('Picker rejected requests:', pickerRejectedRequests);
        }

        // Helper function to format time
        const formatTime = (seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60); // Use Math.floor to get whole seconds only
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        // Create picker-wise order list with average time
        const pickerWiseOrders = pickerUsers.map((user: any) => {
            const fullName = `${user.firstName} ${user.lastName}`.trim();
            const timeData = pickerTimeData[user.id];
            const averageTimeSeconds = timeData && timeData.orderCount > 0
                ? Math.round(timeData.totalTime / timeData.orderCount)
                : 0;

            // Calculate average time per quantity
            const averageTimePerQty = timeData && timeData.totalQuantity > 0
                ? parseFloat((timeData.totalTime / timeData.totalQuantity).toFixed(2))
                : 0;

            // Get total time for this picker
            const totalTimeSeconds = timeData ? timeData.totalTime : 0;

            // Get scanned lines count
            const scannedLinesSet = pickerScannedLines[user.id];
            const totalScannedLinesCount = scannedLinesSet ? scannedLinesSet.size : 0;

            return {
                pickerId: user.id,
                pickerName: fullName || user.userNumber || `User ${user.id}`,
                totalCompletedOrders: pickerOrderCount[user.id] || 0,
                averageOrderTime: {
                    averageTimeSeconds: averageTimeSeconds,
                    averageTimeFormatted: formatTime(averageTimeSeconds)
                },
                totalOrderTime: {
                    totalTimeSeconds: totalTimeSeconds,
                    totalTimeFormatted: formatTime(totalTimeSeconds)
                },
                averageTimePerQuantity: {
                    secondsPerQty: averageTimePerQty,
                    formatted: `${averageTimePerQty.toFixed(2)}s/qty`
                },
                totalScannedQuantity: Math.round(pickerScannedQty[user.id] || 0),
                totalScannedLines: totalScannedLinesCount,
                totalOverrideRequests: pickerOverrideCount[user.id] || 0,
                totalRequests: pickerOverrideCount[user.id] || 0,
                totalAcceptedRequests: pickerAcceptedRequests[user.id] || 0,
                totalRejectedRequests: pickerRejectedRequests[user.id] || 0,
                totalTimeFormatted: formatTime(totalTimeSeconds)
            };
        }).sort((a, b) => b.totalCompletedOrders - a.totalCompletedOrders);

        // 3. Overall average time of orders for all epick users using EpickConfirmation
        let totalTimeSeconds = 0;
        let totalQuantity = 0;
        let confirmationsWithTime = 0;

        console.log('\n=== Overall Average Time Calculation ===');
        completedConfirmations.forEach((confirmation: any) => {
            if (confirmation.startedAt && confirmation.completedAt) {
                const startTime = new Date(confirmation.startedAt).getTime();
                const endTime = new Date(confirmation.completedAt).getTime();
                const timeDiff = (endTime - startTime) / 1000; // Convert to seconds

                // Calculate quantity for this picker based on their categories
                let pickerQuantity = 0;
                const orderDetails = orderDetailsMap[confirmation.orderNumber] || [];
                const pickerCategories = confirmation.category || [];

                orderDetails.forEach((detail: any) => {
                    const itemCategory = detail.inventory?.Sales_Category;
                    if (itemCategory && pickerCategories.includes(itemCategory)) {
                        pickerQuantity += parseFloat(detail.Quantity_Ordered) || 0;
                    }
                });

                if (timeDiff > 0) {
                    totalTimeSeconds += timeDiff;
                    totalQuantity += pickerQuantity;
                    confirmationsWithTime++;
                }
            }
        });

        console.log(`Total confirmations with valid time: ${confirmationsWithTime} out of ${completedConfirmations.length}`);
        console.log(`Total time (seconds): ${totalTimeSeconds}`);
        console.log(`Total time (minutes): ${(totalTimeSeconds / 60).toFixed(2)}`);
        console.log(`Total time (hours): ${(totalTimeSeconds / 3600).toFixed(2)}`);
        console.log(`Total quantity: ${totalQuantity}`);
        if (totalQuantity > 0) {
            console.log(`Average time per quantity: ${(totalTimeSeconds / totalQuantity).toFixed(2)} seconds/qty`);
        }

        // Log picker-wise summary
        console.log('\n=== Picker-wise Time Summary ===');
        Object.keys(pickerTimeData).forEach((pickerId: string) => {
            const data = pickerTimeData[Number(pickerId)];
            console.log(`Picker ${pickerId}:`);
            console.log(`  - Total orders: ${data.orderCount}`);
            console.log(`  - Total time: ${data.totalTime} seconds (${(data.totalTime / 60).toFixed(2)} minutes, ${(data.totalTime / 3600).toFixed(2)} hours)`);
            console.log(`  - Total quantity: ${data.totalQuantity}`);
            console.log(`  - Average time: ${data.orderCount > 0 ? (data.totalTime / data.orderCount).toFixed(2) : 0} seconds per order`);
            if (data.totalQuantity > 0) {
                console.log(`  - Average time per quantity: ${(data.totalTime / data.totalQuantity).toFixed(2)} seconds/qty`);
            }
        });

        const averageTimeSeconds = confirmationsWithTime > 0 ? Math.round(totalTimeSeconds / confirmationsWithTime) : 0;
        const averageTimePerQty = totalQuantity > 0 ? parseFloat((totalTimeSeconds / totalQuantity).toFixed(2)) : 0;

        // Format average time as HH:MM:SS
        const hours = Math.floor(averageTimeSeconds / 3600);
        const minutes = Math.floor((averageTimeSeconds % 3600) / 60);
        const secs = averageTimeSeconds % 60;
        const averageTimeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Calculate total scanned items and scanned lines from OrderPickScan
        let totalScannedItems = 0;
        let totalScannedLines = 0;
        if (completedOrderNumbersForQty.length > 0) {
            const allScans = await OrderPickScan.findAll({
                where: {
                    orderNumber: { [Op.in]: completedOrderNumbersForQty }
                },
                attributes: ['qty'],
                raw: true
            });

            totalScannedLines = allScans.length;
            totalScannedItems = allScans.reduce((sum: number, scan: any) => {
                return sum + (parseFloat(scan.qty) || 0);
            }, 0);
            console.log(`Total scanned lines: ${totalScannedLines}, Total scanned items: ${totalScannedItems}`);
        }

        // Calculate total override requests (all statuses)
        let totalOverrideRequests = 0;
        let totalRejectedRequests = 0;
        let totalAcceptedRequests = 0;
        if (completedOrderNumbersForQty.length > 0) {
            const allOverrideRequests = await OverrideRequest.findAll({
                where: {
                    orderNumber: { [Op.in]: completedOrderNumbersForQty }
                },
                attributes: ['status'],
                raw: true
            });

            totalOverrideRequests = allOverrideRequests.length;
            totalRejectedRequests = allOverrideRequests.filter((req: any) => req.status === 'rejected').length;
            totalAcceptedRequests = allOverrideRequests.filter((req: any) => req.status === 'approved').length;
            console.log(`Total override requests: ${totalOverrideRequests}, Rejected: ${totalRejectedRequests}, Accepted: ${totalAcceptedRequests}`);
        }

        return {
            orderStatistics: {
                totalOrders,
                totalOrdersFromHeader,
                totalCompletedOrders,
                completedByEpick,
                pendingFromEpick,
                totalCheckerOrders, // NEW: Orders ready for checker
                ordersCompletedByChecker // NEW: Orders completed by checker
            },
            scanningStatistics: {
                totalScannedItems,
                totalScannedLines,
                totalTimeSeconds: totalTimeSeconds,
                totalTimeFormatted: formatTime(totalTimeSeconds)
            },
            overrideRequestStatistics: {
                totalRequests: totalOverrideRequests,
                totalAcceptedRequests,
                totalRejectedRequests
            },
            pickerWiseOrders,
            averageOrderTime: {
                averageTimeSeconds,
                averageTimeFormatted,
                averageTimePerQuantity: {
                    secondsPerQty: averageTimePerQty,
                    formatted: `${averageTimePerQty.toFixed(2)}s/qty`
                }
            },
            dateRange: {
                fromDate: startDate.toISOString().split('T')[0],
                toDate: endDate.toISOString().split('T')[0]
            }
        };
    }

    /**
     * Get epick order statistics with details: order number + retailer name for total, pending, and completed orders.
     */
    async getEpickOrderStatistics(query: PaginationOptions & { fromDate?: string; toDate?: string }) {
        const { fromDate, toDate } = query;

        let startDate: Date, endDate: Date;

        if (fromDate) {
            const [year, month, day] = fromDate.split('-').map(Number);
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        } else {
            startDate = new Date(new Date().getFullYear(), 0, 1);
        }

        if (toDate) {
            const [year, month, day] = toDate.split('-').map(Number);
            endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        } else {
            endDate = new Date();
        }

        const dateFilter = {
            Order_Date: { [Op.between]: [startDate, endDate] },
            Order_Deleted: false
        };

        const totalOrdersHeaders = await OrderHeader.findAll({
            where: dateFilter,
            attributes: ['Order_Number', 'C_Number'],
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['C_Number', 'C_Name', 'C_CoName'],
                    required: false
                }
            ],
            raw: true,
            nest: true
        });

        const orderNumbers = totalOrdersHeaders.map((o: any) => o.Order_Number);
        const totalOrdersDetail = totalOrdersHeaders.map((o: any) => ({
            orderNumber: o.Order_Number,
            retailerName: (o.customer?.C_CoName || o.customer?.C_Name || '') || '—'
        }));

        if (orderNumbers.length === 0) {
            return {
                totalOrders: 0,
                totalOrdersDetail: [],
                pendingFromEpick: 0,
                pendingOrdersDetail: [],
                completedByEpick: 0,
                completedOrdersDetail: [],
                dateRange: {
                    fromDate: startDate.toISOString().split('T')[0],
                    toDate: endDate.toISOString().split('T')[0]
                }
            };
        }

        const allOrderPicks = await OrderPick.findAll({
            where: { orderNumber: { [Op.in]: orderNumbers } },
            attributes: ['orderNumber', 'status', 'completedAt'],
            raw: true
        });

        const pendingPicks = allOrderPicks.filter(
            (p: any) => p.status === 'pending' || p.status === 'in_progress'
        );
        const pendingOrderNumbers = [...new Set(pendingPicks.map((p: any) => p.orderNumber))];
        const orderToRetailerMap: { [key: number]: string } = {};
        totalOrdersHeaders.forEach((o: any) => {
            orderToRetailerMap[o.Order_Number] = (o.customer?.C_CoName || o.customer?.C_Name || '') || '—';
        });
        const pendingOrdersDetail = pendingOrderNumbers.map((orderNumber: number) => ({
            orderNumber,
            retailerName: orderToRetailerMap[orderNumber] ?? '—'
        }));

        const completedPicks = allOrderPicks.filter(
            (p: any) => (p.status === 'completed' || p.status === 'ready_for_delivery') && p.completedAt
        );
        const completedOrderNumbers = completedPicks
            .filter((p: any) => {
                const d = new Date(p.completedAt);
                return d >= startDate && d <= endDate;
            })
            .map((p: any) => p.orderNumber);
        const uniqueCompleted = [...new Set(completedOrderNumbers)];

        let validatedCompleted: number[] = [];
        if (uniqueCompleted.length > 0) {
            const validated = await OrderHeader.findAll({
                where: {
                    Order_Number: { [Op.in]: uniqueCompleted },
                    Order_Deleted: false
                },
                attributes: ['Order_Number'],
                raw: true
            });
            validatedCompleted = validated.map((o: any) => o.Order_Number);
        }

        const completedOrdersDetail = validatedCompleted.map((orderNumber: number) => ({
            orderNumber,
            retailerName: orderToRetailerMap[orderNumber] ?? '—'
        }));

        return {
            totalOrders: totalOrdersHeaders.length,
            totalOrdersDetail,
            pendingFromEpick: pendingOrderNumbers.length,
            pendingOrdersDetail,
            completedByEpick: validatedCompleted.length,
            completedOrdersDetail,
            dateRange: {
                fromDate: startDate.toISOString().split('T')[0],
                toDate: endDate.toISOString().split('T')[0]
            }
        };
    }

    /** Parse date range from query; returns { startDate, endDate, dateFilter }. */
    private parseEpickDateRange(query: { fromDate?: string; toDate?: string }) {
        const { fromDate, toDate } = query;
        let startDate: Date, endDate: Date;
        if (fromDate) {
            const [y, m, d] = fromDate.split('-').map(Number);
            startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else {
            startDate = new Date(new Date().getFullYear(), 0, 1);
        }
        if (toDate) {
            const [y, m, d] = toDate.split('-').map(Number);
            endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
            endDate = new Date();
        }
        const dateFilter = {
            Order_Date: { [Op.between]: [startDate, endDate] },
            Order_Deleted: false
        };
        return { startDate, endDate, dateFilter };
    }

    /**
     * Get total orders list (order number + retailer name) with pagination. Default 10 per page.
     */
    async getEpickTotalOrdersList(query: PaginationOptions & { fromDate?: string; toDate?: string; page?: number; limit?: number }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const offset = (page - 1) * limit;

        const { startDate, endDate, dateFilter } = this.parseEpickDateRange(query);

        const { count, rows } = await OrderHeader.findAndCountAll({
            where: dateFilter,
            attributes: ['Order_Number', 'C_Number'],
            include: [
                { model: Customer, as: 'customer', attributes: ['C_Number', 'C_Name', 'C_CoName'], required: false }
            ],
            order: [['Order_Number', 'DESC']],
            limit,
            offset,
            raw: true,
            nest: true
        });

        const data = (rows as any[]).map((o: any) => ({
            orderNumber: o.Order_Number,
            retailerName: (o.customer?.C_CoName || o.customer?.C_Name || '') || '—'
        }));

        const totalCount = count as number;
        const totalPages = Math.ceil(totalCount / limit) || 1;

        return {
            data,
            pagination: { page, limit, totalCount, totalPages },
            dateRange: { fromDate: startDate.toISOString().split('T')[0], toDate: endDate.toISOString().split('T')[0] }
        };
    }

    /**
     * Get pending-from-epick orders list (order number + retailer name) with pagination. Default 10 per page.
     */
    async getEpickPendingOrdersList(query: PaginationOptions & { fromDate?: string; toDate?: string; page?: number; limit?: number }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const offset = (page - 1) * limit;

        const { startDate, endDate, dateFilter } = this.parseEpickDateRange(query);

        const ordersInDateRange = await OrderHeader.findAll({
            where: dateFilter,
            attributes: ['Order_Number', 'C_Number'],
            include: [
                { model: Customer, as: 'customer', attributes: ['C_Number', 'C_Name', 'C_CoName'], required: false }
            ],
            raw: true,
            nest: true
        });

        const orderNumbers = (ordersInDateRange as any[]).map((o: any) => o.Order_Number);
        const orderToRetailer: { [key: number]: string } = {};
        (ordersInDateRange as any[]).forEach((o: any) => {
            orderToRetailer[o.Order_Number] = (o.customer?.C_CoName || o.customer?.C_Name || '') || '—';
        });

        if (orderNumbers.length === 0) {
            return {
                data: [],
                pagination: { page, limit, totalCount: 0, totalPages: 0 },
                dateRange: { fromDate: startDate.toISOString().split('T')[0], toDate: endDate.toISOString().split('T')[0] }
            };
        }

        const allOrderPicks = await OrderPick.findAll({
            where: { orderNumber: { [Op.in]: orderNumbers } },
            attributes: ['orderNumber', 'status'],
            raw: true
        });

        const pendingOrderNumbers = [...new Set(
            allOrderPicks
                .filter((p: any) => p.status === 'pending' || p.status === 'in_progress')
                .map((p: any) => p.orderNumber)
        )];

        const totalCount = pendingOrderNumbers.length;
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const pagedOrderNumbers = pendingOrderNumbers
            .sort((a, b) => b - a)
            .slice(offset, offset + limit);

        const data = pagedOrderNumbers.map((orderNumber: number) => ({
            orderNumber,
            retailerName: orderToRetailer[orderNumber] ?? '—'
        }));

        return {
            data,
            pagination: { page, limit, totalCount, totalPages },
            dateRange: { fromDate: startDate.toISOString().split('T')[0], toDate: endDate.toISOString().split('T')[0] }
        };
    }

    /**
     * Get completed-by-epick orders list (order number + retailer name) with pagination. Default 10 per page.
     */
    async getEpickCompletedOrdersList(query: PaginationOptions & { fromDate?: string; toDate?: string; page?: number; limit?: number }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const offset = (page - 1) * limit;

        const { startDate, endDate, dateFilter } = this.parseEpickDateRange(query);

        const ordersInDateRange = await OrderHeader.findAll({
            where: dateFilter,
            attributes: ['Order_Number', 'C_Number'],
            include: [
                { model: Customer, as: 'customer', attributes: ['C_Number', 'C_Name', 'C_CoName'], required: false }
            ],
            raw: true,
            nest: true
        });

        const orderNumbers = (ordersInDateRange as any[]).map((o: any) => o.Order_Number);
        const orderToRetailer: { [key: number]: string } = {};
        (ordersInDateRange as any[]).forEach((o: any) => {
            orderToRetailer[o.Order_Number] = (o.customer?.C_CoName || o.customer?.C_Name || '') || '—';
        });

        if (orderNumbers.length === 0) {
            return {
                data: [],
                pagination: { page, limit, totalCount: 0, totalPages: 0 },
                dateRange: { fromDate: startDate.toISOString().split('T')[0], toDate: endDate.toISOString().split('T')[0] }
            };
        }

        const allOrderPicks = await OrderPick.findAll({
            where: { orderNumber: { [Op.in]: orderNumbers } },
            attributes: ['orderNumber', 'status', 'completedAt'],
            raw: true
        });

        const completedOrderNumbers = [...new Set(
            allOrderPicks
                .filter((p: any) => {
                    if (p.status !== 'completed' && p.status !== 'ready_for_delivery' || !p.completedAt) return false;
                    const d = new Date(p.completedAt);
                    return d >= startDate && d <= endDate;
                })
                .map((p: any) => p.orderNumber)
        )];

        let validatedCompleted: number[] = [];
        if (completedOrderNumbers.length > 0) {
            const validated = await OrderHeader.findAll({
                where: { Order_Number: { [Op.in]: completedOrderNumbers }, Order_Deleted: false },
                attributes: ['Order_Number'],
                raw: true
            });
            validatedCompleted = validated.map((o: any) => o.Order_Number);
        }

        const totalCount = validatedCompleted.length;
        const totalPages = Math.ceil(totalCount / limit) || 1;
        const pagedOrderNumbers = validatedCompleted
            .sort((a, b) => b - a)
            .slice(offset, offset + limit);

        const data = pagedOrderNumbers.map((orderNumber: number) => ({
            orderNumber,
            retailerName: orderToRetailer[orderNumber] ?? '—'
        }));

        return {
            data,
            pagination: { page, limit, totalCount, totalPages },
            dateRange: { fromDate: startDate.toISOString().split('T')[0], toDate: endDate.toISOString().split('T')[0] }
        };
    }

    /**
     * Get picker performance (picker-wise orders) for the epick manager module.
     * Same data as pickerWiseOrders in getEpickDashboard, exposed as a dedicated API.
     */
    async getPickerPerformance(query: PaginationOptions & { fromDate?: string; toDate?: string }) {
        const { fromDate, toDate } = query;

        let startDate: Date, endDate: Date;

        if (fromDate) {
            const [year, month, day] = fromDate.split('-').map(Number);
            startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        } else {
            startDate = new Date(new Date().getFullYear(), 0, 1);
        }

        if (toDate) {
            const [year, month, day] = toDate.split('-').map(Number);
            endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        } else {
            endDate = new Date();
        }

        const dateFilter = {
            Order_Date: { [Op.between]: [startDate, endDate] },
            Order_Deleted: false
        };

        const ordersInDateRange = await OrderHeader.findAll({
            where: dateFilter,
            attributes: ['Order_Number'],
            raw: true
        });

        const orderNumbers = ordersInDateRange.map((order: any) => order.Order_Number);

        if (orderNumbers.length === 0) {
            return {
                pickerPerformance: [],
                dateRange: {
                    fromDate: startDate.toISOString().split('T')[0],
                    toDate: endDate.toISOString().split('T')[0]
                }
            };
        }

        const allOrderPicks = await OrderPick.findAll({
            where: { orderNumber: { [Op.in]: orderNumbers } },
            attributes: ['orderNumber', 'status', 'pickerUserNumber', 'startedAt', 'completedAt', 'checkerCompletedAt'],
            raw: true
        });

        const completedOrderPicks = allOrderPicks.filter(
            (pick: any) => pick.status === 'completed' || pick.status === 'ready_for_delivery'
        );
        const completedOrderNumbersForQty = completedOrderPicks.map((pick: any) => pick.orderNumber);

        const completedConfirmations = await EpickConfirmation.findAll({
            where: {
                orderNumber: { [Op.in]: orderNumbers },
                status: 'completed'
            },
            attributes: ['orderNumber', 'pickerUserId', 'category', 'pickRightAreas', 'startedAt', 'completedAt'],
            raw: true
        });

        let orderDetailsMap: { [key: number]: any[] } = {};
        if (completedOrderNumbersForQty.length > 0) {
            const allOrderDetails = await OrderDetail.findAll({
                where: { Order_Number: { [Op.in]: completedOrderNumbersForQty } },
                include: [
                    {
                        model: Inventory,
                        as: 'inventory',
                        attributes: ['Sales_Category', 'PickArea'],
                        required: false
                    }
                ],
                raw: true,
                nest: true
            });
            allOrderDetails.forEach((detail: any) => {
                const orderNum = detail.Order_Number;
                if (!orderDetailsMap[orderNum]) orderDetailsMap[orderNum] = [];
                orderDetailsMap[orderNum].push(detail);
            });
        }

        const pickerOrderCount: { [key: number]: number } = {};
        const pickerTimeData: { [key: number]: { totalTime: number; orderCount: number; totalQuantity: number } } = {};
        const pickerOrderSet: { [key: number]: Set<number> } = {};

        completedConfirmations.forEach((confirmation: any) => {
            const pickerId = confirmation.pickerUserId;
            if (!pickerId) return;

            if (!pickerOrderSet[pickerId]) pickerOrderSet[pickerId] = new Set();
            if (!pickerTimeData[pickerId]) pickerTimeData[pickerId] = { totalTime: 0, orderCount: 0, totalQuantity: 0 };

            pickerOrderSet[pickerId].add(confirmation.orderNumber);

            let pickerQuantity = 0;
            const orderDetails = orderDetailsMap[confirmation.orderNumber] || [];
            const pickerCategories = confirmation.category || [];
            const pickerAreas = (confirmation.pickRightAreas || []).map((a: string) => String(a).trim());
            orderDetails.forEach((detail: any) => {
                const itemCategory = detail.inventory?.Sales_Category;
                const itemArea = detail.inventory?.PickArea ? String(detail.inventory.PickArea).trim() : null;
                if (itemCategory && pickerCategories.includes(itemCategory)) {
                    pickerQuantity += parseFloat(detail.Quantity_Ordered) || 0;
                } else if (itemArea && pickerAreas.includes(itemArea)) {
                    pickerQuantity += parseFloat(detail.Quantity_Ordered) || 0;
                }
            });

            if (confirmation.startedAt && confirmation.completedAt) {
                const startTime = new Date(confirmation.startedAt).getTime();
                const endTime = new Date(confirmation.completedAt).getTime();
                const timeDiff = (endTime - startTime) / 1000;
                if (timeDiff > 0) {
                    pickerTimeData[pickerId].totalTime += timeDiff;
                    pickerTimeData[pickerId].totalQuantity += pickerQuantity;
                }
            }
        });

        Object.keys(pickerOrderSet).forEach((pickerIdStr: string) => {
            const pickerId = Number(pickerIdStr);
            pickerOrderCount[pickerId] = pickerOrderSet[pickerId].size;
            pickerTimeData[pickerId].orderCount = pickerOrderSet[pickerId].size;
        });

        const pickerUserIds = Object.keys(pickerOrderCount).map(Number);
        const pickerUsers = await EpickUser.findAll({
            where: { id: { [Op.in]: pickerUserIds } },
            attributes: ['id', 'firstName', 'lastName', 'userNumber'],
            raw: true
        });

        const pickerScannedQty: { [key: number]: number } = {};
        const pickerScannedLines: { [key: number]: Set<string> } = {};
        if (completedOrderNumbersForQty.length > 0) {
            const orderToPickersMap: { [key: number]: Array<{ pickerUserId: number; categories: number[]; pickRightAreas: string[] }> } = {};
            completedConfirmations.forEach((conf: any) => {
                if (!orderToPickersMap[conf.orderNumber]) orderToPickersMap[conf.orderNumber] = [];
                if (conf.pickerUserId) {
                    const existingPicker = orderToPickersMap[conf.orderNumber].find((p: any) => p.pickerUserId === conf.pickerUserId);
                    const areas = (conf.pickRightAreas || []).map((a: string) => String(a).trim());
                    if (!existingPicker) {
                        orderToPickersMap[conf.orderNumber].push({
                            pickerUserId: conf.pickerUserId,
                            categories: conf.category || [],
                            pickRightAreas: areas
                        });
                    } else {
                        existingPicker.categories = [...new Set([...(existingPicker.categories || []), ...(conf.category || [])])];
                        existingPicker.pickRightAreas = [...new Set([...(existingPicker.pickRightAreas || []), ...areas])];
                    }
                }
            });

            const allScans = await OrderPickScan.findAll({
                where: { orderNumber: { [Op.in]: completedOrderNumbersForQty } },
                attributes: ['orderNumber', 'itemNumber', 'qty'],
                raw: true
            });

            allScans.forEach((scan: any) => {
                const orderNum = scan.orderNumber;
                const itemNum = scan.itemNumber;
                const scanQty = parseFloat(scan.qty) || 0;
                const orderDetails = orderDetailsMap[orderNum] || [];
                const itemDetail = orderDetails.find((detail: any) => detail.Item_Number === itemNum);
                if (itemDetail) {
                    const itemCategory = itemDetail.inventory?.Sales_Category;
                    const itemArea = itemDetail.inventory?.PickArea ? String(itemDetail.inventory.PickArea).trim() : null;
                    const pickersForOrder = orderToPickersMap[orderNum] || [];
                    pickersForOrder.forEach((pickerInfo: any) => {
                        const matchByCategory = itemCategory && (pickerInfo.categories || []).includes(itemCategory);
                        const matchByArea = itemArea && (pickerInfo.pickRightAreas || []).includes(itemArea);
                        if (matchByCategory || matchByArea) {
                            const pickerId = pickerInfo.pickerUserId;
                            pickerScannedQty[pickerId] = (pickerScannedQty[pickerId] || 0) + scanQty;
                            if (!pickerScannedLines[pickerId]) pickerScannedLines[pickerId] = new Set();
                            pickerScannedLines[pickerId].add(`${orderNum}_${itemNum}`);
                        }
                    });
                }
            });
        }

        const pickerOverrideCount: { [key: number]: number } = {};
        const pickerAcceptedRequests: { [key: number]: number } = {};
        const pickerRejectedRequests: { [key: number]: number } = {};
        if (pickerUserIds.length > 0 && completedOrderNumbersForQty.length > 0) {
            const overrideRequests = await OverrideRequest.findAll({
                where: {
                    orderNumber: { [Op.in]: completedOrderNumbersForQty },
                    pickerUserId: { [Op.in]: pickerUserIds }
                },
                attributes: ['pickerUserId', 'status'],
                raw: true
            });
            overrideRequests.forEach((req: any) => {
                const pickerId = req.pickerUserId;
                if (pickerId) {
                    pickerOverrideCount[pickerId] = (pickerOverrideCount[pickerId] || 0) + 1;
                    if (req.status === 'approved') pickerAcceptedRequests[pickerId] = (pickerAcceptedRequests[pickerId] || 0) + 1;
                    if (req.status === 'rejected') pickerRejectedRequests[pickerId] = (pickerRejectedRequests[pickerId] || 0) + 1;
                }
            });
        }

        const formatTime = (seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        const pickerPerformance = pickerUsers.map((user: any) => {
            const fullName = `${user.firstName} ${user.lastName}`.trim();
            const timeData = pickerTimeData[user.id];
            const averageTimeSeconds = timeData && timeData.orderCount > 0
                ? Math.round(timeData.totalTime / timeData.orderCount)
                : 0;
            const averageTimePerQty = timeData && timeData.totalQuantity > 0
                ? parseFloat((timeData.totalTime / timeData.totalQuantity).toFixed(2))
                : 0;
            const totalTimeSeconds = timeData ? timeData.totalTime : 0;
            const totalScannedLinesCount = pickerScannedLines[user.id] ? pickerScannedLines[user.id].size : 0;

            return {
                pickerId: user.id,
                pickerName: fullName || user.userNumber || `User ${user.id}`,
                totalCompletedOrders: pickerOrderCount[user.id] || 0,
                averageOrderTime: {
                    averageTimeSeconds,
                    averageTimeFormatted: formatTime(averageTimeSeconds)
                },
                totalOrderTime: {
                    totalTimeSeconds,
                    totalTimeFormatted: formatTime(totalTimeSeconds)
                },
                averageTimePerQuantity: {
                    secondsPerQty: averageTimePerQty,
                    formatted: `${averageTimePerQty.toFixed(2)}s/qty`
                },
                totalScannedQuantity: Math.round(pickerScannedQty[user.id] || 0),
                totalScannedLines: totalScannedLinesCount,
                totalOverrideRequests: pickerOverrideCount[user.id] || 0,
                totalRequests: pickerOverrideCount[user.id] || 0,
                totalAcceptedRequests: pickerAcceptedRequests[user.id] || 0,
                totalRejectedRequests: pickerRejectedRequests[user.id] || 0,
                totalTimeFormatted: formatTime(totalTimeSeconds)
            };
        }).sort((a, b) => b.totalCompletedOrders - a.totalCompletedOrders);

        return {
            pickerPerformance,
            dateRange: {
                fromDate: startDate.toISOString().split('T')[0],
                toDate: endDate.toISOString().split('T')[0]
            }
        };
    }

}