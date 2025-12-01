// src/models/TaxRates.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust import path as needed

export class TaxRates extends Model {
  public Jurisdiction_State!: number;
  public TaxDescription!: string;
  public TaxRate!: number;
  public CigStamp!: number;
  public CigStampCombined!: boolean;
  public Inventory_CIG!: boolean;
  public Inventory_OTP!: boolean;
  public STMP_ITEM10!: number;
  public STMP_ITEM20!: number;
  public STMP_ITEM25!: number;
  public STMP_VALUE10!: number;
  public STMP_VALUE20!: number;
  public STMP_VALUE25!: number;
  public State_Abbrev!: string;
  public JurisdictionAlias_CIG!: number;
  public JurisdictionAlias_OTP!: number;
  public JurisdictionAlias_STAMP!: number;
  public PPD_SalesTax!: boolean;
  public PPD_Desc10!: string;
  public PPD_Rate10!: number;
  public PPD_Desc20!: string;
  public PPD_Rate20!: number;
  public PPD_Desc25!: string;
  public PPD_Rate25!: number;
}

TaxRates.init(
  {
    Jurisdiction_State: {
      type: DataTypes.INTEGER,
      primaryKey: true, 
      allowNull: true,
    },
    TaxDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    TaxRate: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    CigStamp: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    CigStampCombined: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Inventory_CIG: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Inventory_OTP: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    STMP_ITEM10: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    STMP_ITEM20: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    STMP_ITEM25: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    STMP_VALUE10: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    STMP_VALUE20: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    STMP_VALUE25: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    State_Abbrev: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    JurisdictionAlias_CIG: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    JurisdictionAlias_OTP: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    JurisdictionAlias_STAMP: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    PPD_SalesTax: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    PPD_Desc10: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PPD_Rate10: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    PPD_Desc20: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PPD_Rate20: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    PPD_Desc25: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PPD_Rate25: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'TaxRates',
    timestamps: false,
  }
);
