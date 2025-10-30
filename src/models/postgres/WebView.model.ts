// models/SettingImages.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface SettingImageAttributes {
  id: number;
  section: 'header' | 'middle' | 'bottom';
  image_url: string;
  order: number;
  isActive: boolean;
  productArray: number[] | null;
}

type SettingImageCreationAttributes = Optional<SettingImageAttributes, 'id' | 'order'>;

class WebViewImage
  extends Model<SettingImageAttributes, SettingImageCreationAttributes>
  implements SettingImageAttributes {
  public id!: number;
  public section!: 'header' | 'middle' | 'bottom';
  public image_url!: string;
  public order!: number;
  public productArray!: number[] | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public isActive!: boolean;
}

WebViewImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    section: {
      type: DataTypes.ENUM('header', 'middle', 'bottom'),
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    productArray: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'web_view_images',
    timestamps: true,

  }
);

export default WebViewImage;
