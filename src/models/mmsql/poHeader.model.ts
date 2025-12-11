import { sequelize } from "../../db";
import { DataTypes, Model } from "sequelize";

export class POHeader extends Model {
  PO_Number!: number;
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
  Control_Date?: Date;
  Control_Time?: Date;
  Date_Received_Control?: Date;
  Invoice_Deposit?: number;
  Total_Weight?: number;
  Requested_Delivery_Date?: Date;
}

POHeader.init(
  {
    PO_Number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    PO_Date: DataTypes.DATE,
    PO_Source: DataTypes.TINYINT,
    PO_Posted: DataTypes.BOOLEAN,
    PO_Type: DataTypes.TINYINT,
    Confirmed: DataTypes.BOOLEAN,
    Date_Received: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Receiving_Code: DataTypes.INTEGER,
    Orig_PO_Number: DataTypes.INTEGER,
    Primary_Vendor: DataTypes.INTEGER,
    Invoice_Number: DataTypes.STRING(255),
    Invoice_Date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    PO_Message: DataTypes.STRING(255),
    PO_Status: DataTypes.TINYINT,
    Ship_Date: DataTypes.DATE,
    BillTo_Vendor: DataTypes.INTEGER,
    Promo_Code: DataTypes.STRING(255),
    Terms: DataTypes.STRING(255),
    FTP_Sent: DataTypes.BOOLEAN,
    FTP_Date: DataTypes.DATE,
    FTP_REQ_Date: DataTypes.DATE,
    ReceivingMode: DataTypes.TINYINT,
    Delivery_ID: DataTypes.INTEGER,
    Tracking_Number: DataTypes.STRING(255),

    PO_Cost01: DataTypes.DECIMAL(19, 4),
    PO_Cost02: DataTypes.DECIMAL(19, 4),
    PO_Cost03: DataTypes.DECIMAL(19, 4),
    PO_Cost04: DataTypes.DECIMAL(19, 4),
    PO_Cost05: DataTypes.DECIMAL(19, 4),
    PO_Cost06: DataTypes.DECIMAL(19, 4),
    PO_Cost07: DataTypes.DECIMAL(19, 4),
    PO_Cost08: DataTypes.DECIMAL(19, 4),
    PO_Cost09: DataTypes.DECIMAL(19, 4),
    PO_Cost10: DataTypes.DECIMAL(19, 4),
    PO_Cost11: DataTypes.DECIMAL(19, 4),
    PO_Cost12: DataTypes.DECIMAL(19, 4),

    PO_DeliveryCharge: DataTypes.DECIMAL(19, 4),
    PO_MiscCharge: DataTypes.DECIMAL(19, 4),
    PO_MiscCharge2: DataTypes.DECIMAL(19, 4),
    PO_Discounts: DataTypes.DECIMAL(19, 4),
    PO_Total: DataTypes.DECIMAL(19, 4),

    Jurisdiction_State: DataTypes.INTEGER,
    Jurisdiction_County: DataTypes.INTEGER,
    Jurisdiction_City: DataTypes.INTEGER,
    Inventory_CIG: DataTypes.BOOLEAN,
    Inventory_OTP: DataTypes.BOOLEAN,
    PrepaidTax_Calculation_Select: DataTypes.STRING(10),

    PrepaidTaxOTP_State: DataTypes.DECIMAL(19, 4),
    PrepaidTaxOTP_County: DataTypes.DECIMAL(19, 4),
    PrepaidTaxOTP_City: DataTypes.DECIMAL(19, 4),
    PrepaidTaxCIG_State: DataTypes.DECIMAL(19, 4),
    PrepaidTaxCIG_County: DataTypes.DECIMAL(19, 4),
    PrepaidTaxCIG_City: DataTypes.DECIMAL(19, 4),

    PendingTaxOTP_State: DataTypes.DECIMAL(19, 4),
    PendingTaxOTP_County: DataTypes.DECIMAL(19, 4),
    PendingTaxOTP_City: DataTypes.DECIMAL(19, 4),
    PendingTaxCIG_State: DataTypes.DECIMAL(19, 4),
    PendingTaxCIG_County: DataTypes.DECIMAL(19, 4),
    PendingTaxCIG_City: DataTypes.DECIMAL(19, 4),

    AdjType: DataTypes.INTEGER,
    TransferTo_AdjType: DataTypes.INTEGER,
    TransferTo_Jurisdiction_State: DataTypes.INTEGER,
    TransferTo_Jurisdiction_County: DataTypes.INTEGER,
    TransferTo_Jurisdiction_City: DataTypes.INTEGER,

    QB_Transfer: DataTypes.BOOLEAN,
    QB_TransferDate: DataTypes.DATE,

    PO_Number_Legacy: DataTypes.INTEGER,
    GL_Special: DataTypes.BOOLEAN,
    GL_Special_ItemNumber: DataTypes.INTEGER,
    GL_Special_Purchases: DataTypes.DECIMAL(19, 4),

    CreatedBy: DataTypes.INTEGER,
    PostedBy: DataTypes.INTEGER,

    PO_Deleted: DataTypes.BOOLEAN,
    Delete_Date: DataTypes.DATE,
    Delete_User_Number: DataTypes.INTEGER,

    epoCreated: DataTypes.BOOLEAN,
    epoApplied: DataTypes.BOOLEAN,
    epoUser: DataTypes.INTEGER,

    Control_Date: {
      type: DataTypes.DATEONLY, // date only
      allowNull: false,
    },
    Control_Time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Date_Received_Control: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    Invoice_Deposit: DataTypes.DECIMAL(19, 4),
    Total_Weight: DataTypes.DECIMAL(19, 4),
    Requested_Delivery_Date: DataTypes.DATEONLY,
  },
  {
    sequelize,
    tableName: "PO_Header",
    timestamps: false,
    freezeTableName: true,
  }
);

export async function getNextPONumber() {
  const maxPONumber = await POHeader.max("PO_Number");
  const nextPONumber = (maxPONumber as number) + 1;
  return nextPONumber;
}
