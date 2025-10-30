import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IWarehouseSetting } from '../../interfaces/postgress/wareHouseSetting.interface';

type WarehouseSettingCreationAttributes = Optional<IWarehouseSetting, 'id'>;

export class WarehouseSetting
  extends Model<IWarehouseSetting, WarehouseSettingCreationAttributes>
  implements IWarehouseSetting {
  public id!: number;
  public inventoryThreshold!: number;
  public emailAddress!: string;
  public cutOffTime!: string;

  public maxOrderQty!: number;
  public minOrderAmount!: number;
  public maxOrderLimit!:number 
  public warehouseImage!: string | null;

  public chargeName!: string;
  public amount!: string;
    

  public enableInventoryThresholdControl!: boolean;

  public showInventoryStockToSalesRep!: boolean;
  public showInventoryStockToRetailer!: boolean;
  public allowOrderWithoutStockSalesRep!: boolean;
  public allowOrderWithoutStockRetailer!: boolean;

  public allowViewARToSalesRep!: boolean;
  public allowViewARToRetailer!: boolean;

  public showItemsWithoutPriceToSalesRep!: boolean;
  public showItemsWithoutPriceToRetailer!: boolean;

  public enableStorePickup!: boolean;
  public enableMaxOrderQtyControl!: boolean;
  public enableMinOrderAmountControl!: boolean;
  public showDepositCharges!: boolean;



  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WarehouseSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    inventoryThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cutOffTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxOrderQty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    minOrderAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    warehouseImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxOrderLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    chargeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    enableInventoryThresholdControl: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showInventoryStockToSalesRep: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    showInventoryStockToRetailer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowOrderWithoutStockSalesRep: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowOrderWithoutStockRetailer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowViewARToSalesRep: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowViewARToRetailer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showItemsWithoutPriceToSalesRep: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showItemsWithoutPriceToRetailer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    enableStorePickup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    enableMaxOrderQtyControl: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    enableMinOrderAmountControl: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showDepositCharges: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: postgresSequelize,
    modelName: 'WarehouseSetting',
    tableName: 'warehouse_settings',
    timestamps: true,
  }
);
