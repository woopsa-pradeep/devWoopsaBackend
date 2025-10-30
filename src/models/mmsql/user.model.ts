// models/users.model.ts

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db'; // adjust the import path as needed

export interface IUsers {
  UserNumber: number;
  UserID: string;
  UserName: string;
  UserPassword: string;
  UserGroup: number;
  UserIsPicker: boolean;
  UserIsChecker: boolean;
  UserIsAdmin: boolean;
  UserIsEpickAdmin: boolean;
  UserIsActive: boolean;
}

type UserCreationAttributes = Optional<IUsers, 'UserNumber'>;

export class Users extends Model<IUsers, UserCreationAttributes> implements IUsers {
  public UserNumber!: number;
  public UserID!: string;
  public UserName!: string;
  public UserPassword!: string;
  public UserGroup!: number;
  public UserIsPicker!: boolean;
  public UserIsChecker!: boolean;
  public UserIsAdmin!: boolean;
  public UserIsEpickAdmin!: boolean;
  public UserIsActive!: boolean;
}

Users.init(
  {
    UserNumber: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    UserID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    UserName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    UserPassword: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    UserGroup: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    UserIsPicker: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    
    },
    UserIsChecker: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    
    },
    UserIsAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    
    },
    UserIsEpickAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
   
    },
    UserIsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    
    },
  },
  {
    sequelize: sequelize,
    modelName: 'Users',
    tableName: 'Users',
    timestamps: false,
  }
);
