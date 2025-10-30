import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { BannerAttributes } from '../../interfaces/postgress/banner.interface';



// Creation attributes (id optional if auto-increment)
type BannerCreationAttributes = Optional<BannerAttributes, 'id'>;

// Model definition
class Banner extends Model<BannerAttributes, BannerCreationAttributes> implements BannerAttributes {
  public id!: number;
  public isActive!: boolean;
  public status!: boolean;
  public bannerTitle!: string;
  public image_url!: string;
  public bannerDescription!: string;
  public inventors!: object[];
  public startDate!: Date;
  public endDate!: Date;
  public hasForWeb!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
Banner.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    bannerTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bannerDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    inventors: {
      type: DataTypes.JSONB,
      allowNull: true, // set false if required
    },
    hasForWeb: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'banners',
    modelName: 'Banner',
    timestamps: true,
  }
);

export default Banner;
