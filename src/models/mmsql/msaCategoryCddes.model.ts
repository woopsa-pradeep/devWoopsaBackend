// src/models/MSACategoryCodes.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path as per your project

export class MSACategoryCodes extends Model {
  public MSA_Category_Code!: string;    // nvarchar
  public MSA_Description!: string;      // nvarchar
  public Project_Identifier!: string;   // nvarchar
  public MSA_Category!: string;         // nvarchar
  public MSA_Selected!: boolean;        // bit
}

MSACategoryCodes.init(
  {
    MSA_Category_Code: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true, // assuming this uniquely identifies the record
    },
    MSA_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Project_Identifier: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    MSA_Category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    MSA_Selected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'MSA_CategoryCodes',
    timestamps: false,
  }
);
