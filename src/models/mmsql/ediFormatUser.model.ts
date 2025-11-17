// src/models/EDIFormatsUser.ts

import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../db"; // adjust path based on your project

export class EDIFormatsUser extends Model {
  public EDI_ID!: number;                 // int (PK assumed)
  public EDI_Format!: number;             // int
  public EDI_DescriptionUser!: string;    // nvarchar
  public EDI_OptionsUser!: string;        // nvarchar
  public EDI_AccountNumber!: string;      // nvarchar
}

EDIFormatsUser.init(
  {
    EDI_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // remove if MSSQL does NOT use it as PK
    },
    EDI_Format: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    EDI_DescriptionUser: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    EDI_OptionsUser: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
    EDI_AccountNumber: {
      type: DataTypes.STRING, // nvarchar
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "EDI_FormatsUser",
    timestamps: false,
  }
);
