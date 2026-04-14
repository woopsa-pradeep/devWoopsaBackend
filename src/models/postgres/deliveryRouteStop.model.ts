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
  routeStarted: boolean;
  routeName: string;
  endLatitude: number;
  reSchedule: boolean;
  reScheduleDate: Date | null;
  reScheduleTime: string | null;
  reScheduleReason: string | null;
  reScheduleNotes: string | null;
  reScheduleCreatedAt: Date | null;
  cancelledAt: Date | null;
  reScheduleUpdatedAt: Date | null;
  endLongitude: number;
  arrivedAt?: Date | null;
  invoiceUrl: string | null;
  invoiceAmount: number;
  isLastStop: boolean;
  deliveredAt?: Date | null;
  cancelledReason?: string | null;
  polyline?: string | null;
  isTransferred?: boolean;
  estimatedTime?: number | null;
  transferredToC_Number?: number | null;
  transferredToLatitude?: number | null;
  transferredToLongitude?: number | null;

  originalC_Number?: number | null;
  originalLatitude?: number | null;
  originalLongitude?: number | null;

  type?: string;
  transferredAt?: Date | null;
  transferredReason?: string | null;
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
  public routeStarted!: boolean;
  public startLatitude!: number;
  public estimatedTime!: number | null;
  public startLongitude!: number;
  public endLatitude!: number;
  public endLongitude!: number;
  public isTransferred!: boolean;
  public transferredToC_Number!: number | null;
  public transferredToLatitude!: number | null;
  public transferredToLongitude!: number | null;
  public transferredAt!: Date | null;
  public transferredReason!: string | null;
  public reSchedule!: boolean;
  public reScheduleDate!: Date | null;
  public reScheduleTime!: string | null;
  public reScheduleReason!: string | null;
  public reScheduleNotes!: string | null;
  public reScheduleCreatedAt!: Date | null;
  public reScheduleUpdatedAt!: Date | null;
  public cancelledAt!: Date | null;
  public cancelledReason!: string | null;
  public invoiceUrl!: string | null;
  public invoiceAmount!: number;
  public type!: string;
  public polyline!: string;

  public originalC_Number!: number | null;
  public originalLatitude!: number | null;
  public originalLongitude!: number | null;

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
  CANCELLED = 'cancelled',
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
    invoiceUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoiceAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    routeStarted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    estimatedTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    polyline: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    stopSequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cancelledReason: {
      type: DataTypes.STRING,
      allowNull: true,
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
        DeliveryStopStatus.IN_PROGRESS,
        DeliveryStopStatus.CANCELLED
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
    cancelledAt: {
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

    // Add these fields to DeliveryRouteStop.init()

    isTransferred: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    transferredToC_Number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    transferredToLatitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },
    transferredToLongitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },
    transferredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    transferredReason: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    type: {
      type: DataTypes.ENUM(
        'regular',
        'return'
      ),
      allowNull: false,
      defaultValue: 'regular',
    },
    // Add to DeliveryRouteStop.init()

    originalC_Number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    originalLatitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },
    originalLongitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },
  }, {
  sequelize: postgresSequelize,
  tableName: 'Delivery_Route_Stops',
  modelName: 'DeliveryRouteStop',
  timestamps: true,
}
);
