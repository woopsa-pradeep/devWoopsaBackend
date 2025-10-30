import HomeSettings from "../models/postgres/homeSetting.model";
import { Inventory } from "../models/mmsql/inventory.model";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Customer } from "../models/mmsql/customer.model";
import { SalesRep } from "../models/mmsql/salesrep.model";
import { Sequelize, Op, col, cast, where } from "sequelize";
import { checkQtyDiscount, getFirstValidPrice, getInventoryOnHand, getJurisdiction, getProductLimit, getTaxRateV1 } from "../utils/helper";
import { ProductImage } from "../models/postgres/product.model";
import { getDiscount } from "../utils/helper";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { PriceClass } from "../models/mmsql/priceClass.model";
import { PaginationOptions } from "../interfaces/pagination.interface";
import InventorySpecials from "../models/mmsql/inventorySpecail.model";
import { WarehouseSetting } from "../models/postgres/wareHouseSetting.model";
import Setting from "../models/postgres/setting.model";


export class DashboardService {

    async getPopularItems(userId: number) {
        console.log(userId, 'userId')
        const homeSetting = await HomeSettings.findOne();
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59); // December 31st of current year
        let mostSaleData = null;
        let customerHistoryData = null;
        let asPerCustomerData = null;
        let wareHouseSetting: any = await Setting.findOne({});
        wareHouseSetting = wareHouseSetting?.dataValues || null;

        if (homeSetting?.showMostSale) {
            // Get most sold inventory items in the current year
            const allMostSaleData = await OrderDetail.findAll({
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
                where: {
                    Quantity_Shipped: {
                        [Op.gt]: 0 // Only include items that were actually shipped
                    }
                },
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
                        'UnitOunces'
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
                    const userJurisdiction = await getJurisdiction(userId);
                   

                    let price = await getDiscount(e.Item_Number, userId) 
                    if (!price) {
                        price = await getFirstValidPrice(e);
                    }
                    price = Math.ceil(price * 100) / 100;

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


                        showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                        showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                        showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                        allowToOrderSalesRep: allowToOrderSalesRep || null,
                        showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,

                        hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
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

                    // Get products that other customers in the same city buy
                    const allAsPerCustomerData = await OrderDetail.findAll({
                        attributes: [
                            'Item_Number',
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
                                'UnitOunces'
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
                            price = Math.ceil(price * 100) / 100;
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

                                hasProductLimit: productLimit ? true : false,
                                productLimit,

                                hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
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
                        'UnitOunces'
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
                    price = Math.ceil(price * 100) / 100;   
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
                        showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                        showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                        showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                        allowToOrderSalesRep: allowToOrderSalesRep || null,
                        showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,


                        hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
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
        const { customerNumber } = query
        const homeSetting: any = await HomeSettings.findOne({});
        const promotedItems = homeSetting?.promotedItems || [];

        if (!promotedItems || promotedItems.length === 0) {
            return {
                totalCount: 0,
                promotedItemsList: []
            };
        }

        const { count: totalCount, rows: productList } = await Inventory.findAndCountAll({
            where: {
                Item_Number: { [Op.in]: promotedItems },
                ShortOrderForm: true,
                I_Inactive: false,
            },
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
                        Status: 0
                    },
                    required: false
                }
            ]
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
            if (customerNumber) {
                price = await getDiscount(item.Item_Number, customerNumber) || price;
                const userJurisdiction = await getJurisdiction(customerNumber);
                if (userJurisdiction) {
                    taxRate = await getTaxRateV1(item.OTP_Number, userJurisdiction as number, item.Item_Number, price);
                    taxRate = Math.ceil(taxRate * 100) / 100;
                }
            }
            price = Math.ceil(price * 100) / 100;
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


            return {
                Pack: item.Pack,
                Description: item.Description,
                Item_Number: item.Item_Number,
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



                hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
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
        let { page = 1, limit = 30, search, role, customerNumber } = query;
        page = Number(page);
        limit = Number(limit);

        let whereClause: any = {
            I_Inactive: false,
            ShortOrderForm: true,
        };


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
                        ...(search && {
                            UPC_Number: { [Op.like]: `%${search}%` },
                        }),
                    },
                    required: false
                }
            ],
            order: [['Date_Created', 'DESC']],
            limit,
            offset: (page - 1) * limit,
        });

        const finalProductList = await Promise.all(productList.map(async (e: any) => {
            const productImage = await ProductImage.findOne({
                where: {
                    product_number: e.Item_Number.toString(),
                    isAllow: true
                },
            });

            let taxRate = 0;
            let price = await getFirstValidPrice(e);
            price = Math.ceil(price * 100) / 100;
            if (role === 'retailer') {
                const userJurisdiction = await getJurisdiction(customerId);
                
                price = await getDiscount(e.Item_Number, customerId) || price;
                if (userJurisdiction) {
                    taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                    taxRate = Math.ceil(taxRate * 100) / 100;
                }
            } else if (role === 'sales' && customerNumber) {
                const userJurisdiction = await getJurisdiction(customerNumber);
                
                price = await getDiscount(e.Item_Number, customerNumber) || price;
                if (userJurisdiction) {
                    taxRate = await getTaxRateV1(e.OTP_Number, userJurisdiction as number, e.Item_Number, price);
                    taxRate = Math.ceil(taxRate * 100) / 100;
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

            let hasQtyDiscount = await checkQtyDiscount(e.Item_Number, customerId, price + taxRate);


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
                UPCList: e.UPCList,
                hasProductLimit: productLimit ? true : false,
                productLimit,
                UnitOunces: e.UnitOunces,

                showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                allowToOrderSalesRep: allowToOrderSalesRep || null,
                showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,

                hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
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

    async getDiscountedItems(query: PaginationOptions & { search?: string, masterSearch?: string }, customerId: number) {
        let { search, masterSearch, role, customerNumber } = query;
        let wareHouseSetting: any = await Setting.findOne({});
        wareHouseSetting = wareHouseSetting?.dataValues || null;

        // Get current date
        const today = new Date();

        const currentDate = today.toISOString().split("T")[0];  // "2025-08-25"


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
                        { Perpetual: true }, // optional if you want perpetual promos
                    ],
                },
            ],
        };


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
                        'UnitOunces'
                    ],
                    required: true
                }
            ],
            order: [['Start_Date', 'DESC']],

        });

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

            const upcNumbers = upcMap.get(special.Item_Number) || [];
            const salesCategoryDesc = salesCategoryMap.get(special.inventory.Sales_Category) || null;
            const priceClassDesc = priceClassMap.get(special.inventory.Price_Class) || null;
            let taxRate = 0;
            let price = await getFirstValidPrice(special.inventory);

            let hasQtyDiscount = null;
            if (role === 'retailer') {
                const userJurisdiction = await getJurisdiction(customerId as number);
                price = await getDiscount(special.inventory.Item_Number, customerId) || price;
                price = Math.ceil(price * 100) / 100;
                taxRate = await getTaxRateV1(special.inventory.OTP_Number, userJurisdiction as number, special.inventory.Item_Number, price);
                taxRate = Math.ceil(taxRate * 100) / 100;
                hasQtyDiscount = await checkQtyDiscount(special.inventory.Item_Number, customerId, price + taxRate);

            } else if (role === 'sales' && customerNumber) {
                const userJurisdiction = await getJurisdiction(customerNumber);
                price = await getDiscount(special.inventory.Item_Number, customerNumber) || price;
                price = Math.ceil(price * 100) / 100;
                taxRate = await getTaxRateV1(special.inventory.OTP_Number, userJurisdiction as number, special.inventory.Item_Number, price);
                taxRate = Math.ceil(taxRate * 100) / 100;
                hasQtyDiscount = await checkQtyDiscount(special.inventory.Item_Number, customerNumber, price + taxRate);

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

                hasProductLimit: productLimit ? true : false,
                productLimit,

                showTheInventoryStockToSalesRep: wareHouseSetting?.salesRep?.showStock || false,
                showLowStockToSalesRep: wareHouseSetting?.salesRep?.showStock ? false : inventoryOnHand < wareHouseSetting?.itemGlobal?.InventoryThreshold,
                showPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,
                allowToOrderSalesRep: allowToOrderSalesRep || null,
                showWithOutPriceToSalesRep: wareHouseSetting?.salesRep?.showWithOutPrice || false,

                hasQtyDiscount: hasQtyDiscount?.allowToDiscount || false,
                qtyDiscount: hasQtyDiscount,

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

}