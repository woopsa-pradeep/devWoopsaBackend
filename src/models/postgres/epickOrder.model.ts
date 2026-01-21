import {
    Model, DataTypes,  CreationOptional
  } from 'sequelize';
  import { postgresSequelize } from '../../db'; // Adjust the import path as needed

export class OrderPick extends Model {
  declare id: number;
  declare orderNumber: number;
  declare pickerUserNumber: number;
  declare pickerUserId: number;

  declare status: 'pending' | 'in_progress' | 'completed' | 'ready_for_delivery' | 'cancelled';
  declare startedAt: Date | null;
  declare completedAt: Date | null; 
  declare checkerCompletedAt: Date | null;
  declare chcekerUserId: number | null;

  declare notes: string | null;
  declare images: any[] | null; // JSONB array of image URLs

  // rollups
  declare totalLines: number;
  declare totalQty: number;
  declare scannedLines: number;
  declare scannedQty: number;

  declare OutOfStockItem:number;
  // metadata
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OrderPick.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  orderNumber: { type: DataTypes.INTEGER, allowNull: false,unique: true },
  pickerUserNumber: { type: DataTypes.INTEGER, allowNull: false },
  pickerUserId: { type: DataTypes.INTEGER, allowNull: true },
  customerNumber: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'ready_for_delivery'),
    allowNull: false,
    defaultValue: 'in_progress'
  },

  startedAt: { type: DataTypes.DATE, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
 checkerCompletedAt: { type: DataTypes.DATE, allowNull: true },
  chcekerUserId: { type: DataTypes.INTEGER, allowNull: true },
 notes: { type: DataTypes.TEXT, allowNull: true },
  images: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },

  totalLines: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  totalQty: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
  OutOfStockItem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  scannedLines: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  scannedQty: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },

}, {
  sequelize: postgresSequelize,
  tableName: 'Order_Pick',
  timestamps:true
 
});