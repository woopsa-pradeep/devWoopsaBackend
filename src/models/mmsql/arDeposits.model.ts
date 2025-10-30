import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../db';

export class ARDeposits extends Model {
  public Deposit_ID!: number;
  public Deposit_Date!: Date;
  public Deposit_Batch!: number;
  public Deposit_Reference?: string;
  public QB_Transfer?: boolean;
  public QB_TransferDate?: Date;
  public Deposit_Deleted?: boolean;
  public Deposit_DeleteDate?: Date;
  public Deposit_DeleteUser?: string;
  public Payment_Total?: number;
  public Adjustment_Total?: number;
  public ReturnCheck_Total?: number;
}

ARDeposits.init({
  Deposit_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  Deposit_Date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  Deposit_Batch: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
  Deposit_Reference: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  QB_Transfer: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  QB_TransferDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  Deposit_Deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  Deposit_DeleteDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  Deposit_DeleteUser: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
  Payment_Total: {
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true,
  },
  Adjustment_Total: {
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true,
  },
  ReturnCheck_Total: {
    type: DataTypes.DECIMAL(19, 4),
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'AR_Deposits',
  timestamps: false,
});
