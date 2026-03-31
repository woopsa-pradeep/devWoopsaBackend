import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export enum PaymentTerms {
  CASH = 'cash',
  CHECK = 'check',
  CREDIT = 'credit',
  NO_PAYMENT = 'no_payment',
}

export enum OrderPODStatus {
  DELIVERED = 'delivered',
  NOT_DELIVERED = 'not_delivered',
  IN_PROGRESS = 'in_progress',
  NOT_STARTED = 'not_started',
  PARTIAL = 'partial',
  RETURNED = 'returned',
  FAILED = 'failed',
}

interface DeliveryRoutePODAttributes {
  id: number;

  // Foreign Keys
  routeId: number;
  routeStopId: number;
  driverId: number;             // FK → Driver
  orderNumber: number;          // order from MSSQL
  C_Number: number;             // customer number

  // Order Scan
  scannedBundles: number;       // kitne bundles scan hue
  expectedBundles: number;      // kitne hone chahiye the
  allBundlesScanned: boolean;   // sab scan hue ya nahi

  // Order Status
  orderStatus: OrderPODStatus;
  paymentTermComplete: boolean;
  postDeliveryCompleted: boolean;
  // Payment
  paymentTerms: PaymentTerms;
  paymentInCheck: boolean;
  checkNumber: string | null;   // only if paymentInCheck = true
  checkImage: string | null;    // S3 URL of check photo
  checkImage1: string | null;    // S3 URL of check photo
  // Proof
  customerSignature: string | null;  // S3 URL of signature
  signBy: string | null;             // naam jo sign kiya
  photos: string[];                  // JSON array of S3 URLs
  boxBarCode: string[];
  scanBarCode: string[];

  // Notes
  notes: string | null;
  amount: number;
  // Timestamps
  podAt: Date;                  // jab POD capture hua
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type DeliveryRoutePODCreation = Optional<
  DeliveryRoutePODAttributes,
  'id' | 'checkNumber' | 'checkImage' | 'customerSignature' | 'signBy' | 'notes' | 'createdAt' | 'updatedAt' | 'boxBarCode' | 'scanBarCode'
>;

export class DeliveryRoutePOD
  extends Model<DeliveryRoutePODAttributes, DeliveryRoutePODCreation>
  implements DeliveryRoutePODAttributes {
  public id!: number;
  public routeId!: number;
  public routeStopId!: number;
  public driverId!: number;
  public orderNumber!: number;
  public C_Number!: number;
  public scannedBundles!: number;
  public expectedBundles!: number;
  public allBundlesScanned!: boolean;
  public orderStatus!: OrderPODStatus;
  public paymentTerms!: PaymentTerms;
  public paymentInCheck!: boolean;
  public checkNumber!: string | null;
  public amount!: number;
  public checkImage!: string | null;
  public customerSignature!: string | null;
  public signBy!: string | null;
  public photos!: string[];
  public notes!: string | null;
  public podAt!: Date;
  public boxBarCode!: string[];
  public scanBarCode!: string[];
  public paymentTermComplete!: boolean;
  public postDeliveryCompleted!: boolean;
  public checkImage1!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DeliveryRoutePOD.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    // Foreign Keys
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    routeStopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    boxBarCode: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    scanBarCode: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    paymentTermComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    postDeliveryCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Bundle Scan
    scannedBundles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    expectedBundles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    allBundlesScanned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // Order Status
    orderStatus: {
      type: DataTypes.ENUM(...Object.values(OrderPODStatus)),
      allowNull: false,
      defaultValue: OrderPODStatus.NOT_STARTED,
    },

    // Payment
    paymentTerms: {
      type: DataTypes.ENUM(...Object.values(PaymentTerms)),
      allowNull: false,
      defaultValue: PaymentTerms.CASH,
    },
    paymentInCheck: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    checkNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkImage: {
      type: DataTypes.STRING,   // S3 URL
      allowNull: true,
    },
    checkImage1: {
      type: DataTypes.STRING,
      allowNull: true,
    },


    // Proof of Delivery
    customerSignature: {
      type: DataTypes.STRING,   // S3 URL
      allowNull: true,
    },
    signBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photos: {
      type: DataTypes.JSONB,    // array of S3 URLs
      allowNull: false,
      defaultValue: [],
    },

    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // When POD captured
    podAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'Delivery_Route_PODs',
    modelName: 'DeliveryRoutePOD',
    timestamps: true,
  }
);

export default DeliveryRoutePOD;