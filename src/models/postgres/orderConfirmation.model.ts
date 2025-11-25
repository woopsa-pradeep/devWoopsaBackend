import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

// Interface for attributes
interface OrderConfirmationAttributes {
  id: number;
  order_Number: number;
  status: string;
  current_orderline: number;
  sales_id: number;
  startTime: Date | null;
  endTime: Date | null;
  isActive: boolean;
 
}

// Optional for creation
type OrderConfirmationCreationAttributes = Optional<
  OrderConfirmationAttributes,
  'id' | 'status' | 'current_orderline' | 'startTime' | 'endTime' 
>;

// Model class
export class OrderConfirmation
  extends Model<
    OrderConfirmationAttributes,
    OrderConfirmationCreationAttributes
  >
  implements OrderConfirmationAttributes
{
  public id!: number;
  public order_Number!: number;
  public status!: string;
  public current_orderline!: number;
  public sales_id!: number;
  public startTime!: Date | null;
  public endTime!: Date | null;
  public isActive!: boolean;

}

// Initialize
OrderConfirmation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'in-progress',
    },
    current_orderline: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    sales_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: { 
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }
  },
  {
    sequelize: postgresSequelize,
    tableName: 'OrderConfirmation',
    modelName: 'OrderConfirmation',
    timestamps: true,
  }
);
