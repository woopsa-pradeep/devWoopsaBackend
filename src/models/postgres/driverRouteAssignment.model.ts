import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface DriverRouteAssignmentAttributes {
  id: number;
  driverId: number;
  routes: string[];
  deliveryDay: string;
  deliveryDayNumber: number;
}

type DriverRouteAssignmentCreation = Optional<DriverRouteAssignmentAttributes, 'id'>;

export class DriverRouteAssignment
  extends Model<DriverRouteAssignmentAttributes, DriverRouteAssignmentCreation>
  implements DriverRouteAssignmentAttributes 
{
  public id!: number;
  public driverId!: number;
  public routes!: string[];
  public deliveryDay!: string;
  public deliveryDayNumber!: number;
}

DriverRouteAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    routes: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    deliveryDay: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deliveryDayNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'driverrouteassignment',
    modelName: 'DriverRouteAssignment',
    timestamps: true,
    underscored: true,
  }
);

