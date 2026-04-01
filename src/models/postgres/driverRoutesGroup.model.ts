// models/DeliveryRouteGroup.ts

import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface DeliveryRouteGroupAttributes {
  id: number;
  groupNumber: string;        // e.g. "GRP-2026-01-12-001"
  day: string;                // delivery day
  totalOrders: number;        // 40 orders
  totalRoutes: number;        // 3 routes
  totalStops: number;         // sum of all stops across all routes
  totalKilometers: number;    // sum of all routes km
  totalMiles: number;         // sum of all routes miles
  originLat: number;
  originLng: number;
  destinationLat: number;
  routeType: 'manual' | 'auto';
  destinationLng: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type DeliveryRouteGroupCreation = Optional<
  DeliveryRouteGroupAttributes,
  | 'id'
  | 'totalKilometers'
  | 'totalMiles'
  | 'totalStops'
  | 'createdAt'
  | 'updatedAt'
>

export class DeliveryRouteGroup
  extends Model<DeliveryRouteGroupAttributes, DeliveryRouteGroupCreation>
  implements DeliveryRouteGroupAttributes {
  public id!: number;
  public groupNumber!: string;
  public day!: string;
  public totalOrders!: number;
  public totalRoutes!: number;
  public totalStops!: number;
  public totalKilometers!: number;
  public totalMiles!: number;
  public originLat!: number;
  public originLng!: number;
  public destinationLat!: number;
  public routeType!: 'manual' | 'auto';
  public destinationLng!: number;
  public status!: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DeliveryRouteGroup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    groupNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,              // no duplicate group numbers
    },
    routeType: {
      type: DataTypes.ENUM('manual', 'auto'),
      allowNull: false,
      defaultValue: 'auto',
    },
    day: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalRoutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalStops: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalKilometers: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalMiles: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
    },
    originLat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    originLng: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    destinationLat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    destinationLng: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'not_started',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'Delivery_Route_Groups',
    modelName: 'DeliveryRouteGroup',
    timestamps: true,
  }
);

export default DeliveryRouteGroup;