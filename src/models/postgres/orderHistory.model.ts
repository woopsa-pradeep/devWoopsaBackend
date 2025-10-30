import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db'; // adjust as per your setup

export class OrderHistory extends Model {
  public id!: number;
  public C_Number!: number;
  public Order_Number!: number;
  public order_Source!:string;
  public isActive!: boolean;
  public discount!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrderHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Order_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_Source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    discount:{
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    }
  },
  {
    sequelize: postgresSequelize,
    tableName: 'order_histories',
    timestamps: true,
  }
);
