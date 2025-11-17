// src/models/CustomerStatus.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path as required

export class CustomerStatus extends Model {
  public C_StatusCode!: number;        // smallint (PK)
  public C_Status!: string;            // nvarchar
  public C_StatusDescription!: string; // nvarchar
  public C_ClassCategory!: number;     // smallint
}

CustomerStatus.init(
  {
    C_StatusCode: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
    },
    C_Status: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    C_StatusDescription: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    C_ClassCategory: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Customer_Status',
    timestamps: false,
  }
);
