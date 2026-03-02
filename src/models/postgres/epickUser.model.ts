import { DataTypes, Model, Optional, CreationOptional } from "sequelize";
import { postgresSequelize } from "../../db";

export type EpickAssignmentType = 'sales_category' | 'pickright_area';

export interface EpickUserAttributes {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  userNumber: string | null;
  assignmentType: EpickAssignmentType; // 'sales_category' | 'pickright_area'
  category: number[]; // Sales Category IDs when assignmentType === 'sales_category'
  pickRightAreas: string[]; // PickArea values when assignmentType === 'pickright_area'
  order_type: string | null; // 'order_number' | 'qty_number'
  shortby: string | null; // 'Asc' | 'Des'
  role: string; // 'epick' | 'receivable'
  item_sort_by: string | null; // 'sales_location' | 'section_location' | 'sales_section_location' | 'alphabetically' | 'alphabetically_section_location' | 'item_number' | 'short_number' | 'line_number'
  status: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EpickUserCreationAttributes
  extends Optional<EpickUserAttributes, "id" | "createdAt" | "updatedAt"> { }

export class EpickUser
  extends Model<EpickUserAttributes, EpickUserCreationAttributes>
  implements EpickUserAttributes {
  public id!: number;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public password!: string;
  public userNumber!: string | null;
  public assignmentType!: EpickAssignmentType;
  public category!: number[];
  public pickRightAreas!: string[];
  public order_type!: string | null;
  public shortby!: string | null;
  public item_sort_by!: string | null;
  public role!: string;
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
    assignmentType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'sales_category',
      validate: {
        isIn: [['sales_category', 'pickright_area']],
      },
    },
    category: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    pickRightAreas: {
      type: DataTypes.ARRAY(DataTypes.STRING),
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
        isIn: [['sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'item_number', 'short_number', 'line_number']],
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'epick',
      validate: {
        isIn: [['epick', 'receivable']],
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


