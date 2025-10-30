import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db'; // update path as needed
import { IInventoryUPC } from '../../interfaces/inventoryUpc.interface';


type InventoryUPCCreationAttributes = Optional<IInventoryUPC, 'myKey'>;

export class InventoryUPC extends Model<IInventoryUPC, InventoryUPCCreationAttributes> implements IInventoryUPC {
  public myKey!: number;
  public UPC_Number!: string;
  public Jurisdiction_State!: number;
  public Jurisdiction_County!: number;
  public Jurisdiction_City!: number;
  public Item_Number!: number;
  public Status!: number;
  public Priority!: number;
  public Qty!: number;
}

InventoryUPC.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    UPC_Number: {
      type: DataTypes.STRING, // nvarchar in SQL = STRING in Sequelize
      allowNull: true,
    },
    Jurisdiction_State: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Jurisdiction_County: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Jurisdiction_City: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Item_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    Priority: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    Qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    tableName: 'Inventory_UPC',
    modelName: 'InventoryUPC',
    timestamps: false,
  }
);
