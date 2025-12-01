import { Customer } from "./customer.model";
import { CustomerRoute } from "./customerRoutes.model";
import { Inventory } from "./inventory.model";
import { InventoryUPC } from "./inventoryUpc.model";
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
import InventorySpecials from "./inventorySpecail.model";
import { TaxRatesOTP } from "./taxRatesOtp.model";
import InventoryStatus from "./inventoryStatus.model";
import { Terms } from "./invoiceTerm.model";
import InventoryQtyDiscount from "./inventoryQtyDiscount.model";
import { Vendor } from "./vendor.model";




export function applyAssociations(): void {

  Customer.belongsTo(SalesRep, {
    foreignKey: 'C_Salesman',
    as: 'salesRep',
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
  CustReceivables.belongsTo(Customer, { foreignKey: 'C_Number', as: 'customer' });

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


  Customer.belongsTo(Terms, {
    foreignKey: 'TermsCode',
    as: 'terms',
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


Inventory.hasMany(InventoryQtyDiscount, {
  foreignKey: "Item_Number",
  as: "QtyDiscounts",
});

InventoryQtyDiscount.belongsTo(Inventory, {
  foreignKey: "Item_Number",
  as: "InventoryItem",
});

}
