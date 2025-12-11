import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db'; // adjust path as per your structure

export class POType extends Model {
  public PO_Type!: number;
  public PO_TypeDescription!: string;
  public PO_TypeEnabled!: boolean;
}

POType.init(
  {
    PO_Type: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false, // change to true if DB uses identity
    },
    PO_TypeDescription: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    PO_TypeEnabled: {
      type: DataTypes.BOOLEAN, // MSSQL bit → Sequelize BOOLEAN
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'PO_Types', // exact table name
    timestamps: false,
  }
);
