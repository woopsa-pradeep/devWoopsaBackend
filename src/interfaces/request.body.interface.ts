
export const ROLES = {
  MANAGER: "distributor",
  RETAILER: "retailer",
  SALES: "sales",
  EPIK: "epick",
}

export interface IContactUs {
  id?: number;
  PhoneNO: string;
  WhatupNo: string;
  EmailAdd: string;
  SalesRepName: string;
  Fax: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface IWarehouseSetting {

  maxOrderLimit: number;
  inventoryThreshold: number;
  emailAddress: string;
  cutOffTime: string;
  maxOrderQty: number;
  minOrderAmount: number;
  chargeName: string;
  amount: string;

  // Feature toggles (boolean flags)
  showInventoryStockToSalesRep: boolean;
  showInventoryStockToRetailer: boolean;
  allowOrderWithoutStockSalesRep: boolean;
  allowOrderWithoutStockRetailer: boolean;
  allowViewARToSalesRep: boolean;
  allowViewARToRetailer: boolean;
  showItemsWithoutPriceToSalesRep: boolean;
  showItemsWithoutPriceToRetailer: boolean;
  enableStorePickup: boolean;
  enableMaxOrderQtyControl: boolean;
  enableMinOrderAmountControl: boolean;
  enableInventoryThresholdControl: boolean;
  showDepositCharges: boolean;
 warehouseImage?: string | null;// Add this to the interface

}


export interface ILogin {
  email_phone: string;
  isEmail: boolean;
  password: string;
  deviceToken?:string;
}
export interface IUserLogin{
  email: string;
  password: string;
}

export interface IUploadProductImage{
  image_url?: string;
  product_number: number;
  isAllow?: boolean;
}
export interface IUpdateUploadProductImage{
  image_url?: string;
  product_number: number;
  isAllow?: boolean;
}
export interface ICreateBanner{
  bannerTitle: string;
  bannerDescription: string;
  inventors: object[];
  expireAt: Date;
  image_url?: string;
}
export interface IUpdateBanner{
  bannerTitle: string;
  bannerDescription: string;
  inventors: object[];
  status:boolean;
  expireAt: Date;
  image_url?: string;
}

export interface IUpdateDevice {
  isAllow?: boolean;
  sessionActive?: boolean;
}
export interface ISignUp {
  account_number: number;
}

export interface IVerify {
  email_phone: string;
  otp: string;
  account_number: number
}

export interface ICheckWareHouse {
  wareHouseId: number;
}

export interface IForgotPassword {
  email: string;
}

export interface IResetPassword {
  token: string;
  newPassword: string;
}

export interface IEditUpdaceUPC {
  description?: string;
  item_Number?: number;
  myKey?: 0;
  upc_Number?: string;
}

export interface IAddPromotion {
  Promotion?: string;
  PromotionName?: string;
  Description?: any;
  ValidTill?: any;
  UploadedBy?: any;
  UploadedAt?: any;
  ID?: number;
  PromotionImgLink?: string;
  isActive?: boolean
}

export interface IAddContactInfo {
  contactId?: any;
  phoneNumber?: string;
  whatsAppNumber?: string;
  email?: string;
  address?: string;
  addedBy?: number;
  addedOn?: any
}

export interface IWareHouse {
  WareHouse?: string;
  WareHouseImage?: string;
  WareHouseId: number;
  Title: string;
  Address: string;
  PhoneNumber: string;
  AddedBy?: number;
  AddedOn?: any
}

export interface IChangePassword {
  old_password: string;
  new_password: string;
  confirm_password: string
}

export interface TimeSlot {
  slotDetailId?: number;
  fkslotId?: number;
  fromTime?: string;
  toTime?: string;
  formattedFromTime?: string;
  formattedToTime?: string;
}

export interface DateDuration {
  slotId?: number;
  addedBy: number;
  addedAt?: string; // or Date
  modifiedBy?: number;
  modifiedAt?: string; // or Date
  days?: number[];
  timeSlotCount?: number;
  daysCount?: number;
}

export interface ISlots {
  dateDuration: DateDuration;
  timeSlots?: TimeSlot[];
}

export interface ICustomerLoginDeviceList {
  Id: number;
  IsSessionActive?: boolean;
  isApproved?: boolean;
  ApprovedBy?: number;
  UpdateOn?: any;
}

export interface IProductManager {
  searchKeyword?: string;
  salesCategory?: number;
  upcNumber?: string;
  itemNumber?: number;
  page?: number;
  perPage?: number
}

export interface IProductPrice {
  itemNumber: number;
  dateLastChange?: any;
  productPrice1?: number;
  baseCost?: number;
  netCost?: number;
  invoiceCost?: number;
  avgCost?: number;
  maxQty?: number;
  useMasterImage?: boolean
}

export interface ISalesUserRegistration {
  id?: number,
  userName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  contactNumber: string;
  password: string;
  roleId: number;
  routeNumber: number;
  deliveryDate: any;
  sNumber: number
}

export interface IAddUpdateCustomerPermission {
  id?: number;
  userId?: number;
  isPoenabled?: boolean;
  isProductUpcEnabled?: boolean;
  updatedBy?: number;
  updatedOn?: any
}

export interface IAddUpdateCustomer {
  saasCustomerId?: number;
  customerIdwc?: number;
  customerName?: string;
  userName?: string;
  customerEmailCurrent?: string;
  customerPhoneCurrent?: string;
  customerStatus?: number;
  customerId?: number;
  customerCurrentPassword?: string;
  customerAddress?: string;
  mobOrderCount?: number;
  webOrderCount?: number;
  entrymode?: boolean;
  orderLimitPerDay?: number;
}

export interface IScheduleNotification {
  id: number;
  scheduleDate: any;
  title: string;
  message: string;
  customerId: number;
  isScheduled: boolean;
  isCompleted: boolean;
  addedOn: any; // or Date
  addedBy: number;
}

export interface IUpdateSalesUserActiveStatus {
  id: number;
  isActive: boolean
}


export interface POLineItem {
  itemNumber: number;
  quantity: number;
  itemDescription: string;
  unitsOrdered: number;
  caseCount: number;
  unitsRecords: number;
  unitCost: number;
  totalCost: number;
  extCostOrdered: number;
  unitsDamaged: number;
  piece: boolean;
  caseOrdered: number;
  caseRecords: number;
  pendingPrepaidTax: number;
  extCostReceived: number;
  creditType: number;
  creditAdjId: number;
  extTaxLiability: number;
  confirmed: boolean;
  section: string;
  location: number;
  baseCost: number;
  netCost: number;
  invoiceCost: number;
  avgCost: number;
  otpNumber: number;
  salesCategory: number;
  classofTrade: string;
  brandId: number;
  prepaidTaxState: number;
  prepaidTaxCounty: number;
  prepaidTaxCity: number;
  pendingTaxState: number;
  pendingTaxCounty: number;
  pendingTaxCity: number;
  primaryVIN: string;
  minimum: number;
  pendingTaxes: number;
  unitAllowance1: number;
  unitAllowance2: number;
  unitAllowanceId: number;
  unitAllowance2Id: number;
}

export interface PurchaseOrderRequest {
  primaryVendor: number;
  poNumber: number;
  shipDate: string; // ISO format date string
  invoiceDate: string;
  invoiceNumber: string;
  poSource: number;
  poDeliveryCharge: number;
  poDiscounts: number;
  poMiscCharge: number;
  poMiscCharge2: number;
  terms: string;
  promoCode: string;
  trackingNumber: string;
  deliveryId: number;
  poMessage: string;
  poLineItems: POLineItem[];
  pieces: number;
  cases: number;
  credits: number;
  dateReceived: string;
  backOrder: boolean;
  originalPoNumber: number;
}


export interface ProductAndSearchRequestInVendor {
  searchKeyword?: string;
  salesCategory?: number;
  upcNumber?: string;
  itemNumber?: number;
  page: number;
  perPage: number;
}

export interface ItemAllowanceRequest {
  itemNumber: number;
  quantity: number;
  allowances: number[];
}

export interface WareHouseimagesList {
  imageId: number;
  imagePath: string;
  createdDate: any;      // or Date, if you'll convert it using `new Date(...)`
  modifiedDate: any;     // or Date
  isActive: boolean;
  isDeleted: boolean;
}

export interface IPendingOrderFilterRequest {
  page: number;
  perPage: number;
  orderCustomerNumber: number;
  orderStatusCustomerNumber: number;
  lastXDays: number;
  salesId: number;
  salesName: string;
  searchOrderNo: number;
}

export interface IHomeScreenDROProductRequest {
  customerNumber: number;
  searchKeyword: string;
  salesCategory: number;
  upcNumber: string;
  itemNumber: number;
  lastXDays: number;
  isNewProduct: boolean;
  page: number;
  perPage: number;
}

export interface UpdatedDiscountedPrice {
  UpdatedDiscount: number;
  UpdatedProductPrice1: number;
  DepositAmount?: number;
}

export interface InventoryEntityInSales {
  Price1: number;
  BaseCost: number;
  NetCost: number;
  InvoiceCost?: number | null;
}

export interface IGetOrderDROWithID {
  customerNumber: number;
  searchKeyword: string;
  salesCategory: number;
  upcNumber: string;
  itemNumber: number;
  lastXDays: number;
  isNewProduct: boolean;
  page: number;
  perPage: number;
}


export interface AddToCartItem {
  customerCId: number;
  customerName: string;
  cartID: number;
  productID: number;
  productDescription: string;
  productPrice: number;
  productDiscount: number;
  productImageURL: string;
  productQuantity: number;
  deliveryCharges: number;
  productPack: number;
  productSize: string;
  temporaryOrderNumber: number;
  permanentOrderNumber: number;
  availableQty: number;
  productPriceWithTax: number;
  number: number;
  qtyAvl: number;
  pTtl: number;
  pTtlExt: number;
  sTtl: number;
  dChrg: number;
  ttl: number;
  avlCrdt: number;
  balMsg: string;
  pNoTx: number;
  tx: number;
  pTtlNoTx: number;
  pTtlExtNoTx: number;
  txExt: number;
  sTtlNoTx: number;
  txOTP: number;
  upcNumber: string;
  salesItemDiscount: number;
  oldPrice: number;
}

export interface AddToCartRequest {
  addToCart: AddToCartItem[];
  isSalesModule: number;
  isSavechanges: boolean;
}


export interface ICartItem {
  customerCId: number;
  customerName: string;
  customerEmail: string;
  productID: number;
  productDescription: string;
  productPrice1: number;
  productDiscount: number;
  productQuantity: number;
  orderNumber: number;
  temporaryOrderNumber: number;
  permanentOrderNumber: number;
  number: number;
  qtyAvl: number;
  pTtl: number;
  pTtlExt: number;
  sTtl: number;
  dChrg: number;
  ttl: number;
  avlCrdt: number;
  balMsg: string;
  pNoTx: number;
  tx: number;
  pTtlNoTx: number;
  pTtlExtNoTx: number;
  txExt: number;
  sTtlNoTx: number;
  txOTP: number;
  ttlDsc: number;
  deliveryType: string;
  pickupDate: string; // ISO string format; use Date if parsed
  pickupTimeFrom: string;
  pickupTimeTo: string;
  wareHouseId: number;
  upcNumber: string;
  productPriceWithTax: number;
  estimateTotalDeliveryCost: number;
  orderNoteMsg: string;
  perUnitePrice: number;
  salesItemDiscount: number;
  depositAmount: number;
}

// Usage:
export type ICartItemList = ICartItem[];

export interface SetOutOrderStatus {
  orderNumber: number;
  status: boolean;
  paymentMode: number;
}

export interface SetOutLocationUpdate {
  driverId: number;
  latitude: string;
  longitude: string;
  locationTime: string;
  routeNumber: number;
  orderStatuses: SetOutOrderStatus[];
}

export interface OrderStatusPickedUp {
  orderNumber: number;
  status: boolean;
  paymentMode: number;
}


export interface OrderNumberItem {
  orderNumber: number;
}

export interface ArrivedOrder {
  driverId: number;
  latitude: string;
  longitude: string;
  routeNumber: number;
  locationTime: string;
  ordernumberlist: OrderNumberItem[];
}


export interface IRouteAssignmentRequest {
  routeNumber: number;
  driverId: number;
  byUserId: number;
  weekday: number;
}


export interface IDriverCurrentLocation {
  ordernumber: number;
  stopnumber: number
}


export interface UpdateRouteStopsRequest {
  routeNumber: number;
  byUserId: number;
  updateStops: UpdatedStop[];
}

export interface UpdatedStop {
  stopId: number;
  updatedStopNo: number;
  stopName: string;
}

export interface EditAddRouteStopAddress {
  id?: number;
  stopNumber: number;
  routeNumber: number;
  stopName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  addedBy: number;
  latitude?: string;
  longitude?: string;
}


export interface AssignDriverRouteRequest {
  routeNumber: number;
  dayOfWeek: number;
  byUserId: number;
  driverId: number;
  routeInfos: RouteInfo[];
}

export interface RouteInfo {
  routeNumber: number;
  weekDay: string;
  dayOfWeek: number;
  description: string;
}


export interface DriverRouteAssignmentRequest {
  routeNumber: number;
  dayOfWeek: number;
  byUserId: number;
  driverId: number;
  routeInfos: RouteInfo[];
}

export interface RouteInfo {
  routeNumber: number;
  weekDay: string;
  dayOfWeek: number;
  description: string;
}


export interface DriverLocationUpdateRequest {
  driverId: number;
  latitude: string;
  longitude: string;
  locationTime: string;
  routeNumber: number;
  statusMessage: string;
  id: number;
  orderStatuses: OrderStatus[];
}

export interface OrderStatus {
  orderNUmber: number;
  status: boolean;
  paymentMode: number;
}


export interface SaveDriverLocationUpdateRequest {
  driverId: number;
  latitude: string;
  longitude: string;
  locationTime: Date;
  routeNumber: number;
  statusMessage?: string;
  id: number;
  orderStatuses: {
    orderNUmber: number;
    status: boolean;
    paymentMode: number;
  }[];
}


export interface TimeTrackForStop {
  stopNumber: number | null;
  StopNumberTimestamp: string;
}

export interface TimeTrackForRoute {
  routeNumber: number;
  RouteNumberTimestamp: string;
  timeTrackForStops: TimeTrackForStop[]; // 🔥 This is the key!
}

export interface OrderSummary {
  OrderMonth: number;
  TotalOrders: Set<number>;
  TotalPriceInK: number;

}


export interface ProductPramotionRequest {
  customerNumber: number;
  searchKeyword: string;
  salesCategory: number;
  upcNumber: string;
  itemNumber: number;
  lastXDays: number;
  isNewProduct: boolean;
  page: number;
  perPage: number;
}


export interface OrderProduct{
  customerNumber: number;
  orderNumber: number;
  orderDate: string;
  orderStatus: string;
  orderTotal: number;
 
}

export interface CustomerItemCreationAttributes {
  Qty: number;
  TotalPrice: number;
  TotalPriceWithTax: number;
  Customer_Number: number;
  Item_Number: string;
  Price_With_Tax: number;
  // 👇 maybe also these:
  Company_ID: number; // if required
  Created_By: string;
}


export interface IHomeSettings {
  showMostSale?: boolean;
  showAsPerCustomer?: boolean;
  showCustomerHistory?: boolean;
  promotedItems?: any[];
  showPromotedItems?: boolean;
  maxPromotedItems?: number;
}

export interface IGetProductInformation {
  upcNumber:string;
  isMultiple:boolean;
  arrayOfUpc:string[];
}

// NotificationScheduler interfaces
export interface ICreateNotificationScheduler {
  userId: number[];
  title: string;
  description: string;
  date: string;
  time: string;
  isActive?: boolean;
  stopNumber?: number;
  routeNumber?: number;
}

export interface IUpdateNotificationScheduler {
  userId?: number[];
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  isActive?: boolean;
  isExpire?: boolean;
}

export interface IGetNotificationSchedulers {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isExpire?: boolean;
  date?: string;
}

// Link interfaces
export interface ICreateLink {
  name: string;
  description?: string;
  file?: string;
  logo?: string;
  isActive?: boolean;
  url: string;
}

export interface IUpdateLink {
  name?: string;
  description?: string;
  file?: string;
  status?: boolean;
  logo?: string;
  isActive?: boolean;
  url?: string;
}

export interface IGetLinks {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// RetailerProductCatalog interfaces
export interface ICreateRetailerProductCatalog {
  name: string;
  description?: string;
  C_Number: number;
  status: boolean;
  link?: string;
  attachment?: string;
  isActive?: boolean;
}

export interface IUpdateRetailerProductCatalog {
  name?: string;
  description?: string;
  C_Number?: number;
  status?: boolean;
  attachment?: string;
  isActive?: boolean;
}

export interface IGetRetailerProductCatalogs {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  status?: boolean;
}

export interface ICreateStory {
  mediaType: 'image' | 'video';
  caption?: string;
  expiresAt: Date;
  isActive?: boolean;
}

export interface IUpdateStory {
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  caption?: string;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface IGetStories {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  mediaType?: 'image' | 'video';
}

// WebView interfaces
export interface ICreateWebView {
  section: 'header' | 'middle' | 'bottom';
  image_url: string;
  order?: number;
  productArray?: string[];
  productsList?: string;
}

export interface IUpdateWebView {
  section?: 'header' | 'middle' | 'bottom';
  image_url?: string;
  order?: number;
}

export interface IGetWebViews {
  page?: number;
  limit?: number;
  search?: string;
  section?: 'header' | 'middle' | 'bottom';
  groupBySection?: boolean;
}

export interface IWebViewGroupedResponse {
  header: any[];
  middle: any[];
  bottom: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


export interface IOrderPick {
  id?: number;
  orderNumber: number;
  customerNumber: number;
  status?: 'pending' | 'in_progress' | 'completed';
  notes?: string | null;
  totalLines?: number;
  totalQty?: number;
  scannedLines?: number;
  scannedQty?: number;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface IOrderPickBox {
  id?: number;
  orderNumber: number;
  type: 'box' | 'tote' | 'drink';
  size?: string | null;
  images?: any[]; // JSONB → usually array of objects or strings
  barcode?: string | null;
  pickId?: number;
  value?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}
