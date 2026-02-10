// models/emailModules.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface IEmailModule {
  id: number;
  name: string;
  isEmailSetup: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

type EmailModuleCreationAttributes = Optional<IEmailModule, 'id' | 'createdAt' | 'updatedAt'>;

export class EmailModule
  extends Model<IEmailModule, EmailModuleCreationAttributes>
  implements IEmailModule
{
  public id!: number;
  public name!: string;
  public isEmailSetup!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailModule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isEmailSetup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'emailModules',
    modelName: 'EmailModule',
    timestamps: true,
  }
);

export default EmailModule;
