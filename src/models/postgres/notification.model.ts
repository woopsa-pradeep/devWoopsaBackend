// models/Notification.ts
import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class Notifications extends Model {
  public id!: number;
  public userNumber!: string;
  public title!: string;
  public description!: string;
  public isRead!: boolean;
  public isActive!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Notifications.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'notifications',
    timestamps: true,
  }
);
