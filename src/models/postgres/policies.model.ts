import { DataTypes, Model } from 'sequelize';
import { postgresSequelize } from '../../db';
class Policies extends Model {}

Policies.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    PrivacyPolicies: {
      type: DataTypes.TEXT,   // long text
      allowNull: true,
    },
    TermsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    SoftwareLicense: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    RefundPolicies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    Disclaimer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize, // Sequelize MSSQL/Postgres instance
    modelName: 'Policies',
    tableName: 'Policies',
    timestamps: false,
  }
);

export default Policies;
