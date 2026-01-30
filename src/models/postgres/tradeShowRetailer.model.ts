// models/trade-show-retailer.model.ts
import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface ITradeShowRetailer {
  id: number;
  tradeShowId: number;
  retailerId: number;
  retailerName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradeShowRetailerCreationAttributes = Optional<ITradeShowRetailer, "id" | "createdAt" | "updatedAt">;

export class TradeShowRetailer
  extends Model<ITradeShowRetailer, TradeShowRetailerCreationAttributes>
  implements ITradeShowRetailer
{
  public id!: number;
  public tradeShowId!: number;
  public retailerId!: number;
  public retailerName!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TradeShowRetailer.init(
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

    retailerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    retailerName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "tradeShowRetailers",
    modelName: "TradeShowRetailer",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tradeShowId", "retailerId"],
        name: "ux_tradeShowRetailers_tradeShowId_retailerId",
      },
    ],
  }
);
