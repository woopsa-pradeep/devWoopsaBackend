// models/Setting.ts
import { DataTypes, Model } from 'sequelize';
import { postgresSequelize } from '../../db';

class Setting extends Model { }

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    salesRep: {
      type: DataTypes.JSONB,
      defaultValue: {
        showStock: true,
        allowOrderInventoryUnAvaible: true,
        viewAccountReceivable: true,
        showWithOutPrice: false,
      },
    },

    itemGlobal: {
      type: DataTypes.JSONB,
      defaultValue: {
        InventoryThreshold: 10,
        maxOrderLimit: 100,
        MiniMumOrderAmount: 1,

      },
    },

    retailer: {
      type: DataTypes.JSONB,
      defaultValue: {
        showStock: true,
        allowOrderInventoryUnAvaible: true,
        showWithOutPrice: false,
      },
    },

    warehouseProfile: {
      type: DataTypes.JSONB,

      defaultValue: {
        cutOffTime: '17:00:00',
        storePickup: false,
        allowShipping:true,
        timeSlots: [
          {
            day: 'Monday',
            timeSlots: []
          },
          { day: 'Tuesday', timeSlots: [] },
          { day: 'Wednesday', timeSlots: [] },
          { day: 'Thursday', timeSlots: [] },
          { day: 'Friday', timeSlots: [] },
          { day: 'Saturday', timeSlots: [] },
          { day: 'Sunday', timeSlots: [] }
        ]

      },
    },

    warehouseImage: {
      type: DataTypes.STRING,
      defaultValue: '',
    },


  },
  {
    sequelize: postgresSequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: false,
  }
);

export default Setting;
