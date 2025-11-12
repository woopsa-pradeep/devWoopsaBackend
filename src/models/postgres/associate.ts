

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
import  CustomerCart  from '../postgres/retailerCart.model';
import { Inventory } from '../mmsql/inventory.model';
import  {ProductImage}  from '../postgres/product.model';
import { SalesCategory } from '../mmsql/salesCategory.model';
import { PriceClass } from '../mmsql/priceClass.model';
import { InventoryUPC } from '../mmsql/inventoryUpc.model';
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


// Inventory.belongsTo(InventoryStatus, {
//   foreignKey: 'Item_Number',
//   as: 'inventoryStatus'
// });



}