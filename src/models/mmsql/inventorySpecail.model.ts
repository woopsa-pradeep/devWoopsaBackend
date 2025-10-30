import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../db';

class InventorySpecials extends Model {}

InventorySpecials.init({
    myKey: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
  Item_Number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  GroupSpecial_Type: {
    type: DataTypes.TINYINT,
  },
  Sales_Category: {
    type: DataTypes.TINYINT,
  },
  Price_Class: {
    type: DataTypes.SMALLINT,
  },
  Item_GroupID: {
    type: DataTypes.SMALLINT,
  },
  Brand_ID: {
    type: DataTypes.SMALLINT,
  },
  Start_Date: {
    type: DataTypes.DATE,
  },
  End_Date: {
    type: DataTypes.DATE,
  },
  Price: {
    type: DataTypes.DECIMAL(18, 4),
  },
  Allowance: {
    type: DataTypes.DECIMAL(18, 4),
  },
  AllowanceType: {
    type: DataTypes.STRING, // nvarchar → STRING
  },
  Units_Limit: {
    type: DataTypes.INTEGER,
  },
  Perpetual: {
    type: DataTypes.BOOLEAN,
  },
  Special_GroupID: {
    type: DataTypes.INTEGER,
  },
  Promo_Number: {
    type: DataTypes.INTEGER,
  },
  Special_Message: {
    type: DataTypes.STRING, // nvarchar → STRING
  },
  Points: {
    type: DataTypes.INTEGER,
  },
  Promo_Active: {
    type: DataTypes.BOOLEAN,
  },
  Order_Source: {
    type: DataTypes.TINYINT,
  },
  MultiPackReqQty: {
    type: DataTypes.INTEGER,
  },
  MultiPackReqQtyType: {
    type: DataTypes.SMALLINT,
  },
  MultiPackAllowance: {
    type: DataTypes.DECIMAL(18, 4),
  },
  MultiPackPCT: {
    type: DataTypes.DECIMAL(18, 4),
  },
  MultiPackPrice: {
    type: DataTypes.DECIMAL(18, 4),
  },
  ExtLine: {
    type: DataTypes.BOOLEAN,
  }
}, {
  sequelize,
  tableName: 'Inventory_Specials',
  timestamps: false, // No createdAt/updatedAt
});

export default InventorySpecials;
