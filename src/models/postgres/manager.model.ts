import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db'; // update path as per your setup

// Interface for fields
export interface IManager {
  id: number;
  managerId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional for creation (id, timestamps auto-handled)
type ManagerCreationAttributes = Optional<IManager, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;

export class Manager extends Model<IManager, ManagerCreationAttributes> implements IManager {
  public id!: number;
  public managerId!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Sequelize model definition
Manager.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    managerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'manager',
    modelName: 'Manager',
    timestamps: true,
  }
);
