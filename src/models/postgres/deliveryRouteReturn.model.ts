import { DataTypes, Model, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export enum DeliveryRouteReturnStatus {
  PENDING = "pending",
  PICKED_UP = "picked_up",
  RETURNED_TO_WAREHOUSE = "returned_to_warehouse",
}

interface DeliveryRouteReturnAttributes {
  id: number;
  routeId: number;
  driverId: number;
  C_Number: number;
  orderNumber: number;
  pickupLatitude: string | null;
  pickupLongitude: string | null;
  returnReason: string | null;
  returnNotes: string | null;
  photos: string[];
  customerSignature: string | null;
  signBy: string | null;
  boxBarCode: string[];
  scanBarCode: string[];
  status: DeliveryRouteReturnStatus;
  pickedUpAt: Date | null;
  returnedToWarehouseAt: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type DeliveryRouteReturnCreation = Optional<
  DeliveryRouteReturnAttributes,
  | "id"
  | "pickupLatitude"
  | "pickupLongitude"
  | "returnReason"
  | "returnNotes"
  | "photos"
  | "customerSignature"
  | "signBy"
  | "boxBarCode"
  | "scanBarCode"
  | "status"
  | "pickedUpAt"
  | "returnedToWarehouseAt"
  | "createdAt"
  | "updatedAt"
>;

export class DeliveryRouteReturn
  extends Model<
    DeliveryRouteReturnAttributes,
    DeliveryRouteReturnCreation
  >
  implements DeliveryRouteReturnAttributes
{
  public id!: number;
  public routeId!: number;
  public driverId!: number;
  public C_Number!: number;
  public orderNumber!: number;
  public pickupLatitude!: string | null;
  public pickupLongitude!: string | null;
  public returnReason!: string | null;
  public returnNotes!: string | null;
  public photos!: string[];
  public customerSignature!: string | null;
  public signBy!: string | null;
  public boxBarCode!: string[];
  public scanBarCode!: string[];
  public status!: DeliveryRouteReturnStatus;
  public pickedUpAt!: Date | null;
  public returnedToWarehouseAt!: Date | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DeliveryRouteReturn.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pickupLatitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },
    pickupLongitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },
    returnReason: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    returnNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    photos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    customerSignature: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    signBy: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
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
    status: {
      type: DataTypes.ENUM(...Object.values(DeliveryRouteReturnStatus)),
      allowNull: false,
      defaultValue: DeliveryRouteReturnStatus.PENDING,
    },
    pickedUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    returnedToWarehouseAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "Delivery_Route_Returns",
    modelName: "DeliveryRouteReturn",
    timestamps: true,
  }
);

export default DeliveryRouteReturn;
