import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db';

export class CustomerBalanceSetting extends Model {
  public id!: number;
  public emailTime!: string;
  public days!: string[];
  public sendMail!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerBalanceSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    emailTime: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '01:00', // 1:00 AM default
    },
    days: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['saturday'],
    },
    sendMail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'customerBalanceSettings',
    modelName: 'CustomerBalanceSetting',
    timestamps: true,
  }
);

