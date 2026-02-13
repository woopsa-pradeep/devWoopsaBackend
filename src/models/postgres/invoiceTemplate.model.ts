// models/invoiceTemplate.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface IInvoiceTemplate {
  id: number;
  name: string;
  mainTemplate: boolean;
  groupBy: string;
  showGroupHeader: boolean;
  selectedColumns: {
    orderQty?: boolean;
    shippedQty?: boolean;
    description?: boolean;
    itemNumber?: boolean;
    sortNumber?: boolean;
    upc?: boolean;
    price?: boolean;
    tax?: boolean;
    priceWithTax?: boolean;
    totalPrice?: boolean;
    retail1?: boolean;
    ebt?: boolean;
  };
  upcOption: string;
  showDistributorDetails: boolean;
  showCustomerDetails: boolean;
  showDocNumber: boolean;
  showPageOf: boolean;
  showInvoiceDate: boolean;
  showInvoiceDateWithTime: boolean;
  showRoute: boolean;
  showStop: boolean;
  showLogo: boolean;
  logoPosition: string;
  showTerms: boolean;
  headerOnPages: string;
  showHeaderMessage: boolean;
  headerMessageFirstPage: string;
  footerLayout: string;
  showFooterMessage: boolean;
  footerMessageLastPage: string;
  showSubTotal: boolean;
  showDeliveryCharge: boolean;
  showLastBalance: boolean;
  showTotalAmountDue: boolean;
  showReportGeneratedByWoopsa: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

type InvoiceTemplateCreationAttributes = Optional<IInvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'>;

export class InvoiceTemplate
  extends Model<IInvoiceTemplate, InvoiceTemplateCreationAttributes>
  implements IInvoiceTemplate
{
  public id!: number;
  public name!: string;
  public mainTemplate!: boolean;
  public groupBy!: string;
  public showGroupHeader!: boolean;
  public selectedColumns!: {
    orderQty?: boolean;
    shippedQty?: boolean;
    description?: boolean;
    itemNumber?: boolean;
    sortNumber?: boolean;
    upc?: boolean;
    price?: boolean;
    tax?: boolean;
    priceWithTax?: boolean;
    totalPrice?: boolean;
    retail1?: boolean;
    ebt?: boolean;
  };
  public upcOption!: string;
  public showDistributorDetails!: boolean;
  public showCustomerDetails!: boolean;
  public showDocNumber!: boolean;
  public showPageOf!: boolean;
  public showInvoiceDate!: boolean;
  public showInvoiceDateWithTime!: boolean;
  public showRoute!: boolean;
  public showStop!: boolean;
  public showLogo!: boolean;
  public logoPosition!: string;
  public showTerms!: boolean;
  public headerOnPages!: string;
  public showHeaderMessage!: boolean;
  public headerMessageFirstPage!: string;
  public footerLayout!: string;
  public showFooterMessage!: boolean;
  public footerMessageLastPage!: string;
  public showSubTotal!: boolean;
  public showDeliveryCharge!: boolean;
  public showLastBalance!: boolean;
  public showTotalAmountDue!: boolean;
  public showReportGeneratedByWoopsa!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InvoiceTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mainTemplate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    groupBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    showGroupHeader: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    selectedColumns: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        orderQty: false,
        shippedQty: false,
        description: false,
        itemNumber: false,
        sortNumber: false,
        upc: false,
        price: false,
        tax: false,
        priceWithTax: false,
        totalPrice: false,
        retail1: false,
        ebt: false,
      },
    },
    upcOption: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'barcode_primary',
    },
    showDistributorDetails: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showCustomerDetails: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showDocNumber: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showPageOf: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showInvoiceDate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showInvoiceDateWithTime: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    showRoute: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showStop: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showLogo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    logoPosition: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'center',
    },
    showTerms: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    headerOnPages: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'all',
    },
    showHeaderMessage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    headerMessageFirstPage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    footerLayout: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'messageLeft',
    },
    showFooterMessage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    footerMessageLastPage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    showSubTotal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showDeliveryCharge: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showLastBalance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showTotalAmountDue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showReportGeneratedByWoopsa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'invoiceTemplates',
    modelName: 'InvoiceTemplate',
    timestamps: true,
  }
);

export default InvoiceTemplate;
