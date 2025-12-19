import { DataTypes, Model, Optional, CreationOptional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface EpickConfirmationAttributes {
  id: number;
  orderNumber: number;
  pickerUserNumber: number; // userNumber for display
  pickerUserId: number; // user id for unique tracking
  category: number[]; // Array of categories user is picking: [12, 10]
  status: 'in_progress' | 'completed';
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EpickConfirmationCreationAttributes
  extends Optional<EpickConfirmationAttributes, "id" | "createdAt" | "updatedAt"> {}

export class EpickConfirmation
  extends Model<EpickConfirmationAttributes, EpickConfirmationCreationAttributes>
  implements EpickConfirmationAttributes
{
  public id!: number;
  public orderNumber!: number;
  public pickerUserNumber!: number;
  public pickerUserId!: number;
  public category!: number[];
  public status!: 'in_progress' | 'completed';
  public startedAt!: Date | null;
  public completedAt!: Date | null;
  public readonly createdAt!: CreationOptional<Date>;
  public readonly updatedAt!: CreationOptional<Date>;
}

EpickConfirmation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pickerUserNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pickerUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    modelName: "EpickConfirmation",
    tableName: "epick_confirmation",
    timestamps: true,
  }
);


