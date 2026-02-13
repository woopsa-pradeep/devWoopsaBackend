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
  routeName: string;
  arrivedAt?: Date | null;
  deliveredAt?: Date | null;

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
  implements DeliveryRouteStopAttributes
{
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
  public status!: string;

  public arrivedAt!: Date | null;
  public deliveredAt!: Date | null;

  public isActive!: boolean;
}
export enum DeliveryStopStatus {
  NOT_DELIVERED = 'not_delivered',
  DELIVERED = 'delivered',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}
  

/** Init */
DeliveryRouteStop.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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

    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        DeliveryStopStatus.NOT_DELIVERED,
        DeliveryStopStatus.DELIVERED,
        DeliveryStopStatus.SKIPPED,
        DeliveryStopStatus.FAILED
      ),
      allowNull: false,
      defaultValue: DeliveryStopStatus.NOT_DELIVERED,
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
