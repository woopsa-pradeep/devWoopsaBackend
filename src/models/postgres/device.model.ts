// models/device-id.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IDevice } from '../../interfaces/postgress/device.interface';

type DeviceIdCreationAttributes = Optional<IDevice, 'id' | 'isAllow'>;

export class RetailerDevice extends Model<IDevice, DeviceIdCreationAttributes> implements IDevice {
  public id!: number;
  public customerNumber!: number;
  public deviceId!: string;
  public deviceName!: string;
  public deviceType!:string;
  public isAllow!: boolean;
  public sessionActive!: boolean;
  public isActive!: boolean;
  public deviceToken!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RetailerDevice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    customerNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sessionActive:{
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deviceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deviceType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAllow: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'device_ids',
    modelName: 'RetailerDevice',
    timestamps: true,
  }
);
