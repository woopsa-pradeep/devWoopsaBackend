// import { Op, col, fn, literal, where, Sequelize, QueryTypes } from "sequelize";
// import {
//   AddToCartItem,
//   AddToCartRequest,
//   ArrivedOrder,
//   DriverRouteAssignmentRequest,
//   EditAddRouteStopAddress,
//   IDriverCurrentLocation,
//   IGetOrderDROWithID,
//   IHomeScreenDROProductRequest,
//   InventoryEntityInSales,
//   IPendingOrderFilterRequest,
//   IRouteAssignmentRequest,
//   OrderStatusPickedUp,
//   OrderSummary,
//   ProductPramotionRequest,
//   SaveDriverLocationUpdateRequest,
//   SetOutLocationUpdate,
//   TimeTrackForRoute,
//   UpdatedDiscountedPrice,
//   UpdateRouteStopsRequest,
// } from "../interfaces/request.body.interface";
// import { OrderHeader } from "../models/orderHeader.model";
// import { SaasDroOrderStatus } from "../models/saas.droOrderStatus.model";
// import { SaasUser } from "../models/saas.user.model";
// import { SaasDroOrder } from "../models/saas.droOrder.model";
// import { OrderDetail } from "../models/order.model";
// import { config } from "../configuration/config";
// import { DeliveryType } from "../models/deliveryType.model";
// import { InventoryUpc } from "../models/inventoryUpc.model";
// import { SaasProductImage } from "../models/saas.productImages.model";
// import { Route } from "../models/routes.model";
// import { Inventory } from "../models/inventory.model";
// import { Customer } from "../models/customer.mode";
// import { SaasSetting } from "../models/saas.setting.model";
// import { InventoryStatus } from "../models/inverntoryStatus.model";
// import { SaasProductSetting } from "../models/saas.productSetting.model";
// import { SaasSearchHistory } from "../models/saas.searchHistory.model";
// import { AppError } from "../utils/AppError";
// import { General, Manager, SalesMessage } from "../constants";
// import { CustAuthorized } from "../models/customerAuthorized.model";
// import { InventorySpecial } from "../models/inverntorySpecial.model";
// import { CustPricing } from "../models/custPricing.model";
// import { InventorySubclass } from "../models/inventorySubClass.model";
// import { CustomerSpecialGroup } from "../models/customerSpecialGroup.model";
// import { InventoryQtyDiscount } from "../models/inventoryQtyDiscount.model";
// import { InventoryDepositState } from "../models/invertoryDepositState.model";
// import { OptionsOther } from "../models/otherOption.model";
// import { TaxRatesCounty } from "../models/taxRateCountry.model";
// import { TaxRatesOtp } from "../models/taxRatesOtp.model";
// import { TaxRatesCity } from "../models/taxRateCity.model";
// import { calcPercentageTax, convertMillisecondsToTimestamp, formatTimeSpan, getCoordinatesAsync, getWeekdayValue, round } from "../utils/helper";
// import { SaasDroNotification } from "../models/saas.droNotification.model";
// import { sequelize } from "../db";
// import { SaasDroCart } from "../models/saas.droCart.model";
// import { InventoryLogHistory } from "../models/inventoryLogHistory.model";
// import { CustReceivable } from "../models/customerReceivable.model";
// import { SaasDroHomeScreen } from "../models/saas.droHomeScreen.model";
// import { SaasDroDigitalFlyer } from "../models/saasDroDigitalFlyer.model";
// import { SaasSlotDay } from "../models/sass.slotDay.model";
// import { SaasSlotDetail } from "../models/saas.slotDetail.model";
// import { SaasDriverAssignRoute } from "../models/saas.driverAssignRoute.model";
// import { SaasRoute } from "../models/saas.route.model";
// import { SaasRouteStop } from "../models/saas.routeStop.model";
// import { CustomerRoute } from "../models/customerRoutes.model";
// import { SaasDriverLocation } from "../models/saas.driverLocation.model";
// import { SaasDriverCurrentLocation } from "../models/saas.driverCurrentLocation.model";
// import moment from 'moment';
// import { PosMediaSelection } from "../models/posMediaSelection.model";
// import { PaginationOptions } from "../interfaces/pagination.interface";
// import { SaasUserRole } from "../models/saas.userRoles";

// export class OrderService {

//   async pendingOrderTabList(orderHistorySearch: IPendingOrderFilterRequest) {
//     const lastXDays = orderHistorySearch.lastXDays ?? 14;
//     const skipCount =
//       (orderHistorySearch.page - 1) * orderHistorySearch.perPage;
//     const limit = orderHistorySearch.perPage;
//     const dateLimit = new Date();
//     dateLimit.setDate(dateLimit.getDate() - lastXDays);

//     const { searchOrderNo, orderCustomerNumber } = orderHistorySearch;

//     // Base filters
//     const whereClause = {
//       CNumber: orderCustomerNumber,
//       OrderDate: { [Op.gt]: dateLimit },
//     };

//     const orderHeaderData = await OrderHeader.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: SaasDroOrderStatus,
//           required: false,
//           where: {
//             [Op.or]: [
//               {
//                 DeliveryType: { [Op.ne]: "Pickup" },
//                 [Op.or]: [{ TrackingNumber: "" }, { TrackingNumber: null }],
//               },
//               {
//                 DeliveryType: "Pickup",
//                 "$OrderHeader.InvoiceNumber$": { [Op.lte]: 0 },
//               },
//             ],
//             ...(searchOrderNo ? { OrderNumber: searchOrderNo } : {}),
//           },
//           include: [
//             {
//               model: SaasUser,
//               required: false,
//               attributes: ["FirstName", "LastName"],
//             },
//           ],
//         },
//       ],
//       order: [["OrderDate", "DESC"]],
//       offset: skipCount,
//       limit: limit,
//     });

//     const formatted = await Promise.all(
//       orderHeaderData.rows.map(async (b: any) => {
//         const s = b.SaasDroOrderStatus;
//         const user = s?.SaasUser;
//         const droOrders = await SaasDroOrder.findAll({
//           where: { OrderNumber: b.OrderNumber },
//         });
//         const orderDetails: any = await OrderDetail.findAll({
//           where: { Order_Number: b.OrderNumber },
//         });

//         const ProductPrice1 = droOrders.reduce(
//           (sum, o) => sum + (o.ProductPrice1 || 0),
//           0
//         );
//         const ProductDiscount = droOrders.reduce(
//           (sum, o) => sum + (o.ProductDiscount || 0),
//           0
//         );
//         const PriceTotal = s?.ShowWithTaxesInCart
//           ? droOrders.reduce((sum, o) => sum + (o.PriceTotal || 0), 0)
//           : ProductPrice1;
//         const PriceTotalExt = s?.OrderNumber
//           ? s?.ShowWithTaxesInCart
//             ? droOrders.reduce((sum, o) => sum + (o.PriceTotalExt || 0), 0)
//             : droOrders.reduce(
//                 (sum, o) =>
//                   sum + (o.ProductPrice1 || 0) * (o.ProductQuantity || 0),
//                 0
//               )
//           : orderDetails.reduce(
//               (sum: any, a: any) =>
//                 sum +
//                 (a.Price +
//                   a.OtpAmountState +
//                   a.OtpAmountCounty +
//                   a.OtpAmountCity +
//                   a.PrepaidTaxAmount) *
//                   (a.QuantityOrdered || 0),
//               0
//             );

//         const ItemCount = s?.ItemCount ?? orderDetails.length;
//         const DepositAmount = orderDetails.reduce(
//           (sum: any, o: any) =>
//             sum + (o.DepositAmount || 0) * (o.QuantityOrdered || 0),
//           0
//         );

//         return {
//           ProductPrice1,
//           PriceTotal,
//           PriceTotalExt,
//           ProductDiscount,
//           ItemCount,
//           PermanentOrderNumber: s?.OrderNumber,
//           OrderNumber: b.OrderNumber,
//           OrderReceived: 1,
//           OrderReceivedDate: s?.OrderReceivedDate ?? b.OrderDate,
//           OrderFullfield: b.PicklistPrinted ? 1 : 0,
//           OrderFullfieldDate: b.PicklistTime,
//           InvoicePrint: b.InvoiceNumber ? 1 : 0,
//           InvoicePrintDate: b.InvoiceDate,
//           OutofDelivery: b.TrackingNumber ? 1 : 0,
//           OutofDeliveryDate: b.DeliveryDate,
//           SalesId: s?.SalesId,
//           SalesName: user
//             ? `${user.FirstName ?? ""} ${user.LastName ?? ""}`.trim()
//             : " ",
//           EstimatedTotalTaxes: s?.EstimatedTotalTaxes,
//           EstimateDeliveryCost: s?.OrderNumber
//             ? s?.EstimateDeliveryCost
//             : b.DeliveryCharge,
//           DeliveryType: s?.DeliveryType,
//           PickupDate: s?.PickupDate,
//           ShowWithTaxesInCart: s?.ShowWithTaxesInCart,
//           DepositAmount,
//         };
//       })
//     );

//     const filtered = formatted.filter((f) => f.ItemCount > 0);

//     return {
//       orderHistories: filtered,
//       TotalRecords: orderHeaderData.count,
//     };
//   }

//   async lastOrderTabList(orderHistorySearch: IPendingOrderFilterRequest) {
//     const lastXDays = orderHistorySearch.lastXDays ?? 14;
//     const skipCount =
//       (orderHistorySearch.page - 1) * orderHistorySearch.perPage;
//     const limit = orderHistorySearch.perPage;
//     const dateLimit = new Date();
//     dateLimit.setDate(dateLimit.getDate() - lastXDays);

//     const { searchOrderNo, orderCustomerNumber } = orderHistorySearch;

//     // Base WHERE clause
//     const whereClause = {
//       CNumber: orderCustomerNumber,
//       OrderDate: { [Op.gt]: dateLimit },
//       [Op.or]: [
//         {
//           TrackingNumber: { [Op.ne]: null },
//         },
//         {
//           InvoiceNumber: { [Op.gt]: 0 },
//           "$SaasDroOrderStatus.DeliveryType$": "Pickup",
//         },
//       ],
//       ...(searchOrderNo ? { OrderNumber: searchOrderNo } : {}),
//     };

//     const orders = await OrderHeader.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: SaasDroOrderStatus,
//           required: false,
//           include: [
//             {
//               model: SaasUser,
//               required: false,
//               attributes: ["FirstName", "LastName"],
//             },
//           ],
//         },
//       ],
//       order: [["OrderDate", "DESC"]],
//       offset: skipCount,
//       limit: limit,
//     });

//     const formatted = await Promise.all(
//       orders.rows.map(async (b: any) => {
//         const s = b.SaasDroOrderStatus;
//         const user = s?.SaasUser;
//         const droOrders = await SaasDroOrder.findAll({
//           where: { OrderNumber: b.OrderNumber },
//         });
//         const orderDetails: any = await OrderDetail.findAll({
//           where: { Order_Number: b.OrderNumber },
//         });

//         const ProductPrice1 = droOrders.reduce(
//           (sum, o) => sum + (o.ProductPrice1 || 0),
//           0
//         );
//         const ProductDiscount = droOrders.reduce(
//           (sum, o) => sum + (o.ProductDiscount || 0),
//           0
//         );
//         const PriceTotal = s?.ShowWithTaxesInCart
//           ? droOrders.reduce((sum, o) => sum + (o.PriceTotal || 0), 0)
//           : ProductPrice1;
//         const PriceTotalExt = s?.OrderNumber
//           ? s?.ShowWithTaxesInCart
//             ? droOrders.reduce((sum, o) => sum + (o.PriceTotalExt || 0), 0)
//             : droOrders.reduce(
//                 (sum, o) =>
//                   sum + (o.ProductPrice1 || 0) * (o.ProductQuantity || 0),
//                 0
//               )
//           : orderDetails.reduce(
//               (sum: any, a: any) =>
//                 sum +
//                 (a.Price +
//                   a.OtpAmountState +
//                   a.OtpAmountCounty +
//                   a.OtpAmountCity +
//                   a.PrepaidTaxAmount) *
//                   (a.QuantityOrdered || 0),
//               0
//             );

//         const ItemCount = s?.ItemCount ?? orderDetails.length;
//         const DepositAmount = orderDetails.reduce(
//           (sum: any, o: any) =>
//             sum + (o.DepositAmount || 0) * (o.QuantityOrdered || 0),
//           0
//         );

//         return {
//           ProductPrice1,
//           PriceTotal,
//           PriceTotalExt,
//           ProductDiscount,
//           ItemCount,
//           PermanentOrderNumber: s?.OrderNumber,
//           OrderNumber: b.OrderNumber,
//           OrderReceived: 1,
//           OrderReceivedDate: s?.OrderReceivedDate ?? b.OrderDate,
//           OrderFullfield: b.PicklistPrinted ? 1 : 0,
//           OrderFullfieldDate: b.PicklistTime,
//           InvoicePrint: b.InvoiceNumber ? 1 : 0,
//           InvoicePrintDate: b.InvoiceDate,
//           OutofDelivery: b.TrackingNumber ? 1 : 0,
//           OutofDeliveryDate: b.DeliveryDate,
//           SalesId: s?.SalesId,
//           SalesName: user
//             ? `${user.FirstName ?? ""} ${user.LastName ?? ""}`.trim()
//             : " ",
//           EstimatedTotalTaxes: s?.EstimatedTotalTaxes,
//           EstimateDeliveryCost: s?.OrderNumber
//             ? s?.EstimateDeliveryCost
//             : b.DeliveryCharge,
//           DeliveryType: s?.DeliveryType,
//           PickupDate: s?.PickupDate,
//           ShowWithTaxesInCart: s?.ShowWithTaxesInCart,
//           DepositAmount,
//         };
//       })
//     );

//     const filtered = formatted.filter((f) => f.ItemCount > 0);

//     return {
//       orderHistories: filtered,
//       TotalRecords: orders.count,
//     };
//   }

//   async getDroOrderStatusById(customerNumber: number, orderNumber: number) {
//     const hostURL = config.hostURL;
//     const productFolder = config.productFolder;
//     const statusEntity: any = await SaasDroOrder.findOne({
//       where: {
//         CustomerCid: customerNumber,
//         OrderNumber: orderNumber,
//       },
//       include: [
//         {
//           model: SaasDroOrderStatus,
//           required: true,
//           where: { OrderNumber: orderNumber },
//           as: "Status",
//         },
//         {
//           model: OrderHeader,
//           required: false,
//           include: [
//             { model: Route, required: false, as: "Route" },
//             { model: DeliveryType, required: false, as: "DeliveryType" },
//           ],
//           as: "OrderHeader",
//         },
//         {
//           model: InventoryUpc,
//           required: false,
//           include: [
//             {
//               model: SaasProductImage,
//               required: false,
//               as: "SaasProductImage",
//             },
//           ],
//           as: "InventoryUpc",
//         },
//       ],
//     });

//     const status = statusEntity?.Status;
//     const orderHeader = statusEntity?.OrderHeader;
//     const inv = statusEntity?.InventoryUpc;
//     const pimg = inv?.SaasProductImage;

//     const orderStatus =
//       statusEntity && status
//         ? {
//             OrderNumber: status.OrderNumber,
//             OrderReceived: status.OrderReceived,
//             OrderReceivedDate: status.OrderReceivedDate,
//             OrderFullfield: orderHeader?.PicklistPrinted ? 1 : 0,
//             OrderFullfieldDate: orderHeader?.PicklistTime,
//             InvoicePrint: orderHeader?.InvoiceNumber ? 1 : 0,
//             InvoicePrintDate: orderHeader?.InvoiceDate,
//             OutofDelivery: orderHeader?.TrackingNumber ? 1 : 0,
//             OutofDeliveryDate: orderHeader?.DeliveryDate,
//             OrderDelivered: 0,
//             OrderDeliveredDate: status.OrderDeliveredDate,
//             ItemCount: await SaasDroOrder.count({
//               where: { CustomerCid: customerNumber, OrderNumber: orderNumber },
//             }),
//             ProductImageUrl: pimg
//               ? `${hostURL}/${productFolder}/${pimg.ImageName}`
//               : null,
//             TransportMode:
//               orderHeader?.DeliveryType?.DeliveryDescription ?? "N/A",
//             Route: orderHeader?.Route?.RouteDescription ?? "N/A",
//             TrackingNumber: orderHeader?.TrackingNumber ?? "N/A",
//             DeliveryType: status.DeliveryType,
//             PickupDate: status.PickupDate,
//             PickupTimeFrom: status.PickupTimeFrom,
//             PickupTimeTo: status.PickupTimeTo,
//             EstimatedTotalTaxes: status.EstimatedTotalTaxes,
//             EstimateDeliveryCost: status.EstimateDeliveryCost,
//             ShowWithTaxesInCart: status.ShowWithTaxesInCart,
//           }
//         : null;

//     const productDetail = await SaasDroOrder.findAll({
//       where: {
//         CustomerCid: customerNumber,
//         OrderNumber: orderNumber,
//       },
//       include: [
//         {
//           model: SaasDroOrderStatus,
//           required: true,
//           where: { OrderNumber: orderNumber },
//         },
//         {
//           model: SaasProductImage,
//           required: false,
//           as: "ProductImage",
//           on: {
//             UpcNumber: Sequelize.where(
//               Sequelize.col("SaasDroOrder.UpcNumber"),
//               "=",
//               Sequelize.col("ProductImage.UpcNumber")
//             ),
//           },
//         },
//       ],
//     });

//     const productDetails = productDetail.map((t: any) => {
//       const status = t.SaasDroOrderStatus;
//       const img = t.ProductImage;

//       return {
//         ProductId: t.ProductId,
//         ProductDescription: t.ProductDescription,
//         ProductPrice1: t.ProductPrice1,
//         ProductDiscount: t.ProductDiscount,
//         ProductQuantity: t.ProductQuantity,
//         PermanentOrderNumber: t.PermanentOrderNumber,
//         PriceTaxCity: t.PriceTaxCity,
//         PriceTaxCountry: t.PriceTaxCountry,
//         PriceTaxState: t.PriceTaxState,
//         PriceTotal:
//           status?.ShowWithTaxesInCart == null
//             ? t.ProductPrice1 + t.ProductDiscount
//             : t.PriceTotal,
//         PriceTotalExt:
//           status?.ShowWithTaxesInCart == null
//             ? t.ProductPrice1 * t.ProductQuantity
//             : t.PriceTotalExt,
//         ProductImageUrl: img
//           ? `${hostURL}/${productFolder}/${img.ImageName}`
//           : null,
//         UpcNumber: t.UpcNumber,
//         PerUnitePrice: t.PerUnitePrice,
//         DepositAmount: t.DepositAmount,
//       };
//     });

//     if (orderStatus || productDetails.length > 0) {
//       const response = {
//         OrderStatus: orderStatus,
//         ProductDetails: productDetails,
//       };
//       return response;
//     }
//     let res = {
//       OrderStatus: null,
//       ProductDetails: [],
//       msg: `The order status was not found for CID: ${customerNumber}`,
//     };

//     return res;
//   }

//   async getErpdroOrderStatusById(customerNumber: number, orderNumber: number) {
//     const hostURL = config.hostURL;
//     const productFolder = config.productFolder;

//     const productDetails = await OrderDetail.findAll({
//       include: [
//         {
//           model: OrderHeader,
//           required: true,
//           where: {
//             CNumber: customerNumber,
//             OrderNumber: orderNumber,
//           },
//         },
//         {
//           model: Inventory,
//           required: false,
//           include: [
//             {
//               model: InventoryUpc,
//               required: false,
//               where: {
//                 Priority: 1,
//                 Status: 1,
//               },
//               include: [
//                 {
//                   model: SaasProductImage,
//                   required: false,
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//       where: {
//         Order_Number: orderNumber,
//       },
//     });

//     const mappedProducts = productDetails.map((detail: any) => {
//       const inventory = detail.Inventory;
//       const invUpc = inventory?.InventoryUpc;
//       const img = invUpc?.SaasProductImage;

//       const priceWithTax =
//         detail.Price +
//           detail.OtpAmountState +
//           detail.OtpAmountCounty +
//           detail.OtpAmountCity +
//           detail.PrepaidTaxAmount || 0;

//       return {
//         ProductId: detail.ItemNumber,
//         ProductDescription: inventory?.Description ?? null,
//         ProductPrice1: priceWithTax,
//         ProductDiscount: 0.0,
//         ProductQuantity: detail.QuantityOrdered,
//         PermanentOrderNumber: detail.OrderNumber,
//         PriceTaxCity: detail.OtpAmountCity,
//         PriceTaxCountry: detail.OtpAmountCounty,
//         PriceTaxState: detail.OtpAmountState,
//         PriceTotalExt: priceWithTax * (detail.QuantityOrdered ?? 0),
//         ProductImageUrl: img
//           ? `${hostURL}/${productFolder}/${img.ImageName}`
//           : null,
//         UpcNumber: img?.UpcNumber ?? null,
//         DepositAmount: detail.DepositAmount,
//       };
//     });

//     if (mappedProducts.length > 0) {
//       const deliveryCharge: any = await OrderHeader.findOne({
//         where: { OrderNumber: orderNumber },
//         attributes: ["DeliveryCharge"],
//       });

//       const response = {
//         ProductDetails: mappedProducts,
//         EstimatedDelieveryCost: deliveryCharge?.DeliveryCharge ?? 0,
//       };

//       return response;
//     }

//     let response = {
//       ProductDetails: [],
//       EstimatedDelieveryCost: 0,
//       message: `The order status was not found for CID.: ${customerNumber}`,
//     };
//   }

//   async homeScreenDroProductById(request: IHomeScreenDROProductRequest) {
//     const hostURL = config.hostURL;
//     const useMasterImage = config.hostURL;
//     const productFolder = config.productFolder;
//     const today = new Date();

//     const startIndex =
//       request.page > 1 ? (request.page - 1) * request.perPage : 0;

//     const inventorySpecials = await InventorySpecial.findAll({
//       where: {
//         [Op.and]: [
//           {
//             [Op.or]: [{ Price: { [Op.ne]: 0 } }, { Allowance: { [Op.ne]: 0 } }],
//           },
//           {
//             [Op.or]: [
//               {
//                 Start_Date: { [Op.lte]: today },
//                 End_Date: { [Op.gte]: today },
//               },
//               { Perpetual: true },
//             ],
//           },
//         ],
//       },
//     });

//     const customer = await Customer.findOne({
//       where: { CNumber: request.customerNumber },
//     });
//     if (!customer) throw new AppError("Customer not found", 400);

//     const whereInventory = {
//       IInactive: false,
//       ShortOrderForm: true,
//       IDiscontinued: { [Op.not]: true },
//     };

//     const includeUpc: any = {
//       model: InventoryUpc,
//       required: true,
//       include: [{ model: SaasProductImage, required: false }],
//       where: request.upcNumber
//         ? { UPC_Number: request.upcNumber }
//         : { Status: 0, Priority: 1 },
//     };

//     const { count, rows: inventories } = await Inventory.findAndCountAll({
//       where: whereInventory,
//       include: [includeUpc],
//       offset: startIndex,
//       limit: request.perPage,
//       order: [["Description", "ASC"]],
//     });

//     let filteredProducts = inventories.filter((i) => {
//       for (let j = 1; j <= 12; j++) {
//         const key = `CategoryAllow${j
//           .toString()
//           .padStart(2, "0")}` as keyof Customer;
//         if (customer[key] === false && i.SalesCategory === j) return false;
//       }
//       return true;
//     });

//     const blockedItems = await CustAuthorized.findAll({
//       where: { CNumber: request.customerNumber, ItemOption: 99 },
//       attributes: ["ItemNumber"],
//     });
//     const blockedItemNumbers = blockedItems.map((b) => b.ItemNumber);
//     filteredProducts = filteredProducts.filter(
//       (p) => !blockedItemNumbers.includes(p.ItemNumber)
//     );

//     if (request.searchKeyword) {
//       await SaasSearchHistory.create({
//         CurrentDate: new Date(),
//         SearchKeyword: request.searchKeyword,
//         CustomerCid: request.customerNumber,
//         Timestamp: new Date(),
//         SearchType: "P",
//       });
//       const keyword = request.searchKeyword.trim().replace(/\*/g, "");
//       filteredProducts = filteredProducts.filter((p) =>
//         request.searchKeyword.endsWith("*")
//           ? p.Description?.includes(keyword)
//           : p.Description?.replace(/\s/g, "").startsWith(
//               keyword.replace(/\s/g, "")
//             )
//       );
//     }

//     if (request.itemNumber) {
//       await SaasSearchHistory.create({
//         CurrentDate: new Date(),
//         SearchItemKeyword: request.itemNumber.toString(),
//         CustomerCid: request.customerNumber,
//         Timestamp: new Date(),
//         SearchType: "P",
//       });
//       filteredProducts = filteredProducts.filter(
//         (p) => p.ItemNumber === request.itemNumber
//       );
//     }

//     if (request.salesCategory && request.salesCategory !== 0) {
//       filteredProducts = filteredProducts.filter(
//         (p) => p.SalesCategory === request.salesCategory
//       );
//     }

//     if (request.isNewProduct) {
//       const setting = await SaasSetting.findOne({
//         where: { key: "NoOfDaysAsNewProduct" },
//       });
//       if (setting?.value && setting.value !== "0") {
//         const compareDate = new Date();
//         compareDate.setDate(compareDate.getDate() - parseInt(setting.value));
//         filteredProducts = filteredProducts.filter(
//           (p) => new Date(p.DateCreated) >= compareDate
//         );
//       }
//     }

//     const mapped = await Promise.all(
//       filteredProducts.map(async (p: any) => {
//         const inventoryStatus = await InventoryStatus.findAll({
//           where: { Item_Number: p.ItemNumber },
//         });
//         const availableQty = inventoryStatus.reduce(
//           (sum, s) => sum + (s.Inventory_OnHand || 0),
//           0
//         );

//         const orderedQty: any = await OrderDetail.findAll({
//           include: [
//             {
//               model: OrderHeader,
//               required: true,
//               where: { OrderType: 0, OrderUpdated: false },
//             },
//           ],
//           where: { Item_Number: p.ItemNumber, UnitCode: false },
//         });
//         const blockedQty = orderedQty.reduce(
//           (sum: any, o: any) => sum + (o.QuantityOrdered || 0),
//           0
//         );

//         const setting = await SaasProductSetting.findOne({
//           where: { ItemNumber: p.ItemNumber },
//         });

//         let ProductPrice1 = await this.SetEffectivePrice(
//           request.customerNumber,
//           p.ItemNumber,
//           customer
//         );
//         const discountData = await this.CalculateDiscount(
//           request.customerNumber,
//           p.ItemNumber,
//           1,
//           ProductPrice1,
//           inventorySpecials
//         );
//         ProductPrice1 = discountData.UpdatedProductPrice1;

//         return {
//           Retail: p.Retail1 ? `$${p.Retail1}` : "0",
//           PerUnitePrice: ProductPrice1,
//           ItemNumber: p.ItemNumber,
//           ProductDescription: p.Description || "--",
//           ProductPack: p.Pack,
//           ProductPrice1,
//           ProductPrice2: p.Price2,
//           ProductDiscount: discountData.UpdatedDiscount,
//           DepositAmount: discountData.DepositAmount,
//           MaxQtySalesAllowed: setting?.MaxQtySalesAllowed || 0,
//           ProductImageUrl:
//             p.UseMasterImage ?? false
//               ? useMasterImage + p.InventoryUpc.UpcNumber + ".jpg"
//               : hostURL +
//                 "/" +
//                 productFolder +
//                 "/" +
//                 (p.InventoryUpc?.SaasProductImage?.ImageName ||
//                   p.InventoryUpc.UpcNumber + ".jpg"),
//           SalesCategory: p.SalesCategory,
//           UPCNumber: p.InventoryUpc.UpcNumber,
//           ProductPriceWithTax: 0,
//           Tx: 0,
//           Uom: p.Uom,
//           CaseCount: p.CaseCount,
//           UnitOunces: p.UnitOunces,
//           AvailableQty: availableQty - blockedQty,
//           ProductAdded: p.DateCreated,
//         };
//       })
//     );

//     const promoWithTax = await this.CalculateTax(customer, mapped);

//     return {
//       TotalRecords: count,
//       Promo: promoWithTax,
//     };
//   }

//   async getOrderDroWithId(request: IGetOrderDROWithID, salesId: number) {
//     request.lastXDays = request.lastXDays ? request.lastXDays + 1 : 15;
//     const weekno = (request.lastXDays + 1) / 7;
//     const StartRecordIndex =
//       request.page > 1 ? (request.page - 1) * request.perPage : 0;

//     const CustomerDetails = await Customer.findOne({
//       where: { C_Number: request.customerNumber },
//     });
//     if (!CustomerDetails) throw new AppError("Customer not found", 400);

//     const inventorySpecials = await InventorySpecial.findAll({
//       where: {
//         [Op.and]: [
//           {
//             [Op.or]: [{ Price: { [Op.ne]: 0 } }, { Allowance: { [Op.ne]: 0 } }],
//           },
//           {
//             [Op.or]: [
//               {
//                 Start_Date: { [Op.lte]: new Date() },
//                 End_Date: { [Op.gte]: new Date() },
//               },
//               { Perpetual: true },
//             ],
//           },
//         ],
//       },
//     });

//     let whereConditions: any = {
//       "$OrderHeader.CNumber$": request.customerNumber,
//       "$Inventory.IDiscontinued$": false,
//       "$Inventory.IInactive$": false,
//       "$OrderHeader.OrderDate$": {
//         [Op.gt]: new Date(Date.now() - request.lastXDays * 86400000),
//       },
//     };

//     if (request.upcNumber) {
//       whereConditions["$InventoryUpc.UpcNumber$"] = request.upcNumber;
//     }

//     if (request.salesCategory && request.salesCategory !== 0) {
//       whereConditions["$Inventory.SalesCategory$"] = request.salesCategory;
//     }

//     if (request.searchKeyword) {
//       await SaasSearchHistory.create({
//         CurrentDate: new Date(),
//         SearchKeyword: request.searchKeyword,
//         CustomerCid: request.customerNumber,
//         Timestamp: new Date(),
//         SearchType: "O",
//       });
//       const keyword = request.searchKeyword.replace(/\*/g, "").trim();
//       whereConditions["$Inventory.Description$"] = {
//         [Op.like]: `%${keyword}%`,
//       };
//     }

//     if (request.itemNumber) {
//       await SaasSearchHistory.create({
//         CurrentDate: new Date(),
//         SearchItemKeyword: request.itemNumber.toString(),
//         CustomerCid: request.customerNumber,
//         Timestamp: new Date(),
//         SearchType: "O",
//       });
//       whereConditions["$Inventory.ItemNumber$"] = request.itemNumber;
//     }

//     const { count, rows } = await OrderDetail.findAndCountAll({
//       where: whereConditions,
//       include: [
//         { model: OrderHeader },
//         { model: Inventory, include: [SaasProductSetting] },
//         { model: InventoryUpc, where: { Priority: 1 }, required: false },
//         { model: SaasDroOrderStatus, required: false },
//         { model: SaasProductImage, required: false },
//       ],
//       group: ["Inventory.ItemNumber"],
//       offset: StartRecordIndex,
//       limit: request.perPage,
//       order: [[Sequelize.col("Inventory.Description"), "ASC"]],
//     });

//     let Orders = await Promise.all(
//       rows.map(async (item: any) => {
//         const productPrice = await this.SetEffectivePrice(
//           request.customerNumber,
//           item.Inventory.ItemNumber,
//           CustomerDetails
//         );
//         const discountData = await this.CalculateDiscount(
//           request.customerNumber,
//           item.Inventory.ItemNumber,
//           1,
//           productPrice,
//           inventorySpecials
//         );
//         const imageName =
//           item.SaasProductImage?.ImageName ||
//           item.InventoryUPC?.UpcNumber + ".jpg";
//         const hostURL = process.env.HOST_URL;
//         const usemasterimage = process.env.MASTER_IMAGE_URL;
//         const productFolder = process.env.PRODUCT_IMAGE_FOLDER;

//         return {
//           ItemNumber: item.Inventory.ItemNumber,
//           ProductDescription: item.Inventory.Description,
//           ProductPack: item.Inventory.Pack,
//           ProductPrice1: discountData.UpdatedProductPrice1,
//           ProductDiscount: discountData.UpdatedDiscount,
//           DepositAmount: discountData.DepositAmount,
//           ProductImageUrl:
//             item.Inventory.UseMasterImage ?? false
//               ? `${usemasterimage}${item.InventoryUPC?.UpcNumber}.jpg`
//               : `${hostURL}/${productFolder}/${imageName}`,
//           UPCNumber: item.InventoryUPC?.UpcNumber,
//           OrderItemQty: item.QuantityOrdered,
//           AvailableQty: 0, // You can add logic for availability calculation here
//           MaxQtySalesAllowed:
//             item.Inventory.SaasProductSetting?.MaxQtySalesAllowed || 0,
//           SalesCategory: item.Inventory.SalesCategory,
//           ProductOrderAvg: 0, // Include logic to compute order avg if needed
//           Retail: "$" + item.Inventory.Retail1,
//         };
//       })
//     );

//     Orders = await this.CalculateTax(CustomerDetails, Orders);
//     const LastOrderNumber = await SaasDroOrder.findOne({
//       where: { CustomerCid: request.customerNumber },
//       order: [["OrderReceivedDate", "DESC"]],
//       attributes: ["OrderNumber"],
//     });

//     return {
//       Orders,
//       TotalRecords: count.length,
//       LastOrderNumber: LastOrderNumber?.OrderNumber || null,
//     };
//   }

//   async getClassicOrderingDROwithID(customerNumber: number) {
//     // Step 1: Get Customer Info
//     const customerDetails = await SaasDroOrder.findOne({
//       where: { CustomerCid: customerNumber },
//       attributes: ["CustomerCid", "CustomerName", "CartItemCount"],
//     });

//     if (!customerDetails) {
//       throw new AppError(
//         "Customer details could not be found using the provided customer CID ${customerNumber}",
//         400
//       );
//     }

//     // Step 2: Get Last Order
//     const lastOrderDetails = await SaasDroOrder.findAll({
//       where: {
//         CustomerCid: customerNumber,
//         LastOrder: 1,
//       },
//       attributes: [
//         "ProductId",
//         "ProductDescription",
//         "ProductPrice1",
//         "ProductPrice2",
//         "ProductDiscount",
//         "ProductSize",
//         "ProductPack",
//         "ProductImageUrl",
//         "ProductQuantity",
//         "ProductAverageQuantity",
//       ],
//     });

//     if (!lastOrderDetails.length) {
//       throw new AppError(
//         `Order details could not be found using the provided CID ${customerNumber}`,
//         400
//       );
//     }

//     // Step 3: Get Last 6 Orders
//     const lastSixOrderDetails = await SaasDroOrder.findAll({
//       where: {
//         CustomerCid: customerNumber,
//         LastOrder: 6,
//       },
//       attributes: [
//         "ProductId",
//         "ProductDescription",
//         "ProductPrice1",
//         "ProductPrice2",
//         "ProductDiscount",
//         "ProductSize",
//         "ProductPack",
//         "ProductImageUrl",
//         "ProductQuantity",
//         "ProductAverageQuantity",
//       ],
//     });

//     if (!lastSixOrderDetails.length) {
//       throw new AppError(
//         `Order details could not be found using the provided CID ${customerNumber}`,
//         400
//       );
//     }

//     // Step 4: Get Last 12 Orders
//     const lastTwelveOrderDetails = await SaasDroOrder.findAll({
//       where: {
//         CustomerCid: customerNumber,
//         LastOrder: 12,
//       },
//       attributes: [
//         "ProductId",
//         "ProductDescription",
//         "ProductPrice1",
//         "ProductPrice2",
//         "ProductDiscount",
//         "ProductSize",
//         "ProductPack",
//         "ProductImageUrl",
//         "ProductQuantity",
//         "ProductAverageQuantity",
//       ],
//     });

//     if (!lastTwelveOrderDetails.length) {
//       throw new AppError(
//         `Order details could not be found using the provided CID ${customerNumber}`,
//         400
//       );
//     }

//     // Step 5: If everything is found
//     let response = {
//       CustomerInfo: customerDetails,
//       LastOrder: lastOrderDetails,
//       LastSixOrder: lastSixOrderDetails,
//       LastTwelveOrder: lastTwelveOrderDetails,
//     };

//     return response;
//   }

//   async getCustomerNotification(
//     customerNumber: number,
//     page = 1,
//     perPage = 10
//   ) {
//     const skipCount = (page - 1) * perPage;

//     // Step 1: Customer details
//     const customerDetails = await SaasDroNotification.findOne({
//       where: { CustomerCid: customerNumber },
//       attributes: ["CustomerCid", "CustomerName"],
//     });

//     if (!customerDetails) {
//       throw new AppError(
//         `Customer details could not be found using the provided customer CID. ${customerNumber}`,
//         400
//       );
//     }

//     // Step 2: Notifications
//     let notificationDetailsRaw = await SaasDroNotification.findAll({
//       where: {
//         CustomerCid: customerNumber,
//         NotificationActiveOrInactive: 1,
//         IsDeleted: { [Op.not]: true },
//       },
//       order: [["NotificationCreatedDate", "DESC"]],
//       attributes: [
//         "Rowid",
//         "NotificationId",
//         "NotificationType",
//         "NotificationName",
//         "NotificationDescription",
//         "NotificationCreatedDate",
//         "NotificationEndDate",
//         "NotificationViewStatus",
//         "NotificationViewDate",
//         "OrderNumber",
//       ],
//     });

//     const totalRecords = notificationDetailsRaw.length;

//     const notificationDetails = await Promise.all(
//       notificationDetailsRaw
//         .slice(skipCount, skipCount + perPage)
//         .map(async (notif: any) => {
//           const orderProducts = await SaasDroOrder.findAll({
//             where: {
//               OrderNumber: notif.OrderNumber,
//               CustomerCid: customerNumber,
//             },
//             attributes: [
//               "ProductId",
//               "PriceTotal",
//               "PriceTotalExt",
//               "ProductDiscount",
//               "ProductDescription",
//               "ProductImageUrl",
//             ],
//           });

//           const orderStatus = await SaasDroOrderStatus.findOne({
//             where: {
//               OrderNumber: notif.OrderNumber,
//               CustomerCid: customerNumber,
//             },
//             attributes: ["EstimateDeliveryCost", "EstimatedTotalTaxes"],
//           });

//           const productDetails = orderProducts.map((product) => ({
//             ProductId: product.ProductId,
//             PriceTotal: product.PriceTotal,
//             PriceTotalExt: product.PriceTotalExt || 0.0,
//             ProductDiscount: product.ProductDiscount,
//             EstimateTotalDeliveryCost: orderStatus?.EstimateDeliveryCost || 0,
//             EstimatedTotalTaxes: orderStatus?.EstimatedTotalTaxes || 0,
//             ProductDescription: product.ProductDescription,
//             ProductImageUrl: product.ProductImageUrl,
//           }));

//           return {
//             Rowid: notif.Rowid,
//             NotificationId: notif.NotificationId,
//             NotificationType: notif.NotificationType,
//             NotificationName: notif.NotificationName,
//             NotificationDescription: notif.NotificationDescription,
//             NotificationCreatedDate: notif.NotificationCreatedDate,
//             NotificationEndDate: notif.NotificationEndDate,
//             NotificationViewStatus: notif.NotificationViewStatus,
//             NotificationViewDate: notif.NotificationViewDate,
//             OrderNumber: notif.OrderNumber,
//             productDetails: productDetails,
//           };
//         })
//     );

//     if (!notificationDetails.length) {
//       throw new AppError(
//         `Notification list could not be found using the provided CID ${customerNumber}`,
//         400
//       );
//     }

//     // Step 3: Product ribbon
//     const productRibbon = await SaasDroNotification.findAll({
//       where: { CustomerCid: customerNumber },
//       attributes: [
//         "ProductId",
//         "ProductDescription",
//         "Price",
//         "Size",
//         "Pack",
//         "PrebookOffer7Days",
//         "PrebookOffer14Days",
//         "PrebookOffer21Days",
//         "ProductImageUrl",
//         "ProductOfferType",
//         "OfferStartDate",
//         "ProductCategory",
//       ],
//     });

//     if (!productRibbon.length) {
//       throw new AppError("The product ribbon will be updated shortly!", 400);
//     }

//     let response = {
//       CustomerInformation: customerDetails,
//       NotificationDetails: notificationDetails,
//       ProductRibbon: productRibbon,
//       TotalRecords: totalRecords,
//     };

//     return response;
//   }

//   async updateNotificationViewStatus(customerNumber: number, rowId: number) {
//     try {
//       const notifications = await SaasDroNotification.findAll({
//         where: {
//           CustomerCid: customerNumber,
//           Rowid: rowId,
//         },
//       });

//       if (notifications.length === 0) {
//         return new AppError(
//           `No notification found for customer ${customerNumber} and row ID ${rowId}.`,
//           400
//         );
//       }

//       let updateCount = 0;

//       for (const notif of notifications) {
//         notif.NotificationViewStatus = 1;
//         await notif.save();
//         updateCount++;
//       }

//       if (updateCount > 0) {
//         return `The notification status has been updated for the row ID ${rowId}.`;
//       } else {
//         return `The notification status has already been updated for the row ID ${rowId}.`;
//       }
//     } catch (error) {
//       console.error("Error updating notification view status:", error);
//       throw new AppError(
//         "An error occurred while updating the notification status.",
//         400
//       );
//     }
//   }

//   async CartDro(customerNumber: number) {
//     try {
//       const setting: any = await SaasSetting.findOne({
//         attributes: [
//           [
//             sequelize.literal(`CASE WHEN value = 'True' THEN 1 ELSE 0 END`),
//             "isEnabled",
//           ],
//         ],
//         where: { key: "showWithTaxesInCart" },
//         raw: true,
//       });

//       const showWithTaxesInCart = setting?.isEnabled === 1;

//       const customerDetails = await Customer.findOne({
//         where: { CNumber: customerNumber },
//         attributes: ["CNumber", "CName"],
//       });

//       if (!customerDetails) {
//         throw new AppError(
//           `Cart DRO not found with customer ID ${customerNumber}`,
//           400
//         );
//       }

//       const productDetails: any = await SaasDroCart.findAll({
//         where: { CustomerCid: customerNumber },
//         include: [
//           {
//             model: Inventory,
//             as: "Inventory",
//             required: false,
//           },
//         ],
//       });

//       const updatedPriceItems = await InventoryLogHistory.findAll({
//         where: {
//           ItemNumber: {
//             [Op.in]: productDetails.map((product: any) => product.ProductId),
//           },
//           DateLastChange: {
//             [Op.lte]: new Date(),
//           },
//         },
//         order: [["DateLastChange", "DESC"]],
//       });

//       const priceModels = updatedPriceItems.map((item) => {
//         const product = productDetails.find(
//           (product: any) => product.ProductId === item.ItemNumber
//         );
//         return {
//           ProductDescription: product.ProductDescription,
//           dateLastChange: item.DateLastChange,
//           rowid: product.Rowid,
//           logKey: item.MyKey,
//           itemNumber: item.ItemNumber,
//           updatedPrice: item.Price1,
//           oldPrice: product.OldPrice,
//         };
//       });

//       for (const item of priceModels) {
//         const existingItem: any = await SaasDroCart.findOne({
//           where: { Rowid: item.rowid },
//         });

//         if (existingItem && item.updatedPrice !== item.oldPrice) {
//           const today = new Date();
//           const inventorySpecials = await InventorySpecial.findAll({
//             where: {
//               Price: {
//                 [Op.ne]: 0,
//               },
//               Start_Date: {
//                 [Op.lte]: today,
//               },
//               End_Date: {
//                 [Op.gte]: today,
//               },
//             },
//           });

//           const updatedPrice: any = this.CalculateDiscount(
//             customerNumber,
//             item.itemNumber,
//             existingItem.ProductQuantity || 0,
//             item.updatedPrice,
//             inventorySpecials
//           );

//           existingItem.ProductDiscount = updatedPrice.UpdatedDiscount;
//           existingItem.PerUnitePrice = item.updatedPrice;
//           existingItem.ProductPrice = updatedPrice.UpdatedProductPrice1;
//           existingItem.DepositAmount = updatedPrice.DepositAmount;
//           existingItem.PriceTotal = showWithTaxesInCart
//             ? updatedPrice.UpdatedProductPrice1 + existingItem.EstimatedTax
//             : updatedPrice.UpdatedProductPrice1;
//           existingItem.PriceTotalExt =
//             existingItem.PriceTotal * existingItem.ProductQuantity;

//           await existingItem.save();
//         }
//       }

//       const arAmount = await CustReceivable.sum("AR_Amount", {
//         where: {
//           CNumber: customerNumber,
//         },
//       });

//       const response = {
//         ArAmount: arAmount,
//         CustomerInfo: customerDetails,
//         ProductDetails: productDetails,
//         UpdatedPriceItem: priceModels,
//       };

//       return { response, message: "" };
//     } catch (error) {
//       console.error("Error in CartDro:", error);
//       throw new AppError("An error occurred while processing the cart.", 400);
//     }
//   }

//   async getCustomerArAmount(customerNumber: number) {
//     const [result]: any = await sequelize.query(
//       `
//     SELECT SUM("AR_Amount" - COALESCE("AR_Applied", 0)) AS "total"
//     FROM "CustReceivables"
//     WHERE "CNumber" = :customerNumber
//     `,
//       {
//         replacements: { customerNumber },
//         type: QueryTypes.SELECT,
//       }
//     );

//     return result?.total ?? 0;
//   }

//   async  getUnreadNotificationCount(customerNumber:number) {
//   const count = await SaasDroNotification.count({
//     where: {
//       CustomerCid: customerNumber,
//       NotificationViewStatus: 0,
//       IsDeleted: { [Op.ne]: true },
//     },
//   });

//   return count;
// }

// async  getCartCount(customerNumber:number) {
//   const count = await SaasDroCart.count({
//     where: {
//       CustomerCid: customerNumber,
//     },
//   });

//   return count;
// }


// async  deleteItemFromCart(customerNumber:number, productId:number) {
//   // Find cart items to delete
//   const cartItems = await SaasDroCart.findAll({
//     where: {
//       CustomerCid: customerNumber,
//       ProductId: productId,
//     },
//   });

//   if (cartItems.length > 0) {
//     // Delete the cart items
//     await SaasDroCart.destroy({
//       where: {
//         CustomerCid: customerNumber,
//         ProductId: productId,
//       },
//     });

//     // Get updated cart
//     const productDetails = await SaasDroCart.findAll({
//       where: { CustomerCid: customerNumber },
//       attributes: [
//         'ProductId',
//         'ProductDescription',
//         'ProductPrice',
//         'ProductImageUrl',
//         'ProductQuantity',
//         'ProductPack',
//         'AvailableQty',
//         'PriceTotal',
//       ],
//     });

//     // Update cart count in SaasDroHomeScreens
//     await SaasDroHomeScreen.update(
//       { CartItemCount: productDetails.length },
//       {
//         where: {
//           CustomerCid: customerNumber,
//         },
//       }
//     );

//     return true;
//   } else {
//     throw new AppError(`Cart product list is not found by productID: ${productId} or CID: ${customerNumber}`,400)
   
//   }
// }

// async  deleteAllItemFromCart (customerNumber: number) {
//   const results = await SaasDroCart.findAll({ where: { CustomerCid: customerNumber } });

//   if (results.length > 0) {
//     // Delete all items from cart
//     await SaasDroCart.destroy({ where: { CustomerCid: customerNumber } });

//     // Get remaining product detail (should be empty after delete)
//     const productDetail = await SaasDroCart.findAll({
//       where: { CustomerCid: customerNumber },
//       attributes: [
//         "ProductId",
//         "ProductDescription",
//         "ProductPrice",
//         "ProductImageUrl",
//         "ProductQuantity",
//         "ProductPack",
//         "AvailableQty",
//         "PriceTotal",
//       ],
//     });

//     // Update cart item count on the home screen
//     const cartItems = await SaasDroHomeScreen.findAll({ where: { CustomerCid: customerNumber } });

//     for (const item of cartItems) {
//       item.CartItemCount = productDetail.length;
//       await item.save(); // Persist the change
//     }

//     return true
//   }

//   throw new AppError(`Cart product list is not found by CID: ${customerNumber}`,400)
// }

// async  addItemToCart(addtocart:AddToCartRequest) {
//   const cartProductData :any = addtocart.addToCart;
//   const isSalesModule = addtocart.isSalesModule;
//   const today = new Date();

//   // Get inventory specials valid today or perpetual with price/allowance
//   const inventorySpecials = await InventorySpecial.findAll({
//     where: {
//       [Op.or]: [
//         { Price: { [Op.ne]: 0 } },
//         { Allowance: { [Op.ne]: 0 } },
//       ],
//       [Op.and]: [
//         {
//           [Op.or]: [
//             {
//               Start_Date: { [Op.lte]: today },
//               End_Date: { [Op.gte]: today }
//             },
//             { Perpetual: true }
//           ]
//         }
//       ]
//     }
//   });

//   // Fetch user settings and transform into key-value object for quick access
//   const userSettingsRaw :any = await SaasSetting.findAll();
//   const userSettings :any{}= {};
//   userSettingsRaw.forEach((s:any) => { userSettings[s.key] = s.value; });

//   const showWithTaxesInCart = userSettings["showWithTaxesInCart"] === "True";
//   const isMaxQtySalesAppliedForSales = userSettings["IsMaxQtySalesAppliedForSales"] === "True";
//   const isMaxQtySalesAppliedToCustomer = userSettings["IsMaxQtySalesAppliedToCustomer"] === "True";

//   if (!cartProductData.length) {
//     return { success: false, message: "Cart product data is empty." };
//   }

//   const customerCID = cartProductData[0].customerCId;

//   const customerDetails = await Customer.findOne({ where: { CNumber: customerCID } });
//   if (!customerDetails) {
//     return { success: false, message: "Customer not found." };
//   }

//   const n = cartProductData.length;

//   // Optional: use transaction for atomicity
//   const transaction = await sequelize.transaction();

//   try {
//     for (let i = 0; i < n; i++) {
//       const item = cartProductData[i];

//       // Find product setting & existing cart item
//       const productSetting = await SaasProductSetting.findOne({ where: { ItemNumber: item.ProductID } });
//       const existingItem :any = await SaasDroCart.findOne({ where: { productId: item.ProductID, customerCid: item.CustomerCId } });

//       // Helper function for delivery charge
//       const getDeliveryCharge = async (cid:any) => {
//         const cust = await Customer.findOne({ where: { CNumber: cid, DeliveryCharge: true } });
//         return cust ? cust.DeliveryAmount : 0;
//       };

//       // Validation and logic based on IsSalesModule and max quantity settings
//       if (productSetting) {
//         if (isSalesModule !== 1) {
//           if (productSetting.MaxQtySalesAllowed !== 0 && isMaxQtySalesAppliedToCustomer && item.ProductQuantity > productSetting.MaxQtySalesAllowed) {
//             await transaction.rollback();
//             return { success: false, message: "The item quantity is more than the maximum quantity allowed." };
//           }
//         } else {
//           if (productSetting.MaxQtySalesAllowed !== 0 && isMaxQtySalesAppliedForSales && item.ProductQuantity > productSetting.MaxQtySalesAllowed) {
//             await transaction.rollback();
//             return { success: false, message: "The item quantity is more than the maximum quantity allowed." };
//           }
//         }
//       }

//       if (existingItem) {
//         if (item.ProductQuantity === 0) {
//           // Delete item from cart
//           await this.deleteItemFromCart(customerCID, item.ProductID);
//         } else {
//           // Update existing cart item
//           let price1 = await this.setEffectivePrice(customerCID, item.ProductID, customerDetails);
//           price1 = price1 ?? 0;

//           const updatedPrice :any = await this.CalculateDiscount(customerCID, item.ProductID, item.ProductQuantity, price1, inventorySpecials);

//           const DISCOUNT = updatedPrice.updatedDiscount;
//           const ProductPrice = updatedPrice.updatedProductPrice1;
//           const DepositAmount = updatedPrice.depositAmount;
//           const ProductPriceWithTax = ProductPrice + item.tx;

//           let estimateTotalDeliveryCost :any = 0;
//           if (item.ProductQuantity >= 0) {
//             estimateTotalDeliveryCost = await getDeliveryCharge(item.CustomerCId);
//           }

//           existingItem.oldPrice = item.OldPrice;
//           existingItem.perUnitePrice = price1 + item.tx;
//           existingItem.addedProductDate = new Date();
//           existingItem.cartItemCount = n;
//           existingItem.deletedProductDate = new Date();
//           existingItem.productDiscount = DISCOUNT;
//           existingItem.productPrice = parseFloat(ProductPrice);
//           existingItem.depositAmount = DepositAmount;
//           existingItem.productQuantity = item.ProductQuantity;
//           existingItem.timestamp = new Date();
//           existingItem.priceTotal = showWithTaxesInCart ? ProductPriceWithTax : ProductPrice;
//           existingItem.priceTotalExt = showWithTaxesInCart ? (ProductPriceWithTax * item.ProductQuantity) : (ProductPrice * item.ProductQuantity);
//           existingItem.estimatedTax = item.tx;
//           existingItem.estimateTotalDeliveryCost = estimateTotalDeliveryCost;
//           existingItem.salesItemDiscount = item.SalesItemDiscount;

//           await existingItem.save({ transaction });
//         }
//       } else {
//         if (item.ProductQuantity === 0) {
//           await transaction.rollback();
//           return { success: false, message: "Please add valid Product items" };
//         } else {
//           // Create new cart item
//           let price1 = await this.setEffectivePrice(customerCID, item.ProductID, customerDetails);
//           price1 = price1 ?? 0;

//           const updatedPrice :any = await this.CalculateDiscount(customerCID, item.ProductID, item.ProductQuantity, price1, inventorySpecials);

//           const DISCOUNT = updatedPrice.updatedDiscount;
//           const ProductPrice = updatedPrice.updatedProductPrice1;
//           const DepositAmount = updatedPrice.depositAmount;
//           const ProductPriceWithTax = ProductPrice + item.tx;

//           let estimateTotalDeliveryCost :any = 0;
//           if (item.ProductQuantity >= 0) {
//             estimateTotalDeliveryCost = await getDeliveryCharge(item.CustomerCId);
//           }

//           await SaasDroCart.create({
//             oldPrice: price1,
//             perUnitePrice: price1 + item.tx,
//             addedProductDate: new Date(),
//             cartItemCount: n,
//             customerCid: item.CustomerCId,
//             customerName: item.CustomerName,
//             productDescription: item.ProductDescription,
//             deletedProductDate: new Date(),
//             availableQty: item.AvailableQty,
//             productDiscount: DISCOUNT,
//             productPrice: parseFloat(ProductPrice),
//             depositAmount: DepositAmount,
//             productId: item.ProductID,
//             productImageUrl: item.ProductImageURL,
//             productPack: item.ProductPack,
//             productQuantity: item.ProductQuantity,
//             timestamp: new Date(),
//             upcNumber: item.UpcNumber,
//             priceTotal: showWithTaxesInCart ? ProductPriceWithTax : ProductPrice,
//             priceTotalExt: showWithTaxesInCart ? (ProductPriceWithTax * item.ProductQuantity) : (ProductPrice * item.ProductQuantity),
//             estimatedTax: item.tx,
//             estimateTotalDeliveryCost: estimateTotalDeliveryCost,
//             salesItemDiscount: item.SalesItemDiscount,
//           }, { transaction });
//         }
//       }
//     }

//     // Update SaasDroHomeScreens cart count for the customer
//     const droHomeScreens = await SaasDroHomeScreen.findAll({ where: { CustomerCid: customerCID } });
//     for (const screen of droHomeScreens) {
//       screen.CartItemCount = n;
//       await screen.save({ transaction });
//     }

//     await transaction.commit();
//     return true
//   } catch (error) {
//     await transaction.rollback();
//     throw  new AppError(`Error adding to cart: ${error}`,400)
//   }
// }

// async digitalDroHomeCategory(customerNumber:number){
//   const response :any= {
//     CustomerInformation: null,
//     productDetails: [],
//     message:''
//   };
//  ;

//   // Fetch customer info
//   const customerDetails = await SaasDroDigitalFlyer.findOne({
//     where: { CustomerCid: customerNumber },
//     attributes: ['CustomerCid', 'CustomerName'],
//     raw: true
//   });

//   if (customerDetails) {
//     // Fetch product details
//     const productDetails = await SaasDroDigitalFlyer.findAll({
//       where: { CustomerCid: customerNumber },
//       attributes: [
//         'Date',
//         'ProductCategory',
//         'ProductCategoryId',
//         'ProductId',
//         'ProductDescription',
//         'ProductPrice1',
//         'ProductPrice2',
//         'ProductSize',
//         'ProductPack',
//         'ProductImageUri',
//         'AverageQuantity',
//         'DailySalesVolume',
//         'LastFullMonth',
//         'ProductNumberOfSellMonth',
//         'LastFullYear',
//         'ProductNumberOfSellYear',
//         'OffAlert',
//         'DiscountOfferAmount',
//         'OfferExpire',
//         'DiscountOfferValueIn7Days',
//         'DiscountOfferValueIn14Days',
//         'DiscountOfferValueIn21Days'
//       ],
//       raw: true,
//       group: [
//         'Date',
//         'ProductCategory',
//         'ProductCategoryId',
//         'ProductId',
//         'ProductDescription',
//         'ProductPrice1',
//         'ProductPrice2',
//         'ProductSize',
//         'ProductPack',
//         'ProductImageUri',
//         'AverageQuantity',
//         'DailySalesVolume',
//         'LastFullMonth',
//         'ProductNumberOfSellMonth',
//         'LastFullYear',
//         'ProductNumberOfSellYear',
//         'OffAlert',
//         'DiscountOfferAmount',
//         'OfferExpire',
//         'DiscountOfferValueIn7Days',
//         'DiscountOfferValueIn14Days',
//         'DiscountOfferValueIn21Days'
//       ]
//     });

//     if (productDetails.length > 0) {
//       response.CustomerInformation = customerDetails;
//       response.productDetails = productDetails;
//     } else {
//       response.message = `Cart list is not found by CID: ${customerNumber}`;
//     }
//   } else {
//     response.message = `Customer details are not found by customer CID: ${customerNumber}`;
//   }

//   return response;
// }

// async digitalCategoryDetail(customerNumber:number){
//    const response :any = {
//     CustomerInformation: null,
//     productDetails: [],
//     message:""
//   };

//   try {
//     // Fetch customer details
//     const customerDetails = await SaasDroDigitalFlyer.findOne({
//       where: { CustomerCid: customerNumber },
//       attributes: ['CustomerCid', 'CustomerName']
//     });

//     if (!customerDetails) {
//       throw new AppError(Manager.CUSTOMER_NOT_FOUND,400)
//     }

//     // Fetch distinct product categories
// const productDetail = await SaasDroDigitalFlyer.findAll({
//   where: { CustomerCid: customerNumber },
//   attributes: [
//     [sequelize.fn('DISTINCT', sequelize.col('ProductCategory')), 'ProductCategory'],
//     'ProductCategoryId'
//   ],
//   raw: true
// });


//     if (productDetail.length > 0) {
//       response.CustomerInformation = customerDetails;
//       response.productDetails = productDetail;
//       return response
//     } else {
//       response.message =`Cart list is not found by CID: ${customerNumber}`
//       return  response
//     }
//   } catch (error) {
//     console.error('Error in getDigitalCategoryDetails:', error);
//     throw new AppError(General.SOMETHING_WENT_WRONG,500)
//   }
// }

// async  getOrderDeadlineDate(customerNumber:number) {
//   const lastOrder = await SaasDroOrder.findOne({
//       where: {
//         CustomerCid: customerNumber,
//         OrderReceivedDate: { [Op.not]: null as any }, // Fix TS typing
//       },
//       order: [['Rowid', 'DESC']],
//     });
//         const now = new Date();


//      if (lastOrder?.OrderReceivedDate) {
//       const deadlineDate = new Date(lastOrder.OrderReceivedDate);
//       deadlineDate.setDate(deadlineDate.getDate() + 7);
//       return deadlineDate;
//     }

//     now.setDate(now.getDate() + 7);
//     return now;
  
// }

// async  getAvailableSlots() {
//   const { Op } = require('sequelize');
//   const today = new Date();
//   const dayNumber = today.getDay(); // Sunday = 0, Monday = 1, ... like C#

//   // Fetch slotIds for the current weekday
//   const slotDays = await SaasSlotDay.findAll({
//     where: { WeekDay: dayNumber },
//     attributes: ['SlotId'],
//   });

//   const slotIds = slotDays.map((slot) => slot.SlotId);

//   let timeSlots :any[] = [];

//   if (slotIds.length > 0) {
//     timeSlots = await SaasSlotDetail.findAll({
//       where: {
//         FkslotId: {
//           [Op.in]: slotIds,
//         },
//       },
//       attributes: ['FromTime', 'ToTime', 'SlotDetailId', 'FkslotId'],
//       order: [['FromTime', 'ASC']],
//     });
//   }

//   return timeSlots;
// }

// async  getProductStatus(customerNumber:number) {
//   // Assuming Sequelize models: SaasDroCarts, Inventories, Customers
//   const productStatus = {
//     ProductActiveStatus: true,
//     SalesCategoryStatus: true,
//   };

//   // Step 1: Get all products in the customer's cart
//   const productDetailsRaw = await SaasDroCart.findAll({
//     where: { CustomerCid: customerNumber },
//     attributes: ['ProductId'],
//     raw: true,
//   });

//   // Extract product IDs
//   const productIds = productDetailsRaw.map((p:any) => p.ProductId);

//   if (productIds.length === 0) {
//     // No products for customer, return default status
//     return productStatus;
//   }

//   // Step 2: Fetch related Inventory info for those products
//   const inventories = await Inventory.findAll({
//     where: { ItemNumber: productIds },
//     attributes: ['ItemNumber', 'SalesCategory', 'IInactive'],
//     raw: true,
//   });

//   // Map ProductId -> Inventory info
//   const inventoryMap = inventories.reduce((acc:any, inv) => {
//     acc[inv.ItemNumber] = inv;
//     return acc;
//   }, {});

//   // Step 3: Merge product info with inventory info
//   let productDetails = productIds.map(pid => {
//     const inv = inventoryMap[pid] || {};
//     return {
//       ProductId: pid,
//       SalesCategory: inv.SalesCategory || null,
//       InActive: inv.IInactive || false,
//     };
//   });

//   // Step 4: Check if any product is inactive
//   if (productDetails.some(p => p.InActive === true)) {
//     productStatus.ProductActiveStatus = false;
//   }

//   const beforeCategoryProductCount = productDetails.length;

//   // Step 5: Get customer info
//   const customer:any = await Customer.findOne({
//     where: { CNumber: customerNumber },
//     raw: true,
//   });

//   if (!customer) {
//     // If no customer found, return current status
//     return productStatus;
//   }

//   // Step 6: Filter products by allowed categories
//   // Build a list of allowed categories from customer properties
//   const allowedCategories :any[] = [];
//   for (let i = 1; i <= 12; i++) {
//     const propName = `CategoryAllow${i.toString().padStart(2, '0')}`;
//     if (customer[propName] === true) {
//       allowedCategories.push(i);
//     }
//   }

//   // Filter productDetails by allowed categories
//   productDetails = productDetails.filter(p => allowedCategories.includes(p.SalesCategory));

//   const afterCategoryProductCount = productDetails.length;

//   // Step 7: Set SalesCategoryStatus based on count comparison
//   productStatus.SalesCategoryStatus = beforeCategoryProductCount === afterCategoryProductCount;

//   return productStatus;
// }

// async  setOutForDelivery(trackOrder:SetOutLocationUpdate, byUserId:number) {
//   // Assuming SaasDroOrderStatuses is your Sequelize model

//   for (const item of trackOrder.orderStatuses) {
//     const order = await SaasDroOrderStatus.findOne({
//       where: { OrderNumber: item.orderNumber }  // Note the camelCase fix if needed
//     });

//     if (order) {
//       order.IsOutForDelivery = item.status;
//       order.DriverId = byUserId;
//       await order.save();  // save updates the record
//     }
//   }

//   return true;
// }

// async  setOrderDelivered(trackOrder:SetOutLocationUpdate) {
//   // Assuming SaasDroOrderStatuses is your Sequelize model

//   for (const item of trackOrder.orderStatuses) {
//     const order :any = await SaasDroOrderStatus.findOne({
//       where: { OrderNumber: item.orderNumber } // fix to camelCase
//     });

//     if (order) {
//       order.DeliveredOn = item.status === true ? new Date() : null;
//       order.IsDelivered = item.status;
//       order.PaymentMode = item.paymentMode;

//       await order.save();
//     }
//   }

//   // In your C# code you return Task.FromResult(false), which is false always.
//   // Adjust if needed. Here I will return false similarly.
//   return true;
// }


// async setOrderPickUp(orderStatus:OrderStatusPickedUp,byUserId:number){
//    const order = await SaasDroOrderStatus.findOne({
//       where: { OrderNumber: orderStatus.orderNumber },
//     });

//     if (order) {
//       await order.update({
//         ShipmentPickedUpOn: orderStatus.status ? new Date() : null,
//         IsShipmentPickedUp: orderStatus.status,
//         DriverId: byUserId,
//       });

//       return true;
//     }

//     return false;
// }

//  async  getOrderListBasedOnRoute(driverId: number, deliveryDate: Date){
//   const targetDate = new Date(deliveryDate);
//   targetDate.setDate(targetDate.getDate() - 7);

//   const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

//   // Step 1: Get route list
//   const routeAssignments = await SaasDriverAssignRoute.findAll({
//     where: {
//       DriverId: driverId,
//       DayOfWeek: dayOfWeek,
//     },
//     include: [{
//       model: SaasRoute,
//       as: 'Route',
//       required: true,
//     }],
//   });

//   const actualRoutes = routeAssignments.map(r => ({
//     ActualRouteNumber: r.RouteNumber,
//     RouteId: r.RouteNumber
//   }));

//   const orderInfos: any[] = [];

//   for (const route of actualRoutes) {
//     const orders = await SaasDroOrderStatus.findAll({
//       include: [
//         {
//           model: OrderHeader,
//           as: 'OrderHeader',
//           where: {
//             OrderDate: Sequelize.literal(`CAST('${targetDate.toISOString().split('T')[0]}' AS DATE)`),
//             RouteNumber: route.RouteId
//           },
//         },
//         {
//           model: SaasRouteStop,
//           as: 'RouteStop',
//           where: {
//             RouteNumber: route.RouteId
//           }
//         }
//       ],
//       where: {
//         DeliveryType: 'shipping'
//       }
//     });

//     const grouped = new Map<>();

//     for (const order of orders) {
//       const orderNumber = order.OrderNumber;

//       if (!grouped.has(orderNumber)) {
//         grouped.set(orderNumber, {
//           CustomerNumber: order.CustomerCid,
//           CustomerName: order.CustomerName,
//           OrderNumber: order.OrderNumber,
//           IsShipmentPickedUp: order.IsShipmentPickedUp,
//           ShipmentPickedUpOn: order.ShipmentPickedUpOn ? new Date(order.ShipmentPickedUpOn).toLocaleDateString('en-GB') : null,
//           IsOutForDelivery: order.IsOutForDelivery,
//           IsDelivered: order.IsDelivered,
//           DeliveredOn: order.DeliveredOn ? new Date(order.DeliveredOn).toLocaleDateString('en-GB') : null,
//           RouteNumber: route.ActualRouteNumber,
//           StatusMessage: 'Delivered'
//         });
//       }
//     }

//     orderInfos.push(...Array.from(grouped.values()));
//   }

//   return orderInfos;
// }

//  async  getAllOrderStop(driverId: number, deliveryDate: Date) {
//   const targetDate = new Date(deliveryDate);
//   targetDate.setDate(targetDate.getDate() - 7);
//   const dayOfWeek = targetDate.getDay(); // Sunday = 0

//   // STEP 1: Get Route Stops
//   const routeStops = await SaasRouteStop.findAll({
//     include: [
//       {
//         model: SaasRoute,
//         as: 'Route',
//         where: { DriverId: driverId },
//         required: true,
//       },
//       {
//         model: Route,
//         as: 'DayRoute',
//         where: { RouteDayOfWeek: dayOfWeek },
//         required: true,
//       },
//     ],
//     raw: true,
//   });

//   const stops: any[] = routeStops.map((a: any) => ({
//     Id: a.Id,
//     StopName: a.StopName,
//     StopNumber: a.StopNumber ?? 0,
//     RouteNumber: a.RouteNumber,
//     Address: a.Address,
//     City: a.City,
//     State: a.State,
//     ZipCode: a.ZipCode,
//     AddedBy: a.AddedBy,
//     Latitude: a.Latitude,
//     Longitude: a.Longitude,
//   }));

//   const routeNumbers = [...new Set(stops.map(s => s.RouteNumber))];
//   const firstRouteNumber = routeNumbers[0] ?? null;

//   let orderHeaders: any[] = [];

//   if (firstRouteNumber) {
//     const orders :any = await SaasDroOrderStatus.findAll({
//       include: [
//         {
//           model: OrderHeader,
//           as: 'OrderHeader',
//           required: true,
//           where: {
//             OrderDate: Sequelize.literal(`CAST('${targetDate.toISOString().split('T')[0]}' AS DATE)`),
//             RouteNumber: firstRouteNumber,
//           },
//         },
//         {
//           model: SaasRouteStop,
//           as: 'RouteStop',
//           required: true,
//           where: {
//             RouteNumber: firstRouteNumber,
//           },
//         },
//         {
//           model: CustomerRoute,
//           as: 'CustomerRoute',
//           required: false,
//           where: Sequelize.and(
//             Sequelize.literal(`"OrderHeader"."RouteNumber" = ${firstRouteNumber}`),
//             Sequelize.literal(`"OrderHeader"."CNumber" = "CustomerRoute"."CNumber"`)
//           ),
//         },
//       ],
//       where: {
//         DeliveryType: 'shipping',
//       },
//       raw: true,
//       nest: true,
//     });

//     const groupedOrders = new Map<>();

//     for (const o of orders) {
//       if (!groupedOrders.has(o.OrderNumber)) {
//         groupedOrders.set(o.OrderNumber, {
//           StopNo: o.CustomerRoute?.StopNumber ?? null,
//           CustomerNumber: o.CustomerCid,
//           CustomerName: o.CustomerName,
//           OrderNumber: o.OrderNumber,
//           IsShipmentPickedUp: o.IsShipmentPickedUp,
//           ShipmentPickedUpOn: o.ShipmentPickedUpOn ? new Date(o.ShipmentPickedUpOn).toLocaleDateString('en-GB') : null,
//           IsOutForDelivery: o.IsOutForDelivery,
//           IsDelivered: o.IsDelivered,
//           DeliveredOn: o.DeliveredOn ? new Date(o.DeliveredOn).toLocaleDateString('en-GB') : null,
//           RouteNumber: firstRouteNumber,
//           StatusMessage: 'Delivered',
//         });
//       }
//     }

//     orderHeaders = Array.from(groupedOrders.values());
//   }

//   return {
//     routeStops: stops,
//     orderHeaders,
//   };
// }

//  async  getOrderListForAll(deliveryDate: Date) {
//   const targetDate = new Date(deliveryDate);
//   targetDate.setDate(targetDate.getDate() - 7); // Reverse logic: OrderDate + 7 == deliveryDate

//   const orders = await SaasDroOrderStatus.findAll({
//     include: [
//       {
//         model: OrderHeader,
//         as: 'OrderHeader',
//         required: true,
//         where: Sequelize.where(
//           Sequelize.fn('DATEADD', Sequelize.literal('DAY'), 7, Sequelize.col('"OrderHeader"."OrderDate"')),
//           '=',
//           targetDate.toISOString().split('T')[0]
//         ),
//       },
//     ],
//     where: {
//       DeliveryType: 'shipping',
//     },
//     attributes: [[Sequelize.col('OrderHeader.OrderNumber'), 'OrderNumber']],
//     raw: true,
//   });

//   return orders.map(o => ({ OrderNumber: o.OrderNumber }));
// }

//  async  arrivedDestination(arrivedorder: ArrivedOrder) {
//   const firstOrder = arrivedorder.ordernumberlist[0];

//   const existingDriverLoc :any = await SaasDriverLocation.findOne({
//     where: { OrderNumber: firstOrder.orderNumber },
//   });

//   // Insert new driver location records for each order
//   for (const row of arrivedorder.ordernumberlist) {
//     const orderDetail :any = await OrderHeader.findOne({ where: { OrderNumber: row.orderNumber } });
//     if (!orderDetail) continue;

//     await SaasDriverLocation.create({
//       StopNumber: orderDetail.StopNumber,
//       RouteNumber: arrivedorder.routeNumber,
//       DriverId: arrivedorder.driverId,
//       Latitude: arrivedorder.latitude,
//       Longitude: arrivedorder.longitude,
//       LocationTime: new Date(),
//       OrderNumber: row.orderNumber,
//       StatusMessage: 'Arrived',
//       Date: new Date(),
//     });
//   }

//   // Retrieve stop address info
//   const result :any = await OrderHeader.findOne({
//     where: { OrderNumber: firstOrder.orderNumber },
//     include: [
//       {
//         model: SaasRouteStop,
//         as: 'RouteStop',
//         where: Sequelize.literal('"OrderHeader"."RouteNumber" = "RouteStop"."RouteNumber"'),
//         required: true,
//       },
//     ],
//     raw: true,
//     nest: true,
//   });

//   if (!result) return null;

//   const stopAddress = {
//     RouteNumber: result.RouteNumber,
//     IsDriverArrived: true,
//     DriverArrivedAt: new Date(),
//     Id: result.RouteStop.Id,
//     StopNumber: result.StopNumber,
//     Address: result.RouteStop.StopName,
//     City: result.RouteStop.City,
//     State: result.RouteStop.State,
//     ZipCode: result.RouteStop.ZipCode,
//     AddedBy: result.RouteStop.AddedBy,
//     Latitude: result.RouteStop.Latitude,
//     Longitude: result.RouteStop.Longitude,
//   };

//   // Update or insert current driver location
//   if (existingDriverLoc) {
//     const currentLoc = await SaasDriverCurrentLocation.findOne({
//       where: { DriverId: existingDriverLoc.DriverId },
//     });

//     if (currentLoc) {
//       currentLoc.Latitude = stopAddress.Latitude;
//       currentLoc.Longitude = stopAddress.Longitude;
//       await currentLoc.save();
//     } else {
//       await SaasDriverCurrentLocation.create({
//         DriverId: existingDriverLoc.DriverId,
//         Latitude: stopAddress.Latitude,
//         Longitude: stopAddress.Longitude,
//       });
//     }
//   }

//   return stopAddress; 

//  }
//   //   const productIds = recommendList.map(p => p.ProductId);
//   //   const today = new Date();

//   //   const customerDetails = await Customer.findOne({
//   //     where: { CNumber: customerId }
//   //   });

//   //   const inventorySpecials = await InventorySpecial.findAll({
//   //     where: {
//   //       [Op.and]: [
//   //         { [Op.or]: [{ Price: { [Op.ne]: 0 } }, { Allowance: { [Op.ne]: 0 } }] },
//   //         {
//   //           [Op.or]: [
//   //             { Perpetual: true },
//   //             {
//   //               StartDate: { [Op.lte]: today },
//   //               EndDate: { [Op.gte]: today }
//   //             }
//   //           ]
//   //         }
//   //       ]
//   //     }
//   //   });

//   //   // Config values (assumed to come from your environment or config)
//   //   const hostURL = process.env.HOST_URL;
//   //   const useMasterImage = process.env.MASTER_IMAGE_URL;
//   //   const productFolder = process.env.PRODUCT_IMAGE_FOLDER;

//   //   const inventoryResults = await Inventory.findAll({
//   //     where: {
//   //       IInactive: false,
//   //       ShortOrderForm: true,
//   //       IDiscontinued: false,
//   //       ItemNumber: productIds
//   //     },
//   //     include: [
//   //       {
//   //         model: InventoryUpc,
//   //         as: "InventoryUpcs",
//   //         where: { Status: 1, Priority: 1 },
//   //         required: false,
//   //         include: [
//   //           {
//   //             model: SaasProductImage,
//   //             as: "SaasProductImages",
//   //             required: false
//   //           }
//   //         ]
//   //       }
//   //     ],
//   //     limit: 5
//   //   });

//   //   const productDetails = await Promise.all(
//   //     inventoryResults.map(async inventory => {
//   //       const upc = inventory.InventoryUpcs?.[0];
//   //       const image = upc?.SaasProductImages?.[0];
//   //       const upcNumber = upc?.UpcNumber ?? "";
//   //       const itemNumber = inventory.ItemNumber;

//   //       const retail = inventory.Retail1 || inventory.RetailPct1
//   //         ? inventory.Retail1?.toString() ?? `${inventory.RetailPct1}%`
//   //         : inventory.Retail2 || inventory.RetailPct2
//   //           ? inventory.Retail2?.toString() ?? `${inventory.RetailPct2}%`
//   //           : inventory.Retail3 || inventory.RetailPct3
//   //             ? inventory.Retail3?.toString() ?? `${inventory.RetailPct3}%`
//   //             : "0";

//   //       // Inventory on hand
//   //       const onHand = await InventoryStatus.sum('InventoryOnHand', {
//   //         where: { ItemNumber: itemNumber }
//   //       });

//   //       const reservedQty = await OrderDetail.sum('QuantityOrdered', {
//   //         include: [{
//   //           model: OrderHeader,
//   //           required: true,
//   //           where: {
//   //             OrderType: 0,
//   //             OrderUpdated: false
//   //           }
//   //         }],
//   //         where: {
//   //           ItemNumber: itemNumber,
//   //           UnitCode: { [Op.not]: true }
//   //         }
//   //       });

//   //       let availableQty = onHand - (reservedQty || 0);

//   //       let productPrice1 = await setEffectivePrice(customerId, itemNumber, customerDetails);
//   //       let discountInfo = await calculateDiscount(customerId, itemNumber, 1, productPrice1, inventorySpecials);
//   //       let finalProductPrice1 = discountInfo.UpdatedProductPrice1;

//   //       return {
//   //         Retail: retail,
//   //         ProductPack: inventory.Pack,
//   //         Uom: inventory.Uom,
//   //         CaseCount: inventory.CaseCount,
//   //         UnitOunces: inventory.UnitOunces,
//   //         PerUnitePrice: finalProductPrice1,
//   //         ItemNumber: itemNumber,
//   //         ProductDescription: inventory.Description || "--",
//   //         ProductDiscount: discountInfo.UpdatedDiscount,
//   //         ProductImageUrl: (inventory.UseMasterImage ?? false)
//   //           ? `${hostURL}/${productFolder}/${image?.ImageName || `${upcNumber}.jpg`}`
//   //           : `${useMasterImage}${upcNumber}.jpg`,
//   //         SalesCategory: inventory.SalesCategory,
//   //         UPCNumber: upcNumber,
//   //         ProductPriceWithTax: 0,
//   //         AvailableQty: availableQty,
//   //         ProductPrice1: finalProductPrice1
//   //       };
//   //     })
//   //   );

//   //   const finalProductDetails = await calculateTax(customerDetails, productDetails);

//   //   return finalProductDetails;
//   // }

//   // helper function



//   async SetEffectivePrice(
//     CNumber: number,
//     productId: number,
//     CustomerDetails: Customer
//   ): Promise<number> {
//     const item = await Inventory.findOne({ where: { ItemNumber: productId } });
//     if (!item) return 0;

//     let ItemPrice = item.Price1 ?? 0;

//     if ((item.PriceClass ?? 0) > 0) {
//       let CustPricingRecord = await CustPricing.findOne({
//         where: {
//           C_Number:CNumber,
//           [Op.or]: [
//             { Price_Class: item.PriceClass },
//             { Price_Class: (item.SalesCategory ?? 0) + 1000 },
//           ],
//         },
//       });

//       // Use parent customer pricing if CPricingAccount is set
//       if ((CustomerDetails.C_PricingAccount ?? 0) > 0) {
//         const ParentCustPricing = await CustPricing.findOne({
//           where: {
//             C_Number: CustomerDetails.C_PricingAccount,
//             [Op.or]: [
//               { Price_Class: item.PriceClass },
//               { Price_Class: (item.SalesCategory ?? 0) + 1000 },
//             ],
//           },
//         });

//         if (ParentCustPricing) {
//           CustPricingRecord = ParentCustPricing;
//         }
//       }

//       if (CustPricingRecord) {
//         if ((CustPricingRecord.Price ?? 0) > 0) {
//           ItemPrice = CustPricingRecord.Price;
//         } else {
//           switch (CustPricingRecord.Price_Level) {
//             case 1:
//               ItemPrice = item.Price1 ?? 0;
//               break;
//             case 2:
//               ItemPrice = item.Price2 ?? 0;
//               break;
//             case 3:
//               ItemPrice = item.Price3 ?? 0;
//               break;
//             case 4:
//               ItemPrice = item.Price4 ?? 0;
//               break;
//             case 5:
//               ItemPrice = item.Price5 ?? 0;
//               break;
//             case 6:
//               ItemPrice = item.Price6 ?? 0;
//               break;
//             case 9:
//               ItemPrice = item.BaseCost ?? 0;
//               break;
//             case 8:
//               ItemPrice = item.NetCost ?? 0;
//               break;
//             case 7:
//               ItemPrice = item.InvoiceCost ?? 0;
//               break;
//           }

//           if ((CustPricingRecord.Price_Adjustment ?? 0) !== 0) {
//             if (CustPricingRecord.Price_Adj_Pct) {
//               ItemPrice += Number(
//                 ((ItemPrice * CustPricingRecord.Price_Adjustment) / 100).toFixed(
//                   2
//                 )
//               );
//             } else {
//               ItemPrice += CustPricingRecord.Price_Adjustment;
//             }
//           }
//         }
//       }
//     }

//     return ItemPrice;
//   }

// async  calculateTimeDifferences(
//   routeNumber: number | null,
//   dateTime: Date | null
// ) {
//   if (!routeNumber || !dateTime) return [];

//   const dateOnly = moment(dateTime).format('YYYY-MM-DD');

//   const driverLocations = await SaasDriverLocation.findAll({
//     where: {
//       RouteNumber: routeNumber,
//       LocationTime: {
//         [Op.gte]: new Date(`${dateOnly}T00:00:00`),
//         [Op.lt]: new Date(`${dateOnly}T23:59:59`),
//       },
//     },
//     order: [['StopNumber', 'ASC']],
//     raw: true,
//   });

//   const result: any[] = [];

//   const grouped = driverLocations.reduce((acc, loc) => {
//     const stop = loc.StopNumber ?? 0;
//     if (!acc[stop]) acc[stop] = [];
//     acc[stop].push(loc);
//     return acc;
//   }, {} as Record<number, any[]>);

//   const orderTimes: {
//     StopNumber: number;
//     OutForDeliveryTime: Date | null;
//     ArrivedTime: Date | null;
//     DeliveredTime: Date | null;
//   }[] = [];

//   for (const stopNumber in grouped) {
//     const group = grouped[stopNumber];

//     const outForDelivery = group.find((x) => x.StatusMessage?.trim() === 'OutForDelivery')?.LocationTime ?? null;
//     const arrivedGroup = group.filter((x) => x.StatusMessage?.trim() === 'Arrived');
//     const deliveredGroup = group.filter((x) => x.StatusMessage?.trim() === 'Delivered');

//     const arrived = arrivedGroup.length ? arrivedGroup.map((x) => x.LocationTime).sort()[0] : null;
//     const delivered = deliveredGroup.length ? deliveredGroup.map((x) => x.LocationTime).sort().reverse()[0] : null;

//     if (outForDelivery && arrived && delivered) {
//       orderTimes.push({
//         StopNumber: Number(stopNumber),
//         OutForDeliveryTime: outForDelivery,
//         ArrivedTime: arrived,
//         DeliveredTime: delivered,
//       });
//     }
//   }

//   if (orderTimes.length === 0) return result;

//   for (let i = 0; i < orderTimes.length; i++) {
//     const { StopNumber, OutForDeliveryTime, ArrivedTime, DeliveredTime } = orderTimes[i];

//     if (i === 0) {
//       if (OutForDeliveryTime && ArrivedTime) {
//         result.push({
//           StopNumber,
//           RouteTimeDifference: formatTimeSpan(moment(ArrivedTime).diff(moment(OutForDeliveryTime))),
//           StoreTimeDifference: null,
//         });
//       }

//       if (ArrivedTime && DeliveredTime && result.length > 0) {
//         result[0].StoreTimeDifference = formatTimeSpan(moment(DeliveredTime).diff(moment(ArrivedTime)));
//       }
//     } else {
//       const prevDelivered = orderTimes[i - 1].DeliveredTime;
//       if (prevDelivered && ArrivedTime) {
//         result.push({
//           StopNumber,
//           RouteTimeDifference: formatTimeSpan(moment(ArrivedTime).diff(moment(prevDelivered))),
//           StoreTimeDifference: null,
//         });
//       }

//       if (ArrivedTime && DeliveredTime && result.length > 0) {
//         result[result.length - 1].StoreTimeDifference = formatTimeSpan(moment(DeliveredTime).diff(moment(ArrivedTime)));
//       }
//     }
//   }

//   return result;
// }

// async getExistingRouteNumber(){
  
//   const buildedRoutes = await SaasRoute.findAll({
//     attributes: ['RouteNumber'],
//     group: ['RouteNumber'],
//     raw: true,
//   });

//   const usedRouteNumbers = buildedRoutes.map((r) => r.RouteNumber);

//   const routeInfoList = await Route.findAll({
//     where: {
//       Route_Number: {
//         [Op.ne]: 0,
//         [Op.notIn]: usedRouteNumbers,
//       },
//     },
//     raw: true,
//   });

//   const dayNames: { [key: number]: string } = {
//     1: 'Monday',
//     2: 'Tuesday',
//     3: 'Wednesday',
//     4: 'Thursday',
//     5: 'Friday',
//     6: 'Saturday',
//     7: 'Sunday',
//   };

//   const commonRecords: any[] = routeInfoList.map((data) => {
//     const dayNumber :any = data.Route_DayOfWeek;
//     const dayName = dayNames[dayNumber] || 'Unknown';

//     return {
//       RouteNumber: data.Route_Number,
//       WeekDay: dayName,
//       DayOfWeek: dayNumber,
//       Description: `${dayName} - Route ${data.Route_Number}`,
//     };
//   });

//   return commonRecords;
// }

//  async  getAllRouteNumbers() {
//   const routes = await Route.findAll({
//     where: {
//       Route_Number: { [Op.ne]: 0 },
//     },
//     raw: true,
//   });

//   const dayNames: { [key: number]: string } = {
//     1: 'Monday',
//     2: 'Tuesday',
//     3: 'Wednesday',
//     4: 'Thursday',
//     5: 'Friday',
//     6: 'Saturday',
//     7: 'Sunday',
//   };

//   const routeInfos: any[] = routes.map((data:any) => {
//     const dayNumber = data.RouteDayOfWeek;
//     const dayName = dayNames[dayNumber] || 'N/A';

//     return {
//       RouteNumber: data.Route_Number,
//       WeekDay: dayName,
//       DayOfWeek: dayNumber,
//       Description: `${dayName} - Route ${data.Route_Number}`,
//     };
//   });

//   return routeInfos;
// }

//  async  getActiveDrivers(DriverName?: string) {
//   const whereCondition: any = {
//     RoleId: 3,
//     IsActive: true,
//     IsDeleted: false,
//   };

//   if (DriverName) {
//     whereCondition.UserName = {
//       [Op.iLike]: `%${DriverName}%`, 
//     };
//   }

//   const drivers = await SaasUser.findAll({
//     attributes: ['Id', 'UserName', 'ContactNumber'],
//     where: whereCondition,
//     raw: true,
//   });

//   return drivers.map((driver) => ({
//     DriverId: driver.Id,
//     UserName: driver.UserName,
//     ContactNumber: driver.ContactNumber,
//   }));
// }


//  async  getPaymentMode() {
//   const paymentData = await PosMediaSelection.findAll({
//     attributes: ['myId', 'Description'],
//     raw: true,
//   });

//  return paymentData
// }


//  async  getRoutes(query:PaginationOptions) {
//   const {page =1, perPage=10} = query
//   const offset = (page - 1) * perPage;
//   const limit = perPage;

//   // Total records
//   const totalRecords = await Route.count({
//     where: {
//       Route_Number: { [Op.ne]: 0 },
//     },
//   });

//   // Main paginated join query
//   const routes = await Route.findAll({
//     where: {
//       Route_Number: { [Op.ne]: 0 },
//     },
//     include: [
//       {
//         model: SaasRoute,
//         as: 'SaasRoute',
//         required: false, 
//         attributes: ['DriverId'],
//       },
//     ],
//     attributes: ['RouteNumber', 'RouteDayOfWeek'],
//     offset,
//     limit,
//     raw: true,
//   });

//   const dayMap: { [key: number]: string } = {
//     1: 'Monday',
//     2: 'Tuesday',
//     3: 'Wednesday',
//     4: 'Thursday',
//     5: 'Friday',
//     6: 'Saturday',
//     7: 'Sunday',
//   };

//   const routeinfolist: any[] = routes.map((r:any) => ({
//     RouteNumber: r.RouteNumber,
//     WeekDay: dayMap[r.RouteDayOfWeek] || 'Unknown',
//     DriverId: (r as any)['SaasRoute.DriverId'] ?? null,
//   }));

//   return {
//     routeinfolist,
//     TotalRecords: totalRecords,
//   };
// }


//  async  getRouteList(routeNumber?: number) {
//   const whereClause = routeNumber ? { RouteNumber: routeNumber } : {};

//   const routes = await SaasRoute.findAll({
//     attributes: ['Id', 'RouteNumber', 'From', 'To'],
//     where: whereClause,
//     raw: true,
//   });

//   const mappedRoutes: any[] = routes.map((r:any) => ({
//     id: r.Id,
//     RouteNumber: r.RouteNumber,
//     From: r.From,
//     To: r.To,
//   }));

//   return mappedRoutes;
// }

// async getStopsBaseOnRoute(query:PaginationOptions){
//   const{id,routeNumber} = query
//   const stops = await CustomerRoute.findAll({
//     where: {
//       Route_Number: routeNumber,
//     },
//     include: [
//       {
//         model: SaasRouteStop,
//         as: 'RouteStop',
//         required: false,
//         where: id ? { Id: id } : undefined,
//       },
//     ],
//     order: [['Stop_Number', 'ASC']],
//     raw: true,
//   });
//   return stops;
// }

//  async  getDriverRoutes(DriverId: number) {
//  const dayOfWeek = getWeekdayValue(moment().add(7, 'days').day());
//   const routes = await SaasRoute.findAll({
//     include: [
//       {
//         model: Route,
//         as: 'Route',
//         required: true,
//         where: {
//           RouteDayOfWeek: dayOfWeek,
//         },
//         attributes: [],
//       },
//     ],
//     where: {
//       DriverId: DriverId,
//     },
//     attributes: ['RouteNumber'],
//     raw: true,
//   });

// return routes
// }

//  async  assignDriverToRoute(driverInfo: IRouteAssignmentRequest) {
//   const { routeNumber, driverId, byUserId, weekday } = driverInfo;

//   const route = await SaasRoute.findOne({
//     where: { RouteNumber: routeNumber },
//   });

//   if (driverId === 0) {
//     const existingDriver = await SaasDriverAssignRoute.findOne({
//       where: { RouteNumber: routeNumber, DayOfWeek: weekday },
//     });

//     if (existingDriver) {
//       if (route) {
//         route.DriverId = null;
//         await route.save();
//       }
//       await existingDriver.destroy();
//       return true
//     }
//   }

//   const existingAssignment = await SaasDriverAssignRoute.findOne({
//     where: { DriverId: driverId, DayOfWeek: weekday },
//   });

//   if (existingAssignment) {
//     throw new AppError(Manager.DRIVER_ALREADY_ASSIGN,400)
//   }

//   // Create or update SaasRoute
//   if (route) {
//     route.DriverId = driverId;
//     await route.save();
//   } else {
//     await SaasRoute.create({
//       RouteNumber: routeNumber,
//       DriverId: driverId,
//     });
//   }

//   // Update or create SaasDriverAssignRoute
//   const driverAssignRoute = await SaasDriverAssignRoute.findOne({
//     where: { RouteNumber: routeNumber },
//   });

//   if (driverAssignRoute) {
//     driverAssignRoute.DriverId = driverId;
//     driverAssignRoute.AssignedBy = byUserId;
//     driverAssignRoute.DayOfWeek = weekday;
//     await driverAssignRoute.save();
//   } else {
//     await SaasDriverAssignRoute.create({
//       RouteNumber: routeNumber,
//       DriverId: driverId,
//       AssignedBy: byUserId,
//       DayOfWeek: weekday,
//     });
//   }

//   return true
// }

//  async  driverCurrentLocation(body:IDriverCurrentLocation) {
//   const {ordernumber,stopnumber} = body
//   if (!ordernumber || !stopnumber) {
//     throw new AppError(SalesMessage.OLD_NUMBER_SALES_NUMBER,400)
//   }

//   const result :any = await SaasDroOrderStatus.findOne({
//     where: { OrderNumber: ordernumber },
//     include: [
//       {
//         model: OrderHeader,
//         as: 'OrderHeader',
//         required: true,
//         include: [
//           {
//             model: SaasRoute,
//             as: 'Route',
//             required: true,
//             include: [
//               {
//                 model: SaasRouteStop,
//                 as: 'RouteStops',
//                 required: true,
//                 where: { StopNumber: stopnumber },
//               },
//             ],
//           },
//         ],
//       },
//     ],
//     raw: true,
//   });

//   const driverId = result ? result['OrderHeader.Route.DriverId'] ?? 0 : 0;

//   await SaasDriverLocation.create({
//     OrderNumber: ordernumber,
//     StopNumber: stopnumber,
//     DriverId: driverId,
//     Date: new Date(),
//   });

//   return true
// }


//  async  deleteRoute(routeNumber: number){
//   try {
//     // Delete from SaasDriverAssignRoutes
//     await SaasDriverAssignRoute.destroy({
//       where: { RouteNumber: routeNumber },
//     });

//     // Delete from SaasRouteStops
//     await SaasRouteStop.destroy({
//       where: { RouteNumber: routeNumber },
//     });

//     // Delete from SaasRoutes where Id == routeNumber
//     const route = await SaasRoute.findOne({ where: { Id: routeNumber } });

//     if (route) {
//       await route.destroy();
//       return true;
//     }

//     return false;
//   } catch (error) {
//     throw new AppError(General.SOMETHING_WENT_WRONG,500)
//   }
// }


//  async  deleteStop(stopId: number) {
//     const stop = await SaasRouteStop.findOne({ where: { Id: stopId } });
//     if (stop) {
//       await stop.destroy();
//       return true;
//     }
//     return false;
// }

//  async  updateStopsOrder(editStop: UpdateRouteStopsRequest){
//   const stopIds = editStop.updateStops.map((us) => us.stopId);
//   const stopList = await SaasRouteStop.findAll({
//     where: { Id: stopIds },
//   });

//   if (stopList.length === 0) {
//     throw new  AppError(SalesMessage.OLD_NUMBER_SALES_NUMBER,400)
//   }

//   // Update stop numbers
//   for (const update of editStop.updateStops) {
//     const stopToUpdate = stopList.find((s) => s.Id === update.stopId);
//     if (stopToUpdate) {
//       stopToUpdate.StopNumber = update.updatedStopNo;
//       await stopToUpdate.save();
//     }
//   }

//   try {
//     const allStops = await SaasRouteStop.findAll({
//       where: { RouteNumber: editStop.routeNumber },
//       order: [['StopNumber', 'ASC']],
//     });

//     const firstStop :any = allStops[0];
//     const lastStop :any = allStops[allStops.length - 1];

//     const updateFromAndTo = await SaasRoute.findOne({
//       where: { RouteNumber: editStop.routeNumber },
//     });

//     if (updateFromAndTo) {
//       const updatedStopNumbers = editStop.updateStops.map((u) => u.updatedStopNo);

//       if (firstStop && updatedStopNumbers.includes(firstStop.StopNumber)) {
//         updateFromAndTo.From = firstStop.StopName;
//       }

//       if (lastStop && updatedStopNumbers.includes(lastStop.StopNumber)) {
//         updateFromAndTo.To = lastStop.StopName;
//       }

//       await updateFromAndTo.save();
//     }

//     return true
//   } catch (error) {
//     console.error('Error updating stops:', error);
//     throw new AppError(General.SOMETHING_WENT_WRONG,400)
//   }
// }

//  async  addEditStops(routeStops: EditAddRouteStopAddress[]) {
//   if (!routeStops || routeStops.length === 0) {
//     throw new AppError(SalesMessage.NO_STOP,400)
//   }

//   const routeNumbers = [...new Set(routeStops.map(rs => rs.routeNumber))];

//   const existingStops = await SaasRouteStop.findAll({
//     where: { RouteNumber: routeNumbers },
//   });

//   const existingRoutes = await SaasRoute.findAll({
//     where: { RouteNumber: routeNumbers },
//   });

//   for (const routeStop of routeStops) {
//     const existingStop = existingStops.find(c => c.Id === routeStop.id);

//     if (existingStop) {
//       // Update existing stop
//       existingStop.Address = routeStop.address;
//       existingStop.City = routeStop.city;
//       existingStop.State = routeStop.state;
//       existingStop.ZipCode = routeStop.zipCode;
//       existingStop.RouteNumber = routeStop.routeNumber;
//       existingStop.StopName = routeStop.stopName;
//       existingStop.StopNumber = routeStop.stopNumber;
//       existingStop.AddedBy = routeStop.addedBy;

//       if (!routeStop.latitude || !routeStop.longitude) {
//         const coords :any = await getCoordinatesAsync(routeStop.address, routeStop.city, routeStop.state, routeStop.zipCode);
//         existingStop.Latitude = coords.Latitude;
//         existingStop.Longitude = coords.Longitude;
//       } else {
//         existingStop.Latitude = routeStop.latitude;
//         existingStop.Longitude = routeStop.longitude;
//       }

//       await existingStop.save();
//     } else {
//       // Add new stop
//       if (!routeStop.latitude || !routeStop.longitude) {
//         const coords:any = await getCoordinatesAsync(routeStop.address, routeStop.city, routeStop.state, routeStop.zipCode);
//         routeStop.latitude = coords.Latitude;
//         routeStop.longitude = coords.Longitude;
//       }

//       const newStop = await SaasRouteStop.create({
//         Address: routeStop.address,
//         City: routeStop.city,
//         State: routeStop.state,
//         ZipCode: routeStop.zipCode,
//         RouteNumber: routeStop.routeNumber,
//         StopName: routeStop.stopName,
//         StopNumber: routeStop.stopNumber,
//         AddedBy: routeStop.addedBy,
//         Latitude: routeStop.latitude,
//         Longitude: routeStop.longitude,
//       });

//       existingStops.push(newStop);
//     }
//   }

//   for (const routeNumber of routeNumbers) {
//     const stopsForRoute :any = existingStops.filter(s => s.RouteNumber === routeNumber);
//     if (stopsForRoute.length === 0) continue;

//     const route = existingRoutes.find(r => r.RouteNumber === routeNumber);
//     const first = Math.min(...stopsForRoute.map((s:any) => s.StopNumber));
//     const last = Math.max(...stopsForRoute.map((s:any) => s.StopNumber));

//     const fromStop = stopsForRoute.find((s:any) => s.StopNumber === first)?.StopName;
//     const toStop = stopsForRoute.find((s:any) => s.StopNumber === last)?.StopName;

//     if (!route) {
//       await SaasRoute.create({
//         RouteNumber: routeNumber,
//         From: fromStop,
//         To: toStop,
//       });
//     } else {
//       route.From = fromStop ?? route.From;
//       route.To = toStop ?? route.To;
//       await route.save();
//     }
//   }

//   return true
// }


//  async  buildRoute(buildRoute: DriverRouteAssignmentRequest) {
//   const stops = await SaasRouteStop.findAll({
//     where: {
//       RouteNumber: null,
//       AddedBy: buildRoute.byUserId,
//     },
//     order: [['Id', 'ASC']],
//   });

//   if (!stops.length) {
//     throw new AppError(SalesMessage.NO_STOP,400)
//   }

//   const lastStopNo = Math.max(...stops.map((s) => s.StopNumber || 0));
//   let count = 1;

//   for (let i = 0; i < stops.length; i++) {
//     stops[i].StopNumber = count === 1
//       ? 1
//       : (count === stops.length ? lastStopNo : count - 1);

//     await stops[i].save();
//     count++;
//   }

//   const fromStop = stops.find((s) => s.StopNumber === 1)?.StopName || '';
//   const toStop = stops.find((s) => s.StopNumber === lastStopNo)?.StopName || '';

//   const newRoute = await SaasRoute.create({
//     RouteNumber: buildRoute.routeNumber,
//     From: fromStop,
//     To: toStop,
//   });

//   for (const stop of stops) {
//     stop.RouteNumber = newRoute.RouteNumber;
//     await stop.save();
//   }
//   return true
// }

//  async  saveDriverLocation(driverLocation: SaveDriverLocationUpdateRequest) {
//   try {
//     const { statusMessage, orderStatuses, driverId, latitude, longitude, locationTime, routeNumber } = driverLocation;

//     if (statusMessage) {
//       for (const item of orderStatuses) {
//         const orderDetail :any = await OrderHeader.findOne({
//           where: { OrderNumber: item.orderNUmber },
//         });

//         const model = await SaasDriverLocation.create({
//           StopNumber: orderDetail?.StopNumber ?? null,
//           DriverId: driverId,
//           Latitude: latitude,
//           Longitude: longitude,
//           LocationTime: locationTime,
//           RouteNumber: routeNumber,
//           OrderNumber: item.orderNUmber,
//           StatusMessage: statusMessage,
//           Date: new Date(), 
//         });
//       }
//     } else {
//       const today = new Date();
//       const startOfDay = new Date(today.setHours(0, 0, 0, 0));

//       const driverLocationInfo = await SaasDriverLocation.findAll({
//         where: {
//           DriverId: driverId,
//           RouteNumber: routeNumber,
//           LocationTime: { [Op.not]: null },
//           StatusMessage: {
//             [Op.notIn]: ['Delivered', 'OutForDelivery'],
//           },
//           Date: {
//             [Op.gte]: startOfDay,
//           },
//         },
//       });

//       let locationNumber = driverLocationInfo.length === 0 ? 1 : driverLocationInfo.length - 1;

//       for (const item of orderStatuses) {
//         await SaasDriverLocation.create({
//           DriverId: driverId,
//           Latitude: latitude,
//           Longitude: longitude,
//           LocationTime: locationTime,
//           OrderNumber: item.orderNUmber,
//           RouteNumber: routeNumber,
//           StatusMessage: `Location_${locationNumber}`,
//           Date: new Date(),
//         });
//       }
//     }

//     return true
//   } catch (error) {
//     return false
//   }
// }

//  async  getDriverTimeInfos(driverId: number){
//   const today = moment().startOf('day');
//   const driverTimeInfos: any = {
//     driverId: driverId,
//     timeTrackForRoutes: [],
//     TimeForAllDeliveries: '00:00:00',
//   };

//   // Get all driver locations for today
//   const driverLocations = await SaasDriverLocation.findAll({
//     where: {
//       DriverId: driverId,
//       LocationTime: {
//         [Op.gte]: today.toDate(),
//         [Op.lt]: moment(today).endOf('day').toDate(),
//       },
//     },
//     raw: true,
//   });

//   // OutForDelivery and Delivered timestamps
// const outForDeliveryTimes = driverLocations
//   .filter(d => d.StatusMessage?.includes('OutForDelivery'))
//   .sort((a, b) => moment(a.LocationTime).diff(moment(b.LocationTime)))
//   .map(d => moment(d.LocationTime));


// const deliveredTimes = driverLocations
//   .filter(d => d.StatusMessage?.includes('Delivered'))
//   .sort((a, b) => moment(a.LocationTime).diff(moment(b.LocationTime)))
//   .map(d => moment(d.LocationTime));


//   // Total delivery time across all orders
// let totalDeliveryTime = 0;
// for (let i = 0; i < outForDeliveryTimes.length && i < deliveredTimes.length; i++) {
//   totalDeliveryTime += deliveredTimes[i].diff(outForDeliveryTimes[i]); // in milliseconds
// }


//   driverTimeInfos.TimeForAllDeliveries = convertMillisecondsToTimestamp(totalDeliveryTime);

//   // Get routes assigned to driver today
//   const dayOfWeek = moment().isoWeekday(); // Monday = 1, Sunday = 7
//   const assignedRoutes = await SaasDriverAssignRoute.findAll({
//     where: {
//       DriverId: driverId,
//       DayOfWeek: dayOfWeek,
//     },
//     raw: true,
//   });

//   for (const route of assignedRoutes) {
//     const routeDriverLocations :any = driverLocations.filter(l => l.RouteNumber === route.RouteNumber);

//     // Calculate time span between first and last location
//     let totalRouteTime = 0;
//     if (routeDriverLocations.length > 1) {
//       const first = new Date(routeDriverLocations[0].LocationTime);
//       const last = new Date(routeDriverLocations[routeDriverLocations.length - 1].LocationTime);
//       totalRouteTime = last.getTime() - first.getTime();
//     }

//    const timeTrackForRoute: TimeTrackForRoute = {
//   routeNumber: route.RouteNumber,
//   RouteNumberTimestamp: convertMillisecondsToTimestamp(totalRouteTime),
//   timeTrackForStops: [], // ✅ Correctly typed
// };


//     // Join routeDriverLocations with SaasRouteStops
//     const routeStops = await SaasRouteStop.findAll({
//       where: { RouteNumber: route.RouteNumber },
//       raw: true,
//     });

//     const locationStops = routeDriverLocations.filter(loc => loc.StatusMessage?.includes('Location'));
//     const deliveredStops = routeDriverLocations.filter(loc => loc.StatusMessage?.includes('Delivered'));

//     for (const loc of locationStops) {
//       const startTime = new Date(loc.LocationTime);
//       const matchingDelivered = deliveredStops
//         .filter(d => new Date(d.LocationTime) >= startTime)
//         .sort((a, b) => new Date(a.LocationTime).getTime() - new Date(b.LocationTime).getTime())[0];

//       if (matchingDelivered) {
//         const stopMeta = routeStops.find(r => r.StopNumber === loc.StopNumber);
//        if (stopMeta) {
//   const stopTime = moment(matchingDelivered.LocationTime).diff(moment(startTime));
//   timeTrackForRoute.timeTrackForStops.push({
//     stopNumber: stopMeta.StopNumber,
//     StopNumberTimestamp: convertMillisecondsToTimestamp(stopTime),
//   });
// }

//       }
//     }

//     driverTimeInfos.timeTrackForRoutes.push(timeTrackForRoute);
//   }

//   return driverTimeInfos;
// }

//  async  getDriverLocation(driverId: number) {
//   const driverLocationRecord = await SaasDriverCurrentLocation.findOne({
//     where: { DriverId: driverId },
//     raw: true,
//   });

//   if (!driverLocationRecord) {
//     return {
//       driverId: driverId,
//       latitude: '33.6696021',
//       longitude: '-82.1729582',
//     };
//   }

//   return {
//     driverId: driverLocationRecord.DriverId,
//     latitude: driverLocationRecord.Latitude ?? '33.6696021',
//     longitude: driverLocationRecord.Longitude ?? '-82.1729582',
//   };
// }


//  async  getOrderStatusSummary(customerCID: number, year: number) {
//   const startDate = moment(`${year}-01-01`).startOf('day').toDate();
//   const endDate = moment(`${year + 1}-01-01`).startOf('day').toDate();

//   // Pending Orders
// const pendingOrders = await OrderHeader.findAll({
//   where: {
//     CNumber: customerCID,
//     OrderDate: {
//       [Op.gte]: startDate,
//       [Op.lt]: endDate,
//     },
//   },
//   include: [
//     {
//       model: SaasDroOrderStatus,
//       required: false,
//     },
//   ],
//   attributes: ['OrderNumber', 'InvoiceNumber', 'TrackingNumber'],
//   raw: true,
// });

// const pendingOrderCount = pendingOrders.filter((b: any) => {
//   const invoicePrinted = b.InvoiceNumber ? 1 : 0;
//   const outForDelivery = b.TrackingNumber ? 1 : 0;
//   const deliveryType = b['SaasDroOrderStatus.DeliveryType'] || null;

//   return (
//     invoicePrinted === 0 ||
//     (invoicePrinted === 1 && outForDelivery !== 1 && deliveryType === 'shipping')
//   );
// }).length;


//   // Completed Orders
//   const completedOrderRaw = await OrderHeader.findAll({
//     where: {
//       CNumber: customerCID,
//       OrderDate: {
//         [Op.gte]: startDate,
//         [Op.lt]: endDate,
//       },
//     },
//     include: [
//       {
//         model: SaasDroOrderStatus,
//         required: true,
//       },
//     ],
//     attributes: ['OrderNumber', 'InvoiceNumber', 'TrackingNumber', 'OrderDate', [col('SaasDroOrderStatus.DeliveryType'), 'DeliveryType']],
//     raw: true,
//   });

//   const completedOrderCount = completedOrderRaw.filter((o:any) =>
//     o.InvoiceNumber &&
//     (o['DeliveryType'] === 'pickup' || (o.TrackingNumber && o.TrackingNumber.trim() !== ''))
//   ).length;

//   // Total Orders
//   const totalOrderCount = await OrderHeader.count({
//     where: {
//       CNumber: customerCID,
//       OrderDate: {
//         [Op.gte]: startDate,
//         [Op.lt]: endDate,
//       },
//     },
//     distinct: true,
//     col: 'OrderNumber',
//   });

//   // Accounts Receivable
//   const arRecords = await CustReceivable.findAll({
//     where: { CNumber: customerCID },
//     attributes: ['AR_Amount', 'AR_Applied'],
//     raw: true,
//   });

//   const currentDue = arRecords.reduce((total, r:any) => {
//     const due = (r.ArAmount ?? 0) - (r.ArApplied ?? 0);
//     return total + due;
//   }, 0);

//   return {
//     PendingOrderCount: pendingOrderCount,
//     CompletedOrderCount: completedOrderCount,
//     TotalOrderCount: totalOrderCount,
//     Currentdue: currentDue,
//   };
// }


//  async  getOrderSummary(customerCID: number, year: number) {
//   const fromDate = new Date(`${year}-01-01`);
//   const toDate = new Date(`${year}-12-31`);

//   // Get matching orders with their details
//   const orders :any = await OrderHeader.findAll({
//     where: {
//       OrderDate: {
//         [Op.gte]: fromDate,
//         [Op.lte]: toDate,
//       },
//       ...(customerCID !== 0 ? { CNumber: customerCID } : {}),
//     },
//     include: [
//       {
//         model: OrderDetail,
//         required: false, // LEFT JOIN
//       },
//     ],
//     raw: true,
//   });

//   // Group by month and calculate totals
//   const grouped: { [month: number]: OrderSummary } = {};

 
// for (const record of orders) {
//   const month = moment(record.OrderDate).month() + 1; // month() is 0-based → add 1

//   if (!grouped[month]) {
//     grouped[month] = {
//       OrderMonth: month,
//       TotalOrders: new Set(),
//       TotalPriceInK: 0,
//     } as any;
//   }

//   const deliveryCharge = record.DeliveryCharge ?? 0;
//   const price = record['OrderDetails.Price'] ?? 0;
//   const otpState = record['OrderDetails.OtpAmountState'] ?? 0;
//   const otpCity = record['OrderDetails.OtpAmountCity'] ?? 0;
//   const otpCounty = record['OrderDetails.OtpAmountCounty'] ?? 0;
//   const prepaidTax = record['OrderDetails.PrepaidTaxAmount'] ?? 0;
//   const quantity = record['OrderDetails.QuantityOrdered'] ?? 0;

//   const totalLineAmount = (price + otpState + otpCity + otpCounty + prepaidTax) * quantity;

//   grouped[month].TotalPriceInK += deliveryCharge + totalLineAmount;
//   (grouped[month].TotalOrders as Set<number>).add(record.OrderNumber);
// }

//   // Convert sets to counts and divide by 1000
//   const result: any[] = Object.values(grouped).map((g) => ({
//     OrderMonth: g.OrderMonth,
//     TotalOrders: (g.TotalOrders as Set<any>).size,
//     TotalPriceInK: Number((g.TotalPriceInK / 1000).toFixed(2)),
//   }));

//   return result;
// }

//  async  promotionalProducts(request:ProductPramotionRequest) {
//   const hostURL = process.env.HOST_URL;
//   const useMasterImage = process.env.MASTER_IMAGE_URL;
//   const productFolder = process.env.PRODUCT_IMAGE_FOLDER;

//   const StartRecordIndex = request.page > 1 ? (request.page - 1) * request.perPage : 0;
//   const today = new Date();

//   const inventorySpecials = await InventorySpecial.findAll({
//     where: {
//       [Op.and]: [
//         { [Op.or]: [{ Price: { [Op.ne]: 0 } }, { Allowance: { [Op.ne]: 0 } }] },
//         {
//           [Op.or]: [
//             { Start_Date: { [Op.lte]: today }, End_Date: { [Op.gte]: today } },
//             { Perpetual: true },
//           ],
//         },
//       ],
//     },
//   });

//   const customer :any = await Customer.findOne({ where: { C_Number: request.customerNumber } });
//   const CustomerGroups = await CustomerSpecialGroup.findAll({
//     where: { CNumber: request.customerNumber },
//     attributes: ['Special_GroupId'],
//     raw: true,
//   });

//   const customerGroupIds = CustomerGroups.map((g) => g.Special_GroupId);

//   // Build base query conditions
//   const baseWhere = {
//     IInactive: false,
//     ShortOrderForm: true,
//     IDiscontinued: { [Op.ne]: true },
//   };

//   if (request.upcNumber) {
//     // ... build UPC-specific query (not shown for brevity)
//   }

//   let products = await Inventory.findAll({
//     where: baseWhere,
//     include: [
//       {
//         model: InventorySpecial,
//         required: true,
//         where: {
//           PromoActive: true,
//           [Op.or]: [
//             { Perpetual: true },
//             { StartDate: { [Op.lte]: today }, EndDate: { [Op.gte]: today } },
//           ],
//           [Op.or]: [
//             { SpecialGroupId: 0 },
//             { SpecialGroupId: { [Op.in]: customerGroupIds } },
//           ],
//         },
//       },
//       {
//         model: InventoryUpc,
//         where: { Status: 0, Priority: 1 },
//         required: false,
//         include: [
//           {
//             model: SaasProductImage,
//             required: false,
//           },
//         ],
//       },
//     ],
//   });

//   // Category filtering
//   for (let i = 1; i <= 12; i++) {
//     const prop = `CategoryAllow${i.toString().padStart(2, '0')}`;
//     if (!customer[prop]) {
//       products = products.filter((p) => p.Sales_Category !== i);
//     }
//   }

//   // Blocked Items
//   const BlockedItems = await CustAuthorized.findAll({
//     where: {
//       CNumber: request.customerNumber,
//       ItemOption: 99,
//     },
//     attributes: ['ItemNumber'],
//   });
//   const blockedItemIds = BlockedItems.map((b) => b.ItemNumber);
//   products = products.filter((p) => !blockedItemIds.includes(p.ItemNumber));

//   // Search logic
//   if (request.searchKeyword) {
//     await SaasSearchHistory.create({
//       CurrentDate: new Date(),
//       SearchKeyword: request.searchKeyword,
//       CustomerCid: request.customerNumber,
//       Timestamp: new Date(),
//       SearchType: 'P',
//     });

//     const keyword = request.searchKeyword.trim();
//     if (keyword.endsWith('*')) {
//       const term = keyword.slice(0, -1);
//       products = products.filter((p) => p.Description?.includes(term));
//     } else {
//       const term = keyword.replace(/\s/g, '').toLowerCase();
//       products = products.filter((p) => p.Description?.replace(/\s/g, '').toLowerCase().startsWith(term));
//     }
//   }

//   // Item Number filter
//   if (request.itemNumber) {
//     await SaasSearchHistory.create({
//       CurrentDate: new Date(),
//       SearchItemKeyword: request.itemNumber.toString(),
//       CustomerCid: request.customerNumber,
//       Timestamp: new Date(),
//       SearchType: 'P',
//     });

//     products = products.filter((p) => p.ItemNumber === request.itemNumber);
//   }

//   if (request.salesCategory && request.salesCategory !== 0) {
//     products = products.filter((p) => p.SalesCategory === request.salesCategory);
//   }

//   // Pagination
//   const totalRecords = products.length;
//   products = products.sort((a, b) => (a.Description ?? '').localeCompare(b.Description ?? '')).slice(StartRecordIndex, StartRecordIndex + request.perPage);

//   const promo = await Promise.all(
//     products.map(async (item) => {
//       const ProductPrice1 = await this.SetEffectivePrice(request.customerNumber, item.ItemNumber, customer);
//       const updatedPrice:any = this.CalculateDiscount(request.customerNumber, item.ItemNumber, 1, ProductPrice1, inventorySpecials);

//       return {
//         ...item.toJSON(),
//         ProductPrice1: updatedPrice.UpdatedProductPrice1,
//         PerUnitePrice: updatedPrice.UpdatedProductPrice1,
//         ProductDiscount: updatedPrice.UpdatedDiscount,
//         DepositAmount: updatedPrice.DepositAmount,
//       };
//     })
//   );

//   const taxedPromo = this.CalculateTax(customer, promo);

//   return {
//     TotalRecords: totalRecords,
//     Promo: taxedPromo,
//   };
// }


// async  getRouteNameByDriverId(driverId: number, deliveryDate: Date) {
//   const dayName = deliveryDate.toLocaleString('en-US', { weekday: 'long' });
//   const dayOfWeek = getWeekdayValue(dayName);

//   const routeData :any = await SaasRoute.findAll({
//     where: { DriverId: driverId },
//     include: [
//       {
//         model: SaasRouteStop,
//         required: true,
//       },
//       {
//         model: Route,
//         where: { RouteDayOfWeek: dayOfWeek },
//         required: true,
//         attributes: ['RouteNumber', 'From', 'To'],
//       },
//     ],
//     attributes: ['RouteNumber'],
//     raw: true,
//   });

//   // Group and map
//   const groupedRoutes: { [key: string]: { RouteNumber: number; RouteName: string } } = {};
//   for (const r of routeData) {
//     const routeNumber = r['Route.RouteNumber'];
//     if (!groupedRoutes[routeNumber]) {
//       groupedRoutes[routeNumber] = {
//         RouteNumber: routeNumber,
//         RouteName: `${r['Route.From']} to ${r['Route.To']}`,
//       };
//     }
//   }

//   return Object.values(groupedRoutes);
// }

// async  getDriverList(query:PaginationOptions){
//   const {page=1,perPage=10} = query;
//   const offset = (page - 1) * perPage;
//   const limit = perPage;

//   const { rows, count } = await SaasUser.findAndCountAll({
//     where: {
//       IsDeleted: { [Op.ne]: true },
//       IsActive: true,
//     },
//     include: [
//       {
//         model: SaasUserRole,
//         required: true,
//         where: {
//           RoleName: 'driver',
//         },
//         attributes: [],
//       },
//     ],
//     attributes: [
//       ['FirstName', 'DriverName'],
//       ['Id', 'DriverId'],
//     ],
//     offset,
//     limit,
//     raw: true,
//   });

//   return {
//     DriverList: rows as [],
//     TotalRecords: count,
//   };
// }

// async  getDriverWiseRoutes(query:PaginationOptions) {
//   const {page=1,perPage=10,driverId} = query
//   const offset = (page - 1) * perPage;

//   const rawResults = await SaasDriverLocation.findAll({
//     attributes: [
//       [fn('DATE', col('LocationTime')), 'Date'],
//       [col('User.FirstName'), 'DriverName'],
//       [col('DriverId'), 'DriverId'],
//       [col('Route.RouteNumber'), 'RouteNumber'],
//       [col('Route.From'), 'From'],
//       [col('Route.To'), 'To'],
//     ],
//     include: [
//       {
//         model: SaasRoute,
//         as: 'Route',
//         required: true,
//         attributes: [],
//       },
//       {
//         model: SaasUser,
//         as: 'User',
//         required: true,
//         attributes: [],
//       },
//     ],
//     where: {
//       DriverId: driverId,
//     },
//     group: [
//       fn('DATE', col('LocationTime')),
//       col('User.FirstName'),
//       col('Route.RouteNumber'),
//       col('Route.From'),
//       col('Route.To'),
//       col('DriverId')
//     ],
//     order: [[fn('DATE', col('LocationTime')), 'DESC']],
//     offset,
//     limit: perPage,
//     raw: true,
//   });

//   const totalCountResult = await SaasDriverLocation.findAll({
//     attributes: [
//       [fn('DATE', col('LocationTime')), 'Date'],
//     ],
//     include: [
//       {
//         model: SaasRoute,
//         as: 'Route',
//         required: true,
//         attributes: [],
//       },
//       {
//         model: SaasUser,
//         as: 'User',
//         required: true,
//         attributes: [],
//       },
//     ],
//     where: {
//       DriverId: driverId,
//     },
//     group: [
//       fn('DATE', col('LocationTime')),
//       col('User.FirstName'),
//       col('Route.RouteNumber'),
//       col('Route.From'),
//       col('Route.To'),
//       col('DriverId')
//     ],
//     raw: true,
//   });

//   return {
//     DriverRoutes: rawResults,
//     TotalRecords: totalCountResult.length,
//     CurrentPage: page,
//     PageSize: perPage,
//   };
// }

// //helper function
//   async CalculateDiscount(
//     CNumber: number,
//     productId: number,
//     productQuantity: number,
//     ProductPrice1: number,
//     inventorySpecials: any[]
//   ) {
//     const today = new Date();

//     const CustomerDetails = await Customer.findOne({ where: { C_Number:CNumber } });
//     if (!CustomerDetails) throw new AppError(Manager.CUSTOMER_NOT_FOUND, 400);
//     const InventoryDetails = await Inventory.findOne({
//       where: { ItemNumber: productId },
//     });

//     let productDiscount = 0;
//     let updatedPrice: UpdatedDiscountedPrice = {
//       UpdatedDiscount: 0,
//       UpdatedProductPrice1: ProductPrice1,
//       DepositAmount: 0,
//     };

//     if (!InventoryDetails) {
//       throw new AppError(
//         `Inventory not found for productId: ${productId}`,
//         400
//       );
//     }

//     const CustPricings = await CustPricing.findOne({
//       where: {
//         C_Number:CNumber,
//         Price_Class: {
//           [Op.in]: [
//             InventoryDetails.Price_Class,
//             InventoryDetails.Sales_Category + 1000,
//           ],
//         },
//       },
//     });

//     const CustomerContractPricing = await CustAuthorized.findOne({
//       where: {
//         CNumber,
//         ItemNumber: productId,
//       },
//     });

//     // 👉 Contract Pricing Logic
//     if (CustomerContractPricing) {
//       const val = CustomerContractPricing.ItemValue;
//       const option = CustomerContractPricing.ItemOption;
//       switch (option) {
//         case 0:
//           ProductPrice1 = val;
//           break;
//         case 10:
//           ProductPrice1 -= (ProductPrice1 * val) / 100;
//           break;
//         case 7:
//           ProductPrice1 -= val;
//           break;
//         case 1:
//           ProductPrice1 = InventoryDetails.Price1;
//           break;
//         case 2:
//           ProductPrice1 = InventoryDetails.Price2;
//           break;
//         case 3:
//           ProductPrice1 = InventoryDetails.Price3;
//           break;
//         case 4:
//           ProductPrice1 = InventoryDetails.Price4;
//           break;
//         case 5:
//           ProductPrice1 = InventoryDetails.Price5 ?? ProductPrice1;
//           break;
//         case 6:
//           ProductPrice1 = InventoryDetails.Price6 ?? ProductPrice1;
//           break;
//         case 13:
//           ProductPrice1 += (ProductPrice1 * val) / 100;
//           break;
//         case 14:
//           ProductPrice1 += val;
//           break;
//       }
//     } else if (
//       InventoryDetails?.Price_Subclass &&
//       InventoryDetails.Price_Subclass > 0
//     ) {
//       // 👉 Subclass Discount
//       const subclassDiscounts: any = await InventorySubclass.findAll({
//         where: {
//           Price_Subclass: InventoryDetails.Price_Subclass,
//           [Op.or]: [
//             { UnlimitedFlag: true },
//             {
//               StartDate: { [Op.lte]: today },
//               CutoffDate: { [Op.gte]: today },
//             },
//           ],
//         },
//       });

//       let maxDiscount = 0;
//       for (const item of subclassDiscounts) {
//         if (
//           CustomerDetails &&
//           (item.JurisdictionState === 0 ||
//             item.JurisdictionState === CustomerDetails.Jurisdiction_State) &&
//           (item.StateAbbrev === "--" ||
//             item.StateAbbrev === CustomerDetails.C_State)
//         ) {
//           const groups = await CustomerSpecialGroup.findAll({
//             where: { CNumber },
//             attributes: ["Special_GroupId"],
//           });
//           const groupIds = groups.map((g) => g.Special_GroupId);
//           if (
//             item.SpecialGroupId === 0 ||
//             groupIds.includes(item.SpecialGroupId)
//           ) {
//             maxDiscount = Math.max(maxDiscount, item.Discount);
//           }
//         }
//       }

//       productDiscount += maxDiscount;
//     }

//     // 👉 Quantity Discount
//     const breakDiscount = await InventoryQtyDiscount.findOne({
//       where: {
//         Item_Number: productId,
//         BreakQty: { [Op.lte]: productQuantity },
//       },
//       order: [["BreakQty", "DESC"]],
//     });

//     if (breakDiscount) {
//       if (breakDiscount.BreakDiscount > 0) {
//         productDiscount += (ProductPrice1 * breakDiscount.BreakDiscount) / 100;
//       } else if (breakDiscount.BreakAmount && breakDiscount.BreakAmount > 0) {
//         productDiscount += breakDiscount.BreakAmount;
//       }
//     } else {
//       if (
//         InventoryDetails?.CaseCount &&
//         InventoryDetails.CaseCount <= productQuantity &&
//         CustomerDetails?.CCaseDiscount &&
//         InventoryDetails?.CaseDiscountPct &&
//         InventoryDetails.CaseDiscountPct > 0
//       ) {
//         productDiscount +=
//           (ProductPrice1 * InventoryDetails.CaseDiscountPct) / 100;
//       }
//     }

//     productDiscount = parseFloat(productDiscount.toFixed(2));

//     updatedPrice.UpdatedDiscount =
//       ProductPrice1 <= productDiscount ? 0 : productDiscount;
//     updatedPrice.UpdatedProductPrice1 =
//       ProductPrice1 - updatedPrice.UpdatedDiscount;

//     // 👉 If no CustPricing exists, apply InventorySpecial fallback
//     if (!CustPricing) {
//       const fallback = inventorySpecials.find(
//         (s) => s.ItemNumber === productId
//       );
//       if (fallback && fallback.Allowance > 0) {
//         updatedPrice.UpdatedDiscount = fallback.Allowance;
//         updatedPrice.UpdatedProductPrice1 = ProductPrice1 - fallback.Allowance;
//       }
//     }

//     // 👉 State Deposit
//     const stateDeposit = await InventoryDepositState.findOne({
//       where: {
//         Item_Number: productId,
//         [Op.or]: [
//           { CState: CustomerDetails.C_State },
//           {
//             Jurisdiction_State: CustomerDetails.Jurisdiction_State,
//             Jurisdiction_County: CustomerDetails.Jurisdiction_County,
//             Jurisdiction_City: CustomerDetails.Jurisdiction_City,
//           },
//         ],
//       },
//     });

//     updatedPrice.DepositAmount =
//       stateDeposit?.DepositAmount ?? InventoryDetails.DepositAmount ?? 0;

//     return updatedPrice;
//   }

//   async CalculateTax(CustomerDetails: any, responseData: any) {
//     const today = new Date();

//     let stateTax = false,
//       countyTax = false,
//       cityTax = false;
//     let dataTaxOTP_State: any[] = [],
//       dataTaxOTP_County: any[] = [],
//       dataTaxOTP_City: any[] = [];
//     let dataTaxCounty = null,
//       dataTaxCity = null;

//     let QB_PO_TAX_COSTALIAS = 99;
//     let PO_COST_SELECT = "MNB";

//     const options: any = await OptionsOther.findAll();
//     if (!options) throw new AppError(Manager.OTHER_OPTION_NOT_FOUND, 400);
//     for (const opt of options) {
//       if (opt.IdNumber === 118) QB_PO_TAX_COSTALIAS = parseInt(opt.OptionValue);
//       if (opt.IdNumber === 8004)
//         PO_COST_SELECT = opt.OptionValue?.toUpperCase() || "MNB";
//     }

//     const defaultJuris = CustomerDetails?.JurisdictionState * 1000;

//     if (CustomerDetails?.JurisdictionState) {
//       stateTax = true;
//       dataTaxOTP_State = await TaxRatesOtp.findAll({
//         where: {
//           JurisdictionState: CustomerDetails.JurisdictionState,
//           JurisdictionCounty: defaultJuris,
//           JurisdictionCity: defaultJuris,
//         },
//       });

//       if (CustomerDetails.JurisdictionCounty !== defaultJuris) {
//         countyTax = true;
//         dataTaxCounty = await TaxRatesCounty.findOne({
//           where: { JurisdictionCounty: CustomerDetails.JurisdictionCounty },
//         });
//         dataTaxOTP_County = await TaxRatesOtp.findAll({
//           where: { JurisdictionCounty: CustomerDetails.JurisdictionCounty },
//         });
//       }

//       if (CustomerDetails.JurisdictionCity !== defaultJuris) {
//         cityTax = true;
//         dataTaxCity = await TaxRatesCity.findOne({
//           where: { JurisdictionCity: CustomerDetails.JurisdictionCity },
//         });
//         dataTaxOTP_City = await TaxRatesOtp.findAll({
//           where: { JurisdictionCity: CustomerDetails.JurisdictionCity },
//         });
//       }
//     }

//     for (const item of responseData) {
//       let Pricing_ItemTaxState = 0,
//         Pricing_ItemTaxCounty = 0,
//         Pricing_ItemTaxCity = 0;
//       const InventoryItem: any = await Inventory.findOne({
//         where: { ItemNumber: item.ItemNumber },
//       });

//       let Pricing_ItemCost = await this.getPricingItemCost(
//         InventoryItem,
//         PO_COST_SELECT
//       );

//       const applyOtpTax = (otpList: any): number => {
//         const otp = otpList.find(
//           (w: any) =>
//             w.OtpNumber === InventoryItem.OtpNumber || w.OtpNumber === 999
//         );
//         if (!otp) return 0;

//         let units = 0;
//         let rate = otp.OtpRate ?? 0;
//         let option = otp.OtpOption ?? -1;

//         if ([2, 3, 4, 5, 7].includes(option)) {
//           return calcPercentageTax(
//             rate,
//             option,
//             QB_PO_TAX_COSTALIAS,
//             Pricing_ItemCost,
//             InventoryItem
//           );
//         } else {
//           switch (option) {
//             case 0:
//               units = InventoryItem.CigSticks || 0;
//               break;
//             case 1:
//             case 8:
//               units = (InventoryItem.UnitOunces || 0) * InventoryItem.Pack;
//               break;
//             case 6:
//               units = InventoryItem.Pack || 0;
//               break;
//             case 9:
//               units = InventoryItem.SpecialTaxUnits || 0;
//               break;
//             case 10:
//               units = InventoryItem.CigSticks || 0;
//               rate = rate / 100;
//               break;
//             case 11:
//               units = (InventoryItem.CigSticks || 0) / 200;
//               break;
//           }
//           return Math.round(rate * units * 100) / 100;
//         }
//       };

//       if (stateTax) Pricing_ItemTaxState += applyOtpTax(dataTaxOTP_State);
//       if (countyTax) Pricing_ItemTaxCounty += applyOtpTax(dataTaxOTP_County);
//       if (cityTax) Pricing_ItemTaxCity += applyOtpTax(dataTaxOTP_City);

//       item.Tx =
//         Pricing_ItemTaxState + Pricing_ItemTaxCounty + Pricing_ItemTaxCity;
//       item.ProductPriceWithTax = (item.ProductPrice1 ?? 0) + item.Tx;
//     }

//     return responseData;
//   }

//   async setEffectivePrice(CNumber: any, productId: any, CustomerDetails: any) {
//     const ItemDetails = await Inventory.findOne({
//       where: { ItemNumber: productId },
//     });

//     if (!ItemDetails) {
//       throw new AppError("Item not found", 400);
//     }

//     let ItemPrice = ItemDetails.Price1;

//     if (ItemDetails.PriceClass > 0) {
//       let custPricing = await CustPricing.findOne({
//         where: {
//           C_Number: CNumber,
//           Price_Class: [
//             ItemDetails.PriceClass,
//             ItemDetails.SalesCategory + 1000,
//           ],
//         },
//       });

//       if (CustomerDetails.CPricingAccount > 0) {
//         const ParentCustPricing = await CustPricing.findOne({
//           where: {
//             C_Number: CustomerDetails.CPricingAccount,
//             Price_Class: [
//               ItemDetails.PriceClass,
//               ItemDetails.SalesCategory + 1000,
//             ],
//           },
//         });

//         if (ParentCustPricing) {
//           custPricing = ParentCustPricing;
//         }
//       }

//       if (custPricing) {
//         if (custPricing.Price > 0) {
//           ItemPrice = custPricing.Price;
//         } else {
//           switch (custPricing.Price_Level) {
//             case 1:
//               ItemPrice = ItemDetails.Price1;
//               break;
//             case 2:
//               ItemPrice = ItemDetails.Price2;
//               break;
//             case 3:
//               ItemPrice = ItemDetails.Price3;
//               break;
//             case 4:
//               ItemPrice = ItemDetails.Price4;
//               break;
//             case 5:
//               ItemPrice = ItemDetails.Price5 ?? 0;
//               break;
//             case 6:
//               ItemPrice = ItemDetails.Price6 ?? 0;
//               break;
//             case 9:
//               ItemPrice = ItemDetails.BaseCost;
//               break;
//             case 8:
//               ItemPrice = ItemDetails.NetCost;
//               break;
//             case 7:
//               ItemPrice = ItemDetails.InvoiceCost ?? 0;
//               break;
//           }

//           if (custPricing.Price_Adjustment !== 0) {
//             if (custPricing.Price_Adj_Pct) {
//               ItemPrice =
//                 ItemPrice +
//                 Math.round(
//                   ((ItemPrice * custPricing.Price_Adjustment) / 100) * 100
//                 ) /
//                   100;
//             } else {
//               ItemPrice = ItemPrice + custPricing.Price_Adjustment;
//             }
//           }
//         }
//       }
//     }

//     return ItemPrice;
//   }

//   async getPricingItemCost(
//     inventory: InventoryEntityInSales,
//     poCostSelect: string
//   ) {
//     switch (poCostSelect) {
//       case "MNB":
//         return inventory.Price1;

//       case "MBN":
//         if (inventory.InvoiceCost && inventory.InvoiceCost !== 0)
//           return inventory.InvoiceCost;
//         if (inventory.BaseCost !== 0) return inventory.BaseCost;
//         return inventory.NetCost;

//       case "NMB":
//         if (inventory.NetCost !== 0) return inventory.NetCost;
//         if (inventory.InvoiceCost && inventory.InvoiceCost !== 0)
//           return inventory.InvoiceCost;
//         return inventory.BaseCost;

//       case "NBM":
//         if (inventory.NetCost !== 0) return inventory.NetCost;
//         if (inventory.BaseCost !== 0) return inventory.BaseCost;
//         return inventory.InvoiceCost ?? 0;

//       case "BNM":
//         if (inventory.BaseCost !== 0) return inventory.BaseCost;
//         if (inventory.NetCost !== 0) return inventory.NetCost;
//         return inventory.InvoiceCost ?? 0;

//       case "BMN":
//         if (inventory.BaseCost !== 0) return inventory.BaseCost;
//         if (inventory.InvoiceCost && inventory.InvoiceCost !== 0)
//           return inventory.InvoiceCost;
//         return inventory.NetCost;

//       default:
//         return 0;
//     }
//   }
// }
