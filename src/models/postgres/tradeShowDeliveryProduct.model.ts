// models/trade-show-delivery-product.model.ts
import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export type TradeShowDeliveryType = "pickup" | "delivery";

export interface ITradeShowDeliveryProduct {
  id: number;
  tradeShowId: number;
  itemNumber: string;
  vendorId: number;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  deliveryType: TradeShowDeliveryType;

  createdAt?: Date;
  updatedAt?: Date;
}

type TradeShowDeliveryProductCreationAttributes = Optional<
  ITradeShowDeliveryProduct,
  "id" | "createdAt" | "updatedAt"
>;

export class TradeShowDeliveryProduct
  extends Model<ITradeShowDeliveryProduct, TradeShowDeliveryProductCreationAttributes>
  implements ITradeShowDeliveryProduct
{
  public id!: number;
  public tradeShowId!: number;
  public itemNumber!: string;
  public vendorId!: number;
  public weekNumber!: number;
  public startDate!: Date;
  public endDate!: Date;
  public deliveryType!: TradeShowDeliveryType;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TradeShowDeliveryProduct.init(
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
      defaultValue: 0,
    },

    itemNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

   

    weekNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    deliveryType: {
      type: DataTypes.ENUM("pickup", "delivery"),
      allowNull: false,
      defaultValue: "delivery",
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "tradeShowDeliveryProducts",
    modelName: "TradeShowDeliveryProduct",
    timestamps: true,
  }
);
