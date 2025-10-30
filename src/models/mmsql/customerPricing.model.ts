import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../db'; // adjust to your project structure

// Interface for model attributes
export interface CustPricingAttributes {
  myKey: number;
  C_Number: number;
  Price_Class: number;
  Price_Level: number;
  Price_Adjustment: number;
  Price_Adj_Pct: boolean;
  Retail_Level: number;
  RetailAmount: number;
  Price: number;
}

// Optional attributes (none are optional here)
type CustPricingCreationAttributes = Optional<CustPricingAttributes, never>;

// Sequelize model definition
class CustPricing extends Model<CustPricingAttributes, CustPricingCreationAttributes>
  implements CustPricingAttributes {
  public myKey!: number;
  public C_Number!: number;
  public Price_Class!: number;
  public Price_Level!: number;
  public Price_Adjustment!: number;
  public Price_Adj_Pct!: boolean;
  public Retail_Level!: number;
  public RetailAmount!: number;
  public Price!: number;
}

// Initialize the model
CustPricing.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Price_Class: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    Price_Level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Price_Adjustment: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    Price_Adj_Pct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    Retail_Level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    RetailAmount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    Price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'CustPricing',
    tableName: 'Cust_Pricing',
    timestamps: false,
    freezeTableName: true,
  }
);

export default CustPricing;
