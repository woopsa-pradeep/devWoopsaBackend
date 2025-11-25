// models/recordLocks.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

// Interface for attributes
export interface IRecordLock {
  myKey: number;
  Lock_Type: number;
  Lock_Number: number;
  Lock_User: number;
  Lock_Workstation: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Attributes optional during creation
type RecordLockCreationAttributes = Optional<IRecordLock, 'myKey'>;

export class RecordLock
  extends Model<IRecordLock, RecordLockCreationAttributes>
  implements IRecordLock
{
  public myKey!: number;
  public Lock_Type!: number;
  public Lock_Number!: number;
  public Lock_User!: number;
  public Lock_Workstation!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RecordLock.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    sequelize: postgresSequelize,
    modelName: 'RecordLock',
    tableName: 'record_locks',
    timestamps: true,
  }
);
