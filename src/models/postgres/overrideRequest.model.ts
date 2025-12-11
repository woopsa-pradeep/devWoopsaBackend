import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface IOverrideRequest {
  id: number;
  orderNumber: number;
  itemNumber: number;
  pickerUserNumber: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestType: 'scan' | 'pass';
  qty: number;
  note: string | null;
  rejectionReason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type OverrideRequestCreationAttributes = Optional<IOverrideRequest, 'id' | 'status' | 'note' | 'rejectionReason' | 'requestType' | 'qty'>;

export class OverrideRequest
  extends Model<IOverrideRequest, OverrideRequestCreationAttributes>
  implements IOverrideRequest
{
  public id!: number;
  public orderNumber!: number;
  public itemNumber!: number;
  public pickerUserNumber!: number;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
  public requestType!: 'scan' | 'pass';
  public qty!: number;
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
    pickerUserNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'picker_user_number',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    requestType: {
      type: DataTypes.ENUM('scan', 'pass'),
      allowNull: false,
      defaultValue: 'pass',
      field: 'request_type',
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'override_request',
    modelName: 'OverrideRequest',
    timestamps: true,
  }
);

