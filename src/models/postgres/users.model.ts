// models/user.model.ts

import { DataTypes, Model, Optional } from "sequelize";
import { UserAttributes } from "../../interfaces/users.interface";
import { postgresSequelize } from "../../db";

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

export class WebUsers
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public status!: boolean;
  public role!: string;
  public userNumber!: string | null;

  public salesRepNumber!: string[]; // ✅ Updated to array

  public password!: string;
  public isActive!: boolean;
  public setUserDiscountLimit!: number;
  public allowSingleScan!: boolean;
  public allowDiscount!: boolean;

  public readonly createdAt!: Date;
  public readonly    updatedAt!: Date;
}

WebUsers.init(
  {
    
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
      validate: {
        isIn: [["epick", "sales", "driver"]],
      },
    },
    userNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ✅ Updated to Array
    salesRepNumber: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    setUserDiscountLimit: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0,
    },
    allowSingleScan: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowDiscount: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: "Users",
    tableName: "users",
    timestamps: true,
  }
);
