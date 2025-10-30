import { DataTypes, Model, Optional } from "sequelize";
import { postgresSequelize } from "../../db";

interface WebLocationAttributes {
  id: number;
  latitude: number;
  longitude: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type WebLocationCreationAttributes = Optional<
  WebLocationAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export class WebLocation
  extends Model<WebLocationAttributes, WebLocationCreationAttributes>
  implements WebLocationAttributes
{
  public id!: number;
  public latitude!: number;   // -90..90
  public longitude!: number;  // -180..180
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WebLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6), // precise ~0.11 m
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: postgresSequelize,
    modelName: "WebLocation",
    tableName: "web_locations",
    timestamps: true,
  }
);
