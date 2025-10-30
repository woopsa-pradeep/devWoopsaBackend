// interfaces/retailer.interface.ts
export interface IRetailer {
  id?: number;
  Customer_Number: number;
  isAllow?: boolean;
  isActive?: boolean;
  password?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  todayOrderCount?: number;
  role?: string | null;
  maxOrderAmount?: number | null;
  maxOrderLimit?: number | null;
  minOrderAmount?: number | null;
  enableMaxOrderQtyControl?: boolean;
  enableMinOrderAmountControl?: boolean;
}
