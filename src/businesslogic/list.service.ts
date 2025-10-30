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

export class ListService {

async getSalesCategoryList(){
    const salesCategory = await SalesCategory.findAll(
        {
            attributes:['Sales_Category','Category_Desc']
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

async  getProductList(query: PaginationOptions) {
    const { search, page = 1, limit = 50 } = query;
  
    const whereClause = search
      ? {
          I_Inactive:false,
          ShortOrderForm:true,
          [Op.or]: [
            { Item_Number: { [Op.like]: `%${search}%` } },
           
            { Description: { [Op.like]: `%${search}%` } },
            { ALT_Description2: { [Op.like]: `%${search}%` } },
          ],
        }
      : {
        I_Inactive:false,
        ShortOrderForm:true
      };
  
    const result = await Inventory.findAll({
      where: whereClause,
      order: [['Date_Created', 'DESC']], 
      limit: search ? undefined : limit, 
      offset: search ? undefined : (page - 1) * limit,
    });
  
    return result;
  }

  async getCustomerList(){
    const findCustomer = await Customer.findAll({
      where:{
        C_Inactive:false
      },
      attributes:['C_Number','C_Name','C_CoName','C_Address','C_City','C_State','C_Zip','C_Phone','C_Email']
    })
    return findCustomer;
  }

  async getUserList(){
    return await Users.findAll({
      attributes: ['UserNumber','UserID','UserName'],
   
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

async getRegisterCustomerList(){
  const registerCustomer = await Retailer.findAll({
    where:{
      isActive:true
    },
    attributes:['Customer_Number']
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
  return {route,stop};
}


async getProductListBySearch(search:string){
  if (!search) {
    return [];
  }

  const searchArray = search.split(',').map(s => s.trim());

  const productList = await Inventory.findAll({
    where: {
      I_Inactive:false,
        ShortOrderForm:true,
      [Op.or]: [
        { Item_Number: { [Op.like]: `%${search}%` } }, // exact match for Item_Number
        { Description: { [Op.like]: `%${search}%` } }, // partial match in Description
        { AltDesc: { [Op.like]: `%${search}%` } } // partial match in AltDesc
      ]
    },
    attributes:['Item_Number','Description','AltDesc']
  });

  return productList;
}

async getListOfRoutes(){
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
  return {routesWithStop,routesWithoutStop};
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


}