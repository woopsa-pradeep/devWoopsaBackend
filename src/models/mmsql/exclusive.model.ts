// src/models/ExclusionGroups.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path based on your setup

export class ExclusionGroups extends Model {
  public ExclusionGroup_ID!: number;             // smallint
  public ExclusionGroup_Description!: string;    // nvarchar
}

ExclusionGroups.init(
  {
    ExclusionGroup_ID: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
    },
    ExclusionGroup_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'ExclusionGroups',
    timestamps: false,
  }
);
