import { DataTypes, Model, Optional, CreationOptional } from "sequelize";
import { postgresSequelize } from "../../db";

export interface ReceivableUserAttributes {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    userNumber: string | null;
    item_sort_by: string | null; // 'sales_location' | 'section_location' | 'sales_section_location' | 'alphabetically' | 'item_number' | 'short_number' | 'line_number'
    createdAt?: Date;
    isActive: boolean;
    updatedAt?: Date;
}

interface ReceivableUserCreationAttributes
    extends Optional<ReceivableUserAttributes, "id" | "createdAt" | "updatedAt"> { }

export class ReceivableUser
    extends Model<ReceivableUserAttributes, ReceivableUserCreationAttributes>
    implements ReceivableUserAttributes {
    public id!: number;
    public email!: string;
    public firstName!: string;
    public lastName!: string;
    public password!: string;
    public userNumber!: string | null;
    public item_sort_by!: string | null;
    public isActive!: boolean;
    public readonly createdAt!: CreationOptional<Date>;
    public readonly updatedAt!: CreationOptional<Date>;
}

ReceivableUser.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        item_sort_by: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'line_number',
            validate: {
                isIn: [['sales_location', 'section_location', 'sales_section_location', 'alphabetically', 'item_number', 'short_number', 'line_number']],
            },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        modelName: "ReceivableUser",
        tableName: "receivable_user",
        timestamps: true,
    }
);
