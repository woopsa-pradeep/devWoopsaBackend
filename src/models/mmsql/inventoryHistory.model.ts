import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db';
import { IInventoryHistory } from '../../interfaces/inventoryHistory.interface';

type InventoryHistoryCreationAttributes = Optional<IInventoryHistory, 'myKey'>;

export class InventoryHistory extends Model<IInventoryHistory, InventoryHistoryCreationAttributes> implements IInventoryHistory {
  public Item_Number!: number;
  public Week01!: number;
  public Week02!: number;
  public Week03!: number;
  public Week04!: number;
  public Week05!: number;
  public Week06!: number;
  public Week07!: number;
  public Week08!: number;
  public Week09!: number;
  public Week10!: number;
  public Week11!: number;
  public Week12!: number;
  public Units_Week01!: number;
  public Units_Week02!: number;
  public Units_Week03!: number;
  public Units_Week04!: number;
  public Units_Week05!: number;
  public Units_Week06!: number;
  public Units_Week07!: number;
  public Units_Week08!: number;
  public Units_Week09!: number;
  public Units_Week10!: number;
  public Units_Week11!: number;
  public Units_Week12!: number;
  public Lost01!: number;
  public Lost02!: number;
  public Lost03!: number;
  public Lost04!: number;
  public Lost05!: number;
  public Lost06!: number;
  public Lost07!: number;
  public Lost08!: number;
  public Lost09!: number;
  public Lost10!: number;
  public Lost11!: number;
  public Lost12!: number;
  public Units_Lost01!: number;
  public Units_Lost02!: number;
  public Units_Lost03!: number;
  public Units_Lost04!: number;
  public Units_Lost05!: number;
  public Units_Lost06!: number;
  public Units_Lost07!: number;
  public Units_Lost08!: number;
  public Units_Lost09!: number;
  public Units_Lost10!: number;
  public Units_Lost11!: number;
  public Units_Lost12!: number;
  public Date_LastRecd?: Date;
  public Date_LastSold?: Date;
  public LastPurchaseVendor?: number;
  public LastPurchaseCost?: number;
}

InventoryHistory.init(
  {
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Week01: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week02: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week03: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week04: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week05: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week06: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week07: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week08: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week09: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week10: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week11: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Week12: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week01: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week02: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week03: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week04: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week05: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week06: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week07: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week08: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week09: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week10: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week11: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Week12: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost01: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost02: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost03: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost04: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost05: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost06: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost07: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost08: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost09: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost10: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost11: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Lost12: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost01: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost02: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost03: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost04: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost05: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost06: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost07: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost08: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost09: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost10: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost11: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Units_Lost12: { type: DataTypes.DECIMAL(18,4), allowNull: true },
    Date_LastRecd: { type: DataTypes.DATE, allowNull: true },
    Date_LastSold: { type: DataTypes.DATE, allowNull: true },
    LastPurchaseVendor: { type: DataTypes.INTEGER, allowNull: true },
    LastPurchaseCost: { type: DataTypes.DECIMAL(18,4), allowNull: true },
  },
  {
    sequelize: sequelize,
    tableName: 'Inventory_History',
    modelName: 'InventoryHistory',
    timestamps: false,
  }
);

export default InventoryHistory;
