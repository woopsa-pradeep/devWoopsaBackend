import { DataTypes, Model, Optional } from "sequelize";
import { postgresSequelize } from '../../db';

// Define attributes
interface WebQuickLinkAttributes {
  id: number;
  name: string;
  link: string;
  status: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Fields that can be optional when creating a new row
type WebQuickLinkCreationAttributes = Optional<WebQuickLinkAttributes, "id" | "status" | "createdAt" | "updatedAt">;

class WebQuickLink
  extends Model<WebQuickLinkAttributes, WebQuickLinkCreationAttributes>
  implements WebQuickLinkAttributes 
{
  public id!: number;
  public name!: string;
  public link!: string;
  public status!: boolean ;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WebQuickLink.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "web_quick_links", 
    modelName: "WebQuickLink",
    timestamps: true,
  }
);

export default WebQuickLink;
