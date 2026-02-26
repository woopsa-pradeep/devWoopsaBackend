// models/product-discount.model.ts
import { Model, DataTypes, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface IProductDiscount {
  id: number;
  ItemNumber: number;
  quantity: number;

  discountType: string; // flat or percentage
  discountValue: number;

  startDate: Date;
  endDate: Date;

  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

type ProductDiscountCreationAttributes = Optional<
  IProductDiscount,
  "id" | "isActive" | "createdAt" | "updatedAt"
>;

export class ProductDiscount
  extends Model<IProductDiscount, ProductDiscountCreationAttributes>
  implements IProductDiscount
{
  public id!: number;
  public ItemNumber!: number;
  public quantity!: number;

  public discountType!: string;
  public discountValue!: number;

  public startDate!: Date;
  public endDate!: Date;

  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductDiscount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    ItemNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    discountType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["flat", "percentage"]],
      },
    },

    discountValue: {
      type: DataTypes.DECIMAL(10, 2), // supports 0.50 etc
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

   
  },
  {
    sequelize: postgresSequelize,
    tableName: "productDiscounts",
    modelName: "ProductDiscount",
    timestamps: true,
  }
);