// src/models/PriceSubclass_Defs.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path based on your project structure

export class PriceSubclass_Defs extends Model {
  public Price_Subclass!: number; // smallint
  public Subclass_Def!: string; // nvarchar
}

PriceSubclass_Defs.init(
  {
    Price_Subclass: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
    },
    Subclass_Def: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'PriceSubclass_Defs',
    timestamps: false,
  }
);
