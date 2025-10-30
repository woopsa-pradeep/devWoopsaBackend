// src/models/Terms.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // Adjust path based on your project structure

export class Terms extends Model {
  public TermsCode!: number; // smallint
  public Terms!: string;     // nvarchar(20)
  public DaysUntilDue!: number; // int
  public TermsType!: number | null; // smallint, nullable
}

Terms.init(
  {
    TermsCode: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false, // adjust if needed
    },
    Terms: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    DaysUntilDue: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TermsType: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Invoice_Terms ', // 👈 Replace with actual table name
    timestamps: false,
  }
);
