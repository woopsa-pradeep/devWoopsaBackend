import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface DriverExpenseAttributes {
  id: number;
  driverId: number;
  vehicleId: number | null;
  expenseType: string;
  amount: string;
  expenseDate: string;
  arSubTypeRef: string;
  receiptUrl: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type DriverExpenseCreation = Optional<
  DriverExpenseAttributes,
  | 'id'
  | 'vehicleId'
  | 'receiptUrl'
  | 'notes'
  | 'createdAt'
  | 'updatedAt'
>;

export class DriverExpense
  extends Model<DriverExpenseAttributes, DriverExpenseCreation>
  implements DriverExpenseAttributes
{
  public id!: number;
  public driverId!: number;
  public vehicleId!: number | null;
  public expenseType!: string;
  public amount!: string;
  public expenseDate!: string;
  public arSubTypeRef!: string;
  public receiptUrl!: string | null;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DriverExpense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expenseType: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    arSubTypeRef: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    receiptUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'driver_expenses',
    modelName: 'DriverExpense',
    timestamps: true,
  }
);
