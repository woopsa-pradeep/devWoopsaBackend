// utils/inventoryDefaults.ts
import moment from 'moment';
import { Vendor } from '../models/mmsql/vendor.model';

export async function getNextVendorNumber() {
  const maxVendor = await Vendor.max('Primary_Vendor');
  return (maxVendor as number) + 1;
}

export const getDefaultVendorValues = (UserID: number) => {
//   const currentDate = moment.utc().format('YYYY-MM-DD HH:mm:ss.SSSSSSS +00:00');

  return {
    // === Numeric Defaults ===
  V_Comment: "",
  V_Status: "",
  V_BackorderAmount: 1,

  V_BillTo_Name: "",
  V_BillTo_Addr1: "",
  V_BillTo_Addr2: "",
  V_BillTo_City: "",
  V_BillTo_State: "",
  V_BillTo: 0,

  V_PurchasesMTD: 0,
  V_PurchasesYTD: 0,

  Pad_Pct: 0.0000,

  FTP_Host: "",
  FTP_User: "",
  FTP_Password: "",
  FTP_Directory: "",

  QB_Name: "",

  V_PO_OutputFormat: 0,
  V_PO_OutputFolder: "",
  V_PO_InputFormat: 0,
  V_PO_InputFolder: "",

  QB_TaxVendor: "",

  FTP_Protocol: 0,
  FTP_Mode: 0,
  FTP_FileExt: 0,

  V_EmailSend: 0,
  V_PrimarySupplier: 1,
  V_PrimarySchedule: 0,

  V_BackorderStatus: "N",

  Product_ExpDays: 0,
  ExpDate_License: new Date(),

  };
};
