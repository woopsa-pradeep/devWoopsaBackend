import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db'; // Adjust to your sequelize instance path
import { ICustomerRouteAttributes } from '../../interfaces/customerRoute.interface';

export class CustomerRoute extends Model<ICustomerRouteAttributes>
  implements ICustomerRouteAttributes {
  public C_Number!: number;
  public Route_Number!: number;
  public Stop_Number!: number | null;

}

// Define the model
CustomerRoute.init(
  {
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Route_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Stop_Number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Customer_Routes',
    modelName: 'Customer_Routes',
    timestamps: false, 
  }
);