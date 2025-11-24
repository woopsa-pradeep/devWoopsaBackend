// models/EmailMarketing.ts
import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class EmailMarketing extends Model {
  public id!: number;
  public userId!: number; // who triggered or owns the campaign
  public to!: string[]; // recipient list
  public cc?: string[];
  public subject!: string;
  public status!: string;
  public body!: string;
  public attachments?: string[]; // array of URLs or file paths
}

EmailMarketing.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    to: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    cc: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('draft', 'queued', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'sent',
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    failed_emails: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Stores URLs or file paths of attachments',
    },
  },
  {
        sequelize: postgresSequelize,
    tableName: 'email_marketing',
    timestamps: true,
  }
);
