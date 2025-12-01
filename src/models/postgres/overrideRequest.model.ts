import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface IOverrideRequest {
  id: number;
  orderNumber: number;
  itemNumber: number;
  userId: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  note: string | null;
  rejectionReason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type OverrideRequestCreationAttributes = Optional<IOverrideRequest, 'id' | 'status' | 'note' | 'rejectionReason' >;

export class OverrideRequest
  extends Model<IOverrideRequest, OverrideRequestCreationAttributes>
  implements IOverrideRequest
{
  public id!: number;
  public orderNumber!: number;
  public itemNumber!: number;
  public userId!: number;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
  public note!: string | null;
  public rejectionReason!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OverrideRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_number',
    },
    itemNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'item_number',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'overrideRequests',
    modelName: 'OverrideRequest',
    timestamps: true,
  }
);

