import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";

export class ARDetails extends Model {
  public myKey!: number;
  public P_Number_AppliedFrom!: number;
  public P_Number_AppliedTo!: number;
  public Applied_Amount!: number;
  public Control_Time?: Date;
  public UserNumber?: number;
}

ARDetails.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    P_Number_AppliedFrom: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    P_Number_AppliedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Applied_Amount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    Control_Time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    UserNumber: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "AR_Details",
    modelName: 'AR_Details',
    timestamps: false,
  }
);
