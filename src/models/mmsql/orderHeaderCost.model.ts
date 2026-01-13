// src/models/Order_Header_Costs.ts

import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../db"; // adjust path if needed

export class Order_Header_Costs extends Model {
  public myKey!: number;
  public Order_Number!: number;
  public Value_Code!: number;

  public Value01!: number | null;
  public Value02!: number | null;
  public Value03!: number | null;
  public Value04!: number | null;
  public Value05!: number | null;
  public Value06!: number | null;
  public Value07!: number | null;
  public Value08!: number | null;
  public Value09!: number | null;
  public Value10!: number | null;
  public Value11!: number | null;
  public Value12!: number | null;
}

Order_Header_Costs.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },

    Order_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    Value_Code: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },

    Value01: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value02: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value03: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value04: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value05: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value06: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value07: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value08: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value09: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value10: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value11: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    Value12: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
  },
  {
    sequelize,
    tableName: "Order_Header_Costs",
    timestamps: false,
  }
);
