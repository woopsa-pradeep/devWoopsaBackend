import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface DriverPickupOrderAttributes {
  id: number;
  order_number: number;
  barcodes: string[];
}

type DriverPickupOrderCreation = Optional<DriverPickupOrderAttributes, 'id'>;

export class DriverPickupOrder
  extends Model<DriverPickupOrderAttributes, DriverPickupOrderCreation>
  implements DriverPickupOrderAttributes 
{
  public id!: number;
  public order_number!: number;
  public barcodes!: string[];
}

DriverPickupOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    order_number: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    barcodes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'driverpickuporder',
    modelName: 'DriverPickupOrder',
    timestamps: true
  }
);
