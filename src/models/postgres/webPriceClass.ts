import { DataTypes, Model, Optional } from "sequelize";
import { postgresSequelize } from '../../db';

interface WebPriceClassAttributes {
  id: number;
  priceClassId: number;
  name: string;
  image: string | null;
  status: boolean;
  
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type WebPriceClassCreationAttributes = Optional<WebPriceClassAttributes, "id" | "createdAt" | "updatedAt">;

export class WebPriceClass extends Model<WebPriceClassAttributes, WebPriceClassCreationAttributes>
  implements WebPriceClassAttributes {
  public id!: number;
  public priceClassId!: number;
  public name!: string;
  public image!: string | null;
  public status!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WebPriceClass.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    priceClassId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize:postgresSequelize,
    modelName: "WebPriceClass",
    tableName: "web_price_classes",
    timestamps: true,
  }
);
