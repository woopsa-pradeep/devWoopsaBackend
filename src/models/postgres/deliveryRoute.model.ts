import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

/** Attributes */
interface DeliveryRouteAttributes {
  id: number;
  routeNumber: string;
  day: Date;
  hasChildren: boolean;
  driverId: number;
  truckId: number;
  parentRouteId ?: number;
  orderStartLat: number;
  orderStartLong: number;
  orderEndLat: number;
  orderEndLong: number;
  totalKilometers: number;
  routeStatus: string;
  routeGroupKey: string;  
  splitIndex: number;
  totalStops: number;
  completedStops: number;

  isActive: boolean;
}

export enum RouteStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
  }
  
/** Creation attributes */
type DeliveryRouteCreationAttributes =
  Optional<
    DeliveryRouteAttributes,
    'id' | 'routeStatus' | 'totalStops' | 'completedStops' | 'isActive'
  >;

/** Model */
export class DeliveryRoute
  extends Model<DeliveryRouteAttributes, DeliveryRouteCreationAttributes>
  implements DeliveryRouteAttributes
{
  public id!: number;
  public routeNumber!: string;
  public day!: Date;
  public splitIndex!: number;
  public hasChildren!: boolean;
  public driverId!: number;
  public truckId!: number;
  public parentRouteId ?: number;
  public orderStartLat!: number;
  public orderStartLong!: number;
  public orderEndLat!: number;
  public orderEndLong!: number;
  public routeGroupKey!: string;
  public routeStatus!: string;
  public totalKilometers!: number;

  public totalStops!: number;
  public completedStops!: number;

  public isActive!: boolean;
}

/** Init */
DeliveryRoute.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    routeNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    parentRouteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    routeGroupKey : {
      type: DataTypes.STRING,
      allowNull: false,
    },
    splitIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    day: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    hasChildren: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    truckId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    orderStartLat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    orderStartLong: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    orderEndLat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    orderEndLong: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    routeStatus: {
        type: DataTypes.ENUM(
          RouteStatus.NOT_STARTED,
          RouteStatus.IN_PROGRESS,
          RouteStatus.COMPLETED,
          RouteStatus.CANCELLED
        ),
        allowNull: false,
        defaultValue: RouteStatus.NOT_STARTED,
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
    completedStops: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'Delivery_Routes',
    modelName: 'DeliveryRoute',
    timestamps: true,
  }
);
