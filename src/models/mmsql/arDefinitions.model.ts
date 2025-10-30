import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../db';

export class ARDefinitions extends Model {
  public myKey!: number;
  public AR_Type!: string;
  public AR_Ref?: string;
  public AR_SubType?: number;
  public AR_SubTypeRef?: string;
  public GL_AccountName?: string;
  public GL_IndividualEntry?: boolean;
  public PaymentMethod?: string;
  public CardType_ID?: number;
}

ARDefinitions.init({
  myKey: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  AR_Type: {
    type: DataTypes.STRING(1),
    allowNull: true,
  },
  AR_Ref: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  AR_SubType: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
  AR_SubTypeRef: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  GL_AccountName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  GL_IndividualEntry: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  PaymentMethod: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  CardType_ID: {
    type: DataTypes.TINYINT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'AR_Definitions',
  timestamps: false,
});
