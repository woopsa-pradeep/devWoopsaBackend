import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../db";
import { ISalesRep } from "../../interfaces/salesRepId.interface";

export class SalesRep extends Model<ISalesRep> implements ISalesRep {
  public S_Number!: number;
  public S_Desc!: string | null;
  public Commission_Rate01!: number | null;
  public Commission_Rate02!: number | null;
  public Commission_Rate03!: number | null;
  public Commission_Rate04!: number | null;
  public Commission_Rate05!: number | null;
  public Commission_Rate06!: number | null;
  public Commission_Rate07!: number | null;
  public Commission_Rate08!: number | null;
  public Commission_Rate09!: number | null;
  public Commission_Rate10!: number | null;
  public Commission_Rate11!: number | null;
  public Commission_Rate12!: number | null;
  public Commission_Type01!: string | null;
  public Commission_Type02!: string | null;
  public Commission_Type03!: string | null;
  public Commission_Type04!: string | null;
  public Commission_Type05!: string | null;
  public Commission_Type06!: string | null;
  public Commission_Type07!: string | null;
  public Commission_Type08!: string | null;
  public Commission_Type09!: string | null;
  public Commission_Type10!: string | null;
  public Commission_Type11!: string | null;
  public Commission_Type12!: string | null;
}

SalesRep.init(
  {
    S_Number: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false
    },
    S_Desc: { type: DataTypes.STRING, allowNull: true },
    Commission_Rate01: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate02: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate03: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate04: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate05: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate06: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate07: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate08: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate09: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate10: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate11: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Rate12: { type: DataTypes.DECIMAL, allowNull: true },
    Commission_Type01: { type: DataTypes.STRING, allowNull: true },
    Commission_Type02: { type: DataTypes.STRING, allowNull: true },
    Commission_Type03: { type: DataTypes.STRING, allowNull: true },
    Commission_Type04: { type: DataTypes.STRING, allowNull: true },
    Commission_Type05: { type: DataTypes.STRING, allowNull: true },
    Commission_Type06: { type: DataTypes.STRING, allowNull: true },
    Commission_Type07: { type: DataTypes.STRING, allowNull: true },
    Commission_Type08: { type: DataTypes.STRING, allowNull: true },
    Commission_Type09: { type: DataTypes.STRING, allowNull: true },
    Commission_Type10: { type: DataTypes.STRING, allowNull: true },
    Commission_Type11: { type: DataTypes.STRING, allowNull: true },
    Commission_Type12: { type: DataTypes.STRING, allowNull: true }
  },
  {
    sequelize,
    tableName: 'SalesRep',
    timestamps: false
  }
);