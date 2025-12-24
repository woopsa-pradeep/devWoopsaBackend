import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

// Define the attributes interface
interface ItemLimitAttributes {
  id: number;
  Item_Number: string;
  QtyLimit: number;
  isActive:boolean
  markAsBundle:boolean
}

// Optional fields for creation
type ItemLimitCreationAttributes = Optional<ItemLimitAttributes, 'id'>;

// Define the model class
export class ItemLimit
  extends Model<ItemLimitAttributes, ItemLimitCreationAttributes>
  implements ItemLimitAttributes
{
  public id!: number;
  public Item_Number!: string;
  public QtyLimit!: number;
  public  isActive!: boolean;
  public markAsBundle!: boolean;
}

// Initialize the model
ItemLimit.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      isActive:{
        type: DataTypes.BOOLEAN,
        defaultValue:true,
        allowNull:true
      },
      Item_Number: {
        type: DataTypes.INTEGER,  
        allowNull: false,
        defaultValue: 0,
      },
      QtyLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      markAsBundle:{
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
      }
    },
    {
      sequelize: postgresSequelize,
      tableName: 'ItemLimits',
      modelName: 'ItemLimit',
      timestamps: false,
    }
  );
  
