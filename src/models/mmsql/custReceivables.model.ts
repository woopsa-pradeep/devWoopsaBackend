import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";

export class CustReceivables extends Model {
  public P_Number!: number;
  public C_Number!: number;
  public C_Number_Child?: number;
  public Invoice_Number?: number;
  public AR_Type?: string;
  public AR_SubType?: number;
  public AR_POS?: boolean;
  public AR_Date?: Date;
  public AR_CheckDate?: Date;
  public AR_Ref?: string;
  public AR_Amount?: number;
  public AR_Applied?: number;
  public Deposit_ID?: number;
  public Workstation_ID?: number;
  public User_Number?: number;
  public AR_Archived?: boolean;
  public AR_Reconcile?: boolean;
  public AR_Batch!: number;
}

CustReceivables.init({
  P_Number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  C_Number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  C_Number_Child: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Invoice_Number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  AR_Type: {
    type: DataTypes.STRING(1),
    allowNull: true,
  },
  AR_SubType: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  AR_POS: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  AR_Date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  AR_CheckDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  AR_Ref: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  AR_Amount: {
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true,
  },
  AR_Applied: {
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true,
  },
  Deposit_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  Workstation_ID: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
  User_Number: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
  AR_Archived: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  AR_Reconcile: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  AR_Batch: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'Cust_Receivables',
  timestamps: false,
});
