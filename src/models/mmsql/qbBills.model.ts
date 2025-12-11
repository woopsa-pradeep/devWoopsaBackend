import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // update path if needed

export class QBBills extends Model {
  public QB_Reference!: number;
  public PO_Number!: number;
  public QB_BillType!: number;
  public QB_CostCode!: number;
  public QB_Adjustment!: number;
  public QB_DueDate!: Date;
  public QB_DiscountDate!: Date;
  public QB_Transfer!: boolean;
  public QB_TransferDate!: Date;
}

QBBills.init(
  {
    QB_Reference: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: false,   // set true if identity
    },
    PO_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    QB_BillType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    QB_CostCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    QB_Adjustment: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    QB_DueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    QB_DiscountDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    QB_Transfer: {
      type: DataTypes.BOOLEAN, // maps MSSQL BIT → BOOLEAN
      allowNull: false,
      defaultValue: false,
    },
    QB_TransferDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'QB_Bills',
    timestamps: false,
  }
);
