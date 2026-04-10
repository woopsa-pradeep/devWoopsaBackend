

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

import { OrderConfirmation } from './orderConfirmation.model';
import { EpickUser } from './epickUser.model';
import { EpickConfirmation } from './epickConfirmation.model';

import { DeliveryRouteStop } from './deliveryRouteStop.model';
import { DeliveryRoute } from './deliveryRoute.model';
import { Driver } from './driver.model';
import { DriverExpense } from './driverExpense.model';
import Vehicle from './vehicle.model';
import { ReceivableUser } from './receivableUser.model';
import { TradeShowItem } from './tradeShowItem.model';
import { TradeShowRetailer } from './tradeShowRetailer.model';
import { TradeShowVendor } from './tradeShowVendor';
import { TradeShowDeliveryProduct } from './tradeShowDeliveryProduct.model';
import { TradeShow } from './tradeShow.model';
import { TradeShowOrderHistory } from './tradeShowOrderHistory.model';
import { EmailModule } from './emailModules.model';
import { EmailModuleConfig } from './emailModuleConfig.model';
import { CheckerActionLog } from './checkerActionLog.model';
import DeliveryRouteGroup from './driverRoutesGroup.model';
import DeliveryRoutePOD from './deliveryRoutePOD.model';
import DeliveryRouteReturn from './deliveryRouteReturn.model';

export function applyAssociations(): void {



  Retailer.hasMany(RetailerDevice, { foreignKey: 'customerNumber', sourceKey: 'Customer_Number' });
  RetailerDevice.belongsTo(Retailer, { foreignKey: 'customerNumber', targetKey: 'Customer_Number' });


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



  DeliveryRoute.hasMany(DeliveryRouteStop, {
    foreignKey: 'routeId',
    as: 'stops',
  });

  DeliveryRouteStop.belongsTo(DeliveryRoute, {
    foreignKey: 'routeId',
    as: 'route',
  });

  DeliveryRoute.hasMany(DeliveryRoutePOD, {
    foreignKey: 'routeId',
    as: 'pods',
  });

  DeliveryRoutePOD.belongsTo(DeliveryRoute, {
    foreignKey: 'routeId',
    as: 'route',
  });

  DeliveryRoute.hasMany(DeliveryRouteReturn, {
    foreignKey: 'routeId',
    as: 'routeReturns',
  });

  DeliveryRouteReturn.belongsTo(DeliveryRoute, {
    foreignKey: 'routeId',
    as: 'route',
  });

  DeliveryRoute.belongsTo(Vehicle, {
    foreignKey: 'truckId',
    as: 'vehicle',
  });

  Vehicle.hasMany(DeliveryRoute, {
    foreignKey: 'truckId',
    as: 'deliveryRoutes',
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

  // TradeShowOrderHistory associations
  TradeShow.hasMany(TradeShowOrderHistory, {
    foreignKey: 'tradeShowId',
    as: 'orderHistories',
  });

  TradeShowOrderHistory.belongsTo(TradeShow, {
    foreignKey: 'tradeShowId',
    as: 'tradeShow',
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

  // Checker action audit associations
  WebUsers.hasMany(CheckerActionLog, {
    foreignKey: 'checkerUserId',
    as: 'checkerActionLogs',
  });

  CheckerActionLog.belongsTo(WebUsers, {
    foreignKey: 'checkerUserId',
    as: 'checker',
  });

  // associations.ts

  // In your associations.ts or index.ts where all models are linked

Driver.hasMany(DeliveryRoute, {
  foreignKey: 'driverId',
  as: 'routes',
  constraints: false,
});

DeliveryRoute.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver',
  constraints: false,
});

Driver.hasMany(DeliveryRouteReturn, {
  foreignKey: 'driverId',
  as: 'deliveryRouteReturns',
  constraints: false,
});

DeliveryRouteReturn.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver',
  constraints: false,
});

Driver.hasMany(DriverExpense, {
  foreignKey: 'driverId',
  as: 'expenses',
});

DriverExpense.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver',
});

Vehicle.hasMany(DriverExpense, {
  foreignKey: 'vehicleId',
  as: 'driverExpenses',
});

DriverExpense.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle',
});

DeliveryRouteGroup.hasMany(DeliveryRoute, {
  foreignKey: 'routeGroupId',
  as: 'childRoutes',
  constraints: false,
});

DeliveryRoute.belongsTo(DeliveryRouteGroup, {
  foreignKey: 'routeGroupId',
  as: 'routeGroup',
  constraints: false,
});

  // Inventory.belongsTo(InventoryStatus, {
  //   foreignKey: 'Item_Number',
  //   as: 'inventoryStatus'
  // });



}