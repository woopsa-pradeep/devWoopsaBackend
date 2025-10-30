// models/inventoryQtyDiscount.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from '../../db';

// Define attributes
interface InventoryQtyDiscountAttributes {
  myKey: number;
  Item_Number: number;
  BreakQty: number;
  BreakDiscount: number;
  BreakAmount: number;
  BreakPriceLevel: number;
}

// For creation (auto-increment PK)
interface InventoryQtyDiscountCreationAttributes
  extends Optional<InventoryQtyDiscountAttributes, "myKey"> {}

// Sequelize model
class InventoryQtyDiscount
  extends Model<
    InventoryQtyDiscountAttributes,
    InventoryQtyDiscountCreationAttributes
  >
  implements InventoryQtyDiscountAttributes
{
  public myKey!: number;
  public Item_Number!: number;
  public BreakQty!: number;
  public BreakDiscount!: number;
  public BreakAmount!: number;
  public BreakPriceLevel!: number;
}

InventoryQtyDiscount.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    BreakQty: {
      type: DataTypes.DECIMAL(18, 2), 
      allowNull: true,
    },
    BreakDiscount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    BreakAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    BreakPriceLevel: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Inventory_QtyDiscounts",
    timestamps: false,
  }
);

export default InventoryQtyDiscount;
