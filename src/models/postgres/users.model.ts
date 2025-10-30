// models/user.model.ts

import { DataTypes, Model, Optional } from 'sequelize';
import { UserAttributes } from '../../interfaces/users.interface';
import { postgresSequelize } from '../../db';

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> { }

export class WebUsers extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public email!: string;
    public firstName!: string;
    public lastName!: string;
    public status!: boolean; // ✅ Added status field
    public role!: string;
    public userNumber!: number;
    public salesRepNumber!: number;
    public password!: string;
    public isActive!: boolean;
    public setUserDiscountLimit!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


    WebUsers.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
               
            },
            status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,  // ✅ Added default value for status
            },
            firstName: {
                type: DataTypes.STRING,   // ✅ Fixed from DataTypes.NUMBER
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'user',
                validate: {
                        isIn: [['epick', 'sales', 'driver']], 
                },
            },

            userNumber: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            salesRepNumber: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            setUserDiscountLimit: {
                type: DataTypes.SMALLINT,
                allowNull: true,
                defaultValue: 0,
            },
        },
        {
            sequelize:postgresSequelize,
            modelName: 'Users',
            tableName: 'users',
            timestamps: true,
        }
    );

