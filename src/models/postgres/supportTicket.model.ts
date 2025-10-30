// src/models/SupportTicket.ts

import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export enum TicketStatus {
  Open = 'open',
  InProgress = 'inProgress',
  OnHold = 'onHold',
  Resolved = 'resolved',
  Archived = 'archived'
}

export class SupportTicket extends Model {
  public id!: number;
  public subject!: string;
  public description!: string;
  public attachment?: string | null;
  public contactNumber?: string | null;
  public C_Number!: number;
  public completeNote?: string | null;
  public status!: TicketStatus;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SupportTicket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactNumber:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING, 
      allowNull: false,
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    completeNote:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    C_Number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TicketStatus)),
      allowNull: false,
      defaultValue: TicketStatus.Open,
    },
  },
  {
    sequelize:postgresSequelize,
    tableName: 'Support_Tickets',
    timestamps: true, // createdAt and updatedAt
  }
);
