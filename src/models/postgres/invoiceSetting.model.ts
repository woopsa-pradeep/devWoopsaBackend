import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../models/postgres';
import { IInvoiceSetting } from '../../interfaces/postgress/invoiceSetting.interface';

type InvoiceSettingCreationAttributes = Optional<IInvoiceSetting, 'id'>;

export class InvoiceSetting
  extends Model<IInvoiceSetting, InvoiceSettingCreationAttributes>
  implements IInvoiceSetting 
{
  public id!: number;
  public header_line_1!: string | null;
  public header_line_2!: string | null;
  public Name!: string | null;
  public Address_line_1!: string | null;
  public Address_line_2!: string | null;

  public Full_address!: {
    City?: string;
    State?: string;
    Zip?: string;
    [key: string]: any;
  } | null;

  public Phone!: string | null;
  public Fax!: string | null;
  public whatsapp_Number!: string | null;

  public Footer_message_1!: string | null;
  public Footer_message_2!: string | null;

  public Invoice_Formate!: {
    landscape?: boolean;
    portraite?: boolean;
    [key: string]: any;
  } | null;

  public logo!: string | null;

  public fields!: any[] | null;

  public invoice_Upc_Type!: string | null;

  public invoice_Upc_Value!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// =============== MODEL DEFINITION =====================
InvoiceSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    header_line_1: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    header_line_2: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    Name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    Email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    Address_line_1: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    Address_line_2: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    Full_address: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    Phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    Fax: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    whatsapp_Number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    Footer_message_1: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    Footer_message_2: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    Invoice_Formate: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        portraite: true,
      },
    },

    logo: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    fields: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    invoice_Upc_Type: {
        type: DataTypes.ENUM("number", "barcode"),  // or STRING if you want more flexibility
        allowNull: true,
        },

    invoice_Upc_Value: {
        type: DataTypes.STRING,
        allowNull: true,   
    }
  },

  {
    sequelize: postgresSequelize,
    tableName: 'Invoice_Setting',
    modelName: 'InvoiceSetting',
    timestamps: true,
  }
);

export default InvoiceSetting;
