import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../db";

export class CustBillTo extends Model {
  public myKey!: number;
  public C_Number!: number;
  public C_Name?: string;
  public C_CoName?: string;
  public C_Address?: string;
  public C_City?: string;
  public C_State?: string;
  public C_Zip?: string;
  public C_AddressType?: string;
  public DOB?: Date;
  public DriversLicense?: string;
}

CustBillTo.init(
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
    C_Name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    C_CoName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    C_Address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    C_City: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    C_State: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    C_Zip: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    C_AddressType: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    DOB: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    DriversLicense: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Cust_BillTo",
    timestamps: false,
  }
);
