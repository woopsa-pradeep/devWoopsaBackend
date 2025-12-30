import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class FuturePricing extends Model {
  public id!: number;
  public itemNumber!: number;
  public effectiveAt!: Date;
  public changedFields!: Array<Record<string, any>>;
  public isApplied!: boolean;
  public changedBy!: string;              // 'admin' | 'user'
  public changedUserId?: number | null;
 
}

FuturePricing.init(
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
    effectiveAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    changedFields: {
      type: DataTypes.JSONB, 
      allowNull: false,
    },
    isApplied: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    changedBy: {
      type: DataTypes.STRING(10), 
      allowNull: false,
    },
    changedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
   
  },
  {
    sequelize: postgresSequelize,
    tableName: 'FuturePricing',
    timestamps: false,
  }
);
