// src/models/DocumentAdditionalFormats.ts

import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../db"; // adjust path if needed

export class DocumentAdditionalFormats extends Model {
  public myKey!: number;                    // int (PK)
  public Document_Type!: number;            // smallint
  public Document_FormatID!: number;        // smallint
  public Document_Description!: string;     // nvarchar
  public Document_ReportFileName!: string;  // nvarchar
}

DocumentAdditionalFormats.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Document_Type: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    Document_FormatID: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    Document_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Document_ReportFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Document_AdditionalFormats",
    timestamps: false,
  }
);
