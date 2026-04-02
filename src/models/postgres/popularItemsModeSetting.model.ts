import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export type PopularItemsMode = 'mostSale' | 'asPerCustomer' | 'customerHistory' | 'manual';

export interface PopularItemsModeSettingAttributes {
  id: number;
  mode: PopularItemsMode;
  manualItems: number[];
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type PopularItemsModeSettingCreationAttributes = Optional<PopularItemsModeSettingAttributes, 'id'>;

class PopularItemsModeSetting extends Model<PopularItemsModeSettingAttributes, PopularItemsModeSettingCreationAttributes>
  implements PopularItemsModeSettingAttributes {
  public id!: number;
  public mode!: PopularItemsMode;
  public manualItems!: number[];
  public isActive!: boolean;
  public startDate!: Date | null;
  public endDate!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PopularItemsModeSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mode: {
      type: DataTypes.ENUM('mostSale', 'asPerCustomer', 'customerHistory', 'manual'),
      allowNull: false,
      defaultValue: 'mostSale',
    },
    manualItems: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'popular_items_mode_settings',
    modelName: 'PopularItemsModeSetting',
    timestamps: true,
    underscored: true,
  }
);

export default PopularItemsModeSetting;
