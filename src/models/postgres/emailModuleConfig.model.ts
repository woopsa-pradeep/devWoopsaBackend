// models/emailModuleConfig.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface IEmailModuleConfig {
  id: number;
  emailModuleId: number;
  host: string;
  port: number;
  username: string;
  secure: boolean;
  password: string;
  fromEmail: string;
  fromName: string | null;
  isActive: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

type EmailModuleConfigCreationAttributes = Optional<IEmailModuleConfig, 'id' | 'createdAt' | 'updatedAt' | 'fromName'>;

export class EmailModuleConfig
  extends Model<IEmailModuleConfig, EmailModuleConfigCreationAttributes>
  implements IEmailModuleConfig
{
  public id!: number;
  public emailModuleId!: number;
  public host!: string;
  public port!: number;
  public username!: string;
  public secure!: boolean;
  public password!: string;
  public fromEmail!: string;
  public fromName!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailModuleConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    emailModuleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'emailModules',
        key: 'id',
      },
    },
    host: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    secure: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fromEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    fromName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'emailModuleConfigs',
    modelName: 'EmailModuleConfig',
    timestamps: true,
  }
);

export default EmailModuleConfig;
