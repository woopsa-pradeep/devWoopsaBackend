// models/salesCategoryTaxRates.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db';

// Interface for attributes
export interface ISalesCategoryTaxRate {
  myKey: number;
  Sales_Category: number;          // tinyint
  Jurisdiction_State: number;      // int
  Category_TaxRate: number;        // decimal
}

// Attributes optional during creation
type SalesCategoryTaxRateCreationAttributes = Optional<ISalesCategoryTaxRate, 'myKey'>;

export class SalesCategoryTaxRate
  extends Model<ISalesCategoryTaxRate, SalesCategoryTaxRateCreationAttributes>
  implements ISalesCategoryTaxRate
{
  public myKey!: number;
  public Sales_Category!: number;
  public Jurisdiction_State!: number;
  public Category_TaxRate!: number;
}

SalesCategoryTaxRate.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Sales_Category: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    Jurisdiction_State: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Category_TaxRate: {
      type: DataTypes.DECIMAL(10, 4), // adjust precision based on your DB
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Sales_Categories_TaxRates',
    tableName: 'Sales_Categories_TaxRates',
    timestamps: false,
  }
);
