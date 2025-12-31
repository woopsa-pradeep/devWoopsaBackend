// models/retailer.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IRetailer } from '../../interfaces/postgress/retailer.interface';

type RetailerCreationAttributes = Optional<IRetailer, 'id' | 'isAllow' | 'isActive'>;

export class Retailer extends Model<IRetailer, RetailerCreationAttributes> implements IRetailer {
  public id!: number;
  public Customer_Number!: number;
  public isAllow!: boolean;
  public isActive!: boolean;
  public password?: null;
  public role!: string | null;
  public maxOrderLimit!: number | null;
  public minOrderAmount!: number | null;
  public todayOrderCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Retailer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Customer_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isAllow: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'retailer',
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    maxOrderLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5,
    },
    todayOrderCount:{
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    minOrderAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 5,
    },
    enableMaxOrderQtyControl: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    enableMinOrderAmountControl: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
 
  },
  {
    sequelize: postgresSequelize,
    tableName: 'retailers',
    modelName: 'Retailer',
    timestamps: true,
  }
);
