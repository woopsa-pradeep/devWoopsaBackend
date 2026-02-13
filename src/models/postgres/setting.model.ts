// models/Setting.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

  interface SettingAttributes {
    id: number;
    salesRep: any;
    itemGlobal: any;
    showWithPerpaidTax: boolean;
    splitSearchOption: boolean;
    retailer: any;
    warehouseProfile: any;
    deliveryStartAddress: any;
    deliveryEndAddress: any;
    deliveryStartLat: number | null;
    deliveryStartLong: number | null;
    deliveryEndLat: number | null;
    deliveryEndLong: number | null;
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
    public deliveryStartAddress!: any;
    public deliveryEndAddress!: any;
    public deliveryStartLat!: number | null;
    public deliveryStartLong!: number | null;
    public deliveryEndLat!: number | null;
    public deliveryEndLong!: number | null;
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
    },
    deliveryStartAddress:{
      type: DataTypes.JSONB,
      defaultValue: {
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      },
      allowNull: true,
    },
    deliveryEndAddress:{
      type: DataTypes.JSONB,
      defaultValue: {
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
      },
      allowNull: true,
    },
    deliveryStartLat:{
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    deliveryStartLong:{
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
    },
    deliveryEndLat:{
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    deliveryEndLong: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
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
