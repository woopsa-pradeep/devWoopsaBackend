// models/retailerDocuments.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IRetailerDocuments } from '../../interfaces/postgress/retailerDocuments.interface';

type RetailerDocumentsCreationAttributes = Optional<IRetailerDocuments, 'id' | 'attachments' | 'salesTaxDoc' | 'CigTaxDoc' | 'licenseAttachments'>;

export class RetailerDocuments extends Model<IRetailerDocuments, RetailerDocumentsCreationAttributes> implements IRetailerDocuments {
  public id!: number;
  public customerNumber!: number;
  public attachments!: string[] | null;
  public salesTaxDoc!: string | null;
  public CigTaxDoc!: string | null;
  public licenseAttachments!: string[] | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public feinDocument!: string | null;
}

RetailerDocuments.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    feinDocument: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    customerNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: null,
    },
    salesTaxDoc: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    CigTaxDoc: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    licenseAttachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'retailerDocuments',
    modelName: 'RetailerDocuments',
    timestamps: true,
  }
);


