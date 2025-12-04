import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IInventoryLocation } from '../../interfaces/postgress/inventoryLocation.interface';

type InventoryLocationCreationAttributes = Optional<IInventoryLocation,  'Status' | 'isActive'>;

export class InventoryLocation extends Model<IInventoryLocation, InventoryLocationCreationAttributes> implements IInventoryLocation {
	public id!: number;
	public C_Number!: number;
	public Item_Number!: number;
	public Location!: string;
	public Section!: string;
	public Status!: boolean;
	public isActive!: boolean;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

InventoryLocation.init(
	{
		C_Number: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		Item_Number: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		Location: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		Section: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		Status: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	},
	{
		sequelize: postgresSequelize,
		tableName: 'inventory_locations',
		modelName: 'InventoryLocation',
		timestamps: true,
	}
);

export default InventoryLocation;
