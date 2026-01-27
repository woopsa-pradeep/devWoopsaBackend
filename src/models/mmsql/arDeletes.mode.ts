import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";

export class ARDeletes extends Model {
  public P_Number!: number;
  public C_Number!: number;
  public Invoice_Number?: number;
  public AR_Type?: string;
  public AR_SubType?: number;
  public AR_Date?: Date;
  public AR_CheckDate?: Date;
  public AR_Ref?: string;
  public AR_Amount?: number;
  public User_Number?: number;
  public AR_DeleteDate?: Date;
}

ARDeletes.init(
  {
    P_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Invoice_Number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    AR_Type: {
      type: DataTypes.STRING(1),
      allowNull: true,
    },
    AR_SubType: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    AR_Date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    AR_CheckDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    AR_Ref: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    AR_Amount: {
      type: DataTypes.DECIMAL(19, 4),
      allowNull: true,
    },
    User_Number: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    AR_DeleteDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "AR_Deletes",
    timestamps: false,
  }
);
