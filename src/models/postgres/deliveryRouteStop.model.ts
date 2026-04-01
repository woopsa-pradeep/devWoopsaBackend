import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

/** Attributes */
interface DeliveryRouteStopAttributes {
  id: number;
  routeId: number;
  orderNumber: number;
  C_Number: number;
  stopSequence: number;
  totalKilometers: number;
  latitude: number;
  longitude: number;
  notes?: string;
  status: string;
  startLatitude: number;
  startLongitude: number;
  routeName: string;
  endLatitude: number;
  reSchedule: boolean;
  reScheduleDate: Date | null;
  reScheduleTime: string | null;
  reScheduleReason: string | null;
  reScheduleNotes: string | null;
  reScheduleCreatedAt: Date | null;
  reScheduleUpdatedAt: Date | null;
  endLongitude: number;
  arrivedAt?: Date | null;
  isLastStop: boolean;
  deliveredAt?: Date | null;
  day: Date;
  isActive: boolean;
}

/** Creation attributes */
type DeliveryRouteStopCreationAttributes =
  Optional<
    DeliveryRouteStopAttributes,
    'id' | 'status' | 'arrivedAt' | 'deliveredAt' | 'isActive'
  >;

/** Model */
export class DeliveryRouteStop
  extends Model<
    DeliveryRouteStopAttributes,
    DeliveryRouteStopCreationAttributes
  >
  implements DeliveryRouteStopAttributes {
  public id!: number;
  public routeId!: number;
  public orderNumber!: number;
  public isChild!: boolean;
  public parentDeliveryRouteId!: number;
  public C_Number!: number;
  public stopSequence!: number;
  public latitude!: number;
  public routeName!: string;
  public longitude!: number;
  public totalKilometers!: number;
  public day!: Date;
  public status!: string;
  public startLatitude!: number;
  public startLongitude!: number;
  public endLatitude!: number;
  public endLongitude!: number;

  public reSchedule!: boolean;
  public reScheduleDate!: Date | null;
  public reScheduleTime!: string | null;
  public reScheduleReason!: string | null;
  public reScheduleNotes!: string | null;
  public reScheduleCreatedAt!: Date | null;
  public reScheduleUpdatedAt!: Date | null;

  public arrivedAt!: Date | null;
  public isLastStop!: boolean;
  public deliveredAt!: Date | null;

  public isActive!: boolean;
}
export enum DeliveryStopStatus {
  NOT_DELIVERED = 'not_delivered',
  DELIVERED = 'delivered',
  SKIPPED = 'skipped',
  FAILED = 'failed',
  RETURNED = 'returned',
  IN_PROGRESS = 'in_progress',
}


/** Init */
DeliveryRouteStop.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    day: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: new Date(),
    },

    routeName: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      defaultValue: '',
      allowNull: true,
    },


    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalKilometers: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    stopSequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startLatitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    startLongitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    endLatitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    endLongitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    isLastStop: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    status: {
      type: DataTypes.ENUM(
        DeliveryStopStatus.NOT_DELIVERED,
        DeliveryStopStatus.DELIVERED,
        DeliveryStopStatus.SKIPPED,
        DeliveryStopStatus.FAILED,
        DeliveryStopStatus.RETURNED,
        DeliveryStopStatus.IN_PROGRESS
      ),
      allowNull: false,
      defaultValue: DeliveryStopStatus.NOT_DELIVERED,
    },

    reSchedule: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reScheduleDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reScheduleTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reScheduleReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reScheduleNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reScheduleCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reScheduleUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    arrivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    deliveredAt: {
      type: DataTypes.DATE,
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
    tableName: 'Delivery_Route_Stops',
    modelName: 'DeliveryRouteStop',
    timestamps: true,
  }
);
