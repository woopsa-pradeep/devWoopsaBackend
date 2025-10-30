import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

export class ArDeposits extends Model {}

ArDeposits.init(
  {
    Deposit_ID: { type: DataTypes.INTEGER, primaryKey: true },
    Deposit_Date: { type: DataTypes.DATE },
    Deposit_Batch: { type: DataTypes.SMALLINT },
    Deposit_Reference: { type: DataTypes.STRING },
    QB_Transfer: { type: DataTypes.BOOLEAN },
    QB_TransferDate: { type: DataTypes.DATE },
    Deposit_Deleted: { type: DataTypes.BOOLEAN },
    Deposit_DeleteDate: { type: DataTypes.DATE },
    Deposit_DeleteUser: { type: DataTypes.SMALLINT },
    Payment_Total: { type: DataTypes.DECIMAL },
    Adjustment_Total: { type: DataTypes.DECIMAL },
    ReturnCheck_Total: { type: DataTypes.DECIMAL },
  },
  {
    sequelize,
    tableName: "AR_Deposits",
    timestamps: false,
  }
);