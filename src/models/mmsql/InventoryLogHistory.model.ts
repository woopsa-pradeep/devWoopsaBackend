import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../db';

export class InventoryLogHistory extends Model {
    public myKey!: number;
    public Item_Number!: string;
    public Description!: string | null;
    public BaseCost!: number | null;
    public NetCost!: number | null;
    public Invoice_Cost!: number | null;
    public AvgCost!: number | null;

    public Price1!: number | null;
    public Price2!: number | null;
    public Price3!: number | null;
    public Price4!: number | null;
    public Price5!: number | null;
    public Price6!: number | null;
    public Price7!: number | null;
    public Price10!: number | null;
    public Price11!: number | null;
    public Price12!: number | null;
    public Price13!: number | null;
    public Price14!: number | null;
    public Price15!: number | null;
    public Price16!: number | null;
    public Price17!: number | null;
    public Price18!: number | null;
    public Price19!: number | null;

    public Date_Created!: Date | null;
    public Date_LastChange!: Date | null;
}

InventoryLogHistory.init(
    {
        myKey: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },

        Item_Number: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        Description: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        BaseCost: {
            type: DataTypes.DECIMAL(18, 4),
            allowNull: true,
        },

        NetCost: {
            type: DataTypes.DECIMAL(18, 4),
            allowNull: true,
        },

        Invoice_Cost: {
            type: DataTypes.DECIMAL(18, 4),
            allowNull: true,
        },

        AvgCost: {
            type: DataTypes.DECIMAL(18, 4),
            allowNull: true,
        },

        Price1: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price2: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price3: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price4: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price5: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price6: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price7: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price10: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price11: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price12: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price13: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price14: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price15: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price16: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price17: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price18: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
        Price19: { type: DataTypes.DECIMAL(18, 4), allowNull: true },

        Date_Created: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        Date_LastChange: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'Inventory_LogHistory',
        timestamps: false,
    }
);
