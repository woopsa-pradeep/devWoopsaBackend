import { Vendor } from "../models/mmsql/vendor.model";

export const getDefaultVendorValues = (UserID: number): any => {
    const currentDate = new Date();
  
    return {
      V_Comment: "",
      V_BillTo_Name: "",
      V_BillTo_Addr1: "",
      V_BillTo_Addr2: "",
      V_BillTo_City: "",
      V_BillTo_State: "",
      V_BillTo_Zip: "",
      V_BillTo: 0,
      V_PurchasesMTD: 0,
      V_PurchasesYTD: 0,
      Pad_Pct: 0,
      FTP_Host: "",
      FTP_User: "",
      FTP_Password: "",
      FTP_Directory: "",
      V_PO_OutputFormat: "",
      V_PO_OutputFolder: "",
      V_Status: "",
      V_PO_InputFormat: 0,
      V_PO_InputFolder: "",
      QB_TaxVendor: "",
      FTP_Protocol: 0,
      FTP_Mode: 0,
      FTP_FileExt: "",
      V_EmailSend: 0,
      V_PrimarySupplier: 1,
      V_PurchaseSchedule: "",
      Date_Created: currentDate,
      Date_CreatedUser: UserID,
      V_BackorderStatus: "N",
      Product_ExpDays: 0,
      ExpDate_License: currentDate,
    };
  };


  export async function getNextVendorNumber() {
    const maxVendor = await Vendor.max('Primary_Vendor');
    const nextVendorNumber = (maxVendor as number) + 1;
    return nextVendorNumber;
  }   