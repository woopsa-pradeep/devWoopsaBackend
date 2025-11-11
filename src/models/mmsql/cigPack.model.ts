// src/models/CigPack.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path to your db connection

export class CigPack extends Model {
  public Cig_Pack!: number;         // smallint
  public Cig_Pack_Select!: boolean; // bit
}

CigPack.init(
  {
    Cig_Pack: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true, // assuming this uniquely identifies a record
    },
    Cig_Pack_Select: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'CigPack',
    timestamps: false,
  }
);
