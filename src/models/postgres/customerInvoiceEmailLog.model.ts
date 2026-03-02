import { Model, DataTypes, Optional, CreationOptional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface CustomerInvoiceEmailLogAttributes {
  id: number;
  customerNumber: string;
  mailSent: boolean;
  invoiceNumber: string;
  invoiceDate: Date;
  mailSendDate: Date | null;
  emailAddress?: string | null;
  status?: 'sent' | 'failed' | 'pending';
  errorMessage?: string | null;
  retryCount?: number;
  orderNumber?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CustomerInvoiceEmailLogCreationAttributes
  extends Optional<CustomerInvoiceEmailLogAttributes, 'id' | 'createdAt' | 'updatedAt' | 'emailAddress' | 'status' | 'errorMessage' | 'retryCount'> {}

export class CustomerInvoiceEmailLog
  extends Model<CustomerInvoiceEmailLogAttributes, CustomerInvoiceEmailLogCreationAttributes>
  implements CustomerInvoiceEmailLogAttributes {
  public id!: number;
  public customerNumber!: string;
  public mailSent!: boolean;
  public invoiceNumber!: string;
  public orderNumber!: number;
  public invoiceDate!: Date;
  public mailSendDate!: CreationOptional<Date | null>;
  public emailAddress!: CreationOptional<string | null>;
  public status!: CreationOptional<'sent' | 'failed' | 'pending'>;
  public errorMessage!: CreationOptional<string | null>;
  public retryCount!: CreationOptional<number>;
  public readonly createdAt!: CreationOptional<Date>;
  public readonly updatedAt!: CreationOptional<Date>;
}

CustomerInvoiceEmailLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mailSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    orderNumber:{
      type: DataTypes.INTEGER,
      allowNull: false,

    },
    mailSendDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    status: {
      type: DataTypes.ENUM('sent', 'failed', 'pending'),
      allowNull: true,
      defaultValue: 'pending',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'customerInvoiceEmailLog',
    modelName: 'CustomerInvoiceEmailLog',
    timestamps: true,
  }
);
