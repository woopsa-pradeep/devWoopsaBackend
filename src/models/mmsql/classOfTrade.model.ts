// src/models/ClassOfTrade.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path if needed

export class ClassOfTrade extends Model {
  public Trade_Code!: string;   // nvarchar (PK if required)
  public Trade_Desc!: string;   // nvarchar
}

ClassOfTrade.init(
  {
    Trade_Code: {
      type: DataTypes.STRING, // nvarchar
      allowNull: false,
      primaryKey: true,       // remove if DB does NOT use this as PK
    },
    Trade_Desc: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Class_Of_Trade',
    timestamps: false,
  }
);
