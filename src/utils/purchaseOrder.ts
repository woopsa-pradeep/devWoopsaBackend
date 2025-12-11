import moment from 'moment';
import { POHeader } from '../models/mmsql/poHeader.model';
import { Op } from 'sequelize';

// 1. Generate next PO Number
export async function getNextPONumber() {
  const maxPO = await POHeader.max('PO_Number');
  return Number(maxPO || 0) + 1;
}

export const getDefaultPOHeaderValues = () => {
  const now = new Date();

  return {
    PO_Date: now,
    PO_Source: 1,
    PO_Posted: 0,
    PO_Type: 0,
    Confirmed: 0,

    Date_Received:now,
    Receiving_Code: 'P',
    Orig_PO_Number: 0,

    Primary_Vendor: 0,
    BillTo_Vendor: 0,
    Promo_Code: '',

    PO_Message: '',
    PO_Status: 0,

    PO_Cost01: 0,
    PO_Cost02: 0,
    PO_Cost03: 0,
    PO_Cost04: 0,
    PO_Cost05: 0,
    PO_Cost06: 0,
    PO_Cost07: 0,
    PO_Cost08: 0,
    PO_Cost09: 0,
    PO_Cost10: 0,
    PO_Cost11: 0,
    PO_Cost12: 0,

    PO_DeliveryCharge: 0,
    PO_MiscCharge: 0,
    PO_MiscCharge2: 0,
    PO_Discounts: 0,
    PO_Total: 0,

    Jurisdiction_State: 0,
    Jurisdiction_County: 0,
    Jurisdiction_City: 0,

    Inventory_CIG: false,
    Inventory_OTP: false,
    PrepaidTax_Calculation_Select: 0,

    PrepaidTaxOTP_State: 0,
    PrepaidTaxOTP_County: 0,
    PrepaidTaxOTP_City: 0,

    PrepaidTaxCIG_State: 0,
    PrepaidTaxCIG_County: 0,
    PrepaidTaxCIG_City: 0,

    PendingTaxOTP_State: 0,
    PendingTaxOTP_County: 0,
    PendingTaxOTP_City: 0,

    PendingTaxCIG_State: 0,
    PendingTaxCIG_County: 0,
    PendingTaxCIG_City: 0,

    AdjType: 0,
    TransferTo_AdjType: 0,
    TransferTo_Jurisdiction_State: 0,
    TransferTo_Jurisdiction_County: 0,
    TransferTo_Jurisdiction_City: 0,

    GL_Special: false,
    GL_Special_ItemNumber: 0,
    GL_Special_Purchases: 0,

    FTP_Sent: false,
    QB_Transfer: false,

    // CreatedBy: userId,
    PostedBy: null,
    PO_Deleted: false,
    Delete_User_Number: null,

    epoCreated: false,
    epoApplied: false,
    epoUser: 0,

    Control_Date: now,
  
    Invoice_Deposit: 0,
    Total_Weight: 0,
  };
};
