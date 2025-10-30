import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db';

export class OptionDefsValues extends Model {
  public myKey!: number;
  public ID_Number!: number;
  public Option_Value!: string;
  public Description!: string;
}

OptionDefsValues.init(
  {
    myKey: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false, // If it's not auto-increment
    },
    ID_Number: {
      type: DataTypes.INTEGER,
  
    },
    Option_Value: {
      type: DataTypes.STRING, // nvarchar maps to STRING
      allowNull: false,
    },
    Description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Option_Defs_Values',
    timestamps: false,
  }
);
