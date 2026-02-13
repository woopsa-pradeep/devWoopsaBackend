import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

export interface ITradeShowOrderHistory {
  id: number;
  tradeShowId: number;
  orderNumber: number;
  orderDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type TradeShowOrderHistoryCreationAttributes = Optional<
  ITradeShowOrderHistory,
  'id' | 'createdAt' | 'updatedAt'
>;

export class TradeShowOrderHistory
  extends Model<ITradeShowOrderHistory, TradeShowOrderHistoryCreationAttributes>
  implements ITradeShowOrderHistory
{
  public id!: number;
  public tradeShowId!: number;
  public orderNumber!: number;
  public orderDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TradeShowOrderHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tradeShowId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tradeShowId',
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'orderNumber',
    },
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'orderDate',
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'tradeShowOrderHistories',
    modelName: 'TradeShowOrderHistory',
    timestamps: true,
  }
);

export default TradeShowOrderHistory;
