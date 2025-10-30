import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db'; // Adjust to your sequelize instance path

export interface IDeliveryCharge {
  Del_ID: number;
  Del_Level: number;
  Del_Amount: number;
  Del_Default: boolean;
  Del_Code: number;
  Del_Description: string;
  Del_Options: string;
  Special_GroupID: number;
}

type DeliveryChargeCreationAttributes = Optional<IDeliveryCharge, 'Del_ID'>;

export class DeliveryCharge extends Model<IDeliveryCharge, DeliveryChargeCreationAttributes> implements IDeliveryCharge {
  public Del_ID!: number;
  public Del_Level!: number;
  public Del_Amount!: number;
  public Del_Default!: boolean;
  public Del_Code!: number;
  public Del_Description!: string;
  public Del_Options!: string;
  public Special_GroupID!: number;
}

DeliveryCharge.init(
  {
    Del_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Del_Level: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    Del_Amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    Del_Default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    Del_Code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Del_Description: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    Del_Options: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Special_GroupID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: sequelize,
    modelName: 'DeliveryCharge',
    tableName: 'Delivery_Charge',
    timestamps: false,
  }
);
