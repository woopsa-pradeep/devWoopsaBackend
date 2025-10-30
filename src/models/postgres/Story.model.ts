import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IStory } from '../../interfaces/postgress/story.interface';

type StoryCreationAttributes = Optional<IStory, 'id' | 'caption' | 'isActive' | 'createdAt' | 'updatedAt'>;

export class Story extends Model<IStory, StoryCreationAttributes> implements IStory {
  public id!: number;
  public mediaUrl!: string;
  public mediaType!: 'image' | 'video';
  public caption?: string;
  public expiresAt!: Date;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Story.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
   
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
    },
    caption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'stories',
    modelName: 'Story',
    timestamps: true,
  }
);
