// models/EmailConfig.ts
import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class EmailConfig extends Model {
  public id!: number;
  public host!: string;
  public module!: string;
  public port!: number;
  public secure!: boolean;
  public username!: string;
  public password!: string;
  public fromEmail!: string;
  public fromName!: string;
  public isActive!: boolean;
}

EmailConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    host: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING,
      allowNull: true,
     
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    secure: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fromEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fromName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'email_configs',
    timestamps: true,
  }
);
