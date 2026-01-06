// src/models/Inventory_ItemGroups.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path based on your project structure

export class Inventory_ItemGroups extends Model {
  public Item_GroupID!: number; // smallint
  public Item_GroupDescription!: string; // nvarchar
}

Inventory_ItemGroups.init(
  {
    Item_GroupID: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
    },
    Item_GroupDescription: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'Inventory_ItemGroups',
    timestamps: false,
  }
);
