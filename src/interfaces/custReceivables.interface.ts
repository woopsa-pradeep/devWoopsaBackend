export interface ICustReceivablesAttributes {
  P_Number: number;
  C_Number: number;
  C_Number_Child?: number;
  Invoice_Number?: number;
  AR_Type?: string;
  AR_SubType?: number; 
  AR_POS?: boolean;
  AR_Date?: Date;
  AR_CheckDate?: Date;
  AR_Ref?: string; 
  AR_Amount?: number; 
  AR_Applied?: number; 
  Deposit_ID?: number;
  Workstation_ID?: number;
  User_Number?: number;
  AR_Archived?: boolean;
  AR_Reconcile?: boolean;
  AR_Batch: number; 
}
