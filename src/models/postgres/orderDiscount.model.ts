import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface IOrderDiscount {
  id: number;
  orderNumber: number;
  discount: number;
  discountType: "percent" | "flat"; 
  salesId: number;
  CustomerNumber: number;
  isActive: boolean;
  description?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

type OrderDiscountCreationAttributes = Optional<
  IOrderDiscount,
  | "id"
  | "discountType"
  | "CustomerNumber"
  | "isActive"
  | "description"
  | "createdAt"
  | "updatedAt"
>;

export class OrderDiscount
  extends Model<IOrderDiscount, OrderDiscountCreationAttributes>
  implements IOrderDiscount
{
  public id!: number;
  public orderNumber!: number;
  public discount!: number;
  public discountType!: "percent" | "flat";
  public salesId!: number;
  public CustomerNumber!: number;
  public isActive!: boolean;
  public description?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderDiscount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    discountType: {
      type: DataTypes.ENUM("percent", "flat"),
      allowNull: false,
      defaultValue: "flat",
    },

    salesId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    CustomerNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "order_discounts",
    modelName: "OrderDiscount",
    timestamps: true,
  }
);

export default OrderDiscount;
