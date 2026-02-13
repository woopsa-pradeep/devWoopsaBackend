import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface VehicleAttributes {
  id: number;
  description: string | null;
  loadCapacityLbs: number | null; // "Load Capacity" (3000 lbs)
  truckType: string | null; // "Type of Truck" (e.g., Sprinter)
  licenseRegistrationNumber: string | null;
  vinNumber: string | null;
  engineType: 'gasoline' | 'electric' | 'diesel' | null;
  lastServiceDate: Date | null;
  lastOilChangeDate: Date | null;
  nextOilChangeAfterMonths: number | null; // dropdown like 1,2,3,6,12 months
  mileageHours: number | null; // "Mileage / Hours" current usage
  // More details (insurance)
  insurancePolicyNumber: string | null;
  insuranceCarrier: string | null;
  insuranceExpirationDate: Date | null;
  // Condition
  conditionStatus: string | null; // e.g., "Good", "Needs Repair"
  physicalNotes: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type VehicleCreation = Optional<
  VehicleAttributes,
  | 'id'
  | 'description'
  | 'loadCapacityLbs'
  | 'truckType'
  | 'licenseRegistrationNumber'
  | 'vinNumber'
  | 'engineType'
  | 'lastServiceDate'
  | 'lastOilChangeDate'
  | 'nextOilChangeAfterMonths'
  | 'mileageHours'
  | 'insurancePolicyNumber'
  | 'insuranceCarrier'
  | 'insuranceExpirationDate'
  | 'conditionStatus'
  | 'physicalNotes'
  | 'createdAt'
  | 'updatedAt'
>;

export class Vehicle
  extends Model<VehicleAttributes, VehicleCreation>
  implements VehicleAttributes
{
  public id!: number;
  public description!: string | null;
  public loadCapacityLbs!: number | null;
  public truckType!: string | null;
  public licenseRegistrationNumber!: string | null;
  public vinNumber!: string | null;
  public engineType!: 'gasoline' | 'electric' | 'diesel' | null;
  public lastServiceDate!: Date | null;
  public lastOilChangeDate!: Date | null;
  public nextOilChangeAfterMonths!: number | null;
  public mileageHours!: number | null;
  public insurancePolicyNumber!: string | null;
  public insuranceCarrier!: string | null;
  public insuranceExpirationDate!: Date | null;
  public conditionStatus!: string | null;
  public physicalNotes!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loadCapacityLbs: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    truckType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    licenseRegistrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vinNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    engineType: {
      type: DataTypes.ENUM('gasoline', 'electric', 'diesel'),
      allowNull: true,
    },
    lastServiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    lastOilChangeDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nextOilChangeAfterMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mileageHours: {
      // can be mileage or hours; keep numeric
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    insurancePolicyNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    insuranceCarrier: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    insuranceExpirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    conditionStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    physicalNotes: {
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
    tableName: 'vehicles',
    modelName: 'Vehicle',
    timestamps: true,
  }
);

export default Vehicle;
