import { CreationOptional, DataTypes, Model } from "sequelize";
import { postgresSequelize } from "../../db";

export class CheckerActionLog extends Model {
  declare id: CreationOptional<number>;
  declare orderNumber: number;
  declare checkerUserId: number | null;
  declare actionType: string;
  declare itemNumber: number | null;
  declare lineNumber: number | null;
  declare boxId: number | null;
  declare deltaQty: number | null;
  declare deltaBundles: number | null;
  declare meta: Record<string, any> | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CheckerActionLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderNumber: { type: DataTypes.INTEGER, allowNull: false },
    checkerUserId: { type: DataTypes.INTEGER, allowNull: true },
    actionType: { type: DataTypes.STRING(64), allowNull: false },
    itemNumber: { type: DataTypes.INTEGER, allowNull: true },
    lineNumber: { type: DataTypes.INTEGER, allowNull: true },
    boxId: { type: DataTypes.INTEGER, allowNull: true },
    deltaQty: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    deltaBundles: { type: DataTypes.INTEGER, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize: postgresSequelize,
    tableName: "Checker_Action_Log",
    timestamps: true,
    indexes: [
      { fields: ["orderNumber"] },
      { fields: ["checkerUserId"] },
      { fields: ["actionType"] },
      { fields: ["createdAt"] },
    ],
  }
);

