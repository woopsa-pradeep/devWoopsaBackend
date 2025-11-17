// src/models/OtherTaxes.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust this path to your actual db connection

export class OtherTaxes extends Model {
  public OTP_Number!: number;         // smallint
  public OTP_Description!: string;    // nvarchar
}

OtherTaxes.init(
  {
    OTP_Number: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true, // optional — remove if not auto-increment
    },
    OTP_Description: {
      type: DataTypes.STRING, // STRING = nvarchar in Sequelize
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'OtherTaxes',
    timestamps: false,
  }
);
