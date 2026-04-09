import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../db";

export class InvoicePdfStorage extends Model {
  Id!: number;
  CustomerNumber!: number;
  OrderNumber!: number;
  InvoiceNumber!: number;
  InvoiceDate!: Date;
  FileName!: string;
  BlobURL!: string;
  IsActive!: boolean;
  CreatedAt!: Date;
}

InvoicePdfStorage.init(
  {
    Id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    CustomerNumber: { type: DataTypes.INTEGER, allowNull: false },
    OrderNumber: { type: DataTypes.INTEGER, allowNull: false },
    InvoiceNumber: { type: DataTypes.INTEGER, allowNull: false },
    InvoiceDate: { type: DataTypes.DATE, allowNull: false },
    FileName: { type: DataTypes.STRING(200), allowNull: false },
    BlobURL: { type: DataTypes.STRING(500), allowNull: false },
    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("GETDATE()"),
    },
  },
  {
    sequelize,
    tableName: "Invoice_PDF_Storage",
    timestamps: false,
    freezeTableName: true,
  }
);
