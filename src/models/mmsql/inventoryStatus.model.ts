import { DataTypes, Model } from 'sequelize';
import { mssqlSequelize } from '../../db'; // Adjust your path

class InventoryStatus extends Model {}

InventoryStatus.init({
  InventoryID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  Item_Number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Code: {
    type: DataTypes.INTEGER
  },
  Jurisdiction_State: {
    type: DataTypes.INTEGER
  },
  Jurisdiction_County: {
    type: DataTypes.INTEGER
  },
  Jurisdiction_City: {
    type: DataTypes.INTEGER
  },
  Inventory_OnHand: {
    type: DataTypes.DECIMAL(18, 4)  // Adjust precision as needed
  },
  Inventory_UnitsOnHand: {
    type: DataTypes.DECIMAL(18, 4)
  },
  LocationID: {
    type: DataTypes.INTEGER
  },
  InventoryGroupID: {
    type: DataTypes.INTEGER
  },
  Date_Received: {
    type: DataTypes.DATEONLY
  },
  IsReturn: {
    type: DataTypes.BOOLEAN
  },
  STAMP_Qty: {
    type: DataTypes.DECIMAL(18, 4)
  },
  UserName: {
    type: DataTypes.STRING
  },
  ModifyDate: {
    type: DataTypes.DATE
  },
  ActionType: {
    type: DataTypes.STRING
  }
}, {
  sequelize: mssqlSequelize,
  tableName: 'Inventory_Status',
  timestamps: false
});

export default InventoryStatus;
