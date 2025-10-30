import { DataTypes, Model, Optional } from "sequelize";
import { postgresSequelize } from '../../db';

// Define attributes
interface WebCategoryAttributes {
  id: number;
  categoryId: number;
  name: string;
  image: string | null;
  status: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// For creation (categoryId is auto-increment, createdAt/updatedAt auto-managed)
type WebCategoryCreationAttributes = Optional<WebCategoryAttributes, "categoryId" | "createdAt" | "updatedAt">;

export class WebCategory extends Model<WebCategoryAttributes, WebCategoryCreationAttributes>
  implements WebCategoryAttributes {
  public id!: number;
  public categoryId!: number;
  public name!: string;
  public image!: string | null;
  public status!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WebCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryId: {
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
    modelName: "WebCategory",
    tableName: "web_categories",
    timestamps: true,
  }
);
