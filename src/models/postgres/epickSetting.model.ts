// models/EpickSetting.ts
import { DataTypes, Model } from 'sequelize';
import { postgresSequelize } from '../../db';

class EpickSetting extends Model { }

EpickSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    pin: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    allowSingleScan: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'allowSingleScan', // Map to database column name
    },

    // When true, order-item APIs return quantityOrdered capped by inventory on hand (display only; DB unchanged).
    // Add column if missing: ALTER TABLE epick_settings ADD COLUMN "capOrderQtyByInventory" BOOLEAN DEFAULT false;
    capOrderQtyByInventory: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'capOrderQtyByInventory',
    },

  },
  {
    sequelize: postgresSequelize,
    modelName: 'EpickSetting',
    tableName: 'epick_settings',
    timestamps: true,
  }
);

export default EpickSetting;
