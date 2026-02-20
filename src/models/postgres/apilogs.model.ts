import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

/*
  Interface for ApiLog attributes
*/
export interface ApiLogAttributes {
  id: number;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  // userId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}


type ApiLogCreationAttributes = Optional<ApiLogAttributes, 'id'>;

/*
  Model definition
*/
class ApiLog
  extends Model<ApiLogAttributes, ApiLogCreationAttributes>
  implements ApiLogAttributes
{
  public id!: number;
  public method!: string;
  public url!: string;
  public statusCode!: number;
  public responseTime!: number;
  // public userId!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/*
  Initialize the model
*/
ApiLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    method: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    // },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'api_logs',
    modelName: 'ApiLog',
    timestamps: true,
  }
);

export default ApiLog;
