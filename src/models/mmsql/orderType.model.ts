import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db';

export class OrderType extends Model {
  public Order_Type!: number;
  public Type_Description!: string;
  public Type_Active!: boolean;
}

OrderType.init(
  {
    Order_Type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      primaryKey: true,
    },
    Type_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Type_Active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Order_Types',
    timestamps: false,
  }
);
