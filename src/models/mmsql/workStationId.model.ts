
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path if needed

export class Workstation_Defs extends Model {
  public Workstation_ID!: number;       // smallint
  public Workstation_Name!: string;     // nvarchar
}

Workstation_Defs.init(
  {
    Workstation_ID: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
    },
    Workstation_Name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Workstation_Defs',
    timestamps: false,
  }
);
