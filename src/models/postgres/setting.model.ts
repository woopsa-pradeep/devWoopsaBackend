// models/Setting.ts
import { DataTypes, Model,Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { defaultValueSchemable } from 'sequelize/types/utils';

  interface SettingAttributes {
    id: number;
    salesRep: any;
    itemGlobal: any;
    showWithPerpaidTax: boolean;
    splitSearchOption: boolean;
    retailer: any;
    warehouseProfile: any;
    globalSearchOption: boolean;
    warehouseImage: string;
    orderEmailNotification: string | null;
  }

  type SettingCreationAttributes =  Optional<SettingAttributes, 'id' | 'showWithPerpaidTax' | 'warehouseImage' > 


  class Setting
    extends Model<SettingAttributes, SettingCreationAttributes>
    implements SettingAttributes
  {
    public id!: number;
    public salesRep!: any;
    public itemGlobal!: any;
    public showWithPerpaidTax!: boolean;
    public retailer!: any;
    public warehouseProfile!: any;
    public splitSearchOption!: boolean;
    public globalSearchOption!: boolean;
    public warehouseImage!: string;
    public orderEmailNotification!: string | null;
  }

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  

    globalSearchOption: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    splitSearchOption:{
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

    showWithPerpaidTax:{
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    
    orderEmailNotification: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true
    }


  },
  {
    sequelize: postgresSequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: false,
  }
);

export default Setting;
