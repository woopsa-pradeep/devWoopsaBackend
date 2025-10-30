// src/models/salesCallTime.model.tsx
import { DataTypes, Model, Optional } from "sequelize";
import { postgresSequelize } from '../../db'; // Adjust path as per your setup

// Attributes
export interface SalesCallTimeAttributes {
  id: number;
  customer_number: number;
  salesRepNumber: number;
  webUserId: number | null;
  time: string; // maps to DB column "Time"
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation attributes (id/createdAt/updatedAt auto-managed)
type SalesCallTimeCreationAttributes = Optional<
  SalesCallTimeAttributes,
  "id" | "createdAt" | "updatedAt"
>;

class SalesCallTime
  extends Model<SalesCallTimeAttributes, SalesCallTimeCreationAttributes>
  implements SalesCallTimeAttributes
{
  public id!: number;
  public customer_number!: number;
  public salesRepNumber!: number;
  public webUserId!: number | null;
  public time!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SalesCallTime.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    customer_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    salesRepNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    webUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    time: {
        type: DataTypes.STRING, 
      allowNull: false,
      field: "Time",
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: "SalesCallTimes",
    modelName: "SalesCallTime",
    timestamps: true,
   
  }
);

export default SalesCallTime;
