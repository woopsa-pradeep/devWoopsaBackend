import { DataTypes, Model, Optional, CreationOptional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface ReceivablePickAttributes {
    id: number;
    poNumber: number;
    pickerId: number;
    customerNumber: number;
    status: string; // 'pending' | 'in_progress' | 'completed' | 'cancelled'
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ReceivablePickCreationAttributes
    extends Optional<ReceivablePickAttributes, "id" | "createdAt" | "updatedAt"> { }

export class ReceivablePick
    extends Model<ReceivablePickAttributes, ReceivablePickCreationAttributes>
    implements ReceivablePickAttributes {
    public id!: number;
    public poNumber!: number;
    public pickerId!: number;
    public customerNumber!: number;
    public status!: string;
    public startedAt!: Date | null;
    public completedAt!: Date | null;
    public readonly createdAt!: CreationOptional<Date>;
    public readonly updatedAt!: CreationOptional<Date>;
}

ReceivablePick.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        poNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        pickerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        customerNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        completedAt: {
            type: DataTypes.DATE,
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
        modelName: "ReceivablePick",
        tableName: "receivable_pick",
        timestamps: true,
    }
);
