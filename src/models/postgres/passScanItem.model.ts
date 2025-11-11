// models/passScanItem.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { IPassScanItem } from '../../interfaces/postgress/passScanItem.interface';
import { postgresSequelize } from '../../db';

// Optional fields on creation
type PassScanItemCreationAttributes = Optional<IPassScanItem, 'id' | 'isActive' | 'note'>;

export class PassScanItem extends Model<IPassScanItem, PassScanItemCreationAttributes> implements IPassScanItem {
  public id!: number;
  public orderNumber!: number;
  public userId!: number;
  public itemNumber!: number;
  public isActive!: boolean;
  public note!: string | null;

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
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
