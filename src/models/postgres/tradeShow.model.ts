// models/trade-show.model.ts
import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface ITradeShow {
  id: number;
  name: string;
  description?: string | null;
  tradeShowDate: Date; // DATEONLY will be returned as string sometimes depending on sequelize config; keep as Date if you already do so
  deliveryStartDate: Date;
  deliveryEndDate: Date;
  deliveryWeeks: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradeShowCreationAttributes = Optional<ITradeShow, "id" | "description" | "createdAt" | "updatedAt">;

export class TradeShow extends Model<ITradeShow, TradeShowCreationAttributes> implements ITradeShow {
  public id!: number;
  public name!: string;
  public description!: string | null;

  public tradeShowDate!: Date;
  public deliveryStartDate!: Date;
  public deliveryEndDate!: Date;
  public deliveryWeeks!: number;

  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TradeShow.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'inactive',
      validate: {
        isIn: [['active', 'inactive']],
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tradeShowDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    deliveryStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    deliveryEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    deliveryWeeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "tradeShows",
    modelName: "TradeShow",
    timestamps: true,
  }
);
