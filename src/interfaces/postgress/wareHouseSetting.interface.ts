export interface IWarehouseSetting {
  id: number;
  inventoryThreshold: number;
  emailAddress: string;
  cutOffTime: string;
  maxOrderLimit: number;
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
 warehouseImage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;

}