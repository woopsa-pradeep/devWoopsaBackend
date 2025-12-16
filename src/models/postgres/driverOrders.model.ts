import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface DriverOrdersAttributes {
  id: number;
  orderNumber: string;
  status: 'pending' | 'rescheduled' | 'return' | 'inProgress' | 'completed' | 'cancelled';
  startTime: Date | null;
  endTime: Date | null;
  estimateTime: Date | null;
  images: string[];
  note: string;
  totalScanBundle: number;
  totalBundle: number;
  damageBundle: number;
  scanBarcode: string[];
  barCode: string[];
  paymentMethod: string;
  amount: number;
  checkImage: string[];
  checkNumber: number;
  completeScan: boolean;
  completePayment: boolean;
  completeDeliverRequirement: boolean;
  customerSignature: string;
  signedBy: string;
}

type DriverOrdersCreation = Optional<DriverOrdersAttributes, 'id'>;

export class DriverOrders
  extends Model<DriverOrdersAttributes, DriverOrdersCreation>
  implements DriverOrdersAttributes 
{
  public id!: number;
  public orderNumber!: string;
  public status!: 'pending' | 'rescheduled' | 'return' | 'inProgress' | 'completed' | 'cancelled';
  public startTime!: Date | null;
  public endTime!: Date | null;
  public estimateTime!: Date | null;
  public images!: string[];
  public note!: string;
  public totalScanBundle!: number;
  public totalBundle!: number;
  public damageBundle!: number;
  public scanBarcode!: string[];
  public barCode!: string[];
  public paymentMethod!: string;
  public amount!: number;
  public checkImage!: string[];
  public checkNumber!: number;
  public completeScan!: boolean;
  public completePayment!: boolean;
  public completeDeliverRequirement!: boolean;
  public customerSignature!: string;
  public signedBy!: string;
}

DriverOrders.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'rescheduled', 'return', 'inProgress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    estimateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    note: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    totalScanBundle: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalBundle: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    damageBundle: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    scanBarcode: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    barCode: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    checkImage: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    checkNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    completeScan: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completePayment: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completeDeliverRequirement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    customerSignature: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    signedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'driverorders',
    modelName: 'DriverOrders',
    timestamps: true,
    underscored: true,
  }
);

