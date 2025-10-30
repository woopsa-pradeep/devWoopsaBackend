import { Model, DataTypes } from 'sequelize';
import { postgresSequelize } from '../../db'; // Adjust the import path as needed

export class ForgotPasswordToken extends Model {
  public id!: number;
  public token!: string;
  public Customer_Number!: number;
  public WebUser_Id?: number; 
  public expires_at!: Date;
  public created_at!: Date;
}

ForgotPasswordToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Customer_Number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    WebUser_Id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'forgot_password_tokens',
    timestamps: false, 
    underscored: true, 
  }
);
