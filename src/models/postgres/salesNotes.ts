import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
export interface ISalesNote {
  id: number;
    salesId: number;
    CustomerNumber: number;
    isActive: boolean;
    note?: string | null;
  
    createdAt: Date;
    updatedAt: Date;
  }
  
type SalesNoteCreationAttributes = Optional<
  ISalesNote,
  'salesId' | 'isActive' | 'note' | 'createdAt' | 'updatedAt'
>;

export class SalesNote
  extends Model<ISalesNote, SalesNoteCreationAttributes>
  implements ISalesNote
{
  public id!: number;
  public salesId!: number;
  public CustomerNumber!: number;
  public isActive!: boolean;
  public note?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SalesNote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    salesId: {
      type: DataTypes.INTEGER,       // use BIGINT if you expect very large IDs
      allowNull: false,
      },
    CustomerNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    note: {
      type: DataTypes.TEXT,          // TEXT to allow long notes; use STRING if you prefer length limits
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'sales_notes',
    modelName: 'SalesNote',
    timestamps: true,
  }
);

export default SalesNote;
