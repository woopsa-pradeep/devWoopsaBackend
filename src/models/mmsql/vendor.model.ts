import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";

export class Vendor extends Model {
  public Primary_Vendor!: number;
  public V_Description?: string;
  public V_Addr1?: string;
  public V_Addr2?: string;
  public V_City?: string;
  public V_State?: string;
  public V_Zip?: string;
  public V_Country?: string;
  public AddressType?: number;
  public V_Phone?: string;
  public V_Fax?: string;
  public V_Broker?: string;
  public V_Broker_Rep?: string;
  public V_Broker_Phone?: string;
  public V_Broker_Fax?: string;
  public V_MinOrder_Weight?: number;
  public V_MinOrder_Dollars?: number;
  public V_MinOrder_Cases?: number;
  public V_Terms?: string;
  public V_AccountNumber?: string;
  public V_EFT?: boolean;
  public V_Comment?: string;
  public V_Backorders?: boolean;
  public V_BackorderAmount?: number;
  public V_BillTo_Name?: string;
  public V_BillTo_Addr1?: string;
  public V_BillTo_Addr2?: string;
  public V_BillTo_City?: string;
  public V_BillTo_State?: string;
  public V_BillTo_Zip?: string;
  public V_BillTo?: number;
  public V_PurchasesMTD?: number;
  public V_PurchasesYTD?: number;
  public V_Order_Interval?: number;
  public V_Lead_Time?: number;
  public V_Email?: string;
  public Pad_Pct?: number;
  public Vendor_Group?: string;
  public FTP_Host?: string;
  public FTP_User?: string;
  public FTP_Password?: string;
  public FTP_Directory?: string;
  public QB_Name?: string;
  public V_Order_IntervalDays?: number;
  public V_Lead_TimeDays?: number;
  public V_PO_OutputFormat?: number;
  public V_PO_OutputFolder?: string;
  public Jurisdiction_State?: number;
  public Jurisdiction_County?: number;
  public Jurisdiction_City?: number;
  public V_TID?: string;
  public V_FEIN?: string;
  public V_Status?: number;
  public Taxes_Prepaid?: boolean;
  public PrepaidTax_Calculation_Select?: number;
  public MSA_Status?: string;
  public First_Importer?: boolean;
  public TaxPaid_State?: string;
  public Foreign_Manufacturer?: boolean;
  public V_PO_InputFormat?: number;
  public V_PO_InputFolder?: string;
  public QB_TaxVendor?: string;
  public OTP_TaxReverseOnEntry?: boolean;
  public Buyer_ID?: number;
  public V_PO_InputOption?: number;
  public FTP_Protocol?: number;
  public FTP_Mode?: number;
  public FTP_FileExt?: string;
  public V_FullCase?: boolean;
  public V_Inactive?: boolean;
  public V_EmailSend?: boolean;
  public V_PO_ReportFormat?: number;
  public V_PrimarySupplier?: string;
  public V_PurchaseSchedule?: string;
  public Date_Created?: Date;
  public Date_CreatedUser?: number;
  public TermsCode?: number;
  public V_ReturnStatus?: string;
  public V_BackorderStatus?: string;
  public Product_ExpDays?: number;
  public ExpDate_License?: Date;
  public V_MinOrder_Pallets?: number;
}

Vendor.init({
  Primary_Vendor: { type: DataTypes.INTEGER, primaryKey: true },
  V_Description: DataTypes.STRING(255),
  V_Addr1: DataTypes.STRING(255),
  V_Addr2: DataTypes.STRING(255),
  V_City: DataTypes.STRING(255),
  V_State: DataTypes.STRING(255),
  V_Zip: DataTypes.STRING(255),
  V_Country: DataTypes.STRING(255),
  AddressType: DataTypes.SMALLINT,
  V_Phone: DataTypes.STRING(255),
  V_Fax: DataTypes.STRING(255),
  V_Broker: DataTypes.STRING(255),
  V_Broker_Rep: DataTypes.STRING(255),
  V_Broker_Phone: DataTypes.STRING(255),
  V_Broker_Fax: DataTypes.STRING(255),
  V_MinOrder_Weight: DataTypes.FLOAT,
  V_MinOrder_Dollars: DataTypes.FLOAT,
  V_MinOrder_Cases: DataTypes.INTEGER,
  V_Terms: DataTypes.STRING(255),
  V_AccountNumber: DataTypes.STRING(255),
  V_EFT: DataTypes.BOOLEAN,
  V_Comment: DataTypes.STRING(255),
  V_Backorders: DataTypes.BOOLEAN,
  V_BackorderAmount: DataTypes.FLOAT,
  V_BillTo_Name: DataTypes.STRING(255),
  V_BillTo_Addr1: DataTypes.STRING(255),
  V_BillTo_Addr2: DataTypes.STRING(255),
  V_BillTo_City: DataTypes.STRING(255),
  V_BillTo_State: DataTypes.STRING(255),
  V_BillTo_Zip: DataTypes.STRING(255),
  V_BillTo: DataTypes.INTEGER,
  V_PurchasesMTD: DataTypes.DECIMAL(19, 4),
  V_PurchasesYTD: DataTypes.DECIMAL(19, 4),
  V_Order_Interval: DataTypes.INTEGER,
  V_Lead_Time: DataTypes.INTEGER,
  V_Email: DataTypes.STRING(100),
  Pad_Pct: DataTypes.DECIMAL(19, 4),
  Vendor_Group: DataTypes.INTEGER,
  FTP_Host: DataTypes.STRING(100),
  FTP_User: DataTypes.STRING(50),
  FTP_Password: DataTypes.STRING(50),
  FTP_Directory: DataTypes.STRING(50),
  QB_Name: DataTypes.STRING(50),
  V_Order_IntervalDays: DataTypes.INTEGER,
  V_Lead_TimeDays: DataTypes.INTEGER,
  V_PO_OutputFormat: DataTypes.SMALLINT,
  V_PO_OutputFolder: DataTypes.STRING(50),
  Jurisdiction_State: DataTypes.INTEGER,
  Jurisdiction_County: DataTypes.INTEGER,
  Jurisdiction_City: DataTypes.INTEGER,
  V_TID: DataTypes.STRING(20),
  V_FEIN: DataTypes.STRING(11),
  V_Status: DataTypes.STRING(10), 
  Taxes_Prepaid: DataTypes.BOOLEAN,
  PrepaidTax_Calculation_Select: DataTypes.TINYINT,
  MSA_Status: DataTypes.STRING(3),
  First_Importer: DataTypes.INTEGER,
  TaxPaid_State: DataTypes.STRING(2),
  Foreign_Manufacturer: DataTypes.BOOLEAN,
  V_PO_InputFormat: DataTypes.SMALLINT,
  V_PO_InputFolder: DataTypes.STRING(50),
  QB_TaxVendor: DataTypes.INTEGER, 
  OTP_TaxReverseOnEntry: DataTypes.BOOLEAN,
  Buyer_ID: DataTypes.INTEGER,
  V_PO_InputOption: DataTypes.INTEGER,
  FTP_Protocol: DataTypes.SMALLINT,
  FTP_Mode: DataTypes.SMALLINT,
  FTP_FileExt: DataTypes.STRING(10),
  V_FullCase: DataTypes.STRING(1),
  V_Inactive: DataTypes.BOOLEAN,
  V_EmailSend: DataTypes.SMALLINT,
  V_PO_ReportFormat: DataTypes.SMALLINT,
  V_PrimarySupplier: DataTypes.BOOLEAN,
  V_PurchaseSchedule: DataTypes.SMALLINT,
  Date_Created: DataTypes.DATE,
  Date_CreatedUser: DataTypes.SMALLINT,
  TermsCode: DataTypes.SMALLINT,
  V_ReturnStatus: DataTypes.STRING(1),
  V_BackorderStatus: DataTypes.STRING(1),
  Product_ExpDays: DataTypes.INTEGER,
  ExpDate_License: DataTypes.DATEONLY,
  V_MinOrder_Pallets: DataTypes.INTEGER,
}, {
  sequelize,
  tableName: 'Vendor',
  timestamps: false,
});
