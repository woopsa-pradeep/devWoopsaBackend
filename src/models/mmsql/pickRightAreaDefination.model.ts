// src/models/PickRightAreaDefinition.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path to your db connection

export class PickRightAreaDefinition extends Model {
  public PickArea!: string;              // nvarchar
  public PickArea_Description!: string;  // nvarchar
  public PR_OptionValue!: string;        // nvarchar
}

PickRightAreaDefinition.init(
  {
    PickArea: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true, // assuming PickArea uniquely identifies each record
    },
    PickArea_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    PR_OptionValue: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'PickRight_AreaDefinition',
    timestamps: false,
  }
);
