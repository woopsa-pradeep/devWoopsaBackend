// src/models/NACS_CategoryCodes.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path based on your project structure

export class NACS_CategoryCodes extends Model {
  public NACS_Category_Code!: string; // nvarchar
  public NACS_Description!: string;   // nvarchar
  public NACS_Selected!: boolean;     // bit
}

NACS_CategoryCodes.init(
  {
    NACS_Category_Code: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    NACS_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    NACS_Selected: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'NACS_CategoryCodes',
    timestamps: false,
  }
);
