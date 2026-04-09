import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../db";

export class OrderNotification extends Model {
  mykey!: number;
  order_number!: number | null;
  entry_date!: Date | null;
  UserName!: string | null;
  PC_Name!: string | null;
  IsRead!: boolean | null;
}

OrderNotification.init(
  {
    mykey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_number: { type: DataTypes.INTEGER, allowNull: true },
    entry_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal("GETDATE()"),
    },
    UserName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "",
    },
    PC_Name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "",
    },
    IsRead: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "Order_Notification",
    timestamps: false,
  }
);
