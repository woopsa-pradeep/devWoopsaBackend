import { Op } from "sequelize";
import { PaginationOptions } from "../interfaces/pagination.interface";
import { Inventory } from "../models/mmsql/inventory.model";
import PriceClass from "../models/mmsql/priceClass.mode";
import SalesCategory from "../models/mmsql/salesCategory.model";
import { Users } from "../models/mmsql/user.model";
import { SalesRep } from "../models/mmsql/salesrep.model";
import { Customer } from "../models/mmsql/customer.model";
import { Retailer } from "../models/postgres/retailer.model";
import { getRegisterCustomerName } from "../utils/helper";
import { CustomerRoute } from "../models/mmsql/customerRoutes.model";
import { PickRightAreaDefinition } from "../models/mmsql/pickRightAreaDefination.model";
import { ProjectIdentifiers } from "../models/mmsql/projectIdentifier.model";
import { CigPack } from "../models/mmsql/cigPack.model";
import { Inventory_ItemGroups } from "../models/mmsql/inventoryItemGroup.model";
import { InventoryBrands } from "../models/mmsql/inventoryBrand.model";
import { ExclusionGroups } from "../models/mmsql/exclusive.model";
import { TaxRates_City } from "../models/mmsql/taxRateCity.model";
import { TaxRates_County } from "../models/mmsql/taxRateCounty.model";
import { TaxRates } from "../models/mmsql/taxRates.model";
import { Vendor } from "../models/mmsql/vendor.model";
import { PriceSubclass_Defs } from "../models/mmsql/priceSubClassDefs.model";
import { NACS_CategoryCodes } from "../models/mmsql/nacsCode.model";
import { getDefaultCustomerValues } from "../utils/customer";
import { OtherTaxes } from "../models/mmsql/otherTaxes.model";
import { MSA_CategoryCodes } from "../models/mmsql/msaCategoryCode.model";
import { Terms } from "../models/mmsql/invoiceTerm.model";
import { ClassOfTrade } from "../models/mmsql/classOfTrade.model";
import { DeliveryTypes } from "../models/mmsql/deliveryType.model";
import { CustomerStatus } from "../models/mmsql/customerStatus.model";
import { DocumentAdditionalFormats } from "../models/mmsql/documentAdditionalFormat.model";
import { EDIFormatsUser } from "../models/mmsql/ediFormatUser.model";
import { POHeader } from "../models/mmsql/poHeader.model";
import { POType } from "../models/mmsql/poType.model";
import { QBBills } from "../models/mmsql/qbBills.model";
import { Route } from "../models/mmsql/routes.model";
import { CustReceivables } from '../models/mmsql/custReceivables.model'
import { ARDefinitions } from '../models/mmsql/arDefinitions.model'
import Sequelize from "sequelize";
import { ARDeposits } from "../models/mmsql/arDeposits.model";
import { InventoryLogHistory } from "../models/mmsql/InventoryLogHistory.model"
import { custom } from "joi";
import { Order_Source } from "../models/mmsql/orderSource.model";
import { Order_Header_Costs } from "../models/mmsql/orderHeaderCost.model";
import { OrderHeader } from "../models/mmsql/orderHeader.model";
import { Driver } from "../models/postgres/driver.model";
import { Vehicle } from "../models/postgres/vehicle.model";

export class ListService {

  async getSalesCategoryList() {
    const salesCategory = await SalesCategory.findAll(
      {
        attributes: ['Sales_Category', 'Category_Desc']
      }
    );
    return salesCategory;
  }

  async getPriceClassList() {
    const priceClass = await PriceClass.findAll({
      where: {
        Class_Desc: {
          [Op.ne]: "Unassigned"
        }
      },
      attributes: ['Price_Class', 'Class_Desc']
    });
    return priceClass;
  }

  async getProductList(query: PaginationOptions) {
    const { search, page = 1, limit = 50 } = query;

    const whereClause = search
      ? {
        I_Inactive: false,
        ShortOrderForm: true,
        [Op.or]: [
          { Item_Number: { [Op.like]: `%${search}%` } },
          { Description: { [Op.like]: `%${search}%` } },
          { ALT_Description2: { [Op.like]: `%${search}%` } },
        ],
      }
      : {
        I_Inactive: false,
        ShortOrderForm: true,
      };

    const result = await Inventory.findAll({
      where: whereClause,
      order: [['Date_Created', 'DESC']], // keep pagination order intact
      limit: search ? undefined : limit,
      offset: search ? undefined : (page - 1) * limit,
    });

    // ------- CUSTOM SORTING AFTER FETCH -------
    const sortedResult = result.sort((a, b) => {
      const valA = a.Description?.trim() || "";
      const valB = b.Description?.trim() || "";

      const getCategory = (str: string): number => {
        if (!str) return 4;

        const first = str[0];

        // 1️⃣ SYMBOLS: anything not a letter or number (supports Unicode)
        if (/^[^\p{L}\p{N}]/u.test(first)) return 1;

        // 2️⃣ NUMBERS: starts with digit
        if (/^[0-9]/.test(str)) return 2;

        // 3️⃣ LETTERS: starts with a letter (A-Z or Unicode)
        if (/^[\p{L}]/u.test(str)) return 3;

        return 4;
      };

      const categoryA = getCategory(valA);
      const categoryB = getCategory(valB);

      if (categoryA !== categoryB) return categoryA - categoryB;

      // Same category → natural alphanumeric sorting (#1A < #2A < #10A, test2 < test10)
      return valA.localeCompare(valB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return sortedResult;
  }

  async getCustomerList() {
    const findCustomer = await Customer.findAll({
      where: {
        C_Inactive: false
      },
      attributes: ['C_Number', 'C_Name', 'C_CoName', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Phone', 'C_Email']
    })
    const sortedCustomers = findCustomer.sort((a, b) => {
      const valA = a.C_Name?.trim() || "";
      const valB = b.C_Name?.trim() || "";

      const getCategory = (str: string): number => {
        if (!str) return 4;

        const first = str[0];

        // SYMBOLS: anything not letter or number
        if (/^[^\p{L}\p{N}]/u.test(first)) return 1;

        // NUMBERS: starts with digit
        if (/^[0-9]/.test(str)) return 2;

        // LETTERS: starts with letter
        if (/^[\p{L}]/u.test(str)) return 3;

        return 4;
      };

      const categoryA = getCategory(valA);
      const categoryB = getCategory(valB);

      if (categoryA !== categoryB) return categoryA - categoryB;

      // Same category → natural alphanumeric sort (handles #1, #2, etc.)
      return valA.localeCompare(valB, undefined, {
        numeric: true,
        sensitivity: "base"
      });
    });

    return sortedCustomers;
  }

  async getUserList() {
    return await Users.findAll({
      attributes: ['UserNumber', 'UserID', 'UserName'],

    })
  }

  async getSalesRepList() {
    return await SalesRep.findAll({
      attributes: ['S_Number', 'S_Desc'],
      where: {
        S_Desc: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.ne]: '' },
          ],
        },
      },
    });
  }

  async getRegisterCustomerList() {
    const registerCustomer = await Retailer.findAll({
      where: {
        isActive: true
      },
      attributes: ['Customer_Number']
    })
    const finalList = await Promise.all(registerCustomer.map(async (customer) => {
      const customerName = await getRegisterCustomerName(customer.Customer_Number)
      return {
        ...customer.dataValues,
        customerName
      }
    }))
    return finalList;
  }

  async getCustomerRouteList() {
    const route = await CustomerRoute.findAll({
      attributes: [
        'Route_Number',

      ],
      group: ['Route_Number'],
      raw: true
    });

    const stop = await CustomerRoute.findAll({
      attributes: [
        'Stop_Number',
      ],
      group: ['Stop_Number'],
      raw: true
    });
    return { route, stop };
  }


  async getProductListBySearch(search: string) {
    if (!search) {
      return [];
    }

    const searchArray = search.split(',').map(s => s.trim());

    const productList = await Inventory.findAll({
      where: {
        I_Inactive: false,
        ShortOrderForm: true,
        [Op.or]: [
          { Item_Number: { [Op.like]: `%${search}%` } }, // exact match for Item_Number
          { Description: { [Op.like]: `${search}%` } }, // partial match in Description
          { AltDesc: { [Op.like]: `%${search}%` } } // partial match in AltDesc
        ]
      },
      attributes: ['Item_Number', 'Description', 'AltDesc']
    });
    return productList;
  }

  async getListOfRoutes() {
    const routesWithStop = await CustomerRoute.findAll({
      attributes: ['Stop_Number'],
      group: ['Stop_Number'],
      raw: true
    });

    const routesWithoutStop = await CustomerRoute.findAll({
      attributes: ['Route_Number'],
      group: ['Route_Number'],
      raw: true
    });
    return { routesWithStop, routesWithoutStop };
  }


  async getListOfCustomerForEmail(data: any) {

    const { routes, days, search } = data;

    console.log('Search:', search, 'Type:', typeof search);

    const whereCondition: any = {
      C_Inactive: false,
    };

    if (search !== undefined && search !== null && search !== '') {
      const searchConditions: any[] = [];

      if (!isNaN(Number(search))) {
        searchConditions.push({
          C_Number: Number(search),
        });
      }

      searchConditions.push({
        C_Name: {
          [Op.like]: `%${search}%`,
        },
      });

      whereCondition[Op.or] = searchConditions;
    }

    // 📅 Days filter
    if (Array.isArray(days) && days.length > 0) {
      whereCondition.C_OrderDay = {
        [Op.in]: days,
      };
    }

    const includeOptions: any = {
      model: CustomerRoute,
      as: 'Routes',
      required: false,
    };

    if (Array.isArray(routes) && routes.length > 0) {
      includeOptions.where = {
        Route_Number: {
          [Op.in]: routes,
        },
      };
    }

    const customers = await Customer.findAll({
      where: whereCondition,
      include: [includeOptions],
      attributes: [
        'C_Number',
        'C_Name',
        'C_Email',
        'C_OrderDay'
      ],
      order: [['C_Name', 'ASC']],
    });


    return customers;
  }


  async getListForInventory() {
    const salesCategory = await SalesCategory.findAll({
      attributes: ['Sales_Category', 'Category_Desc'],
      order: [['Category_Desc', 'ASC']]
    })
    const priceClass = await PriceClass.findAll({
      attributes: ['Price_Class', 'Class_Desc'],
      order: [['Class_Desc', 'ASC']]
    })

    const pickRightArea = await PickRightAreaDefinition.findAll({
      attributes: ['PickArea', 'PickArea_Description'],
      order: [['PickArea_Description', 'ASC']]
    })

    const priceSubclass = await PriceSubclass_Defs.findAll({
      attributes: ['Price_Subclass', 'Subclass_Def'],
      order: [['Subclass_Def', 'ASC']]
    })

    const cigPack = await CigPack.findAll({
      attributes: ['Cig_Pack', 'Cig_Pack_Select'],
      order: [['Cig_Pack', 'ASC']]
    })
    const projectIdentifier = await ProjectIdentifiers.findAll({
      attributes: ['Project_Identifier', 'Description'],
      order: [['Description', 'ASC']]

    })
    const inventoryItemGroup = await Inventory_ItemGroups.findAll({
      attributes: ['Item_GroupID', 'Item_GroupDescription'],
      order: [['Item_GroupDescription', 'ASC']]
    })
    const inventoryBrand = await InventoryBrands.findAll({
      attributes: ['Brand_ID', 'Brand_Family'],
      order: [['Brand_Family', 'ASC']]
    })
    const exclusionGroup = await ExclusionGroups.findAll({
      attributes: ['ExclusionGroup_ID', 'ExclusionGroup_Description'],
      order: [['ExclusionGroup_Description', 'ASC']]
    })
    const taxRateCity = await TaxRates_City.findAll({
      attributes: ['Jurisdiction_City', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    })
    const taxRateCounty = await TaxRates_County.findAll({
      attributes: ['Jurisdiction_County', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    })

    const taxRate = await TaxRates.findAll({
      attributes: ['Jurisdiction_State', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    })

    const vendor = await Vendor.findAll({
      attributes: ['Primary_Vendor', 'V_Description'],
      order: [['V_Description', 'ASC']]
    })
    const nacsCategory = await NACS_CategoryCodes.findAll({
      attributes: ['NACS_Category_Code', 'NACS_Description'],
      order: [['NACS_Description', 'ASC']]
    })
    const otherTaxes = await OtherTaxes.findAll({
      attributes: ['OTP_Number', 'OTP_Description'],
      order: [['OTP_Description', 'ASC']]
    })
    const msaCategory = await MSA_CategoryCodes.findAll({
      attributes: ['MSA_Category_Code', 'MSA_Description'],
      order: [['MSA_Description', 'ASC']]
    })
    return { salesCategory, priceClass, pickRightArea, cigPack, projectIdentifier, inventoryItemGroup, inventoryBrand, exclusionGroup, taxRateCity, taxRateCounty, taxRate, vendor, priceSubclass, nacsCategory, otherTaxes, msaCategory }

  }

  async listOfRetailer() {

    const retailers = await Retailer.findAll({
      where: {
        isActive: true,
        isAllow: true,
      },
      attributes: ['Customer_Number'],
      raw: true
    });

    if (!retailers.length) return [];

    const customerNumbers = retailers.map(r => r.Customer_Number);

    const customers = await Customer.findAll({
      where: {
        C_Number: customerNumbers
      },
      attributes: ['C_Number', 'C_Name'],
      raw: true
    });

    const customerMap = new Map();
    customers.forEach(c => {
      customerMap.set(c.C_Number, c.C_Name);
    });

    const result = retailers.map(r => ({
      ...r,
      C_Name: customerMap.get(r.Customer_Number) || null
    }));

    return result;
  }




  async getListOfCustomersCreate() {
    const customer = await Customer.findAll({
      attributes: ['C_Inactive', 'C_Name', 'C_Number'],
      order: [['C_Name', 'ASC']]
    });

    const routes = await Route.findAll({
      attributes: ['Route_Number'],
      order: [['Route_Number', 'ASC']]
    });

    const terms = await Terms.findAll({
      attributes: ['TermsCode', 'Terms'],
      order: [['Terms', 'ASC']]
    })
    const customerStatus = await CustomerStatus.findAll({
      attributes: ['C_StatusCode', 'C_Status', 'C_StatusDescription', 'C_ClassCategory'],
      order: [['C_StatusDescription', 'ASC']]
    })
    const classOfTrade = await ClassOfTrade.findAll({
      attributes: ['Trade_Code', 'Trade_Desc'],
      order: [['Trade_Desc', 'ASC']]
    })
    const deliveryType = await DeliveryTypes.findAll({
      attributes: ['Delivery_ID', 'Delivery_Type', 'Delivery_Description', 'Delivery_Active'],
      order: [['Delivery_Description', 'ASC']]
    })

    const documentAdditionalFormat = await DocumentAdditionalFormats.findAll({
      attributes: ['Document_Type', 'Document_FormatID', 'Document_Description', 'Document_ReportFileName'],
      order: [['Document_Description', 'ASC']]
    })
    const ediFormatUser = await EDIFormatsUser.findAll({
      attributes: ['EDI_ID', 'EDI_Format', 'EDI_DescriptionUser', 'EDI_OptionsUser', 'EDI_AccountNumber'],
      order: [['EDI_DescriptionUser', 'ASC']]
    })

    const salesRep = await SalesRep.findAll({
      attributes: ['S_Number', 'S_Desc'],
      order: [['S_Desc', 'ASC']]
    })

    const salesCategory = await SalesCategory.findAll({
      attributes: ['Sales_Category', 'Category_Desc'],
      order: [['Category_Desc', 'ASC']]
    })

    const taxRateCity = await TaxRates_City.findAll({
      attributes: ['Jurisdiction_City', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    })
    const taxRateCounty = await TaxRates_County.findAll({
      attributes: ['Jurisdiction_County', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    })

    const taxRate = await TaxRates.findAll({
      attributes: ['Jurisdiction_State', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    })


    return { customer, routes, terms, customerStatus, classOfTrade, deliveryType, documentAdditionalFormat, ediFormatUser, salesRep, salesCategory, taxRateCity, taxRateCounty, taxRate };
  }


  async getListOfVendorsCreate() {

    const vendorGroup = await Vendor.findAll({
      attributes: ['Primary_Vendor', 'V_Description'],
      order: [['V_Description', 'ASC']],
    });

    const jurisdictionState = await TaxRates.findAll({
      attributes: ['Jurisdiction_State', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    });

    const buyerID = await Users.findAll({
      attributes: ['UserNumber', 'UserID'],
      order: [['UserID', 'ASC']]
    });

    const documentFormats = await DocumentAdditionalFormats.findAll({
      attributes: ['Document_Type', 'Document_FormatID', 'Document_Description', 'Document_ReportFileName'],
      order: [['Document_Type', 'ASC']],
    });

    const terms = await Terms.findAll({
      attributes: ['TermsCode', 'Terms', 'DaysUntilDue', 'TermsType'],
      order: [['Terms', 'ASC']],
    });


    return {
      vendorGroup: vendorGroup,
      jurisdictionState: jurisdictionState,
      buyerID: buyerID,
      documentFormats: documentFormats,
      terms: terms,
    };
  }

  async getListOfPurchaseOrdersCreate() {

    const PO_Number = await POHeader.findAll({
      attributes: ['PO_Number'],
      order: [['PO_Number', 'ASC']]
    });

    const primaryVendor = await Vendor.findAll({
      attributes: ['Primary_Vendor', 'V_Description'],
      order: [['V_Description', 'ASC']]
    });

    const jurisdictionState = await TaxRates.findAll({
      attributes: ['Jurisdiction_State', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    });

    const jurisdictionCounty = await TaxRates_County.findAll({
      attributes: ['Jurisdiction_County', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    });

    const jurisdictionCity = await TaxRates_City.findAll({
      attributes: ['Jurisdiction_City', 'TaxDescription'],
      order: [['TaxDescription', 'ASC']]
    });

    const QB_Transfer = await QBBills.findAll({
      attributes: ['QB_Transfer', 'QB_TransferDate'],
      order: [['QB_Transfer', 'ASC']]
    });

    const terms = await Terms.findAll({
      attributes: ['TermsCode', 'Terms', 'DaysUntilDue', 'TermsType'],
      order: [['Terms', 'ASC']],
    });

    const PO_Type = await POType.findAll({
      attributes: ['PO_Type', 'PO_TypeDescription'],
      order: [['PO_Type', 'ASC']]
    });

    const Delivery_Id = await DeliveryTypes.findAll({
      attributes: ['Delivery_ID', 'Delivery_Description'],
      order: [['Delivery_Description', 'ASC']]
    });

    return { PO_Number, primaryVendor, jurisdictionState, jurisdictionCounty, jurisdictionCity, QB_Transfer, terms, PO_Type, Delivery_Id };

  }


  async getListOfRoutesForDriver() {
    const routes = await Route.findAll({
      attributes: ['Route_Number'],
      order: [['Route_Number', 'ASC']]
    });
    return routes;
  }

  async getListForUpdatePriceClass() {
    const salesCategory = await SalesCategory.findAll({
      attributes: ['Sales_Category', 'Category_Desc'],
    });

    const msaCategory = await MSA_CategoryCodes.findAll({
      attributes: ['MSA_Category_Code', 'MSA_Description'],
      order: [['MSA_Category_Code', 'ASC']]
    })

    return { salesCategory, msaCategory };
  }

  async getListOfLossQuantityReport() {
    const [salesCategory, priceClass, manufacturerVendor, items, pickRightAreas, customers, salesRep, routes, taxRates, taxRateCity, taxRateCounty, location, section, OTP_Type, classOfTrade] = await Promise.all([

      SalesCategory.findAll({
        attributes: ['Sales_Category', 'Category_Desc'],
      }),

      PriceClass.findAll({
        attributes: ['Price_Class', 'Class_Desc', 'Sales_Category_Group'],
        order: [['Price_Class', 'ASC']]
      }),

      Vendor.findAll({
        attributes: ['Primary_Vendor', 'V_Description'],
        order: [['V_Description', 'ASC']]
      }),

      Inventory.findAll({
        attributes: ['I_Inactive', 'Description'],
        order: [['Description', 'ASC']]
      }),

      PickRightAreaDefinition.findAll({
        attributes: ['PickArea', 'PickArea_Description'],
        order: [['PickArea_Description', 'ASC']]
      }),

      Customer.findAll({
        attributes: ['C_Inactive', 'C_Name', 'C_Number'],
        order: [['C_Name', 'ASC']]
      }),

      SalesRep.findAll({
        attributes: ['S_Number', 'S_Desc'],
        order: [['S_Desc', 'ASC']]
      }),

      Route.findAll({
        attributes: ['Route_Number'],
        order: [['Route_Number', 'ASC']]
      }),

      TaxRates.findAll({
        attributes: ['Jurisdiction_State', 'TaxDescription'],
        order: [['TaxDescription', 'ASC']]
      }),

      TaxRates_City.findAll({
        attributes: ['Jurisdiction_City', 'TaxDescription'],
        order: [['TaxDescription', 'ASC']]
      }),

      TaxRates_County.findAll({
        attributes: ['Jurisdiction_County', 'TaxDescription'],
        order: [['TaxDescription', 'ASC']]
      }),

      Inventory.findAll({
        attributes: ['location'],
        where: { location: { [Op.ne]: null } },
        group: ['location'],
        order: [['location', 'ASC']],
      }),

      Inventory.findAll({
        attributes: ['section'],
        where: { section: { [Op.ne]: null } },
        group: ['section'],
        order: [['section', 'ASC']]
      }),

      OtherTaxes.findAll({
        attributes: ['OTP_Number', 'OTP_Description'],
        order: [['OTP_Number', 'ASC']]
      }),
      ClassOfTrade.findAll({
        attributes: ['Trade_Code', 'Trade_Desc'],
        order: [['Trade_Desc', 'ASC']]
      })
    ]);

    return { salesCategory, priceClass, manufacturerVendor, items, pickRightAreas, customers, salesRep, routes, taxRates, taxRateCity, taxRateCounty, location, section, OTP_Type, classOfTrade };

  }

  async getListOfSalesCategories() {
    const salesCategory = await SalesCategory.findAll({
      attributes: ['Sales_Category', 'Category_Desc', 'category_taxrate', 'Allow_Price_Change', 'Allow_Price_Change_Remote'],
      order: [['Category_Desc', 'ASC']]
    })
    return salesCategory;
  }

  async getlistOfARreports() {
    const typeSelect = await CustReceivables.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('AR_Type')), 'AR_Type'],
      ],
      raw: true,
    });

    const transactionSource = await CustReceivables.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('AR_POS')), 'AR_POS'],
      ],
      raw: true,
    });

    const depositeID = await ARDeposits.findAll({
      attributes: ['Deposit_ID', 'Deposit_Date', 'Deposit_Reference']
    })

    const users = await Users.findAll({
      attributes: ['UserNumber', 'UserName']
    })

    return { typeSelect, transactionSource, depositeID, users, }

  }

  async getlistOfARStatementreports() {
    const salesRep = await SalesRep.findAll({
      attributes: ['S_Number', 'S_Desc']
    })

    const customer = await Customer.findAll({
      attributes: ['C_Number', 'C_Name']
    })

    const route = await Route.findAll({
      attributes: ['Route_Number', 'Route_Description']
    })

    return { salesRep, customer, route }
  }

  async getVendorListForTradeShow() {
    const vendor = await Vendor.findAll({
      attributes: ['Primary_Vendor', 'V_Description', 'V_Email', 'V_Phone', 'V_Addr1', 'V_City', 'V_State', 'V_Zip', 'V_Fax', 'V_Status'],
      where: { V_Inactive: false },
      order: [['V_Description', 'ASC']]
    })
    return { data: vendor, total: vendor.length };
  }

  async getListOfCustomersByOrderNumbers() {
    const customers = await Customer.findAll({
      attributes: ['C_Number', 'C_Name'],
      // where: { C_Inactive: false }
    })
    return customers;
  }

  async getClassOfTradeList() {
    const classOfTrade = await ClassOfTrade.findAll({
      attributes: ['Trade_Code', 'Trade_Desc'],
      order: [['Trade_Desc', 'ASC']]
    })
    return classOfTrade;
  }

  async getListOfInventoryLogHistory() {
    return ["BaseCost",
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
      "Price19"]
  }

  async getListOfOrderReports(){
    const routes = await Route.findAll({
      attributes: ['Route_Number'],
      order: [['Route_Number', 'ASC']]
    });

    const salesRep = await SalesRep.findAll({
      attributes: ['S_Number', 'S_Desc'],
      order: [['S_Desc', 'ASC']]
    })

    const orderSource = await Order_Source.findAll({
      attributes: ['Order_Source','Source_Description'],
      order: [['Order_Source', 'ASC']]
    })

    const priceClass = await PriceClass.findAll({
      attributes: ['Price_Class', 'Class_Desc'],
      order: [['Class_Desc', 'ASC']]
    })

    const otherTaxes = await OtherTaxes.findAll({
      attributes: ['OTP_Number', 'OTP_Description'],
      order: [['OTP_Description', 'ASC']]
    })

    const vendor = await Vendor.findAll({
      attributes: ['Primary_Vendor', 'V_Description'],
      order: [['V_Description', 'ASC']]
    })

    return {
      routes,
      salesRep,
      orderSource,
      priceClass,
      otherTaxes,
      vendor
    }
  }


  async getDriverList(){
    const drivers = await Driver.findAll({
      attributes: ['id', 'firstName', 'lastName'],
      order: [['firstName', 'ASC']]
    })
    return drivers;
  }

  async getVehicleList(){
    const vehicles = await Vehicle.findAll({
      attributes: ['id', 'description','vinNumber'],
      order: [['description', 'ASC']]
    })
    return vehicles;
  }

}

