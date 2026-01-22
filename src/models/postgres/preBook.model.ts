import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class PreBook extends Model {
  public id!: number;

  public startDate!: string;
  public endDate!: string;

  public products!: number[];   // array of item numbers
  public showPrice!: boolean;

  public note!: string | null;
}

PreBook.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    products: {
      type: DataTypes.JSON,   // MSSQL-safe way to store array
      allowNull: false,
      defaultValue: [],
    },

    showPrice: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'preBook',
    timestamps: true, // createdAt / updatedAt are useful here
  }
);
