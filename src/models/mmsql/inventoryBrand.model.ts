// src/models/InventoryBrands.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path based on your project

export class InventoryBrands extends Model {
  public Brand_ID!: number;                // smallint
  public Brand_Family!: string;            // nvarchar
  public Brand_ReceivedStamped!: boolean;  // bit
  public Brand_PM_Status!: string;         // nvarchar
}

InventoryBrands.init(
  {
    Brand_ID: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
    },
    Brand_Family: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Brand_ReceivedStamped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    Brand_PM_Status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Inventory_Brands',
    timestamps: false,
  }
);
