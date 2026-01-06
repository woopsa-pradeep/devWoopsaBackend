// src/models/InventoryBrands.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path based on your project

export async function getNextInventoryBrand() {
  const maxBrand_ID = await InventoryBrands.max("Brand_ID");
  const nextBrand_ID = (maxBrand_ID as number) + 1;
  console.log(nextBrand_ID, 'nextBrand_ID');
  return nextBrand_ID;
}

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
