// interfaces/postgress/device-id.interface.ts
export interface IDevice {
  id?: number;
  customerNumber: number; // FK to Retailer.Customer_Number
  deviceId: string;
  deviceName: string;
  deviceType: string
  isAllow?: boolean;
  createdAt?: Date;
  deviceToken: string;
  updatedAt?: Date;
  isActive?: boolean;
  sessionActive?: boolean;
}
