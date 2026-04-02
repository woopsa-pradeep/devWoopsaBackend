import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface NewItemsSettingAttributes {
  id: number;
  showManually: boolean;
  items: number[];
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type NewItemsSettingCreationAttributes = Optional<NewItemsSettingAttributes, 'id'>;

class NewItemsSetting extends Model<NewItemsSettingAttributes, NewItemsSettingCreationAttributes>
  implements NewItemsSettingAttributes {
  public id!: number;
  public showManually!: boolean;
  public items!: number[];
  public startDate!: Date | null;
  public endDate!: Date | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NewItemsSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    showManually: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    items: {
      type: DataTypes.JSONB,
      defaultValue: [],
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
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'new_items_settings',
    modelName: 'NewItemsSetting',
    timestamps: true,
    underscored: true,
  }
);

export default NewItemsSetting;
