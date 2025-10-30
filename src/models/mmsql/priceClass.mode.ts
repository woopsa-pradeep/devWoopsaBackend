import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../db'; // Update this path as per your structure

// Define attributes interface
interface PriceClassAttributes {
  Price_Class: number;
  Class_Desc: string;
  MSA_Default: string;
  Rebate_Amount: number;
  SelectionVisible: boolean;
  Allow_Price_Change: boolean;
  Allow_Price_Change_Remote: boolean;
  Sales_Category_Group: number;
  Product_ExpDays: number;
}

// Optional fields (if needed)
type PriceClassCreationAttributes = Optional<PriceClassAttributes, 'Price_Class'>;

// Define the model
class PriceClass extends Model<PriceClassAttributes, PriceClassCreationAttributes>
  implements PriceClassAttributes {
  public Price_Class!: number;
  public Class_Desc!: string;
  public MSA_Default!: string;
  public Rebate_Amount!: number;
  public SelectionVisible!: boolean;
  public Allow_Price_Change!: boolean;
  public Allow_Price_Change_Remote!: boolean;
  public Sales_Category_Group!: number;
  public Product_ExpDays!: number;
  }

PriceClass.init(
  {
    Price_Class: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
    },
    Class_Desc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    MSA_Default: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Rebate_Amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    SelectionVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Allow_Price_Change: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Allow_Price_Change_Remote: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Sales_Category_Group: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    Product_ExpDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Price_Classes',
    timestamps: false,
    
  }
);

export default PriceClass;
