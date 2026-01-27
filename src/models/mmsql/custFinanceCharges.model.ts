import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";

export class CustFinanceCharges extends Model {
  public myKey!: number;
  public C_Number!: number;
  public Date_Posted?: Date;
  public Finance_Charge?: number;
}

CustFinanceCharges.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Date_Posted: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Finance_Charge: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Cust_FinanceCharges",
    timestamps: false,
  }
);
