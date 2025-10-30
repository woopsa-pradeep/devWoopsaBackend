// models/contactUs.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import { IContactUs } from '../../interfaces/postgress/contactUs.interface';
import { postgresSequelize } from '../../db';

interface ContactUsCreationAttributes extends Optional<IContactUs, 'id'> { }

export class ContactUs extends Model<IContactUs, ContactUsCreationAttributes> implements IContactUs {
    public id!: number;
    public PhoneNO!: string;
    public WhatupNo!: string;
    public EmailAdd!: string;
    public Fax!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ContactUs.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        PhoneNO: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        WhatupNo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        EmailAdd: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        Fax: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize: postgresSequelize,
        modelName: 'ContactUs',
        tableName: 'contact_us',
        timestamps: true,
    }
);
