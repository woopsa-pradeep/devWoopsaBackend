import { Op, Sequelize } from "sequelize";
import Banner from "../models/postgres/banner.model";
import { Inventory } from "../models/mmsql/inventory.model";
import SalesCategory from "../models/mmsql/salesCategory.model";
import PriceClass from "../models/mmsql/priceClass.mode";
import { OrderDetail } from "../models/mmsql/orderDetail.model";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import moment from 'moment';
import InventorySpecials from "../models/mmsql/inventorySpecail.model";
import { InventoryUPC } from "../models/mmsql/inventoryUpc.model";
import { ProductImage } from "../models/postgres/product.model";
import WebViewImage from "../models/postgres/WebView.model";
import { PaginationOptions } from "../interfaces/pagination.interface";
import HomeSettings from "../models/postgres/homeSetting.model";
import { Link } from "../models/postgres/links.model";
import { Distributor } from "../models/mmsql/distributor.model";
import Setting from "../models/postgres/setting.model";
import { AppError } from "../utils/AppError";
import { CustomerRequest } from "../models/postgres/retailerRequest.model";
import WebQuickLink from "../models/postgres/WebQuickLink";
import { WebCategory } from "../models/postgres/webCategory.model";
import { WebPriceClass } from "../models/postgres/webPriceClass";
import { WebLocation } from "../models/postgres/webLocation.model";
import { ContactUs } from "../models/postgres/contactUs.model";
export class HomeService {

    async getBannerList() {
        const bannerList = await Banner.findAll({
            where: {
                isActive: true,
                status: true,
                hasForWeb: true,
                endDate: {
                    [Op.gt]: new Date()
                }
            },
            order: [['createdAt', 'DESC']],
        });

        return bannerList;
    }

    async getPromotedItems() {

        let promotedItems: any = await HomeSettings.findOne({

        })
        promotedItems = promotedItems?.dataValues?.promotedItems || [];

        if (!promotedItems || promotedItems.length === 0) {
            return {
                totalCount: 0,
                promotedItemsList: []
            };
        }

        const { count: totalCount, rows: productList } = await Inventory.findAndCountAll({
            where: {
                Item_Number: { [Op.in]: promotedItems }
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









            return {
                Pack: item.Pack,
                Description: item.Description,
                Item_Number: item.Item_Number,
                CaseCount: item.CaseCount,
                UOM: item.UOM,
                Price1: item.Price1,
                Price2: item.Price2,







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
            };
        }));

        return {
            totalCount,
            promotedItemsList: finalPromotedItemsList
        };
    }

    async getNewItem() {
        let page = 1;
        let limit = 30;
        page = Number(page);
        limit = Number(limit);

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

            return {
                Pack: e.Pack,
                Description: e.Description,
                Item_Number: e.Item_Number,
                CaseCount: e.CaseCount,
                UOM: e.UOM,
                Price1: e.Price1,
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

            totalCount: limit,
            finalProductList,
        };
    }

    async getPopularItems() {
        const startOfYear = moment().startOf('year').toDate();
        const endOfYear = moment().endOf('year').toDate();

        // Step 1: Get most sold inventory items in the current year
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
                        Order_Date: { [Op.between]: [startOfYear, endOfYear] }
                    },
                    required: true
                }
            ],
            where: {
                Quantity_Shipped: { [Op.gt]: 0 } // Only shipped items
            },
            group: ['OrderDetail.Item_Number'],
            order: [[Sequelize.fn('SUM', Sequelize.col('Quantity_Ordered')), 'DESC']],
            raw: true
        });

        // Step 2: Get top 10 item numbers
        const topItemNumbers = allMostSaleData
            .slice(0, 10)
            .map((item: any) => item.Item_Number);

        if (!topItemNumbers.length) {
            return { totalCount: 0, finalProductList: [] };
        }

        // Step 3: Fetch complete inventory data for top items
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
                'Date_Created',
                'OTP_Number',
                'UnitOunces'
            ],
            where: {
                Item_Number: { [Op.in]: topItemNumbers }
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
                    where: { Status: 0 },
                    required: false
                }
            ],
            order: [['Item_Number', 'DESC']]
        });

        // Step 4: Attach images & format output
        const finalProductList = await Promise.all(
            productList.map(async (item: any) => {
                const productImage = await ProductImage.findOne({
                    where: {
                        product_number: item.Item_Number.toString(),
                        isAllow: true
                    }
                });

                return {
                    Pack: item.Pack,
                    Description: item.Description,
                    Item_Number: item.Item_Number,
                    CaseCount: item.CaseCount,
                    UOM: item.UOM,
                    Price1: item.Price1,
                    Price2: item.Price2,
                    OTP_Number: item.OTP_Number,
                    UnitOunces: item.UnitOunces,
                    BaseCost: item.BaseCost,
                    Invoice_Cost: item.Invoice_Cost,
                    AvgCost: item.AvgCost,
                    NetCost: item.NetCost,
                    UPCList: item.UPCList,
                    imageId: productImage?.id || null,
                    SalesCategory: item.SalesCategory?.Category_Desc || null,
                    PriceClass: item.PriceClass?.Class_Desc || null,
                    showDistributorImage: productImage?.isAllow ?? false,
                    distributorImage: productImage?.img_url || null,
                    masterImage: item.UPCList?.[0]?.UPC_Number
                        ? `${process.env.AZUREIMAGESERVER}${item.UPCList[0].UPC_Number}.jpg`
                        : null
                };
            })
        );

        return {
            totalCount: finalProductList.length,
            finalProductList
        };
    }

    async getSpecialItems() {


        // Get current date
        const currentDate = new Date();

        const whereClause: any = {
            [Op.and]: [
                {
                    [Op.or]: [
                        {
                            // Promo is active and within date range
                            Promo_Active: true,
                            Start_Date: { [Op.lte]: currentDate },
                            End_Date: { [Op.gte]: currentDate },
                        },
                        {
                            // OR promo is perpetual
                            Perpetual: true
                        }
                    ]
                }
            ]
        };




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




            let allowToOrderSalesRep = true;
            let allowToOrder = true;

            return {
                Pack: special.inventory.Pack,
                Description: special.inventory.Description,
                Item_Number: special.inventory.Item_Number,
                CaseCount: special.inventory.CaseCount,
                UOM: special.inventory.UOM,
                Price1: special.inventory.Price1,
                Price2: special.inventory.Price2,
                OTP_Number: special.inventory.OTP_Number,



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

    async getAdverstismentImage() {
        let advertisementImage = await WebViewImage.findAll({
            where: {
                isActive: true,
            }
        })
        let finalData = await Promise.all(advertisementImage.map(async (e: any) => {
            let productArray = e.productArray;
            let productList: any[] = [];
            if (productArray) {
                productList = await Inventory.findAll({
                    attributes: [
                        'Pack', 'Description', 'Item_Number', 'CaseCount', 'UOM',
                        'Price1', 'Price2', 'BaseCost', 'Invoice_Cost', 'AvgCost',
                        'NetCost', 'eCommerce', 'I_Inactive', 'Date_Created',
                        'OTP_Number', 'Price_Subclass', 'UnitOunces'
                    ],
                    where: {
                        Item_Number: { [Op.in]: productArray }
                    },
                    include: [
                        {
                            model: InventoryUPC,
                            as: 'UPCList',
                            attributes: ['UPC_Number'],
                            where: { Status: 0 },
                            required: false
                        }
                    ]
                })

                productList = productList.map((e: any) => e.dataValues);
                console.log(productList, 'productList')
                const itemNumbers = productList.map(e => e.Item_Number);

                const productImages = await ProductImage.findAll({
                    where: {
                        product_number: { [Op.in]: itemNumbers.map(String) },
                        isAllow: true
                    }
                });
                console.log(productImages, 'productImages')
                const imageMap = new Map(productImages.map(img => [img.product_number, img]));
                productList.map((e: any) => {
                    const itemStr = e.Item_Number.toString();
                    const productImage = imageMap.get(itemStr) || null;
                    e.showDistributorImage = productImage?.isAllow ?? false;
                    e.distributorImage = productImage?.img_url || null;
                    e.masterImage = `${process.env.AZUREIMAGESERVER}${e.UPCList?.[0]?.UPC_Number}.jpg`;
                })
            }
            return {
                ...e.dataValues,
                productList: productList || []
            }
        }))


        return finalData;
    }

    async getProductCategory() {
        let categories = await SalesCategory.findAll({
            attributes: ["Sales_Category", "Category_Desc"],
            include: [
                {
                    model: PriceClass,
                    as: "priceClasses",
                    attributes: ["Price_Class", "Class_Desc"],
                    required: false,
                    where: {
                        Class_Desc: { [Op.ne]: "Unassigned" } // exclude 'Unassigned'
                    }
                }
            ]
        });
        const finalCategories = await Promise.all(categories.map(async (e: any) => {
            const categoryImage = await WebCategory.findOne({
                where: {
                    categoryId: e.Sales_Category,
                    isActive: true
                }
            })
            return {
                ...e.dataValues,
                image: categoryImage?.image || null
            }
        }))
        return finalCategories;
    }

    async getProductByCategoryList(query: any) {
        let { priceClass, salesCategory, page, limit } = query;
        priceClass = Number(priceClass);
        salesCategory = Number(salesCategory);
        page = Number(page);
        limit = Number(limit);


        const whereClause: any = {
            I_Inactive: false,
        }

        if (priceClass) {
            whereClause.Price_Class = priceClass;
        }
        if (salesCategory) {
            whereClause.Sales_Category = salesCategory;
        }

        const { count: totalCount, rows: productList } = await Inventory.findAndCountAll({
            where: whereClause,
            attributes: [
                'Item_Number',
                'Description',
                'Pack',
                'CaseCount',
                'UOM',
                'Section',
                'CaseCount',
                "OTP_Number",
            ],
            include: [
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
                    required: false
                },
                {
                    model: InventoryUPC,
                    as: 'UPCList',
                    attributes: ['UPC_Number'],
                    where: { Status: 0 },
                    required: false
                }
            ],
            limit,
            offset: (page - 1) * limit,
        });

        const itemNumbers = productList.map(e => e.Item_Number);

        const productImages = await ProductImage.findAll({
            where: {
                product_number: { [Op.in]: itemNumbers.map(String) },
                isAllow: true
            }
        });
        const imageMap = new Map(productImages.map(img => [img.product_number, img]));

        const finalProductList = await Promise.all(productList.map(async (item: any) => {
            const itemStr = item.Item_Number.toString();
            const productImage = imageMap.get(itemStr) || null;
            console.log(item, 'item')
            return {
                Item_Number: item.Item_Number,
                Description: item.Description,
                Pack: item.Pack,
                CaseCount: item.CaseCount,
                UOM: item.UOM,
                Section: item.Section,
                Sales_Category: item.SalesCategory ? item.SalesCategory?.dataValues?.Category_Desc : null,
                Price_Class: item.PriceClass ? item.PriceClass?.dataValues?.Class_Desc : null,
                OTP_Number: item.OTP_Number,
                showDistributorImage: productImage?.isAllow ?? false,
                distributorImage: productImage?.img_url || null,
                masterImage: `${process.env.AZUREIMAGESERVER}${item.UPCList?.[0]?.UPC_Number}.jpg`,
            };
        }));

        return {
            totalCount,
            finalProductList
        };
    }

    async getInventoryItems(query: any & { search?: string, masterSearch?: string }) {
        let { page = 1, limit = 10, salesCategoryId, search, priceClassId, masterSearch } = query;


        page = Number(page);
        limit = Number(limit);

        let whereClause: any = {
            I_Inactive: false,
        };

        let searchInUPC = false;

        if (masterSearch && typeof masterSearch === 'string') {
            const masterArray = masterSearch.split(',').map(i => i.trim());
            whereClause.Item_Number = { [Op.in]: masterArray };
        } else {
            if (salesCategoryId?.length > 0 && priceClassId?.length > 0) {
                whereClause[Op.or] = [
                  { Sales_Category: { [Op.in]: salesCategoryId } },
                  { Price_Class: { [Op.in]: priceClassId } }
                ];
              } else if (salesCategoryId?.length > 0) {
                whereClause.Sales_Category = { [Op.in]: salesCategoryId };
              } else if (priceClassId?.length > 0) {
                whereClause.Price_Class = { [Op.in]: priceClassId };
              }
              

            if (search) {
                const searchValue = `%${search}%`;

                if (/^\d{8,}$/.test(search)) {
                    searchInUPC = true;
                } else {
                    whereClause[Op.or] = [
                        { Item_Number: { [Op.like]: searchValue } },
                        { Description: { [Op.like]: searchValue } },
                        { ALT_Description2: { [Op.like]: searchValue } },
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
                'Pack', 'Description', 'Item_Number', 'CaseCount', 'Sales_Category', 'Price_Class', 'UOM',
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

                includeUPC
            ],
            order: [['Date_Created', 'DESC']],
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



            return {
                Pack: e.Pack,
                Description: e.Description,
                Item_Number: e.Item_Number,
                CaseCount: e.CaseCount,
                UOM: e.UOM,
                Price1: e.Price1,
                OTP_Number: e.OTP_Number,
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
            totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            finalProductList
        };
    }


    async getSalesCategoryList() {
        const salesCategory = await SalesCategory.findAll(
            {
                attributes: ['Sales_Category', 'Category_Desc']
            }
        );
        return salesCategory;
    }

    async getPriceClassList() {
        const priceClass = await PriceClass.findAll(
            {
                attributes: ['Price_Class', 'Class_Desc']
            }
        );
        return priceClass;
    }

    async getUseFulLink() {
        const links = await Link.findAll(
            {
                attributes: ['id', 'name', 'logo', 'url'],
                where: {
                    isActive: true,
                    status: true
                }
            }
        );
        const quickLinks = await WebQuickLink.findAll({
            where: {
                isActive: true,
                status: true
            },
            attributes: ['id', 'name', 'link']
        });
        return { links, quickLinks };
    }

    async getContactUs() {
        const wareHouseInfomation = await Distributor.findOne({
            attributes: ['D_Name', 'D_Addr1', 'D_Addr2', 'D_City', 'D_State', 'D_Zip', 'D_Phone', 'D_Email', 'D_Lcontact', 'D_Fcontact'],

        });
        console.log(wareHouseInfomation, 'wareHouseInfomation')
        const logo = await Setting.findOne({
            attributes: ['warehouseImage'],
        });
        const links = await Link.findAll({
            attributes: ['id', 'name', 'logo', 'url'],
            where: {
                isActive: true,
                status: true
            }
        });
        const quickLinks = await WebQuickLink.findAll({
            where: {
                isActive: true,
                status: true
            },
            attributes: ['id', 'name', 'link']
        });
        const location = await WebLocation.findAll({
            attributes: ['id', 'latitude', 'longitude']
        })

        const contactUs = await ContactUs.findOne({})
        const finalData = {
            ...wareHouseInfomation?.dataValues,
            logo: logo?.dataValues?.warehouseImage,
            links: links,
            quickLinks: quickLinks,
            location: location,
            contactUs: contactUs?.dataValues
        }
        return finalData;
    }

    async createRetailerRequest(body: any) {
        try {

            body.owners = JSON.parse(body.owners);
            body.references = JSON.parse(body.references);
            body.createdBy = 'website';
            body.status = 'PENDING';
            const retailerRequest = await CustomerRequest.create(body);
            return retailerRequest;
        } catch (error) {
            throw new AppError('Failed to create retailer request', 500);
        }
    }

    async getWebPriceClass() {
        const priceClass = await WebPriceClass.findAll({
            where: {
                isActive: true,
                status: true
            },
            attributes: ['id', 'priceClassId', 'name', 'image']
        })
        return priceClass;
    }
}