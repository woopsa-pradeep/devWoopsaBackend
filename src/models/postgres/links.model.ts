import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

// Interface for attributes
interface LinkAttributes {
  id: number;
  name: string;
  logo: string;
  status: boolean;
  isActive: boolean;
  showInWeb:boolean;
  url: string;
}

// Optional for creation
type LinkCreationAttributes = Optional<LinkAttributes, 'id'>;

// Define the model
export class Link
  extends Model<LinkAttributes, LinkCreationAttributes>
  implements LinkAttributes
{
  public id!: number;
  public name!: string;
  public logo!: string;
  public showInWeb!: boolean;
  public status!: boolean;
  public isActive!: boolean;
  public url!: string;
}

// Initialize
Link.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
 showInWeb:{
  type:DataTypes.BOOLEAN,
  allowNull:false,
  defaultValue:true
 },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'Links',
    modelName: 'Link',
    timestamps: true, 
  }
);
