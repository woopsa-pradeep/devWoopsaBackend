// src/models/TaxRates_County.ts
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db';

export class TaxRates_County extends Model {}

TaxRates_County.init(
  {
    Jurisdiction_County: { type: DataTypes.INTEGER, allowNull: true },
    TaxDescription: { type: DataTypes.STRING, allowNull: true },
    TaxRate: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Jurisdiction_State: { type: DataTypes.INTEGER, allowNull: true },
    CigStamp: { type: DataTypes.TINYINT, allowNull: true },
    CigStampCombined: { type: DataTypes.BOOLEAN, allowNull: true },
    Inventory_CIG: { type: DataTypes.BOOLEAN, allowNull: true },
    Inventory_OTP: { type: DataTypes.BOOLEAN, allowNull: true },
    STMP_ITEM10: { type: DataTypes.INTEGER, allowNull: true },
    STMP_ITEM20: { type: DataTypes.INTEGER, allowNull: true },
    STMP_ITEM25: { type: DataTypes.INTEGER, allowNull: true },
    STMP_VALUE10: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    STMP_VALUE20: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    STMP_VALUE25: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    JurisdictionAlias_CIG: { type: DataTypes.INTEGER, allowNull: true },
    JurisdictionAlias_OTP: { type: DataTypes.INTEGER, allowNull: true },
    JurisdictionAlias_STAMP: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: 'TaxRates_County',
    timestamps: false,
  }
);
