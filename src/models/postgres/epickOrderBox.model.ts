import {
    Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes
  } from 'sequelize';
  import { postgresSequelize } from '../../db';
  
  export class OrderPickBox extends Model<
    InferAttributes<OrderPickBox>,
    InferCreationAttributes<OrderPickBox>
  > {
    declare id: CreationOptional<number>;
    declare orderNumber: number; // FK to Order_Pick.orderNumber
    declare notes: string | null;
    declare type: 'box' | 'tote' | 'drink';
    declare images: any[] | null; // JSONB array of image objects/urls
    declare barcode: string | null; // physical label on the box/tote
    declare value: string | null;   // DECIMAL returns as string
  
  
  }
  
  OrderPickBox.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    notes: { type: DataTypes.TEXT, allowNull: true },
  
    type: {
      type: DataTypes.ENUM('box', 'tote', 'drink'),
      allowNull: false,
    },
  
    images: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
  
    barcode: { type: DataTypes.STRING(128), allowNull: true },
    value: { type: DataTypes.DECIMAL(18, 2), allowNull: true }
  }, {
    sequelize: postgresSequelize,
    tableName: 'Order_Pick_Box',
    timestamps: true
  });
  
 
  