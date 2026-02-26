import { Customer } from "./customer.model";
import { CustomerRoute } from "./customerRoutes.model";
import { Inventory } from "./inventory.model";
import { InventoryUPC } from "./inventoryUpc.model";
import InventoryHistory from './inventoryHistory.model';
import { SalesRep } from "./salesrep.model";
import { SalesCategory } from './salesCategory.model';
import { PriceClass } from "./priceClass.model";
import { PriceSubclass_Defs } from "./priceSubClassDefs.model";
import { CustReceivables } from './custReceivables.model';
import { ARDefinitions } from './arDefinitions.model';
import { ARDeposits } from './arDeposits.model';
import { ARDetails } from './arDetails.model';
import { OrderDetail } from './orderDetail.model';
import { OrderHeader } from "./orderHeader.model";
import { PODetail } from './poDetail.model';
import { POHeader } from './poHeader.model';
import InventorySpecials from "./inventorySpecail.model";
import { TaxRatesOTP } from "./taxRatesOtp.model";
import { TaxRates_City } from "./taxRateCity.model";
import { TaxRates_County } from "./taxRateCounty.model";
import { TaxRates } from "./taxRates.model";
import InventoryStatus from "./inventoryStatus.model";
import { Terms } from "./invoiceTerm.model";
import InventoryQtyDiscount from "./inventoryQtyDiscount.model";
import { Vendor } from "./vendor.model";
import { ClassOfTrade } from "./classOfTrade.model";
import { Order_Header_Costs } from "./orderHeaderCost.model";
import { Record_Locks } from "./recordLock.model";
import { Users } from "./user.model";
import { CustBillTo } from "./custBillTo.model";
import { CustFinanceCharges } from "./custFinanceCharges.model";
import { ARDeletes } from "./arDeletes.mode";
import { InventorySavedDetail } from "./inventorySavedDetail.model";

import { DeliveryTypes } from "./deliveryType.model";



export function applyAssociations(): void {

  Customer.belongsTo(SalesRep, {
    foreignKey: 'C_Salesman',
    targetKey: 'S_Number',
    as: 'salesRep',
  });

  Customer.belongsTo(ClassOfTrade, {
    foreignKey: 'C_ClassOfTrade',
    targetKey: 'Trade_Code',
    as: 'classOfTrade',
  });

  Customer.belongsTo(TaxRates, {
    foreignKey: 'Jurisdiction_State',
    targetKey: 'Jurisdiction_State',
    as: 'taxRate',
  });

  Customer.belongsTo(TaxRates_City, {
    foreignKey: 'Jurisdiction_City',
    targetKey: 'Jurisdiction_City',
    as: 'taxRateCity',
  });

  Customer.belongsTo(TaxRates_County, {
    foreignKey: 'Jurisdiction_County',
    targetKey: 'Jurisdiction_County',
    as: 'taxRateCounty',
  });

  CustomerRoute.belongsTo(Customer, { foreignKey: 'C_Number', as: 'Customer' });
  Customer.hasMany(CustomerRoute, {
    foreignKey: 'C_Number',
    as: 'Routes',
  });

  InventoryUPC.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    as: 'Inventory',
  })

  Inventory.hasMany(InventoryUPC, {
    foreignKey: 'Item_Number',
    as: 'UPCList',
  });
  Inventory.belongsTo(SalesCategory, {
    foreignKey: 'Sales_Category',
    as: 'SalesCategory',
  });

  SalesCategory.hasMany(PriceClass, {
    foreignKey: "Sales_Category_Group",
    as: "priceClasses"
  });

  PriceClass.belongsTo(SalesCategory, {
    foreignKey: "Sales_Category_Group",
    as: "salesCategory"
  });

  Inventory.belongsTo(PriceClass, {
    foreignKey: 'Price_Class',
    as: 'PriceClass',
  });

  Inventory.belongsTo(PriceSubclass_Defs, {
    foreignKey: 'Price_Subclass',   // make sure this matches your DB column
    as: 'PriceSubclass'
  });

  PriceClass.hasMany(Inventory, {
    foreignKey: 'Price_Class',
    as: 'Inventories', // 👈 not used in query, just required
  });
  CustReceivables.belongsTo(Customer, { foreignKey: 'C_Number', targetKey: 'C_Number', as: 'customer' });

  CustReceivables.belongsTo(CustBillTo, {
    foreignKey: 'C_Number',
    targetKey: 'C_Number',
    as: 'CustBillTo',
  });

  Customer.belongsTo(Terms, {
    foreignKey: 'TermsCode',
    targetKey: 'TermsCode',
    as: 'invoiceTerms',
  });

  Customer.hasOne(CustBillTo, {
    foreignKey: 'C_Number',
    as: 'billTo',
  });

  CustBillTo.belongsTo(Customer, {
    foreignKey: 'C_Number',
    as: 'CustBillTo'
  })



  CustReceivables.belongsTo(ARDefinitions, {
    foreignKey: 'AR_SubType',
    targetKey: 'AR_SubType',
    as: 'arDefinition',
    constraints: false,
  });

  CustReceivables.belongsTo(ARDeposits, {
    foreignKey: 'Deposit_ID',
    targetKey: 'Deposit_ID',
    as: 'deposit',
    constraints: false,
  });


  CustReceivables.hasMany(ARDetails, {
    foreignKey: 'P_Number_AppliedFrom',
    sourceKey: 'P_Number',
    as: 'details', // Used in Credits tab
    constraints: false,
  });

  // Inventory → Vendor (two separate foreign keys on Inventory)
  Inventory.belongsTo(Vendor, {
    foreignKey: 'Primary_Vendor',
    as: 'primaryVendor',
  });

  Inventory.belongsTo(Vendor, {
    foreignKey: 'Manufacturer',
    as: 'manufacturerVendor',
  });

  // Vendor → Inventory (inverse, two separate collections)
  Vendor.hasMany(Inventory, {
    foreignKey: 'Primary_Vendor',
    as: 'primaryInventories',      // items where this vendor is Primary_Vendor
  });

  Vendor.hasMany(Inventory, {
    foreignKey: 'Manufacturer',
    as: 'manufacturedInventories', // items where this vendor is Manufacturer
  });



  ARDetails.belongsTo(CustReceivables, {
    foreignKey: 'P_Number_AppliedFrom',
    targetKey: 'P_Number',
    as: 'creditTransaction',
    constraints: false,
  });


  OrderHeader.hasMany(Order_Header_Costs, {
    foreignKey: "Order_Number",
    sourceKey: "Order_Number",
    as: 'Order_Header_Costs',
  });

  Order_Header_Costs.belongsTo(OrderHeader, {
    foreignKey: "Order_Number",
    targetKey: "Order_Number",
  });


  OrderHeader.belongsTo(SalesRep, {
    foreignKey: "S_Number",
    targetKey: "S_Number",
    as: "salesRep",
  });

  SalesRep.hasMany(OrderHeader, {
    foreignKey: "S_Number",
    sourceKey: "S_Number",
    as: "orders",
  });


  // --- FIX APPLIED HERE ---
  // Changed sourceKey and targetKey to 'P_Number' which is likely the primary key
  // for CustReceivables, ensuring a valid join.
  CustReceivables.hasMany(ARDetails, {
    foreignKey: 'P_Number_AppliedTo',
    sourceKey: 'P_Number', // Changed from 'Invoice_Number'
    as: 'appliedDetails',
    constraints: false,
  });

  ARDetails.belongsTo(CustReceivables, {
    foreignKey: 'P_Number_AppliedTo',
    targetKey: 'P_Number', // Changed from 'Invoice_Number'
    as: 'invoiceTransaction',
    constraints: false,
  });
  // --- END FIX ---

  // OrderDetail belongs to Inventory
  OrderDetail.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    as: 'inventory',
  });

  Inventory.hasMany(OrderDetail, { as: 'orderDetails', foreignKey: 'Item_Number' });

  // PODetail belongs to Inventory
  PODetail.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    as: 'inventory',
  });

  Inventory.hasMany(PODetail, { as: 'poDetails', foreignKey: 'Item_Number' });

  // POHeader belongs to Vendor
  POHeader.belongsTo(Vendor, {
    foreignKey: 'Primary_Vendor',
    targetKey: 'Primary_Vendor',
    as: 'vendor',
  });

  Vendor.hasMany(POHeader, {
    foreignKey: 'Primary_Vendor',
    sourceKey: 'Primary_Vendor',
    as: 'purchaseOrders',
  });

  Customer.belongsTo(Terms, {
    foreignKey: 'TermsCode',
    as: 'terms',
  });



  SalesRep.hasMany(Customer, {
    foreignKey: 'C_Salesman',
    as: 'customers',
  });

  Terms.hasMany(Customer, {
    foreignKey: 'TermsCode',
    as: 'customers',
  });

  // Inventory has many OrderDetails



  OrderHeader.belongsTo(Customer, {
    foreignKey: 'C_Number',
    as: 'customer',
  });

  Customer.hasOne(CustomerRoute, {
    foreignKey: 'C_Number',
    as: 'customerRoute'
  });

  Customer.hasMany(OrderHeader, {
    foreignKey: 'C_Number',
    as: 'orderHeaders',
  });

  DeliveryTypes.hasMany(OrderHeader, {
    foreignKey: 'Delivery_ID',
    as: 'DeliveryTypeOrders',
  });

  OrderHeader.belongsTo(DeliveryTypes, {
    foreignKey: 'Delivery_ID',
    as: 'DeliveryType',
  });

  // OrderDetail belongs to OrderHeader (one-to-many relationship)
  OrderDetail.belongsTo(OrderHeader, {
    foreignKey: 'Order_Number',
    targetKey: 'Order_Number',
    as: 'orderHeader',
  });

  // OrderHeader has many OrderDetails
  OrderHeader.hasMany(OrderDetail, {
    foreignKey: 'Order_Number',
    sourceKey: 'Order_Number',
    as: 'orderDetails',
  });

  InventorySpecials.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    as: 'inventory',
  });

  Inventory.hasMany(InventorySpecials, {
    foreignKey: 'Item_Number',
    as: 'inventorySpecials',
  });

  // In TaxRatesOTP model (many side)
  // TaxRatesOTP.belongsTo(Inventory, {
  //   foreignKey: 'OTP_Number', // this field must exist in TaxRatesOTP
  //   targetKey: 'OTP_Number',  // ensure this matches the field in Inventory
  //   as: 'inventory',
  // });

  // In Inventory model (one side)
  Inventory.hasMany(TaxRatesOTP, {
    foreignKey: 'OTP_Number',
    sourceKey: 'OTP_Number',  // this field must exist in Inventory
    as: 'taxRatesOTP',
  });

  InventoryStatus.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    as: 'inventory',
  });
  Inventory.hasMany(InventoryStatus, {
    foreignKey: 'Item_Number',
    as: 'inventoryStatus',
  });

  // InventoryHistory association
  Inventory.hasMany(InventoryHistory, {
    foreignKey: 'Item_Number',
    as: 'InventoryHistory',
  });

  InventoryHistory.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    as: 'Inventory',
  });


  Inventory.hasMany(InventoryQtyDiscount, {
    foreignKey: "Item_Number",
    as: "QtyDiscounts",
  });

  InventoryQtyDiscount.belongsTo(Inventory, {
    foreignKey: "Item_Number",
    as: "InventoryItem",
  });

  ARDeposits.hasMany(CustReceivables, {
    as: 'custReceivables',
    foreignKey: 'Deposit_ID',
  });

  CustReceivables.belongsTo(ARDeposits, {
    foreignKey: 'Deposit_ID',
  });

  CustReceivables.belongsTo(ARDefinitions, {
    foreignKey: 'AR_Type',
    targetKey: 'AR_Type',
    as: 'arTypeDef',
    constraints: false,
  });

  // Record_Locks -> Order_Header
  Record_Locks.belongsTo(OrderHeader, {
    foreignKey: 'Lock_Number',     // Record_Locks column
    targetKey: 'Order_Number',     // Order_Header column
    as: 'orderHeader',
    constraints: false,            // IMPORTANT for MSSQL legacy tables
  });

  // Order_Header -> Record_Locks
  OrderHeader.hasMany(Record_Locks, {
    foreignKey: 'Lock_Number',
    sourceKey: 'Order_Number',
    as: 'recordLocks',
    constraints: false,
  });

  OrderHeader.belongsTo(Users, {
    foreignKey: 'User_ID',     // column in Order_Header
    targetKey: 'UserNumber',   // PK in Users
    as: 'user',
  });

  // Optional reverse (not required for your query)
  Users.hasMany(OrderHeader, {
    foreignKey: 'User_ID',
    sourceKey: 'UserNumber',
    as: 'orders',
  });

  Customer.hasMany(CustomerRoute, {
    foreignKey: 'C_Number',
    as: 'routes',
  });

  // CustomerRoutes.ts
  CustomerRoute.belongsTo(Customer, {
    foreignKey: 'C_Number',
    as: 'customer',
  });

  CustReceivables.belongsTo(CustBillTo, {
    foreignKey: 'C_Number',
    as: 'Cust_BillTo'
  });


  // CustFinanceCharges → Customer
  CustFinanceCharges.belongsTo(Customer, {
    foreignKey: 'C_Number',
    targetKey: 'C_Number',
  });

  // Customer → CustFinanceCharges
  Customer.hasMany(CustFinanceCharges, {
    foreignKey: 'C_Number',
    sourceKey: 'C_Number',
  });

  CustReceivables.hasMany(CustFinanceCharges, {
    foreignKey: 'C_Number', // CustFinanceCharges.C_Number
    sourceKey: 'C_Number',  // CustReceivables.C_Number
    as: 'financeCharges',   // alias required
    constraints: false,
  });

  CustFinanceCharges.belongsTo(CustReceivables, {
    foreignKey: 'C_Number',
    targetKey: 'C_Number',
    as: 'receivable',
    constraints: false,
  });

  CustReceivables.belongsTo(Users, {
    foreignKey: 'User_Number',
    targetKey: 'UserNumber'
  })

  ARDeletes.belongsTo(Customer, {
    foreignKey: 'C_Number',
    targetKey: 'C_Number'
  })

  Inventory.hasOne(InventoryStatus, {
    foreignKey: 'Item_Number',
    sourceKey: 'Item_Number'

  });

  Inventory.hasOne(InventorySavedDetail, {
    foreignKey: 'Item_Number',
    sourceKey: 'Item_Number',
  })

  InventorySavedDetail.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    targetKey: 'Item_Number'
  });



  CustReceivables.hasOne(CustBillTo, {
    foreignKey: 'C_Number',
    sourceKey: 'C_Number',
    as: 'billTo',
  });

  CustBillTo.belongsTo(CustReceivables, {
    foreignKey: 'C_Number',
    targetKey: 'C_Number',
  });

  POHeader.hasMany(PODetail, {
    foreignKey: 'PO_Number',
    sourceKey: 'PO_Number',
  });

  PODetail.belongsTo(POHeader, {
    foreignKey: 'PO_Number',
    targetKey: 'PO_Number',
  });

  PODetail.belongsTo(Inventory, {
    foreignKey: 'Item_Number',
    targetKey: 'Item_Number',
  });

  POHeader.belongsTo(Vendor, {
    foreignKey: 'Primary_Vendor',
    targetKey: 'Primary_Vendor',
  });




}
