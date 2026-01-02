// interfaces/retailerLocation.interface.ts
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
  createdAt?: Date;
  updatedAt?: Date;
}

