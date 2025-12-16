import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface DriverAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  currentLatitude: number;
  currentLongitude: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type DriverCreation = Optional<DriverAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Driver
  extends Model<DriverAttributes, DriverCreation>
  implements DriverAttributes 
{
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public isActive!: boolean;
  public password!: string;
  public currentLatitude!: number;
  public currentLongitude!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Driver.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    currentLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    currentLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'drivers',
    modelName: 'Driver',
    timestamps: true,
  
  }
);

