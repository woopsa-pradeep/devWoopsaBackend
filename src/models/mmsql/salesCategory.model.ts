// src/models/mmsql/salesCategory.model.ts

import { sequelize } from '../../db';
import { DataTypes, Model } from 'sequelize';

export class SalesCategory extends Model {
  public Sales_Category!: number;
  public Category_Desc?: string;
  public category_taxrate?: number;
  public Allow_Price_Change?: boolean;
  public Allow_Price_Change_Remote?: boolean;
}

SalesCategory.init(
  {
    Sales_Category: {
      type: DataTypes.TINYINT,
      primaryKey: true,
      allowNull: false,
    },
    Category_Desc: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category_taxrate: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
    },
    Allow_Price_Change: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Allow_Price_Change_Remote: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Sales_Categories',
    timestamps: false,
  }
);
export default SalesCategory;
