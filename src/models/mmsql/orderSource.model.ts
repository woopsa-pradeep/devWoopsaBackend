import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path if needed

export class Order_Source extends Model {
  public Order_Source!: number;        // tinyint
  public Source_Description!: string;  // nvarchar
  public Source_Active!: boolean;      // bit
  public S_Number!: number;             // int
}

Order_Source.init(
  {
    Order_Source: {
      type: DataTypes.TINYINT,
      allowNull: false,
      primaryKey: true,
    },
    Source_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Source_Active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    S_Number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Order_Source',
    timestamps: false,
  }
);
