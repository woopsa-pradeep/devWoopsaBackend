// models/getDiscount.model.ts

import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../../db";
 
export class GetDiscount extends Model {}

GetDiscount.init(
  {
    PID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    Item_Number: {
      type: DataTypes.INTEGER,
    },
    C_Number: {
      type: DataTypes.INTEGER,
    },
    Conract_Cust: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Description: {
      type: DataTypes.STRING(100),
    },
    Price1: {
      type: DataTypes.DECIMAL,
    },
    Price2: {
      type: DataTypes.DECIMAL,
    },
    Price3: {
      type: DataTypes.DECIMAL,
    },
    Price4: {
      type: DataTypes.DECIMAL,
    },
    Price5: {
      type: DataTypes.DECIMAL,
    },
    Price6: {
      type: DataTypes.DECIMAL,
    },
    BaseCost: {
      type: DataTypes.DECIMAL,
    },
    NetCost: {
      type: DataTypes.DECIMAL,
    },
    Invoice_Cost: {
      type: DataTypes.DECIMAL,
    },
    Price_Class: {
      type: DataTypes.SMALLINT,
    },
    Price_Level: {
      type: DataTypes.INTEGER,
    },
    Price_Adjustment: {
      type: DataTypes.DECIMAL,
    },
    Price_Adj_Pct: {
      type: DataTypes.BOOLEAN,
    },
    Adj_Price: {
      type: DataTypes.DECIMAL,
    },
    Contract_Option: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Contract_OptionVal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Contract_Values: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Contract_Price: {
      type: DataTypes.DECIMAL,
    },
    Sub_Discount: {
      type: DataTypes.DECIMAL,
    },
    CommanAllowance: {
      type: DataTypes.DECIMAL,
    },
    CommanAllowanceType: {
      type: DataTypes.STRING(1),
    },
    CommanPrice: {
      type: DataTypes.DECIMAL,
    },
    hasApplyCommanPrice: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    Idj_Startdate: {
      type: DataTypes.DATE,
    },
    Idj_Enddate: {
      type: DataTypes.DATE,
    },
    Perpetual: {
      type: DataTypes.BOOLEAN,
    },
    Retail1:{
      type: DataTypes.DECIMAL,
    },
    Subclass_Startdate: {
      type: DataTypes.DATE,
    },
    Subclass_Enddate: {
      type: DataTypes.DATE,
    },
    UnlimitedFlag: {
      type: DataTypes.BOOLEAN,
    },
    Order_Source: {
      type: DataTypes.STRING,
    },
    Source_Description: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: 'GetDiscount',
    modelName: 'GetDiscount',
    timestamps: false,
    freezeTableName: true,
  }
);


