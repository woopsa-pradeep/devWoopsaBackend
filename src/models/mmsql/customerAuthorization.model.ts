import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../../db";

// Define the attributes interface
export interface CustAuthorizedAttributes {
  C_Number: number;
  Item_Number: number;
  Item_Value: number;
  Item_Retail: number;
  Item_Option: number;
}

// Optional attributes if you use `create()` without providing all fields
type CustAuthorizedCreationAttributes = Optional<CustAuthorizedAttributes, never>;

// Define the model
class CustAuthorized extends Model<CustAuthorizedAttributes, CustAuthorizedCreationAttributes>
  implements CustAuthorizedAttributes {
  public C_Number!: number;
  public Item_Number!: number;
  public Item_Value!: number;
  public Item_Retail!: number;
  public Item_Option!: number;
}

// Initialize the model
CustAuthorized.init(
  {
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    Item_Value: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    Item_Retail: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
    },
    Item_Option: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'CustAuthorized',
    tableName: 'Cust_Authorized',
    timestamps: false,
    freezeTableName: true,
  }
);

export default CustAuthorized;
