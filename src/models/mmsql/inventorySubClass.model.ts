import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../db'; // adjust path as needed

// Define attributes interface
export interface InventorySubclassAttributes {
  myKey: number;
  Price_Subclass: number;
  Price_Subclass_Legacy: string;
  Start_Date: Date;
  Cutoff_Date: Date;
  UnlimitedFlag: boolean;
  Subclass_Description: string;
  Discount: number;
  State_Abbrev: string;
  Jurisdiction_State: number;
  Special_GroupID: number;
  Off_Price: boolean;
  Apply_To_Promo: boolean;
  Off_Cost: boolean;
  Off_Before_PriceCalc: boolean;
  Ext_Line: boolean;
  Ext_Criteria: boolean;
  Retail1: number;
  Retail1_Cutoff: Date;
  Retail1_Unlimited: boolean;
  Retail2: number;
  Retail2_Cutoff: Date;
  Retail2_Unlimited: boolean;
  Retail_ID: number;
  Promotion_Number: number;
  Extended_Cummulative: boolean;
}

// Define creation attributes (none are optional)
type InventorySubclassCreationAttributes = Optional<InventorySubclassAttributes, never>;

// Define the model
class InventorySubclass extends Model<InventorySubclassAttributes, InventorySubclassCreationAttributes>
  implements InventorySubclassAttributes {
  public myKey!: number;
  public Price_Subclass!: number;
  public Price_Subclass_Legacy!: string;
  public Start_Date!: Date;
  public Cutoff_Date!: Date;
  public UnlimitedFlag!: boolean;
  public Subclass_Description!: string;
  public Discount!: number;
  public State_Abbrev!: string;
  public Jurisdiction_State!: number;
  public Special_GroupID!: number;
  public Off_Price!: boolean;
  public Apply_To_Promo!: boolean;
  public Off_Cost!: boolean;
  public Off_Before_PriceCalc!: boolean;
  public Ext_Line!: boolean;
  public Ext_Criteria!: boolean;
  public Retail1!: number;
  public Retail1_Cutoff!: Date;
  public Retail1_Unlimited!: boolean;
  public Retail2!: number;
  public Retail2_Cutoff!: Date;
  public Retail2_Unlimited!: boolean;
  public Retail_ID!: number;
  public Promotion_Number!: number;
  public Extended_Cummulative!: boolean;
}

// Initialize the model
InventorySubclass.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    Price_Subclass: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    Price_Subclass_Legacy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Start_Date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Cutoff_Date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    UnlimitedFlag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Subclass_Description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Discount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    State_Abbrev: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Jurisdiction_State: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Special_GroupID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Off_Price: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Apply_To_Promo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Off_Cost: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Off_Before_PriceCalc: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Ext_Line: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Ext_Criteria: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Retail1: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    Retail1_Cutoff: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Retail1_Unlimited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Retail2: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    Retail2_Cutoff: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Retail2_Unlimited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Retail_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Promotion_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Extended_Cummulative: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'InventorySubclass',
    tableName: 'Inventory_Subclass',
    timestamps: false,
    freezeTableName: true,
  }
);

export default InventorySubclass;
