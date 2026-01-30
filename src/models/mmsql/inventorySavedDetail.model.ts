import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";

export class InventorySavedDetail extends Model {
  public myKey!: number;
  public invID!: number;
  public Item_Number!: number;
  public Code?: string;
  public Jurisdiction_State?: string;
  public Jurisdiction_County?: string;
  public Jurisdiction_City?: string;
  public Inventory_OnHand?: number;
  public Inventory_UnitsOnHand?: number;
  public LocationID?: number;
  public InventoryGroupID?: number;
  public Date_Received?: Date;
  public IsReturn?: boolean;
  public BaseCost?: number;
  public NetCost?: number;
  public AvgCost?: number;
  public Invoice_Cost?: number;
  public STAMP_Qty?: number;
}

InventorySavedDetail.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    invID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Jurisdiction_State: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Jurisdiction_County: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Jurisdiction_City: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Inventory_OnHand: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    Inventory_UnitsOnHand: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    LocationID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    InventoryGroupID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Date_Received: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    IsReturn: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    BaseCost: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    NetCost: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    AvgCost: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    Invoice_Cost: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    STAMP_Qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Inventory_Saved_Detail",
    timestamps: false,
  }
);
