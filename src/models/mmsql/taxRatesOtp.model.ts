import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../db';

// Interface for TypeScript
export interface TaxRatesOTPAttributes {
  myKey: number;
  Tax_Type: number;
  Jurisdiction_State: number;
  Jurisdiction_County: number;
  Jurisdiction_City: number;
  Tax_Description: string;
  OTP_Number: number;
  OTP_Rate: number;
  OTP_Option: number;
  OTP_Stamp: number;
  OTP_StampCost: number;
  OTP_StampsOnHand: number;
  OTP_SpecialRule: number;
  OTP_BreakPoint: number;
  OTP_Rate2: number;
}

// Optional fields during creation
export type TaxRatesOTPCreationAttributes = Optional<TaxRatesOTPAttributes, 'myKey'>;

export class TaxRatesOTP
  extends Model<TaxRatesOTPAttributes, TaxRatesOTPCreationAttributes>
  implements TaxRatesOTPAttributes
{
  public myKey!: number;
  public Tax_Type!: number;
  public Jurisdiction_State!: number;
  public Jurisdiction_County!: number;
  public Jurisdiction_City!: number;
  public Tax_Description!: string;
  public OTP_Number!: number;
  public OTP_Rate!: number;
  public OTP_Option!: number;
  public OTP_Stamp!: number;
  public OTP_StampCost!: number;
  public OTP_StampsOnHand!: number;
  public OTP_SpecialRule!: number;
  public OTP_BreakPoint!: number;
  public OTP_Rate2!: number;
}

// Initialize the model
TaxRatesOTP.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Tax_Type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Jurisdiction_State: {
      type: DataTypes.INTEGER,
    },
    Jurisdiction_County: {
      type: DataTypes.INTEGER,
    },
    Jurisdiction_City: {
      type: DataTypes.INTEGER,
    },
    Tax_Description: {
      type: DataTypes.STRING,
    },
    OTP_Number: {
      type: DataTypes.SMALLINT,
    },
    OTP_Rate: {
      type: DataTypes.DECIMAL(18, 4),
    },
    OTP_Option: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    OTP_Stamp: {
      type: DataTypes.INTEGER,
    },
    OTP_StampCost: {
      type: DataTypes.DECIMAL(18, 4),
    },
    OTP_StampsOnHand: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    OTP_SpecialRule: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    OTP_BreakPoint: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    OTP_Rate2: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'TaxRatesOTP',
    tableName: 'TaxRates_OTP',
    timestamps: false,
  }
);
