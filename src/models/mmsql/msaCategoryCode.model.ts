// src/models/MSA_CategoryCodes.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust the path to match your project

export class MSA_CategoryCodes extends Model {
  public MSA_Category_Code!: string;     // nvarchar
  public MSA_Description!: string;       // nvarchar
  public Project_Identifier!: string;    // nvarchar
  public MSA_Category!: string;          // nvarchar
  public MSA_Selected!: boolean;         // bit
}

MSA_CategoryCodes.init(
  {
    MSA_Category_Code: {
      type: DataTypes.STRING, // nvarchar
      allowNull: false,
      primaryKey: true,
    },
    MSA_Description: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    Project_Identifier: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    MSA_Category: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    MSA_Selected: {
      type: DataTypes.BOOLEAN, // bit
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'MSA_CategoryCodes',
    timestamps: false,
  }
);
