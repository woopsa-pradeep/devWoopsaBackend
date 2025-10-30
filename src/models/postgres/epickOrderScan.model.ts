import {
    Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes
  } from 'sequelize';
  import { postgresSequelize } from '../../db';
  
  export class OrderPickScan extends Model<
    InferAttributes<OrderPickScan>,
    InferCreationAttributes<OrderPickScan>
  > {
    declare id: CreationOptional<number>;
    declare orderNumber: number;  
    declare itemNumber: number;   
    declare qty: number;       
    declare isSubsitute: boolean;
    declare boxId: number;       

  }
  
  OrderPickScan.init({
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
  
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemNumber: {
      type: DataTypes.INTEGER, 
      allowNull: false,
    },
    isSubsitute:{
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, 
    },
  
    boxId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    sequelize: postgresSequelize,
    tableName: 'Order_Pick_Scan',
    timestamps: true,
  });
  