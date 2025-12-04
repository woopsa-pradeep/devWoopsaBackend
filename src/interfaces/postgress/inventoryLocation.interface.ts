export interface IInventoryLocation {
  C_Number: number;
  Item_Number: number;
  Location: string;
  Section: string;
  Status: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
