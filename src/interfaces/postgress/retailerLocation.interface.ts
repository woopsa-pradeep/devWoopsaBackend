// interfaces/retailerLocation.interface.ts
export type RetailerLocationAddedBy = 'admin' | 'driver';

export interface IRetailerLocation {
  id?: number;
  C_Number: number;
  lat?: number | null;
  long?: number | null;
  City?: string | null;
  Country?: string | null;
  Address?: string | null;
  State?: string | null;
  Zip?: string | null;
  addedBy?: RetailerLocationAddedBy;
  driverId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

