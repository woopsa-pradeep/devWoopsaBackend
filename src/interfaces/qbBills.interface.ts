export interface IQBBills {
  QB_Reference: number;
  PO_Number: number;
  QB_BillType: number;
  QB_CostCode: number;
  QB_Adjustment: number;
  QB_DueDate: Date;
  QB_DiscountDate: Date;
  QB_Transfer: boolean;
  QB_TransferDate: Date;
}
