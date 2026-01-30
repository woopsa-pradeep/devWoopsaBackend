// models/trade-show-retailer.model.ts
import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface ITradeShowVendor {
  id: number;
  tradeShowId: number;
  vendorId: number;
  vendorName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradeShowVendorCreationAttributes = Optional<ITradeShowVendor, "id" | "createdAt" | "updatedAt">;

export class TradeShowVendor
  extends Model<ITradeShowVendor, TradeShowVendorCreationAttributes>
  implements ITradeShowVendor
{
  public id!: number;
  public tradeShowId!: number;
  public vendorId!: number;
  public vendorName!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TradeShowVendor.init(
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

    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    vendorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "tradeShowVendors",
    modelName: "TradeShowVendor",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tradeShowId", "vendorId"],
        name: "ux_tradeShowVendors_tradeShowId_vendorId",
      },
    ],
  }
);
