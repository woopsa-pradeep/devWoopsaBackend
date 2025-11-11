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
