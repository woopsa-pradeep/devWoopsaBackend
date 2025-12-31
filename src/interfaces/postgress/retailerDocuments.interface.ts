// interfaces/retailerDocuments.interface.ts
export interface IRetailerDocuments {
  id?: number;
  feinDocument?: string | null;
  customerNumber: number;
  attachments?: string[] | null;
  salesTaxDoc?: string | null;
  CigTaxDoc?: string | null;
  licenseAttachments?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}


