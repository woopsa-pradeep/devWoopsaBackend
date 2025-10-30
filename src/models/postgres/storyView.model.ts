import { Model, DataTypes, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';
import { IStoryView } from '../../interfaces/postgress/storyView.interface';

type StoryViewCreationAttributes = Optional<IStoryView, 'id' | 'viewedAt'>;

export class StoryView extends Model<IStoryView, StoryViewCreationAttributes> implements IStoryView {
  public id!: number;
  public storyId!: number;
  public viewerId!: number;
  public viewedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StoryView.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    storyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    viewerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
     
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'story_views',
    modelName: 'StoryView',
    timestamps: true,
  }
);
