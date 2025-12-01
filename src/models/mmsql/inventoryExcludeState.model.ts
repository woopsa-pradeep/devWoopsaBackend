// src/models/Inventory_ExcludeState.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db';

export class Inventory_ExcludeState extends Model {
  public myKey!: number;                // int (PK)
  public Item_Number!: number;          // int
  public C_State!: string | null;       // nvarchar
  public Jurisdiction_State!: number;   // int
  public C_Zip!: string | null;         // nvarchar
}

Inventory_ExcludeState.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,     // since it's clearly a key
    },
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    C_State: {
      type: DataTypes.STRING,  // nvarchar mapped to STRING
      allowNull: true,
    },
    Jurisdiction_State: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    C_Zip: {
      type: DataTypes.STRING,  // nvarchar mapped to STRING
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Inventory_ExcludeState',
    timestamps: false,
  }
);
