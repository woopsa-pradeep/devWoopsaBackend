// src/models/DeliveryTypes.ts

import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../db"; // adjust as needed

export class DeliveryTypes extends Model {
  public Delivery_ID!: number;            // tinyint (PK)
  public Delivery_Type!: number;          // tinyint
  public Delivery_Description!: string;   // nvarchar
  public Delivery_Active!: boolean;       // bit
}

DeliveryTypes.init(
  {
    Delivery_ID: {
      type: DataTypes.TINYINT,
      allowNull: false,
      primaryKey: true,
    },
    Delivery_Type: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    Delivery_Description: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    Delivery_Active: {
      type: DataTypes.BOOLEAN, // bit
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "Delivery_Types",
    timestamps: false,
  }
);
