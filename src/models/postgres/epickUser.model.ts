import { DataTypes, Model, Optional, CreationOptional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface EpickUserAttributes {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  userNumber: string | null;
  category: number[]; // Array of category IDs: [12, 10, 20]
  order_type: string | null; // 'order_number' | 'qty_number'
  shortby: string | null; // 'Asc' | 'Des'
  item_sort_by: string | null; // 'sales_location' | 'alphabetically' | 'item_number' | 'short_number' | 'line_number'
  status: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EpickUserCreationAttributes
  extends Optional<EpickUserAttributes, "id" | "createdAt" | "updatedAt"> {}

export class EpickUser
  extends Model<EpickUserAttributes, EpickUserCreationAttributes>
  implements EpickUserAttributes
{
  public id!: number;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public password!: string;
  public userNumber!: string | null;
  public category!: number[];
  public order_type!: string | null;
  public shortby!: string | null;
  public item_sort_by!: string | null;
  public status!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: CreationOptional<Date>;
  public readonly updatedAt!: CreationOptional<Date>;
}

EpickUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    order_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'order_number',
      validate: {
        isIn: [['order_number', 'qty_number']],
      },
    },
    shortby: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Des',
      validate: {
        isIn: [['Asc', 'Des']],
      },
    },
    item_sort_by: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'line_number',
      validate: {
        isIn: [['sales_location', 'alphabetically', 'item_number', 'short_number', 'line_number']],
      },
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
    modelName: "EpickUser",
    tableName: "epick_user",
    timestamps: true,
  }
);


