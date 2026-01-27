// models/trade-show-item.model.ts
import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export type TradeShowDiscountType = "PERCENT" | "FLAT";

export interface ITradeShowItem {
  id: number;
  tradeShowId: number;
  itemNumber: string;
  discount: string; // DECIMAL comes back as string in pg; keep string to avoid float bugs
  minQuantity: number;
  maxQuantity: number;
  disType: TradeShowDiscountType;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradeShowItemCreationAttributes = Optional<ITradeShowItem, "id" | "createdAt" | "updatedAt">;

export class TradeShowItem
  extends Model<ITradeShowItem, TradeShowItemCreationAttributes>
  implements ITradeShowItem
{
  public id!: number;
  public tradeShowId!: number;
  public itemNumber!: string;
  public discount!: string;
  public minQuantity!: number;
  public maxQuantity!: number;
  public disType!: TradeShowDiscountType;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TradeShowItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    tradeShowId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    itemNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    minQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    maxQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    disType: {
      type: DataTypes.ENUM("PERCENT", "FLAT"),
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "tradeShowItems",
    modelName: "TradeShowItem",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tradeShowId", "itemNumber"],
        name: "ux_tradeShowItems_tradeShowId_itemNumber",
      },
    ],
  }
);
