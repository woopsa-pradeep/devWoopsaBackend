import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface DriverAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentLocation: string | null;

  driverLicenseNo: string | null;
  licenseExpirationDate: Date | null;
  licenseClass: 'A' | 'B' | 'C' | 'D' | null;
  driverPicture: string | null;
  dotMedicalCertificate: string | null;
  phoneNumber: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type DriverCreation = Optional<
  DriverAttributes,
  | 'id'
  | 'currentLatitude'
  | 'currentLongitude'
  | 'currentLocation'
  | 'driverLicenseNo'
  | 'licenseExpirationDate'
  | 'licenseClass'
  | 'driverPicture'
  | 'dotMedicalCertificate'
  | 'createdAt'
  | 'phoneNumber'
  | 'updatedAt'
>;

export class Driver
  extends Model<DriverAttributes, DriverCreation>
  implements DriverAttributes {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public isActive!: boolean;
  public currentLatitude!: number | null;
  public currentLongitude!: number | null;
  public currentLocation!: string | null;
  public phoneNumber!: string | null;
  public driverLicenseNo!: string | null;
  public licenseExpirationDate!: Date | null;
  public licenseClass!: 'A' | 'B' | 'C' | 'D' | null;
  public driverPicture!: string | null;
  public dotMedicalCertificate!: string | null;

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

    currentLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    driverLicenseNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    licenseExpirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    licenseClass: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: true,
    },

    driverPicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    dotMedicalCertificate: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    currentLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },

    currentLongitude: {
      type: DataTypes.DECIMAL(11, 8),
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
    tableName: 'drivers',
    modelName: 'Driver',
    timestamps: true,
  }
);
