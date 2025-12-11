export interface IPOHeader {
  PO_Number: number;
  PO_Date?: Date;
  PO_Source?: number;
  PO_Posted?: boolean;
  PO_Type?: number;
  Confirmed?: boolean;
  Date_Received?: Date;
  Receiving_Code?: number;
  Orig_PO_Number?: number;
  Primary_Vendor?: number;
  Invoice_Number?: string;
  Invoice_Date?: Date;
  PO_Message?: string;
  PO_Status?: number;
  Ship_Date?: Date;
  BillTo_Vendor?: number;
  Promo_Code?: string;
  Terms?: string;
  FTP_Sent?: boolean;
  FTP_Date?: Date;
  FTP_REQ_Date?: Date;
  ReceivingMode?: number;
  Delivery_ID?: number;
  Tracking_Number?: string;

  PO_Cost01?: number;
  PO_Cost02?: number;
  PO_Cost03?: number;
  PO_Cost04?: number;
  PO_Cost05?: number;
  PO_Cost06?: number;
  PO_Cost07?: number;
  PO_Cost08?: number;
  PO_Cost09?: number;
  PO_Cost10?: number;
  PO_Cost11?: number;
  PO_Cost12?: number;

  PO_DeliveryCharge?: number;
  PO_MiscCharge?: number;
  PO_MiscCharge2?: number;
  PO_Discounts?: number;
  PO_Total?: number;

  Jurisdiction_State?: number;
  Jurisdiction_County?: number;
  Jurisdiction_City?: number;

  Inventory_CIG?: boolean;
  Inventory_OTP?: boolean;

  PrepaidTax_Calculation_Select?: string;

  PrepaidTaxOTP_State?: number;
  PrepaidTaxOTP_County?: number;
  PrepaidTaxOTP_City?: number;

  PrepaidTaxCIG_State?: number;
  PrepaidTaxCIG_County?: number;
  PrepaidTaxCIG_City?: number;

  PendingTaxOTP_State?: number;
  PendingTaxOTP_County?: number;
  PendingTaxOTP_City?: number;

  PendingTaxCIG_State?: number;
  PendingTaxCIG_County?: number;
  PendingTaxCIG_City?: number;

  AdjType?: number;
  TransferTo_AdjType?: number;
  TransferTo_Jurisdiction_State?: number;
  TransferTo_Jurisdiction_County?: number;
  TransferTo_Jurisdiction_City?: number;

  QB_Transfer?: boolean;
  QB_TransferDate?: Date;

  PO_Number_Legacy?: number;
  GL_Special?: boolean;
  GL_Special_ItemNumber?: number;
  GL_Special_Purchases?: number;

  CreatedBy?: number;
  PostedBy?: number;

  PO_Deleted?: boolean;
  Delete_Date?: Date;
  Delete_User_Number?: number;

  epoCreated?: boolean;
  epoApplied?: boolean;
  epoUser?: number;

  Control_Date?: string;
  Control_Time?: string;
  Date_Received_Control?: string;

  Invoice_Deposit?: number;
  Total_Weight?: number;
  Requested_Delivery_Date?: Date;
}
