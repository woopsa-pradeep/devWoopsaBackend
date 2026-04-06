import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface DriverDeviceAttributes {
  id: number;
  driverId: number;
  deviceToken: string | null;
  token: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type DriverDeviceCreation = Optional<
  DriverDeviceAttributes,
  'id' | 'deviceToken' | 'token' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export class DriverDevice
  extends Model<DriverDeviceAttributes, DriverDeviceCreation>
  implements DriverDeviceAttributes {
  public id!: number;
  public driverId!: number;
  public deviceToken!: string | null;
  public token!: string | null;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DriverDevice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    deviceToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'driverDevices',
    modelName: 'DriverDevice',
    timestamps: true,
  }
);
