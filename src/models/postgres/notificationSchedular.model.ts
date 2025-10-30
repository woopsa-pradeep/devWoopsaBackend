// models/NotificationScheduler.ts
import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class NotificationScheduler extends Model {
  public id!: number;
  public userId!: number[]; // PostgreSQL array of integers
  public title!: string;
  public description!: string;
  public date!: string; // DATEONLY
  public time!: string; // TIME
  public isActive!: boolean;
  public isExpire!: boolean;
  public stopNumber!: number | null;
  public routeNumber!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

NotificationScheduler.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    stopNumber: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
    },
    routeNumber: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
    },
    
    isExpire: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'notification_schedulers',
    timestamps: true,
  }
);
