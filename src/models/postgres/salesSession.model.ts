import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db'; // Adjust path as per your setup

// Define attributes
interface SalesSessionAttributes {
  id: number;
  userId: number;
  currentCustomerId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Fields that are optional when creating
type SalesSessionCreationAttributes = Optional<SalesSessionAttributes, 'id'>;

// Define the model
class SalesSession extends Model<SalesSessionAttributes, SalesSessionCreationAttributes>
  implements SalesSessionAttributes {
  public id!: number;
  public userId!: number;
  public currentCustomerId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize model
SalesSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currentCustomerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'sales_sessions',
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

export default SalesSession;
