import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class InventoryPriceHistory extends Model {
  public id!: number;
  public itemNumber!: number;
  public changedAt!: Date;
  public oldValues!: object;
  public newValues!: object;
  public changedBy!: string;             // 'admin' | 'user'
  public changedByUserId?: number | null;
  public source?: string | null;
  public createdAt!: Date;
}

InventoryPriceHistory.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    itemNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    oldValues: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    newValues: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    changedBy: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'admin',
    },

    changedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    source: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'InventoryPriceHistory',
    timestamps: false,
  }
);
