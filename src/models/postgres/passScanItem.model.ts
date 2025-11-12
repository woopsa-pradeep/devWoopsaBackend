import { Model, DataTypes, Optional } from 'sequelize';
import { IPassScanItem } from '../../interfaces/postgress/passScanItem.interface';
import { postgresSequelize } from '../../db';

// Optional fields on creation
type PassScanItemCreationAttributes = Optional<IPassScanItem, 'id' | 'isActive' | 'note' | 'quantityScanned'>;

export class PassScanItem
  extends Model<IPassScanItem, PassScanItemCreationAttributes>
  implements IPassScanItem
{
  public id!: number;
  public orderNumber!: number;
  public userId!: number;
  public itemNumber!: number;
  public isActive!: boolean;
  public note!: string | null;
  public quantityScanned!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PassScanItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_number',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    itemNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'item_number',
    },
    quantityScanned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // start from 0 since scanning increases it
      field: 'quantity_scanned',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'passScanItems',
    modelName: 'PassScanItem',
    timestamps: true,
  }
);
