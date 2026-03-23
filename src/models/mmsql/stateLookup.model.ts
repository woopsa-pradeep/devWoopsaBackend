import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../db';

export interface IStateLookup {
  State_Abbrev?: string;
  State_Description?: string;
  NoDelete?: boolean;
  ReportingEnabled?: boolean;
  Jurisdiction_State?: number;
}

type StateLookupCreationAttributes = Optional<IStateLookup, 'State_Abbrev'>;

export class StateLookup
  extends Model<IStateLookup, StateLookupCreationAttributes>
  implements IStateLookup
{
  public State_Abbrev!: string;
  public State_Description!: string;
  public NoDelete!: boolean;
  public ReportingEnabled!: boolean;
  public Jurisdiction_State!: number;
}

StateLookup.init(
  {
    State_Abbrev: {
      type: DataTypes.STRING,
      allowNull: true,
      primaryKey: true, // assuming this is unique identifier
    },
    State_Description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    NoDelete: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    ReportingEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    Jurisdiction_State: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'StateLookup',
    tableName: 'StateLookup',
    timestamps: false,
  }
);