// src/models/Record_Locks.ts

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path if needed

export class Record_Locks extends Model {
  public myKey!: number;
  public Lock_Type!: number;
  public Lock_Number!: number;
  public Lock_User!: number;
  public Lock_Workstation!: number;
}

Record_Locks.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Lock_Type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Lock_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Lock_User: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    Lock_Workstation: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Record_Locks',
    timestamps: false,
  }
);
