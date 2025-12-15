import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db';

/**
 * Interface for table attributes
 */
export interface IRoute {
  Route_Number: number;
  Route_Description: string;
  Route_Reference: string;
  Route_DayOfWeek: number;
  
}

/**
 * Attributes optional during creation
 */
type RouteCreationAttributes = Optional<IRoute, 'Route_Number'>;

export class Route
  extends Model<IRoute, RouteCreationAttributes>
  implements IRoute
{
  public Route_Number!: number;
  public Route_Description!: string;
  public Route_Reference!: string;
  public Route_DayOfWeek!: number;
}

Route.init(
  {
    Route_Number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    Route_Description: {
      type: DataTypes.STRING(255), // nvarchar
      allowNull: false,
    },

    Route_Reference: {
      type: DataTypes.STRING(255), // nvarchar
      allowNull: false,
    },

    Route_DayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Routes',
    tableName: 'Routes',
    timestamps: false, // set true if you want createdAt/updatedAt
  }
);
