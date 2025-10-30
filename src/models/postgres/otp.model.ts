// models/otp.model.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { IOtp } from '../../interfaces/postgress/otp.interface';
import { postgresSequelize } from '../../db';


// Optional fields on creation
type OtpCreationAttributes = Optional<IOtp, 'id' | 'customerId' | 'adminId' | 'role'>;

export class Otp extends Model<IOtp, OtpCreationAttributes> implements IOtp {
  public id!: number;
  public email!: string;
  public otp!: string;
  public expiresAt!: Date;
  public customerId!: string | null;
  public adminId!: string | null;
  public role!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Otp.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'otps',
    modelName: 'Otp',
    timestamps: true,
  }
);
