// models/customerAssingInvoiceTemplate.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface ICustomerAssignInvoiceTemplate {
  id: number;
  customerNumber: number;
  templateId: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

type CustomerAssignInvoiceTemplateCreationAttributes = Optional<ICustomerAssignInvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'>;

export class CustomerAssignInvoiceTemplate
  extends Model<ICustomerAssignInvoiceTemplate, CustomerAssignInvoiceTemplateCreationAttributes>
  implements ICustomerAssignInvoiceTemplate
{
  public id!: number;
  public customerNumber!: number;
  public templateId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerAssignInvoiceTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'customerAssignInvoiceTemplates',
    modelName: 'CustomerAssignInvoiceTemplate',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['customerNumber', 'templateId'],
        name: 'ux_customerAssignInvoiceTemplates_customerNumber_templateId',
      },
    ],
  }
);

export default CustomerAssignInvoiceTemplate;
