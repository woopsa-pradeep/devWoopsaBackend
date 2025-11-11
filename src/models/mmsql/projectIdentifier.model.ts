// src/models/ProjectIdentifiers.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust this path as needed

export class ProjectIdentifiers extends Model {
  public Project_Identifier!: string; // nvarchar
  public Description!: string;        // nvarchar
  public Seq!: number;                // int
}

ProjectIdentifiers.init(
  {
    Project_Identifier: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true, // assuming Project_Identifier is unique
    },
    Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Seq: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Project_Identifiers',
    timestamps: false,
  }
);
