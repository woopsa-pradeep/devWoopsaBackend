import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IProductImage } from '../../interfaces/postgress/productImage.interface';



type ProductImageCreationAttributes = Optional<IProductImage, 'id' | 'isAllow' | 'isActive'>;

export class ProductImage extends Model<IProductImage, ProductImageCreationAttributes> implements IProductImage {
  public id!: number;
  public product_number!: string;
  public img_url!: string;
  public isAllow!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    img_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAllow: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'product_images',
    modelName: 'ProductImage',
    timestamps: true, 
  }
);
