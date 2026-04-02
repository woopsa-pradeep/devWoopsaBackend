import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface HomeSettingsAttributes {
  id: number;
  showMostSale: boolean;
  showAsPerCustomer: boolean;
  showCustomerHistory: boolean;
  showPromotedItems: boolean;
  maxPromotedItems: number;
  promotedItems: any[];
  showManually: boolean;
  retailerPromotedItems: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

type HomeSettingsCreationAttributes = Optional<HomeSettingsAttributes, 'id'>;

class HomeSettings extends Model<HomeSettingsAttributes, HomeSettingsCreationAttributes>
  implements HomeSettingsAttributes {
  public id!: number;
  public showMostSale!: boolean;
  public showAsPerCustomer!: boolean;
  public showCustomerHistory!: boolean;
  public showPromotedItems!: boolean;
  public maxPromotedItems!: number;
  public promotedItems!: any[];
  public showManually!: boolean;
  public retailerPromotedItems!: any[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

HomeSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    promotedItems:{
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    showMostSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    showAsPerCustomer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    showCustomerHistory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    showPromotedItems:{
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    maxPromotedItems:{
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    showManually: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    retailerPromotedItems: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'home_settings',
    modelName: 'HomeSettings',
    timestamps: true,
  }
);

export default HomeSettings;
