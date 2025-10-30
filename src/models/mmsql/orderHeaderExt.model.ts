import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../db'; // Update this path as per your structure

class OrderHeaderExt extends Model {}

OrderHeaderExt.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Order_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Order_Option: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Order_OptionValue: {
      type: DataTypes.STRING, // nvarchar maps to STRING
      allowNull: true,
    },
  },
  {
    sequelize: sequelize, // your Sequelize MSSQL instance
    modelName: 'OrderHeaderExt',
    tableName: 'Order_Header_Ext',
    timestamps: false,
  }
);

export default OrderHeaderExt;
