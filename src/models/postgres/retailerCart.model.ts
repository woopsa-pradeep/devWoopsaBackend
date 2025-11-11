import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db'; // adjust path to your db config

interface CustomerItemAttributes {
  id: number;
  Customer_Number: number;
  Item_Number: number;
  Price: number;
  Qty: number;
  TotalPrice: number;
  TotalPriceWithTax: number;
  Tax_Rate: number;
  Price_With_Tax: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  type?: string;
  placedBySalesPerson?: boolean;
  salesPersonNumber?: number;
  discount?: number;
  originalPrice?: number;
}

type CustomerItemCreationAttributes = Optional<CustomerItemAttributes, 'id' | 'isActive'>;

class CustomerCart extends Model<CustomerItemAttributes, CustomerItemCreationAttributes>
  implements CustomerItemAttributes {
  public id!: number;
  public Customer_Number!: number;
  public Item_Number!: number;
  public Price!: number;
  public Qty!: number;
  public TotalPrice!: number;
  public TotalPriceWithTax!: number;
  public placedBySalesPerson!: boolean;
  public salesPersonNumber!: number;
  public Tax_Rate!: number;
  public Price_With_Tax!: number;
  public originalPrice!: number;
  public isActive!: boolean;
  public discount!: number;
  public type!: string;
  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerCart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'order',
    },
    Customer_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    Tax_Rate: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    TotalPriceWithTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    Price_With_Tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    Qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TotalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    placedBySalesPerson: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    salesPersonNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discount:{
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    }
   
  },
  {
    sequelize: postgresSequelize,
    modelName: 'CustomerCart',
    tableName: 'customer_Cart',
    timestamps: true, // adds createdAt, updatedAt
  }
);

export default CustomerCart;
