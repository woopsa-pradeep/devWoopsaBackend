import { sequelize } from '../../db';
import { DataTypes, Model } from 'sequelize';

export class PriceClass extends Model {
  public Price_Class!: number;
  public Class_Desc?: string;
  public MSA_Default?: string;
  public Rebate_Amount?: number;
  public SelectionVisible?: boolean;
  public Allow_Price_Change?: boolean;
  public Allow_Price_Change_Remote?: boolean;
  public Sales_Category_Group?: string;
  public Product_ExpDays?: number;
}

PriceClass.init(
  {
    Price_Class: {
      type: DataTypes.TINYINT,
      primaryKey: true,
      allowNull: false,
    },
    Class_Desc: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    MSA_Default: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Rebate_Amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    SelectionVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Allow_Price_Change: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Allow_Price_Change_Remote: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Sales_Category_Group: {
      type: DataTypes.TINYINT, 
      allowNull: false,        
    },
    Product_ExpDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Price_Classes',
    timestamps: false,
  }
);
