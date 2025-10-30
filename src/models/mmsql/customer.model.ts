import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";
import { ICustomerAttributes } from "../../interfaces/customer.interface";



export class Customer extends Model<ICustomerAttributes> implements ICustomerAttributes {
  public C_Number!: number;
  public C_Name?: string;
  public C_CoName?: string;
  public C_Address?: string;
  public C_City?: string;
  public C_State?: string;
  public C_Zip?: string;
  public C_Country?: string;
  public AddressType?: any;
  public C_Contact1?: string;
  public C_Contact2?: string;
  public Jurisdiction_State?: number;
  public Jurisdiction_County?: number;
  public Jurisdiction_City?: number;
  public C_Salesman?: number;
  public TermsCode?: number;
  public C_Phone?: string;
  public C_Fax?: string;
  public C_SpecialTaxCode?: string;
  public C_Class?: number;
  public C_StatusCode?: number;
  public C_SalesTaxNumber?: string;
  public C_CigtLicenseNumber?: string;
  public C_StatementAccount?: number;
  public C_CaseDiscount?: boolean;
  public C_RetailCode?: number;
  public C_StatementCode?: number;
  public C_Memo?: string;
  public C_AuthorizedOnly?: boolean;
  public C_ClassOfTrade?: string;
  public C_InvoiceFormat?: number;
  public C_PricingAccount?: number;
  public PriceLevel_Default?: number;
  public NetCost_Flag?: boolean;
  public Credit_Limit?: number;
  public EDI_Format?: number;
  public C_CashCustomer?: boolean;
  public Finance_Charge?: boolean;
  public C_Interest?: number;
  public Interest_LastCharged?: Date;
  public ExpDate_SalesTax?: Date;
  public ExpDate_CigtTax?: Date;
  public C_Password?: string;
  public C_ChainStore?: string;
  public C_Email!: string;
  public C_Inactive?: boolean;
  public Delivery_Charge?: boolean;
  public Delivery_Amount?: number;
  public C_OtherLicenseNumber?: string;
  public ExpDate_OtherTax?: Date;
  public C_SalesTaxSelect?: string;
  public C_StoreID?: string;
  public C_StoreIDQ?: string;
  public No_Substitutes?: boolean;
  public C_OrderDay?: number;
  public C_RetailRounding?: string;
  public C_FEIN?: string;
  public C_OperationHours1?: number;
  public C_OperationHours2?: number;
  public Service_Charge?: boolean;
  public Other_Amount?: number;
  public C_PhoneMobile?: string;
  public POS_CashC?: boolean;
  public POS_CheckC?: boolean;
  public POS_CreditC?: boolean;
  public POS_DebitC?: boolean;
  public POS_OtherC?: boolean;
  public POS_HouseC?: boolean;
  public Delivery_ID?: number;
  public C_OrderDaySequence?: number;
  public C_DateCreated?: Date;
  public C_DateCreatedUser?: number;
  public C_DateModifed?: Date;
  public C_DateModifedUser?: number;
  public C_CommissionRate01?: number;
  public C_CommissionRate01_PCT?: boolean;
  public C_CommissionRate02?: number;
  public C_CommissionRate03?: number;
  public C_CommissionRate04?: number;
  public C_CommissionRate05?: number;
  public C_CommissionRate06?: number;
  public C_CommissionRate07?: number;
  public C_CommissionRate08?: number;
  public C_CommissionRate09?: number;
  public C_CommissionRate10?: number;
  public C_CommissionRate11?: number;
  public C_CommissionRate12?: number;
  public LastBalance?: number;
  public LastInvoiceDate?: Date;
  public LastInvoiceNumber?: number;
  public LastInvoiceAmount?: number;
  public LastPaymentDate?: Date;
  public LastPaymentAmount?: number;
  public LastPostDatedTotal?: number;
  public MSA_AcceptPromo?: boolean;
  public WebHistory?: number;
  public FTP_Host?: string;
  public FTP_User?: string;
  public FTP_Password?: string;
  public FTP_Directory?: string;
  public FTP_Protocol?: number;
  public FTP_Mode?: number;
  public FTP_FileExt?: string;
  public C_OutputFolder?: string;
  public C_ReturnStatus?: string;
  public C_OtherLicenseNumber2?: string;
  public ExpDate_OtherTax2?: Date;
  public C_OtherLicenseNumber3?: string;
  public ExpDate_OtherTax3?: Date;
  public MSA_StateTaxJurisdiction?: string;
  public C_PromotionGroup?: string;
  public C_Alias?: string;
  public Category_Allow01?: boolean;
  public Category_Allow02?: boolean;
  public Category_Allow03?: boolean;
  public Category_Allow04?: boolean;
  public Category_Allow05?: boolean;
  public Category_Allow06?: boolean;
  public Category_Allow07?: boolean;
  public Category_Allow08?: boolean;
  public Category_Allow09?: boolean;
  public Category_Allow10?: boolean;
  public Category_Allow11?: boolean;
  public Category_Allow12?: boolean;
  public emailInvoice?: boolean;
  public emailInvoiceEDI?: boolean;
  public emailReport?: boolean;
  public emailStatement?: boolean;
  public emailPromo?: boolean;
  public C_AdminOnly?: boolean;
  public eCommerce_UpdateTag?: boolean;
  public eCommerce_FTP_HostID?: number;
  public C_InputFormat?: number;
  public C_InputFolder?: string;
  public C_StatementFormat?: number;
}


Customer.init({
  C_Number: { type: DataTypes.INTEGER, primaryKey: true },
  C_Name: DataTypes.STRING,
  C_CoName: DataTypes.STRING,
  C_Address: DataTypes.STRING,
  C_City: DataTypes.STRING,
  C_State: DataTypes.STRING,
  C_Zip: DataTypes.STRING,
  C_Country: DataTypes.STRING,
  AddressType: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
  C_Contact1: DataTypes.STRING,
  C_Contact2: DataTypes.STRING,
  Jurisdiction_State: DataTypes.INTEGER,
  Jurisdiction_County: DataTypes.INTEGER,
  Jurisdiction_City: DataTypes.INTEGER,
  C_Salesman: DataTypes.INTEGER,
  TermsCode: DataTypes.SMALLINT,
  C_Phone: DataTypes.STRING,
  C_Fax: DataTypes.STRING,
  C_SpecialTaxCode: DataTypes.STRING,
  C_Class: DataTypes.INTEGER,
  C_StatusCode: DataTypes.SMALLINT,
  C_SalesTaxNumber: DataTypes.STRING,
  C_CigtLicenseNumber: DataTypes.STRING,
  C_StatementAccount: DataTypes.INTEGER,
  C_CaseDiscount: DataTypes.BOOLEAN,
  C_RetailCode: DataTypes.INTEGER,
  C_StatementCode: DataTypes.SMALLINT,
  C_Memo: DataTypes.STRING,
  C_AuthorizedOnly: DataTypes.BOOLEAN,
  C_ClassOfTrade: DataTypes.STRING,
  C_InvoiceFormat: DataTypes.INTEGER,
  C_PricingAccount: DataTypes.INTEGER,
  PriceLevel_Default: DataTypes.TINYINT,
  NetCost_Flag: DataTypes.BOOLEAN,
  Credit_Limit: DataTypes.FLOAT,
  EDI_Format: DataTypes.INTEGER,
  C_CashCustomer: DataTypes.BOOLEAN,
  Finance_Charge: DataTypes.BOOLEAN,
  C_Interest: DataTypes.FLOAT,
  Interest_LastCharged: DataTypes.DATE,
  ExpDate_SalesTax: DataTypes.DATE,
  ExpDate_CigtTax: DataTypes.DATE,
  C_Password: DataTypes.STRING,
  C_ChainStore: DataTypes.STRING,
  C_Email: DataTypes.STRING,
  C_Inactive: DataTypes.BOOLEAN,
  Delivery_Charge: DataTypes.BOOLEAN,
  Delivery_Amount: DataTypes.FLOAT,
  C_OtherLicenseNumber: DataTypes.STRING,
  ExpDate_OtherTax: DataTypes.DATE,
  C_SalesTaxSelect: DataTypes.STRING,
  C_StoreID: DataTypes.STRING,
  C_StoreIDQ: DataTypes.STRING,
  No_Substitutes: DataTypes.BOOLEAN,
  C_OrderDay: DataTypes.INTEGER,
  C_RetailRounding: DataTypes.STRING,
  C_FEIN: DataTypes.STRING,
  C_OperationHours1: DataTypes.SMALLINT,
  C_OperationHours2: DataTypes.SMALLINT,
  Service_Charge: DataTypes.BOOLEAN,
  Other_Amount: DataTypes.FLOAT,
  C_PhoneMobile: DataTypes.STRING,
  POS_CashC: DataTypes.BOOLEAN,
  POS_CheckC: DataTypes.BOOLEAN,
  POS_CreditC: DataTypes.BOOLEAN,
  POS_DebitC: DataTypes.BOOLEAN,
  POS_OtherC: DataTypes.BOOLEAN,
  POS_HouseC: DataTypes.BOOLEAN,
  Delivery_ID: DataTypes.INTEGER,
  C_OrderDaySequence: DataTypes.SMALLINT,
  C_DateCreated: DataTypes.DATE,
  C_DateCreatedUser: DataTypes.SMALLINT,
  C_DateModifed: DataTypes.DATE,
  C_DateModifedUser: DataTypes.SMALLINT,
  C_CommissionRate01: DataTypes.FLOAT,
  C_CommissionRate01_PCT: DataTypes.BOOLEAN,
  C_CommissionRate02: DataTypes.FLOAT,
  C_CommissionRate03: DataTypes.FLOAT,
  C_CommissionRate04: DataTypes.FLOAT,
  C_CommissionRate05: DataTypes.FLOAT,
  C_CommissionRate06: DataTypes.FLOAT,
  C_CommissionRate07: DataTypes.FLOAT,
  C_CommissionRate08: DataTypes.FLOAT,
  C_CommissionRate09: DataTypes.FLOAT,
  C_CommissionRate10: DataTypes.FLOAT,
  C_CommissionRate11: DataTypes.FLOAT,
  C_CommissionRate12: DataTypes.FLOAT,
  LastBalance: DataTypes.FLOAT,
  LastInvoiceDate: DataTypes.DATE,
  LastInvoiceNumber: DataTypes.INTEGER,
  LastInvoiceAmount: DataTypes.FLOAT,
  LastPaymentDate: DataTypes.DATE,
  LastPaymentAmount: DataTypes.FLOAT,
  LastPostDatedTotal: DataTypes.FLOAT,
  MSA_AcceptPromo: DataTypes.BOOLEAN,
  WebHistory: DataTypes.SMALLINT,
  FTP_Host: DataTypes.STRING,
  FTP_User: DataTypes.STRING,
  FTP_Password: DataTypes.STRING,
  FTP_Directory: DataTypes.STRING,
  FTP_Protocol: DataTypes.SMALLINT,
  FTP_Mode: DataTypes.SMALLINT,
  FTP_FileExt: DataTypes.STRING,
  C_OutputFolder: DataTypes.STRING,
  C_ReturnStatus: DataTypes.STRING,
  C_OtherLicenseNumber2: DataTypes.STRING,
  ExpDate_OtherTax2: DataTypes.DATE,
  C_OtherLicenseNumber3: DataTypes.STRING,
  ExpDate_OtherTax3: DataTypes.DATE,
  MSA_StateTaxJurisdiction: DataTypes.STRING,
  C_PromotionGroup: DataTypes.STRING,
  C_Alias: DataTypes.STRING,
  Category_Allow01: DataTypes.BOOLEAN,
  Category_Allow02: DataTypes.BOOLEAN,
  Category_Allow03: DataTypes.BOOLEAN,
  Category_Allow04: DataTypes.BOOLEAN,
  Category_Allow05: DataTypes.BOOLEAN,
  Category_Allow06: DataTypes.BOOLEAN,
  Category_Allow07: DataTypes.BOOLEAN,
  Category_Allow08: DataTypes.BOOLEAN,
  Category_Allow09: DataTypes.BOOLEAN,
  Category_Allow10: DataTypes.BOOLEAN,
  Category_Allow11: DataTypes.BOOLEAN,
  Category_Allow12: DataTypes.BOOLEAN,
  emailInvoice: DataTypes.BOOLEAN,
  emailInvoiceEDI: DataTypes.BOOLEAN,
  emailReport: DataTypes.BOOLEAN,
  emailStatement: DataTypes.BOOLEAN,
  emailPromo: DataTypes.BOOLEAN,
  C_AdminOnly: DataTypes.BOOLEAN,
  eCommerce_UpdateTag: DataTypes.BOOLEAN,
  eCommerce_FTP_HostID: DataTypes.INTEGER,
  C_InputFormat: DataTypes.SMALLINT,
  C_InputFolder: DataTypes.STRING,
  C_StatementFormat: DataTypes.INTEGER,
}, {
  sequelize,
  tableName: 'Customer',
  timestamps: false,
});





