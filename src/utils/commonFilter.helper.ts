// import { Op } from 'sequelize';

// export interface CommonReportFilters {
//   fromDate?: string;
//   toDate?: string;

//   salesCategory?: string[];
//   priceClass?: string[];
//   vendor?: number[];
//   item?: number[];
//   pickArea?: string[];

//   location?: string[];   // ✅ added
//   section?: string[];    // ✅ added

//   customer?: number[];
//   salesRep?: number[];
//   route?: string[];
//   otpType?: string[];
//   classOfTrade?: string[];
// }


// export const buildItemFilters = (filters: CommonReportFilters) => {
//   const inventoryWhere: any = {};
//   const orderHeaderWhere: any = {};
//   const customerWhere: any = {};

//   /** ITEM LEVEL FILTERS */
//   if (filters.salesCategory?.length) {
//     inventoryWhere.Sales_Category = { [Op.in]: filters.salesCategory };
//   }

//   if (filters.priceClass?.length) {
//     inventoryWhere.Price_Class = { [Op.in]: filters.priceClass };
//   }

//   if (filters.vendor?.length) {
//     inventoryWhere.Primary_Vendor = { [Op.in]: filters.vendor };
//   }

//   if (filters.item?.length) {
//     inventoryWhere.Item_Number = { [Op.in]: filters.item };
//   }

//   if (filters.pickArea?.length) {
//     inventoryWhere.PickArea = { [Op.in]: filters.pickArea };
//   }

//   // ✅ NEW: Location filter
//   if (filters.location?.length) {
//     inventoryWhere.Location = { [Op.in]: filters.location };
//   }

//   // ✅ NEW: Section filter
//   if (filters.section?.length) {
//     inventoryWhere.Section = { [Op.in]: filters.section };
//   }

//   /** CUSTOMER LEVEL FILTERS */
//   if (filters.customer?.length) {
//     customerWhere.C_Number = { [Op.in]: filters.customer };
//   }

//   /** ORDER HEADER FILTERS */
//   if (filters.salesRep?.length) {
//     orderHeaderWhere.Sales_Rep = { [Op.in]: filters.salesRep };
//   }

//   if (filters.route?.length) {
//     orderHeaderWhere.Route_Number = { [Op.in]: filters.route };
//   }

//   if (filters.otpType?.length) {
//     inventoryWhere.OTP_Number = { [Op.in]: filters.otpType };
//   }

//   if (filters.classOfTrade?.length) {
//     inventoryWhere.Trade_Code = { [Op.in]: filters.classOfTrade };
//   }
//   /** DATE FILTER */
//   if (filters.fromDate && filters.toDate) {
//     orderHeaderWhere.Order_Date = {
//       [Op.between]: [filters.fromDate, filters.toDate],
//     };
//   }

//   return {
//     inventoryWhere,
//     orderHeaderWhere,
//     customerWhere,
//   };
// };