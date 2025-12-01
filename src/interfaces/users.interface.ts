// interfaces/users.interface.ts

export interface UserAttributes {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: boolean;
  role: string;
  userNumber: string | null;
  salesRepNumber: string[];   // ✅ Updated to array
  password: string;
  isActive: boolean;
  setUserDiscountLimit: number;
  allowSingleScan: boolean;
  createdAt: Date;
  updatedAt: Date;
  allowDiscount: boolean;
  allowDeliveryCharge: boolean;
  order_type: string | null;
  shortby: string | null;
}
