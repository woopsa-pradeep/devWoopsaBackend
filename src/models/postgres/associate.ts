

// models/index.ts or similar
import { Retailer } from './retailer.model';
import { RetailerDevice } from './device.model';
import { Token } from './token.model';
import { WebUsers } from './users.model';
import { RolePermission } from './rolesPermission.model';
import { StoryView } from './storyView.model';
import { Story } from './Story.model';
import { WebLocation } from './webLocation.model';

import { OrderPickBox } from './epickOrderBox.model';
import { OrderPick } from './epickOrder.model';
import { OrderPickScan } from './epickOrderScan.model';
import { OverrideRequest } from './overrideRequest.model';
import  CustomerCart  from '../postgres/retailerCart.model';
import { Inventory } from '../mmsql/inventory.model';
import  {ProductImage}  from '../postgres/product.model';
import { SalesCategory } from '../mmsql/salesCategory.model';
import { PriceClass } from '../mmsql/priceClass.model';
import { InventoryUPC } from '../mmsql/inventoryUpc.model';
import { OrderConfirmation } from './orderConfirmation.model';
import { EpickUser } from './epickUser.model';
import { EpickConfirmation } from './epickConfirmation.model';
import { DriverRouteAssignment } from './driverRouteAssignment.model';
import { Driver } from './driver.model';
import { TradeShowItem } from './tradeShowItem.model';
import { TradeShowRetailer } from './tradeShowRetailer.model';
import { TradeShowVendor } from './tradeShowVendor';
import { TradeShowDeliveryProduct } from './tradeShowDeliveryProduct.model';
import { TradeShow } from './tradeShow.model';
import { EmailModule } from './emailModules.model';
import { EmailModuleConfig } from './emailModuleConfig.model';
// import  InventoryStatus  from '../mmsql/inventoryStatus.model'; 

export function applyAssociations(): void {



Retailer.hasMany(RetailerDevice, { foreignKey: 'customerNumber', sourceKey: 'Customer_Number' });
RetailerDevice.belongsTo(Retailer, { foreignKey: 'customerNumber', targetKey: 'Customer_Number' });
// Retailer.hasMany(Token, { foreignKey: 'retailerId' });
// Token.belongsTo(Retailer, { foreignKey: 'retailerId' });

WebUsers.hasMany(RolePermission, {
  foreignKey: 'userId',
  as: 'permissions',

});

// Role permission belongs to one user
RolePermission.belongsTo(WebUsers, {
  foreignKey: 'userId',
  as: 'user',
});
Story.hasMany(StoryView, {
  foreignKey: 'storyId',
  as: 'views',
});

StoryView.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story'
});


// order-pick.model.ts
OrderPick.hasMany(OrderPickBox, {
  foreignKey: 'orderNumber',
  sourceKey: 'orderNumber',   
  as: 'boxes'
});



OrderConfirmation.belongsTo(WebUsers, {
  foreignKey: 'sales_id',
  as: 'sales',       // ← use 'sales' consistently
});

WebUsers.hasMany(OrderConfirmation, {
  foreignKey: 'sales_id',
  as: 'salesOrders', // any name you like for reverse
});



OrderPickBox.belongsTo(OrderPick, {
  foreignKey: 'orderNumber',
  targetKey: 'orderNumber',
  as: 'order'
});

OrderPickBox.hasMany(OrderPickScan, {
  as: 'scans',
  foreignKey: 'boxId'
});

OrderPickScan.belongsTo(OrderPickBox, {
  as: 'box',
  foreignKey: 'boxId',
});

 
OrderPick.hasMany(OrderPickScan, {
  as: 'scans',
  foreignKey: 'orderNumber',
  sourceKey: 'orderNumber',
});

OrderPickScan.belongsTo(OrderPick, {
  as: 'order',
  foreignKey: 'orderNumber',
  targetKey: 'orderNumber',
});

// OverrideRequest associations
EpickUser.hasMany(OverrideRequest, {
  foreignKey: 'pickerUserId',
  as: 'overrideRequests',
});

OverrideRequest.belongsTo(EpickUser, {
  foreignKey: 'pickerUserId',
  as: 'user',
});

// EpickConfirmation associations
EpickConfirmation.belongsTo(EpickUser, {
  foreignKey: 'pickerUserNumber',
  as: 'picker',
});

EpickUser.hasMany(EpickConfirmation, {
  foreignKey: 'pickerUserNumber',
  as: 'confirmations',

});
// DriverRouteAssignment associations
Driver.hasMany(DriverRouteAssignment, {
  foreignKey: 'driverId',
  as: 'routeAssignments',
});

DriverRouteAssignment.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver',
});

// TradeShow associations
TradeShow.hasMany(TradeShowItem, {
  foreignKey: 'tradeShowId',
  as: 'items',
});

TradeShowItem.belongsTo(TradeShow, {
  foreignKey: 'tradeShowId',
  as: 'tradeShow',
});

TradeShow.hasMany(TradeShowRetailer, {
  foreignKey: 'tradeShowId',
  as: 'retailers',
});

TradeShowRetailer.belongsTo(TradeShow, {
  foreignKey: 'tradeShowId',
  as: 'tradeShow',
});

TradeShow.hasMany(TradeShowVendor, {
  foreignKey: 'tradeShowId',
  as: 'vendors',
});

TradeShowVendor.belongsTo(TradeShow, {
  foreignKey: 'tradeShowId',
  as: 'tradeShow',
});

TradeShow.hasMany(TradeShowDeliveryProduct, {
  foreignKey: 'tradeShowId',
  as: 'deliveryProducts',
});

TradeShowDeliveryProduct.belongsTo(TradeShow, {
  foreignKey: 'tradeShowId',
  as: 'tradeShow',
});


TradeShowDeliveryProduct.belongsTo(TradeShowItem, {
  as: "item",
  foreignKey: "itemNumber",   // column in tradeShowDeliveryProducts
  targetKey: "itemNumber",    // column in tradeShowItems
  constraints: false,
});


TradeShowItem.hasMany(TradeShowDeliveryProduct, {
  foreignKey: 'itemNumber',
  sourceKey: 'itemNumber',
  as: 'deliveryProducts',
  constraints: false, 
});

// EmailModule associations
EmailModule.hasMany(EmailModuleConfig, {
  foreignKey: 'emailModuleId',
  as: 'configs',
});

EmailModuleConfig.belongsTo(EmailModule, {
  foreignKey: 'emailModuleId',
  as: 'emailModule',
});

// Inventory.belongsTo(InventoryStatus, {
//   foreignKey: 'Item_Number',
//   as: 'inventoryStatus'
// });



}