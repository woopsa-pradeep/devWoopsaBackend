// interfaces/passScanItem.interface.ts
export interface IPassScanItem {
  id?: number;
  orderNumber: number;
  userId: number;
  itemNumber: number;
  isActive: boolean;
  quantityScanned: number;
  note?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
