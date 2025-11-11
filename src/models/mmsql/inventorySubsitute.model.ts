import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db'; // update path as needed
import { IInventorySubstitutes } from '../../interfaces/inventorySubsitute.interface';

// Define which attributes are optional during creation
type InventorySubstitutesCreationAttributes = Optional<IInventorySubstitutes, 'myKey'>;

export class InventorySubstitutes
  extends Model<IInventorySubstitutes, InventorySubstitutesCreationAttributes>
  implements IInventorySubstitutes
{
  public myKey!: number;
  public Item_Number!: number;
  public Item_Number_Substitute!: number;
  public Substitute_Rule!: number;
  public Substitute_Text!: string;
}

InventorySubstitutes.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Item_Number_Substitute: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Substitute_Rule: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    Substitute_Text: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelize,
    tableName: 'Inventory_Substitutes',
    modelName: 'InventorySubstitutes',
    timestamps: false,
  }
);
