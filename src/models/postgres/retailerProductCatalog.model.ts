import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

// Define the attributes
interface RetailerProductCatalogAttributes {
  id: number;
  name: string;
  description: string;
  C_Number: number;
  status: boolean;
  link: string | null;
  attachment: string;
  isActive: boolean;
}

// Optional fields when creating
type RetailerProductCatalogCreationAttributes = Optional<RetailerProductCatalogAttributes, 'id'>;

// Define the model class
export class RetailerProductCatalog
  extends Model<RetailerProductCatalogAttributes, RetailerProductCatalogCreationAttributes>
  implements RetailerProductCatalogAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public C_Number!: number;
  public status!: boolean;
  public link!: string | null;
  public attachment!: string;
  public isActive!: boolean;
}

// Initialize the model
RetailerProductCatalog.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,

    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'RetailerProductCatalogs',
    modelName: 'RetailerProductCatalog',
    timestamps: true, // Set to true if you want createdAt / updatedAt
  }
);
