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
        ShortOrderForm: true
      };

    const result = await Inventory.findAll({
      where: whereClause,
      order: [['Date_Created', 'DESC']],
      limit: search ? undefined : limit,
      offset: search ? undefined : (page - 1) * limit,
    });

    return result;
  }

  async getCustomerList() {
    const findCustomer = await Customer.findAll({
      where: {
        C_Inactive: false
      },
      attributes: ['C_Number', 'C_Name', 'C_CoName', 'C_Address', 'C_City', 'C_State', 'C_Zip', 'C_Phone', 'C_Email']
    })
    return findCustomer;
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
          { Description: { [Op.like]: `%${search}%` } }, // partial match in Description
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
    const { routes, days } = data;

    const whereCondition: any = {
      C_Inactive: false,
    };

    // Apply day filter only if days array is not empty
    if (Array.isArray(days) && days.length > 0) {
      whereCondition.C_OrderDay = {
        [Op.in]: days,
      };
    }

    const includeOptions: any = {
      model: CustomerRoute,
      as: 'Routes',
    };

    // Apply route filter only if routes array is not empty
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
    });

    return customers;
  }


  async getListForInventory() {
    const salesCategory = await SalesCategory.findAll({
      attributes: ['Sales_Category', 'Category_Desc']
    })
    const priceClass = await PriceClass.findAll({
      attributes: ['Price_Class', 'Class_Desc']
    })

    const pickRightArea = await PickRightAreaDefinition.findAll({
      attributes: ['PickArea', 'PickArea_Description']
    })

    const priceSubclass = await PriceSubclass_Defs.findAll({
      attributes: ['Price_Subclass', 'Subclass_Def']
    })

    const cigPack = await CigPack.findAll({
      attributes: ['Cig_Pack', 'Cig_Pack_Select']
    })
    const projectIdentifier = await ProjectIdentifiers.findAll({
      attributes: ['Project_Identifier', 'Description']
    })
    const inventoryItemGroup = await Inventory_ItemGroups.findAll({
      attributes: ['Item_GroupID', 'Item_GroupDescription']
    })
    const inventoryBrand = await InventoryBrands.findAll({
      attributes: ['Brand_ID', 'Brand_Family']
    })
    const exclusionGroup = await ExclusionGroups.findAll({
      attributes: ['ExclusionGroup_ID', 'ExclusionGroup_Description']
    })
    const taxRateCity = await TaxRates_City.findAll({
      attributes: ['Jurisdiction_City', 'TaxDescription']
    })
    const taxRateCounty = await TaxRates_County.findAll({
      attributes: ['Jurisdiction_County', 'TaxDescription']
    })

    const taxRate = await TaxRates.findAll({
      attributes: ['Jurisdiction_State', 'TaxDescription']
    })

    const vendor = await Vendor.findAll({
      attributes: ['Primary_Vendor', 'V_Description']
    })
    const nacsCategory = await NACS_CategoryCodes.findAll({
      attributes: ['NACS_Category_Code', 'NACS_Description']
    })
    const otherTaxes = await OtherTaxes.findAll({
      attributes: ['OTP_Number', 'OTP_Description']
    })
    const msaCategory = await MSA_CategoryCodes.findAll({
      attributes: ['MSA_Category_Code', 'MSA_Description']
    })
    return { salesCategory, priceClass, pickRightArea, cigPack, projectIdentifier, inventoryItemGroup, inventoryBrand, exclusionGroup, taxRateCity, taxRateCounty, taxRate, vendor, priceSubclass, nacsCategory, otherTaxes, msaCategory }

  }



  async getListOfCustomersCreate() {
    const terms = await Terms.findAll({
      attributes: ['TermsCode', 'Terms']
    })
    const customerStatus = await CustomerStatus.findAll({
      attributes: ['C_StatusCode', 'C_Status', 'C_StatusDescription', 'C_ClassCategory']
    })
    const classOfTrade = await ClassOfTrade.findAll({
      attributes: ['Trade_Code', 'Trade_Desc']
    })
    const deliveryType = await DeliveryTypes.findAll({
      attributes: ['Delivery_ID', 'Delivery_Type', 'Delivery_Description', 'Delivery_Active']
    })

    const documentAdditionalFormat = await DocumentAdditionalFormats.findAll({
      attributes: ['Document_Type', 'Document_FormatID', 'Document_Description', 'Document_ReportFileName']
    })
    const ediFormatUser = await EDIFormatsUser.findAll({
      attributes: ['EDI_ID', 'EDI_Format', 'EDI_DescriptionUser', 'EDI_OptionsUser', 'EDI_AccountNumber']
    })

    const salesRep = await SalesRep.findAll({
      attributes: ['S_Number', 'S_Desc']
    })

    const salesCategory = await SalesCategory.findAll({
    })

    return { terms, customerStatus, classOfTrade, deliveryType, documentAdditionalFormat, ediFormatUser, salesRep ,salesCategory};
  }


    async getListOfVendorsCreate() {  
    const vendorGroup = await Vendor.findAll({
      attributes: ['Primary_Vendor', 'V_Description']
    });

    const jurisdictionState = await TaxRates.findAll({
      attributes: ['Jurisdiction_State', 'TaxDescription']
    });

    const buyerID = await Users.findAll({
      attributes: ['UserNumber', 'UserID']
    });

    const documentFormats = await DocumentAdditionalFormats.findAll({
      attributes: ['Document_Type', 'Document_FormatID','Document_Description', 'Document_ReportFileName'],
      order: [['Document_Type', 'ASC']],
    });

    const terms = await Terms.findAll({
      attributes: ['TermsCode', 'Terms', 'DaysUntilDue', 'TermsType'],
      order: [['Terms', 'ASC']],
    });

    return { vendorGroup , jurisdictionState  , buyerID ,  documentFormats ,terms };
  }



} 