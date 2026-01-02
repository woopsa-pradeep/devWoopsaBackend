// models/retailerLocation.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IRetailerLocation } from '../../interfaces/postgress/retailerLocation.interface';

type RetailerLocationCreationAttributes = Optional<IRetailerLocation, 'id' | 'lat' | 'long' | 'City' | 'Country' | 'Address' | 'State' | 'Zip'>;

export class RetailerLocation extends Model<IRetailerLocation, RetailerLocationCreationAttributes> implements IRetailerLocation {
  public id!: number;
  public C_Number!: number;
  public lat!: number | null;
  public long!: number | null;
  public City!: string | null;
  public Country!: string | null;
  public Address!: string | null;
  public State!: string | null;
  public Zip!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RetailerLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    long: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
    },
    City: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    Country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    Address: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    State: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    Zip: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'retailerLocation',
    modelName: 'RetailerLocation',
    timestamps: true,
  }
);

