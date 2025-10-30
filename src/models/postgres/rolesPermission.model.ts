import { DataTypes, Model, Sequelize, Optional } from 'sequelize';
import { RolePermissionAttributes } from '../../interfaces/postgress/rolePermission.interface';
import { postgresSequelize } from '../../db';

interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'id'> {}


export class RolePermission
  extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
  implements RolePermissionAttributes
{
  public id!: number;
  public userId!: number;
  public module!: string;
  public add!: boolean;
  public edit!: boolean;
  public view!: boolean;
  public status!: boolean;
  public path!: string | null; // Path can be null, so we use string | null
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}


  RolePermission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      module: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      path:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      add: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      edit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      view: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize:postgresSequelize,
      modelName: 'RolePermission',
      tableName: 'role_permissions',
      timestamps: true,
    }
  );
