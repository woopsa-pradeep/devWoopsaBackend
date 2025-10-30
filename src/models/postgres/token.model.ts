// models/token.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { IToken } from '../../interfaces/postgress/token.interface';
import { postgresSequelize } from '../../db';


type TokenCreationAttributes = Optional<IToken, 'id' | 'isActive'>;

export class Token extends Model<IToken, TokenCreationAttributes> implements IToken {
  public id!: number;
  public token!: string;
  public isActive!: boolean;
  public deviceId!: number;
  public retailerId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    deviceId:{
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'device_ids',
        key: 'id',
      },
    },
    retailerId:{
      type: DataTypes.INTEGER,
      allowNull: true,
    
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'tokens',
    modelName: 'Token',
    timestamps: true,
  }
);
